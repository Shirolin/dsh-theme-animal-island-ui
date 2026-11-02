import { buildTokenOverrides } from '../tokens.ts'
import type { ClientContextLike } from './context.ts'
import { installOwnedSkin } from './install.ts'
import { installPublicSlots } from './slots.ts'

// Module-level inject uses Cordis service names. Package-level provider ordering
// lives in package.json's dsh.client.inject manifest.
export const inject = ['theme', 'slots']

const THEME_SOURCE = 'dsh-theme-animal-island-ui:palette'

function applyThemeLayer(ctx: ClientContextLike): boolean {
  const theme = ctx.theme
  const overrideTokens = theme?.overrideTokens
  if (typeof overrideTokens !== 'function') {
    console.warn('[dsh-theme-animal-island-ui] DSH ThemeRuntime.overrideTokens is unavailable; skin skipped')
    return false
  }

  let dispose: unknown
  try {
    dispose = overrideTokens.call(theme, THEME_SOURCE, buildTokenOverrides())
  } catch (error) {
    console.warn('[dsh-theme-animal-island-ui] token layer could not be registered:', error)
    return false
  }

  if (typeof dispose !== 'function') {
    console.warn('[dsh-theme-animal-island-ui] ThemeRuntime.overrideTokens did not return a disposer; skin skipped')
    return false
  }

  ctx.effect(() => dispose as () => void, 'animal-island-ui-theme:overrideTokens')
  return true
}

/** Apply the coordinated token, owned-style, appearance, and public-slot skin layers. */
export function apply(ctx: ClientContextLike): void {
  if (!applyThemeLayer(ctx)) return
  const installedSkin = installOwnedSkin(ctx)
  if (installedSkin === undefined) return
  installPublicSlots(ctx, installedSkin)
}
