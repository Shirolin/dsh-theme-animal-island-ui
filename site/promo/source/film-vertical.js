const DURATION = 30

const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const progress = (time, start, end) => clamp01((time - start) / (end - start))
const smooth = (value) => {
  const x = clamp01(value)
  return x * x * (3 - 2 * x)
}
const easeOut = (value) => 1 - (1 - clamp01(value)) ** 3
const easeInOut = (value) => {
  const x = clamp01(value)
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2
}
const mix = (from, to, amount) => from + (to - from) * amount
const windowFade = (time, start, end, feather = 0.35) => smooth(progress(time, start, start + feather)) * (1 - smooth(progress(time, end - feather, end)))

const intro = $('#intro')
const introPlate = $('#intro-plate')
const introCopy = $('#intro-copy')
const coverCard = $('#cover-card')
const ticketWrap = $('#ticket-wrap')
const tearSignal = $('#tear-signal')
const ticketSource = $('#boarding-ticket')
ticketSource.removeAttribute('id')
const ticketLeft = ticketSource.cloneNode(true)
const ticketRight = ticketSource.cloneNode(true)
ticketLeft.classList.add('ticket-half', 'left')
ticketRight.classList.add('ticket-half', 'right')
ticketWrap.replaceChildren(ticketLeft, ticketRight, tearSignal)
const uiScene = $('#ui-scene')
const screenViewport = $('#screen-viewport')
const screenShell = $('#screen-shell')
const screenImages = $$('.screen-img')
const screenHighlight = $('#screen-highlight')
const dragVideo = $('#drag-video')
const workspaceVideo = $('#workspace-video')
const screenPointer = $('#screen-pointer')
const ambientNight = $('.ambient-night')
const ambientDayElement = $('.ambient-day')
const copyZoneDay = $('#copy-zone-day')
const copyZoneNight = $('#copy-zone-night')
const beatRail = $('#beat-rail')
const beatItems = $$('#beat-rail li')
const outro = $('#outro')
const outroDay = $('#outro-day')
const outroNight = $('#outro-night')
const outroCopy = $('#outro-copy')
const outroRule = $('#outro-rule')
const transitionLayer = $('#transition-layer')
const transitionBand = $('.transition-band')
const transitionMark = $('.transition-mark')
const grain = $('.grain')
const endFade = $('#end-fade')
const canvas = $('#fx')
const ctx = canvas.getContext('2d')
const WIDTH = 1080
const HEIGHT = 1440

const copyBlocks = {
  workspace: $('#copy-workspace'),
  appearance: $('#copy-appearance'),
  night: $('#copy-night'),
  keys: $('#copy-keys'),
}

const cameraKeys = [
  { t: 3.2, x: 192, y: 60, s: 0.96 },
  { t: 5.0, x: 192, y: 60, s: 0.96 },
  { t: 5.9, x: 60, y: -140, s: 1.1 },
  { t: 8.15, x: 58, y: -143, s: 1.105 },
  { t: 8.45, x: 60, y: -140, s: 1.1 },
  { t: 8.95, x: 192, y: 60, s: 0.96 },
  { t: 10.47, x: 192, y: 60, s: 0.96 },
  { t: 10.5, x: 192, y: 60, s: 0.96 },
  { t: 11.0, x: 150, y: 20, s: 1.03 },
  { t: 11.8, x: 150, y: 20, s: 1.03 },
  { t: 12.7, x: 70, y: -24, s: 1.12 },
  { t: 15.15, x: 68, y: -26, s: 1.125 },
  { t: 15.75, x: 192, y: 60, s: 0.96 },
  { t: 16.4, x: 192, y: 60, s: 0.96 },
  { t: 17.0, x: 194, y: 58, s: 0.98 },
  { t: 18.3, x: 70, y: -24, s: 1.12 },
  { t: 19.7, x: 68, y: -26, s: 1.125 },
  { t: 20.2, x: 192, y: 60, s: 0.96 },
  { t: 21.0, x: 192, y: 60, s: 0.96 },
  { t: 22.3, x: -280, y: -300, s: 1.2 },
  { t: 24.0, x: -282, y: -302, s: 1.205 },
]

