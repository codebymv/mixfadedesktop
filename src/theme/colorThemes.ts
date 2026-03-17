export type ColorThemeId = 'emerald-violet' | 'sunset-cyan' | 'rose-indigo';

export interface DeckColorTokens {
  base: string;
  strong: string;
  text: string;
}

export interface ColorTheme {
  id: ColorThemeId;
  label: string;
  description: string;
  deckA: DeckColorTokens;
  deckB: DeckColorTokens;
  shellDeckA?: string;
  shellDeckB?: string;
  fusionMid: string;
  focus: string;
}

export type DeckThemeKey = 'A' | 'B' | 'green' | 'purple';

export const DEFAULT_COLOR_THEME_ID: ColorThemeId = 'emerald-violet';

export const COLOR_THEME_OPTIONS: ColorTheme[] = [
  {
    id: 'emerald-violet',
    label: 'Midnight Bloom',
    description: 'The classic MixFade look with emerald Deck A and violet Deck B.',
    deckA: { base: '#10b981', strong: '#059669', text: '#34d399' },
    deckB: { base: '#8b5cf6', strong: '#7c3aed', text: '#c084fc' },
    shellDeckA: '#10b981',
    shellDeckB: '#a855f7',
    fusionMid: '#14b8a6',
    focus: '#a855f7',
  },
  {
    id: 'sunset-cyan',
    label: 'Golden Hour',
    description: 'Warm amber on Deck A blended with crisp cyan on Deck B.',
    deckA: { base: '#f59e0b', strong: '#d97706', text: '#fbbf24' },
    deckB: { base: '#06b6d4', strong: '#0891b2', text: '#67e8f9' },
    fusionMid: '#22d3ee',
    focus: '#06b6d4',
  },
  {
    id: 'rose-indigo',
    label: 'Neon Dusk',
    description: 'A richer contrast pairing of rose red and deep indigo.',
    deckA: { base: '#f43f5e', strong: '#e11d48', text: '#fb7185' },
    deckB: { base: '#6366f1', strong: '#4f46e5', text: '#a5b4fc' },
    fusionMid: '#a855f7',
    focus: '#6366f1',
  },
];

const COLOR_THEMES_BY_ID = COLOR_THEME_OPTIONS.reduce<Record<ColorThemeId, ColorTheme>>((acc, theme) => {
  acc[theme.id] = theme;
  return acc;
}, {} as Record<ColorThemeId, ColorTheme>);

const normalizeHex = (hex: string) => {
  const value = hex.replace('#', '').trim();
  if (value.length === 3) {
    return value.split('').map(char => `${char}${char}`).join('');
  }
  return value.slice(0, 6);
};

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex);
  if (normalized.length !== 6) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const hexToRgbTriplet = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
};

export const withAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
};

export const getColorTheme = (id?: string): ColorTheme => {
  if (!id) {
    return COLOR_THEMES_BY_ID[DEFAULT_COLOR_THEME_ID];
  }

  return COLOR_THEMES_BY_ID[id as ColorThemeId] ?? COLOR_THEMES_BY_ID[DEFAULT_COLOR_THEME_ID];
};

export const getDeckTheme = (theme: ColorTheme, deck: DeckThemeKey): DeckColorTokens => {
  return deck === 'A' || deck === 'green' ? theme.deckA : theme.deckB;
};

export const createThemeCssVariables = (theme: ColorTheme) => ({
  '--theme-deck-a-base': theme.deckA.base,
  '--theme-deck-a-base-rgb': hexToRgbTriplet(theme.deckA.base),
  '--theme-deck-a-strong': theme.deckA.strong,
  '--theme-deck-a-strong-rgb': hexToRgbTriplet(theme.deckA.strong),
  '--theme-deck-a-text': theme.deckA.text,
  '--theme-deck-a-text-rgb': hexToRgbTriplet(theme.deckA.text),
  '--theme-shell-deck-a': theme.shellDeckA ?? theme.deckA.base,
  '--theme-deck-b-base': theme.deckB.base,
  '--theme-deck-b-base-rgb': hexToRgbTriplet(theme.deckB.base),
  '--theme-deck-b-strong': theme.deckB.strong,
  '--theme-deck-b-strong-rgb': hexToRgbTriplet(theme.deckB.strong),
  '--theme-deck-b-text': theme.deckB.text,
  '--theme-deck-b-text-rgb': hexToRgbTriplet(theme.deckB.text),
  '--theme-shell-deck-b': theme.shellDeckB ?? theme.deckB.base,
  '--theme-fusion-mid': theme.fusionMid,
  '--theme-fusion-mid-rgb': hexToRgbTriplet(theme.fusionMid),
  '--theme-focus': theme.focus,
  '--theme-focus-rgb': hexToRgbTriplet(theme.focus),
});