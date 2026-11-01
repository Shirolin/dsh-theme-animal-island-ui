import type { SlotRegistryLike } from './context.ts';
import type { InstalledSkin } from './install.ts';
export declare const APPEARANCE_TAB_ID = "animal-island-appearance";
/**
 * Register the per-client appearance preference and its Settings → Plugins tab.
 *
 * The tab is a public list slot (`settings.plugins.tab`) declared by the Plugins
 * settings section, so `slots.inject` defers registration until that section is
 * mounted; a deployment without it simply has no appearance tab, and the skin
 * keeps the CSS default. Preferences live in localStorage because this is a
 * per-device visual choice, not a Host-owned setting.
 */
export declare function registerAppearanceTab(slots: SlotRegistryLike, installedSkin: InstalledSkin): () => void;
