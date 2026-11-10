#!/usr/bin/env node
/*
 * Verify one tagged pack before it is published.
 *
 * The pack must match the tag, the changelog, and — file by file — the checkout
 * it was built from. That comparison is content level on purpose: `pnpm pack`
 * gzip streams are not reproducible across platforms (verified: same 40 files in
 * the same order, different bytes), so comparing tarball checksums fails the
 * moment the pack is not built on the same OS. Comparing the extracted files
 * catches stale or hand-edited artifacts without that noise.
 *
 * The SHA-256 of the tarball is printed (and written to $GITHUB_OUTPUT when set)
 * so the release workflow can publish it; the checksum lives with the artifact
 * it describes instead of being committed ahead of the build.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const toPosix = (path) => path.split(sep).join('/')

/** POSIX-style paths of every file under `directory`, relative to `base`. */
async function listFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(absolute, base)))
    else files.push(toPosix(relative(base, absolute)))
  }
  return files
}

async function sha256(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex')
}

const [tag, tarballArg] = process.argv.slice(2)
if (tag === undefined || tarballArg === undefined || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
  console.error('usage: node scripts/verify-release.mjs v<version> <tarball>')
  process.exit(1)
}

const version = tag.slice(1)
const root = process.cwd()
const tarball = resolve(tarballArg)
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

if (packageJson.version !== version) {
  fail(`package.json version ${packageJson.version} does not match tag ${tag}`)
}

const expectedArtifact = `${packageJson.name}-${version}.tgz`
if (basename(tarball) !== expectedArtifact) {
  fail(`expected tarball ${expectedArtifact}, received ${basename(tarball)}`)
}

const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8')
const heading = new RegExp(`^##\\s+${version.replaceAll('.', '\\.')}(?:[（(]|\\s|$)`, 'm')
if (!heading.test(changelog)) {
  fail(`CHANGELOG.md: missing section for ${version}`)
}

// Everything `files` declares, plus package.json, which npm always packs.
const expected = new Set(['package.json'])
for (const entry of packageJson.files ?? []) {
  if (entry.includes('*')) continue
  const absolute = join(root, entry)
  if (!existsSync(absolute)) fail(`package.json files: ${entry} does not exist`)
  if ((await stat(absolute)).isDirectory()) {
    for (const file of await listFiles(absolute)) expected.add(toPosix(join(entry, file)))
  } else {
    expected.add(toPosix(entry))
  }
}

const workDir = mkdtempSync(join(tmpdir(), 'dsh-release-verify-'))
let shipped
try {
  // GNU tar treats the `C:` in an absolute Windows archive path as a remote
  // host, so name the archive relative to its own directory and keep `-C` in
  // forward slashes; bsdtar (Windows' built-in tar) accepts the same form.
  execFileSync('tar', ['-xzf', basename(tarball), '-C', toPosix(workDir)], {
    cwd: dirname(tarball),
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  const packageDir = join(workDir, 'package')
  if (!existsSync(packageDir)) fail(`${basename(tarball)}: no package/ directory`)
  shipped = new Set(await listFiles(packageDir))

  const missing = [...expected].filter((file) => !shipped.has(file))
  const unexpected = [...shipped].filter((file) => !expected.has(file))
  const changed = []
  for (const file of shipped) {
    if (!expected.has(file)) continue
    // npm/pnpm normalise the manifest on pack (drops `packageManager`, moves
    // `devDependencies`), so it is compared by identity instead of bytes.
    if (file === 'package.json') continue
    if ((await sha256(join(packageDir, ...file.split('/')))) !== (await sha256(join(root, ...file.split('/'))))) {
      changed.push(file)
    }
  }

  const packed = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'))
  if (packed.name !== packageJson.name || packed.version !== version) {
    changed.push(`package.json (identity ${packed.name}@${packed.version})`)
  }

  const report = []
  if (missing.length > 0) report.push(`missing from the tarball: ${missing.slice(0, 5).join(', ')}`)
  if (unexpected.length > 0) report.push(`not declared in package.json files: ${unexpected.slice(0, 5).join(', ')}`)
  if (changed.length > 0) report.push(`differs from the checkout: ${changed.slice(0, 5).join(', ')}`)
  if (report.length > 0) fail(`${basename(tarball)}: ${report.join('; ')}`)
} finally {
  rmSync(workDir, { recursive: true, force: true })
}

const raw = createHash('sha256')
  .update(await readFile(tarball))
  .digest('hex')
  .toUpperCase()
await writeFile(join(dirname(tarball), 'SHA256SUMS'), `${raw}  ${expectedArtifact}\n`)
if (process.env.GITHUB_OUTPUT !== undefined) {
  await writeFile(process.env.GITHUB_OUTPUT, `sha=${raw}\n`, { flag: 'a' })
}
console.log(`${tag}: ${raw} ${expectedArtifact} (${shipped.size} files match the checkout)`)
