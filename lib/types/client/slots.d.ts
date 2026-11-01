import type { ClientContextLike } from './context.ts';
import type { InstalledSkin } from './install.ts';
/**
 * Register public slot contributions once per root and shared SlotRegistry.
 *
 * Registration belongs to the root installation, not to the context that
 * mounted first: overlapping contexts keep it alive until the last release.
 */
export declare function installPublicSlots(ctx: ClientContextLike, installedSkin: InstalledSkin): void;
