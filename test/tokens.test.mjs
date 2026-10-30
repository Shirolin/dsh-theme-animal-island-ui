import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  ANIMAL_ISLAND_PALETTES,
  buildTokenOverrides,
  buildTokens,
  contrastRatio,
} from '../lib/tokens.js'

const EXPECTED_TOKENS = `
--ds-font-family-code
--dsw-alias-bg-base
--dsw-alias-bg-layer-1
--dsw-alias-bg-layer-2
--dsw-alias-bg-layer-3
--dsw-alias-bg-mask-1
--dsw-alias-bg-mask-2
--dsw-alias-bg-mask-3
--dsw-alias-bg-mask-drop
--dsw-alias-bg-mask-photo
--dsw-alias-bg-module-platform
--dsw-alias-bg-multi-select
--dsw-alias-bg-overlay
--dsw-alias-bg-skeleton
--dsw-alias-border-inverted
--dsw-alias-border-inverted2
--dsw-alias-border-l1
--dsw-alias-border-l2
--dsw-alias-border-l2-darkmode-thin
--dsw-alias-border-l3
--dsw-alias-border-l4
--dsw-alias-brand-primary
--dsw-alias-brand-primary-invert
--dsw-alias-brand-primary-new-colorprimary-new-color
--dsw-alias-brand-text
--dsw-alias-button-contrast-fill
--dsw-alias-button-elevated-fill
--dsw-alias-button-floating-fill
--dsw-alias-button-floating-hover
--dsw-alias-button-ghost-active-border
--dsw-alias-button-ghost-active-fill
--dsw-alias-button-ghost-active-hover
--dsw-alias-button-info-fill
--dsw-alias-button-info-hover
--dsw-alias-button-primary-dimmed
--dsw-alias-button-primary-fill
--dsw-alias-button-primary-hover
--dsw-alias-button-tool-bar-fill
--dsw-alias-button-tool-bar-fill-invisible
--dsw-alias-button-tool-bar-hover
--dsw-alias-interactive-bg-active
--dsw-alias-interactive-bg-hover
--dsw-alias-interactive-bg-hover-accent
--dsw-alias-interactive-bg-hover-danger
--dsw-alias-interactive-bg-hover-solid
--dsw-alias-label-caption
--dsw-alias-label-dimmed
--dsw-alias-label-primary
--dsw-alias-label-primary-bluish
--dsw-alias-label-primary-dimmed
--dsw-alias-label-primary-foreground
--dsw-alias-label-primary-inverted
--dsw-alias-label-secondary
--dsw-alias-label-tertiary
--dsw-alias-link
--dsw-alias-markdown-citation
--dsw-alias-markdown-code-block
--dsw-alias-markdown-code-block-banner
--dsw-alias-markdown-code-segment-selected
--dsw-alias-markdown-code-segment-unselected
--dsw-alias-markdown-inline-code
--dsw-alias-markdown-placeholder
--dsw-alias-markdown-tag
--dsw-alias-scrollbar-bg-l1
--dsw-alias-scrollbar-bg-l2
--dsw-alias-scrollbar-hover-l1
--dsw-alias-scrollbar-hover-l2
--dsw-alias-state-business-primary
--dsw-alias-state-business-tertiary
--dsw-alias-state-error-primary
--dsw-alias-state-error-secondary
--dsw-alias-state-success-primary
--dsw-alias-state-success-secondary
--dsw-alias-state-success-tertiary
--dsw-alias-state-warn-label
--dsw-alias-state-warn-primary
--dsw-alias-state-warn-secondary
--dsw-alias-state-warn-tertiary
--dsw-alias-toast-bg
--dsw-alias-tooltip-bg
--dsw-elevation-panel
--dsw-elevation-prominent
--dsw-elevation-soft
--dsw-elevation-stroke
--dsw-elevation-stroke-color
--dsw-font-family
--dsw-linear-gradient-think
--dsw-linear-think-select
--dsw-shadow-lv1
--dsw-shadow-lv1-blur
--dsw-shadow-lv2
--dsw-shadow-lv3
--dsw-specific-bubble
--dsw-specific-bubble-highlight
--dsw-specific-input-major
--dsw-specific-login-input
--dsw-specific-menu
--dsw-specific-selector
--dsw-specific-sidebar-fill
--dsw-specific-sidebar-nav-item-active
--dsw-specific-sidebar-nav-item-active-accent
--dsw-specific-sidebar-nav-item-hover
--dsw-specific-tip
--dsw-static-blue-450
--dsw-static-blue-500
--dsw-static-deepseek-200
--dsw-static-deepseek-500
--dsw-static-neutral-bluish-400
--shiki-background
--shiki-foreground
--shiki-token-comment
--shiki-token-constant
--shiki-token-function
--shiki-token-keyword
--shiki-token-link
--shiki-token-parameter
--shiki-token-punctuation
--shiki-token-string
--shiki-token-string-expression
`.trim().split(/\s+/).sort()

