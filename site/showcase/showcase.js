;(() => {
  const state = {
    mode: 'light',
    query: '',
    dirty: new Set(),
    appearance: {
      veil: 0.4,
      decor: 'on',
      grain: 'on',
      diffSyntax: 'warm',
      font: 'theme',
    },
  }

  let manifest = null
  const stageEntries = []

  const sectionsRoot = document.getElementById('sections-root')
  const tocRoot = document.getElementById('toc')
  const statusBar = document.getElementById('status-bar')
  const footerMeta = document.getElementById('footer-meta')
  const searchInput = document.getElementById('search-input')
  const veilSlider = document.getElementById('veil-slider')
  const veilOutput = document.getElementById('veil-output')
  const toggleDecor = document.getElementById('toggle-decor')
  const toggleGrain = document.getElementById('toggle-grain')
  const toggleDiffChip = document.getElementById('toggle-diff-chip')
  const toggleDiff = document.getElementById('toggle-diff')
  const toggleFont = document.getElementById('toggle-font')
  const resetBtn = document.getElementById('reset-btn')
  const modeButtons = [...document.querySelectorAll('[data-mode]')]
  const veilPresets = [...document.querySelectorAll('[data-veil-preset]')]

  function currentPatch() {
    if (state.dirty.size === 0) return null
    const patch = {}
    for (const key of state.dirty) patch[key] = state.appearance[key]
    return patch
  }

  function postAppearanceToFrame(iframe, reset = false) {
    if (!iframe.contentWindow) return
    if (reset) {
      iframe.contentWindow.postMessage({ type: 'animal-island:appearance', reset: true }, '*')
      return
    }
    const patch = currentPatch()
    if (patch) {
      iframe.contentWindow.postMessage({ type: 'animal-island:appearance', patch }, '*')
    }
  }

  function broadcastAppearance(reset = false) {
    for (const entry of stageEntries) {
      postAppearanceToFrame(entry.iframe, reset)
    }
  }

  function layoutEntry(entry) {
    const stageWidth = entry.stage.clientWidth
    if (!stageWidth) return
    const variant = entry.activeVariant
    const scale = Math.min(1, stageWidth / variant.width)
    const viewW = Math.round(variant.width * scale)
    const viewH = Math.round(variant.height * scale)
    entry.viewport.style.width = `${viewW}px`
    entry.viewport.style.height = `${viewH}px`
    entry.iframe.style.width = `${variant.width}px`
    entry.iframe.style.height = `${variant.height}px`
    entry.iframe.style.transform = scale < 1 ? `scale(${scale})` : ''
  }

  function pickVariant(fixture) {
    return fixture.variants.find((v) => v.mode === state.mode) ?? fixture.variants[0]
  }

  function syncDiffAvailability() {
    const isDark = state.mode === 'dark'
    toggleDiff.disabled = isDark
    if (toggleDiffChip) {
      toggleDiffChip.classList.toggle('is-disabled', isDark)
      toggleDiffChip.title = isDark ? '原生 Diff 语法仅在日间模式生效（夜岛模式保留高对比语义色）' : '切换 Diff 红绿行高亮（仅日间模式作用于 Diff 交付区卡片）'
    }
  }

  function syncMode() {
    document.body.dataset.showcaseMode = state.mode
    for (const btn of modeButtons) {
      const active = btn.dataset.mode === state.mode
      btn.classList.toggle('is-active', active)
      btn.setAttribute('aria-pressed', String(active))
    }
    syncDiffAvailability()
    for (const entry of stageEntries) {
      const next = pickVariant(entry.fixture)
      if (next.src !== entry.activeVariant.src) {
        entry.activeVariant = next
        entry.iframe.src = next.src
        entry.openRaw.href = next.src
        entry.sizeBadge.textContent = `${next.width}×${next.height}`
        layoutEntry(entry)
      }
    }
  }

  function syncFilter() {
    const q = state.query.trim().toLowerCase()
    let visibleCount = 0
    for (const section of sectionsRoot.querySelectorAll('.group-section')) {
      let groupVisible = 0
      for (const card of section.querySelectorAll('.fixture-card')) {
        const hay = card.dataset.search ?? ''
        const hit = !q || hay.includes(q)
        card.hidden = !hit
        if (hit) {
          groupVisible += 1
          visibleCount += 1
        }
      }
      section.hidden = groupVisible === 0
    }
    if (manifest) {
      statusBar.textContent = q
        ? `筛选结果：${visibleCount} / ${manifest.fixtures.length} 组组件夹具（${state.mode === 'dark' ? '夜岛' : '日间'}模式）`
        : `共 ${manifest.fixtures.length} 组真实 DSH 组件夹具 · 当前为${state.mode === 'dark' ? '夜岛' : '日间'}模式`
    }
  }

  function updatePresetButtons() {
    const val = state.appearance.veil
    for (const btn of veilPresets) {
      const preset = Number.parseFloat(btn.dataset.veilPreset)
      btn.classList.toggle('is-active', Math.abs(val - preset) < 0.005)
    }
  }

  function renderManifest(data) {
    manifest = data
    tocRoot.innerHTML = ''
    sectionsRoot.innerHTML = ''
    stageEntries.length = 0

    for (const group of data.groups) {
      const groupFixtures = data.fixtures.filter((f) => f.group === group)
      if (groupFixtures.length === 0) continue

      const groupId = `group-${encodeURIComponent(group)}`
      const tocGroup = document.createElement('div')
      const tocHeading = document.createElement('h2')
      tocHeading.className = 'toc__group-title'
      tocHeading.textContent = `${group} (${groupFixtures.length})`
      const tocList = document.createElement('ul')
      tocList.className = 'toc__list'
      tocGroup.append(tocHeading, tocList)

      const section = document.createElement('section')
      section.className = 'group-section'
      section.id = groupId
      const sectionHeading = document.createElement('h2')
      sectionHeading.className = 'group-section__heading'
      sectionHeading.innerHTML = `${group} <span class="group-section__count">${groupFixtures.length} 项</span>`
      const grid = document.createElement('div')
      grid.className = 'cards-grid'
      section.append(sectionHeading, grid)

      for (const fixture of groupFixtures) {
        const cardId = `card-${fixture.name}`
        const li = document.createElement('li')
        const a = document.createElement('a')
        a.className = 'toc__link'
        a.href = `#${cardId}`
        a.textContent = fixture.title.split('·')[0].trim()
        a.title = fixture.title
        li.append(a)
        tocList.append(li)

        const variant = pickVariant(fixture)
        const card = document.createElement('article')
        card.className = 'fixture-card'
        card.id = cardId
        card.dataset.search = `${fixture.name} ${fixture.title} ${fixture.group} ${fixture.pluginCss.join(' ')}`.toLowerCase()

        const header = document.createElement('header')
        header.className = 'fixture-card__header'

        const titleEl = document.createElement('h3')
        titleEl.className = 'fixture-card__title'
        titleEl.textContent = fixture.title

        const meta = document.createElement('div')
        meta.className = 'fixture-card__meta'

        const nameBadge = document.createElement('span')
        nameBadge.className = 'badge badge--muted'
        nameBadge.textContent = fixture.name
        meta.append(nameBadge)

        for (const pkg of fixture.pluginCss) {
          const pkgBadge = document.createElement('span')
          pkgBadge.className = 'badge'
          pkgBadge.textContent = pkg
          meta.append(pkgBadge)
        }

        const sizeBadge = document.createElement('span')
        sizeBadge.className = 'badge badge--muted'
        sizeBadge.textContent = `${variant.width}×${variant.height}`
        meta.append(sizeBadge)

        const openRaw = document.createElement('a')
        openRaw.className = 'open-raw'
        openRaw.href = variant.src
        openRaw.target = '_blank'
        openRaw.rel = 'noreferrer'
        openRaw.textContent = '单独打开 ↗'
        meta.append(openRaw)

        header.append(titleEl, meta)

        const stage = document.createElement('div')
        stage.className = 'fixture-card__stage'
        const viewport = document.createElement('div')
        viewport.className = 'fixture-card__viewport'
        const iframe = document.createElement('iframe')
        iframe.className = 'fixture-card__iframe'
        iframe.loading = 'lazy'
        iframe.title = fixture.title
        iframe.src = variant.src
        viewport.append(iframe)
        stage.append(viewport)

        const entry = { fixture, activeVariant: variant, stage, viewport, iframe, sizeBadge, openRaw }
        iframe.addEventListener('load', () => postAppearanceToFrame(iframe))
        stageEntries.push(entry)

        card.append(header, stage)
        grid.append(card)
      }

      tocRoot.append(tocGroup)
      sectionsRoot.append(section)
    }

    for (const entry of stageEntries) layoutEntry(entry)
    const generatedDate = data.generatedAt ? data.generatedAt.slice(0, 10) : ''
    footerMeta.textContent = `渲染于 DSH ${data.dshVersion} · 构建日期 ${generatedDate} · 夹具与皮肤源码未改写`
    syncFilter()
  }

  for (const btn of modeButtons) {
    btn.addEventListener('click', () => {
      const next = btn.dataset.mode
      if (next === state.mode) return
      state.mode = next
      syncMode()
      syncFilter()
    })
  }

  for (const btn of veilPresets) {
    btn.addEventListener('click', () => {
      const val = Number.parseFloat(btn.dataset.veilPreset)
      state.appearance.veil = val
      state.dirty.add('veil')
      veilSlider.value = String(val)
      veilOutput.textContent = val.toFixed(2)
      updatePresetButtons()
      broadcastAppearance()
    })
  }

  veilSlider.addEventListener('input', () => {
    const val = Number.parseFloat(veilSlider.value)
    state.appearance.veil = val
    state.dirty.add('veil')
    veilOutput.textContent = val.toFixed(2)
    updatePresetButtons()
    broadcastAppearance()
  })

  toggleDecor.addEventListener('change', () => {
    state.appearance.decor = toggleDecor.checked ? 'on' : 'off'
    state.dirty.add('decor')
    broadcastAppearance()
  })

  toggleGrain.addEventListener('change', () => {
    state.appearance.grain = toggleGrain.checked ? 'on' : 'off'
    state.dirty.add('grain')
    broadcastAppearance()
  })

  toggleDiff.addEventListener('change', () => {
    state.appearance.diffSyntax = toggleDiff.checked ? 'native' : 'warm'
    state.dirty.add('diffSyntax')
    broadcastAppearance()
  })

  toggleFont.addEventListener('change', () => {
    state.appearance.font = toggleFont.checked ? 'system' : 'theme'
    state.dirty.add('font')
    broadcastAppearance()
  })

  resetBtn.addEventListener('click', () => {
    state.dirty.clear()
    state.appearance.veil = 0.4
    state.appearance.decor = 'on'
    state.appearance.grain = 'on'
    state.appearance.diffSyntax = 'warm'
    state.appearance.font = 'theme'
    veilSlider.value = '0.4'
    veilOutput.textContent = '0.40'
    toggleDecor.checked = true
    toggleGrain.checked = true
    toggleDiff.checked = false
    toggleFont.checked = false
    updatePresetButtons()
    broadcastAppearance(true)
  })

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value
    syncFilter()
  })

  window.addEventListener('resize', () => {
    for (const entry of stageEntries) layoutEntry(entry)
  })

  syncDiffAvailability()

  fetch('generated/manifest.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then(renderManifest)
    .catch((err) => {
      statusBar.textContent = `无法加载组件清单（${err.message}）。请确认已运行 pnpm run showcase 并通过 HTTP 服务访问。`
    })
})()
