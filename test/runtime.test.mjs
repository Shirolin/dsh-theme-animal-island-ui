import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { JSDOM, VirtualConsole } from 'jsdom'

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
    inject(key, callback) {
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
      const entry = { key: spec.name, priority: spec.priority, component }
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
    const slots = createSlots()
    const theme = {
      overrideTokens(source, tokens) {
        assert.equal(source, 'dsh-theme-animal-island-ui:palette')
        assert.equal(tokens['--dsw-alias-brand-primary'].light, '#19c8b9')
        assert.equal(tokens['--dsw-alias-button-primary-fill'].light, '#f8f8f0')
        assert.equal(tokens['--shiki-background'].light, '#2b2118')
        return () => { disposedTheme += 1 }
      },
    }
    const { context, disposeEffects } = createContext(theme)
    context.slots = slots
    const plugin = factory()

    assert.deepEqual(plugin.inject, ['theme', 'slots'])
    plugin.apply(context)

    assert.equal(document.documentElement.getAttribute('data-dsh-animal-island-skin'), 'active')
    assert.equal(document.head.querySelectorAll('style[data-plugin="dsh-theme-animal-island-ui"]').length, 1)
    const style = document.head.querySelector('style[data-plugin="dsh-theme-animal-island-ui"]')
    assert.match(style.textContent, /data-dsh-animal-island-skin/)
    assert.match(style.textContent, /--animal-mint:\s*#19c8b9/)
    assert.deepEqual(
      slots.registrations.map((entry) => entry.key).sort(),
      ['conversation.hero.brand.mark', 'settings.plugins.tab', 'sidebar.brand.mark', 'sidebar.brand.name'],
    )
    // Brand slots keep their fixed priority; the appearance tab is an ordinary
    // list-slot entry and carries no priority.
    assert.ok(slots.registrations.filter((entry) => entry.key !== 'settings.plugins.tab').every((entry) => entry.priority === -100))
    assert.ok(slots.registrations.some((entry) => entry.key === 'settings.plugins.tab'))
    // The saved appearance preference is painted on the root as a CSS variable.
    assert.equal(document.documentElement.style.getPropertyValue('--animal-canvas-veil'), '0.4')
    assert.equal(document.documentElement.getAttribute('data-animal-appearance'), 'balanced')

    disposeEffects()
    assert.equal(disposedTheme, 1)
    assert.equal(document.documentElement.hasAttribute('data-dsh-animal-island-skin'), false)
    assert.equal(document.documentElement.style.getPropertyValue('--animal-canvas-veil'), '')
    assert.equal(document.documentElement.hasAttribute('data-animal-appearance'), false)
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
        { overrideTokens() { throw new Error('registration failed') } },
        { overrideTokens() { return undefined } },
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
        overrideTokens() { return () => undefined },
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

test.after(() => {
  if (previousLoader === undefined) delete globalThis.__ModuleLoader__
  else globalThis.__ModuleLoader__ = previousLoader
})
