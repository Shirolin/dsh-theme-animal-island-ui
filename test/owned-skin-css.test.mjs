import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOwnedSkinCss } from '../scripts/owned-skin-css.mjs'

test('owned skin CSS resolves every font and asset placeholder', async () => {
  const css = await buildOwnedSkinCss()

  assert.equal((css.match(/@font-face\{/g) ?? []).length, 6)
  assert.equal(new Set(css.match(/data:image\/svg\+xml,[^"')\s]+/g) ?? []).size, 8)
  assert.doesNotMatch(css, /__ANIMAL_ISLAND_[A-Z0-9_]+__/)
  assert.match(css, /html\[data-dsh-animal-island-skin\]/)
})
