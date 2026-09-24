import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

test('package exposes DSH client and host bundle entries', () => {
  assert.equal(packageJson.name, 'dsh-theme-animal-island-ui')
  assert.equal(packageJson.dsh.client.platform, 'web')
  assert.ok(packageJson.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-theme'))
  assert.equal(packageJson.exports['./client'].default, './lib/client.js')
  assert.equal(packageJson.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(packageJson.scripts.prepack, 'pnpm run build')
})

test('built client uses the loader protocol and public theme seam', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(bundle, /__ModuleLoader__/)
  assert.match(bundle, /overrideTokens/)
  assert.match(bundle, /dsh-theme-animal-island-ui/)
  assert.doesNotMatch(bundle, /document\.body|document\.querySelector|window\.__DSH_BOOT__/)
  assert.doesNotMatch(bundle, /@deepseek-ai\/dsh-client-ui-theme\/lib\//)
})

test('published client declarations are self-contained', async () => {
  const declaration = await readFile(new URL('../lib/types/client/index.d.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(declaration, /from ['"]@deepseek-ai\//)
})

test('built client does not embed the DSH runtime implementation', async () => {
  const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(bundle, /class ThemeRuntime|function ThemeRuntime/)
})
