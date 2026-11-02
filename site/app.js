const modeButtons = [...document.querySelectorAll('[data-island-mode]')]
const modeImages = [...document.querySelectorAll('img[data-light-src][data-dark-src]')]
const modeLabels = [...document.querySelectorAll('[data-mode-label]')]
const modeState = document.querySelector('.island-switch__state')
const themeColor = document.querySelector('meta[name="theme-color"]')

const modeContent = {
  light: {
    label: '日间',
    state: '正在预览日间岛',
    themeColor: '#8fcaa5',
  },
  dark: {
    label: '夜间',
    state: '正在预览夜间岛',
    themeColor: '#162f34',
  },
}

let switching = false

function preloadMode(mode) {
  const key = mode === 'light' ? 'lightSrc' : 'darkSrc'
  for (const image of modeImages) {
    const src = image.dataset[key]
    if (!src) continue
    const preload = new Image()
    preload.src = src
  }
}

function applyMode(mode) {
  if (!modeContent[mode] || switching) return

  preloadMode(mode)
  switching = true
  document.body.dataset.islandMode = mode

  for (const button of modeButtons) {
    const active = button.dataset.islandMode === mode
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  for (const label of modeLabels) label.textContent = modeContent[mode].label
  modeState.textContent = modeContent[mode].state
  themeColor.setAttribute('content', modeContent[mode].themeColor)

  for (const image of modeImages) {
    image.src = mode === 'light' ? image.dataset.lightSrc : image.dataset.darkSrc
  }

  requestAnimationFrame(() => {
    switching = false
  })
}

for (const button of modeButtons) {
  button.addEventListener('click', () => applyMode(button.dataset.islandMode))
}

preloadMode('dark')

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const revealItems = [...document.querySelectorAll('[data-reveal]')]

if (!reduceMotion && 'IntersectionObserver' in window) {
  const pending = revealItems.filter((item) => item.getBoundingClientRect().top > window.innerHeight * 0.9)
  for (const item of pending) item.classList.add('will-reveal')

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  )

  for (const item of pending) observer.observe(item)
} else {
  for (const item of revealItems) item.classList.add('is-revealed')
}