function monotoneTangents(values) {
  const count = cameraKeys.length
  const slopes = []
  for (let index = 0; index < count - 1; index += 1) {
    const span = cameraKeys[index + 1].t - cameraKeys[index].t
    slopes.push((values[index + 1] - values[index]) / span)
  }
  const tangents = new Array(count).fill(0)
  for (let index = 1; index < count - 1; index += 1) {
    const before = slopes[index - 1]
    const after = slopes[index]
    if (before === 0 || after === 0 || before * after < 0) continue
    const h0 = cameraKeys[index].t - cameraKeys[index - 1].t
    const h1 = cameraKeys[index + 1].t - cameraKeys[index].t
    const w0 = 2 * h1 + h0
    const w1 = h1 + 2 * h0
    tangents[index] = (w0 + w1) / (w0 / before + w1 / after)
  }
  return tangents
}

const cameraValues = {
  x: cameraKeys.map((key) => key.x),
  y: cameraKeys.map((key) => key.y),
  s: cameraKeys.map((key) => key.s),
}
const cameraTangents = {
  x: monotoneTangents(cameraValues.x),
  y: monotoneTangents(cameraValues.y),
  s: monotoneTangents(cameraValues.s),
}

function sampleHermite(values, tangents, index, time) {
  const current = cameraKeys[index]
  const next = cameraKeys[index + 1]
  const span = next.t - current.t
  const amount = clamp01((time - current.t) / span)
  const a2 = amount * amount
  const a3 = a2 * amount
  const h00 = 2 * a3 - 3 * a2 + 1
  const h10 = a3 - 2 * a2 + amount
  const h01 = -2 * a3 + 3 * a2
  const h11 = a3 - a2
  return h00 * values[index] + h10 * span * tangents[index] + h01 * values[index + 1] + h11 * span * tangents[index + 1]
}

function sampleCamera(time) {
  if (time <= cameraKeys[0].t) return { x: cameraKeys[0].x, y: cameraKeys[0].y, s: cameraKeys[0].s }
  const last = cameraKeys.at(-1)
  if (time >= last.t) return { x: last.x, y: last.y, s: last.s }

  let index = 0
  while (index < cameraKeys.length - 2 && time > cameraKeys[index + 1].t) index += 1
  return {
    x: sampleHermite(cameraValues.x, cameraTangents.x, index, time),
    y: sampleHermite(cameraValues.y, cameraTangents.y, index, time),
    s: sampleHermite(cameraValues.s, cameraTangents.s, index, time),
  }
}

function setLineReveal(line, amount, direction = 1) {
  const reveal = easeOut(amount)
  line.style.clipPath = `inset(0 ${(1 - reveal) * 100}% 0 0)`
  line.style.transform = `translate3d(0, ${(1 - reveal) * 34 * direction}px, 0)`
}

function renderCopyBlock(block, time, start, end, entry = 0.55) {
  if (!block) return
  const opacity = windowFade(time, start, end, 0.4)
  block.style.opacity = opacity
  block.style.transform = `translate3d(0, ${mix(24, 0, easeOut(progress(time, start, start + entry))) - 18 * progress(time, end - 0.4, end)}px, 0)`
  const lines = [...block.querySelectorAll('[data-line]')]
  for (const [index, line] of lines.entries()) {
    const lineStart = start + 0.06 + index * 0.16
    setLineReveal(line, progress(time, lineStart, lineStart + entry))
  }
  const reveals = [...block.querySelectorAll('[data-reveal]')]
  for (const [index, element] of reveals.entries()) {
    const reveal = easeOut(progress(time, start + 0.2 + index * 0.12, start + 0.55 + index * 0.12))
    element.style.opacity = reveal
    element.style.transform = `translate3d(0, ${mix(18, 0, reveal)}px, 0)`
  }
}

function setActiveScreen(name) {
  for (const image of screenImages) image.classList.toggle('is-active', image.dataset.screen === name)
}

function screenAt(time) {
  if (time < 9.45) return 'workspace-light'
  if (time < 10.5) return 'workspace-reply'
  if (time < 16.02) return 'appearance-light'
  if (time < 18.3) return 'appearance-dark'
  if (time < 20.2) return 'plugin-list-dark'
  return 'code-dark'
}

