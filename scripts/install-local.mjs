#!/usr/bin/env node
/*
 * Install the current release tarball into the local DSH profiles.
 *
 * A theme change is only visible in the desktop client after the desktop
 * profile is updated too — the two profiles have separate node_modules. This
 * script writes the same `file:` dependency into both, then runs the installer
 * each profile requires:
 *
 *   - desktop: Electron-as-node + the bundled pnpm (the profile is managed by
 *     the Electron app; `dsh plugin` refuses it)
 *   - web:     the regular pnpm on PATH
 *
 *   pnpm run install:local                 # both profiles
 *   pnpm run install:local --only web      # one profile
 *   pnpm run install:local --dry-run       # print, do not write or install
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROFILE_NAMES = ['desktop', 'web']
const DESKTOP_APP_FALLBACK = 'C:\\Software\\DeepSeek Harness'

export function parseArgs(argv) {
  const options = { only: [...PROFILE_NAMES], dryRun: false, help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    // Keep compatibility with package managers or wrappers that forward the
    // conventional `--` separator instead of stripping it before the script.
    if (argument === '--') {
      continue
    }
    if (argument === '--dry-run') {
      options.dryRun = true
    } else if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (argument === '--only') {
      const value = argv[index + 1]
      if (value === undefined || value.startsWith('--')) throw new Error('--only requires a comma-separated profile list, e.g. --only web')
      index += 1
      const names = value
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
      if (names.length === 0) throw new Error('--only requires at least one profile name')
      for (const name of names) {
        if (!PROFILE_NAMES.includes(name)) throw new Error(`unknown profile "${name}"; expected desktop or web`)
      }
      options.only = names
    } else {
      throw new Error(`unknown argument: ${argument}`)
    }
  }
  return options
}

/** The `file:` spec pnpm accepts on every platform; forward slashes keep it portable. */
export function buildDependencySpec(tarballPath) {
  return `file:${resolve(tarballPath).replaceAll('\\', '/')}`
}

/** Keep the install spec content-addressed so a same-version repack is visible to pnpm. */
export function buildTarballCachePath({ dshHome, packageName, version, sha256 }) {
  return join(dshHome, 'cache', 'theme-tarballs', packageName, `${version}-${sha256}.tgz`)
}

/**
 * Return a copy of a profile manifest with this package pointed at `spec` and
 * registered in its bundle list. Pure so the CLI and tests share one rule.
 */
export function withProfileDependency(manifest, packageName, spec) {
  const next = structuredClone(manifest)
  next.dependencies ??= {}
  const previous = next.dependencies[packageName]
  next.dependencies[packageName] = spec

  next.dsh ??= {}
  next.dsh.profile ??= {}
  next.dsh.profile.bundles ??= []
  let addedBundle = false
  if (!next.dsh.profile.bundles.includes(packageName)) {
    next.dsh.profile.bundles.push(packageName)
    addedBundle = true
  }

  return { manifest: next, previous, changed: previous !== spec || addedBundle }
}

export function resolveTarball({ rootDir, name, version, env = process.env }) {
  const override = env.DSH_THEME_TARBALL
  const tarball = override === undefined ? join(rootDir, 'artifacts', `release-v${version}`, `${name}-${version}.tgz`) : resolve(override)
  if (!existsSync(tarball)) {
    throw new Error(
      `release tarball not found: ${tarball}\n  build it first: pnpm pack --pack-destination "artifacts/release-v${version}"\n  or point DSH_THEME_TARBALL at an existing tarball`,
    )
  }
  return tarball
}

export function findDesktopInstall(env = process.env) {
  const appDir = env.DSH_DESKTOP_APP ?? DESKTOP_APP_FALLBACK
  const executable = env.DSH_DESKTOP_EXE ?? join(appDir, 'DeepSeek Harness.exe')
  const pnpm = join(appDir, 'resources', 'runtime', 'primary-runtime', 'dependencies', 'pnpm', 'bin', 'pnpm.mjs')
  const runtimeBin = join(appDir, 'resources', 'runtime', 'bin')
  if (!existsSync(executable) || !existsSync(pnpm)) return undefined
  return { appDir, executable, pnpm, runtimeBin }
}

