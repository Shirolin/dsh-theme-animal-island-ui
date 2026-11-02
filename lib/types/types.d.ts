export type Mode = 'light' | 'dark';
interface CodePalette {
    bg: string;
    fg: string;
    comment: string;
    keyword: string;
    string: string;
    constant: string;
    function: string;
    parameter: string;
    punctuation: string;
    link: string;
}
export interface Palette {
    bg: string;
    surface: string;
    surfaceAlt: string;
    surfaceDeep: string;
    overlay: string;
    fg: string;
    body: string;
    muted: string;
    caption: string;
    faint: string;
    border: string;
    accent: string;
    accentText: string;
    accentHover: string;
    primaryButton: string;
    primaryButtonHover: string;
    info: string;
    error: string;
    success: string;
    warn: string;
    sidebar: string;
    sidebarHover: string;
    sidebarActive: string;
    bubble: string;
    code: CodePalette;
}
export type TokenPairs = Record<string, {
    light: string;
    dark: string;
}>;
export type TokenMap = Record<string, string>;
export {};
