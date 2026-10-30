import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { contrastRatio } from '../lib/tokens.js'

const css = await readFile(new URL('../src/client/skin.css', import.meta.url), 'utf8')
const slots = await readFile(new URL('../src/client/slots.ts', import.meta.url), 'utf8')
const install = await readFile(new URL('../src/client/install.ts', import.meta.url), 'utf8')
const wave = await readFile(new URL('../src/client/assets/sidebar-wave.svg', import.meta.url), 'utf8')

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
  ])
  assert.deepEqual([...new Set(hooks)].filter((hook) => !allowed.has(hook)), [])
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

test('owned CSS hard-coded text and focus combinations remain readable', () => {
  assert.ok(contrastRatio('#6f451f', '#fffbe7') >= 4.5)
  assert.ok(contrastRatio('#f7e7c7', '#2a2520') >= 4.5)
  // Wooden header ribbon: cream text on the painted plank in both modes.
  assert.ok(contrastRatio('#fff3d6', '#8a5a33') >= 4.5)
  assert.ok(contrastRatio('#f6e6c8', '#5a3d24') >= 4.5)
  assert.ok(contrastRatio('#9c7200', '#f0e8d8') >= 3)
  for (const value of ['#6f451f', '#fffbe7', '#2a2520', '#8a5a33', '#5a3d24', '#9c7200']) {
    assert.match(css, new RegExp(value))
  }
})

test('brand lockup fits DSH 24px clip box with CJK headroom', () => {
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

  // DSH renders this slot inside its own brand box and clips the overflow of
  // it, so the two-line lockup has to fit that box or the glyph tops get shaved.
  assert.equal(name.overflow, 'hidden')
  // The ASCII line declares no line-height of its own; it inherits the grid's
  // unitless one, which resolves against that line's own font size.
  const smallLineHeight = small['line-height'] !== undefined
    ? px(small['line-height'])
    : px(name['line-height']) * px(small['font-size'])
  const lockup = px(strong['line-height']) + px(small['margin-top']) + smallLineHeight
  assert.ok(lockup <= 24, `brand lockup occupies ${lockup}px; DSH clips at 24px`)

  // A 14px CJK wordmark carries a ~1.45em font box, and roughly 0.28em of its
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
