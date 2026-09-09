import type { Theme } from './types';

export interface ColorTokens {
  bg: string; fg: string; sheet: string; sheetline: string; bezel: string;
  acct: string; acctFill: string; danger: string; dangerFill: string;
  t8a: string; t7a: string; t6a: string; t5a: string; t55: string; t4a: string; t3a: string; t44: string;
  b33: string; s0d: string; s0f: string; s11: string; s14: string; s16: string; s1a: string; s1d: string;
  w08: string; w09: string; w10: string; w12: string; w14: string; w15: string; w16: string; w18: string; w20: string; w25: string;
}

// Ported from the prototype's `themeVars` template string (light overrides
// everything; dark declares only the tokens whose var() fallback wasn't
// already the right value — folded in here explicitly instead).
export const colors: Record<Theme, ColorTokens> = {
  dark: {
    bg: '#000000',
    fg: '#ffffff',
    sheet: '#171717',
    sheetline: '#383838',
    bezel: '#262626',
    acct: '#c6ff00',
    acctFill: '#c6ff00',
    danger: '#e0584a',
    dangerFill: '#c8402f',
    t8a: '#8a8a8a',
    t7a: '#8f8f8f',
    t6a: '#878787',
    t5a: '#808080',
    t55: '#878787',
    t4a: '#4a4a4a',
    t3a: '#3a3a3a',
    t44: '#444444',
    b33: '#333333',
    s0d: '#0d0d0d',
    s0f: '#0f0f0f',
    s11: '#111111',
    s14: '#141414',
    s16: '#161616',
    s1a: '#1a1a1a',
    s1d: '#2a2a2a',
    w08: 'rgba(255,255,255,.08)',
    w09: 'rgba(255,255,255,.09)',
    w10: 'rgba(255,255,255,.1)',
    w12: 'rgba(255,255,255,.12)',
    w14: 'rgba(255,255,255,.14)',
    w15: 'rgba(255,255,255,.15)',
    w16: 'rgba(255,255,255,.16)',
    w18: 'rgba(255,255,255,.18)',
    w20: 'rgba(255,255,255,.2)',
    w25: 'rgba(255,255,255,.25)',
  },
  light: {
    bg: '#ffffff',
    fg: '#111111',
    sheet: '#ffffff',
    sheetline: 'rgba(0,0,0,.14)',
    bezel: '#d8d8d8',
    acct: '#5c7a00',
    acctFill: '#a8d400',
    danger: '#b3271a',
    dangerFill: '#b3271a',
    t8a: '#5f5f5f',
    t7a: '#5e5e5e',
    t6a: '#636363',
    t5a: '#666666',
    t55: '#6e6e6e',
    t4a: '#a5a5a5',
    t3a: '#c2c2c2',
    t44: '#c6c6c6',
    b33: '#d4d4d4',
    s0d: '#f5f5f5',
    s0f: '#f7f7f7',
    s11: '#f2f2f2',
    s14: '#efefef',
    s16: '#ededed',
    s1a: '#eaeaea',
    s1d: '#e5e5e5',
    w08: 'rgba(0,0,0,.07)',
    w09: 'rgba(0,0,0,.10)',
    w10: 'rgba(0,0,0,.12)',
    w12: 'rgba(0,0,0,.10)',
    w14: 'rgba(0,0,0,.16)',
    w15: 'rgba(0,0,0,.16)',
    w16: 'rgba(0,0,0,.16)',
    w18: 'rgba(0,0,0,.20)',
    w20: 'rgba(0,0,0,.22)',
    w25: 'rgba(0,0,0,.28)',
  },
} as const;

export function tokensFor(theme: Theme): ColorTokens {
  return colors[theme];
}

// The green fill always renders black text on top of it, in both themes —
// mirrors the prototype's literal `#000` on `--acct-fill` buttons.
export const ON_ACCENT = '#000000';

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_600SemiBold',
  num: 'SpaceGrotesk_600SemiBold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemibold: 'InstrumentSans_600SemiBold',
};

export const radii = {
  pill: 999,
  card: 18,
  sheet: 26,
};
