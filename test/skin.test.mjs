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
    // DSH's markdown code block tags its content area; the block container is
    // reached through it to set --dsl-code-block-border-radius in one place.
    'code-block-content',
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
  assert.ok(contrastRatio('#fff7df', '#0f766d') >= 4.5)
  assert.ok(contrastRatio('#9c7200', '#f0e8d8') >= 3)
  for (const value of ['#6f451f', '#fffbe7', '#2a2520', '#0f766d', '#9c7200']) {
    assert.match(css, new RegExp(value))
  }
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
