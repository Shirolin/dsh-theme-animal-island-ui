#!/usr/bin/env node
// Screenshot a running Electron/Chromium page over the DevTools Protocol.
//
// This is the desktop equivalent of Playwright's Page.captureScreenshot: it
// reads the renderer's compositor surface, so it does not care about window
// z-order, occlusion, or whether the window is in the foreground. It also sees
// GPU-composited text/filters that PrintWindow/GDI misses.
//
// Prerequisite: the app was started with --remote-debugging-port=9222
// (see scripts/dsh-desktop-debug.cmd).
//
// Usage:
//   node scripts/cdp-shot.mjs --out artifacts/smoke/desktop.png
//   node scripts/cdp-shot.mjs --port 9222 --out shot.png --full
//   node scripts/cdp-shot.mjs --target "DeepSeek Harness" --out shot.png

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

function parseArgs(argv) {
  const args = { port: 9222, out: 'desktop.png', full: false, target: '', timeout: 20000 }
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--port') args.port = Number(argv[++i])
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--full') args.full = true
    else if (arg === '--target') args.target = argv[++i]
    else if (arg === '--timeout') args.timeout = Number(argv[++i])
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (!Number.isInteger(args.port) || args.port <= 0) throw new Error('--port must be a positive integer')
  if (!args.out) throw new Error('--out is required')
  return args
}

async function fetchTargets(port, timeout) {
  const url = `http://127.0.0.1:${port}/json/list`
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout) })
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  return response.json()
}

function pickTarget(targets, needle) {
  const pages = targets.filter((target) => target.type === 'page' && target.webSocketDebuggerUrl)
  if (pages.length === 0) throw new Error('no page targets with webSocketDebuggerUrl')
  const matches = (target) =>
    !needle || `${target.title || ''} ${target.url || ''}`.toLowerCase().includes(needle.toLowerCase())
  const preferred = pages.filter((target) => matches(target) && !String(target.url).startsWith('devtools://'))
  return preferred[0] ?? pages.find((target) => !String(target.url).startsWith('devtools://')) ?? pages[0]
}

function connect(url, timeout) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    const timer = setTimeout(() => {
      socket.close()
      reject(new Error(`websocket open timed out after ${timeout}ms`))
    }, timeout)
    socket.addEventListener('open', () => {
      clearTimeout(timer)
      resolve(socket)
    }, { once: true })
    socket.addEventListener('error', () => {
      clearTimeout(timer)
      reject(new Error('websocket connection failed'))
    }, { once: true })
  })
}

function makeClient(socket) {
  let nextId = 1
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    let message
    try {
      message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data))
    } catch {
      return
    }
    if (!message.id) return
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) entry.reject(new Error(`${message.error.message} (${message.error.code})`))
    else entry.resolve(message.result)
  })
  return (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function main() {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Node 22+ is required for the CDP helper (global WebSocket); Node 20 needs --experimental-websocket')
  }
  const args = parseArgs(process.argv)
  const targets = await fetchTargets(args.port, args.timeout)
  const target = pickTarget(targets, args.target)
  const socket = await connect(target.webSocketDebuggerUrl, args.timeout)
  try {
    const send = makeClient(socket)
    await send('Page.enable')
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: args.full,
    })
    const out = resolve(args.out)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, Buffer.from(shot.data, 'base64'))
    console.log(JSON.stringify({
      ok: true,
      out,
      target: { title: target.title, url: target.url },
      bytes: Buffer.byteLength(shot.data, 'base64'),
    }, null, 2))
  } finally {
    socket.close()
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message,
    hint: 'start DeepSeek Harness with --remote-debugging-port=9222 (scripts/dsh-desktop-debug.cmd), then retry',
  }, null, 2))
  process.exit(1)
})
