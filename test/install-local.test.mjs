import test from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildDependencySpec, buildTarballCachePath, parseArgs, withProfileDependency } from '../scripts/install-local.mjs'

test('install:local parses a profile filter and dry-run', () => {
  assert.deepEqual(parseArgs([]), { only: ['desktop', 'web'], dryRun: false, help: false })
  assert.deepEqual(parseArgs(['--only', 'web']).only, ['web'])
  assert.deepEqual(parseArgs(['--only', 'desktop,web']).only, ['desktop', 'web'])
  assert.equal(parseArgs(['--dry-run']).dryRun, true)
  assert.deepEqual(parseArgs(['--', '--only', 'web', '--dry-run']), { only: ['web'], dryRun: true, help: false })
  assert.throws(() => parseArgs(['--only', 'mobile']), /unknown profile/)
  assert.throws(() => parseArgs(['--only']), /requires a comma-separated/)
  assert.throws(() => parseArgs(['--nope']), /unknown argument/)
})

test('install:local writes portable file: specs', () => {
  const spec = buildDependencySpec(join('artifacts', 'release-v1.2.3', 'theme.tgz'))

  assert.match(spec, /^file:/)
  assert.equal(spec.includes('\\'), false)
  assert.ok(spec.endsWith('artifacts/release-v1.2.3/theme.tgz'))
})

test('install:local gives each tarball content its own cache path', () => {
  const cachePath = buildTarballCachePath({
    dshHome: join('home', '.dsh'),
    packageName: 'dsh-theme-animal-island-ui',
    version: '0.3.35',
    sha256: 'abc123',
  })

  assert.equal(cachePath, join('home', '.dsh', 'cache', 'theme-tarballs', 'dsh-theme-animal-island-ui', '0.3.35-abc123.tgz'))
})

test('profile update points the dependency and registers the bundle once', () => {
  const base = {
    name: 'dsh-profile-test',
    dependencies: { other: '1.0.0' },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base'] } },
  }

  const first = withProfileDependency(base, 'dsh-theme-animal-island-ui', 'file:D:/theme.tgz')
  assert.equal(first.changed, true)
  assert.equal(first.previous, undefined)
  assert.equal(first.manifest.dependencies['dsh-theme-animal-island-ui'], 'file:D:/theme.tgz')
  assert.deepEqual(first.manifest.dsh.profile.bundles, ['@deepseek-ai/dsh-base', 'dsh-theme-animal-island-ui'])
  assert.equal(base.dependencies['dsh-theme-animal-island-ui'], undefined, 'the input manifest must not be mutated')

  const second = withProfileDependency(first.manifest, 'dsh-theme-animal-island-ui', 'file:D:/theme.tgz')
  assert.equal(second.changed, false)
  assert.deepEqual(second.manifest.dsh.profile.bundles, ['@deepseek-ai/dsh-base', 'dsh-theme-animal-island-ui'])
})

test('install:local CLI accepts the forwarded separator', (t) => {
  const temporary = mkdtempSync(join(tmpdir(), 'dsh-install-local-dry-run-'))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const profile = join(temporary, 'profiles', 'web')
  mkdirSync(profile, { recursive: true })
  writeFileSync(
    join(temporary, 'profiles', 'web', 'package.json'),
    JSON.stringify({ name: 'dsh-profile-web', private: true, dependencies: {}, dsh: { profile: { bundles: [] } } }),
    { encoding: 'utf8', flag: 'w' },
  )
  const tarball = join(temporary, 'theme.tgz')
  writeFileSync(tarball, '')

  const script = fileURLToPath(new URL('../scripts/install-local.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [script, '--', '--only', 'web', '--dry-run'], {
    env: { ...process.env, DSH_HOME: temporary, DSH_THEME_TARBALL: tarball },
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /\[web\] dry run:/)
  assert.match(result.stdout, /cache[\\/]theme-tarballs[\\/]dsh-theme-animal-island-ui[\\/]0\.3\.35-/)
})

test('install:local restores the profile manifest when installation fails', (t) => {
  const temporary = mkdtempSync(join(tmpdir(), 'dsh-install-local-failure-'))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const profile = join(temporary, 'profiles', 'web')
  const fakeBin = join(temporary, 'bin')
  mkdirSync(profile, { recursive: true })
  mkdirSync(fakeBin, { recursive: true })
  writeFileSync(
    join(temporary, 'profiles', 'web', 'package.json'),
    JSON.stringify(
      {
        name: 'dsh-profile-web',
        private: true,
        dependencies: { 'dsh-theme-animal-island-ui': 'file:old-theme.tgz' },
        dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-theme-animal-island-ui'] } },
      },
      null,
      2,
    ),
  )
  const tarball = join(temporary, 'theme.tgz')
  writeFileSync(tarball, '')
  const fakePnpm = join(fakeBin, process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm')
  writeFileSync(fakePnpm, process.platform === 'win32' ? '@exit /b 1\r\n' : '#!/bin/sh\nexit 1\n')
  if (process.platform !== 'win32') chmodSync(fakePnpm, 0o755)

  const script = fileURLToPath(new URL('../scripts/install-local.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [script, '--only', 'web'], {
    env: {
      ...process.env,
      DSH_HOME: temporary,
      DSH_THEME_TARBALL: tarball,
      PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ''}`,
    },
    encoding: 'utf8',
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /\[web\] failed:/)
  const manifest = JSON.parse(readFileSync(join(profile, 'package.json'), 'utf8'))
  assert.equal(manifest.dependencies['dsh-theme-animal-island-ui'], 'file:old-theme.tgz')
  assert.deepEqual(manifest.dsh.profile.bundles, ['@deepseek-ai/dsh-base', 'dsh-theme-animal-island-ui'])
})
