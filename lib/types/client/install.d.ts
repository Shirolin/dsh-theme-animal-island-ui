import type { ClientContextLike } from './context.ts';
import { type AppearanceStore } from './appearance.ts';
export declare const PLUGIN_ID = "dsh-theme-animal-island-ui";
export declare const ROOT_ATTRIBUTE = "data-dsh-animal-island-skin";
export declare const ROOT_VALUE = "active";
export interface InstalledSkin {
    readonly appearance: AppearanceStore;
}
/** Install or reuse the root-owned skin lifecycle and return its public handle. */
export declare function installOwnedSkin(ctx: ClientContextLike): InstalledSkin | undefined;
