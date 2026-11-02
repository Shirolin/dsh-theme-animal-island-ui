import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PUBLIC_ARIA_ATTRIBUTES, PUBLIC_ARIA_ROLES, PUBLIC_DATA_HOOKS, PUBLIC_SLOTS } from '../scripts/seam-contract.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const documents = [
  'README.md',
  'README.en.md',
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

test('release manifest records the current artifact without self-referential README metadata', async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const expected = `${packageJson.name}-${packageJson.version}.tgz`
  const manifest = await readFile(resolve(root, 'artifacts/README.md'), 'utf8')
  const readme = await readFile(resolve(root, 'README.md'), 'utf8')

  assert.ok(manifest.includes(`release-v${packageJson.version}/${expected}`), `artifacts/README.md: must name release-v${packageJson.version}/${expected}`)
  assert.equal([...manifest.matchAll(/SHA-256: [0-9A-F]{64}/g)].length, 1, 'artifacts/README.md: expected exactly one SHA-256 line')
  assert.doesNotMatch(readme, /release-v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\//)
  assert.doesNotMatch(readme, /SHA-256: [0-9A-F]{64}/)
})

test('community templates use canonical repository links and current contribution paths', async () => {
  const readme = await readFile(resolve(root, 'README.md'), 'utf8')
  const issueConfig = await readFile(resolve(root, '.github/ISSUE_TEMPLATE/config.yml'), 'utf8')
  const pullRequest = await readFile(resolve(root, '.github/PULL_REQUEST_TEMPLATE.md'), 'utf8')

  assert.doesNotMatch(readme, /当前发布\s+\*\*\d+\.\d+\.\d+/)
  assert.match(readme, /github\.com\/Shirolin\/dsh-theme-animal-island-ui\/releases/)
  assert.doesNotMatch(issueConfig, /\bOWNER\/REPO\b/)
  assert.match(issueConfig, /https:\/\/github\.com\/Shirolin\/dsh-theme-animal-island-ui\/blob\/main\/CONTRIBUTING\.md/)
  assert.match(issueConfig, /https:\/\/github\.com\/Shirolin\/dsh-theme-animal-island-ui\/security\/advisories\/new/)
  assert.match(pullRequest, /scripts\/seam-contract\.mjs/)
  assert.doesNotMatch(pullRequest, /test\/skin\.test\.mjs/)
})

test('compatibility documentation covers every machine-readable public seam', async () => {
  const text = await readFile(resolve(root, 'docs/compatibility.md'), 'utf8')

  for (const hook of PUBLIC_DATA_HOOKS) {
    assert.ok(text.includes(hook.selector), `docs/compatibility.md: missing ${hook.selector}`)
  }
  for (const slot of PUBLIC_SLOTS) {
    assert.ok(text.includes(slot.name), `docs/compatibility.md: missing ${slot.name}`)
  }
  for (const role of PUBLIC_ARIA_ROLES) {
    assert.match(text, new RegExp(`\\b${role.role}\\b`), `docs/compatibility.md: missing role ${role.role}`)
  }
  for (const attribute of PUBLIC_ARIA_ATTRIBUTES) {
    assert.ok(text.includes(attribute.attribute), `docs/compatibility.md: missing ${attribute.attribute}`)
  }
})

test('every public seam records purpose, evidence, and an explicit probe decision', () => {
  for (const seam of [...PUBLIC_DATA_HOOKS, ...PUBLIC_SLOTS, ...PUBLIC_ARIA_ROLES, ...PUBLIC_ARIA_ATTRIBUTES]) {
    assert.ok(seam.purpose?.length > 0, `missing purpose: ${seam.selector ?? seam.name ?? seam.role ?? seam.attribute}`)
    assert.ok(seam.evidence !== undefined, `missing evidence: ${seam.selector ?? seam.name ?? seam.role ?? seam.attribute}`)
    assert.ok(Object.hasOwn(seam, 'probe'), `missing probe decision: ${seam.selector ?? seam.name ?? seam.role ?? seam.attribute}`)
  }
})
