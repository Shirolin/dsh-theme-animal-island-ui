import { buildTokenOverrides } from '../tokens.ts'
import type { TokenPairs } from '../types.ts'

export type ThemeTokenOverrides = TokenPairs

interface ThemeRuntimeLike {
  overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void
}

interface ClientContextLike {
  theme?: ThemeRuntimeLike
  effect(effect: () => () => void, name?: string): unknown
}

// Module-level inject lists cordis SERVICE names. The package name belongs only
// in package.json's dsh.client.inject manifest; ThemeRuntime provides 'theme'.
export const inject = ['theme']

export const THEME_SOURCE = 'dsh-theme-animal-island-ui:palette'

/** Apply one semantic token layer to DSH's public ThemeRuntime seam. */
export function apply(ctx: ClientContextLike): void {
  const theme = ctx.theme
  const overrideTokens = theme?.overrideTokens

  if (typeof overrideTokens !== 'function') {
    console.warn('[dsh-theme-animal-island-ui] DSH ThemeRuntime.overrideTokens is unavailable; theme skipped')
    return
  }

  let dispose: unknown
  try {
    dispose = overrideTokens.call(theme, THEME_SOURCE, buildTokenOverrides())
  } catch (error) {
    console.warn('[dsh-theme-animal-island-ui] token layer could not be registered:', error)
    return
  }

  if (typeof dispose !== 'function') {
    console.warn('[dsh-theme-animal-island-ui] ThemeRuntime.overrideTokens did not return a disposer; theme skipped')
    return
  }

  ctx.effect(() => dispose as () => void, 'animal-island-ui-theme:overrideTokens')
}

export { buildTokenOverrides }
