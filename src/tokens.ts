import type { Mode, Palette, TokenMap, TokenPairs } from './types.ts'
import { ANIMAL_ISLAND_PALETTES } from './palette.ts'

interface Rgb { r: number; g: number; b: number }

function rgb(value: string): Rgb {
  const hex = value.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`Expected a six-digit hex colour, received: ${value}`)
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  }
}

function hex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((part) => Math.round(Math.max(0, Math.min(255, part))).toString(16).padStart(2, '0')).join('')}`
}

function mix(a: string, b: string, amount: number): string {
  const left = rgb(a)
  const right = rgb(b)
  const t = Math.max(0, Math.min(1, amount))
  return hex({
    r: left.r + (right.r - left.r) * t,
    g: left.g + (right.g - left.g) * t,
    b: left.b + (right.b - left.b) * t,
  })
}

function alpha(value: string, opacity: number): string {
  const c = rgb(value)
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${opacity})`
}

function channel(value: number): number {
  const srgb = value / 255
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

function luminance(value: string): number {
  const c = rgb(value)
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
}

export function contrastRatio(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

function readable(background: string, light: string, dark: string): string {
  return contrastRatio(light, background) >= contrastRatio(dark, background) ? light : dark
}

function legibleFill(accent: string, background: string): string {
  const white = '#ffffff'
  const black = '#2a2118'
  if (contrastRatio(accent, white) >= 3 && contrastRatio(accent, background) >= 3) return accent
  const target = contrastRatio(accent, white) < contrastRatio(accent, black) ? black : white
  let candidate = accent
  for (let step = 1; step <= 12; step += 1) {
    candidate = mix(accent, target, step / 12)
    if (contrastRatio(candidate, white) >= 3 && contrastRatio(candidate, background) >= 3) return candidate
  }
  return readable(background, white, black)
}

function lift(base: string, foreground: string, amount: number): string {
  return mix(base, foreground, amount)
}

export function buildTokens(palette: Palette, mode: Mode): TokenMap {
  const dark = mode === 'dark'
  const code = palette.code
  const codeFg = code.fg ?? palette.fg
  const surface = palette.surface
  const surfaceAlt = palette.surfaceAlt
  const bg = palette.bg
  const fg = palette.fg
  const body = palette.body
  const border = palette.border
  const accent = palette.accent
  const accentText = palette.accentText
  const accentHover = palette.accentHover
  const primaryButton = palette.primaryButton
  const primaryButtonHover = palette.primaryButtonHover
  const infoFill = legibleFill(palette.info, bg)
  const tooltipBg = dark ? lift(surface, fg, 0.18) : mix(fg, bg, 0.12)
  const primaryFg = readable(primaryButton, '#fffbe7', '#2a2118')

  return {
    // Cream paper, warm layered surfaces, and translucent masks.
    '--dsw-alias-bg-base': bg,
    '--dsw-alias-bg-layer-1': surface,
    '--dsw-alias-bg-layer-2': surfaceAlt,
    '--dsw-alias-bg-layer-3': palette.surfaceDeep,
    '--dsw-alias-bg-module-platform': lift(bg, fg, 0.04),
    '--dsw-alias-bg-multi-select': lift(surface, fg, 0.06),
    '--dsw-alias-bg-overlay': palette.overlay,
    '--dsw-alias-bg-skeleton': alpha(fg, 0.07),
    '--dsw-alias-bg-mask-1': dark ? '#160f0a80' : '#3d342a3d',
    '--dsw-alias-bg-mask-2': dark ? '#160f0a33' : '#3d342a1f',
    '--dsw-alias-bg-mask-3': '#160f0a7a',
    '--dsw-alias-bg-mask-photo': '#160f0ae0',
    '--dsw-alias-bg-mask-drop': alpha(bg, 0.7),

    // Soft umber borders; the raw values are intentionally warm rather than gray.
    '--dsw-alias-border-l1': alpha(border, 0.35),
    '--dsw-alias-border-l2': alpha(border, 0.55),
    '--dsw-alias-border-l2-darkmode-thin': alpha(border, 0.35),
    '--dsw-alias-border-l3': alpha(border, 0.7),
    '--dsw-alias-border-l4': alpha(border, 0.9),
    '--dsw-alias-border-inverted': alpha(fg, 0.06),
    '--dsw-alias-border-inverted2': alpha(fg, 0.09),

    // Mint controls and warm paper buttons.
    '--dsw-alias-brand-primary': accent,
    '--dsw-alias-brand-primary-invert': fg,
    '--dsw-alias-brand-primary-new-colorprimary-new-color': accent,
    '--dsw-alias-brand-text': fg,
    '--dsw-alias-link': accentText,
    '--dsw-font-family': 'Nunito, "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    '--ds-font-family-code': '"SFMono-Regular", "Cascadia Code", "Fira Code", Consolas, "Liberation Mono", monospace',
    '--dsw-alias-button-contrast-fill': mix(fg, bg, 0.12),
    '--dsw-alias-button-elevated-fill': palette.overlay,
    '--dsw-alias-button-floating-fill': surface,
    '--dsw-alias-button-floating-hover': lift(surface, fg, 0.07),
    '--dsw-alias-button-ghost-active-border': border,
    '--dsw-alias-button-ghost-active-fill': lift(surface, fg, 0.08),
    '--dsw-alias-button-ghost-active-hover': lift(surface, fg, 0.14),
    '--dsw-alias-button-info-fill': infoFill,
    '--dsw-alias-button-info-hover': mix(infoFill, fg, 0.18),
    '--dsw-alias-button-primary-dimmed': mix(primaryButton, bg, 0.28),
    '--dsw-alias-button-primary-fill': primaryButton,
    '--dsw-alias-button-primary-hover': primaryButtonHover,
    '--dsw-alias-button-tool-bar-fill': alpha(fg, 0.5),
    '--dsw-alias-button-tool-bar-fill-invisible': alpha(fg, 0.36),
    '--dsw-alias-button-tool-bar-hover': alpha(fg, 0.62),

    // Gentle game-like feedback expressed only through public color tokens.
    '--dsw-alias-interactive-bg-hover': alpha(palette.sidebarActive, dark ? 0.38 : 0.5),
    '--dsw-alias-interactive-bg-hover-accent': alpha(accent, 0.22),
    '--dsw-alias-interactive-bg-hover-danger': alpha(palette.error, 0.13),
    '--dsw-alias-interactive-bg-hover-solid': dark ? palette.sidebarHover : alpha(palette.sidebarHover, 0.82),
    '--dsw-alias-interactive-bg-active': alpha(palette.sidebarActive, dark ? 0.72 : 0.78),

    // Warm-brown text hierarchy.
    '--dsw-alias-label-primary': fg,
    '--dsw-alias-label-secondary': body,
    '--dsw-alias-label-tertiary': palette.muted,
    '--dsw-alias-label-caption': palette.caption,
    '--dsw-alias-label-dimmed': mix(palette.faint, bg, 0.5),
    '--dsw-alias-label-primary-bluish': fg,
    '--dsw-alias-label-primary-dimmed': mix(fg, bg, 0.12),
    '--dsw-alias-label-primary-foreground': primaryFg,
    '--dsw-alias-label-primary-inverted': bg,

    // Markdown, inline code, and syntax highlighting.
    '--dsw-alias-markdown-code-block': code.bg,
    '--dsw-alias-markdown-code-block-banner': lift(code.bg, code.fg, 0.05),
    '--dsw-alias-markdown-code-segment-selected': lift(code.bg, code.fg, 0.1),
    '--dsw-alias-markdown-code-segment-unselected': code.bg,
    '--dsw-alias-markdown-inline-code': surfaceAlt,
    '--dsw-alias-markdown-citation': lift(surface, fg, 0.07),
    '--dsw-alias-markdown-placeholder': lift(bg, fg, 0.04),
    '--dsw-alias-markdown-tag': lift(surface, fg, 0.05),

    // Warm scrollbars and status colors.
    '--dsw-alias-scrollbar-bg-l1': alpha(fg, 0.18),
    '--dsw-alias-scrollbar-bg-l2': alpha(fg, 0.22),
    '--dsw-alias-scrollbar-hover-l1': alpha(fg, 0.3),
    '--dsw-alias-scrollbar-hover-l2': alpha(fg, 0.34),
    '--dsw-alias-state-error-primary': palette.error,
    '--dsw-alias-state-error-secondary': mix(palette.error, bg, 0.2),
    '--dsw-alias-state-success-primary': palette.success,
    '--dsw-alias-state-success-secondary': mix(palette.success, bg, 0.2),
    '--dsw-alias-state-success-tertiary': mix(palette.success, bg, 0.82),
    '--dsw-alias-state-warn-primary': palette.warn,
    '--dsw-alias-state-warn-secondary': mix(palette.warn, bg, 0.2),
    '--dsw-alias-state-warn-tertiary': mix(palette.warn, bg, 0.82),
    '--dsw-alias-state-warn-label': palette.warn,
    '--dsw-alias-state-business-primary': accentText,
    '--dsw-alias-state-business-tertiary': mix(accent, bg, 0.78),

    // Floating chrome and the canonical periwinkle sidebar states.
    '--dsw-alias-toast-bg': tooltipBg,
    '--dsw-alias-tooltip-bg': tooltipBg,
    '--dsw-specific-bubble': palette.bubble,
    '--dsw-specific-bubble-highlight': mix(palette.bubble, accent, 0.28),
    '--dsw-specific-input-major': surface,
    '--dsw-specific-login-input': lift(bg, fg, 0.03),
    '--dsw-specific-menu': palette.overlay,
    '--dsw-specific-selector': lift(surface, fg, 0.05),
    '--dsw-specific-sidebar-fill': palette.sidebar,
    '--dsw-specific-sidebar-nav-item-hover': palette.sidebarHover,
    '--dsw-specific-sidebar-nav-item-active': palette.sidebarActive,
    '--dsw-specific-sidebar-nav-item-active-accent': mix(palette.sidebarActive, accentText, 0.14),
    '--dsw-specific-tip': lift(surface, fg, 0.05),

    // A small set of current DSH consumers reads raw ramp slots directly.
    '--dsw-static-deepseek-500': accentText,
    '--dsw-static-deepseek-200': mix(accentText, bg, 0.7),
    '--dsw-static-blue-500': accentText,
    '--dsw-static-blue-450': accentHover,
    '--dsw-static-neutral-bluish-400': palette.faint,

    // Warm shadows instead of cold black elevation.
    '--dsw-shadow-lv1': dark ? '0 2px 4px 0 #160f0a59' : '0 2px 4px 0 #3d34280f',
    '--dsw-shadow-lv1-blur': dark ? '0 4px 12px 0 #160f0a40' : '0 4px 12px 0 #3d342808',
    '--dsw-shadow-lv2': dark ? '0 4px 12px 0 #160f0a40, 0 2px 8px 0 #160f0a4d' : '0 4px 12px 0 #3d342808, 0 2px 8px 0 #3d34280d',
    '--dsw-shadow-lv3': dark ? '0 0 1px 0 #160f0a80, 0 0 4px 0 #160f0a4d, 0 12px 32px 0 #160f0a66' : '0 0 1px 0 #3d342833, 0 0 4px 0 #3d34280d, 0 12px 32px 0 #3d34281f',
    '--dsw-elevation-stroke-color': dark ? '#cbb99466' : '#82715766',
    '--dsw-elevation-stroke': '0 0 0 .5px var(--dsw-elevation-stroke-color)',
    '--dsw-elevation-panel': 'var(--dsw-elevation-stroke), 0 4px 12px 0 #3d342814, 0 0 20px 0 #3d34280d',
    '--dsw-elevation-prominent': 'var(--dsw-elevation-stroke), 0 8px 24px 0 #3d342824, 0 0 28px 0 #3d342814',
    '--dsw-elevation-soft': 'var(--dsw-elevation-stroke), 0 4px 16px 0 #3d342814, 0 0 28px 0 #3d34280f',
    '--dsw-linear-gradient-think': `linear-gradient(180deg, ${bg} 20.19%, ${alpha(bg, 0)} 100%)`,
    '--dsw-linear-think-select': `linear-gradient(180deg, ${surface} 20.19%, ${alpha(surface, 0)} 100%)`,

    // Shiki syntax tokens.
    '--shiki-foreground': codeFg,
    '--shiki-background': code.bg,
    '--shiki-token-comment': code.comment,
    '--shiki-token-keyword': code.keyword,
    '--shiki-token-string': code.string,
    '--shiki-token-string-expression': code.string,
    '--shiki-token-constant': code.constant,
    '--shiki-token-function': code.function,
    '--shiki-token-parameter': code.parameter,
    '--shiki-token-punctuation': code.punctuation,
    '--shiki-token-link': code.link,
  }
}

/** Build the exact payload accepted by ctx.theme.overrideTokens(). */
export function buildTokenOverrides(): TokenPairs {
  const light = buildTokens(ANIMAL_ISLAND_PALETTES.light, 'light')
  const dark = buildTokens(ANIMAL_ISLAND_PALETTES.dark, 'dark')
  const names = new Set([...Object.keys(light), ...Object.keys(dark)])
  const pairs: TokenPairs = {}
  for (const name of names) {
    pairs[name] = {
      light: light[name] ?? dark[name]!,
      dark: dark[name] ?? light[name]!,
    }
  }
  return pairs
}

export { ANIMAL_ISLAND_PALETTES }
