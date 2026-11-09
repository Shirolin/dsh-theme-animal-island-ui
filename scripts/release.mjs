#!/usr/bin/env node
/*
 * Release helper: bump the version and pack the tarball used for the local
 * client check (`install:local`) and for eyeballing the artifact.
 *
 * The tarball packed here is NOT the published one and its SHA-256 is not
 * recorded anywhere: `pnpm pack` gzip streams differ per platform, so a
 * checksum computed on the developer machine never matches the workflow's. The
 * release workflow packs, verifies, and publishes its own checksum with the
 * GitHub release.
 *
 *   node scripts/release.mjs 0.3.5
 *
 * It does not commit or push: review `git status`, then commit yourself.
 */
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
console.log(`tarball: ${destination}/${packageJson.name}-${version}.tgz (${size} bytes)`)
console.log('note: this pack is for local checks only; the published checksum comes from the release workflow')

/*
 * README.md ships inside the tarball, so it must not name the tarball's own
 * version: rewriting that data after packing would change the next pack's
 * bytes. Keep release-specific metadata in the unshipped artifact log.
 *
 * A blanket `release-v<semver>/` sweep would also relabel the "previous
 * release" row in artifacts/README.md's table, which has to keep naming the
 * older directory.
 */
const semver = '\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?'
const artifactName = packageJson.name.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
const rewrites = [
  // The canonical tarball path, as one unit: the directory and the file name
  // carry the version separately, and an older document may disagree with
  // itself. Historical archives are named without a `release-v…/` prefix, so
  // pairing the two keeps them out of this rewrite.
  [new RegExp(`release-v${semver}/(${artifactName}-)${semver}\\.tgz`, 'g'), `release-v${version}/$1${version}.tgz`],
  [new RegExp(`artifacts/release-v${semver}`, 'g'), `artifacts/release-v${version}`],
  // The "current artifact" table row follows the release. The "previous
  // release" row is deliberately left alone: only the author knows which
  // directory is being archived as the rollback target.
  [/`release-v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\/` \| 当前规范产物/g, `\`release-v${version}/\` | 当前规范产物`],
]

const file = 'artifacts/README.md'
const path = join(root, file)
const original = await readFile(path, 'utf8')
const next = rewrites.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), original)
if (next !== original) {
  await writeFile(path, next)
  console.log(`updated: ${file}`)
}

console.log('\nnext: git status && git commit — then install the tarball into the target profile:')
console.log(`  pnpm add file:${join(root, destination, `${packageJson.name}-${version}.tgz`)}`)
