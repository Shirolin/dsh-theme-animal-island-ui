import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { contrastRatio } from '../lib/tokens.js'

const css = await readFile(new URL('../src/client/skin.css', import.meta.url), 'utf8')
const slots = await readFile(new URL('../src/client/slots.ts', import.meta.url), 'utf8')
const install = await readFile(new URL('../src/client/install.ts', import.meta.url), 'utf8')
const brand = await readFile(new URL('../src/client/components/brand.tsx', import.meta.url), 'utf8')
const wave = await readFile(new URL('../src/client/assets/sidebar-wave.svg', import.meta.url), 'utf8')
const nightLeaves = await readFile(new URL('../src/client/assets/night-leaves.svg', import.meta.url), 'utf8')
const nightHorizon = await readFile(new URL('../src/client/assets/night-horizon.svg', import.meta.url), 'utf8')
const loadingLeaf = await readFile(new URL('../src/client/assets/loading-leaf.svg', import.meta.url), 'utf8')
const mastheadFixture = await readFile(new URL('./fixtures/sidebar-masthead/body.html', import.meta.url), 'utf8')
const bootLoadingFixture = await readFile(new URL('./fixtures/boot-loading/body.html', import.meta.url), 'utf8')
const bootFailureFixture = await readFile(new URL('./fixtures/boot-failure/body.html', import.meta.url), 'utf8')

test('skin CSS is plugin-scoped and avoids generated DSH selectors', () => {
  assert.match(css, /html\[data-dsh-animal-island-skin\]/)
  assert.match(css, /\.animal-island-brand__mark/)
  assert.doesNotMatch(css, /(?<![A-Za-z0-9_-])\.[A-Za-z][A-Za-z0-9-]*_[A-Za-z0-9]{5,}(?![A-Za-z0-9_-])/)
  assert.doesNotMatch(css, /\[data-slot[=\]]/)
  assert.doesNotMatch(css, /data-cordis-panel/)
  assert.doesNotMatch(css, /:nth-child|:first-child|:last-child/)
})

test('skin uses only the reviewed stable data hooks', () => {
  const hooks = [...css.matchAll(/\[data-([a-z][a-z0-9-]*)(?:[=\]])/g)].map((match) => match[1])
  const allowed = new Set([
    'dsh-animal-island-skin',
    'ds-dark-theme',
    'composer-card',
    'conversation-header-corner',
    'state',
    // DSH's own composer trigger panel (input-trigger MenuView) carries this
    // attribute for its dismiss logic, so the skin can key popover chrome off it.
    'trigger-menu',
    // Markdown code-block banner: the language label and copy button inherit
    // label-primary, which is unreadable on the dark code island in light mode.
    'code-block-banner',
    // Right sidebar document preview: its flat views (the highlighted code body
    // and the plain-text pages) keep DSH's own text colour instead of the
    // theme's dark-island code foreground.
    'code-preview',
    'textpreview-plain',
    // Open-target split button: DSH exposes this marker for its file-explorer
    // and dropdown actions; light mode needs a perceivable boundary between them.
    'open-target',
    // Plugin-manager rows use their own identity attributes. The skin paints a
    // quiet light-mode reading surface without changing the plugin's list layout.
    'plugin-item',
    'plugin-package',
    // Windows desktop shell marker: the shell paints its outer frame with the
    // opaque sidebar fill (macOS clears it); the skin clears it so the canvas
    // behind the UI is visible. deepseek-harness discussion #9490.
    'windows-titlebar',
    // DSH's pre-render boot screen. The renderer writes the root marker and the
    // progress-seal marker itself; the skin only decorates those existing nodes.
    'dsh-boot',
    'dsh-boot-spinner',
  ])
  assert.deepEqual(
    [...new Set(hooks)].filter((hook) => !allowed.has(hook)),
    [],
  )
})

