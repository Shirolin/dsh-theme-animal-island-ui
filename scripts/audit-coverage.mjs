#!/usr/bin/env node
/*
 * Local DSH theme adaptation coverage audit.
 *
 * Scans an installed DSH runtime (all @deepseek-ai/dsh-client-ui-* packages +
 * web frontend CSS) against the built token overrides and fixture coverage,
 * then writes Markdown + JSON reports under artifacts/audit/ (git-ignored).
 * Always exits 0 — this is an engineering diagnostic, not a CI gate.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readDshBundleCss, readDshFrontendCss, readDshRuntimeVersion, readDshThemeBaseCss } from './dsh-runtime.mjs'
import { resolveDshRuntime } from './fixture-page.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const dsh = resolveDshRuntime(args)
const dshVersion = (await readDshRuntimeVersion(dsh)) ?? 'unknown'

const tokensPath = join(root, 'lib', 'tokens.js')
if (!existsSync(tokensPath)) {
  console.error('lib/tokens.js is missing — run `pnpm run build` first')
  process.exit(1)
}
const { buildTokenOverrides } = await import(`${pathToFileURL(tokensPath).href}?t=${Date.now()}`)
const overriddenTokens = new Set(Object.keys(buildTokenOverrides()))

const uiRoot = join(dsh, 'node_modules', '@deepseek-ai')
const uiPackages = (await readdir(uiRoot)).filter((name) => name.startsWith('dsh-client-ui-')).sort()

// Collect all fixture pluginCss coverage
const fixturesDir = join(root, 'test', 'fixtures')
const fixturePackages = new Set()
const fixtureList = []
for (const entry of (await readdir(fixturesDir)).sort()) {
  const manifestPath = join(fixturesDir, entry, 'fixture.json')
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  fixtureList.push({ name: entry, pluginCss: manifest.pluginCss ?? [] })
  for (const pkg of manifest.pluginCss ?? []) {
    fixturePackages.add(pkg.replace(/^@deepseek-ai\/dsh-client-ui-/, ''))
  }
}

/** Extract top-level declaration pairs from CSS text (sufficient for minified DSH CSS). */
function parseDeclarations(cssText) {
  const cleaned = cssText.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  let depth = 0
  let start = 0
  let headerStart = 0
  let currentSelector = ''
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i]
    if (ch === '{') {
      if (depth === 0) {
        currentSelector = cleaned.slice(headerStart, i).trim()
        start = i + 1
      } else if (depth === 1 && currentSelector.startsWith('@')) {
        // Inside @media / @supports / @keyframes
        currentSelector = `${currentSelector} > ${cleaned.slice(start, i).trim()}`
        start = i + 1
      }
      depth += 1
    } else if (ch === '}') {
      if (depth === 1 || (depth === 2 && currentSelector.includes('>'))) {
        const body = cleaned.slice(start, i)
        if (!currentSelector.startsWith('@keyframes')) {
          rules.push({ selector: currentSelector, body })
        }
        if (depth === 1) headerStart = i + 1
      }
      depth = Math.max(0, depth - 1)
      if (depth === 0) headerStart = i + 1
    }
  }
  return rules
}

function splitDeclarations(body) {
  const decls = []
  let current = ''
  let paren = 0
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i]
    if (ch === '(') paren += 1
    else if (ch === ')') paren = Math.max(0, paren - 1)
    if (ch === ';' && paren === 0) {
      const idx = current.indexOf(':')
      if (idx !== -1) {
        decls.push({ prop: current.slice(0, idx).trim(), value: current.slice(idx + 1).trim() })
      }
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) {
    const idx = current.indexOf(':')
    if (idx !== -1) {
      decls.push({ prop: current.slice(0, idx).trim(), value: current.slice(idx + 1).trim() })
    }
  }
  return decls
}

const COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)/g
const HAS_COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)/
const TRANSPARENT_COLOR_RE =
  /^(?:#(?:[0-9a-f]{3}0|[0-9a-f]{6}00)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(?:\.0+)?\s*\)|hsla\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*0(?:\.0+)?\s*\))$/i
const MASK_PROP_RE = /^(?:-webkit-)?mask(?:-image)?$/i

function isVisibleColorLiteral(value) {
  const trimmed = value.trim()
  if (TRANSPARENT_COLOR_RE.test(trimmed)) return false
  return HAS_COLOR_LITERAL_RE.test(trimmed)
}

function stripVarCalls(value) {
  let result = ''
  let i = 0
  while (i < value.length) {
    if (value.startsWith('var(', i)) {
      let depth = 1
      i += 4
      while (i < value.length && depth > 0) {
        if (value[i] === '(') depth += 1
        else if (value[i] === ')') depth -= 1
        i += 1
      }
    } else {
      result += value[i]
      i += 1
    }
  }
  return result
}

// 1. Parse DSH theme base CSS for token definitions
const themeBaseCss = await readDshThemeBaseCss(dsh)
const themeDefs = new Map() // token -> Set<value>
for (const rule of parseDeclarations(themeBaseCss)) {
  for (const { prop, value } of splitDeclarations(rule.body)) {
    if (!prop.startsWith('--dsw-') && !prop.startsWith('--shiki-')) continue
    if (!themeDefs.has(prop)) themeDefs.set(prop, new Set())
    themeDefs.get(prop).add(value)
  }
}

function resolvesToColorOrStatic(token, visited = new Set()) {
  if (visited.has(token)) return null
  visited.add(token)
  const values = themeDefs.get(token)
  if (!values) return null
  for (const val of values) {
    if (/--dsw-static-/.test(val)) return { kind: 'static', target: val }
    if (isVisibleColorLiteral(val)) return { kind: 'literal', target: val }
    for (const m of val.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      const sub = resolvesToColorOrStatic(m[1], new Set(visited))
      if (sub) return sub
    }
  }
  return null
}

// 2. Scan all dsh-client-ui-* packages + frontend CSS
const packageReports = []
const tokenConsumers = new Map() // token -> Set<shortPkgName>

function recordTokenUsage(shortName, css) {
  for (const m of css.matchAll(/var\((--(?:dsw|shiki)-[a-z0-9-]+)/g)) {
    const token = m[1]
    if (!tokenConsumers.has(token)) tokenConsumers.set(token, new Set())
    tokenConsumers.get(token).add(shortName)
  }
}

const frontendCss = await readDshFrontendCss(dsh)
recordTokenUsage('web-frontend', frontendCss)

for (const pkg of uiPackages) {
  const shortName = pkg.replace(/^dsh-client-ui-/, '')
  let css = ''
  let hasCss = false
  try {
    css = await readDshBundleCss(dsh, `@deepseek-ai/${pkg}`)
    hasCss = css.trim().length > 0
  } catch {
    hasCss = false
  }

  if (hasCss) recordTokenUsage(shortName, css)

  const hardcoded = []
  if (hasCss && pkg !== 'dsh-client-ui-theme') {
    for (const rule of parseDeclarations(css)) {
      for (const { prop, value } of splitDeclarations(rule.body)) {
        if (prop.startsWith('--') || MASK_PROP_RE.test(prop)) continue
        const withoutVars = stripVarCalls(value)
        const matches = [...withoutVars.matchAll(COLOR_LITERAL_RE)].map((m) => m[0]).filter((c) => !TRANSPARENT_COLOR_RE.test(c))
        if (matches.length > 0) {
          hardcoded.push({ selector: rule.selector, prop, value, colors: matches })
        }
      }
    }
  }

  packageReports.push({
    package: pkg,
    shortName,
    hasCss,
    inFixtures: fixturePackages.has(shortName),
    hardcodedCount: hardcoded.length,
    hardcodedSamples: hardcoded.slice(0, 12),
    uncoveredAliasTokens: [],
  })
}

// Signal A: uncovered semantic alias/specific/shiki tokens resolving to static/literal colors
const uncoveredTokens = []
for (const [token, values] of [...themeDefs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (overriddenTokens.has(token)) continue
  if (!/^--(?:dsw-(?:alias|specific)-|shiki-|dsw-focus-)/.test(token)) continue
  const resolved = resolvesToColorOrStatic(token)
  if (!resolved) continue
  const consumers = [...(tokenConsumers.get(token) ?? [])].sort()
  uncoveredTokens.push({
    token,
    defaultValues: [...values],
    resolvesTo: resolved.target,
    consumers,
  })
  for (const c of consumers) {
    const entry = packageReports.find((r) => r.shortName === c)
    if (entry) entry.uncoveredAliasTokens.push(token)
  }
}

// Signal B & C summaries
const hardcodedPackages = packageReports.filter((r) => r.hardcodedCount > 0).sort((a, b) => b.hardcodedCount - a.hardcodedCount)
const uncoveredCssPackages = packageReports
  .filter((r) => r.hasCss && !r.inFixtures && r.shortName !== 'theme')
  .map((r) => ({
    ...r,
    priorityScore:
      (r.uncoveredAliasTokens.length > 0 ? 3 : 0) + (r.hardcodedCount > 0 ? 2 : 0) + (r.uncoveredAliasTokens.length + Math.min(r.hardcodedCount, 10)) * 0.1,
  }))
  .sort((a, b) => b.priorityScore - a.priorityScore || a.shortName.localeCompare(b.shortName))

const report = {
  generatedAt: new Date().toISOString(),
  dshVersion,
  dshRuntimePath: dsh,
  summary: {
    totalUiPackages: uiPackages.length,
    uiPackagesWithCss: packageReports.filter((r) => r.hasCss).length,
    fixturesCount: fixtureList.length,
    coveredUiPackages: fixturePackages.size,
    uncoveredCssPackagesCount: uncoveredCssPackages.length,
    overriddenTokensCount: overriddenTokens.size,
    uncoveredSemanticColorTokensCount: uncoveredTokens.length,
    hardcodedColorPackagesCount: hardcodedPackages.length,
  },
  signalA_uncoveredSemanticTokens: uncoveredTokens,
  signalB_hardcodedColorPackages: hardcodedPackages,
  signalC_uncoveredCssPackages: uncoveredCssPackages,
}

const outDir = join(root, 'artifacts', 'audit')
await mkdir(outDir, { recursive: true })
const jsonPath = join(outDir, `coverage-${dshVersion}.json`)
const mdPath = join(outDir, `coverage-${dshVersion}.md`)
await writeFile(jsonPath, JSON.stringify(report, null, 2))

const mdLines = [
  `# DSH 主题适配覆盖率审计报告（${dshVersion}）`,
  '',
  `- **生成时间**：${report.generatedAt}`,
  `- **DSH 运行时**：\`${dsh}\``,
  `- **UI 包总数**：${report.summary.totalUiPackages}（含 CSS：${report.summary.uiPackagesWithCss}，已进夹具：${report.summary.coveredUiPackages}，无夹具且含 CSS：${report.summary.uncoveredCssPackagesCount}）`,
  `- **已覆写 Token**：${report.summary.overriddenTokensCount} 个`,
  `- **信号 A（漏覆写语义颜色 Token）**：${report.summary.uncoveredSemanticColorTokensCount} 个`,
  `- **信号 B（含硬编码色值的 UI 包）**：${report.summary.hardcodedColorPackagesCount} 个`,
  '',
  '## 信号 A：未覆写的语义颜色 Token（按消费方排序）',
  '',
  '| Token | 默认值 | 解析落点 | 消费包 |',
  '| --- | --- | --- | --- |',
  ...uncoveredTokens.map(
    (item) =>
      `| \`${item.token}\` | \`${item.defaultValues.join(' / ')}\` | \`${item.resolvesTo}\` | ${item.consumers.length ? item.consumers.map((c) => `\`${c}\``).join(', ') : '—'} |`,
  ),
  '',
  '## 信号 B：插件 CSS 中的硬编码色值（绕过 Token）',
  '',
  '| 包名 | 硬编码次数 | 是否已有夹具 | 示例（前 3 处） |',
  '| --- | --- | --- | --- |',
  ...hardcodedPackages.map((pkg) => {
    const samples = pkg.hardcodedSamples
      .slice(0, 3)
      .map((s) => `\`${s.prop}: ${s.colors.join(', ')}\``)
      .join('<br>')
    return `| \`${pkg.shortName}\` | ${pkg.hardcodedCount} | ${pkg.inFixtures ? '是' : '**否**'} | ${samples} |`
  }),
  '',
  '## 信号 C：无夹具且含 CSS 的 UI 包（建议补夹具优先级）',
  '',
  '| 优先级 | 包名 | 消费漏覆写 Token 数 | 硬编码色数 | 漏覆写 Token |',
  '| --- | --- | --- | --- | --- |',
  ...uncoveredCssPackages.map(
    (pkg, i) =>
      `| ${i + 1} | \`${pkg.shortName}\` | ${pkg.uncoveredAliasTokens.length} | ${pkg.hardcodedCount} | ${pkg.uncoveredAliasTokens.map((t) => `\`${t}\``).join(', ') || '—'} |`,
  ),
  '',
]
await writeFile(mdPath, mdLines.join('\n'))

console.log(
  `[audit] DSH ${dshVersion}: ${report.summary.totalUiPackages} UI packages (${report.summary.uiPackagesWithCss} with CSS, ${report.summary.coveredUiPackages} in fixtures)`,
)
console.log(`[audit] Signal A (uncovered semantic color tokens): ${uncoveredTokens.length}`)
console.log(`[audit] Signal B (packages with hardcoded colors): ${hardcodedPackages.length}`)
console.log(`[audit] Signal C (CSS packages without fixtures): ${uncoveredCssPackages.length}`)
console.log(
  `[audit] Top priority uncovered packages: ${uncoveredCssPackages
    .slice(0, 8)
    .map((p) => p.shortName)
    .join(', ')}`,
)
console.log(`[audit] Wrote ${mdPath}`)