function renderIntro(time) {
  const exit = progress(time, 3.05, 4.7)
  const plateDrift = progress(time, 0, 5)
  introPlate.style.transform = `scale(${mix(1.03, 1.11, easeInOut(plateDrift))}) translate3d(${mix(0, -22, plateDrift)}px, ${mix(0, 10, plateDrift)}px, 0)`
  introPlate.style.filter = `saturate(${mix(0.94, 0.74, exit)}) contrast(${mix(1.04, 1.12, exit)}) blur(${mix(0, 3, exit)}px)`

  introCopy.style.opacity = 1 - smooth(progress(time, 2.5, 2.95))
  introCopy.style.transform = `translate3d(0, ${-24 * smooth(progress(time, 2.5, 2.95))}px, 0)`
  renderCopyBlock(introCopy, time, 0.9, 3.65, 0.62)

  const ticketIn = easeOut(progress(time, 1.46, 2.38))
  const ticketOut = easeInOut(progress(time, 3.25, 4.05))
  ticketWrap.style.opacity = ticketIn * (1 - ticketOut)
  ticketWrap.style.transform = `translate3d(0, ${mix(72, 0, ticketIn) - 52 * ticketOut}px, 0) scale(${mix(0.86, 1, ticketIn) * mix(1, 1.32, ticketOut)})`
  const split = easeInOut(progress(time, 2.64, 3.34))
  const halvesFade = 1 - smooth(progress(time, 3.32, 4.0))
  ticketLeft.style.transform = `translate3d(${-30 * split}px, ${7 * split}px, 0) rotate(${-0.7 * split}deg)`
  ticketRight.style.transform = `translate3d(${48 * split}px, ${-5 * split}px, 0) rotate(${1.5 * split}deg)`
  ticketLeft.style.setProperty('--tear', split.toFixed(3))
  ticketRight.style.setProperty('--tear', split.toFixed(3))
  ticketLeft.style.opacity = halvesFade
  ticketRight.style.opacity = halvesFade
  ticketLeft.style.filter = `brightness(${mix(0.92, 1, ticketIn)}) drop-shadow(2px 0 0 rgba(255, 250, 235, 0.5)) drop-shadow(0 30px 50px rgba(28, 14, 8, .34))`
  ticketRight.style.filter = `brightness(${mix(0.92, 1, ticketIn)}) drop-shadow(-2px 0 0 rgba(255, 250, 235, 0.5)) drop-shadow(0 30px 50px rgba(28, 14, 8, .34))`

  const tear = windowFade(time, 2.62, 3.12, 0.14)
  tearSignal.style.opacity = tear
  tearSignal.style.transform = `scaleY(${0.06 + 0.94 * easeOut(progress(time, 2.62, 3.06))})`
  tearSignal.style.filter = `brightness(${mix(0.7, 1.8, tear)})`

  intro.style.opacity = 1 - smooth(progress(time, 3.95, 4.3))
  intro.style.visibility = time >= 4.4 ? 'hidden' : 'visible'
}

function renderCover(time) {
  const lift = easeInOut(progress(time, 0.98, 1.52))
  coverCard.style.transform = `translate3d(0, ${-110 * lift}%, 0) rotate(${-0.7 * lift}deg)`
  coverCard.style.visibility = time >= 1.55 ? 'hidden' : 'visible'
}

const CARD = { width: 1000, height: 625, left: 40, top: 470, radius: 30 }

