#!/usr/bin/env node
/*
 * Build static showcase documents from `test/fixtures/*` and a real DSH runtime.
 *
 * Output lives in `site/showcase/generated/` so GitHub Pages can deploy the
 * showcase without installing private DSH packages during CI.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readDshBundleCss, readDshFrontendCss, readDshRuntimeVersion, readDshThemeBaseCss } from './dsh-runtime.mjs'
import { formatTokenVars, renderFixturePage, resolveDshRuntime } from './fixture-page.mjs'
import { buildOwnedSkinCss } from './owned-skin-css.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const dsh = resolveDshRuntime(args)
const dshVersion = (await readDshRuntimeVersion(dsh)) ?? 'unknown'

const tokensPath = join(root, 'lib', 'tokens.js')
if (!existsSync(tokensPath)) {
  console.error('lib/tokens.js is missing — run `pnpm run build` first')
  process.exit(1)
}
const { buildTokenOverrides } = await import(`${pathToFileURL(tokensPath).href}?t=${Date.now()}`)
const overrides = buildTokenOverrides()

const GROUP_ORDER = ['工作区与会话', '代码与交付', '浮层与反馈', '设置与外观', '启动页', '其他']

const APPEARANCE_BRIDGE_SCRIPT = `<script>
(() => {
  const doc = document.documentElement;
  const body = document.body;
  const initial = {
    decor: doc.getAttribute('data-animal-decor'),
    grain: doc.getAttribute('data-animal-grain'),
    diffSyntax: doc.getAttribute('data-animal-diff-syntax'),
    font: doc.getAttribute('data-animal-font'),
    veil: body.style.getPropertyValue('--animal-canvas-veil'),
    fontFamily: body.style.getPropertyValue('--dsw-font-family'),
  };
  const restoreAttr = (name, value) => {
    if (value === null) doc.removeAttribute(name);
    else doc.setAttribute(name, value);
  };
  const restoreProp = (name, value) => {
    if (value) body.style.setProperty(name, value);
    else body.style.removeProperty(name);
  };
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.type !== 'animal-island:appearance') return;
    if (data.reset) {
      restoreAttr('data-animal-decor', initial.decor);
      restoreAttr('data-animal-grain', initial.grain);
      restoreAttr('data-animal-diff-syntax', initial.diffSyntax);
      restoreAttr('data-animal-font', initial.font);
      restoreProp('--animal-canvas-veil', initial.veil);
      restoreProp('--dsw-font-family', initial.fontFamily);
      return;
    }
    const patch = data.patch || {};
    if (patch.decor !== undefined) doc.setAttribute('data-animal-decor', patch.decor);
    if (patch.grain !== undefined) doc.setAttribute('data-animal-grain', patch.grain);
    if (patch.diffSyntax !== undefined) doc.setAttribute('data-animal-diff-syntax', patch.diffSyntax);
    if (patch.font !== undefined) {
      doc.setAttribute('data-animal-font', patch.font);
      if (patch.font === 'system') {
        body.style.setProperty('--dsw-font-family', 'var(--animal-system-font-family, sans-serif)');
      } else {
        restoreProp('--dsw-font-family', initial.fontFamily);
      }
    }
    if (patch.veil !== undefined) {
      body.style.setProperty('--animal-canvas-veil', String(patch.veil));
    }
  });
})();
</script>`

const fixturesDir = join(root, 'test', 'fixtures')
const fixtureNames = (await readdir(fixturesDir)).filter((name) => existsSync(join(fixturesDir, name, 'fixture.json'))).sort()

const usedPluginPackages = new Set()
const fixtureConfigs = []
for (const name of fixtureNames) {
  const dir = join(fixturesDir, name)
  const config = JSON.parse(await readFile(join(dir, 'fixture.json'), 'utf8'))
  const body = await readFile(join(dir, 'body.html'), 'utf8')
  for (const pkg of config.pluginCss ?? []) usedPluginPackages.add(pkg)
  fixtureConfigs.push({ name, config, body })
}

const outRoot = join(root, 'site', 'showcase', 'generated')
const cssDir = join(outRoot, 'css')
const pluginsDir = join(cssDir, 'plugins')
await rm(outRoot, { recursive: true, force: true })
await mkdir(pluginsDir, { recursive: true })

const mitBanner = (source) => `/* Derived from ${source} (MIT License, DSH ${dshVersion}). */\n`
const shortPkgName = (pkg) => pkg.replace(/^@deepseek-ai\/dsh-client-ui-/, '').replaceAll('/', '-')

const [frontendCss, themeBaseCss, ownedSkinCss] = await Promise.all([readDshFrontendCss(dsh), readDshThemeBaseCss(dsh), buildOwnedSkinCss()])

await Promise.all([
  writeFile(join(cssDir, 'dsh.css'), `${mitBanner('@deepseek-ai/dsh-web-frontend')}${frontendCss}`),
  writeFile(join(cssDir, 'theme-base.css'), `${mitBanner('@deepseek-ai/dsh-client-ui-theme')}${themeBaseCss}`),
  writeFile(join(cssDir, 'skin.css'), `/* Animal Island UI skin CSS + embedded Nunito WOFF2 (SIL OFL 1.1). */\n${ownedSkinCss}`),
  ...[...usedPluginPackages].map(async (pkg) => {
    const css = await readDshBundleCss(dsh, pkg)
    await writeFile(join(pluginsDir, `${shortPkgName(pkg)}.css`), `${mitBanner(pkg)}${css}`)
  }),
])

const manifestFixtures = []
for (const { name, config, body } of fixtureConfigs) {
  const pluginLinks = (config.pluginCss ?? []).map((pkg) => `<link rel="stylesheet" href="css/plugins/${shortPkgName(pkg)}.css">`).join('\n')

  const variants = []
  for (const variant of config.variants ?? []) {
    const mode = variant.mode ?? 'light'
    const [rawW, rawH] = String(variant.window ?? '900,600').split(',')
    const width = Number.parseInt(rawW, 10) || 900
    const height = Number.parseInt(rawH, 10) || 600
    const fileName = `${name}-${variant.id}.html`

    const html = renderFixturePage(body, {
      dshCss: '<link rel="stylesheet" href="css/dsh.css">',
      themeBaseCss: '<link rel="stylesheet" href="css/theme-base.css">',
      pluginCss: pluginLinks,
      skinCss: '<link rel="stylesheet" href="css/skin.css">',
      tokens: formatTokenVars(overrides, mode),
      dark: mode === 'dark',
      bodyStyle: variant.bodyStyle,
      tail: APPEARANCE_BRIDGE_SCRIPT,
    })
    await writeFile(join(outRoot, fileName), html)

    variants.push({
      id: variant.id,
      mode,
      width,
      height,
      src: `generated/${fileName}`,
    })
  }

  manifestFixtures.push({
    name,
    title: config.title ?? name,
    group: config.group ?? '其他',
    pluginCss: (config.pluginCss ?? []).map(shortPkgName),
    variants,
  })
}

manifestFixtures.sort((a, b) => {
  const ga = GROUP_ORDER.indexOf(a.group)
  const gb = GROUP_ORDER.indexOf(b.group)
  const orderA = ga === -1 ? GROUP_ORDER.length : ga
  const orderB = gb === -1 ? GROUP_ORDER.length : gb
  if (orderA !== orderB) return orderA - orderB
  return a.name.localeCompare(b.name)
})

const groups = [...new Set(manifestFixtures.map((f) => f.group))]
const manifest = {
  dshVersion,
  generatedAt: new Date().toISOString(),
  groups,
  fixtures: manifestFixtures,
}
await writeFile(join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.error(`[showcase] DSH runtime ${dshVersion} <- ${dsh}`)
console.error(
  `[showcase] generated ${manifestFixtures.length} fixture cards (${manifestFixtures.reduce((s, f) => s + f.variants.length, 0)} documents) into site/showcase/generated/`,
)
