#!/usr/bin/env node
/*
 * Verify that a tagged pack matches package.json, the checked-in release
 * documents, and the changelog. The script also writes SHA256SUMS next to the
 * tarball so the GitHub release workflow uploads a verifiable checksum.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'

const [tag, tarballArg] = process.argv.slice(2)
if (tag === undefined || tarballArg === undefined || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
  console.error('usage: node scripts/verify-release.mjs v<version> <tarball>')
  process.exit(1)
}

const version = tag.slice(1)
const tarball = resolve(tarballArg)
const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
if (packageJson.version !== version) {
  console.error(`package.json version ${packageJson.version} does not match tag ${tag}`)
  process.exit(1)
}

const expectedArtifact = `${packageJson.name}-${version}.tgz`
if (basename(tarball) !== expectedArtifact) {
  console.error(`expected tarball ${expectedArtifact}, received ${basename(tarball)}`)
  process.exit(1)
}

const sha = createHash('sha256')
  .update(await readFile(tarball))
  .digest('hex')
  .toUpperCase()

const manifest = await readFile('artifacts/README.md', 'utf8')
if (!manifest.includes(`release-v${version}/${expectedArtifact}`)) {
  console.error(`artifacts/README.md: missing release-v${version}/${expectedArtifact}`)
  process.exit(1)
}
const documented = [...manifest.matchAll(/SHA-256: ([0-9A-F]{64})/g)].map((match) => match[1])
if (documented.length !== 1 || documented[0] !== sha) {
  console.error(`artifacts/README.md: documented SHA-256 does not match ${sha}`)
  process.exit(1)
}

const changelog = await readFile('CHANGELOG.md', 'utf8')
const heading = new RegExp(`^##\\s+${version.replaceAll('.', '\\.')}(?:[（(]|\\s|$)`, 'm')
if (!heading.test(changelog)) {
  console.error(`CHANGELOG.md: missing section for ${version}`)
  process.exit(1)
}

const sums = `${sha}  ${expectedArtifact}\n`
await writeFile(resolve(dirname(tarball), 'SHA256SUMS'), sums)
console.log(`${tag}: ${sha} ${expectedArtifact}`)