test('light open-target boundaries stay perceivable', () => {
  const rules = [...css.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const boundary = rules.find(
    (rule) =>
      rule.includes('body:not([data-ds-dark-theme])') && rule.includes('[data-open-target]') && /border-color:\s*var\(--animal-control-border\)/.test(rule),
  )
  const divider = rules.find(
    (rule) =>
      rule.includes('body:not([data-ds-dark-theme])') &&
      rule.includes('[data-open-target]') &&
      rule.includes('button[aria-haspopup="menu"]') &&
      /border-left-color:\s*var\(--animal-control-border\)/.test(rule),
  )

  assert.ok(boundary, 'the light open-target boundary override is missing')
  assert.ok(divider, 'the light open-target divider override is missing')
  assert.ok(contrastRatio('#8f765e', '#d2e7d5') >= 3)
})

test('light plugin controls stay perceivable and plugin rows keep a reading surface', () => {
  const rules = [...css.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const closedSwitch = rules.find(
    (candidate) =>
      candidate.includes('body:not([data-ds-dark-theme])') &&
      candidate.includes('button[role="switch"]') &&
      /box-shadow:\s*inset 0 0 0 1\.5px var\(--animal-control-border\)/.test(candidate),
  )
  const checkedSwitch = rules.find(
    (candidate) =>
      candidate.includes('body:not([data-ds-dark-theme])') &&
      candidate.includes('button[role="switch"][aria-checked="true"]') &&
      /background-color:\s*var\(--animal-mint-deep\)/.test(candidate),
  )
  const pluginRow = rules.find(
    (candidate) =>
      candidate.includes('body:not([data-ds-dark-theme])') &&
      candidate.includes('li:is([data-plugin-item], [data-plugin-package])') &&
      /background-color:\s*rgba\(250, 248, 243, 0\.48\)/.test(candidate),
  )

  assert.ok(closedSwitch, 'the light closed-switch boundary is missing')
  assert.ok(checkedSwitch, 'the light checked-switch state is missing')
  assert.ok(pluginRow, 'the plugin row reading surface is missing')
  assert.ok(contrastRatio('#8f765e', '#d2e7d5') >= 3)
  assert.ok(contrastRatio('#8f765e', '#f5ecd9') >= 3)
  assert.ok(contrastRatio('#0b6d64', '#d2e7d5') >= 3)
  assert.ok(contrastRatio('#f8fffb', '#0b6d64') >= 4.5)
})

test('composer 3D send styling leaves text-bearing triggers flat', () => {
  const uncommented = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const rules = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0].replaceAll(/\s+/g, ' ').trim())
  const sendRules = rules.filter((rule) => rule.includes('[data-composer-card] button[aria-label]'))

  assert.ok(sendRules.length >= 5, 'the composer send-key rules are missing')
  for (const rule of sendRules) {
    assert.match(rule, /:has\(svg\):not\(:has\(span\)\)/)
  }

  const selector = sendRules
    .find((rule) => rule.includes('position: relative'))
    ?.slice(0, sendRules.find((rule) => rule.includes('position: relative')).indexOf('{'))
    .trim()
  assert.ok(selector, 'the base send-key selector is missing')

  const { document } = new JSDOM(`
    <div data-composer-card>
      <button aria-label="访问模式，当前：工作区内修改">
        <span><svg></svg></span><span>工作区内修改</span>
      </button>
      <button aria-label="发送消息"><svg></svg></button>
    </div>
  `).window
  document.documentElement.setAttribute('data-dsh-animal-island-skin', '')
  const workspace = document.querySelector('button[aria-label^="访问模式"]')
  const send = document.querySelector('button[aria-label="发送消息"]')

  assert.equal(workspace.matches(selector), false)
  assert.equal(send.matches(selector), true)
})

test('composer focus ring colors the speech-bubble tail', () => {
  const uncommented = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const rule = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes('[data-composer-card]:focus-within::before'))

  assert.ok(rule, 'the focused composer tail rule is missing')
  assert.match(rule, /border-right-color:\s*var\(--animal-mint-deep\)/)
  assert.match(rule, /border-bottom-color:\s*var\(--animal-mint-deep\)/)
})

test('windows shell frame is transparent and its content corner is flattened', () => {
  // DSH's Windows AppFrame paints `--dsw-specific-sidebar-fill` over the whole
  // window and rounds the content's top-left corner; macOS/web do neither.
  // Without this shim the veil composites over the opaque sidebar fill and the
  // slider looks dead only on desktop, and the shell corner shows as a stray
  // 16px curve against the themed canvas.
  const uncommented = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const frame = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes('[data-windows-titlebar] #root > div > div'))
  assert.ok(frame, 'the Windows shell frame workaround is missing')
  assert.match(frame, /background:\s*transparent\s*!important/)
  // DSH sets the token on `.frame` itself, so it must be overridden there too;
  // setting it on <html> is shadowed and the 16px corner stays.
  assert.match(frame, /--dsh-windows-content-radius:\s*0px/)
})

