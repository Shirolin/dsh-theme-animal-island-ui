import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM, VirtualConsole } from 'jsdom'
import { PUBLIC_SERVICES, PUBLIC_SLOTS } from '../scripts/seam-contract.mjs'

const nodeRequire = createRequire(import.meta.url)
let loadedEntry
const previousLoader = globalThis.__ModuleLoader__
globalThis.__ModuleLoader__ = {
  load(entry) {
    loadedEntry = entry
  },
}

await import(`../lib/client.js?runtime=${Date.now()}`)

function factory() {
  return loadedEntry.factory(nodeRequire)
}

function withDocument(run) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    virtualConsole: new VirtualConsole(),
  })
  const previousDocument = globalThis.document
  Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true })
  try {
    return run(dom.window.document)
  } finally {
    if (previousDocument === undefined) delete globalThis.document
    else Object.defineProperty(globalThis, 'document', { value: previousDocument, configurable: true })
    dom.window.close()
  }
}

function createContext(theme) {
  const effectDisposers = []
  return {
    context: {
      theme,
      effect(execute) {
        const dispose = execute()
        if (typeof dispose === 'function') effectDisposers.push(dispose)
      },
    },
    disposeEffects() {
      for (const dispose of effectDisposers.splice(0).reverse()) dispose()
    },
  }
}

function createSlots() {
  const registrations = []
  return {
    registrations,
    inject(_key, callback) {
      const result = callback()
      const disposers = typeof result === 'function' ? [result] : result === undefined ? [] : [...result]
      let active = true
      const dispose = () => {
        if (!active) return
        active = false
        for (const item of disposers.reverse()) item()
      }
      return dispose
    },
    register(spec, component) {
      const entry = { key: spec.name, id: spec.id, priority: spec.priority, component, inject: spec.inject }
      if (
        registrations.some(
          (candidate) =>
            candidate.key === spec.name &&
            (spec.id === undefined ? candidate.id === undefined : candidate.id === spec.id) &&
            (candidate.priority ?? 0) === (spec.priority ?? 0),
        )
      ) {
        throw new Error(`slot "${spec.name}" already has a registration at this cell and priority`)
      }
      registrations.push(entry)
      return () => {
        const index = registrations.indexOf(entry)
        if (index >= 0) registrations.splice(index, 1)
      }
    },
    spec(key) {
      return key === 'sidebar' ? { kind: 'single', scope: 'root' } : undefined
    },
  }
}

