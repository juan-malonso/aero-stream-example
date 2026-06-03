import type { MicrofrontendTheme } from '@/styles/microfrontends';
import { colors } from '@/styles/tokens';

export const trackerTheme = {
  key: 'tracker',
  href: '/tracker',
  label: 'AeroStream Tracker',
  shortLabel: 'Tracker',
  icon: 'history',
  primary50: colors.yellow50,
  primary100: colors.yellow100,
  primary200: colors.yellow200,
  primary300: colors.yellow300,
  primary400: colors.yellow400,
  primary500: colors.yellow500,
  primary600: colors.yellow600,
  primary700: colors.yellow700,
  primary800: colors.yellow800,
  primary900: colors.yellow900,
  canvas: 'color-mix(in srgb, var(--color-yellow500) 18%, var(--color-gray50))',
} as const satisfies MicrofrontendTheme;
