import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('desktop capture tooling is present and the CDP helper parses', () => {
  for (const file of [
    'scripts/cdp-shot.mjs',
    'scripts/capture-desktop.ps1',
    'scripts/dwm-shot.ps1',
    'scripts/dsh-desktop-debug.cmd',
  ]) {
    assert.ok(existsSync(join(root, file)), `${file} is missing`)
  }
  execFileSync(process.execPath, ['--check', join(root, 'scripts/cdp-shot.mjs')], { stdio: 'pipe' })
})

test('fixture tooling is present and parses', () => {
  for (const file of [
    'scripts/fixture.mjs',
    'scripts/prepare-dsh-runtime.mjs',
  ]) {
    assert.ok(existsSync(join(root, file)), `${file} is missing`)
    execFileSync(process.execPath, ['--check', join(root, file)], { stdio: 'pipe' })
  }
})
