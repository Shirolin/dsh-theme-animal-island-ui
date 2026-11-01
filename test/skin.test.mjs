import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { contrastRatio } from '../lib/tokens.js'
import { ALLOWED_DATA_HOOKS, PUBLIC_SLOTS, REVIEWED_ARIA_ATTRIBUTES, REVIEWED_ARIA_ROLES } from '../scripts/seam-contract.mjs'
import { queryCssRules } from './css-rules.mjs'

const css = await readFile(new URL('../src/client/skin.css', import.meta.url), 'utf8')
const ruleQuery = queryCssRules(css)
const selectors = ruleQuery.all.map((rule) => rule.selector).join('\n')
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
  assert.match(selectors, /html\[data-dsh-animal-island-skin\]/)
  assert.match(selectors, /\.animal-island-brand__mark/)
  assert.doesNotMatch(selectors, /(?<![A-Za-z0-9_-])\.[A-Za-z][A-Za-z0-9-]*_[A-Za-z0-9]{5,}(?![A-Za-z0-9_-])/)
  assert.doesNotMatch(selectors, /\[data-slot[=\]]/)
  assert.doesNotMatch(selectors, /data-cordis-panel/)
  assert.doesNotMatch(selectors, /:nth-child|:first-child|:last-child/)
})

test('skin uses only the reviewed stable data hooks', () => {
  const hooks = [...selectors.matchAll(/\[data-([a-z][a-z0-9-]*)(?:[=\]])/g)].map((match) => match[1])
  const allowed = new Set(ALLOWED_DATA_HOOKS)
  assert.deepEqual(
    [...new Set(hooks)].filter((hook) => !allowed.has(hook)),
    [],
  )
})

test('light open-target boundaries stay perceivable', () => {
  const boundary = ruleQuery.find(
    (rule) =>
      rule.selector.includes('body:not([data-ds-dark-theme])') &&
      rule.selector.includes('[data-open-target]') &&
      rule.declaration('border-color')?.value === 'var(--animal-control-border)' &&
      rule.declaration('border-color')?.important,
  )
  const divider = ruleQuery.find(
    (rule) =>
      rule.selector.includes('body:not([data-ds-dark-theme])') &&
      rule.selector.includes('[data-open-target]') &&
      rule.selector.includes('button[aria-haspopup="menu"]') &&
      rule.declaration('border-left-color')?.value === 'var(--animal-control-border)' &&
      rule.declaration('border-left-color')?.important,
  )

  assert.ok(boundary, 'the light open-target boundary override is missing')
  assert.ok(divider, 'the light open-target divider override is missing')
  assert.ok(contrastRatio('#8f765e', '#d2e7d5') >= 3)
})

