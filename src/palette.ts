import type { Palette } from './types.ts'

/**
 * Animal Island palette translated to DSH semantic surfaces.
 * Light is the canonical presentation; dark is a separately readable night
 * derivative rather than an inversion of the light palette.
 */
export const ANIMAL_ISLAND_LIGHT: Palette = {
  bg: '#f8f8f0',
  surface: '#ffffff',
  surfaceAlt: '#f7f3df',
  surfaceDeep: '#f0e8d8',
  overlay: '#fffbe7',
  fg: '#6f451f',
  body: '#654a2f',
  muted: '#725f48',
  caption: '#7c684d',
  faint: '#b4a68c',
  border: '#dcd8d1',
  accent: '#19c8b9',
  accentText: '#0b6d64',
  accentHover: '#3dd4c6',
  primaryButton: '#f8f8f0',
  primaryButtonHover: '#fffbe7',
  info: '#2e6f7d',
  error: '#b63e3e',
  success: '#48741d',
  warn: '#846100',
  sidebar: '#faf8f3',
  sidebarHover: '#f0e2c8',
  sidebarActive: '#e5c99b',
  bubble: '#e6f9f6',
  code: {
    bg: '#2b2118',
    fg: '#e8d5bc',
    comment: '#a69580',
    keyword: '#d4a0e0',
    string: '#a8d4a0',
    constant: '#e8c87a',
    function: '#61afef',
    parameter: '#f0a870',
    punctuation: '#d4b896',
    link: '#74c0fc',
  },
}

export const ANIMAL_ISLAND_DARK: Palette = {
  bg: '#29231c',
  surface: '#362e25',
  surfaceAlt: '#2d2923',
  surfaceDeep: '#28241f',
  overlay: '#40362b',
  fg: '#f7e7c7',
  body: '#ead9bd',
  muted: '#cbb994',
  caption: '#aa987c',
  faint: '#a99173',
  border: '#8a7057',
  accent: '#61d9cb',
  accentText: '#7be2d5',
  accentHover: '#7be2d5',
  primaryButton: '#4a4035',
  primaryButtonHover: '#5a4d3e',
  info: '#67c8d4',
  error: '#ff8b8b',
  success: '#a9db69',
  warn: '#ffd15a',
  sidebar: '#303444',
  sidebarHover: '#4a3a28',
  sidebarActive: '#6b4a2c',
  bubble: '#294640',
  code: {
    bg: '#211b16',
    fg: '#f3dfbd',
    comment: '#a4937b',
    keyword: '#f0a1c0',
    string: '#8bd694',
    constant: '#ffb86b',
    function: '#9dd9ff',
    parameter: '#d0a6ff',
    punctuation: '#d4c0a0',
    link: '#72d6e3',
  },
}

export const ANIMAL_ISLAND_PALETTES = {
  light: ANIMAL_ISLAND_LIGHT,
  dark: ANIMAL_ISLAND_DARK,
} as const
