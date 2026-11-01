import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const documents = [
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'THIRD_PARTY_NOTICES.md',
  'docs/design.md',
  'docs/compatibility.md',
  'docs/desktop.md',
  'docs/web-vs-desktop.md',
  'docs/session-list-blank.md',
]

test('repository documents exist and their relative links resolve', async () => {
  for (const document of documents) {
    const path = resolve(root, document)
    await stat(path)
    const text = await readFile(path, 'utf8')
    for (const [, target] of text.matchAll(/\]\((?!https?:|mailto:|#)([^)#\s]+)/g)) {
      const linked = resolve(dirname(path), target)
      assert.ok(
        await stat(linked).then(
          () => true,
          () => false,
        ),
        `${document}: broken link -> ${target}`,
      )
    }
  }
})

test('both documents that name the canonical artifact agree with the package version', async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const expected = `${packageJson.name}-${packageJson.version}.tgz`

  const shas = new Set()
  for (const document of ['README.md', 'artifacts/README.md']) {
    const text = await readFile(resolve(root, document), 'utf8')
    assert.ok(text.includes(`release-v${packageJson.version}/${expected}`), `${document}: must name release-v${packageJson.version}/${expected}`)
    const sha = text.match(/SHA-256: ([0-9A-F]{64})/)
    assert.ok(sha, `${document}: missing a SHA-256 line`)
    shas.add(sha[1])
  }
  assert.equal(shas.size, 1, 'README.md and artifacts/README.md record different SHA-256 values')
})
