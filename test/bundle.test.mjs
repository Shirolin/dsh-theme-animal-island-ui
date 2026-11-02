import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PROVIDER_ORDER } from '../scripts/seam-contract.mjs'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

test('package exposes DSH client, provider ordering, peers, and prepack', () => {
  assert.match(packageJson.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
  assert.equal(packageJson.main, 'lib/index.js')
  assert.equal(packageJson.dsh.client.platform, 'web')
  assert.deepEqual(packageJson.dsh.client.inject, PROVIDER_ORDER)
  assert.equal(packageJson.exports['./client'].default, './lib/client.js')
  assert.equal(packageJson.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(packageJson.scripts.prepack, 'pnpm run build')
  assert.equal(packageJson.peerDependencies, undefined)
})

test('package ships its docs, scripts and engine metadata', () => {
  for (const entry of ['lib', 'README.md', 'CHANGELOG.md', 'docs', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(packageJson.files.includes(entry), `files must ship ${entry}`)
  }
  assert.equal(packageJson.engines.node, '>=20')
  assert.ok(packageJson.keywords.includes('dsh'))
  for (const script of ['build', 'format', 'lint', 'typecheck', 'test', 'check:compat', 'check:visual', 'fixture', 'release', 'check']) {
    assert.ok(packageJson.scripts[script], `script missing: ${script}`)
  }
})

test('built client uses the DSH factory(require) and owned style protocols', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(bundle, /__ModuleLoader__/)
  assert.match(bundle, /factory:\s*\(require\)/)
  assert.match(bundle, /overrideTokens/)
  assert.match(bundle, /data-dsh-animal-island-skin/)
  assert.match(bundle, /data-plugin-css/)
  assert.match(bundle, /sidebar\.brand\.mark/)
})

test('built client excludes brittle DOM, private runtime, and React internals', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(bundle, /document\.querySelector|document\.closest|\.closest\(/)
  assert.doesNotMatch(bundle, /MutationObserver|ResizeObserver/)
  assert.doesNotMatch(bundle, /window\.__DSH_BOOT__|__react|ReactDOM|hydrateRoot|createRoot/)
  assert.doesNotMatch(bundle, /@deepseek-ai\/dsh-[^/]+\/lib\//)
  assert.doesNotMatch(bundle, /(?<![A-Za-z0-9_-])\.[A-Za-z][A-Za-z0-9-]*_[A-Za-z0-9]{5,}(?![A-Za-z0-9_-])/)
})

test('published client declaration stays self-contained', async () => {
  const declaration = await readFile(new URL('../lib/types/client/index.d.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(declaration, /from ['"]@deepseek-ai\//)
  assert.doesNotMatch(declaration, /from ['"]react(?:\/|['"])/)
})

test('built client does not embed DSH ThemeRuntime or Sidebar implementations', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(bundle, /class ThemeRuntime|function ThemeRuntime/)
  assert.doesNotMatch(bundle, /class SidebarRoot|function SidebarRoot/)
})

test('host runtime modules are self-contained ESM', async () => {
  for (const file of ['index.js', 'palette.js', 'tokens.js']) {
    const source = await readFile(new URL(`../lib/${file}`, import.meta.url), 'utf8')
    assert.match(source, /\bexport\b/, `${file} is not an ESM module`)
    assert.doesNotMatch(source, /from\s+['"][^'"]+\.ts['"]/, `${file} retains a TypeScript import specifier`)
  }
})

test('host runtime modules expose the published export interface', async () => {
  const suffix = `?exports=${Date.now()}`
  const index = await import(new URL(`../lib/index.js${suffix}`, import.meta.url))
  const palette = await import(new URL(`../lib/palette.js${suffix}`, import.meta.url))
  const tokens = await import(new URL(`../lib/tokens.js${suffix}`, import.meta.url))

  assert.deepEqual(Object.keys(index).sort(), ['apply'])
  assert.deepEqual(Object.keys(palette).sort(), ['ANIMAL_ISLAND_DARK', 'ANIMAL_ISLAND_LIGHT', 'ANIMAL_ISLAND_PALETTES'])
  assert.deepEqual(Object.keys(tokens).sort(), ['ANIMAL_ISLAND_PALETTES', 'buildTokenOverrides', 'buildTokens', 'contrastRatio'])
})
