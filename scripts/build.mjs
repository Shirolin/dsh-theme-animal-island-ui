import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import ts from 'typescript'
import { build } from 'esbuild'
import { transform } from 'lightningcss'

const configFile = ts.readConfigFile('tsconfig.types.json', ts.sys.readFile)
if (configFile.error) {
  console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
  process.exit(1)
}

const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd())
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length > 0) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => '\n',
  }))
  process.exit(1)
}

await rm('lib', { recursive: true, force: true })
await mkdir('lib/types', { recursive: true })
const emit = program.emit()
if (emit.emitSkipped) {
  console.error('TypeScript declaration emit was skipped')
  process.exit(1)
}

async function transpile(file) {
  const source = await readFile(file, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      isolatedModules: true,
      removeComments: false,
    },
    fileName: file,
  })
  return result.outputText.replace(/(["'])([^"']+)\.ts\1/g, '$1$2.js$1')
}

const [index, palette, tokens] = await Promise.all([
  transpile('src/index.ts'),
  transpile('src/palette.ts'),
  transpile('src/tokens.ts'),
])

await Promise.all([
  writeFile('lib/index.js', index),
  writeFile('lib/palette.js', palette),
  writeFile('lib/tokens.js', tokens),
])

const fontWeights = [400, 500, 600, 700, 800, 900]
const fontCss = await Promise.all(fontWeights.map(async (weight) => {
  const file = `node_modules/@fontsource/nunito/files/nunito-latin-${weight}-normal.woff2`
  const data = (await readFile(file)).toString('base64')
  return `@font-face{font-family:Nunito;font-style:normal;font-display:swap;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`
}))

const skinCss = await readFile('src/client/skin.css', 'utf8')
const waveSvg = await readFile('src/client/assets/sidebar-wave.svg', 'utf8')
const waveDataUri = `data:image/svg+xml,${encodeURIComponent(waveSvg)}`
const transformedCss = transform({
  filename: 'skin.css',
  code: Buffer.from(skinCss.replaceAll('__ANIMAL_ISLAND_WAVE__', waveDataUri)),
  minify: false,
  sourceMap: false,
})
const ownedSkinCss = [...fontCss, transformedCss.code.toString()].join('\n')

const result = await build({
  entryPoints: ['src/client-entry.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'silent',
  plugins: [{
    name: 'animal-island-owned-assets',
    setup(context) {
      context.onResolve({ filter: /^virtual:animal-island-skin-css$/ }, () => ({
        path: 'animal-island-skin-css',
        namespace: 'animal-island-skin',
      }))
      context.onLoad({ filter: /.*/, namespace: 'animal-island-skin' }, () => ({
        contents: `export const SKIN_CSS = ${JSON.stringify(ownedSkinCss)}`,
        loader: 'ts',
        resolveDir: process.cwd(),
      }))
    },
  }],
})

const clientModule = result.outputFiles.find((file) => file.path.endsWith('.js'))
if (!clientModule) throw new Error('esbuild did not emit the client module')

const clientBundle = `globalThis.__ModuleLoader__?.load({
  id: 'dsh-theme-animal-island-ui',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
${clientModule.text}
    return module.exports
  },
})
`
await writeFile('lib/client.js', clientBundle)

console.log('Built host/token modules, declarations, and the esbuild client skin bundle.')
