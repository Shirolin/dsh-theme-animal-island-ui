import type { ClientContextLike } from './context.ts'
import { createAppearanceStore, type AppearanceStore } from './appearance.ts'
import { SKIN_CSS } from 'virtual:animal-island-skin-css'

export const PLUGIN_ID = 'dsh-theme-animal-island-ui'
export const ROOT_ATTRIBUTE = 'data-dsh-animal-island-skin'
export const ROOT_VALUE = 'active'

export interface InstalledSkin {
  readonly appearance: AppearanceStore
}

interface Installation {
  readonly root: HTMLElement
  readonly skin: InstalledSkin
  references: number
  dispose(): void
}

const installations = new WeakMap<HTMLElement, Installation>()

function restoreRootAttribute(root: HTMLElement, previousValue: string | null): void {
  if (root.getAttribute(ROOT_ATTRIBUTE) !== ROOT_VALUE) return
  if (previousValue === null) root.removeAttribute(ROOT_ATTRIBUTE)
  else root.setAttribute(ROOT_ATTRIBUTE, previousValue)
}

function createInstallation(root: HTMLElement): Installation {
  const previousValue = root.getAttribute(ROOT_ATTRIBUTE)
  const ownerDocument = root.ownerDocument
  const style = ownerDocument.createElement('style')
  style.setAttribute('data-plugin', PLUGIN_ID)
  style.setAttribute('data-plugin-css', `${PLUGIN_ID}/skin`)
  style.textContent = SKIN_CSS
  const appearance = createAppearanceStore(root)

  try {
    root.setAttribute(ROOT_ATTRIBUTE, ROOT_VALUE)
    ownerDocument.head.append(style)
  } catch (error) {
    style.remove()
    appearance.dispose()
    restoreRootAttribute(root, previousValue)
    throw error
  }

  let active = true
  return {
    root,
    skin: { appearance },
    references: 0,
    dispose() {
      if (!active) return
      active = false
      style.remove()
      appearance.dispose()
      restoreRootAttribute(root, previousValue)
    },
  }
}

/** Install or reuse the root-owned skin lifecycle and return its public handle. */
export function installOwnedSkin(ctx: ClientContextLike): InstalledSkin | undefined {
  if (typeof document === 'undefined' || !document.documentElement || !document.head) return undefined

  const root = document.documentElement
  const installation = installations.get(root) ?? createInstallation(root)
  installations.set(root, installation)
  installation.references += 1

  let released = false
  const release = () => {
    if (released) return
    released = true
    installation.references -= 1
    if (installation.references > 0) return
    installations.delete(root)
    installation.dispose()
  }

  try {
    ctx.effect(() => release, 'animal-island-ui:owned-skin')
  } catch (error) {
    release()
    throw error
  }
  return installation.skin
}