function run(command, args, options) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${result.status ?? 'no status'}`)
}

function runShell(commandLine, options) {
  const result = spawnSync(commandLine, { stdio: 'inherit', shell: true, ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${commandLine} exited with ${result.status ?? 'no status'}`)
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function readInstalledVersion(profileDir, packageName) {
  try {
    return (await readJson(join(profileDir, 'node_modules', packageName, 'package.json'))).version
  } catch {
    return undefined
  }
}

function installWeb(profileDir) {
  // One command string with shell: true keeps Windows' pnpm.CMD shim working
  // without hitting Node's DEP0190 (args + shell) warning; the profile path is
  // passed as cwd, not interpolated.
  runShell('pnpm install', { cwd: profileDir })
}

function installDesktop(profileDir, desktop) {
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    DSH_DESKTOP_NODE_EXECUTABLE: desktop.executable,
    PATH: `${desktop.runtimeBin};${process.env.PATH ?? ''}`,
  }
  run(desktop.executable, ['--expose-internals', desktop.pnpm, 'install', '--dir', profileDir], { env })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log('usage: pnpm run install:local [--only desktop,web] [--dry-run]')
    return
  }

  const packageJson = await readJson(join(root, 'package.json'))
  const packageName = packageJson.name
  const version = packageJson.version
  const tarball = resolveTarball({ rootDir: root, name: packageName, version })
  const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const sha256 = createHash('sha256')
    .update(await readFile(tarball))
    .digest('hex')
  const cachedTarball = buildTarballCachePath({ dshHome, packageName, version, sha256 })
  if (!options.dryRun) {
    await mkdir(dirname(cachedTarball), { recursive: true })
    await copyFile(tarball, cachedTarball)
  }
  const spec = buildDependencySpec(cachedTarball)
  const desktop = findDesktopInstall()

  console.log(`[install:local] ${packageName}@${version}`)
  console.log(`[install:local] tarball: ${tarball}`)
  console.log(`[install:local] staged: ${cachedTarball}`)

  let failures = 0
  for (const name of options.only) {
    const profileDir = join(dshHome, 'profiles', name)
    const manifestPath = join(profileDir, 'package.json')
    if (!existsSync(manifestPath)) {
      console.warn(`[${name}] skipped: no profile at ${profileDir}`)
      continue
    }
    if (name === 'desktop' && desktop === undefined) {
      console.warn(`[desktop] skipped: no desktop install found (set DSH_DESKTOP_APP if it lives elsewhere)`)
      continue
    }

    const originalManifest = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(originalManifest)
    const { manifest: updated, previous, changed } = withProfileDependency(manifest, packageName, spec)
    console.log(`[${name}] ${previous ?? '(not declared)'} -> ${spec}`)

    if (options.dryRun) {
      console.log(`[${name}] dry run: ${changed ? 'would update' : 'already up to date'}`)
      continue
    }

    try {
      if (changed) await writeFile(manifestPath, `${JSON.stringify(updated, null, 2)}\n`)
      if (name === 'desktop') installDesktop(profileDir, desktop)
      else installWeb(profileDir)
      const installed = await readInstalledVersion(profileDir, packageName)
      if (installed !== version) throw new Error(`installed ${installed ?? 'nothing'}, expected ${version}`)
      console.log(`[${name}] installed ${installed}`)
    } catch (error) {
      failures += 1
      let message = error instanceof Error ? error.message : String(error)
      if (changed) {
        try {
          await writeFile(manifestPath, originalManifest)
        } catch (rollbackError) {
          message += `; manifest rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`
        }
      }
      console.error(`[${name}] failed: ${message}`)
    }
  }

  if (failures > 0) process.exitCode = 1
  else console.log('[install:local] done')
}

const invokedDirectly = process.argv[1] !== undefined && fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1]).toLowerCase()

if (invokedDirectly) {
  main().catch((error) => {
    console.error(`[install:local] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
