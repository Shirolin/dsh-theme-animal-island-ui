/**
 * Canvas appearance preference for the Animal Island skin.
 *
 * The value is a single number: the alpha of the cream "paper" sheet DSH lays
 * over the green canvas. Lower = greener / more island, higher = whiter / easier
 * to read. It is kept in localStorage (per client) rather than the Host settings
 * document because it is a purely visual, per-device preference.
 */

export type AppearancePreset = 'paper' | 'balanced' | 'island' | 'custom'

interface AppearanceState {
  preset: AppearancePreset
  veil: number
}

export interface AppearanceStore {
  getSnapshot(): AppearanceState
  subscribe(listener: () => void): () => void
  set(next: AppearanceState): AppearanceState
  dispose(): void
}

export const APPEARANCE_PRESETS = {
  paper: 0.52,
  balanced: 0.4,
  island: 0.28,
} as const

export const APPEARANCE_DEFAULTS = {
  preset: 'balanced',
  veil: APPEARANCE_PRESETS.balanced,
  min: 0.15,
  max: 0.6,
} as const

const DEFAULT_STATE: AppearanceState = {
  preset: APPEARANCE_DEFAULTS.preset,
  veil: APPEARANCE_DEFAULTS.veil,
}
const STORAGE_KEY = 'dsh-theme-animal-island-ui:appearance'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function isPreset(value: unknown): value is AppearancePreset {
  return value === 'paper' || value === 'balanced' || value === 'island' || value === 'custom'
}

function normalizeAppearance(input: unknown): AppearanceState {
  const raw = input !== null && typeof input === 'object' ? (input as Partial<AppearanceState>) : {}
  const preset = isPreset(raw.preset) ? raw.preset : APPEARANCE_DEFAULTS.preset
  const fallback = preset === 'custom' ? APPEARANCE_DEFAULTS.veil : APPEARANCE_PRESETS[preset]
  const rawVeil = typeof raw.veil === 'number' && Number.isFinite(raw.veil) ? raw.veil : fallback
  const veil = Math.min(APPEARANCE_DEFAULTS.max, Math.max(APPEARANCE_DEFAULTS.min, rawVeil))
  return { preset, veil: Math.round(veil * 100) / 100 }
}

function readStorage(): StorageLike | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

function readAppearance(source: StorageLike | undefined = readStorage()): AppearanceState {
  if (!source) return DEFAULT_STATE
  try {
    return normalizeAppearance(JSON.parse(source.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return DEFAULT_STATE
  }
}

function writeAppearance(state: AppearanceState, target: StorageLike | undefined = readStorage()): void {
  if (!target) return
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode / storage disabled: the in-memory value still applies.
  }
}

function paintAppearance(state: AppearanceState, root: HTMLElement): void {
  root.style.setProperty('--animal-canvas-veil', String(state.veil))
  root.setAttribute('data-animal-appearance', state.preset)
}

function clearAppearance(root: HTMLElement): void {
  root.style.removeProperty('--animal-canvas-veil')
  root.removeAttribute('data-animal-appearance')
}

/** Create the appearance store owned by one installed skin root. */
export function createAppearanceStore(root: HTMLElement): AppearanceStore {
  const previousVeil = root.style.getPropertyValue('--animal-canvas-veil')
  const previousVeilPriority = root.style.getPropertyPriority('--animal-canvas-veil')
  const previousPreset = root.getAttribute('data-animal-appearance')
  let current = readAppearance()
  let active = true
  const listeners = new Set<() => void>()

  try {
    paintAppearance(current, root)
  } catch (error) {
    clearAppearance(root)
    if (previousVeil !== '') root.style.setProperty('--animal-canvas-veil', previousVeil, previousVeilPriority)
    if (previousPreset !== null) root.setAttribute('data-animal-appearance', previousPreset)
    throw error
  }

  return {
    getSnapshot() {
      return current
    },
    subscribe(listener) {
      if (!active) return () => undefined
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    set(next) {
      if (!active) return current
      current = normalizeAppearance(next)
      writeAppearance(current)
      paintAppearance(current, root)
      for (const listener of [...listeners]) listener()
      return current
    },
    dispose() {
      if (!active) return
      active = false
      listeners.clear()
      clearAppearance(root)
      if (previousVeil !== '') root.style.setProperty('--animal-canvas-veil', previousVeil, previousVeilPriority)
      if (previousPreset === null) root.removeAttribute('data-animal-appearance')
      else root.setAttribute('data-animal-appearance', previousPreset)
      current = DEFAULT_STATE
    },
  }
}