function assertContrast(foreground, background, label, minimum = 4.5) {
  const ratio = contrastRatio(foreground, background)
  assert.ok(ratio >= minimum, `${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1`)
}

test('token payload exactly matches the reviewed manifest', () => {
  const light = buildTokens(ANIMAL_ISLAND_PALETTES.light, 'light')
  const dark = buildTokens(ANIMAL_ISLAND_PALETTES.dark, 'dark')
  assert.deepEqual(Object.keys(light).sort(), EXPECTED_TOKENS)
  assert.deepEqual(Object.keys(dark).sort(), EXPECTED_TOKENS)
})

test('token payload has complete light and dark pairs', () => {
  const payload = buildTokenOverrides()
  for (const name of EXPECTED_TOKENS) {
    assert.ok(payload[name], `missing ${name}`)
    for (const mode of ['light', 'dark']) {
      const value = payload[name][mode]
      if (
        name === '--ds-font-family-code'
        || name === '--dsw-font-family'
        || name.startsWith('--dsw-shadow-')
        || name.startsWith('--dsw-elevation-')
        || name.startsWith('--dsw-linear-')
      ) {
        assert.equal(typeof value, 'string')
        assert.ok(value.length > 0)
      } else {
        assert.match(value, /^(#[\da-f]{6}(?:[\da-f]{2})?|rgba?\([\d., ]+\))$/i)
      }
    }
  }
  assert.deepEqual(Object.keys(payload).filter((name) => !payload[name].light || !payload[name].dark), [])
})

test('light mode follows the canonical Animal Island palette with readable semantic derivatives', () => {
  const payload = buildTokenOverrides()
  assert.equal(payload['--dsw-alias-bg-base'].light, '#f8f8f0')
  assert.equal(payload['--dsw-alias-bg-layer-1'].light, '#ffffff')
  assert.equal(payload['--dsw-alias-bg-layer-2'].light, '#f7f3df')
  assert.equal(payload['--dsw-alias-bg-layer-3'].light, '#f0e8d8')
  assert.equal(payload['--dsw-alias-brand-primary'].light, '#19c8b9')
  assert.equal(payload['--dsw-alias-state-business-primary'].light, '#0b7f75')
  assert.equal(payload['--dsw-alias-label-primary'].light, '#6f451f')
  assert.equal(payload['--dsw-alias-label-secondary'].light, '#654a2f')
  assert.equal(payload['--dsw-alias-button-primary-fill'].light, '#f8f8f0')
  assert.equal(payload['--shiki-background'].light, '#2b2118')
  assert.equal(payload['--dsw-specific-sidebar-nav-item-active'].light, '#e5c99b')
  assert.equal(payload['--dsw-specific-sidebar-nav-item-hover'].light, '#f0e2c8')
})

test('normal text, business accents, and states remain readable on their real surfaces', () => {
  const payload = buildTokenOverrides()
  for (const mode of ['light', 'dark']) {
    for (const name of [
      '--dsw-alias-label-primary',
      '--dsw-alias-label-secondary',
      '--dsw-alias-label-tertiary',
      '--dsw-alias-label-caption',
      '--dsw-alias-state-business-primary',
      '--dsw-alias-state-error-primary',
      '--dsw-alias-state-success-primary',
      '--dsw-alias-state-warn-primary',
      '--dsw-alias-state-warn-label',
    ]) {
      assertContrast(payload[name][mode], payload['--dsw-alias-bg-base'][mode], `${mode} ${name}`)
    }

    assertContrast(
      payload['--dsw-alias-label-primary-foreground'][mode],
      payload['--dsw-alias-button-primary-fill'][mode],
      `${mode} primary button foreground`,
    )

    for (const name of ['--dsw-alias-label-primary', '--dsw-alias-label-secondary']) {
      for (const surface of [
        '--dsw-specific-sidebar-fill',
        '--dsw-specific-sidebar-nav-item-hover',
        '--dsw-specific-sidebar-nav-item-active',
      ]) {
        assertContrast(payload[name][mode], payload[surface][mode], `${mode} ${name} on ${surface}`)
      }
    }
  }
})

test('every syntax token remains readable on its code background', () => {
  const payload = buildTokenOverrides()
  for (const mode of ['light', 'dark']) {
    assertContrast(payload['--shiki-foreground'][mode], payload['--shiki-background'][mode], `${mode} code foreground`)
    for (const name of Object.keys(payload).filter((token) => token.startsWith('--shiki-token-'))) {
      assertContrast(payload[name][mode], payload['--shiki-background'][mode], `${mode} ${name}`)
    }
  }
})

test('theme source contains no product DOM selectors or hashed class assumptions', async () => {
  for (const file of ['../src/tokens.ts', '../src/client/index.ts']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /document\s*\.|window\s*\.|body\s*\[|#[A-Za-z][\w-]*\s*\{/)
    assert.doesNotMatch(source, /\.[A-Za-z][\w-]*_[A-Za-z0-9]{5,}/)
  }
})
