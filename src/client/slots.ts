import type { ClientContextLike, SlotRegistryLike } from './context.ts'
import { BrandName, HeroBrandMark, IslandMark } from './components/brand.tsx'
import { registerAppearanceTab } from './install-appearance.ts'
import type { InstalledSkin } from './install.ts'

interface PublicSlotInstallation {
  references: number
  dispose(): void
}

const installations = new WeakMap<SlotRegistryLike, WeakMap<HTMLElement, PublicSlotInstallation>>()

function disposeAll(disposers: (() => void)[]): void {
  for (const dispose of disposers.splice(0).reverse()) dispose()
}

function registerBrandSlots(slots: SlotRegistryLike): () => void {
  const disposers: (() => void)[] = []
  try {
    disposers.push(
      slots.inject('sidebar.brand.mark', () => slots.register({ name: 'sidebar.brand.mark', priority: -100 }, IslandMark)),
      slots.inject('sidebar.brand.name', () => slots.register({ name: 'sidebar.brand.name', priority: -100 }, BrandName)),
      slots.inject('conversation.hero.brand.mark', () => slots.register({ name: 'conversation.hero.brand.mark', priority: -100 }, HeroBrandMark)),
    )
  } catch (error) {
    disposeAll(disposers)
    throw error
  }
  return () => disposeAll(disposers)
}

function registerPublicSlots(slots: SlotRegistryLike, installedSkin: InstalledSkin): () => void {
  const disposers = [registerBrandSlots(slots)]
  try {
    disposers.push(registerAppearanceTab(slots, installedSkin))
  } catch (error) {
    disposeAll(disposers)
    throw error
  }
  return () => disposeAll(disposers)
}

function retain(ctx: ClientContextLike, root: HTMLElement, slots: SlotRegistryLike, installation: PublicSlotInstallation): void {
  installation.references += 1
  let released = false
  const release = () => {
    if (released) return
    released = true
    installation.references -= 1
    if (installation.references > 0) return
    installations.get(slots)?.delete(root)
    installation.dispose()
  }

  try {
    ctx.effect(() => release, 'animal-island-ui:public-slots')
  } catch (error) {
    release()
    throw error
  }
}

/**
 * Register public slot contributions once per root and shared SlotRegistry.
 *
 * Registration belongs to the root installation, not to the context that
 * mounted first: overlapping contexts keep it alive until the last release.
 */
export function installPublicSlots(ctx: ClientContextLike, installedSkin: InstalledSkin): void {
  if (typeof document === 'undefined' || !document.documentElement) return

  const slots = ctx.slots
  if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') {
    console.warn('[dsh-theme-animal-island-ui] DSH SlotRegistry is unavailable; public slots skipped')
    return
  }

  const root = document.documentElement
  let byRoot = installations.get(slots)
  if (byRoot === undefined) {
    byRoot = new WeakMap()
    installations.set(slots, byRoot)
  }

  const existing = byRoot.get(root)
  if (existing !== undefined) {
    retain(ctx, root, slots, existing)
    return
  }

  const installation = {
    references: 0,
    dispose: registerPublicSlots(slots, installedSkin),
  }
  byRoot.set(root, installation)
  retain(ctx, root, slots, installation)
}
