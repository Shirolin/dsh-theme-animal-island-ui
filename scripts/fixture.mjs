#!/usr/bin/env node
/*
 * Offline skin fixture runner.
 *
 * Most regressions in this project are "a rule reached a surface it should not
 * have", which is hard to judge from source alone. A fixture rebuilds the real
 * DOM shape with the *real* CSS taken from an installed DSH (frontend bundle,
 * theme base layer, and any plugin CSS modules), applies the skin from
 * `src/client/skin.css`, and renders it with headless Chrome.
 *
 *   node scripts/fixture.mjs document-preview-plain
 *   node scripts/fixture.mjs document-preview-plain --dsh "C:\Users\me\.dsh\app"
 *
 * Fixtures live in test/fixtures/<name>/:
 *   fixture.json  { title, pluginCss: ["@deepseek-ai/dsh-client-ui-…"], variants: [{ id, mode }] }
 *   body.html     full document, with the placeholders below
 *
 * Placeholders: {{DSH_CSS}} {{THEME_BASE_CSS}} {{PLUGIN_CSS}} {{SKIN_CSS}}
 *               {{TOKENS}} {{BODY_ATTRIBUTES}} {{BODY_STYLE}}
 *
 * Output: artifacts/smoke/<name>-<variant>-smoke.png (git-ignored).
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}
const name = args[0]?.startsWith('--') !== false ? undefined : args[0]

if (name === undefined) {
  console.error('usage: node scripts/fixture.mjs <fixture-name> [--dsh <app dir>] [--chrome <binary>] [--out <dir>]')
  process.exit(1)
}

const dsh = resolve(flag('dsh', process.env.DSH_APP ?? join(homedir(), '.dsh', 'app')))
if (!existsSync(join(dsh, 'node_modules', '@deepseek-ai', 'dsh-web-frontend'))) {
  console.error(`no DSH install at ${dsh}\n  pass --dsh <app dir> or set DSH_APP`)
  process.exit(1)
}

const fixtureDir = join(root, 'test', 'fixtures', name)
const config = JSON.parse(await readFile(join(fixtureDir, 'fixture.json'), 'utf8'))
const body = await readFile(join(fixtureDir, 'body.html'), 'utf8')

const chromeCandidates = [
  flag('chrome', process.env.CHROME_PATH),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const chrome = chromeCandidates.find((candidate) => existsSync(candidate))
if (chrome === undefined) {
  console.error('no Chrome found; pass --chrome <binary> or set CHROME_PATH')
  process.exit(1)
}

/** Real frontend stylesheets the app ships. */
async function readDshCss() {
  const assets = join(dsh, 'node_modules', '@deepseek-ai', 'dsh-web-frontend', 'dist', 'assets')
  const files = (await readdir(assets)).filter((file) => file.endsWith('.css'))
  return Promise.all(files.map((file) => readFile(join(assets, file), 'utf8')))
}

/** Inline CSS modules a client bundle injects as `const css = "…"` strings. */
async function readBundleCss(packageName) {
  for (const candidate of [
    join(dsh, 'node_modules', packageName, 'lib', 'client.js'),
    join(dsh, 'node_modules', packageName, 'client', 'client.js'),
  ]) {
    if (!existsSync(candidate)) continue
    const text = await readFile(candidate, 'utf8')
    const blocks = [...text.matchAll(/var \w+_css_default = "((?:[^"\\]|\\.)*)";/g), ...text.matchAll(/const css(?:\$\d+)? = "((?:[^"\\]|\\.)*)";/g)]
    return blocks.map((match) => match[1].replaceAll('\\"', '"').replaceAll('\\\\', '\\')).join('\n')
  }
  throw new Error(`plugin CSS not found: ${packageName}`)
}

const frontendCss = (await readDshCss()).join('\n')
const themeBaseCss = [...(await readFile(join(dsh, 'node_modules', '@deepseek-ai', 'dsh-client-ui-theme', 'lib', 'client.js'), 'utf8'))
  .matchAll(/var \w+_css_default = "((?:[^"\\]|\\.)*)";/g)]
  .map((match) => match[1].replaceAll('\\"', '"'))
  .join('\n')
  .replaceAll('\\\\', '\\')
