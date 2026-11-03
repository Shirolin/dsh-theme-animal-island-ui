import type { AppearanceFontLayer } from './appearance.ts'
import type { ThemeRuntimeLike } from './context.ts'

/**
 * The interface-font override lives in its own Token layer instead of a CSS
 * `!important` rule on `--dsw-font-family`: the value is static, so the
 * ThemeRuntime is the correct owner. The layer is registered after the palette
 * layer and removed when the user goes back to the bundled face, leaving every
 * other token untouched.
 */
export const FONT_LAYER_SOURCE = 'dsh-theme-animal-island-ui:appearance'

/**
 * The stack itself is declared once in `skin.css` (`--animal-system-font-family`)
 * so the ThemeRuntime payload and the skin-owned UI cannot drift apart; the
 * fallback keeps a stylesheet-less page on a generic sans face.
 */
export const SYSTEM_FONT_TOKEN = 'var(--animal-system-font-family, sans-serif)'

const SYSTEM_FONT_PAIR = {
  light: SYSTEM_FONT_TOKEN,
  dark: SYSTEM_FONT_TOKEN,
} as const

export function createFontLayer(theme: ThemeRuntimeLike | undefined): AppearanceFontLayer {
  let disposeLayer: (() => void) | undefined

  return {
    set(enabled) {
      if (!enabled) {
        if (disposeLayer === undefined) return true
        disposeLayer()
        disposeLayer = undefined
        return true
      }
      if (disposeLayer !== undefined) return true
      if (theme === undefined || typeof theme.overrideTokens !== 'function') return false

      let dispose: unknown
      try {
        dispose = theme.overrideTokens(FONT_LAYER_SOURCE, { '--dsw-font-family': SYSTEM_FONT_PAIR })
      } catch (error) {
        console.warn('[dsh-theme-animal-island-ui] system-font layer could not be registered:', error)
        return false
      }
      if (typeof dispose !== 'function') {
        console.warn('[dsh-theme-animal-island-ui] theme runtime did not return a disposer for the system-font layer')
        return false
      }
      disposeLayer = dispose as () => void
      return true
    },
    dispose() {
      disposeLayer?.()
      disposeLayer = undefined
    },
  }
}
