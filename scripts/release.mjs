#!/usr/bin/env node
/*
 * Release helper: bump the version, pack the canonical tarball, and record its
 * SHA-256 in the two places that document it (README.md, artifacts/README.md).
 *
 * Hand-editing those hashes is how a release quietly drifts from its artifact,
 * so this script rewrites them from the packed file and fails loudly when the
 * documents no longer match the expected shape.
 *
 *   node scripts/release.mjs 0.3.5
 *
 * It does not commit or push: review `git status`, then commit yourself.
 */
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = process.argv[2]

if (version === undefined || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error('usage: node scripts/release.mjs <version>   e.g. 0.3.5')
  process.exit(1)
}

const packagePath = join(root, 'package.json')
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const previous = packageJson.version
if (previous === version) {
  console.error(`package.json is already at ${version}; bump the version for a new release`)
  process.exit(1)
}

packageJson.version = version
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
console.log(`version: ${previous} -> ${version}`)

const destination = join('artifacts', `release-v${version}`)
console.log('packing…')
// Through a shell on purpose: Windows ships pnpm as a .cmd shim, and a direct
// spawn does not resolve those. `version` is already validated above, so the
// only interpolated argument is safe here.
execSync(`pnpm pack --pack-destination "${destination}"`, { cwd: root, stdio: 'inherit' })

const tarball = join(root, destination, `${packageJson.name}-${version}.tgz`)
const { size } = await stat(tarball)
const sha = createHash('sha256').update(await readFile(tarball)).digest('hex').toUpperCase()
console.log(`tarball: ${destination}/${packageJson.name}-${version}.tgz (${size} bytes)`)
console.log(`sha256 : ${sha}`)

const documents = [
  { file: 'README.md', expected: /SHA-256: [0-9A-F]{64}/ },
  { file: 'artifacts/README.md', expected: /SHA-256: [0-9A-F]{64}/ },
]

/*
 * Rewrite only the versioned references to *this* artifact. A blanket
 * `release-v<semver>/` sweep would also relabel the "previous release" row in
 * artifacts/README.md's table, which has to keep naming the older directory.
 */
const semver = '\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?'
const artifactName = packageJson.name.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
const rewrites = [
  // The canonical tarball path, as one unit: the directory and the file name
  // carry the version separately, and an older document may disagree with
  // itself. Historical archives are named without a `release-v…/` prefix, so
  // pairing the two keeps them out of this rewrite.
  [
    new RegExp(`release-v${semver}/(${artifactName}-)${semver}\\.tgz`, 'g'),
    `release-v${version}/$1${version}.tgz`,
  ],
  [new RegExp(`artifacts/release-v${semver}`, 'g'), `artifacts/release-v${version}`],
  // The "current artifact" table row follows the release. The "previous
  // release" row is deliberately left alone: only the author knows which
  // directory is being archived as the rollback target.
  [/`release-v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\/` \| 当前规范产物/g, '`release-v' + version + '/` | 当前规范产物'],
  [/SHA-256: [0-9A-F]{64}/g, `SHA-256: ${sha}`],
]

for (const { file, expected } of documents) {
  const path = join(root, file)
  const original = await readFile(path, 'utf8')
  if (!expected.test(original)) {
    console.error(`${file}: no "SHA-256: <64 hex>" line found — update the document shape first`)
    process.exit(1)
  }
  const next = rewrites.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), original)
  if (next !== original) {
    await writeFile(path, next)
    console.log(`updated: ${file}`)
  }
}

console.log('\nnext: git status && git commit — then install the tarball into the target profile:')
console.log(`  pnpm add file:${join(root, destination, `${packageJson.name}-${version}.tgz`)}`)
