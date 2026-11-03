const modeButtons = [...document.querySelectorAll('[data-island-mode]')]
const modeImages = [...document.querySelectorAll('img[data-light-src][data-dark-src]')]
const modeLabels = [...document.querySelectorAll('[data-mode-label]')]
const shotLinks = [...document.querySelectorAll('a[data-shot]')]
const dialog = document.querySelector('#shot-dialog')
const dialogTitle = document.querySelector('#shot-dialog__title')
const dialogCount = document.querySelector('[data-shot-count]')
const dialogImage = dialog?.querySelector('img')
const dialogOriginal = dialog?.querySelector('.shot-dialog__original')
const dialogClose = dialog?.querySelector('.shot-dialog__close')
const dialogPrev = dialog?.querySelector('[data-shot-prev]')
const dialogNext = dialog?.querySelector('[data-shot-next]')

const modeContent = {
  light: '日间',
  dark: '夜间',
}

let currentMode = 'light'
let darkPreloaded = false
let activeShotIndex = 0
let dialogTrigger = null

function sourcePath(value) {
  return new URL(value, window.location.href).pathname
}

function associatedImage(link) {
  const linkPath = sourcePath(link.getAttribute('href'))
  return modeImages.find((image) => {
    const paths = [image.getAttribute('src'), image.dataset.lightSrc, image.dataset.darkSrc]
    return paths.some((source) => source && sourcePath(source) === linkPath)
  })
}

function imageForShot(link) {
  return associatedImage(link) ?? link.closest('figure')?.querySelector('img') ?? null
}

function shotCaption(image) {
  const link = image.closest('figure')?.querySelector('a[data-shot]')
  return link?.dataset.shotCaption ?? image.alt ?? '完整界面'
}

const galleryImages = [...new Set(shotLinks.map(imageForShot).filter(Boolean))]
const gallery = galleryImages.map((image) => ({ image, caption: shotCaption(image) }))

for (const image of modeImages) {
  image.dataset.altLight = image.getAttribute('alt') ?? ''
  image.dataset.altDark = image.dataset.altLight.replaceAll('日间', '夜间')
}

for (const link of shotLinks) {
  const image = imageForShot(link)
  if (!image) continue
  if (image.dataset.lightSrc && image.dataset.darkSrc) {
    link.dataset.lightHref = image.dataset.lightSrc
    link.dataset.darkHref = image.dataset.darkSrc
  }

  const label = link.getAttribute('aria-label')
  if (label) {
    link.dataset.labelLight = label
    link.dataset.labelDark = label.replaceAll('日间', '夜间')
  }
}

function preloadMode(mode) {
  if (mode !== 'dark' || darkPreloaded) return
  darkPreloaded = true
  for (const image of modeImages) {
    const preload = new Image()
    preload.src = image.dataset.darkSrc
  }
}

function applyMode(mode) {
  if (!modeContent[mode]) return

  currentMode = mode
  document.body.dataset.islandMode = mode

  for (const button of modeButtons) {
    const active = button.dataset.islandMode === mode
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  for (const label of modeLabels) label.textContent = modeContent[mode]

  for (const image of modeImages) {
    image.src = mode === 'light' ? image.dataset.lightSrc : image.dataset.darkSrc
    image.alt = mode === 'light' ? image.dataset.altLight : image.dataset.altDark
  }

  for (const link of shotLinks) {
    if (link.dataset.labelLight) {
      link.setAttribute('aria-label', mode === 'light' ? link.dataset.labelLight : link.dataset.labelDark)
    }
    if (!link.dataset.lightHref || !link.dataset.darkHref) continue
    link.href = mode === 'light' ? link.dataset.lightHref : link.dataset.darkHref
  }

  if (dialog?.open) renderDialogImage()
}

for (const button of modeButtons) {
  button.addEventListener('pointerenter', () => preloadMode(button.dataset.islandMode))
  button.addEventListener('focus', () => preloadMode(button.dataset.islandMode))
  button.addEventListener('click', () => applyMode(button.dataset.islandMode))
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => preloadMode('dark'), { timeout: 1500 })
} else {
  window.setTimeout(() => preloadMode('dark'), 600)
}

if ('IntersectionObserver' in window) {
  const revealItems = [...document.querySelectorAll('[data-reveal]')]
  const pending = revealItems.filter((item) => item.getBoundingClientRect().top > window.innerHeight * 0.86)

  for (const item of pending) item.classList.add('will-reveal')

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
  )

  for (const item of pending) observer.observe(item)
} else {
  for (const item of document.querySelectorAll('[data-reveal]')) item.classList.add('is-revealed')
}

let lockedScrollbarWidth = 0

function lockScroll() {
  lockedScrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  if (lockedScrollbarWidth > 0) document.body.style.paddingRight = `${lockedScrollbarWidth}px`
  document.body.style.overflow = 'hidden'
}

function unlockScroll() {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  lockedScrollbarWidth = 0
}

function finishDialogClose() {
  if (dialog?.open) return
  unlockScroll()
  dialogTrigger?.focus()
  dialogTrigger = null
}

function closeDialog() {
  if (!dialog?.open) return
  dialog.close()
  finishDialogClose()
}

function renderDialogImage() {
  const item = gallery[activeShotIndex]
  if (!dialogImage || !dialogTitle || !dialogOriginal || !item) return

  const { image } = item
  const source = currentMode === 'dark' && image.dataset.darkSrc ? image.dataset.darkSrc : (image.dataset.lightSrc ?? image.getAttribute('src'))
  const width = image.getAttribute('width')
  const height = image.getAttribute('height')

  dialogTitle.textContent = item.caption
  dialogImage.src = source
  dialogImage.alt = image.alt || 'Animal Island UI 产品界面完整原图'
  if (width && height) {
    dialogImage.setAttribute('width', width)
    dialogImage.setAttribute('height', height)
  } else {
    dialogImage.removeAttribute('width')
    dialogImage.removeAttribute('height')
  }
  dialogOriginal.href = source
  if (dialogCount) dialogCount.textContent = `${activeShotIndex + 1} / ${gallery.length}`
}

function moveDialog(direction) {
  if (!dialog?.open || !gallery.length) return
  activeShotIndex = (activeShotIndex + direction + gallery.length) % gallery.length
  renderDialogImage()
}

function openDialog(link) {
  if (!dialog || !dialogImage || !dialogTitle || !dialogOriginal || typeof dialog.showModal !== 'function') return false

  const image = imageForShot(link)
  const index = gallery.findIndex((item) => item.image === image)
  activeShotIndex = Math.max(index, 0)
  dialogTrigger = link
  renderDialogImage()
  lockScroll()
  dialog.showModal()
  dialog.focus()
  return true
}

for (const link of shotLinks) {
  link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (openDialog(link)) event.preventDefault()
  })
}

dialogClose?.addEventListener('click', closeDialog)
dialogPrev?.addEventListener('click', () => moveDialog(-1))
dialogNext?.addEventListener('click', () => moveDialog(1))
dialog?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    moveDialog(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    moveDialog(1)
  }
})
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog()
})
dialog?.addEventListener('close', finishDialogClose)
dialog?.addEventListener('toggle', finishDialogClose)
