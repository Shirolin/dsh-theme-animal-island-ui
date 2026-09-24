import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import ts from 'typescript'

const { values } = parseArgs({
  options: {
    'dsh-package': { type: 'string' },
  },
})

const require = createRequire(import.meta.url)
const requestedPackage = values['dsh-package'] ?? process.env.DSH_THEME_PACKAGE
let packageRoot
if (requestedPackage === undefined) {
  packageRoot = dirname(require.resolve('@deepseek-ai/dsh-client-ui-theme/package.json'))
} else {
  const requestedPath = isAbsolute(requestedPackage) ? requestedPackage : resolve(process.cwd(), requestedPackage)
  packageRoot = requestedPackage.endsWith('package.json') ? dirname(requestedPath) : requestedPath
}

const packagePath = join(packageRoot, 'package.json')
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const declarationPath = join(packageRoot, 'lib/types/client/index.d.ts')
const declarations = await readFile(declarationPath, 'utf8')
const declarationSource = ts.createSourceFile(declarationPath, declarations, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const themeRuntime = declarationSource.statements.find(
  (statement) => ts.isClassDeclaration(statement) && statement.name?.text === 'ThemeRuntime',
)
const overrideTokens = themeRuntime?.members.find(
  (member) => ts.isMethodDeclaration(member) && member.name.getText(declarationSource) === 'overrideTokens',
)
const overrideReturnType = overrideTokens?.type?.getText(declarationSource)

const dshClient = await readFile(join(packageRoot, 'lib/client.js'), 'utf8')
const pluginClient = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
const pluginTokensSource = await readFile(new URL('../lib/tokens.js', import.meta.url), 'utf8')

const tokenPattern = /--(?:dsw-[a-z0-9-]+|shiki-[a-z0-9-]+)/g
const dshTokens = new Set(dshClient.match(tokenPattern) ?? [])
const pluginTokens = new Set(pluginTokensSource.match(tokenPattern) ?? [])
const extensionOnly = [...pluginTokens].filter((token) => !dshTokens.has(token)).sort()

const report = {
  dshClientUiTheme: packageJson.version,
  package: basename(packageRoot),
  packageRoot,
  source: requestedPackage === undefined ? 'repository-devDependency' : 'requested-package',
  requiredSeam: {
    ThemeRuntime: themeRuntime !== undefined,
    overrideTokens: overrideTokens !== undefined,
    overrideTokensReturnsDisposer: overrideReturnType === '() => void',
    overrideTokensReturnType: overrideReturnType ?? null,
  },
  tokenCoverage: {
    used: pluginTokens.size,
    knownByCurrentDsh: pluginTokens.size - extensionOnly.length,
    extensionOnly,
  },
  plugin: {
    usesOverrideTokens: pluginClient.includes('overrideTokens'),
    hasDomFallback: /document\.|window\./.test(pluginClient),
    hasPrivateDshImport: /@deepseek-ai\/dsh-client-ui-theme\/lib\//.test(pluginClient),
  },
  status: 'pass',
}

if (
  !report.requiredSeam.ThemeRuntime
  || !report.requiredSeam.overrideTokens
  || !report.requiredSeam.overrideTokensReturnsDisposer
  || !report.plugin.usesOverrideTokens
  || report.plugin.hasDomFallback
  || report.plugin.hasPrivateDshImport
  || extensionOnly.length > 0
) {
  report.status = 'fail'
}

console.log(JSON.stringify(report, null, 2))
if (report.status !== 'pass') process.exitCode = 1
