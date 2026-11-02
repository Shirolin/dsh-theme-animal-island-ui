import { mkdir, rm, writeFile } from 'node:fs/promises'
import ts from 'typescript'
import { build } from 'esbuild'
import { buildOwnedSkinCss } from './owned-skin-css.mjs'

const configFile = ts.readConfigFile('tsconfig.types.json', ts.sys.readFile)
if (configFile.error) {
  console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
  process.exit(1)
}

const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd())
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length > 0) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => '\n',
    }),
  )
  process.exit(1)
}

await rm('lib', { recursive: true, force: true })
await mkdir('lib/types', { recursive: true })
const emit = program.emit()
if (emit.emitSkipped) {
  console.error('TypeScript declaration emit was skipped')
  process.exit(1)
}

await build({
  entryPoints: {
    index: 'src/index.ts',
    palette: 'src/palette.ts',
    tokens: 'src/tokens.ts',
  },
  outdir: 'lib',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'silent',
})

const ownedSkinCss = await buildOwnedSkinCss()

const result = await build({
  entryPoints: ['src/client/index.ts'],
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
  plugins: [
    {
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
    },
  ],
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

console.log('Built declarations, esbuild host modules, and the esbuild client skin bundle.')
