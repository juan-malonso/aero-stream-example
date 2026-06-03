import type { MicrofrontendTheme } from '@/styles/microfrontends';
import { colors } from '@/styles/tokens';

export const runnerTheme = {
  key: 'runner',
  href: '/runner',
  label: 'AeroStream Runner',
  shortLabel: 'Runner',
  icon: 'play',
  primary50: colors.emerald50,
  primary100: colors.emerald100,
  primary200: colors.emerald200,
  primary300: colors.emerald300,
  primary400: colors.emerald400,
  primary500: colors.emerald500,
  primary600: colors.emerald600,
  primary700: colors.emerald700,
  primary800: colors.emerald800,
  primary900: colors.emerald900,
  canvas: 'color-mix(in srgb, var(--color-emerald500) 15%, var(--color-gray50))',
} as const satisfies MicrofrontendTheme;