function renderScreen(time) {
  const camera = sampleCamera(time)
  const zoom = (CARD.width / 1600) * (camera.s / 0.96)

  screenViewport.style.width = `${CARD.width}px`
  screenViewport.style.height = `${CARD.height}px`
  screenViewport.style.left = `${CARD.left}px`
  screenViewport.style.top = `${CARD.top}px`
  screenViewport.style.borderRadius = `${CARD.radius}px`

  const centerX = (960 - camera.x) / camera.s
  const centerY = (540 - camera.y) / camera.s
  const shellWidth = 1600 * zoom
  const shellHeight = 1000 * zoom
  const freeX = CARD.width / 2 - centerX * zoom
  const freeY = CARD.height / 2 - centerY * zoom
  const x = shellWidth <= CARD.width ? (CARD.width - shellWidth) / 2 : Math.min(0, Math.max(CARD.width - shellWidth, freeX))
  const y = shellHeight <= CARD.height ? (CARD.height - shellHeight) / 2 : Math.min(0, Math.max(CARD.height - shellHeight, freeY))
  screenShell.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`
  return { camera, radius: CARD.radius }
}

const beatWindows = [
  { key: 'workspace', start: 5.4, end: 10.9 },
  { key: 'appearance', start: 10.9, end: 16.0 },
  { key: 'night', start: 16.0, end: 20.1 },
  { key: 'keys', start: 20.1, end: 24.4 },
]

function renderBeatRail(time) {
  const active = beatWindows.find((beat) => time >= beat.start && time < beat.end)
  for (const item of beatItems) item.classList.toggle('is-active', item.dataset.beat === active?.key)
}

function renderUi(time) {
  const visible = time >= 2.95 && time < 25.3
  uiScene.style.visibility = visible ? 'visible' : 'hidden'
  uiScene.style.opacity = 1 - smooth(progress(time, 24.22, 24.5))

  const reveal = easeInOut(progress(time, 4.0, 4.85))
  const verticalInset = mix(50, 0, reveal)
  screenViewport.style.transform = `translate3d(0, ${mix(-26, 0, reveal)}px, 0)`

  const { radius } = renderScreen(time)
  screenViewport.style.clipPath = `inset(${verticalInset}% 0% ${verticalInset}% 0% round ${radius}px)`
  setActiveScreen(screenAt(time))

  const ambientIn = smooth(progress(time, 3.45, 3.95))
  const dayNight = smooth(progress(time, 15.9, 16.55))
  ambientNight.style.opacity = dayNight * ambientIn * (1 - smooth(progress(time, 24.4, 25.25)))
  const ambientMotion = progress(time, 3.2, 25)
  ambientDayElement.style.opacity = ambientIn
  ambientDayElement.style.transform = `scale(${1.085 + 0.018 * ambientMotion}) translate3d(${mix(0, -16, ambientMotion)}px, ${mix(0, 8, ambientMotion)}px, 0)`
  ambientNight.style.transform = `scale(${1.085 + 0.018 * ambientMotion}) translate3d(${mix(0, 14, ambientMotion)}px, ${mix(0, -8, ambientMotion)}px, 0)`
  $('.ambient-wash').style.opacity = ambientIn * mix(1, 0.72, dayNight)

  const copyVisible = Math.max(
    windowFade(time, 4.96, 8.45, 0.4),
    windowFade(time, 11.0, 15.35, 0.4),
    windowFade(time, 16.16, 19.94, 0.4),
    windowFade(time, 20.37, 24.3, 0.4),
  )
  copyZoneDay.style.opacity = ambientIn * (1 - dayNight) * copyVisible
  copyZoneNight.style.opacity = ambientIn * dayNight * copyVisible
  const cardBackground = [248, 240, 221].map((channel, index) => Math.round(mix(channel, [10, 40, 47][index], dayNight)))
  screenViewport.style.background = `rgb(${cardBackground.join(',')})`
  screenViewport.classList.toggle('is-night', dayNight > 0.5)

  renderCopyBlock(copyBlocks.workspace, time, 4.96, 8.45, 0.62)
  renderCopyBlock(copyBlocks.appearance, time, 11.0, 15.35, 0.62)
  renderCopyBlock(copyBlocks.night, time, 16.16, 19.94, 0.62)
  renderCopyBlock(copyBlocks.keys, time, 20.37, 24.3, 0.62)
  renderBeatRail(time)
  beatRail.style.opacity = copyVisible

  renderHighlight(time)
}

function seekVideo(video, target) {
  if (Math.abs(video.currentTime - target) <= 0.02) return null
  return new Promise((resolve) => {
    video.addEventListener('seeked', () => resolve(), { once: true })
    video.currentTime = target
  })
}

function renderWorkspaceInteraction(time) {
  const visible = time >= 5.2 && time < 9.45
  workspaceVideo.style.opacity = visible ? 1 : 0
  if (!visible) return null

  const target = Math.min(time - 5.2 + 0.01, 5.72)
  const seek = seekVideo(workspaceVideo, target)

  const keys = [
    { t: 5.2, x: 1150, y: 820 },
    { t: 5.55, x: 700, y: 582 },
    { t: 7.95, x: 700, y: 582 },
    { t: 8.2, x: 1348, y: 637 },
    { t: 9.0, x: 1348, y: 637 },
  ]
  let pos = keys.at(-1)
  if (time <= keys[0].t) pos = keys[0]
  else {
    for (let index = 0; index < keys.length - 1; index += 1) {
      const current = keys[index]
      const next = keys[index + 1]
      if (time < current.t || time > next.t) continue
      const amount = easeInOut(progress(time, current.t, next.t))
      pos = { x: mix(current.x, next.x, amount), y: mix(current.y, next.y, amount) }
      break
    }
  }
  const pressed = (time >= 5.63 && time <= 5.7) || (time >= 8.42 && time <= 8.49)
  screenPointer.style.opacity = windowFade(time, 5.2, 8.49, 0.1)
  screenPointer.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${pressed ? 0.86 : 1})`
  return seek
}

