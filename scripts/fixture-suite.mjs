#!/usr/bin/env node
/*
 * Run every fixture against one DSH runtime and summarize.
 *
 * Fixtures mirror the real DOM and CSS of a specific DSH client, so a suite run
 * is only meaningful together with the runtime version it printed. Pass
 * `--expect-dsh <version>` (or another fixture.mjs flag) to pin it:
 *
 *   pnpm run check:fixtures -- --expect-dsh 0.2.2-rc.1
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixturesDir = join(root, 'test', 'fixtures')
const extraArgs = process.argv.slice(2)
const names = readdirSync(fixturesDir)
  .filter((entry) => existsSync(join(fixturesDir, entry, 'fixture.json')))
  .filter((entry) => statSync(join(fixturesDir, entry)).isDirectory())
  .sort()

const failures = []
for (const name of names) {
  try {
    execFileSync(process.execPath, [join(root, 'scripts', 'fixture.mjs'), name, ...extraArgs], { stdio: 'inherit' })
  } catch {
    failures.push(name)
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length}/${names.length} fixture(s) failed: ${failures.join(', ')}`)
  process.exit(1)
}
console.error(`\n${names.length}/${names.length} fixtures passed`)
