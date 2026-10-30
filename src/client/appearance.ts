/**
 * Canvas appearance preference for the Animal Island skin.
 *
 * The value is a single number: the alpha of the cream "paper" sheet DSH lays
 * over the green canvas. Lower = greener / more island, higher = whiter / easier
 * to read. It is kept in localStorage (per client) rather than the Host settings
 * document because it is a purely visual, per-device preference.
 */

export type AppearancePreset = 'paper' | 'balanced' | 'island' | 'custom'

export interface AppearanceState {
  preset: AppearancePreset
  veil: number
}

export const APPEARANCE_PRESETS = {
  paper: 0.52,
  balanced: 0.4,
  island: 0.28,
} as const

export const APPEARANCE_MIN = 0.15
export const APPEARANCE_MAX = 0.6
export const DEFAULT_APPEARANCE: AppearanceState = {
  preset: 'balanced',
  veil: APPEARANCE_PRESETS.balanced,
}

const STORAGE_KEY = 'dsh-theme-animal-island-ui:appearance'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function isPreset(value: unknown): value is AppearancePreset {
  return value === 'paper' || value === 'balanced' || value === 'island' || value === 'custom'
}

export function normalizeAppearance(input: unknown): AppearanceState {
  const raw = input !== null && typeof input === 'object' ? (input as Partial<AppearanceState>) : {}
  const preset = isPreset(raw.preset) ? raw.preset : DEFAULT_APPEARANCE.preset
  const fallback = preset === 'custom' ? DEFAULT_APPEARANCE.veil : APPEARANCE_PRESETS[preset]
  const rawVeil = typeof raw.veil === 'number' && Number.isFinite(raw.veil) ? raw.veil : fallback
  const veil = Math.min(APPEARANCE_MAX, Math.max(APPEARANCE_MIN, rawVeil))
  return { preset, veil: Math.round(veil * 100) / 100 }
}

export function readStorage(): StorageLike | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

export function readAppearance(source: StorageLike | undefined = readStorage()): AppearanceState {
  if (!source) return DEFAULT_APPEARANCE
  try {
    return normalizeAppearance(JSON.parse(source.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return DEFAULT_APPEARANCE
  }
}

export function writeAppearance(state: AppearanceState, target: StorageLike | undefined = readStorage()): void {
  if (!target) return
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode / storage disabled: the in-memory value still applies.
  }
}

/** Paint the preference onto the root element as a CSS variable. */
export function applyAppearance(state: AppearanceState, root: HTMLElement): void {
  root.style.setProperty('--animal-canvas-veil', String(state.veil))
  root.setAttribute('data-animal-appearance', state.preset)
}

export function clearAppearance(root: HTMLElement): void {
  root.style.removeProperty('--animal-canvas-veil')
  root.removeAttribute('data-animal-appearance')
}

let current: AppearanceState = DEFAULT_APPEARANCE
const listeners = new Set<() => void>()

export function getAppearance(): AppearanceState {
  return current
}

export function subscribeAppearance(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Persist, apply, and notify. Used by the settings tab. */
export function setAppearance(next: AppearanceState): AppearanceState {
  current = normalizeAppearance(next)
  writeAppearance(current)
  if (typeof document !== 'undefined' && document.documentElement) {
    applyAppearance(current, document.documentElement)
  }
  for (const listener of listeners) listener()
  return current
}

/** Load the saved preference and paint it. Called once when the skin installs. */
export function initAppearance(root: HTMLElement): void {
  current = readAppearance()
  applyAppearance(current, root)
}
