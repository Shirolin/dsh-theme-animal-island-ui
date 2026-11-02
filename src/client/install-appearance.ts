import type { SlotRegistryLike } from './context.ts'
import { AppearanceTab } from './components/appearance-tab.tsx'
import type { InstalledSkin } from './install.ts'

const APPEARANCE_TAB_ID = 'animal-island-appearance'

function tabLabel(): string {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh') ? '动森外观' : 'Island appearance'
}

/**
 * Register the per-client appearance preference and its Settings → Plugins tab.
 *
 * The tab is a public list slot (`settings.plugins.tab`) declared by the Plugins
 * settings section, so `slots.inject` defers registration until that section is
 * mounted; a deployment without it simply has no appearance tab, and the skin
 * keeps the CSS default. Preferences live in localStorage because this is a
 * per-device visual choice, not a Host-owned setting.
 */
export function registerAppearanceTab(slots: SlotRegistryLike, installedSkin: InstalledSkin): () => void {
  return slots.inject('settings.plugins.tab', () =>
    slots.register(
      {
        name: 'settings.plugins.tab',
        id: APPEARANCE_TAB_ID,
        order: 40,
        label: tabLabel,
        inject: () => ({ appearance: installedSkin.appearance }),
      },
      AppearanceTab,
    ),
  )
}
