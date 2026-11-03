/**
 * Canvas appearance preference for the Animal Island skin.
 *
 * The value is a single number: the alpha of the cream "paper" sheet DSH lays
 * over the green canvas. Lower = greener / more island, higher = whiter / easier
 * to read. It is kept in localStorage (per client) rather than the Host settings
 * document because it is a purely visual, per-device preference.
 */

export type AppearancePreset = 'paper' | 'balanced' | 'island' | 'custom'

/**
 * Syntax palette used by the flat deliverables code diff on the light paper.
 * `warm` is the skin's own light-surface palette; `native` restores DSH's
 * built-in light syntax colours. Dark mode always keeps the theme palette.
 */
export type DiffSyntax = 'warm' | 'native'

interface AppearanceState {
  preset: AppearancePreset
  veil: number
  diffSyntax: DiffSyntax
}

export interface AppearanceStore {
  getSnapshot(): AppearanceState
  subscribe(listener: () => void): () => void
  set(next: Partial<AppearanceState>): AppearanceState
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
  diffSyntax: 'warm',
  min: 0.15,
  max: 0.6,
} as const

const DEFAULT_STATE: AppearanceState = {
  preset: APPEARANCE_DEFAULTS.preset,
  veil: APPEARANCE_DEFAULTS.veil,
  diffSyntax: APPEARANCE_DEFAULTS.diffSyntax,
}
const STORAGE_KEY = 'dsh-theme-animal-island-ui:appearance'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function isPreset(value: unknown): value is AppearancePreset {
  return value === 'paper' || value === 'balanced' || value === 'island' || value === 'custom'
}

function isDiffSyntax(value: unknown): value is DiffSyntax {
  return value === 'warm' || value === 'native'
}

function normalizeAppearance(input: unknown): AppearanceState {
  const raw = input !== null && typeof input === 'object' ? (input as Partial<AppearanceState>) : {}
  const preset = isPreset(raw.preset) ? raw.preset : APPEARANCE_DEFAULTS.preset
  const fallback = preset === 'custom' ? APPEARANCE_DEFAULTS.veil : APPEARANCE_PRESETS[preset]
  const rawVeil = typeof raw.veil === 'number' && Number.isFinite(raw.veil) ? raw.veil : fallback
  const veil = Math.min(APPEARANCE_DEFAULTS.max, Math.max(APPEARANCE_DEFAULTS.min, rawVeil))
  const diffSyntax = isDiffSyntax(raw.diffSyntax) ? raw.diffSyntax : APPEARANCE_DEFAULTS.diffSyntax
  return { preset, veil: Math.round(veil * 100) / 100, diffSyntax }
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
  root.setAttribute('data-animal-diff-syntax', state.diffSyntax)
}

function clearAppearance(root: HTMLElement): void {
  root.style.removeProperty('--animal-canvas-veil')
  root.removeAttribute('data-animal-appearance')
  root.removeAttribute('data-animal-diff-syntax')
}

/** Create the appearance store owned by one installed skin root. */
export function createAppearanceStore(root: HTMLElement): AppearanceStore {
  const previousVeil = root.style.getPropertyValue('--animal-canvas-veil')
  const previousVeilPriority = root.style.getPropertyPriority('--animal-canvas-veil')
  const previousPreset = root.getAttribute('data-animal-appearance')
  const previousDiffSyntax = root.getAttribute('data-animal-diff-syntax')
  let current = readAppearance()
  let active = true
  const listeners = new Set<() => void>()

  try {
    paintAppearance(current, root)
  } catch (error) {
    clearAppearance(root)
    if (previousVeil !== '') root.style.setProperty('--animal-canvas-veil', previousVeil, previousVeilPriority)
    if (previousPreset !== null) root.setAttribute('data-animal-appearance', previousPreset)
    if (previousDiffSyntax !== null) root.setAttribute('data-animal-diff-syntax', previousDiffSyntax)
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
      current = normalizeAppearance({ ...current, ...next })
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
      if (previousDiffSyntax === null) root.removeAttribute('data-animal-diff-syntax')
      else root.setAttribute('data-animal-diff-syntax', previousDiffSyntax)
      current = DEFAULT_STATE
    },
  }
}
