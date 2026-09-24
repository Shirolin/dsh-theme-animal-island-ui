import { buildTokenOverrides } from '../tokens.ts';
import type { TokenPairs } from '../types.ts';
export type ThemeTokenOverrides = TokenPairs;
interface ThemeRuntimeLike {
    overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void;
}
interface ClientContextLike {
    theme?: ThemeRuntimeLike;
    effect(effect: () => () => void, name?: string): unknown;
}
export declare const inject: string[];
export declare const THEME_SOURCE = "dsh-theme-animal-island-ui:palette";
/** Apply one semantic token layer to DSH's public ThemeRuntime seam. */
export declare function apply(ctx: ClientContextLike): void;
export { buildTokenOverrides };