function renderInteraction(time) {
  const visible = time >= 12.88 && time < 16.02
  dragVideo.style.opacity = visible ? 1 : 0
  if (!visible) return null

  const target = clamp01((time - 12.9) / 1.0) * 0.98 + 0.01
  const seek = seekVideo(dragVideo, target)

  const cursor = clamp01((time - 12.9) / 1.0)
  const pressed = time >= 12.84 && time <= 13.95
  screenPointer.style.opacity = windowFade(time, 12.72, 14.85, 0.16)
  screenPointer.style.transform = `translate3d(${mix(923.4, 782.1, cursor)}px, 637.4px, 0) scale(${pressed ? 0.86 : 1})`
  return seek
}

function renderSettingsClick(time) {
  const visible = time >= 17.7 && time < 18.55
  if (!visible) return
  const approach = easeInOut(progress(time, 17.7, 18.1))
  const pressed = time >= 18.14 && time <= 18.22
  screenPointer.style.opacity = windowFade(time, 17.7, 18.5, 0.12)
  screenPointer.style.transform = `translate3d(${mix(980, 639, approach)}px, ${mix(620, 255, approach)}px, 0) scale(${pressed ? 0.86 : 1})`
}

function renderHighlight(time) {
  const highlights = [
    { start: 8.2, end: 8.45, x: 1323, y: 612, w: 50, h: 50 },
    { start: 11.5, end: 12.75, x: 616, y: 510, w: 352, h: 56 },
    { start: 12.72, end: 14.65, x: 608, y: 574, w: 572, h: 119 },
    { start: 17.95, end: 18.5, x: 606, y: 231, w: 66, h: 48 },
  ]
  const active = highlights.find((item) => time >= item.start && time <= item.end)
  if (!active) {
    screenHighlight.style.opacity = 0
    return
  }
  const fade = Math.min(0.18, (active.end - active.start) / 3)
  screenHighlight.style.opacity = windowFade(time, active.start, active.end, fade) * 0.9
  screenHighlight.style.left = `${active.x}px`
  screenHighlight.style.top = `${active.y}px`
  screenHighlight.style.width = `${active.w}px`
  screenHighlight.style.height = `${active.h}px`
}

function renderTransitions(time) {
  const transitions = [
    { start: 10.18, end: 10.82, color: '#4b2e1f', dir: 1 },
    { start: 15.66, end: 16.38, color: '#0b2f35', dir: -1 },
    { start: 19.95, end: 20.45, color: '#0b2f35', dir: -1 },
  ]
  const active = transitions.find((item) => time >= item.start && time <= item.end)
  if (!active) {
    transitionLayer.style.opacity = 0
    return
  }
  const p = easeInOut(progress(time, active.start, active.end))
  const from = active.dir > 0 ? -115 : 115
  const to = active.dir > 0 ? 115 : -115
  transitionLayer.style.opacity = 1
  transitionLayer.style.background = 'transparent'
  transitionBand.style.background = active.color
  transitionBand.style.transform = `translate3d(${mix(from, to, p)}%, 0, 0) rotate(${active.dir > 0 ? -4 : 4}deg)`
  transitionMark.style.opacity = Math.sin(Math.PI * p)
  transitionMark.style.transform = `translate(-50%, -50%) scale(${mix(0.7, 1.2, Math.sin(Math.PI * p))}) rotate(${mix(-28, 18, p)}deg)`
}

