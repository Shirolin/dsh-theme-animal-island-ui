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

function resolveDshPackage(name) {
  if (requestedPackage === undefined) return dirname(require.resolve(`${name}/package.json`))
  const requestedPath = isAbsolute(requestedPackage) ? requestedPackage : resolve(process.cwd(), requestedPackage)
  const baseRoot = requestedPackage.endsWith('package.json') ? dirname(requestedPath) : requestedPath
  return join(dirname(dirname(baseRoot)), name)
}

const packageRoot = resolveDshPackage('@deepseek-ai/dsh-client-ui-theme')
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

const projectPackage = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const dshClient = await readFile(join(packageRoot, 'lib/client.js'), 'utf8')
const pluginClient = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
const pluginTokensSource = await readFile(new URL('../lib/tokens.js', import.meta.url), 'utf8')

const tokenPattern = /--(?:dsw-[a-z0-9-]+|shiki-[a-z0-9-]+)/g
const dshTokens = new Set(dshClient.match(tokenPattern) ?? [])
const pluginTokens = new Set(pluginTokensSource.match(tokenPattern) ?? [])
const extensionOnly = [...pluginTokens].filter((token) => !dshTokens.has(token)).sort()

const sidebarRoot = resolveDshPackage('@deepseek-ai/dsh-client-ui-sidebar')
const conversationRoot = resolveDshPackage('@deepseek-ai/dsh-client-ui-conversation')
const sidebarSlots = await readFile(join(sidebarRoot, 'lib/types/client/contract/slots.d.ts'), 'utf8')
const conversationSlots = await readFile(join(conversationRoot, 'lib/types/client/contract/slots.d.ts'), 'utf8')
const conversationClient = await readFile(join(conversationRoot, 'lib/client.js'), 'utf8')
const sidebarPackage = JSON.parse(await readFile(join(sidebarRoot, 'package.json'), 'utf8'))
const conversationPackage = JSON.parse(await readFile(join(conversationRoot, 'package.json'), 'utf8'))

function hasSlot(source, name, kind, scope) {
  const escaped = name.replaceAll('.', '\\.')
  return new RegExp(`['"]${escaped}['"]\\s*:\\s*\\{\\s*kind:\\s*['"]${kind}['"];\\s*scope:\\s*['"]${scope}['"]`).test(source)
}

const publicSlots = {
  sidebarBrandMark: hasSlot(sidebarSlots, 'sidebar.brand.mark', 'single', 'root'),
  sidebarBrandName: hasSlot(sidebarSlots, 'sidebar.brand.name', 'single', 'root'),
  heroBrandMark: hasSlot(conversationSlots, 'conversation.hero.brand.mark', 'single', 'root'),
}

const publicDataHooks = {
  darkTheme: dshClient.includes('data-ds-dark-theme'),
  composerCard: conversationClient.includes('data-composer-card'),
  conversationHeaderCorner: conversationClient.includes('data-conversation-header-corner'),
}

const expectedProviders = [
  '@deepseek-ai/dsh-client-ui-theme',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-ui-sidebar',
  '@deepseek-ai/dsh-client-ui-conversation',
]

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
    serviceInject: /inject\s*=\s*\[\s*['"]theme['"]\s*,\s*['"]slots['"]\s*\]/.test(pluginClient),
    providerOrder: JSON.stringify(projectPackage.dsh.client.inject) === JSON.stringify(expectedProviders),
    publicSlots,
    publicDataHooks,
    dshUiVersions: [sidebarPackage.version, conversationPackage.version],
  },
  tokenCoverage: {
    used: pluginTokens.size,
    knownByCurrentDsh: pluginTokens.size - extensionOnly.length,
    extensionOnly,
  },
  plugin: {
    usesOverrideTokens: pluginClient.includes('overrideTokens'),
    hasOwnedStyle: pluginClient.includes('data-dsh-animal-island-skin') && pluginClient.includes('data-plugin-css'),
    hasDomFallback: /document\.(?:body|querySelector|closest)|window\./.test(pluginClient),
    hasMutationObserver: /MutationObserver|ResizeObserver/.test(pluginClient),
    hasPrivateDshImport: /@deepseek-ai\/dsh-[^/]+\/lib\//.test(pluginClient),
  },
  status: 'pass',
}

if (
  !report.requiredSeam.ThemeRuntime
  || !report.requiredSeam.overrideTokens
  || !report.requiredSeam.overrideTokensReturnsDisposer
  || !report.requiredSeam.serviceInject
  || !report.requiredSeam.providerOrder
  || !Object.values(publicSlots).every(Boolean)
  || !Object.values(publicDataHooks).every(Boolean)
  || !report.plugin.usesOverrideTokens
  || !report.plugin.hasOwnedStyle
  || report.plugin.hasDomFallback
  || report.plugin.hasMutationObserver
  || report.plugin.hasPrivateDshImport
  || extensionOnly.length > 0
) {
  report.status = 'fail'
}

console.log(JSON.stringify(report, null, 2))
if (report.status !== 'pass') process.exitCode = 1
