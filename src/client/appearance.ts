/**
 * Canvas appearance preferences for the Animal Island skin.
 *
 * The value set is small and purely visual: the alpha of the cream "paper"
 * sheet DSH lays over the green canvas, the syntax palette used by the flat
 * deliverables diff, whether the illustrated canvas layers and the paper grain
 * are shown, and which UI font family the skin uses. All of it is kept in
 * localStorage (per client) rather than the Host settings document because it
 * is a per-device visual preference.
 */

export type AppearancePreset = 'paper' | 'balanced' | 'island' | 'custom'

/**
 * Syntax palette used by the flat deliverables code diff on the light paper.
 * `warm` is the skin's own light-surface palette; `native` restores DSH's
 * built-in light syntax colours. Dark mode always keeps the theme palette.
 */
export type DiffSyntax = 'warm' | 'native'

/**
 * Interface font family. `theme` keeps the bundled Nunito Latin face; `system`
 * uses the platform UI stack. Neither changes the content font size, which the
 * Host owns, nor the code font, which is part of the theme identity.
 */
export type InterfaceFont = 'theme' | 'system'

/** The place where a font override layer is registered, kept apart from the palette. */
export interface AppearanceFontLayer {
  /** Register or remove the system-font token layer. Returns whether the desired state is active. */
  set(enabled: boolean): boolean
  dispose(): void
}

interface AppearanceState {
  preset: AppearancePreset
  veil: number
  diffSyntax: DiffSyntax
  decor: boolean
  grain: boolean
  font: InterfaceFont
}

export interface AppearanceStore {
  getSnapshot(): AppearanceState
  subscribe(listener: () => void): () => void
  set(next: Partial<AppearanceState>): AppearanceState
  /** Restore every appearance axis to its shipped default. */
  reset(): AppearanceState
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
  decor: true,
  grain: true,
  font: 'theme',
  min: 0.15,
  max: 0.6,
} as const

const DEFAULT_STATE: AppearanceState = {
  preset: APPEARANCE_DEFAULTS.preset,
  veil: APPEARANCE_DEFAULTS.veil,
  diffSyntax: APPEARANCE_DEFAULTS.diffSyntax,
  decor: APPEARANCE_DEFAULTS.decor,
  grain: APPEARANCE_DEFAULTS.grain,
  font: APPEARANCE_DEFAULTS.font,
}

const STORAGE_KEY = 'dsh-theme-animal-island-ui:appearance'

/**
 * Root attributes owned by this plugin. Every one of them is captured before
 * the skin paints and restored when it unmounts, so an overlapping install or
 * an HMR cycle can never leak a stale appearance onto the page.
 */
const ROOT_ATTRIBUTES = ['data-animal-appearance', 'data-animal-diff-syntax', 'data-animal-decor', 'data-animal-grain', 'data-animal-font'] as const

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function isPreset(value: unknown): value is AppearancePreset {
  return value === 'paper' || value === 'balanced' || value === 'island' || value === 'custom'
}

function isDiffSyntax(value: unknown): value is DiffSyntax {
  return value === 'warm' || value === 'native'
}

function isInterfaceFont(value: unknown): value is InterfaceFont {
  return value === 'theme' || value === 'system'
}

function normalizeAppearance(input: unknown): AppearanceState {
  const raw = input !== null && typeof input === 'object' ? (input as Partial<AppearanceState>) : {}
  const preset = isPreset(raw.preset) ? raw.preset : APPEARANCE_DEFAULTS.preset
  const fallback = preset === 'custom' ? APPEARANCE_DEFAULTS.veil : APPEARANCE_PRESETS[preset]
  const rawVeil = typeof raw.veil === 'number' && Number.isFinite(raw.veil) ? raw.veil : fallback
  const veil = Math.min(APPEARANCE_DEFAULTS.max, Math.max(APPEARANCE_DEFAULTS.min, rawVeil))
  const diffSyntax = isDiffSyntax(raw.diffSyntax) ? raw.diffSyntax : APPEARANCE_DEFAULTS.diffSyntax
  const decor = typeof raw.decor === 'boolean' ? raw.decor : APPEARANCE_DEFAULTS.decor
  const grain = typeof raw.grain === 'boolean' ? raw.grain : APPEARANCE_DEFAULTS.grain
  const font = isInterfaceFont(raw.font) ? raw.font : APPEARANCE_DEFAULTS.font
  return { preset, veil: Math.round(veil * 100) / 100, diffSyntax, decor, grain, font }
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
  root.setAttribute('data-animal-decor', state.decor ? 'on' : 'off')
  root.setAttribute('data-animal-grain', state.grain ? 'on' : 'off')
  root.setAttribute('data-animal-font', state.font)
}

function clearAppearance(root: HTMLElement): void {
  root.style.removeProperty('--animal-canvas-veil')
  for (const attribute of ROOT_ATTRIBUTES) root.removeAttribute(attribute)
}

/** Capture the current root state so dispose can put it back exactly. */
function captureRoot(root: HTMLElement): Map<string, string | null> {
  return new Map(ROOT_ATTRIBUTES.map((attribute) => [attribute, root.getAttribute(attribute)]))
}

function restoreRoot(root: HTMLElement, previous: Map<string, string | null>): void {
  for (const [attribute, value] of previous) {
    if (value === null) root.removeAttribute(attribute)
    else root.setAttribute(attribute, value)
  }
}

/** Create the appearance store owned by one installed skin root. */
export function createAppearanceStore(root: HTMLElement, fontLayer?: AppearanceFontLayer): AppearanceStore {
  const previousVeil = root.style.getPropertyValue('--animal-canvas-veil')
  const previousVeilPriority = root.style.getPropertyPriority('--animal-canvas-veil')
  const previousAttributes = captureRoot(root)
  const listeners = new Set<() => void>()
  let active = true
  let current = readAppearance()

  // A saved system-font preference is only valid while its token layer can be
  // installed; a missing ThemeRuntime falls back to the bundled face instead of
  // leaving the UI claiming a font the page is not using.
  if (current.font === 'system' && !fontLayer?.set(true)) {
    current = { ...current, font: 'theme' }
    writeAppearance(current)
  }

  try {
    paintAppearance(current, root)
  } catch (error) {
    fontLayer?.dispose()
    clearAppearance(root)
    restoreRoot(root, previousAttributes)
    if (previousVeil !== '') root.style.setProperty('--animal-canvas-veil', previousVeil, previousVeilPriority)
    throw error
  }

  const apply = (next: Partial<AppearanceState>): AppearanceState => {
    const candidate = normalizeAppearance({ ...current, ...next })
    if (candidate.font !== current.font) {
      if (candidate.font === 'system') {
        // A missing or rejected layer must not leave the UI claiming a font the
        // page is not using; keep the theme face and continue with other axes.
        if (fontLayer?.set(true) !== true) candidate.font = 'theme'
      } else {
        fontLayer?.set(false)
      }
    }
    current = candidate
    writeAppearance(current)
    paintAppearance(current, root)
    for (const listener of [...listeners]) listener()
    return current
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
      return apply(next)
    },
    reset() {
      if (!active) return current
      return apply(DEFAULT_STATE)
    },
    dispose() {
      if (!active) return
      active = false
      listeners.clear()
      fontLayer?.dispose()
      clearAppearance(root)
      if (previousVeil !== '') root.style.setProperty('--animal-canvas-veil', previousVeil, previousVeilPriority)
      restoreRoot(root, previousAttributes)
      current = DEFAULT_STATE
    },
  }
}