function renderOutro(time) {
  const visible = time >= 24.28
  outro.style.visibility = visible ? 'visible' : 'hidden'
  outro.style.opacity = smooth(progress(time, 24.58, 25.0))

  const drift = progress(time, 24.3, 30)
  outroDay.style.transform = `scale(${mix(1.13, 1.03, easeOut(drift))}) translate3d(${mix(-16, 0, drift)}px, ${mix(10, 0, drift)}px, 0)`
  outroNight.style.transform = `scale(${mix(1.16, 1.05, easeOut(drift))}) translate3d(${mix(12, 0, drift)}px, ${mix(-8, 0, drift)}px, 0)`
  const nightSweep = easeInOut(progress(time, 25.0, 27.1))
  outroNight.style.opacity = smooth(progress(time, 24.9, 25.35))
  outroNight.style.setProperty('--night', `${mix(112, -14, nightSweep)}%`)

  const copyIn = progress(time, 25.15, 26.0)
  outroCopy.style.opacity = 1
  outroCopy.style.transform = `translate3d(0, ${mix(44, 0, easeOut(copyIn))}px, 0)`
  const lines = [...outroCopy.querySelectorAll('[data-line]')]
  for (const [index, line] of lines.entries()) {
    setLineReveal(line, progress(time, 25.15 + index * 0.2, 25.95 + index * 0.2))
  }
  for (const [index, element] of [...outroCopy.querySelectorAll('[data-reveal]')].entries()) {
    const reveal = easeOut(progress(time, 25.55 + index * 0.18, 26.2 + index * 0.18))
    element.style.opacity = reveal
    element.style.transform = `translate3d(0, ${mix(18, 0, reveal)}px, 0)`
  }
  outroRule.style.transform = `scaleX(${easeInOut(progress(time, 25.05, 26.05))})`
}