test('client factory registers and releases coordinated theme, style, and public slots', () => {
  assert.ok(loadedEntry)
  assert.equal(loadedEntry.id, 'dsh-theme-animal-island-ui')

  withDocument((document) => {
    let disposedTheme = 0
    let disposedFont = 0
    const slots = createSlots()
    const theme = {
      overrideTokens(source, tokens) {
        if (source === 'dsh-theme-animal-island-ui:appearance') {
          assert.equal(tokens['--dsw-font-family'].light, 'var(--animal-system-font-family, sans-serif)')
          assert.equal(tokens['--dsw-font-family'].dark, 'var(--animal-system-font-family, sans-serif)')
          return () => {
            disposedFont += 1
          }
        }
        assert.equal(source, 'dsh-theme-animal-island-ui:palette')
        assert.equal(tokens['--dsw-alias-brand-primary'].light, '#19c8b9')
        assert.equal(tokens['--dsw-alias-button-primary-fill'].light, '#f8f8f0')
        assert.equal(tokens['--shiki-background'].light, '#2b2118')
        return () => {
          disposedTheme += 1
        }
      },
    }
    const { context, disposeEffects } = createContext(theme)
    context.slots = slots
    const plugin = factory()

    assert.deepEqual(plugin.inject, PUBLIC_SERVICES)
    plugin.apply(context)

    assert.equal(document.documentElement.getAttribute('data-dsh-animal-island-skin'), 'active')
    assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 1)
    const style = document.head.querySelector('style[data-plugin="dsh-theme-animal-island-ui"]')
    assert.match(style.textContent, /data-dsh-animal-island-skin/)
    assert.match(style.textContent, /--animal-mint:\s*#19c8b9/)
    assert.deepEqual(slots.registrations.map((entry) => entry.key).sort(), PUBLIC_SLOTS.map((slot) => slot.name).sort())
    for (const entry of slots.registrations) {
      const slot = PUBLIC_SLOTS.find((candidate) => candidate.name === entry.key)
      assert.ok(slot, `unexpected slot registration: ${entry.key}`)
      assert.equal(entry.priority, slot.priority ?? undefined)
    }
    const appearance = slots.registrations.find((entry) => entry.key === 'settings.plugins.tab').inject().appearance
    assert.equal(appearance.getSnapshot().diffSyntax, 'warm')
    assert.equal(appearance.getSnapshot().decor, true)
    assert.equal(appearance.getSnapshot().grain, true)
    assert.equal(appearance.getSnapshot().font, 'theme')
    assert.equal(document.documentElement.getAttribute('data-animal-decor'), 'on')
    assert.equal(document.documentElement.getAttribute('data-animal-grain'), 'on')
    assert.equal(document.documentElement.getAttribute('data-animal-font'), 'theme')
    appearance.set({ preset: 'island', veil: 0.28, diffSyntax: 'native' })
    assert.equal(document.documentElement.style.getPropertyValue('--animal-canvas-veil'), '0.28')
    assert.equal(document.documentElement.getAttribute('data-animal-appearance'), 'island')

    // The Settings entry receives the installed store and paints the same root.
    assert.equal(appearance.getSnapshot().preset, 'island')
    assert.equal(appearance.getSnapshot().diffSyntax, 'native')
    assert.equal(document.documentElement.getAttribute('data-animal-diff-syntax'), 'native')

    // Decoration, grain, and the system font layer each own one axis.
    appearance.set({ decor: false, grain: false, font: 'system' })
    assert.equal(document.documentElement.getAttribute('data-animal-decor'), 'off')
    assert.equal(document.documentElement.getAttribute('data-animal-grain'), 'off')
    assert.equal(document.documentElement.getAttribute('data-animal-font'), 'system')
    assert.equal(disposedFont, 0)
    appearance.set({ font: 'theme' })
    assert.equal(document.documentElement.getAttribute('data-animal-font'), 'theme')
    assert.equal(disposedFont, 1)
    appearance.set({ font: 'system' })
    assert.equal(document.documentElement.getAttribute('data-animal-font'), 'system')
    assert.equal(disposedFont, 1)

    // One reset call returns every axis, including the font layer.
    appearance.reset()
    assert.deepEqual(appearance.getSnapshot(), {
      preset: 'balanced',
      veil: 0.4,
      diffSyntax: 'warm',
      decor: true,
      grain: true,
      font: 'theme',
    })
    assert.equal(document.documentElement.getAttribute('data-animal-appearance'), 'balanced')
    assert.equal(document.documentElement.getAttribute('data-animal-diff-syntax'), 'warm')
    assert.equal(document.documentElement.getAttribute('data-animal-decor'), 'on')
    assert.equal(document.documentElement.getAttribute('data-animal-grain'), 'on')
    assert.equal(document.documentElement.getAttribute('data-animal-font'), 'theme')
    assert.equal(disposedFont, 2)

    disposeEffects()
    assert.equal(disposedTheme, 1)
    assert.equal(document.documentElement.hasAttribute('data-dsh-animal-island-skin'), false)
    assert.equal(document.documentElement.style.getPropertyValue('--animal-canvas-veil'), '')
    assert.equal(document.documentElement.hasAttribute('data-animal-appearance'), false)
    assert.equal(document.documentElement.hasAttribute('data-animal-diff-syntax'), false)
    assert.equal(document.documentElement.hasAttribute('data-animal-decor'), false)
    assert.equal(document.documentElement.hasAttribute('data-animal-grain'), false)
    assert.equal(document.documentElement.hasAttribute('data-animal-font'), false)
    assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 0)
    assert.deepEqual(slots.registrations, [])
  })
})

