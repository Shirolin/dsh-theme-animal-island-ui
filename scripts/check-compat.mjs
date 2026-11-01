import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { parseArgs } from 'node:util'
import ts from 'typescript'
import { readDshClientDeclarations, readDshPackageFile, resolveDshPackage } from './dsh-runtime.mjs'
import { PROVIDER_ORDER, PUBLIC_ARIA_ATTRIBUTES, PUBLIC_ARIA_ROLES, PUBLIC_DATA_HOOKS, PUBLIC_SERVICES, PUBLIC_SLOTS } from './seam-contract.mjs'

const { values } = parseArgs({
  options: {
    'dsh-package': { type: 'string' },
  },
})

const requestedPackage = values['dsh-package'] ?? process.env.DSH_THEME_PACKAGE

const fileCache = new Map()
async function readDshFile(probe) {
  const key = `${probe.package}:${probe.file}`
  if (!fileCache.has(key)) {
    fileCache.set(
      key,
      (async () => {
        try {
          return { text: await readDshPackageFile(probe.package, probe.file, requestedPackage) }
        } catch (error) {
          return { error: error instanceof Error ? error.message : String(error) }
        }
      })(),
    )
  }
  return fileCache.get(key)
}

const packageRoot = resolveDshPackage('@deepseek-ai/dsh-client-ui-theme', requestedPackage)
const packagePath = join(packageRoot, 'package.json')
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const { path: declarationPath, text: declarations } = await readDshClientDeclarations('@deepseek-ai/dsh-client-ui-theme', requestedPackage)
const declarationSource = ts.createSourceFile(declarationPath, declarations, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const themeRuntime = declarationSource.statements.find((statement) => ts.isClassDeclaration(statement) && statement.name?.text === 'ThemeRuntime')
const overrideTokens = themeRuntime?.members.find((member) => ts.isMethodDeclaration(member) && member.name.getText(declarationSource) === 'overrideTokens')
const overrideReturnType = overrideTokens?.type?.getText(declarationSource)

const projectPackage = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const dshClient = await readFile(join(packageRoot, 'lib/client.js'), 'utf8')
const pluginClient = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
const pluginTokensSource = await readFile(new URL('../lib/tokens.js', import.meta.url), 'utf8')
const skinCss = (await readFile(new URL('../src/client/skin.css', import.meta.url), 'utf8')).replaceAll(/\/\*[\s\S]*?\*\//g, '')

const tokenPattern = /--(?:dsw-[a-z0-9-]+|shiki-[a-z0-9-]+)/g
const dshTokens = new Set(dshClient.match(tokenPattern) ?? [])
const pluginTokens = new Set(pluginTokensSource.match(tokenPattern) ?? [])
const extensionOnly = [...pluginTokens].filter((token) => !dshTokens.has(token)).sort()

const sidebarRoot = resolveDshPackage('@deepseek-ai/dsh-client-ui-sidebar', requestedPackage)
const conversationRoot = resolveDshPackage('@deepseek-ai/dsh-client-ui-conversation', requestedPackage)
const sidebarPackage = JSON.parse(await readFile(join(sidebarRoot, 'package.json'), 'utf8'))
const conversationPackage = JSON.parse(await readFile(join(conversationRoot, 'package.json'), 'utf8'))

const serviceInjectPattern = new RegExp(`inject\\s*=\\s*\\[\\s*${PUBLIC_SERVICES.map((service) => `['"]${service}['"]`).join('\\s*,\\s*')}\\s*\\]`)

function hasSlot(source, slot) {
  if (slot.kind === null || slot.scope === null) return source.includes(slot.name)
  const escaped = slot.name.replaceAll('.', '\\.')
  return new RegExp(`['"]${escaped}['"]\\s*:\\s*\\{\\s*kind:\\s*['"]${slot.kind}['"];\\s*scope:\\s*['"]${slot.scope}['"]`).test(source)
}

async function probeDataHook(hook) {
  if (hook.probe === null) return { status: 'unprobeable', required: hook.required }
  const result = await readDshFile(hook.probe)
  if (result.error !== undefined) return { status: 'unavailable', required: hook.required, error: result.error }
  return {
    status: result.text.includes(hook.probe.marker) ? 'present' : 'missing',
    required: hook.required,
    source: `${hook.probe.package}/${hook.probe.file}`,
  }
}

async function probePublicSlot(slot) {
  if (slot.probe === null) return { status: 'unprobeable', required: slot.required }
  const result = await readDshFile(slot.probe)
  if (result.error !== undefined) return { status: 'unavailable', required: slot.required, error: result.error }
  return {
    status: hasSlot(result.text, slot) ? 'present' : 'missing',
    required: slot.required,
    source: `${slot.probe.package}/${slot.probe.file}`,
  }
}

async function probeAriaAttribute(attribute) {
  if (attribute.probe === null) return { status: 'unprobeable' }
  const result = await readDshFile(attribute.probe)
  if (result.error !== undefined) return { status: 'unavailable', error: result.error }
  return {
    status: result.text.includes(attribute.probe.marker) ? 'present' : 'missing',
    source: `${attribute.probe.package}/${attribute.probe.file}`,
  }
}

const dataHookCoverage = Object.fromEntries(await Promise.all(PUBLIC_DATA_HOOKS.map(async (hook) => [hook.attribute, await probeDataHook(hook)])))
const publicDataHooks = Object.fromEntries(PUBLIC_DATA_HOOKS.map((hook) => [hook.attribute, dataHookCoverage[hook.attribute].status === 'present']))
const requiredDataHooksPresent = PUBLIC_DATA_HOOKS.filter((hook) => hook.required).every((hook) => dataHookCoverage[hook.attribute].status === 'present')

const publicSlotCoverage = Object.fromEntries(await Promise.all(PUBLIC_SLOTS.map(async (slot) => [slot.name, await probePublicSlot(slot)])))
const publicSlots = Object.fromEntries(PUBLIC_SLOTS.map((slot) => [slot.key, publicSlotCoverage[slot.name].status === 'present']))
const requiredSlotsPresent = PUBLIC_SLOTS.filter((slot) => slot.required).every((slot) => publicSlotCoverage[slot.name].status === 'present')

const usedAriaRoles = [...new Set([...skinCss.matchAll(/role=["']([^"']+)["']/g)].map((match) => match[1]))].sort()
const usedAriaAttributes = [...new Set([...skinCss.matchAll(/\[(aria-[a-z-]+)(?:=[^\]]+)?\]/g)].map((match) => match[1]))].sort()
const declaredAriaRoles = PUBLIC_ARIA_ROLES.map(({ role }) => role).sort()
const declaredAriaAttributes = PUBLIC_ARIA_ATTRIBUTES.map(({ attribute }) => attribute).sort()
const undeclaredAriaRoles = usedAriaRoles.filter((role) => !declaredAriaRoles.includes(role))
const unusedAriaRoles = declaredAriaRoles.filter((role) => !usedAriaRoles.includes(role))
const undeclaredAriaAttributes = usedAriaAttributes.filter((attribute) => !declaredAriaAttributes.includes(attribute))
const unusedAriaAttributes = declaredAriaAttributes.filter((attribute) => !usedAriaAttributes.includes(attribute))
const ariaAttributeCoverage = Object.fromEntries(
  await Promise.all(PUBLIC_ARIA_ATTRIBUTES.map(async (attribute) => [attribute.attribute, await probeAriaAttribute(attribute)])),
)
const missingAriaAttributeProbes = Object.entries(ariaAttributeCoverage)
  .filter(([, coverage]) => coverage.status === 'missing')
  .map(([attribute]) => attribute)

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
    serviceInject: serviceInjectPattern.test(pluginClient),
    providerOrder: JSON.stringify(projectPackage.dsh.client.inject) === JSON.stringify(PROVIDER_ORDER),
    publicSlots,
    publicDataHooks,
    requiredDataHooksPresent,
    requiredSlotsPresent,
    dshUiVersions: [sidebarPackage.version, conversationPackage.version],
  },
  dataHookCoverage,
  publicSlotCoverage,
  ariaCoverage: {
    roles: {
      used: usedAriaRoles,
      declared: declaredAriaRoles,
      undeclared: undeclaredAriaRoles,
      unused: unusedAriaRoles,
    },
    attributes: {
      used: usedAriaAttributes,
      declared: declaredAriaAttributes,
      undeclared: undeclaredAriaAttributes,
      unused: unusedAriaAttributes,
      probes: ariaAttributeCoverage,
    },
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
  !report.requiredSeam.ThemeRuntime ||
  !report.requiredSeam.overrideTokens ||
  !report.requiredSeam.overrideTokensReturnsDisposer ||
  !report.requiredSeam.serviceInject ||
  !report.requiredSeam.providerOrder ||
  !report.requiredSeam.requiredSlotsPresent ||
  !report.requiredSeam.requiredDataHooksPresent ||
  !report.plugin.usesOverrideTokens ||
  !report.plugin.hasOwnedStyle ||
  report.plugin.hasDomFallback ||
  report.plugin.hasMutationObserver ||
  report.plugin.hasPrivateDshImport ||
  undeclaredAriaRoles.length > 0 ||
  unusedAriaRoles.length > 0 ||
  undeclaredAriaAttributes.length > 0 ||
  unusedAriaAttributes.length > 0 ||
  missingAriaAttributeProbes.length > 0 ||
  extensionOnly.length > 0
) {
  report.status = 'fail'
}

console.log(JSON.stringify(report, null, 2))
if (report.status !== 'pass') process.exitCode = 1