function renderCanvas(time) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  ctx.save()

  const introDust = 1 - smooth(progress(time, 4.3, 5.2))
  if (introDust > 0) {
    for (let index = 0; index < 16; index += 1) {
      const seed = index * 37.17
      const speed = 5 + (index % 5) * 2
      const x = ((seed * 5.3 + time * speed) % (WIDTH + 80)) - 40
      const y = (((seed * 11.7 - time * (3 + (index % 4) * 1.5)) % HEIGHT) + HEIGHT) % HEIGHT
      const twinkle = Math.pow(0.5 + 0.5 * Math.sin(time * (0.8 + (index % 4) * 0.17) + seed), 3)
      const alpha = (0.3 + (index % 3) * 0.09) * introDust * twinkle
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 239, 197, ${alpha})`
      ctx.arc(x, y, 1 + (index % 4) * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tearBurst = windowFade(time, 2.82, 4.4, 0.3)
  if (tearBurst > 0) {
    ctx.translate(540, 1042)
    for (let index = 0; index < 30; index += 1) {
      const angle = (index / 30) * Math.PI * 2 + Math.sin(index * 8.7) * 0.3
      const radius = 90 + progress(time, 2.82, 4.4) * (200 + (index % 7) * 40)
      const x = Math.cos(angle) * radius * 1.9
      const y = Math.sin(angle) * radius * 1.15
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 247, 220, ${tearBurst * (0.22 + (index % 5) * 0.07)})`
      ctx.arc(x, y, 1 + (index % 3), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  const uiTime = time > 4.5 && time < 25.2
  if (uiTime) {
    const dark = smooth(progress(time, 15.9, 16.55))
    for (let index = 0; index < 7; index += 1) {
      const seed = index * 71.3
      const x = ((seed * 8.7 + time * (7 + (index % 5) * 2)) % (WIDTH + 120)) - 60
      const y = ((((seed * 17.9 - time * (5 + (index % 7) * 1.5)) % (HEIGHT + 120)) + HEIGHT + 120) % (HEIGHT + 120)) - 60
      const size = 8 + (index % 4) * 2
      const angle = time * (0.16 + (index % 4) * 0.03) + seed
      const color = dark > 0.6 ? `rgba(23, 92, 73, ${0.14 + (index % 3) * 0.03})` : `rgba(75, 113, 86, ${0.07 + (index % 3) * 0.02})`
      drawLeaf(x, y, size, angle, color)
    }
  }

  const firefly = smooth(progress(time, 15.6, 16.5)) * (1 - smooth(progress(time, 24.5, 25.1)))
  if (firefly > 0) {
    for (let index = 0; index < 10; index += 1) {
      const seed = index * 49.21
      const flicker = Math.pow(0.5 + 0.5 * Math.sin(time * (0.5 + (index % 5) * 0.09) + seed), 3)
      const x = ((seed * 7.4 + Math.sin(time * 0.19 + seed) * 34) % 980) + 50
      const y = 400 + ((seed * 12.3 + Math.cos(time * 0.15 + seed) * 30) % 780)
      const radius = 1.1 + (index % 4) * 0.4
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 8 + (index % 3) * 3)
      glow.addColorStop(0, `rgba(255, 239, 171, ${0.75 * firefly * flicker})`)
      glow.addColorStop(0.18, `rgba(255, 226, 132, ${0.2 * firefly * flicker})`)
      glow.addColorStop(1, 'rgba(255, 226, 132, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(x - 26, y - 26, 52, 52)
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 250, 214, ${0.9 * firefly * flicker})`
      ctx.arc(x, y, radius + 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const stars = smooth(progress(time, 25.2, 26.4)) * (1 - smooth(progress(time, 29.35, 30)))
  if (stars > 0) {
    for (let index = 0; index < 16; index += 1) {
      const seed = index * 37.9
      const x = 40 + ((seed * 9.3 + Math.sin(time * 0.1 + seed) * 5) % 1000)
      const y = 40 + ((seed * 5.7 + Math.cos(time * 0.08 + seed) * 4) % 560)
      const twinkle = Math.pow(0.5 + 0.5 * Math.sin(time * (0.7 + (index % 4) * 0.16) + seed), 2)
      ctx.beginPath()
      ctx.fillStyle = `rgba(255, 248, 214, ${0.72 * stars * twinkle})`
      ctx.arc(x, y, 0.9 + (index % 3) * 0.45, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
  grain.style.backgroundPosition = `${Math.round(time * 13) % 560}px ${Math.round(time * 9) % 560}px`
}

function drawLeaf(x, y, size, angle, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(size, size)
  ctx.beginPath()
  ctx.moveTo(0, -1)
  ctx.bezierCurveTo(0.86, -0.56, 0.72, 0.52, 0, 1)
  ctx.bezierCurveTo(-0.72, 0.52, -0.86, -0.56, 0, -1)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.52)')
  ctx.lineWidth = 0.08
  ctx.beginPath()
  ctx.moveTo(0, -0.82)
  ctx.lineTo(0, 0.76)
  ctx.stroke()
  ctx.restore()
}

function renderAt(rawTime) {
  const time = ((Number(rawTime) % DURATION) + DURATION) % DURATION
  renderCover(time)
  renderIntro(time)
  renderUi(time)
  renderTransitions(time)
  renderOutro(time)
  const workspaceSeek = renderWorkspaceInteraction(time)
  const seek = renderInteraction(time)
  renderSettingsClick(time)
  renderCanvas(time)
  endFade.style.opacity = smooth(progress(time, 29.2, 30))
  document.documentElement.dataset.time = time.toFixed(3)
  const seeks = [workspaceSeek, seek].filter(Boolean)
  return seeks.length ? Promise.all(seeks).then(() => {}) : null
}

window.renderAt = renderAt
window.FILM_DURATION = DURATION
window.__sampleCamera = sampleCamera

const params = new URLSearchParams(location.search)
document.body.classList.toggle('debug', params.has('debug'))

Promise.all([
  document.fonts.ready,
  new Promise((resolve) => {
    if (dragVideo.readyState >= 2) resolve()
    else {
      dragVideo.addEventListener('loadeddata', resolve, { once: true })
      dragVideo.addEventListener('error', resolve, { once: true })
    }
  }),
  new Promise((resolve) => {
    if (workspaceVideo.readyState >= 2) resolve()
    else {
      workspaceVideo.addEventListener('loadeddata', resolve, { once: true })
      workspaceVideo.addEventListener('error', resolve, { once: true })
    }
  }),
  ...Array.from(document.images).map((image) => (image.complete ? Promise.resolve() : image.decode().catch(() => {}))),
]).then(() => {
  const t = params.get('t')
  if (t !== null) {
    renderAt(Number(t))
    window.__PROMO_READY__ = true
    return
  }
  if (params.has('capture')) {
    renderAt(0)
    window.__PROMO_READY__ = true
    return
  }
  const loopStart = performance.now()
  const tick = (now) => {
    renderAt(((now - loopStart) / 1000) % DURATION)
    requestAnimationFrame(tick)
  }
  renderAt(0)
  window.__PROMO_READY__ = true
  requestAnimationFrame(tick)
})
