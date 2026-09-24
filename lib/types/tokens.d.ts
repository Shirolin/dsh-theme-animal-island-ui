import type { Mode, Palette, TokenMap, TokenPairs } from './types.ts';
import { ANIMAL_ISLAND_PALETTES } from './palette.ts';
export declare function contrastRatio(a: string, b: string): number;
export declare function buildTokens(palette: Palette, mode: Mode): TokenMap;
/** Build the exact payload accepted by ctx.theme.overrideTokens(). */
export declare function buildTokenOverrides(): TokenPairs;
export { ANIMAL_ISLAND_PALETTES };
