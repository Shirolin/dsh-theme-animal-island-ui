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
export declare const APPEARANCE_DEFAULTS: {
    readonly preset: "balanced";
    readonly veil: 0.4;
    readonly min: 0.15;
    readonly max: 0.6;
};
export declare function getAppearance(): AppearanceState;
export declare function subscribeAppearance(listener: () => void): () => void;
/** Persist, paint, and notify. The installed root owns the visible lifecycle. */
export declare function setAppearance(next: AppearanceState): AppearanceState;
/** Load the saved preference, paint it, and return the matching disposer. */
export declare function installAppearance(root: HTMLElement): () => void;