const pluginCss = (await Promise.all((config.pluginCss ?? []).map(readBundleCss))).join('\n')

const tokensPath = join(root, 'lib', 'tokens.js')
if (!existsSync(tokensPath)) {
  console.error('lib/tokens.js is missing — run `pnpm run build` first')
  process.exit(1)
}
const { buildTokenOverrides } = await import(`${pathToFileURL(tokensPath).href}?t=${Date.now()}`)
const overrides = buildTokenOverrides()
const tokenVars = (mode) => Object.entries(overrides).map(([token, value]) => `${token}:${value[mode]}`).join(';').replaceAll('"', '&quot;')

const { transform } = await import('lightningcss')
const asset = async (file) => `data:image/svg+xml,${encodeURIComponent(await readFile(join(root, 'src', 'client', 'assets', file), 'utf8'))}`
const [wave, horizon, leaves, nightHorizon, nightLeaves, grain, leaf] = await Promise.all([
  asset('sidebar-wave.svg'),
  asset('island-horizon.svg'),
  asset('floating-leaves.svg'),
  asset('night-horizon.svg'),
  asset('night-leaves.svg'),
  asset('paper-grain.svg'),
  asset('leaf-watermark.svg'),
])
const skin = transform({
  filename: 'skin.css',
  code: Buffer.from((await readFile(join(root, 'src', 'client', 'skin.css'), 'utf8'))
    .replaceAll('__ANIMAL_ISLAND_WAVE__', wave)
    .replaceAll('__ANIMAL_ISLAND_HORIZON__', horizon)
    .replaceAll('__ANIMAL_ISLAND_LEAVES__', leaves)
    .replaceAll('__ANIMAL_ISLAND_NIGHT_HORIZON__', nightHorizon)
    .replaceAll('__ANIMAL_ISLAND_NIGHT_LEAVES__', nightLeaves)
    .replaceAll('__ANIMAL_ISLAND_GRAIN__', grain)
    .replaceAll('__ANIMAL_ISLAND_LEAF__', leaf)),
  minify: false,
  sourceMap: false,
}).code

/*
 * The plugin installs Nunito inline, ahead of the skin. A fixture that skips it
 * measures text in a fallback face, so every width-, wrap- and clip-sensitive
 * regression reads "fine" while the real app truncates. Take the faces from the
 * built bundle so the fixture sees the same metrics the browser does.
 */
const fontCss = [...(await readFile(join(root, 'lib', 'client.js'), 'utf8'))
  .matchAll(/@font-face\{[^}]*\}/g)]
  .map((match) => match[0])
  .join('\n')

const outDir = resolve(flag('out', join(root, 'artifacts', 'smoke')))
await mkdir(outDir, { recursive: true })
const workDir = join(root, '.cache', 'fixtures', name)
await mkdir(workDir, { recursive: true })
const profile = join(tmpdir(), 'dsh-theme-fixture-chrome')

for (const variant of config.variants) {
  const mode = variant.mode ?? 'light'
  const page = body
    .replaceAll('<!--{{DSH_CSS}}-->', `<style>${frontendCss}</style>`)
    .replaceAll('<!--{{THEME_BASE_CSS}}-->', `<style>${themeBaseCss}</style>`)
    .replaceAll('<!--{{PLUGIN_CSS}}-->', `<style>${pluginCss}</style>`)
    .replaceAll('<!--{{SKIN_CSS}}-->', `<style>${fontCss}\n${skin}</style>`)
    .replaceAll('{{TOKENS}}', tokenVars(mode))
    .replaceAll('{{BODY_ATTRIBUTES}}', mode === 'dark' ? ' data-ds-dark-theme=""' : '')
    .replaceAll('{{BODY_STYLE}}', variant.bodyStyle ?? '')

  const pagePath = join(workDir, `${variant.id}.html`)
  const shot = join(outDir, `${name}-${variant.id}-smoke.png`)
  await writeFile(pagePath, page)
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    `--window-size=${variant.window ?? '900,600'}`,
    `--user-data-dir=${profile}`,
    `--screenshot=${shot}`,
    `file:///${pagePath.replaceAll('\\', '/')}`,
  ], { stdio: 'inherit' })
  console.log(`${basename(shot)} <- test/fixtures/${name}/${variant.id}`)
}
