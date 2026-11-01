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
 *   fixture.json  { title, pluginCss: ["@deepseek-ai/dsh-client-ui-…"], variants: [{ id, mode }],
 *                   assertions: [{ message, expression }] }
 *   body.html     full document, with the placeholders below
 *
 * Placeholders: {{DSH_CSS}} {{THEME_BASE_CSS}} {{PLUGIN_CSS}} {{SKIN_CSS}}
 *               {{TOKENS}} {{BODY_ATTRIBUTES}} {{BODY_STYLE}}
 *
 * Output: artifacts/smoke/<name>-<variant>-smoke.png (git-ignored).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'
import { isDshRuntime, readDshBundleCss, readDshFrontendCss, readDshThemeBaseCss } from './dsh-runtime.mjs'
import { buildOwnedSkinCss } from './owned-skin-css.mjs'
import { prepareDshRuntime } from './prepare-dsh-runtime.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}
const name = args[0]?.startsWith('--') !== false ? undefined : args[0]

if (name === undefined) {
  console.error('usage: node scripts/fixture.mjs <fixture-name> [--desktop | --asar <app.asar> | --dsh <app dir>] [--chrome <binary>] [--out <dir>]')
  process.exit(1)
}

const explicitDsh = flag('dsh')
const explicitAsar = flag('asar')
const useDesktop = args.includes('--desktop')
if (explicitDsh !== undefined && (useDesktop || explicitAsar !== undefined)) {
  console.error('choose one of --dsh, --asar or --desktop')
  process.exit(1)
}

const dsh =
  useDesktop || explicitAsar !== undefined
    ? prepareDshRuntime({ asarPath: explicitAsar })
    : resolve(explicitDsh ?? process.env.DSH_APP ?? join(homedir(), '.dsh', 'app'))
if (!isDshRuntime(dsh)) {
  console.error(`no DSH install at ${dsh}\n  pass --dsh <app dir> or set DSH_APP`)
  process.exit(1)
}

const fixtureDir = join(root, 'test', 'fixtures', name)
const config = JSON.parse(await readFile(join(fixtureDir, 'fixture.json'), 'utf8'))
const body = await readFile(join(fixtureDir, 'body.html'), 'utf8')
const assertions = config.assertions ?? []
if (!Array.isArray(assertions) || assertions.some((assertion) => typeof assertion?.message !== 'string' || typeof assertion?.expression !== 'string')) {
  throw new Error(`${name}: assertions must contain { message, expression } objects`)
}
const assertionScript =
  assertions.length === 0
    ? ''
    : `<script>
(() => {
  const results = ${JSON.stringify(assertions).replaceAll('</script>', '<\\/script>')}.map((assertion) => {
    try {
      const value = Function(\`return (\${assertion.expression})\`)()
      return { message: assertion.message, expression: assertion.expression, ok: value === true }
    } catch (error) {
      return {
        message: assertion.message,
        expression: assertion.expression,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
  const meta = document.createElement('meta')
  meta.name = 'dsh-fixture-result'
  meta.content = JSON.stringify(results)
  document.head.append(meta)
  document.documentElement.dataset.fixtureAssertions = results.every((result) => result.ok) ? 'pass' : 'fail'
})()
</script>`

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

const frontendCss = await readDshFrontendCss(dsh)
const themeBaseCss = await readDshThemeBaseCss(dsh)
const pluginCss = (await Promise.all((config.pluginCss ?? []).map((packageName) => readDshBundleCss(dsh, packageName)))).join('\n')

const tokensPath = join(root, 'lib', 'tokens.js')
if (!existsSync(tokensPath)) {
  console.error('lib/tokens.js is missing — run `pnpm run build` first')
  process.exit(1)
}
const { buildTokenOverrides } = await import(`${pathToFileURL(tokensPath).href}?t=${Date.now()}`)
const overrides = buildTokenOverrides()
const tokenVars = (mode) =>
  Object.entries(overrides)
    .map(([token, value]) => `${token}:${value[mode]}`)
    .join(';')
    .replaceAll('"', '&quot;')

const ownedSkinCss = await buildOwnedSkinCss()

const outDir = resolve(flag('out', join(root, 'artifacts', 'smoke')))
await mkdir(outDir, { recursive: true })
const workDir = join(root, '.cache', 'fixtures', name)
await mkdir(workDir, { recursive: true })

for (const variant of config.variants) {
  const profile = mkdtempSync(join(tmpdir(), 'dsh-theme-fixture-chrome-'))
  const mode = variant.mode ?? 'light'
  const page = body
    .replaceAll('<!--{{DSH_CSS}}-->', `<style>${frontendCss}</style>`)
    .replaceAll('<!--{{THEME_BASE_CSS}}-->', `<style>${themeBaseCss}</style>`)
    .replaceAll('<!--{{PLUGIN_CSS}}-->', `<style>${pluginCss}</style>`)
    .replaceAll('<!--{{SKIN_CSS}}-->', `<style>${ownedSkinCss}</style>`)
    .replaceAll('{{TOKENS}}', tokenVars(mode))
    .replaceAll('{{BODY_ATTRIBUTES}}', mode === 'dark' ? ' data-ds-dark-theme=""' : '')
    .replaceAll('{{BODY_STYLE}}', variant.bodyStyle ?? '')
    .replace('</body>', `${assertionScript}\n</body>`)

  const pagePath = join(workDir, `${variant.id}.html`)
  const shot = join(outDir, `${name}-${variant.id}-smoke.png`)
  await writeFile(pagePath, page)
  try {
    const chromeArgs = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      `--window-size=${variant.window ?? '900,600'}`,
      `--user-data-dir=${profile}`,
    ]
    const pageUrl = `file:///${pagePath.replaceAll('\\', '/')}`
    let results = []

    if (assertions.length > 0) {
      const dom = execFileSync(chrome, [...chromeArgs, '--virtual-time-budget=1000', '--dump-dom', pageUrl], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      })
      const meta = new JSDOM(dom).window.document.querySelector('meta[name="dsh-fixture-result"]')
      if (meta === null) throw new Error(`${name}/${variant.id}: assertion result is missing`)
      results = JSON.parse(meta.content)
    }

    execFileSync(chrome, [...chromeArgs, `--screenshot=${shot}`, pageUrl], { stdio: 'inherit' })

    const failures = results.filter((result) => !result.ok)
    console.log(
      `${basename(shot)} <- test/fixtures/${name}/${variant.id}` +
        (results.length === 0 ? '' : ` (${results.length - failures.length}/${results.length} assertions)`),
    )
    if (failures.length > 0) {
      for (const failure of failures) {
        console.error(`  FAIL ${failure.message}${failure.error === undefined ? '' : `: ${failure.error}`}`)
      }
      throw new Error(`${name}/${variant.id}: ${failures.length} fixture assertion(s) failed`)
    }
  } finally {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}