test('missing ThemeRuntime is a safe no-op before DOM or Slot work', () => {
  withDocument((document) => {
    const plugin = factory()
    const { context, disposeEffects } = createContext(undefined)
    assert.doesNotThrow(() => plugin.apply(context))
    assert.equal(document.head.querySelectorAll('style').length, 0)
    disposeEffects()
  })
})

test('registration failures do not install skin resources or effects', () => {
  withDocument((document) => {
    const plugin = factory()
    const originalWarn = console.warn
    const warnings = []
    console.warn = (...args) => warnings.push(args)
    try {
      for (const theme of [
        {
          overrideTokens() {
            throw new Error('registration failed')
          },
        },
        {
          overrideTokens() {
            return undefined
          },
        },
      ]) {
        const { context, disposeEffects } = createContext(theme)
        assert.doesNotThrow(() => plugin.apply(context))
        assert.equal(document.head.querySelectorAll('style').length, 0)
        disposeEffects()
      }
    } finally {
      console.warn = originalWarn
    }
    assert.equal(warnings.length, 2)
  })
})

test('owned skin apply/dispose is idempotent across repeated HMR cycles', () => {
  withDocument((document) => {
    const plugin = factory()
    for (let cycle = 0; cycle < 20; cycle += 1) {
      const { context, disposeEffects } = createContext({
        overrideTokens() {
          return () => undefined
        },
      })
      context.slots = createSlots()
      plugin.apply(context)
      assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 1)
      disposeEffects()
      assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 0)
      assert.equal(document.documentElement.hasAttribute('data-dsh-animal-island-skin'), false)
    }
  })
})

test('overlapping installs share one root lifecycle and restore the previous root after the final dispose', () => {
  withDocument((document) => {
    const root = document.documentElement
    root.setAttribute('data-dsh-animal-island-skin', 'previous')
    root.style.setProperty('--animal-canvas-veil', '0.33')
    root.setAttribute('data-animal-appearance', 'custom')
    root.setAttribute('data-animal-diff-syntax', 'native')
    root.setAttribute('data-animal-decor', 'off')
    root.setAttribute('data-animal-grain', 'off')
    root.setAttribute('data-animal-font', 'system')

    const plugin = factory()
    const first = createContext({
      overrideTokens() {
        return () => undefined
      },
    })
    const second = createContext({
      overrideTokens() {
        return () => undefined
      },
    })
    const slots = createSlots()
    first.context.slots = slots
    second.context.slots = slots

    plugin.apply(first.context)
    plugin.apply(second.context)
    assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 1)
    assert.equal(root.getAttribute('data-dsh-animal-island-skin'), 'active')
    assert.equal(root.style.getPropertyValue('--animal-canvas-veil'), '0.4')
    assert.equal(root.getAttribute('data-animal-appearance'), 'balanced')
    assert.equal(root.getAttribute('data-animal-diff-syntax'), 'warm')
    assert.equal(root.getAttribute('data-animal-decor'), 'on')
    assert.equal(root.getAttribute('data-animal-grain'), 'on')
    assert.equal(root.getAttribute('data-animal-font'), 'theme')
    assert.deepEqual(slots.registrations.map((entry) => entry.key).sort(), PUBLIC_SLOTS.map((slot) => slot.name).sort())

    first.disposeEffects()
    assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 1)
    assert.equal(root.getAttribute('data-dsh-animal-island-skin'), 'active')
    assert.equal(root.style.getPropertyValue('--animal-canvas-veil'), '0.4')
    assert.equal(root.getAttribute('data-animal-appearance'), 'balanced')
    assert.equal(root.getAttribute('data-animal-diff-syntax'), 'warm')
    assert.equal(root.getAttribute('data-animal-decor'), 'on')
    assert.equal(root.getAttribute('data-animal-grain'), 'on')
    assert.equal(root.getAttribute('data-animal-font'), 'theme')
    assert.deepEqual(slots.registrations.map((entry) => entry.key).sort(), PUBLIC_SLOTS.map((slot) => slot.name).sort())

    second.disposeEffects()
    assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 0)
    assert.equal(root.getAttribute('data-dsh-animal-island-skin'), 'previous')
    assert.equal(root.style.getPropertyValue('--animal-canvas-veil'), '0.33')
    assert.equal(root.getAttribute('data-animal-appearance'), 'custom')
    assert.equal(root.getAttribute('data-animal-diff-syntax'), 'native')
    assert.equal(root.getAttribute('data-animal-decor'), 'off')
    assert.equal(root.getAttribute('data-animal-grain'), 'off')
    assert.equal(root.getAttribute('data-animal-font'), 'system')
    assert.deepEqual(slots.registrations, [])
  })
})

