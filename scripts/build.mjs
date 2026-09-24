import { mkdir, readFile, writeFile } from 'node:fs/promises'
import ts from 'typescript'

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

await mkdir('lib/types', { recursive: true })
const emit = program.emit()
if (emit.emitSkipped) {
  console.error('TypeScript declaration emit was skipped')
  process.exit(1)
}

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  isolatedModules: true,
  removeComments: false,
}

async function transpile(file) {
  const source = await readFile(file, 'utf8')
  const result = ts.transpileModule(source, { compilerOptions, fileName: file })
  return result.outputText.replace(/(["'])([^"']+)\.ts\1/g, '$1$2.js$1')
}

const [index, palette, tokens, client] = await Promise.all([
  transpile('src/index.ts'),
  transpile('src/palette.ts'),
  transpile('src/tokens.ts'),
  transpile('src/client/index.ts'),
])

await writeFile('lib/index.js', index)
await writeFile('lib/palette.js', palette)
await writeFile('lib/tokens.js', tokens)

function assertLocalImports(file, source, allowed) {
  const parsedSource = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const imports = parsedSource.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => statement.moduleSpecifier.text)
  const unexpected = imports.filter((specifier) => !allowed.includes(specifier))
  if (unexpected.length > 0) {
    throw new Error(`${file} contains unsupported runtime imports: ${unexpected.join(', ')}`)
  }
}

assertLocalImports('src/palette.ts', palette, [])
assertLocalImports('src/tokens.ts', tokens, ['./palette.js'])
assertLocalImports('src/client/index.ts', client, ['../tokens.js'])

/**
 * The client half has no external runtime imports. Strip local module statements and
 * combine the local modules into the DSH Module Loader factory contract. DSH's
 * ThemeRuntime implementation is deliberately not embedded.
 */
function browserModule(source) {
  return source
    .replace(/^import\s+[^;]+;\s*$/gm, '')
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '')
    .replace(/^export\s+/gm, '')
}

const clientBody = [palette, tokens, client].map(browserModule).join('\n')
const clientBundle = `(() => {\n  globalThis.__ModuleLoader__?.load({\n    id: 'dsh-theme-animal-island-ui',\n    factory: () => {\n${clientBody}\n      return { inject, apply }\n    },\n  })\n})()\n`
await writeFile('lib/client.js', clientBundle)

console.log('Built lib/index.js, lib/palette.js, lib/tokens.js, lib/client.js and declarations.')
