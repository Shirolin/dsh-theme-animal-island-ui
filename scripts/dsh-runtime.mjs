import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const themePackage = '@deepseek-ai/dsh-client-ui-theme'
const cssModulePattern = /var \w+_css_default = "((?:[^"\\]|\\.)*)";/g
const allCssModulePattern = /(?:var \w+_css_default|const css(?:\$\d+)?) = "((?:[^"\\]|\\.)*)";/g

function extractCssModules(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1].replaceAll('\\"', '"').replaceAll('\\\\', '\\')).join('\n')
}

export const REQUIRED_RUNTIME_PATHS = [
  'node_modules/@deepseek-ai/dsh-web-frontend/dist/assets',
  'node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js',
  'node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js',
]

export function isDshRuntime(dsh) {
  return REQUIRED_RUNTIME_PATHS.every((path) => existsSync(join(dsh, path)))
}

export function resolveDshPackage(name, requestedPackage) {
  if (requestedPackage === undefined) return dirname(require.resolve(`${name}/package.json`))
  const requestedPath = isAbsolute(requestedPackage) ? requestedPackage : resolve(process.cwd(), requestedPackage)
  const baseRoot = requestedPackage.endsWith('package.json') ? dirname(requestedPath) : requestedPath
  return join(dirname(dirname(baseRoot)), name)
}

export async function readDshPackageFile(name, file, requestedPackage) {
  return readFile(join(resolveDshPackage(name, requestedPackage), file), 'utf8')
}

export async function readDshClientDeclarations(name, requestedPackage) {
  const packageRoot = resolveDshPackage(name, requestedPackage)
  const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
  const clientExport = packageJson.exports?.['./client']
  const declarationFile = typeof clientExport === 'object' ? clientExport?.types : undefined
  if (typeof declarationFile !== 'string') {
    throw new Error(`${name} does not publish a ./client type declaration`)
  }
  const path = join(packageRoot, declarationFile)
  return { path, text: await readFile(path, 'utf8') }
}

export async function readDshFrontendCss(dsh) {
  const assets = join(dsh, 'node_modules', '@deepseek-ai', 'dsh-web-frontend', 'dist', 'assets')
  const files = (await readdir(assets)).filter((file) => file.endsWith('.css')).sort()
  const styles = await Promise.all(files.map((file) => readFile(join(assets, file), 'utf8')))
  return styles.join('\n')
}

/** Inline CSS modules a client bundle injects as `const css = "…"` strings. */
export async function readDshBundleCss(dsh, packageName) {
  for (const candidate of [join(dsh, 'node_modules', packageName, 'lib', 'client.js'), join(dsh, 'node_modules', packageName, 'client', 'client.js')]) {
    if (!existsSync(candidate)) continue
    const text = await readFile(candidate, 'utf8')
    return extractCssModules(text, allCssModulePattern)
  }
  throw new Error(`plugin CSS not found: ${packageName}`)
}

export async function readDshThemeBaseCss(dsh) {
  const client = await readFile(join(dsh, 'node_modules', themePackage, 'lib', 'client.js'), 'utf8')
  return extractCssModules(client, cssModulePattern)
}
