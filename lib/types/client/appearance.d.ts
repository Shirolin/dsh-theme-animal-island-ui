/**
 * Canvas appearance preferences for the Animal Island skin.
 *
 * The value set is small and purely visual: the alpha of the cream "paper"
 * sheet DSH lays over the green canvas, the syntax palette used by the flat
 * deliverables diff, whether the illustrated canvas layers and the paper grain
 * are shown, and which UI font family the skin uses. All of it is kept in
 * localStorage (per client) rather than the Host settings document because it
 * is a per-device visual preference.
 */
export type AppearancePreset = 'paper' | 'balanced' | 'island' | 'custom';
/**
 * Syntax palette used by the flat deliverables code diff on the light paper.
 * `warm` is the skin's own light-surface palette; `native` restores DSH's
 * built-in light syntax colours. Dark mode always keeps the theme palette.
 */
export type DiffSyntax = 'warm' | 'native';
/**
 * Interface font family. `theme` keeps the bundled Nunito Latin face; `system`
 * uses the platform UI stack. Neither changes the content font size, which the
 * Host owns, nor the code font, which is part of the theme identity.
 */
export type InterfaceFont = 'theme' | 'system';
/** The place where a font override layer is registered, kept apart from the palette. */
export interface AppearanceFontLayer {
    /** Register or remove the system-font token layer. Returns whether the desired state is active. */
    set(enabled: boolean): boolean;
    dispose(): void;
}
interface AppearanceState {
    preset: AppearancePreset;
    veil: number;
    diffSyntax: DiffSyntax;
    decor: boolean;
    grain: boolean;
    font: InterfaceFont;
}
export interface AppearanceStore {
    getSnapshot(): AppearanceState;
    subscribe(listener: () => void): () => void;
    set(next: Partial<AppearanceState>): AppearanceState;
    /** Restore every appearance axis to its shipped default. */
    reset(): AppearanceState;
    dispose(): void;
}
export declare const APPEARANCE_PRESETS: {
    readonly paper: 0.52;
    readonly balanced: 0.4;
    readonly island: 0.28;
};
export declare const APPEARANCE_DEFAULTS: {
    readonly preset: "balanced";
    readonly veil: 0.4;
    readonly diffSyntax: "warm";
    readonly decor: true;
    readonly grain: true;
    readonly font: "theme";
    readonly min: 0.15;
    readonly max: 0.6;
};
/** Create the appearance store owned by one installed skin root. */
export declare function createAppearanceStore(root: HTMLElement, fontLayer?: AppearanceFontLayer): AppearanceStore;
export {};
