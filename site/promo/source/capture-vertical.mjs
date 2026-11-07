#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9333 + Math.floor(Math.random() * 300)
const profile = join(here, `.chrome-capture-${port}`)
const draft = process.argv.includes('--draft')
const outArg = process.argv.find((argument) => argument.startsWith('--out='))
const frames = join(here, outArg ? outArg.slice(6) : draft ? 'frames-draft' : 'frames-vertical')
const dsf = draft ? 1 : 2
const variantArg = process.argv.find((argument) => argument.startsWith('--variant='))
const variant = variantArg ? variantArg.slice(10) : ''
const pageUrl = `${pathToFileURL(join(here, 'stage-vertical.html')).href}?capture=1${variant ? `&variant=${variant}` : ''}`
const fpsArg = process.argv.find((argument) => argument.startsWith('--fps='))
const fps = fpsArg ? Number(fpsArg.slice(6)) : 30
const force = process.argv.includes('--force')
const maxFramesArg = process.argv.find((argument) => argument.startsWith('--frames='))
const maxFrames = maxFramesArg ? Number(maxFramesArg.slice(9)) : Infinity
const startArg = process.argv.find((argument) => argument.startsWith('--start='))
const startTime = startArg ? Number(startArg.slice(8)) : 0
const duration = 30

if (!Number.isFinite(fps) || fps < 1) throw new Error(`invalid fps: ${fps}`)

if (force) {
  await rm(profile, { recursive: true, force: true })
  await rm(frames, { recursive: true, force: true })
}
await mkdir(profile, { recursive: true })
await mkdir(frames, { recursive: true })

const child = spawn(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--window-size=1080,1440',
    '--force-device-scale-factor=2',
    pageUrl,
  ],
  { stdio: 'ignore', windowsHide: true },
)

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds))

async function getPage() {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      const pages = await response.json()
      const page = pages.find((entry) => entry.type === 'page')
      if (page?.webSocketDebuggerUrl) return page
    } catch {
      // Chrome is still starting.
    }
    await wait(100)
  }
  throw new Error('Chrome DevTools endpoint did not become ready')
}

const page = await getPage()
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true })
  socket.addEventListener('error', rejectOpen, { once: true })
})

let nextId = 0
const pending = new Map()

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const entry = pending.get(message.id)
  if (!entry) return
  pending.delete(message.id)
  if (message.error) entry.reject(new Error(`${message.error.message}: ${JSON.stringify(message.error.data ?? {})}`))
  else entry.resolve(message.result)
})

function send(method, params = {}) {
  const id = ++nextId
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(id, { resolve: resolveCommand, reject: rejectCommand })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result?.value
}

try {
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1080,
    height: 1440,
    deviceScaleFactor: dsf,
    mobile: false,
  })
  await send('Page.navigate', { url: pageUrl })

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const ready = await evaluate('window.__PROMO_READY__ === true')
    if (ready) break
    if (attempt === 199) throw new Error('promo stage did not become ready')
    await wait(100)
  }

  const frameCount = Math.min(Math.round(duration * fps), maxFrames)
  for (let index = 0; index < frameCount; index += 1) {
    const time = startTime + index / fps
    await evaluate(
      `(async () => { await window.renderAt(${time}); await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))) })()`,
      true,
    )
    const screenshotParams = {
      format: 'jpeg',
      quality: 94,
      fromSurface: true,
      captureBeyondViewport: false,
    }
    if (draft) screenshotParams.clip = { x: 0, y: 0, width: 1080, height: 1440, scale: 0.5 }
    const screenshot = await send('Page.captureScreenshot', screenshotParams)
    const target = join(frames, `${String(index).padStart(5, '0')}.jpg`)
    await writeFile(target, Buffer.from(screenshot.data, 'base64'))
    if (index % Math.max(1, Math.round(fps * 2)) === 0) {
      console.log(`captured ${index}/${frameCount} (${time.toFixed(2)}s)`)
    }
  }
  console.log(`capture complete: ${frameCount} frames at ${fps} fps`)
} finally {
  socket.close()
  child.kill()
}

if (!existsSync(join(frames, '00000.jpg'))) throw new Error('first frame is missing')
