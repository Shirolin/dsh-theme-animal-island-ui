#!/usr/bin/env node
/*
 * Optional local performance comparison for the Animal Island skin.
 *
 * The harness uses the same extracted DSH runtime and Chrome discovery rules as
 * the visual fixtures. It compares an unskinned baseline with the built skin,
 * then writes machine-readable measurements and reduced-motion screenshots to
 * `.tmp/perf`. Numbers vary by Chrome/GPU, so this stays out of `pnpm check`.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readDshFrontendCss, readDshThemeBaseCss } from './dsh-runtime.mjs'
import { buildOwnedSkinCss } from './owned-skin-css.mjs'
import { prepareDshRuntime } from './prepare-dsh-runtime.mjs'
import { buildTokenOverrides } from '../lib/tokens.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(root, '.tmp', 'perf')
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const chrome = chromeCandidates.find((candidate) => existsSync(candidate))

if (chrome === undefined) throw new Error('Chrome not found; pass CHROME_PATH or install Google Chrome')
if (typeof WebSocket === 'undefined') throw new Error('Node 22+ is required for the performance harness WebSocket client')

const dsh = prepareDshRuntime()
const [dshCss, themeBaseCss, skinCss] = await Promise.all([readDshFrontendCss(dsh), readDshThemeBaseCss(dsh), buildOwnedSkinCss()])
const overrides = buildTokenOverrides()
const tokenVars = (mode) =>
  Object.entries(overrides)
    .map(([name, value]) => `${name}:${value[mode]}`)
    .join(';')

// Midpoints from the pre-optimization audit. They make the local delta visible,
// while same-run baseline ratios remain the noise-tolerant comparison.
const PRE_OPTIMIZATION_REFERENCE = {
  scrollTaskMs: { min: 308, max: 392, midpoint: 350 },
  streamingPerIterationMs: { min: 0.88, max: 0.97, midpoint: 0.925 },
  appearancePerUpdateMs: { min: 19, max: 20, midpoint: 19.5 },
}

function rows(count) {
  return Array.from(
    { length: count },
    (_, index) => `
      <article class="perf-message" data-index="${index}">
        <div class="perf-message__head">
          <strong class="perf-message__title">消息 ${index + 1}</strong>
          <button type="button" class="perf-row-button">复制</button>
        </div>
        <p>这是一段用于测量样式失效、布局与滚动的代表性会话内容。Streaming updates replace this text frequently.</p>
        <pre><code>const value = ${index};</code></pre>
      </article>`,
  ).join('')
}

function page({ withSkin, mode }) {
  return `<!doctype html>
<html lang="zh-CN" ${withSkin ? 'data-dsh-animal-island-skin="active"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Animal Island performance harness</title>
<style>${dshCss}</style>
<style>${themeBaseCss}</style>
${withSkin ? `<style>${skinCss}</style>` : ''}
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; min-height: 100%; }
  body { overflow: hidden; }
  .perf-shell { display: flex; width: 100vw; height: 100vh; }
  .perf-sidebar { width: 280px; flex: none; overflow: hidden; padding: 0 14px 16px; }
  .perf-logo-row { height: 80px; display: flex; align-items: center; }
  .perf-ticket { width: 216px; height: 60px; margin: 0 auto; border: 0; }
  .perf-nav-row { display: block; width: 100%; height: 38px; margin: 2px 0; text-align: left; }
  .perf-main { display: flex; min-width: 0; flex: 1; flex-direction: column; }
  .perf-header { position: relative; flex: none; height: 58px; display: flex; align-items: center; padding: 0 18px; }
  .perf-header nav { min-width: 260px; }
  .perf-scroll { min-height: 0; flex: 1; overflow: auto; scrollbar-gutter: stable; }
  .perf-content { width: min(900px, calc(100% - 48px)); margin: 0 auto; padding: 20px 0 40px; }
  .perf-hero { position: relative; width: 100%; min-height: 142px; margin: 0 0 18px; }
  .perf-hero__slot { display: contents; }
  .perf-message { margin: 12px 0; padding: 16px 18px; border: 1px solid rgba(100, 80, 50, .18); border-radius: 16px; background: rgba(255, 255, 255, .55); }
  .perf-message__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .perf-row-button { padding: 6px 12px; }
  .perf-message p { margin: 10px 0; }
  .perf-message pre { margin: 0; overflow: hidden; }
  .perf-composer { flex: none; min-height: 132px; margin: 12px 24px 22px; padding: 18px 20px; }
  .perf-composer__line { display: flex; align-items: center; gap: 10px; }
  .perf-composer input { flex: 1; min-width: 0; height: 42px; padding: 0 14px; }
  .perf-icon-button { width: 40px; height: 40px; padding: 0; }
  .perf-svg { width: 20px; height: 20px; }
  .perf-appearance-probe { position: fixed; top: 0; left: -2000px; width: 520px; }
</style>
</head>
<body style="${tokenVars(mode)}" ${mode === 'dark' ? 'data-ds-dark-theme=""' : ''}>
<div class="perf-shell">
  <aside class="perf-sidebar">
    <div class="perf-logo-row">
      <button type="button" class="perf-ticket" aria-label="新会话">
        <span>
          <span class="perf-ticket__mark">
            <div class="animal-island-brand__mark"><svg viewBox="0 0 64 64" width="30" height="30"><path d="M32 6C19 16 10 27 10 38c0 11 10 18 22 18s22-7 22-18C54 27 45 16 32 6Z" fill="#6cc35a"/></svg></div>
          </span>
          <span class="perf-ticket__name"><span class="animal-island-brand__name"><strong>动森岛</strong><small>ANIMAL ISLAND</small></span></span>
        </span>
      </button>
    </div>
    ${Array.from({ length: 36 }, (_, index) => `<button class="perf-nav-row" role="treeitem" aria-selected="${index === 0}" type="button">会话 ${index + 1}</button>`).join('')}
  </aside>
  <main class="perf-main">
    <header class="perf-header">
      <nav><span>项目 / 会话标题</span></nav>
      <div data-conversation-header-corner></div>
    </header>
    <div class="perf-scroll" id="perf-scroll">
      <div class="perf-content" id="perf-content">
        <div class="perf-hero">
          <span>
            <div class="perf-hero__slot">
              <div class="animal-island-hero__brand">
                <svg class="animal-island-hero__scenery animal-island-hero__scenery--day" viewBox="0 0 700 154" aria-hidden="true">
                  <circle class="animal-island-hero__scene-sun-glow" cx="505" cy="45" r="78" fill="#ffeaa0"/>
                  <circle cx="505" cy="45" r="24" fill="#f5dc88"/>
                  <g class="animal-island-hero__scene-cloud animal-island-hero__scene-cloud--one"><path d="M61 52c-3-13 11-22 23-16 4-14 25-14 30 1 13-2 20 8 14 17-12 7-52 7-67-2Z" fill="#fff9e8"/></g>
                  <g class="animal-island-hero__scene-cloud animal-island-hero__scene-cloud--two"><path d="M577 79c-2-10 8-17 18-13 3-11 20-11 24 1 10-1 16 6 11 13-10 6-40 6-53-1Z" fill="#fff9e8"/></g>
                  <path d="M0 125c67-15 108 1 165-9 55-10 87-25 143-18 57 7 94-7 145 0 64 7 100 20 154 14 42-5 72-6 93 3v39H0Z" fill="#9ed4ad"/>
                </svg>
                <svg class="animal-island-hero__scenery animal-island-hero__scenery--night" viewBox="0 0 700 154" aria-hidden="true">
                  <circle class="animal-island-hero__scene-moon-glow" cx="505" cy="43" r="76" fill="#d7ead1"/>
                  <circle cx="505" cy="43" r="25" fill="#f6e6b4"/>
                  <g class="animal-island-hero__scene-stars" fill="#fff3c5"><circle cx="96" cy="28" r="1.6"/><circle cx="154" cy="57" r="1.2"/><circle cx="227" cy="25" r="1.8"/></g>
                  <g class="animal-island-hero__scene-fireflies" fill="#f6d878"><circle cx="104" cy="113" r="2.2"/><circle cx="165" cy="132" r="1.8"/></g>
                </svg>
              </div>
            </div>
          </span>
          <span><span>探索未至之境</span><span>ISLAND 01</span></span>
        </div>
        <div id="perf-messages">${rows(320)}</div>
      </div>
    </div>
    <form class="perf-composer" data-composer-card>
      <div class="perf-composer__line">
        <button type="button" class="perf-icon-button" aria-label="工作区"><span>工作区</span><svg class="perf-svg" viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor"/></svg></button>
        <input id="perf-input" placeholder="输入消息" />
        <button type="button" class="perf-icon-button" aria-label="发送消息"><svg class="perf-svg" viewBox="0 0 16 16"><path d="m2 8 12-6-4 12-2-4-6-2Z" fill="currentColor"/></svg></button>
      </div>
    </form>
  </main>
</div>
<div class="animal-island-appearance perf-appearance-probe" aria-hidden="true">
  <div class="animal-island-appearance__preview">
    <div class="animal-island-appearance__preview-sheet">
      <strong>动森岛</strong>
      <span>今天的岛也是绿油油的。</span>
    </div>
  </div>
</div>
<script>
(() => {
  const scroll = document.getElementById('perf-scroll')
  const paragraph = document.querySelector('.perf-message p')
  const main = document.querySelector('.perf-main')
  const root = document.documentElement
  const hero = document.querySelector('.perf-hero')
  const appearanceProbe = document.querySelector('.perf-appearance-probe')
  const appearancePreviewSheet = document.querySelector('.perf-appearance-probe .animal-island-appearance__preview-sheet')

  function summarize(values) {
    const sorted = [...values].sort((a, b) => a - b)
    const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0
    return {
      frames: values.length,
      meanMs: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length),
      p50Ms: at(0.5),
      p95Ms: at(0.95),
      maxMs: sorted.at(-1) ?? 0,
      over25ms: values.filter((value) => value > 25).length,
      over50ms: values.filter((value) => value > 50).length,
    }
  }

  function frameBench(durationMs) {
    return new Promise((done) => {
      const intervals = []
      let last = performance.now()
      const start = last
      function frame(now) {
        intervals.push(now - last)
        last = now
        const progress = Math.min(1, (now - start) / durationMs)
        const max = scroll.scrollHeight - scroll.clientHeight
        scroll.scrollTop = Math.round(max * progress)
        if (progress < 1) requestAnimationFrame(frame)
        else done(summarize(intervals.slice(5)))
      }
      scroll.scrollTop = 0
      requestAnimationFrame(frame)
    })
  }

  async function streamingBench(iterations = 160) {
    scroll.scrollTop = 0
    await new Promise((done) => requestAnimationFrame(done))
    const start = performance.now()
    for (let index = 0; index < iterations; index += 1) {
      paragraph.textContent = '流式内容 ' + index + ' — Streaming text updates one message while the rest of the conversation stays unchanged.'
      paragraph.getBoundingClientRect()
    }
    return {
      elapsedMs: performance.now() - start,
      perIterationMs: (performance.now() - start) / iterations,
    }
  }

  function appearanceBench(iterations = 120) {
    const start = performance.now()
    for (let index = 0; index < iterations; index += 1) {
      root.style.setProperty('--animal-canvas-veil', String(0.2 + (index % 40) / 100))
      getComputedStyle(main).backgroundColor
    }
    return {
      elapsedMs: performance.now() - start,
      perIterationMs: (performance.now() - start) / iterations,
    }
  }

  function appearanceDraftBench(iterations = 120) {
    const start = performance.now()
    for (let index = 0; index < iterations; index += 1) {
      appearanceProbe.style.setProperty('--animal-appearance-draft', String(0.2 + (index % 40) / 100))
      getComputedStyle(appearancePreviewSheet).backgroundColor
    }
    return {
      elapsedMs: performance.now() - start,
      perIterationMs: (performance.now() - start) / iterations,
    }
  }

  function heroAnimations() {
    return document.getAnimations()
      .filter((animation) => {
        const target = animation.effect?.target
        return target instanceof Element && hero.contains(target)
      })
      .map((animation) => {
        const target = animation.effect.target
        return {
          name: animation.animationName || '',
          state: animation.playState,
          target: target.getAttribute('class') || '',
          scene: target.closest('.animal-island-hero__scenery--day')
            ? 'day'
            : target.closest('.animal-island-hero__scenery--night')
              ? 'night'
              : 'title',
        }
      })
  }

  function heroComputedStyle() {
    const title = document.querySelector('.perf-hero > span + span')
    const badge = title.querySelector(':scope > span + span')
    const day = document.querySelector('.animal-island-hero__scenery--day')
    const night = document.querySelector('.animal-island-hero__scenery--night')
    const selected = (node) => {
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        color: style.color,
        fontSize: style.fontSize,
        textShadow: style.textShadow,
        transform: style.transform,
        opacity: style.opacity,
      }
    }
    return {
      hero: selected(hero),
      title: selected(title),
      badge: selected(badge),
      day: selected(day),
      night: selected(night),
    }
  }

  window.__perf = { frameBench, streamingBench, appearanceBench, appearanceDraftBench, heroAnimations, heroComputedStyle }
})()
</script>
</body>
</html>`
}

async function waitForFile(file, timeoutMs = 15000) {
  const start = Date.now()
  while (!existsSync(file)) {
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for ${file}`)
    await delay(50)
  }
  return readFile(file, 'utf8')
}

function makeClient(socket) {
  let id = 1
  const pending = new Map()
  const listeners = new Set()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data))
    if (message.id) {
      const entry = pending.get(message.id)
      if (!entry) return
      pending.delete(message.id)
      if (message.error) entry.reject(new Error(`${message.error.message} (${message.error.code})`))
      else entry.resolve(message.result)
      return
    }
    for (const listener of listeners) listener(message)
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const requestId = id++
      pending.set(requestId, { resolve, reject })
      socket.send(JSON.stringify({ id: requestId, method, params }))
    })
  send.once = (method, timeoutMs = 15000) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        listeners.delete(listener)
        reject(new Error(`timed out waiting for ${method}`))
      }, timeoutMs)
      const listener = (message) => {
        if (message.method !== method) return
        clearTimeout(timer)
        listeners.delete(listener)
        resolve(message.params)
      }
      listeners.add(listener)
    })
  return send
}

async function metrics(send) {
  const result = await send('Performance.getMetrics')
  return Object.fromEntries(result.metrics.map(({ name, value }) => [name, value]))
}

function metricDelta(before, after, names) {
  return Object.fromEntries(names.map((name) => [name, (after[name] ?? 0) - (before[name] ?? 0)]))
}

const metricNames = ['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration', 'RecalcStyleCount', 'LayoutCount']

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  }
  return result.result.value
}

async function navigate(send, url) {
  const loaded = send.once('Page.loadEventFired')
  await send('Page.navigate', { url })
  await loaded
  await delay(700)
}

async function setReducedMotion(send, reduce) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  })
}

async function runMeasuredVariant(send, variant) {
  await setReducedMotion(send, false)
  await navigate(send, variant.url)
  const facts = await evaluate(
    send,
    `({
      nodes: document.querySelectorAll('*').length,
      animations: window.__perf.heroAnimations(),
      computedStyle: window.__perf.heroComputedStyle(),
      scrollHeight: document.getElementById('perf-scroll').scrollHeight,
      clientHeight: document.getElementById('perf-scroll').clientHeight,
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    })`,
  )

  const beforeScroll = await metrics(send)
  const scroll = await evaluate(send, 'window.__perf.frameBench(2300)')
  const afterScroll = await metrics(send)

  const beforeStreaming = await metrics(send)
  const streaming = await evaluate(send, 'window.__perf.streamingBench(160)')
  const afterStreaming = await metrics(send)

  const beforeAppearance = await metrics(send)
  const appearance = await evaluate(send, 'window.__perf.appearanceBench(120)')
  const afterAppearance = await metrics(send)

  const beforeAppearanceDraft = await metrics(send)
  const appearanceDraft = await evaluate(send, 'window.__perf.appearanceDraftBench(120)')
  const afterAppearanceDraft = await metrics(send)

  return {
    facts,
    scroll: {
      ...scroll,
      metricDelta: metricDelta(beforeScroll, afterScroll, metricNames),
    },
    streaming: {
      ...streaming,
      metricDelta: metricDelta(beforeStreaming, afterStreaming, metricNames),
    },
    appearance: {
      ...appearance,
      metricDelta: metricDelta(beforeAppearance, afterAppearance, metricNames),
    },
    appearanceDraft: {
      ...appearanceDraft,
      metricDelta: metricDelta(beforeAppearanceDraft, afterAppearanceDraft, metricNames),
    },
  }
}

async function captureReducedMotion(send, variant) {
  await setReducedMotion(send, true)
  await navigate(send, `${variant.url}?reduced-motion=1`)
  const facts = await evaluate(
    send,
    `({
      animations: window.__perf.heroAnimations(),
      computedStyle: window.__perf.heroComputedStyle(),
      prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      rect: (() => {
        const rect = document.querySelector('.perf-hero').getBoundingClientRect()
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      })(),
    })`,
  )
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    clip: { ...facts.rect, scale: 1 },
  })
  const screenshot = join(outputDir, `hero-${variant.mode}-reduced.png`)
  await writeFile(screenshot, Buffer.from(shot.data, 'base64'))
  return { ...facts, screenshot }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function summarizeResults(id, results) {
  const facts = results.at(-1).facts
  const scrollTasks = results.map((result) => result.scroll.metricDelta.TaskDuration * 1000)
  const streamingRates = results.map((result) => result.streaming.perIterationMs)
  const appearanceRates = results.map((result) => result.appearance.perIterationMs)
  const appearanceDraftRates = results.map((result) => result.appearanceDraft.perIterationMs)
  return {
    id,
    runs: results.length,
    nodes: facts.nodes,
    scrollHeight: facts.scrollHeight,
    clientHeight: facts.clientHeight,
    animations: facts.animations,
    computedStyle: facts.computedStyle,
    scroll: {
      taskMsSamples: scrollTasks,
      taskMs: median(scrollTasks),
      frames: results.map((result) => result.scroll),
    },
    streaming: {
      perIterationMsSamples: streamingRates,
      perIterationMs: median(streamingRates),
      recalcStyleMsSamples: results.map((result) => result.streaming.metricDelta.RecalcStyleDuration * 1000),
    },
    appearance: {
      perUpdateMsSamples: appearanceRates,
      perUpdateMs: median(appearanceRates),
      recalcStyleMsSamples: results.map((result) => result.appearance.metricDelta.RecalcStyleDuration * 1000),
    },
    appearanceDraft: {
      perUpdateMsSamples: appearanceDraftRates,
      perUpdateMs: median(appearanceDraftRates),
      recalcStyleMsSamples: results.map((result) => result.appearanceDraft.metricDelta.RecalcStyleDuration * 1000),
    },
  }
}

await mkdir(outputDir, { recursive: true })
const variants = ['light', 'dark'].flatMap((mode) =>
  [
    { id: `baseline-${mode}`, mode, withSkin: false },
    { id: `skin-${mode}`, mode, withSkin: true },
  ].map((variant) => {
    const file = join(outputDir, `${variant.id}.html`)
    return { ...variant, file, url: pathToFileURL(file).href }
  }),
)
await Promise.all(variants.map((variant) => writeFile(variant.file, page(variant))))

const profile = join(tmpdir(), `animal-island-perf-${process.pid}`)
await rm(profile, { recursive: true, force: true })
await mkdir(profile, { recursive: true })
const child = spawn(
  chrome,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-sync',
    '--disable-features=Translate,MediaRouter,OptimizationHints',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--force-device-scale-factor=1',
    '--window-size=1440,900',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

try {
  const portFile = join(profile, 'DevToolsActivePort')
  const [port] = (await waitForFile(portFile)).trim().split(/\r?\n/)
  let targets
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      targets = await response.json()
      if (targets.some((target) => target.type === 'page')) break
    } catch {}
    await delay(50)
  }
  const target = targets?.find((entry) => entry.type === 'page')
  if (!target) throw new Error('Chrome page target not found')
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  const send = makeClient(socket)
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Performance.enable')

  const rawResults = Object.fromEntries(variants.map((variant) => [variant.id, []]))
  for (const order of [variants, [...variants].reverse()]) {
    for (const variant of order) rawResults[variant.id].push(await runMeasuredVariant(send, variant))
  }

  const summaries = Object.fromEntries(variants.map((variant) => [variant.id, summarizeResults(variant.id, rawResults[variant.id])]))
  const reducedMotion = {}
  for (const mode of ['light', 'dark']) {
    reducedMotion[mode] = await captureReducedMotion(
      send,
      variants.find((variant) => variant.id === `skin-${mode}`),
    )
  }
  socket.close()

  const skinLight = summaries['skin-light']
  const baselineLight = summaries['baseline-light']
  const checks = {
    lightHasNoNightAnimation: skinLight.animations.every((animation) => animation.scene !== 'night'),
    darkHasNoDayAnimation: summaries['skin-dark'].animations.every((animation) => animation.scene !== 'day'),
    reducedMotionHasNoHeroAnimation: Object.values(reducedMotion).every((entry) => entry.animations.length === 0),
    scrollAtLeast20PercentFasterThanAudit: 1 - skinLight.scroll.taskMs / PRE_OPTIMIZATION_REFERENCE.scrollTaskMs.midpoint >= 0.2,
    streamingAtLeast30PercentFasterThanAudit: 1 - skinLight.streaming.perIterationMs / PRE_OPTIMIZATION_REFERENCE.streamingPerIterationMs.midpoint >= 0.3,
    streamingWithinTwiceBaseline: skinLight.streaming.perIterationMs <= baselineLight.streaming.perIterationMs * 2,
    appearanceGlobalWithinFrameBudget: skinLight.appearance.perUpdateMs <= 16.7,
    appearanceDraftWithinFrameBudget: skinLight.appearanceDraft.perUpdateMs <= 16.7,
  }
  const report = {
    generatedAt: new Date().toISOString(),
    environment: {
      chrome,
      dsh,
      viewport: { width: 1440, height: 900 },
      node: process.version,
      platform: process.platform,
    },
    preOptimizationReference: PRE_OPTIMIZATION_REFERENCE,
    relativeToAudit: {
      scrollReduction: 1 - skinLight.scroll.taskMs / PRE_OPTIMIZATION_REFERENCE.scrollTaskMs.midpoint,
      streamingReduction: 1 - skinLight.streaming.perIterationMs / PRE_OPTIMIZATION_REFERENCE.streamingPerIterationMs.midpoint,
      appearanceReduction: 1 - skinLight.appearance.perUpdateMs / PRE_OPTIMIZATION_REFERENCE.appearancePerUpdateMs.midpoint,
    },
    checks,
    summaries,
    reducedMotion,
    rawResults,
  }
  const reportPath = join(outputDir, 'report.json')
  await writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ reportPath, checks, summaries, reducedMotion }, null, 2))
} finally {
  child.kill()
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
