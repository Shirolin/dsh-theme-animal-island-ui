import type { ComponentType } from 'react'
import type { TokenPairs } from '../types.ts'

interface ThemeRuntimeLike {
  overrideTokens(source: string, tokens: TokenPairs): () => void
}

interface SlotRegistrationOptions {
  name: string
  locale?: string
  priority?: number
  /** List-slot entry id (`settings.plugins.tab` and friends). */
  id?: string
  /** Optional ordering among a list slot's entries. */
  order?: number
  /** Registrant-localized label; a thunk is re-read when the locale changes. */
  label?: string | (() => string)
  /** Keyed-slot key (`settings.plugin.item` keys on the settings namespace). */
  key?: string
  children?: Readonly<
    Record<
      string,
      {
        kind: 'single' | 'list' | 'keyed' | 'chain'
        scope: 'root' | 'session' | 'session-maybe'
        inject?: object
      }
    >
  >
  inject?: (...args: never[]) => object
}

interface SlotSpecLike {
  kind: string
  scope: string
}

export interface SlotRegistryLike {
  inject(key: string, callback: () => (() => void) | Iterable<() => void>): () => void
  register<P extends object>(options: SlotRegistrationOptions, component: ComponentType<P>): () => void
  spec(key: string): SlotSpecLike | undefined
}

export interface ClientContextLike {
  theme?: ThemeRuntimeLike
  slots?: SlotRegistryLike
  effect(effect: () => (() => void) | undefined, name?: string): unknown
}
