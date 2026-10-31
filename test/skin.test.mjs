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
const mastheadFixture = await readFile(new URL('./fixtures/sidebar-masthead/body.html', import.meta.url), 'utf8')

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
    // Windows desktop shell marker: the shell paints its outer frame with the
    // opaque sidebar fill (macOS clears it); the skin clears it so the canvas
    // behind the UI is visible. deepseek-harness discussion #9490.
    'windows-titlebar',
  ])
  assert.deepEqual([...new Set(hooks)].filter((hook) => !allowed.has(hook)), [])
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
  const rule = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes('nav :where(span)'))
  assert.ok(rule, 'the ribbon crumb span colour rule is missing')
  assert.match(rule, /color:\s*#fff3d6\s*!important/)
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

  const frame = rules.find((rule) => (
    rule.includes('div[class]:has(> span > div > .animal-island-hero__brand)') &&
    /min-height:\s*142px/.test(rule)
  ))
  assert.ok(frame, 'the island title scene is missing')
  assert.match(frame, /width:\s*min\(100%,\s*700px\)/)
  assert.match(frame, /border:\s*0/)
  assert.match(frame, /box-shadow:\s*none/)
  assert.doesNotMatch(frame, /\[data-slot/)

  const dayScene = rules.find((rule) => (
    rule.includes('.animal-island-hero__scenery--day') &&
    /opacity:\s*1/.test(rule)
  ))
  assert.ok(dayScene, 'the daylight scenery is missing')
  const nightScene = rules.find((rule) => (
    rule.includes('body[data-ds-dark-theme]') &&
    rule.includes('.animal-island-hero__scenery--night') &&
    /opacity:\s*1/.test(rule)
  ))
  assert.ok(nightScene, 'the night scenery is not enabled in dark mode')
  assert.match(brand, /animal-island-hero__scenery--day/)
  assert.match(brand, /animal-island-hero__scenery--night/)
  assert.match(brand, /animal-island-hero__identity/)
  assert.match(brand, /className="animal-island-hero__english"\s+aria-hidden="true"/)

  const title = rules.find((rule) => (
    rule.includes('> span:has(> span + span)') &&
    /font-size:\s*41px/.test(rule)
  ))
  assert.ok(title, 'the game-opening title is missing')
  assert.match(title, /font-weight:\s*900/)
  assert.match(title, /white-space:\s*nowrap/)
  assert.match(title, /animation:\s*animal-island-hero-title-in/)

  const badge = rules.find((rule) => (
    rule.includes('> span:has(> span + span) > span + span') &&
    /transform:\s*translateY\(4px\)\s+rotate\(2deg\)/.test(rule)
  ))
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
  assert.ok(contrastRatio('#9c7200', '#f0e8d8') >= 3)
  for (const value of ['#6f451f', '#fffbe7', '#2a2520', '#8a5a33', '#5a3d24', '#9c7200']) {
    assert.match(css, new RegExp(value))
  }
})

