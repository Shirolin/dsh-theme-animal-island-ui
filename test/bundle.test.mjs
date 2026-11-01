import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

test('package exposes DSH client, provider ordering, peers, and prepack', () => {
  assert.equal(packageJson.version, '0.3.20')
  assert.equal(packageJson.dsh.client.platform, 'web')
  assert.deepEqual(packageJson.dsh.client.inject, [
    '@deepseek-ai/dsh-client-ui-theme',
    '@deepseek-ai/dsh-client-ui-renderer',
    '@deepseek-ai/dsh-client-ui-sidebar',
    '@deepseek-ai/dsh-client-ui-conversation',
  ])
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
