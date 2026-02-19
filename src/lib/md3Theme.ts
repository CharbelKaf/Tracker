import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  type TonalPalette,
} from '@material/material-color-utilities';
import type { AppSettings } from '../types';

type AccentColor = AppSettings['accentColor'];
type ThemeMode = AppSettings['theme'];

const LIGHT_SURFACE_TONES = {
  surfaceDim: 87,
  surfaceBright: 99,
  surfaceContainerLowest: 100,
  surfaceContainerLow: 96,
  surfaceContainer: 94,
  surfaceContainerHigh: 92,
  surfaceContainerHighest: 90,
};

const DARK_SURFACE_TONES = {
  surfaceDim: 6,
  surfaceBright: 24,
  surfaceContainerLowest: 4,
  surfaceContainerLow: 10,
  surfaceContainer: 12,
  surfaceContainerHigh: 17,
  surfaceContainerHighest: 22,
};

export const ACCENT_SEED_HEX: Record<AccentColor, string> = {
  yellow: '#FFC107',
  blue: '#3B82F6',
  purple: '#A855F7',
  emerald: '#10B981',
  orange: '#F97316',
};

interface ApplyMd3ThemeOptions {
  root: HTMLElement;
  accentColor: AccentColor;
  themeMode: ThemeMode;
  prefersDark: boolean;
}

const toToken = (role: string) =>
  role.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const toneHex = (palette: TonalPalette, tone: number) =>
  hexFromArgb(palette.tone(tone));

export const getAccentSeedHex = (accentColor: AccentColor): string =>
  ACCENT_SEED_HEX[accentColor] ?? ACCENT_SEED_HEX.yellow;

export const resolveIsDarkMode = (
  themeMode: ThemeMode,
  prefersDark: boolean,
): boolean => {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return prefersDark;
};

const applySurfaceTokens = (
  root: HTMLElement,
  neutralPalette: TonalPalette,
  isDarkMode: boolean,
) => {
  const tones = isDarkMode ? DARK_SURFACE_TONES : LIGHT_SURFACE_TONES;
  root.style.setProperty('--md-sys-color-surface-dim', toneHex(neutralPalette, tones.surfaceDim));
  root.style.setProperty('--md-sys-color-surface-bright', toneHex(neutralPalette, tones.surfaceBright));
  root.style.setProperty('--md-sys-color-surface-container-lowest', toneHex(neutralPalette, tones.surfaceContainerLowest));
  root.style.setProperty('--md-sys-color-surface-container-low', toneHex(neutralPalette, tones.surfaceContainerLow));
  root.style.setProperty('--md-sys-color-surface-container', toneHex(neutralPalette, tones.surfaceContainer));
  root.style.setProperty('--md-sys-color-surface-container-high', toneHex(neutralPalette, tones.surfaceContainerHigh));
  root.style.setProperty('--md-sys-color-surface-container-highest', toneHex(neutralPalette, tones.surfaceContainerHighest));
};

const applyLegacyCompatTokens = (
  root: HTMLElement,
  primaryPalette: TonalPalette,
  isDarkMode: boolean,
) => {
  root.style.setProperty(
    '--color-primary-default',
    toneHex(primaryPalette, isDarkMode ? 80 : 40),
  );
  root.style.setProperty(
    '--color-primary-hover',
    toneHex(primaryPalette, isDarkMode ? 90 : 30),
  );
  root.style.setProperty(
    '--color-primary-light',
    toneHex(primaryPalette, isDarkMode ? 30 : 90),
  );
  root.style.setProperty(
    '--color-primary-dark',
    toneHex(primaryPalette, isDarkMode ? 80 : 20),
  );
};

export const applyMd3Theme = ({
  root,
  accentColor,
  themeMode,
  prefersDark,
}: ApplyMd3ThemeOptions) => {
  const sourceArgb = argbFromHex(getAccentSeedHex(accentColor));
  const generatedTheme = themeFromSourceColor(sourceArgb);
  const isDarkMode = resolveIsDarkMode(themeMode, prefersDark);
  const scheme = isDarkMode ? generatedTheme.schemes.dark : generatedTheme.schemes.light;
  const schemeColors = scheme.toJSON();

  Object.entries(schemeColors).forEach(([role, argbValue]) => {
    root.style.setProperty(`--md-sys-color-${toToken(role)}`, hexFromArgb(argbValue));
  });

  applySurfaceTokens(root, generatedTheme.palettes.neutral, isDarkMode);
  applyLegacyCompatTokens(root, generatedTheme.palettes.primary, isDarkMode);
  root.classList.toggle('dark', isDarkMode);
  root.style.colorScheme = isDarkMode ? 'dark' : 'light';
};