test('brand ferry ticket grows DSH clip box and keeps the CJK ink clear', () => {
  // Comments sit between rules, so they would otherwise land inside the
  // selector text this parse splits on.
  const uncommented = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const rules = [...uncommented.matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const declarationsFor = (selector) => {
    const merged = {}
    for (const rule of rules) {
      const selectors = rule.slice(0, rule.indexOf('{')).split(',').map((part) => part.trim())
      if (!selectors.includes(selector)) continue
      for (const declaration of rule.matchAll(/([a-z-]+):\s*([^;{}]+)/g)) {
        merged[declaration[1]] = declaration[2].trim()
      }
    }
    return merged
  }
  const px = (value) => Number.parseFloat(value)
  const name = declarationsFor('.animal-island-brand__name')
  const strong = declarationsFor('.animal-island-brand__name strong')
  const small = declarationsFor('.animal-island-brand__name small')

  // The ticket is taller than DSH's 24px brand box, so the logo row has to
  // grow to hold it and release its own clip; the ticket itself is 60px high
  // and 216px wide, centred in the row.
  const row = rules.find((rule) => rule.includes('> button .animal-island-brand__name') && /height:\s*80px/.test(rule))
  assert.ok(row, 'the logo row must grow to 80px for the ticket')
  assert.match(row, /overflow:\s*visible/)

  const brand = rules.find((rule) => rule.includes(':has(.animal-island-brand__name)') && /height:\s*60px/.test(rule))
  assert.ok(brand, 'the brand wrapper must be the 60px ticket')
  assert.match(brand, /width:\s*216px/)
  assert.match(brand, /overflow:\s*visible/)
  assert.match(brand, /border:\s*0/)
  assert.match(brand, /border-radius:\s*9px/)
  assert.match(brand, /background:\s*#5a3719/)
  assert.match(brand, /padding:\s*0 !important/)
  assert.match(brand, /-webkit-mask-image:\s*var\(--animal-ticket-notch\)/)
  assert.match(brand, /mask-image:\s*var\(--animal-ticket-notch\)/)
  assert.match(brand, /mask-composite:\s*intersect/)
  assert.match(brand, /--animal-ticket-edge:\s*2px/)
  assert.match(brand, /--animal-ticket-notch-cut:\s*7px/)
  assert.match(
    brand,
    /--animal-ticket-notch-rim:\s*calc\(var\(--animal-ticket-notch-cut\) \+ var\(--animal-ticket-edge\)\)/,
  )
  assert.match(brand, /circle at var\(--animal-ticket-stub-width\) 0/)
  assert.match(brand, /circle at var\(--animal-ticket-stub-width\) 100%/)
  assert.match(brand, /transparent 0 calc\(var\(--animal-ticket-notch-cut\) - 0\.4px\)/)
  assert.doesNotMatch(brand, /--dsw-specific-sidebar-fill/)
  assert.equal(name.overflow, 'visible')

  // The mint counterfoil must run to the ticket edge without painting its
  // texture over the punched rim.
  const counterfoil = rules.find((rule) => (
    rule.includes(':has(.animal-island-brand__mark)') &&
    /background-size:\s*8px 8px/.test(rule)
  ))
  assert.ok(counterfoil, 'the mark wrapper must become the mint counterfoil')
  assert.match(counterfoil, /> span > span:has\(\.animal-island-brand__mark\)/)
  assert.match(counterfoil, /align-self:\s*stretch/)
  assert.match(counterfoil, /transform:\s*none !important/)
  assert.match(counterfoil, /circle at 100% 0/)
  assert.match(counterfoil, /circle at 100% 100%/)

  // The solid button is the rim. One paper layer with a transparent 2px border
  // covers it, then cuts a 2px-larger hole at the same origin. Both the outer
  // rounded rect and the punch therefore follow one continuous geometry.
  const paper = rules.find((rule) => (
    rule.includes(':has(.animal-island-brand__name)::after') &&
    /background-clip:\s*padding-box/.test(rule)
  ))
  assert.ok(paper, 'the ticket paper layer must sit above the solid rim')
  assert.match(paper, /inset:\s*0/)
  assert.match(paper, /border:\s*var\(--animal-ticket-edge\) solid transparent/)
  assert.match(paper, /border-radius:\s*inherit/)
  assert.match(paper, /background-clip:\s*padding-box/)
  assert.match(paper, /background-origin:\s*border-box/)
  assert.match(paper, /linear-gradient\(/)
  // Keep the paper edge from reading as a white outline at sidebar size.
  assert.doesNotMatch(paper, /inset 0 0 0 1px/)
  assert.match(paper, /inset 0 1px 0 rgba\(255, 253, 246, 0\.55\)/)
  assert.match(paper, /-webkit-mask-image:\s*var\(--animal-ticket-paper-notch\)/)
  assert.match(paper, /mask-image:\s*var\(--animal-ticket-paper-notch\)/)
  assert.match(paper, /mask-composite:\s*intersect/)
  assert.doesNotMatch(css, /clip-path:\s*inset\(50% 50% 0 0\)/)
  assert.doesNotMatch(css, /clip-path:\s*inset\(50% 0 0 50%\)/)

  // The dashed seam shares the mask origin. Centring it on the stub edge keeps
  // the dash out of the rim rather than ending it beside the punched corner.
  const seam = rules.find((rule) => (
    rule.includes(':has(.animal-island-brand__mark)::after') &&
    /repeating-linear-gradient/.test(rule)
  ))
  assert.ok(seam, 'the tear seam must be a centred dashed rule')
  assert.match(seam, /> span > span:has\(\.animal-island-brand__mark\)::after/)
  assert.match(seam, /right:\s*-1px/)
  assert.match(seam, /width:\s*2px/)
  assert.match(
    css,
    /--animal-ticket-notch-rim:\s*calc\(var\(--animal-ticket-notch-cut\) \+ var\(--animal-ticket-edge\)\)/,
  )

  // DSH's own 24px boxes inside the wrapper would clip the lockup even after
  // the button grows; they are released by the slot's own class.
  const nameBox = rules.find((rule) => rule.includes(':has(> .animal-island-brand__name)') && /height:\s*auto/.test(rule))
  assert.ok(nameBox, 'the 24px brand-name box must be released')
  const labelHost = rules.find((rule) => (
    rule.includes('> span > span:has(.animal-island-brand__name)') &&
    /padding:\s*0 10px 0 11px/.test(rule)
  ))
  assert.ok(labelHost, 'the label host must stay inside the ticket paper')

  // Nested :has() is invalid CSS and is dropped silently, taking the whole rule
  // with it — the nameplate would then silently fall back to DSH's geometry.
  assert.doesNotMatch(css, /:has\([^)]*:has\(/)

  const lockup = px(strong['line-height']) + px(small['margin-top']) + px(small['line-height'])
  assert.ok(lockup <= 60, `brand lockup occupies ${lockup}px; the ticket is 60px`)

  // A 20px CJK wordmark carries a ~1.45em font box, and roughly 0.28em of its
  // ascent sits above the ideograph ink. Both have to stay below the clip line.
  const fontSize = px(strong['font-size'])
  const clearance = (px(strong['line-height']) - 1.45 * fontSize) / 2 + 0.28 * fontSize
  assert.ok(
    clearance >= 2,
    `wordmark clears the clip line by only ${clearance.toFixed(2)}px; the top strokes get shaved`,
  )
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

test('wave artwork is an original local SVG rather than a reference asset', () => {
  assert.match(wave, /viewBox="0 0 240 130"/)
  assert.match(wave, /C28 42 58 40 90 62/)
  assert.doesNotMatch(wave, /image\/|href=.*\.png|href=.*\.jpg/)
})

test('skin uses only the reviewed ARIA role seams', () => {
  const roles = new Set([...css.matchAll(/role='([^']+)'/g)].map((match) => match[1]))
  const allowed = new Set([
    'button',
    'checkbox',
    'dialog',
    'group',
    'listbox',
    'menu',
    'menuitem',
    'menuitemradio',
    'option',
    'radio',
    'switch',
    'treeitem',
  ])
  assert.deepEqual([...roles].filter((role) => !allowed.has(role)), [])
})

test("selected-row wood grain survives DSH's selected shorthand", () => {
  // DSH paints `.sessionRow.selected` with a `background` shorthand that also
  // resets background-image, and its class specificity beats our attribute
  // selector. The plank's colour, grain and bevel therefore have to be
  // `!important` or the grain silently disappears on the real rows.
  const rules = [...css.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/[^{}]+\{[^{}]*\}/g)].map((match) => match[0])
  const rule = rules.find((candidate) => /\[role='treeitem'\]\[aria-selected='true'\]/.test(candidate))
  assert.ok(rule, 'the selected-row wood-plank rule is missing')
  for (const declaration of ['background-color:', 'background-image:', 'box-shadow:']) {
    const line = rule.slice(rule.indexOf(declaration)).split(';')[0]
    assert.match(line, /!important/, `${declaration} must beat DSH's selected shorthand`)
  }
})