test('legacy appearance payloads gain the new axes with defaults', () => {
  const storageDom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    virtualConsole: new VirtualConsole(),
  })
  const storage = storageDom.window.localStorage
  storage.setItem('dsh-theme-animal-island-ui:appearance', JSON.stringify({ preset: 'island', veil: 0.28, diffSyntax: 'native' }))
  const previousStorage = globalThis.localStorage
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  try {
    withDocument((document) => {
      const plugin = factory()
      const slots = createSlots()
      const { context, disposeEffects } = createContext({
        overrideTokens() {
          return () => undefined
        },
      })
      context.slots = slots
      plugin.apply(context)
      const appearance = slots.registrations.find((entry) => entry.key === 'settings.plugins.tab').inject().appearance

      assert.deepEqual(appearance.getSnapshot(), {
        preset: 'island',
        veil: 0.28,
        diffSyntax: 'native',
        decor: true,
        grain: true,
        font: 'theme',
      })
      assert.equal(document.documentElement.getAttribute('data-animal-decor'), 'on')
      assert.equal(document.documentElement.getAttribute('data-animal-grain'), 'on')
      assert.equal(document.documentElement.getAttribute('data-animal-font'), 'theme')
      disposeEffects()
    })
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else Object.defineProperty(globalThis, 'localStorage', { value: previousStorage, configurable: true })
    storageDom.window.close()
  }
})

test('invalid appearance values fall back and an unavailable font layer stays truthful', () => {
  const storageDom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    virtualConsole: new VirtualConsole(),
  })
  const storage = storageDom.window.localStorage
  storage.setItem(
    'dsh-theme-animal-island-ui:appearance',
    JSON.stringify({ preset: 'custom', veil: 9, diffSyntax: 'neon', decor: 'yes', grain: 0, font: 'system' }),
  )
  const previousStorage = globalThis.localStorage
  const originalWarn = console.warn
  const warnings = []
  console.warn = (...args) => warnings.push(args)
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  try {
    withDocument((document) => {
      const plugin = factory()
      const slots = createSlots()
      const { context, disposeEffects } = createContext({
        overrideTokens(source) {
          if (source === 'dsh-theme-animal-island-ui:appearance') throw new Error('font layer rejected')
          return () => undefined
        },
      })
      context.slots = slots
      plugin.apply(context)
      const appearance = slots.registrations.find((entry) => entry.key === 'settings.plugins.tab').inject().appearance

      assert.deepEqual(appearance.getSnapshot(), {
        preset: 'custom',
        veil: 0.6,
        diffSyntax: 'warm',
        decor: true,
        grain: true,
        font: 'theme',
      })
      assert.equal(document.documentElement.getAttribute('data-animal-font'), 'theme')
      assert.equal(JSON.parse(storage.getItem('dsh-theme-animal-island-ui:appearance')).font, 'theme')

      assert.equal(appearance.set({ font: 'system' }).font, 'theme')
      assert.equal(document.documentElement.getAttribute('data-animal-font'), 'theme')
      assert.equal(warnings.length >= 1, true)
      disposeEffects()
    })
  } finally {
    console.warn = originalWarn
    if (previousStorage === undefined) delete globalThis.localStorage
    else Object.defineProperty(globalThis, 'localStorage', { value: previousStorage, configurable: true })
    storageDom.window.close()
  }
})

test.after(() => {
  if (previousLoader === undefined) delete globalThis.__ModuleLoader__
  else globalThis.__ModuleLoader__ = previousLoader
})
