/**
 * Canvas appearance preference for the Animal Island skin.
 *
 * The value is a single number: the alpha of the cream "paper" sheet DSH lays
 * over the green canvas. Lower = greener / more island, higher = whiter / easier
 * to read. It is kept in localStorage (per client) rather than the Host settings
 * document because it is a purely visual, per-device preference.
 */
export type AppearancePreset = 'paper' | 'balanced' | 'island' | 'custom';
export interface AppearanceState {
    preset: AppearancePreset;
    veil: number;
}
export declare const APPEARANCE_PRESETS: {
    readonly paper: 0.52;
    readonly balanced: 0.4;
    readonly island: 0.28;
};
export declare const APPEARANCE_MIN = 0.15;
export declare const APPEARANCE_MAX = 0.6;
export declare const DEFAULT_APPEARANCE: AppearanceState;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export declare function normalizeAppearance(input: unknown): AppearanceState;
export declare function readStorage(): StorageLike | undefined;
export declare function readAppearance(source?: StorageLike | undefined): AppearanceState;
export declare function writeAppearance(state: AppearanceState, target?: StorageLike | undefined): void;
/** Paint the preference onto the root element as a CSS variable. */
export declare function applyAppearance(state: AppearanceState, root: HTMLElement): void;
export declare function clearAppearance(root: HTMLElement): void;
export declare function getAppearance(): AppearanceState;
export declare function subscribeAppearance(listener: () => void): () => void;
/** Persist, apply, and notify. Used by the settings tab. */
export declare function setAppearance(next: AppearanceState): AppearanceState;
/** Load the saved preference and paint it. Called once when the skin installs. */
export declare function initAppearance(root: HTMLElement): void;
export {};