test('light plugin controls stay perceivable and plugin rows keep a reading surface', () => {
  const closedSwitch = ruleQuery.find(
    (candidate) =>
      candidate.selector.includes('body:not([data-ds-dark-theme])') &&
      candidate.selector.includes('button[role="switch"]') &&
      candidate.declaration('box-shadow')?.value.startsWith('inset 0 0 0 1.5px var(--animal-control-border)'),
  )
  const checkedSwitch = ruleQuery.find(
    (candidate) =>
      candidate.selector.includes('body:not([data-ds-dark-theme])') &&
      candidate.selector.includes('button[role="switch"][aria-checked="true"]') &&
      candidate.declaration('background-color')?.value === 'var(--animal-mint-deep)',
  )
  const pluginRow = ruleQuery.find(
    (candidate) =>
      candidate.selector.includes('body:not([data-ds-dark-theme])') &&
      candidate.selector.includes('li:is([data-plugin-item], [data-plugin-package])') &&
      candidate.declaration('background-color')?.value === 'rgba(250, 248, 243, 0.48)',
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
  const sendRules = ruleQuery.filter((rule) => rule.selector.includes('[data-composer-card] button[aria-label]'))

  assert.ok(sendRules.length >= 5, 'the composer send-key rules are missing')
  for (const rule of sendRules) {
    assert.match(rule.selector, /:has\(svg\):not\(:has\(span\)\)/)
  }

  const selector = sendRules.find((rule) => rule.declaration('position')?.value === 'relative')?.selector
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
  const rule = ruleQuery.find((candidate) => candidate.selector.includes('[data-composer-card]:focus-within::before'))

  assert.ok(rule, 'the focused composer tail rule is missing')
  assert.equal(rule.declaration('border-right-color')?.value, 'var(--animal-mint-deep)')
  assert.equal(rule.declaration('border-bottom-color')?.value, 'var(--animal-mint-deep)')
})

test('windows shell frame is transparent and its content corner is flattened', () => {
  // DSH's Windows AppFrame paints `--dsw-specific-sidebar-fill` over the whole
  // window and rounds the content's top-left corner; macOS/web do neither.
  // Without this shim the veil composites over the opaque sidebar fill and the
  // slider looks dead only on desktop, and the shell corner shows as a stray
  // 16px curve against the themed canvas.
  const frame = ruleQuery.find((candidate) => candidate.selector.includes('[data-windows-titlebar] #root > div > div'))
  assert.ok(frame, 'the Windows shell frame workaround is missing')
  assert.equal(frame.declaration('background')?.value, 'transparent')
  assert.equal(frame.declaration('background')?.important, true)
  // DSH sets the token on `.frame` itself, so it must be overridden there too;
  // setting it on <html> is shadowed and the 16px corner stays.
  assert.equal(frame.declaration('--dsh-windows-content-radius')?.value, '0px')
})

test('windows dark caption keeps a third surface above the sidebar', () => {
  const caption = ruleQuery.find(
    (rule) =>
      rule.selector.includes('html[data-windows-titlebar]') &&
      rule.selector.includes('body[data-ds-dark-theme]') &&
      rule.declaration('--dsw-specific-sidebar-fill')?.value === '#1f3034' &&
      rule.declaration('--dsw-specific-sidebar-fill')?.important,
  )
  const sidebar = ruleQuery.find(
    (rule) =>
      rule.selector.includes('html[data-windows-titlebar]') &&
      rule.selector.includes('body[data-ds-dark-theme]') &&
      rule.selector.includes('div:has(> nav[aria-label])') &&
      rule.declaration('background-color')?.value === '#303444' &&
      rule.declaration('background-color')?.important,
  )

  assert.ok(caption, 'the dark Windows caption token is missing')
  assert.ok(sidebar, 'the dark Windows sidebar surface is missing')
})

test('windows light caption uses the canvas mint while the app keeps its cream surfaces', () => {
  const caption = ruleQuery.find(
    (rule) =>
      rule.selector.includes('html[data-windows-titlebar]') &&
      rule.selector.includes('body:not([data-ds-dark-theme])') &&
      rule.declaration('--dsw-specific-sidebar-fill')?.value === '#e7efe5' &&
      rule.declaration('--dsw-specific-sidebar-fill')?.important,
  )
  const appRoot = ruleQuery.find(
    (rule) =>
      rule.selector.includes('html[data-windows-titlebar]') &&
      rule.selector.includes('body:not([data-ds-dark-theme])') &&
      rule.selector.includes('#root') &&
      rule.declaration('--dsw-specific-sidebar-fill')?.value === 'rgba(250, 248, 243, 0.82)' &&
      rule.declaration('--dsw-specific-sidebar-fill')?.important,
  )
  const sidebar = ruleQuery.find(
    (rule) =>
      rule.selector.includes('html[data-windows-titlebar]') &&
      rule.selector.includes('body:not([data-ds-dark-theme])') &&
      rule.selector.includes('div:has(> nav[aria-label])') &&
      rule.declaration('background-color')?.value === 'rgba(250, 248, 243, 0.82)' &&
      rule.declaration('background-color')?.important,
  )

  assert.ok(caption, 'the light Windows caption token is missing')
  assert.ok(appRoot, 'the app root does not restore the cream sidebar token')
  assert.ok(sidebar, 'the light Windows sidebar surface is missing')
})

test('header ribbon colors the current crumb span directly', () => {
  // 0.2.x's `.crumbCurrent` declares label-primary on the span, which beats the
  // nav's inherited colour. The ribbon must set the span explicitly or the title
  // becomes brown-on-brown (empty-looking plank) on desktop.
  const rule = ruleQuery.find((candidate) => candidate.selector.includes('nav :where(span)'))
  assert.ok(rule, 'the ribbon crumb span colour rule is missing')
  assert.equal(rule.declaration('color')?.value, '#fff3d6')
  assert.equal(rule.declaration('color')?.important, true)
})

test('light conversation header keeps a quiet but visible divider', () => {
  const rule = ruleQuery.find(
    (candidate) =>
      candidate.selector.includes('body:not([data-ds-dark-theme])') &&
      candidate.selector.includes('header:has([data-conversation-header-corner])') &&
      candidate.declaration('border-bottom-color')?.value === '#b9aa90' &&
      candidate.declaration('border-bottom-color')?.important,
  )

  assert.ok(rule, 'the light conversation header divider override is missing')
  assert.equal(
    rule.declarations.some((declaration) => declaration.property === 'border-width' || declaration.property === 'border-bottom-width'),
    false,
  )
  assert.ok(contrastRatio('#b9aa90', '#d2e7d5') >= 1.5)
})

test('slot installation uses public contracts without DOM scanning', () => {
  for (const source of [slots, install]) {
    assert.doesNotMatch(source, /querySelector|closest\(|MutationObserver|__DSH_BOOT__|ReactDOM/)
    assert.doesNotMatch(source, /(?<![A-Za-z0-9_-])\.[A-Za-z][A-Za-z0-9-]*_[A-Za-z0-9]{5,}(?![A-Za-z0-9_-])/)
  }
  assert.doesNotMatch(slots, /register\(\{\s*name:\s*['"]sidebar['"]/)
  for (const key of PUBLIC_SLOTS.filter((slot) => slot.priority === -100).map((slot) => slot.name)) {
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
  const frame = ruleQuery.find(
    (rule) => rule.selector.includes('div[class]:has(> span > div > .animal-island-hero__brand)') && rule.declaration('min-height')?.value === '142px',
  )
  assert.ok(frame, 'the island title scene is missing')
  assert.equal(frame.declaration('width')?.value, 'min(100%, 700px)')
  assert.equal(frame.declaration('border')?.value, '0')
  assert.equal(frame.declaration('box-shadow')?.value, 'none')
  assert.doesNotMatch(frame.selector, /\[data-slot/)

  const dayScene = ruleQuery.find((rule) => rule.selector.includes('.animal-island-hero__scenery--day') && rule.declaration('opacity')?.value === '1')
  assert.ok(dayScene, 'the daylight scenery is missing')
  const nightScene = ruleQuery.find(
    (rule) =>
      rule.selector.includes('body[data-ds-dark-theme]') &&
      rule.selector.includes('.animal-island-hero__scenery--night') &&
      rule.declaration('opacity')?.value === '1',
  )
  assert.ok(nightScene, 'the night scenery is not enabled in dark mode')
  assert.match(brand, /animal-island-hero__scenery--day/)
  assert.match(brand, /animal-island-hero__scenery--night/)
  assert.match(brand, /animal-island-hero__identity/)
  assert.match(brand, /className="animal-island-hero__english"\s+aria-hidden="true"/)

  const title = ruleQuery.find((rule) => rule.selector.includes('> span:has(> span + span)') && rule.declaration('font-size')?.value === '41px')
  assert.ok(title, 'the game-opening title is missing')
  assert.equal(title.declaration('font-weight')?.value, '900')
  assert.equal(title.declaration('white-space')?.value, 'nowrap')
  assert.match(title.declaration('animation')?.value ?? '', /animal-island-hero-title-in/)

  const badge = ruleQuery.find(
    (rule) => rule.selector.includes('> span:has(> span + span) > span + span') && rule.declaration('transform')?.value === 'translateY(4px) rotate(2deg)',
  )
  assert.ok(badge, 'the preview badge must sit beside the title')
  assert.equal(badge.declaration('border-radius')?.value, '999px')

  const inMedia = (rule, condition) => rule.atRules.some((atRule) => atRule.includes(condition))
  assert.ok(ruleQuery.find((rule) => inMedia(rule, 'max-width: 520px') && rule.declaration('min-height')?.value === '124px'))
  assert.ok(ruleQuery.find((rule) => inMedia(rule, 'max-width: 520px') && rule.declaration('font-size')?.value === '34px'))
  assert.ok(ruleQuery.find((rule) => inMedia(rule, 'max-width: 360px') && rule.declaration('font-size')?.value === '30px'))
  assert.ok(
    ruleQuery.find(
      (rule) =>
        rule.selector.includes('.animal-island-hero__scenery *') &&
        inMedia(rule, 'prefers-reduced-motion: reduce') &&
        rule.declaration('animation')?.value === 'none' &&
        rule.declaration('animation')?.important,
    ),
  )
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
  const root = ruleQuery.find((rule) => rule.selector === 'html[data-dsh-animal-island-skin]')
  assert.equal(root?.declaration('--animal-ink')?.value, '#6f451f')
  assert.equal(root?.declaration('--animal-mint-deep')?.value, '#0b6d64')
  assert.ok(
    ruleQuery.find(
      (rule) =>
        rule.selector.includes('[data-composer-card]') &&
        rule.declaration('background-color')?.value === '#fffbe7' &&
        rule.declaration('background-color')?.important,
    ),
  )
  assert.ok(
    ruleQuery.find(
      (rule) =>
        rule.selector.includes('body[data-ds-dark-theme]') &&
        rule.selector.includes('[data-composer-card]') &&
        rule.declaration('background-color')?.value === '#2a2520' &&
        rule.declaration('background-color')?.important,
    ),
  )
  assert.ok(
    ruleQuery.find(
      (rule) => rule.selector.includes('header:has([data-conversation-header-corner])') && rule.declaration('background-color')?.value === '#8a5a33',
    ),
  )
  assert.ok(
    ruleQuery.find(
      (rule) =>
        rule.selector.includes('body[data-ds-dark-theme]') &&
        rule.selector.includes('header:has([data-conversation-header-corner])') &&
        rule.declaration('background-color')?.value === '#5a3d24',
    ),
  )
  assert.equal(
    ruleQuery.all.some((rule) => rule.declarations.some((declaration) => /#9c7200|rgb\(156, 114, 0\)/i.test(declaration.value))),
    false,
  )
})

test('composed dialog fields are skinned once, on the shell', () => {
  const shell = ruleQuery.find(
    (rule) => /span:has\(> input/.test(rule.selector) && rule.declaration('border')?.value === '2.5px solid var(--animal-border-strong)',
  )
  assert.ok(shell, 'the DSH field shell must carry the field skin')
  const inner = ruleQuery.find((rule) => rule.selector.includes('span:has(> input') && /\)\s*>\s*input$/.test(rule.selector))
  assert.ok(inner, 'the input inside a composed shell must not draw its own box')
  assert.equal(inner.declaration('border')?.value, '0')
  assert.equal(inner.declaration('background')?.value, 'transparent')
  assert.equal(inner.declaration('box-shadow')?.value, 'none')
})

test('popover material inherits the opaque semantic menu surface', () => {
  const material = ruleQuery.find((rule) => rule.declaration('--dsw-menu-surface-fill') !== undefined)
  assert.ok(material, 'the menu material compatibility alias is missing')
  assert.equal(material.declaration('--dsw-menu-surface-fill')?.value, 'var(--dsw-specific-menu)')
  assert.equal(material.declaration('--dsw-menu-surface-fill')?.important, true)
})

test('focus rings use the readable deep mint across shell and composer', () => {
  const globalFocus = ruleQuery.find(
    (rule) => rule.selector.includes(':focus-visible') && rule.declaration('outline')?.value === '3px solid var(--animal-mint-deep)',
  )
  const composerFocus = ruleQuery.find((rule) => rule.selector.includes('[data-composer-card]:focus-within'))

  assert.ok(globalFocus, 'global keyboard focus must use the deep mint token')
  assert.ok(composerFocus, 'composer focus state is missing')
  assert.equal(composerFocus.declaration('border-color')?.value, 'var(--animal-mint-deep)')
  assert.match(composerFocus.declaration('box-shadow')?.value ?? '', /0 0 0 2px #fffbe7/)
  assert.match(composerFocus.declaration('box-shadow')?.value ?? '', /0 0 0 5px var\(--animal-mint-deep\)/)
})

test('appearance slider paints a warm track and mint progress in both engines', () => {
  const input = ruleQuery.find((rule) => rule.selector.includes('.animal-island-appearance__slider input[type="range"]'))
  const webkitTrack = ruleQuery.find((rule) => rule.selector.includes('::-webkit-slider-runnable-track'))
  const webkitThumb = ruleQuery.find((rule) => rule.selector.includes('::-webkit-slider-thumb'))
  const firefoxTrack = ruleQuery.find((rule) => rule.selector.includes('::-moz-range-track'))
  const firefoxProgress = ruleQuery.find((rule) => rule.selector.includes('::-moz-range-progress'))

  assert.ok(input && webkitTrack && webkitThumb && firefoxTrack && firefoxProgress)
  assert.equal(input.declaration('appearance')?.value, 'none')
  assert.match(webkitTrack.declaration('background')?.value ?? '', /var\(--animal-slider-track\)/)
  assert.match(webkitTrack.declaration('background')?.value ?? '', /--animal-slider-progress/)
  assert.equal(webkitThumb.declaration('border')?.value, '2px solid var(--animal-border-strong)')
  assert.match(firefoxTrack.declaration('background')?.value ?? '', /var\(--animal-slider-track\)/)
  assert.match(firefoxProgress.declaration('background')?.value ?? '', /var\(--animal-mint\)/)
  assert.ok(ruleQuery.find((rule) => rule.declaration('--animal-slider-track')?.value === '#e9dfc9'))
  assert.ok(ruleQuery.find((rule) => rule.declaration('--animal-slider-track')?.value === '#5a4b3d'))
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

  const darkCanvas = ruleQuery.find(
    (rule) => rule.selector.includes('body[data-ds-dark-theme]') && rule.declaration('background-image')?.value.includes('__ANIMAL_ISLAND_NIGHT_LEAVES__'),
  )
  assert.ok(darkCanvas, 'the night canvas textures are missing')
  assert.match(darkCanvas.declaration('background-image')?.value ?? '', /__ANIMAL_ISLAND_NIGHT_HORIZON__/)
  assert.match(darkCanvas.declaration('background-size')?.value ?? '', /100% 240px/)
})

test('boot screen becomes a day-night island departure card', () => {
  const boot = ruleQuery.find(
    (rule) => rule.selector.includes('[data-dsh-boot]') && rule.declaration('background-image')?.value.includes('__ANIMAL_ISLAND_LEAVES__'),
  )
  const darkBoot = ruleQuery.find(
    (rule) =>
      rule.selector.includes('body[data-ds-dark-theme] [data-dsh-boot]') &&
      rule.declaration('background-image')?.value.includes('__ANIMAL_ISLAND_NIGHT_LEAVES__'),
  )
  const seal = ruleQuery.find((rule) => rule.selector.endsWith('[data-dsh-boot-spinner]'))
  const innerSeal = ruleQuery.find((rule) => rule.selector.includes('[data-dsh-boot-spinner]::before'))
  const orbit = ruleQuery.find((rule) => rule.selector.includes('[data-dsh-boot-spinner]::after'))

  assert.ok(boot, 'the day boot backdrop is missing')
  assert.match(boot.declaration('background-image')?.value ?? '', /__ANIMAL_ISLAND_HORIZON__/)
  assert.equal(boot.declaration('overflow-x')?.value, 'auto')
  assert.equal(boot.declaration('overflow-y')?.value, 'auto')
  assert.equal(boot.declaration('place-items')?.value, 'safe center')
  assert.ok(darkBoot, 'the night boot backdrop is missing')
  assert.match(darkBoot.declaration('background-image')?.value ?? '', /__ANIMAL_ISLAND_NIGHT_HORIZON__/)
  const card = ruleQuery.find(
    (rule) =>
      rule.selector.includes('[data-dsh-boot] > :has([data-dsh-boot-spinner])') && rule.declaration('background-color')?.value === 'var(--animal-boot-paper)',
  )
  assert.ok(card, 'the boot card must be anchored to the spinner hook')
  assert.equal(card.declaration('margin')?.value, '0')
  assert.ok(seal, 'the boot progress seal is missing')
  assert.equal(seal.declaration('animation')?.value, 'none')
  assert.equal(seal.declaration('corner-shape')?.value, 'round')
  assert.equal(seal.declaration('clip-path')?.value, 'circle(50%)')
  assert.match(seal.declaration('background-image')?.value ?? '', /conic-gradient\(/)
  assert.equal(seal.declaration('box-sizing')?.value, 'border-box')
  assert.ok(innerSeal, 'the boot leaf disc is missing')
  assert.match(innerSeal.declaration('background-image')?.value ?? '', /__ANIMAL_ISLAND_BOOT_LEAF__/)
  assert.equal(innerSeal.declaration('inset')?.value, '5px')
  assert.equal(innerSeal.declaration('clip-path')?.value, 'circle(50%)')
  assert.ok(orbit, 'the boot orbit bead is missing')
  assert.equal(orbit.declaration('corner-shape')?.value, 'round')
  assert.equal(orbit.declaration('clip-path')?.value, 'circle(50%)')
  const leafSeal = ruleQuery.find(
    (rule) =>
      rule.selector.includes('[data-dsh-boot] > :has([data-dsh-boot-spinner])::before') &&
      rule.declaration('background-image')?.value.includes('__ANIMAL_ISLAND_BOOT_LEAF__'),
  )
  assert.ok(leafSeal, 'the boot leaf seal is missing')
  assert.equal(leafSeal.declaration('corner-shape')?.value, 'round')
  assert.match(selectors, /:has\(\+ \[data-dsh-boot-spinner\]\)/)
  assert.match(selectors, /\[data-dsh-boot-spinner\] \+ \*/)
  assert.doesNotMatch(selectors, /\[data-dsh-boot\][^\n]*>\s*div\b/)
  assert.doesNotMatch(selectors, /\[data-dsh-boot-spinner\]\s*\+\s*div\b/)
  assert.ok(ruleQuery.atRules.includes('@keyframes animal-island-boot-orbit'))
  assert.ok(
    ruleQuery.find(
      (rule) =>
        rule.selector.includes('[data-dsh-boot-spinner]::after') &&
        rule.atRules.some((atRule) => atRule.includes('prefers-reduced-motion: reduce')) &&
        rule.declaration('animation')?.value === 'none' &&
        rule.declaration('animation')?.important,
    ),
  )
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
  const roles = new Set([...selectors.matchAll(/role=["']([^"']+)["']/g)].map((match) => match[1]))
  const allowed = new Set(REVIEWED_ARIA_ROLES)
  assert.deepEqual(
    [...roles].filter((role) => !allowed.has(role)),
    [],
  )
})

test('skin uses only the reviewed ARIA attributes', () => {
  const attributes = new Set([...selectors.matchAll(/\[(aria-[a-z-]+)(?:=[^\]]+)?\]/g)].map((match) => match[1]))
  const allowed = new Set(REVIEWED_ARIA_ATTRIBUTES)
  assert.deepEqual(
    [...attributes].filter((attribute) => !allowed.has(attribute)),
    [],
  )
})

test("selected-row wood grain survives DSH's selected shorthand", () => {
  // DSH paints `.sessionRow.selected` with a `background` shorthand that also
  // resets background-image, and its class specificity beats our attribute
  // selector. The plank's colour, grain and bevel therefore have to be
  // `!important` or the grain silently disappears on the real rows.
  const rule = ruleQuery.find((candidate) => /\[role=["']treeitem["']\]\[aria-selected=["']true["']\]/.test(candidate.selector))
  assert.ok(rule, 'the selected-row wood-plank rule is missing')
  for (const property of ['background-color', 'background-image', 'box-shadow']) {
    assert.equal(rule.declaration(property)?.important, true, `${property} must beat DSH's selected shorthand`)
  }
  const content = ruleQuery.find(
    (candidate) => /\[role=["']treeitem["']\]\[aria-selected=["']true["']\]/.test(candidate.selector) && candidate.selector.includes(':where(span)'),
  )
  assert.ok(content, 'selected-row text correction is missing')
  assert.equal(content.declaration('color')?.value, 'var(--dsw-alias-label-secondary)')
  assert.equal(content.declaration('color')?.important, true)
})
