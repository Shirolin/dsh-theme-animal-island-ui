import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../scripts/verify-release.mjs', import.meta.url))

/**
 * Build a throwaway release: a checkout (package.json, CHANGELOG, lib/, docs/)
 * plus a tarball packed from it, so the verifier sees a real archive.
 */
function makeRelease(t, { mutate = () => {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-verify-release-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const checkout = join(root, 'checkout')
  const staging = join(root, 'staging')
  const releaseDir = join(root, 'release')
  for (const directory of [join(checkout, 'lib'), join(checkout, 'docs'), join(staging, 'package'), releaseDir]) {
    mkdirSync(directory, { recursive: true })
  }

  const manifest = { name: 'dsh-theme-test', version: '9.9.9', files: ['lib', 'docs'] }
  const files = {
    'package.json': `${JSON.stringify(manifest, null, 2)}\n`,
    'CHANGELOG.md': '# 变更记录\n\n## 9.9.9（测试）\n\n- 仅供发布校验测试使用。\n',
    'lib/index.js': 'export const marker = 1\n',
    'docs/notes.md': '# notes\n',
  }
  const write = (base, path, text) => {
    const target = join(base, ...path.split('/'))
    mkdirSync(join(target, '..'), { recursive: true })
    writeFileSync(target, text)
  }
  for (const [path, text] of Object.entries(files)) {
    write(checkout, path, text)
  }
  // The packed manifest is normalised by npm/pnpm, so identity is what matters.
  for (const path of ['package.json', 'lib/index.js', 'docs/notes.md']) {
    write(staging, `package/${path}`, files[path])
  }
  mutate({ checkout, staging })

  const tarball = join(releaseDir, 'dsh-theme-test-9.9.9.tgz')
  // GNU tar reads the `C:` in an absolute Windows archive path as a remote
  // host, so build the archive by relative name from its own directory.
  execFileSync('tar', ['-czf', basename(tarball), '-C', staging.split(sep).join('/'), 'package'], {
    cwd: releaseDir,
    stdio: 'inherit',
  })
  return { root, checkout, staging, tarball }
}

const run = (checkout, tarball) => spawnSync(process.execPath, [script, 'v9.9.9', tarball], { cwd: checkout, encoding: 'utf8' })

test('verify-release accepts a pack that matches the checkout', (t) => {
  const { checkout, tarball } = makeRelease(t)
  const result = run(checkout, tarball)

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /\(3 files match the checkout\)/)
  const sha = createHash('sha256').update(readFileSync(tarball)).digest('hex').toUpperCase()
  assert.equal(readFileSync(join(tarball, '..', 'SHA256SUMS'), 'utf8'), `${sha}  dsh-theme-test-9.9.9.tgz\n`)
})

test('verify-release rejects a pack whose bytes drifted from the checkout', (t) => {
  const { checkout, tarball } = makeRelease(t)

  writeFileSync(join(checkout, 'lib/index.js'), 'export const marker = 2\n')
  const result = run(checkout, tarball)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /differs from the checkout: lib\/index\.js/)
})

test('verify-release rejects files that package.json files does not declare', (t) => {
  const { checkout, tarball } = makeRelease(t, {
    mutate: ({ staging }) => writeFileSync(join(staging, 'package', 'stray.txt'), 'leak\n'),
  })
  const result = run(checkout, tarball)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /not declared in package\.json files: stray\.txt/)
})

test('verify-release rejects a pack that omits a declared file', (t) => {
  const { checkout, tarball } = makeRelease(t, {
    mutate: ({ staging }) => rmSync(join(staging, 'package', 'docs/notes.md')),
  })
  const result = run(checkout, tarball)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /missing from the tarball: docs\/notes\.md/)
})

test('verify-release rejects a pack whose manifest identity drifted', (t) => {
  const { checkout, tarball } = makeRelease(t, {
    mutate: ({ staging }) =>
      writeFileSync(join(staging, 'package', 'package.json'), `${JSON.stringify({ name: 'dsh-theme-test', version: '9.9.8' }, null, 2)}\n`),
  })
  const result = run(checkout, tarball)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /package\.json \(identity dsh-theme-test@9\.9\.8\)/)
})
