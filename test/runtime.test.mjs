import test from 'node:test'
import assert from 'node:assert/strict'

let loadedEntry
const previousLoader = globalThis.__ModuleLoader__
globalThis.__ModuleLoader__ = {
  load(entry) {
    loadedEntry = entry
  },
}

await import(`../lib/client.js?runtime=${Date.now()}`)

test('client factory registers and releases one Animal Island token layer', () => {
  assert.ok(loadedEntry)
  assert.equal(loadedEntry.id, 'dsh-theme-animal-island-ui')

  let overrideCalls = 0
  let disposed = 0
  const theme = {
    overrideTokens(source, tokens) {
      overrideCalls += 1
      assert.equal(source, 'dsh-theme-animal-island-ui:palette')
      assert.equal(tokens['--dsw-alias-brand-primary'].light, '#19c8b9')
      assert.equal(tokens['--dsw-alias-brand-primary'].dark, '#61d9cb')
      return () => {
        disposed += 1
      }
    },
  }
  const effectDisposers = []
  const ctx = {
    theme,
    effect(execute) {
      effectDisposers.push(execute())
    },
  }

  const plugin = loadedEntry.factory()
  // Package names in module inject remain pending; the cordis service is 'theme'.
  assert.deepEqual(plugin.inject, ['theme'])
  plugin.apply(ctx)
  assert.equal(overrideCalls, 1)
  assert.equal(effectDisposers.length, 1)

  effectDisposers[0]()
  assert.equal(disposed, 1)
})

test('missing ThemeRuntime is a safe no-op', () => {
  const plugin = loadedEntry.factory()
  assert.doesNotThrow(() => plugin.apply({}))
})

test('registration failures do not register an effect', () => {
  const plugin = loadedEntry.factory()
  const originalWarn = console.warn
  const warnings = []
  console.warn = (...args) => warnings.push(args)
  try {
    for (const theme of [
      { overrideTokens() { throw new Error('registration failed') } },
      { overrideTokens() { return undefined } },
    ]) {
      let effects = 0
      assert.doesNotThrow(() => plugin.apply({
        theme,
        effect() { effects += 1 },
      }))
      assert.equal(effects, 0)
    }
  } finally {
    console.warn = originalWarn
  }
  assert.equal(warnings.length, 2)
})

test.after(() => {
  if (previousLoader === undefined) delete globalThis.__ModuleLoader__
  else globalThis.__ModuleLoader__ = previousLoader
})