test('header ribbon colors the current crumb span directly', () => {
  // 0.2.x's `.crumbCurrent` declares label-primary on the span, which beats the
  // nav's inherited colour. The ribbon must set the span explicitly or the title
  // becomes brown-on-brown (empty-looking plank) on desktop.
  const uncommented = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const rule = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0]).find((candidate) => candidate.includes('nav :where(span)'))
  assert.ok(rule, 'the ribbon crumb span colour rule is missing')
  assert.match(rule, /color:\s*#fff3d6\s*!important/)
})

test('light conversation header keeps a quiet but visible divider', () => {
  const rules = [...css.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const rule = rules.find(
    (candidate) =>
      candidate.includes('body:not([data-ds-dark-theme])') &&
      candidate.includes('header:has([data-conversation-header-corner])') &&
      /border-bottom-color:\s*#b9aa90\s*!important/.test(candidate),
  )

  assert.ok(rule, 'the light conversation header divider override is missing')
  assert.doesNotMatch(rule, /border-(?:width|bottom-width):/)
  assert.ok(contrastRatio('#b9aa90', '#d2e7d5') >= 1.5)
})

test('slot installation uses public contracts without DOM scanning', () => {
  for (const source of [slots, install]) {
    assert.doesNotMatch(source, /querySelector|closest\(|MutationObserver|__DSH_BOOT__|ReactDOM/)
    assert.doesNotMatch(source, /(?<![A-Za-z0-9_-])\.[A-Za-z][A-Za-z0-9-]*_[A-Za-z0-9]{5,}(?![A-Za-z0-9_-])/)
  }
  assert.doesNotMatch(slots, /register\(\{\s*name:\s*['"]sidebar['"]/)
  for (const key of ['sidebar.brand.mark', 'sidebar.brand.name', 'conversation.hero.brand.mark']) {
    assert.match(slots, new RegExp(key.replaceAll('.', '\\.')))
  }
})

test('ticket selectors reach through DSH slot wrappers', () => {
  const { document } = new JSDOM(mastheadFixture, { runScripts: 'dangerously' }).window
  const markHost = document.querySelector('button > span > span:has(.animal-island-brand__mark)')
  const nameHost = document.querySelector('button > span > span:has(.animal-island-brand__name)')

  assert.equal(document.querySelectorAll('button > span > span:has(.animal-island-brand__mark)').length, 3)
  assert.equal(document.querySelectorAll('button > span > span:has(.animal-island-brand__name)').length, 3)
  assert.equal(document.querySelector('button > span:has(> .animal-island-brand__mark)'), null)
  assert.match(markHost?.innerHTML ?? '', /<div data-slot="" style="display: contents;">/)
  assert.match(nameHost?.innerHTML ?? '', /<div data-slot="" style="display: contents;">/)
})

test('conversation hero renders a responsive day and night island title scene', () => {
  const uncommented = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const rules = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])

  const frame = rules.find((rule) => rule.includes('div[class]:has(> span > div > .animal-island-hero__brand)') && /min-height:\s*142px/.test(rule))
  assert.ok(frame, 'the island title scene is missing')
  assert.match(frame, /width:\s*min\(100%,\s*700px\)/)
  assert.match(frame, /border:\s*0/)
  assert.match(frame, /box-shadow:\s*none/)
  assert.doesNotMatch(frame, /\[data-slot/)

  const dayScene = rules.find((rule) => rule.includes('.animal-island-hero__scenery--day') && /opacity:\s*1/.test(rule))
  assert.ok(dayScene, 'the daylight scenery is missing')
  const nightScene = rules.find(
    (rule) => rule.includes('body[data-ds-dark-theme]') && rule.includes('.animal-island-hero__scenery--night') && /opacity:\s*1/.test(rule),
  )
  assert.ok(nightScene, 'the night scenery is not enabled in dark mode')
  assert.match(brand, /animal-island-hero__scenery--day/)
  assert.match(brand, /animal-island-hero__scenery--night/)
  assert.match(brand, /animal-island-hero__identity/)
  assert.match(brand, /className="animal-island-hero__english"\s+aria-hidden="true"/)

  const title = rules.find((rule) => rule.includes('> span:has(> span + span)') && /font-size:\s*41px/.test(rule))
  assert.ok(title, 'the game-opening title is missing')
  assert.match(title, /font-weight:\s*900/)
  assert.match(title, /white-space:\s*nowrap/)
  assert.match(title, /animation:\s*animal-island-hero-title-in/)

  const badge = rules.find((rule) => rule.includes('> span:has(> span + span) > span + span') && /transform:\s*translateY\(4px\)\s+rotate\(2deg\)/.test(rule))
  assert.ok(badge, 'the preview badge must sit beside the title')
  assert.match(badge, /border-radius:\s*999px/)

  const mobile = css.slice(css.indexOf('@media (max-width: 520px)'))
  assert.match(mobile, /min-height:\s*124px/)
  assert.match(mobile, /font-size:\s*34px/)
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*font-size:\s*30px/)
  assert.match(css, /prefers-reduced-motion[\s\S]*\.animal-island-hero__scenery \*[\s\S]*animation:\s*none !important/)
})

test('owned CSS hard-coded text and focus combinations remain readable', () => {
  assert.ok(contrastRatio('#6f451f', '#fffbe7') >= 4.5)
  assert.ok(contrastRatio('#f7e7c7', '#2a2520') >= 4.5)
  // Wooden header ribbon: cream text on the painted plank in both modes.
  assert.ok(contrastRatio('#fff3d6', '#8a5a33') >= 4.5)
  assert.ok(contrastRatio('#f6e6c8', '#5a3d24') >= 4.5)
  assert.ok(contrastRatio('#235d3d', '#a5d0aa') >= 4.5)
  assert.ok(contrastRatio('#315b3a', '#a5d0aa') >= 4.5)
  for (const background of ['#fffbe7', '#d2e7d5', '#e5c99b', '#f0e8d8']) {
    assert.ok(contrastRatio('#0b6d64', background) >= 3, `deep mint focus on ${background}`)
  }
  for (const value of ['#6f451f', '#fffbe7', '#2a2520', '#8a5a33', '#5a3d24', '#0b6d64']) {
    assert.match(css, new RegExp(value))
  }
  assert.doesNotMatch(css, /#9c7200/i)
})

test('composed dialog fields are skinned once, on the shell', () => {
  const rules = [...css.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const shell = rules.find((rule) => /span:has\(> input/.test(rule) && /border: 2\.5px solid/.test(rule))
  assert.ok(shell, 'the DSH field shell must carry the field skin')
  const inner = rules.find((rule) => /span:has\(> input[^{]*\)\s*>\s*input\s*\{/.test(rule))
  assert.ok(inner, 'the input inside a composed shell must not draw its own box')
  for (const declaration of ['border: 0', 'background: transparent', 'box-shadow: none']) {
    assert.ok(inner.includes(declaration), declaration)
  }
})

test('popover material inherits the opaque semantic menu surface', () => {
  const rules = [...css.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const material = rules.find((rule) => rule.includes('--dsw-menu-surface-fill'))
  assert.ok(material, 'the menu material compatibility alias is missing')
  assert.match(material, /--dsw-menu-surface-fill:\s*var\(--dsw-specific-menu\)\s*!important/)
})

test('focus rings use the readable deep mint across shell and composer', () => {
  const rules = [...css.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const globalFocus = rules.find((rule) => rule.includes(':focus-visible {') && rule.includes('outline: 3px solid var(--animal-mint-deep)'))
  const composerFocus = rules.find((rule) => rule.includes('[data-composer-card]:focus-within {'))

  assert.ok(globalFocus, 'global keyboard focus must use the deep mint token')
  assert.ok(composerFocus, 'composer focus state is missing')
  assert.match(composerFocus, /border-color:\s*var\(--animal-mint-deep\)/)
  assert.match(composerFocus, /0 0 0 2px #fffbe7/)
  assert.match(composerFocus, /0 0 0 5px var\(--animal-mint-deep\)/)
})

test('appearance slider paints a warm track and mint progress in both engines', () => {
  const rules = [...css.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const input = rules.find((rule) => rule.includes('.animal-island-appearance__slider input[type="range"] {'))
  const webkitTrack = rules.find((rule) => rule.includes('::-webkit-slider-runnable-track'))
  const webkitThumb = rules.find((rule) => rule.includes('::-webkit-slider-thumb'))
  const firefoxTrack = rules.find((rule) => rule.includes('::-moz-range-track'))
  const firefoxProgress = rules.find((rule) => rule.includes('::-moz-range-progress'))

  assert.ok(input && webkitTrack && webkitThumb && firefoxTrack && firefoxProgress)
  assert.match(input, /appearance:\s*none/)
  assert.match(webkitTrack, /var\(--animal-slider-track\)/)
  assert.match(webkitTrack, /--animal-slider-progress/)
  assert.match(webkitThumb, /border:\s*2px solid var\(--animal-border-strong\)/)
  assert.match(firefoxTrack, /var\(--animal-slider-track\)/)
  assert.match(firefoxProgress, /background:\s*var\(--animal-mint\)/)
  assert.match(css, /--animal-slider-track:\s*#e9dfc9/)
  assert.match(css, /--animal-slider-track:\s*#5a4b3d/)
})

test('wave artwork is an original local SVG rather than a reference asset', () => {
  assert.match(wave, /viewBox="0 0 240 130"/)
  assert.match(wave, /C28 42 58 40 90 62/)
  assert.doesNotMatch(wave, /image\/|href=.*\.png|href=.*\.jpg/)
})

test('dark canvas keeps original night leaf and horizon textures', () => {
  for (const art of [nightLeaves, nightHorizon]) {
    assert.match(art, /<path /)
    assert.doesNotMatch(art, /image\/|href=.*\.png|href=.*\.jpg/)
  }

  const darkCanvas = [...css.matchAll(/[^{}]+\{[^{}]*\}/g)]
    .map((match) => match[0])
    .find((rule) => rule.includes('body[data-ds-dark-theme]') && rule.includes('__ANIMAL_ISLAND_NIGHT_LEAVES__'))
  assert.ok(darkCanvas, 'the night canvas textures are missing')
  assert.match(darkCanvas, /__ANIMAL_ISLAND_NIGHT_HORIZON__/)
  assert.match(darkCanvas, /100% 240px/)
})

test('boot screen becomes a day-night island departure card', () => {
  const uncommented = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const rules = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const boot = rules.find((rule) => rule.includes('[data-dsh-boot]') && rule.includes('__ANIMAL_ISLAND_LEAVES__'))
  const darkBoot = rules.find((rule) => rule.includes('body[data-ds-dark-theme] [data-dsh-boot]') && rule.includes('__ANIMAL_ISLAND_NIGHT_LEAVES__'))
  const seal = rules.find((rule) => rule.includes('[data-dsh-boot-spinner] {'))
  const innerSeal = rules.find((rule) => rule.includes('[data-dsh-boot-spinner]::before {'))
  const orbit = rules.find((rule) => rule.includes('[data-dsh-boot-spinner]::after {'))

  assert.ok(boot, 'the day boot backdrop is missing')
  assert.match(boot, /__ANIMAL_ISLAND_HORIZON__/)
  assert.match(boot, /overflow-x:\s*auto/)
  assert.match(boot, /overflow-y:\s*auto/)
  assert.match(boot, /place-items:\s*safe center/)
  assert.ok(darkBoot, 'the night boot backdrop is missing')
  assert.match(darkBoot, /__ANIMAL_ISLAND_NIGHT_HORIZON__/)
  const card = rules.find(
    (rule) => rule.includes('[data-dsh-boot] > :has([data-dsh-boot-spinner])') && rule.includes('background-color: var(--animal-boot-paper)'),
  )
  assert.ok(card, 'the boot card must be anchored to the spinner hook')
  assert.match(card, /margin:\s*0/)
  assert.ok(seal, 'the boot progress seal is missing')
  assert.match(seal, /animation:\s*none/)
  assert.match(seal, /corner-shape:\s*round/)
  assert.match(seal, /clip-path:\s*circle\(50%\)/)
  assert.match(seal, /conic-gradient\(/)
  assert.match(seal, /box-sizing:\s*border-box/)
  assert.ok(innerSeal, 'the boot leaf disc is missing')
  assert.match(innerSeal, /__ANIMAL_ISLAND_BOOT_LEAF__/)
  assert.match(innerSeal, /inset:\s*5px/)
  assert.match(innerSeal, /clip-path:\s*circle\(50%\)/)
  assert.ok(orbit, 'the boot orbit bead is missing')
  assert.match(orbit, /corner-shape:\s*round/)
  assert.match(orbit, /clip-path:\s*circle\(50%\)/)
  const leafSeal = rules.find(
    (rule) => rule.includes('[data-dsh-boot] > :has([data-dsh-boot-spinner])::before') && rule.includes('__ANIMAL_ISLAND_BOOT_LEAF__'),
  )
  assert.ok(leafSeal, 'the boot leaf seal is missing')
  assert.match(leafSeal, /corner-shape:\s*round/)
  assert.match(css, /:has\(\+ \[data-dsh-boot-spinner\]\)/)
  assert.match(css, /\[data-dsh-boot-spinner\] \+ \*/)
  assert.doesNotMatch(css, /^[^\n{]*\[data-dsh-boot\][^\n{]*>\s*div\b/m)
  assert.doesNotMatch(css, /^[^\n{]*\[data-dsh-boot-spinner\]\s*\+\s*div\b/m)
  assert.match(css, /@keyframes animal-island-boot-orbit/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\[data-dsh-boot-spinner\]::after\s*\{[\s\S]*animation:\s*none\s*!important/)
  assert.match(loadingLeaf, /<path /)
  assert.doesNotMatch(loadingLeaf, /image\/|href=.*\.png|href=.*\.jpg/)
})

test('boot fixtures keep loading anchored and failure diagnostics scrollable', () => {
  const mount = (fixture) => {
    const dom = new JSDOM(fixture, { pretendToBeVisual: true })
    const style = dom.window.document.createElement('style')
    style.textContent = css
    dom.window.document.head.append(style)
    return dom.window
  }

  const loading = mount(bootLoadingFixture)
  const loadingRoot = loading.document.querySelector('[data-dsh-boot]')
  const card = loading.document.querySelector('[data-dsh-boot] > :has([data-dsh-boot-spinner])')
  const wordmark = loading.document.querySelector('[data-dsh-boot] :has(+ [data-dsh-boot-spinner])')
  const spinner = loading.document.querySelector('[data-dsh-boot-spinner]')
  const hint = loading.document.querySelector('[data-dsh-boot-spinner] + *')

  assert.ok(loadingRoot && card && wordmark && spinner && hint)
  assert.equal(loading.getComputedStyle(loadingRoot).overflowX, 'auto')
  assert.equal(loading.getComputedStyle(loadingRoot).overflowY, 'auto')
  assert.equal(loading.getComputedStyle(loadingRoot).placeItems, 'safe center')
  assert.equal(loading.getComputedStyle(spinner).animation, 'none')
  assert.equal(loading.getComputedStyle(spinner).clipPath, 'circle(50%)')
  assert.match(loading.getComputedStyle(spinner).backgroundImage, /conic-gradient/)

  const failure = mount(bootFailureFixture)
  const failureRoot = failure.document.querySelector('[data-dsh-boot]')
  const failureCard = failure.document.querySelector('[data-dsh-boot] > *')

  assert.ok(failureRoot && failureCard)
  assert.equal(failureCard.matches('[data-dsh-boot] > :has([data-dsh-boot-spinner])'), false)
  assert.equal(failure.document.querySelector('[data-dsh-boot-spinner]'), null)
  assert.equal(failure.getComputedStyle(failureRoot).overflowY, 'auto')
  assert.equal(failure.getComputedStyle(failureCard).backgroundColor, 'var(--animal-boot-scrim)')
  assert.equal(failure.getComputedStyle(failureCard).borderRadius, '24px')
  assert.match(failure.document.body.textContent, /final diagnostic remains reachable/)
})

test('skin uses only the reviewed ARIA role seams', () => {
  const roles = new Set([...css.matchAll(/role=["']([^"']+)["']/g)].map((match) => match[1]))
  const allowed = new Set(['button', 'checkbox', 'dialog', 'group', 'listbox', 'menu', 'menuitem', 'menuitemradio', 'option', 'radio', 'switch', 'treeitem'])
  assert.deepEqual(
    [...roles].filter((role) => !allowed.has(role)),
    [],
  )
})

test("selected-row wood grain survives DSH's selected shorthand", () => {
  // DSH paints `.sessionRow.selected` with a `background` shorthand that also
  // resets background-image, and its class specificity beats our attribute
  // selector. The plank's colour, grain and bevel therefore have to be
  // `!important` or the grain silently disappears on the real rows.
  const rules = [...css.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const rule = rules.find((candidate) => /\[role=["']treeitem["']\]\[aria-selected=["']true["']\]/.test(candidate))
  assert.ok(rule, 'the selected-row wood-plank rule is missing')
  for (const declaration of ['background-color:', 'background-image:', 'box-shadow:']) {
    const line = rule.slice(rule.indexOf(declaration)).split(';')[0]
    assert.match(line, /!important/, `${declaration} must beat DSH's selected shorthand`)
  }
  const content = rules.find((candidate) => /\[role=["']treeitem["']\]\[aria-selected=["']true["']\]/.test(candidate) && candidate.includes(':where(span)'))
  assert.ok(content, 'selected-row text correction is missing')
  assert.match(content, /color:\s*var\(--dsw-alias-label-secondary\)\s*!important/)
})
