#!/usr/bin/env node
/*
 * Prepare an extracted DSH runtime for visual fixtures.
 *
 * Desktop builds ship the web frontend inside app.asar, while fixture.mjs
 * expects a normal app directory with node_modules. Extract the archive once
 * per desktop build into .tmp/dsh-runtime and reuse it across fixture runs.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const asarPackage = '@electron/asar@4.3.1'

export function findDshAsar(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.DSH_DESKTOP_ASAR,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs', 'DeepSeek Harness', 'resources', 'app.asar'),
    'C:/Software/DeepSeek Harness/resources/app.asar',
    '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar',
    join(homedir(), '.local', 'share', 'deepseek-harness', 'resources', 'app.asar'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    const path = resolve(candidate)
    if (existsSync(path)) return path
  }

  throw new Error('DeepSeek Harness app.asar was not found; pass --asar <path> or set DSH_DESKTOP_ASAR')
}

function isDshRuntime(dsh) {
  return [
    'node_modules/@deepseek-ai/dsh-web-frontend/dist/assets',
    'node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js',
    'node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js',
  ].every((path) => existsSync(join(dsh, path)))
}

function runNpx(args) {
  if (process.platform === 'win32') {
    const npxCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')
    if (existsSync(npxCli)) {
      execFileSync(process.execPath, [npxCli, ...args], { stdio: 'inherit' })
      return
    }
    execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', 'npx.cmd', ...args], {
      stdio: 'inherit',
    })
    return
  }
  execFileSync('npx', args, { stdio: 'inherit' })
}

export function prepareDshRuntime({ asarPath, cacheRoot = join(root, '.tmp', 'dsh-runtime') } = {}) {
  const asar = findDshAsar(asarPath)
  const stat = statSync(asar)
  const buildKey = `${stat.size}-${Math.trunc(stat.mtimeMs)}`
  const extractRoot = join(cacheRoot, buildKey)
  const dsh = join(extractRoot, 'dsh')

  if (isDshRuntime(dsh)) return dsh
  if (existsSync(extractRoot)) {
    throw new Error(`incomplete DSH runtime cache: ${extractRoot}`)
  }

  mkdirSync(cacheRoot, { recursive: true })
  const staging = join(cacheRoot, `${buildKey}.partial-${process.pid}-${Date.now()}`)

  console.error(`[fixture] extracting DSH runtime from ${asar}`)
  try {
    runNpx(['--yes', asarPackage, 'extract', asar, staging])
    if (!isDshRuntime(join(staging, 'dsh'))) {
      throw new Error(`DSH runtime extraction is incomplete: ${staging}`)
    }

    try {
      renameSync(staging, extractRoot)
    } catch (error) {
      if (!isDshRuntime(dsh)) throw error
    }
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
  return dsh
}

function main() {
  const args = process.argv.slice(2)
  const flag = (name) => {
    const index = args.indexOf(`--${name}`)
    return index === -1 ? undefined : args[index + 1]
  }
  console.log(
    prepareDshRuntime({
      asarPath: flag('asar'),
      cacheRoot: flag('cache'),
    }),
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`[fixture] ${error.message}`)
    process.exitCode = 1
  }
}
