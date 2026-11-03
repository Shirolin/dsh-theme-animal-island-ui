import type { AppearanceFontLayer } from './appearance.ts';
import type { ThemeRuntimeLike } from './context.ts';
/**
 * The interface-font override lives in its own Token layer instead of a CSS
 * `!important` rule on `--dsw-font-family`: the value is static, so the
 * ThemeRuntime is the correct owner. The layer is registered after the palette
 * layer and removed when the user goes back to the bundled face, leaving every
 * other token untouched.
 */
export declare const FONT_LAYER_SOURCE = "dsh-theme-animal-island-ui:appearance";
/**
 * The stack itself is declared once in `skin.css` (`--animal-system-font-family`)
 * so the ThemeRuntime payload and the skin-owned UI cannot drift apart; the
 * fallback keeps a stylesheet-less page on a generic sans face.
 */
export declare const SYSTEM_FONT_TOKEN = "var(--animal-system-font-family, sans-serif)";
export declare function createFontLayer(theme: ThemeRuntimeLike | undefined): AppearanceFontLayer;
