import test from 'node:test'
import assert from 'node:assert/strict'
import { queryCssRules } from './css-rules.mjs'

test('nested style rules do not become parent declarations', () => {
  const query = queryCssRules(`
    @media (min-width: 1px) {
      .parent {
        & .child { color: blue; }
        background: green;
      }
    }
  `)
  const parent = query.find((rule) => rule.selector === '.parent')
  const child = query.find((rule) => rule.selector === '& .child')

  assert.ok(parent)
  assert.ok(child)
  assert.deepEqual(
    parent.declarations.map(({ property, value }) => ({ property, value })),
    [{ property: 'background', value: 'green' }],
  )
  assert.equal(parent.declaration('color'), undefined)
  assert.equal(child.declaration('color')?.value, 'blue')
  assert.deepEqual(child.atRules, ['@media (min-width: 1px)'])
})

test('duplicate declarations resolve to the winning declaration', () => {
  const query = queryCssRules(`
    .item {
      color: red;
      color: blue;
      border-color: green !important;
      border-color: black;
    }
  `)
  const rule = query.find((candidate) => candidate.selector === '.item')

  assert.ok(rule)
  assert.equal(rule.declaration('color')?.value, 'blue')
  assert.equal(rule.declaration('border-color')?.value, 'green')
  assert.equal(rule.declaration('border-color')?.important, true)
})
