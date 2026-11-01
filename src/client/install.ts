import type { ClientContextLike } from './context.ts'
import { SKIN_CSS } from 'virtual:animal-island-skin-css'

export const PLUGIN_ID = 'dsh-theme-animal-island-ui'
export const ROOT_ATTRIBUTE = 'data-dsh-animal-island-skin'
export const ROOT_VALUE = 'active'

export function installOwnedSkin(ctx: ClientContextLike): void {
  if (typeof document === 'undefined' || !document.documentElement || !document.head) return

  const root = document.documentElement
  const previousValue = root.getAttribute(ROOT_ATTRIBUTE)
  const style = document.createElement('style')
  style.setAttribute('data-plugin', PLUGIN_ID)
  style.setAttribute('data-plugin-css', `${PLUGIN_ID}/skin`)
  style.textContent = SKIN_CSS

  try {
    root.setAttribute(ROOT_ATTRIBUTE, ROOT_VALUE)
    document.head.append(style)
  } catch (error) {
    style.remove()
    if (previousValue === null) root.removeAttribute(ROOT_ATTRIBUTE)
    else root.setAttribute(ROOT_ATTRIBUTE, previousValue)
    throw error
  }

  ctx.effect(
    () => () => {
      style.remove()
      if (root.getAttribute(ROOT_ATTRIBUTE) !== ROOT_VALUE) return
      if (previousValue === null) root.removeAttribute(ROOT_ATTRIBUTE)
      else root.setAttribute(ROOT_ATTRIBUTE, previousValue)
    },
    'animal-island-ui:owned-skin',
  )
}
