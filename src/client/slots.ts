import type { ClientContextLike } from './context.ts'
import { BrandName, HeroBrandMark, IslandMark } from './components/brand.tsx'

export function installPublicSlots(ctx: ClientContextLike): void {
  const slots = ctx.slots
  if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') {
    console.warn('[dsh-theme-animal-island-ui] DSH SlotRegistry is unavailable; brand slots skipped')
    return
  }

  ctx.effect(() => slots.inject('sidebar.brand.mark', () => (
    slots.register({ name: 'sidebar.brand.mark', priority: -100 }, IslandMark)
  )), 'animal-island-ui:sidebar-brand-mark')

  ctx.effect(() => slots.inject('sidebar.brand.name', () => (
    slots.register({ name: 'sidebar.brand.name', priority: -100 }, BrandName)
  )), 'animal-island-ui:sidebar-brand-name')

  ctx.effect(() => slots.inject('conversation.hero.brand.mark', () => (
    slots.register({ name: 'conversation.hero.brand.mark', priority: -100 }, HeroBrandMark)
  )), 'animal-island-ui:hero-brand-mark')
}
