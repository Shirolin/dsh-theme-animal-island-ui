import { apply, inject } from './client/index.ts'

declare global {
  // This is the browser module-loader protocol, not application DOM access.
  var __ModuleLoader__: {
    load(entry: { id: string; factory: () => unknown }): void
  } | undefined
}

globalThis.__ModuleLoader__?.load({
  id: 'dsh-theme-animal-island-ui',
  factory: () => ({ apply, inject }),
})
