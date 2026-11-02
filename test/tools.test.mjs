import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isDshRuntime,
  readDshBundleCss,
  readDshClientDeclarations,
  readDshFrontendCss,
  readDshPackageFile,
  readDshThemeBaseCss,
  resolveDshPackage,
} from '../scripts/dsh-runtime.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('desktop capture tooling is present and the CDP helper parses', () => {
  for (const file of ['scripts/cdp-shot.mjs', 'scripts/capture-desktop.ps1', 'scripts/dwm-shot.ps1', 'scripts/dsh-desktop-debug.cmd']) {
    assert.ok(existsSync(join(root, file)), `${file} is missing`)
  }
  execFileSync(process.execPath, ['--check', join(root, 'scripts/cdp-shot.mjs')], { stdio: 'pipe' })
})

test('fixture tooling is present and parses', () => {
  for (const file of ['scripts/dsh-runtime.mjs', 'scripts/fixture.mjs', 'scripts/prepare-dsh-runtime.mjs']) {
    assert.ok(existsSync(join(root, file)), `${file} is missing`)
    execFileSync(process.execPath, ['--check', join(root, file)], { stdio: 'pipe' })
  }
})

test('release verification tooling is present and parses', () => {
  const file = join(root, 'scripts/verify-release.mjs')
  assert.ok(existsSync(file), 'scripts/verify-release.mjs is missing')
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
})

test('DSH runtime reader resolves packages, validates installs, and extracts CSS', async (t) => {
  await mkdir(join(root, '.tmp'), { recursive: true })
  const temporaryRoot = await mkdtemp(join(root, '.tmp', 'dsh-runtime-test-'))
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }))

  const dsh = join(temporaryRoot, 'dsh')
  const themeRoot = join(dsh, 'node_modules', '@deepseek-ai', 'dsh-client-ui-theme')
  const sidebarRoot = join(dsh, 'node_modules', '@deepseek-ai', 'dsh-client-ui-sidebar')
  const frontendAssets = join(dsh, 'node_modules', '@deepseek-ai', 'dsh-web-frontend', 'dist', 'assets')
  const pluginRoot = join(dsh, 'node_modules', '@example', 'plugin')

  await Promise.all([
    mkdir(join(themeRoot, 'lib', 'types', 'client'), { recursive: true }),
    mkdir(join(themeRoot, 'lib'), { recursive: true }),
    mkdir(join(sidebarRoot, 'lib'), { recursive: true }),
    mkdir(frontendAssets, { recursive: true }),
    mkdir(join(pluginRoot, 'lib'), { recursive: true }),
  ])
  await Promise.all([
    writeFile(join(themeRoot, 'lib', 'client.js'), 'const css = ".ignored{}";\nvar base_css_default = ":root{--example: \\"theme\\"}";'),
    writeFile(
      join(themeRoot, 'package.json'),
      '{"name":"@deepseek-ai/dsh-client-ui-theme","exports":{"./client":{"types":"./lib/types/client/index.d.ts","default":"./lib/client.js"}}}',
    ),
    writeFile(join(themeRoot, 'lib', 'types', 'client', 'index.d.ts'), 'export declare class ThemeRuntime {}'),
    writeFile(join(sidebarRoot, 'lib', 'client.js'), ''),
    writeFile(join(frontendAssets, 'z.css'), '.z{}'),
    writeFile(join(frontendAssets, 'a.css'), '.a{}'),
    writeFile(join(pluginRoot, 'lib', 'client.js'), 'const css$1 = ".one::before{content:\\"one\\"}";\nvar Plugin_css_default = ".two{}";'),
    writeFile(join(sidebarRoot, 'package.json'), '{"name":"@deepseek-ai/dsh-client-ui-sidebar"}'),
  ])

  assert.equal(resolveDshPackage('@deepseek-ai/dsh-client-ui-sidebar', themeRoot), sidebarRoot)
  assert.equal(await readDshPackageFile('@deepseek-ai/dsh-client-ui-sidebar', 'package.json', themeRoot), '{"name":"@deepseek-ai/dsh-client-ui-sidebar"}')
  assert.deepEqual(await readDshClientDeclarations('@deepseek-ai/dsh-client-ui-theme', themeRoot), {
    path: join(themeRoot, 'lib', 'types', 'client', 'index.d.ts'),
    text: 'export declare class ThemeRuntime {}',
  })
  assert.equal(isDshRuntime(dsh), true)
  assert.equal(await readDshFrontendCss(dsh), '.a{}\n.z{}')
  assert.equal(await readDshThemeBaseCss(dsh), ':root{--example: "theme"}')
  assert.equal(await readDshBundleCss(dsh, '@example/plugin'), '.one::before{content:"one"}\n.two{}')

  await rm(sidebarRoot, { recursive: true })
  assert.equal(isDshRuntime(dsh), false)
})
