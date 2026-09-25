import { buildTokenOverrides } from '../tokens.ts';
import type { TokenPairs } from '../types.ts';
import type { ClientContextLike } from './context.ts';
export type ThemeTokenOverrides = TokenPairs;
export declare const inject: string[];
export declare const THEME_SOURCE = "dsh-theme-animal-island-ui:palette";
/** Apply the coordinated token, owned-style, and public-slot skin layers. */
export declare function apply(ctx: ClientContextLike): void;
export { buildTokenOverrides };
