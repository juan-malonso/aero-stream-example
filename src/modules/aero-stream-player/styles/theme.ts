import type { MicrofrontendTheme } from '@/styles/microfrontends';
import { colors } from '@/styles/tokens';

export const playerTheme = {
  key: 'player',
  href: '/live',
  label: 'AeroStream Player',
  shortLabel: 'Player',
  icon: 'play',
  primary50: colors.cyan50,
  primary100: colors.cyan100,
  primary200: colors.cyan200,
  primary300: colors.cyan300,
  primary400: colors.cyan400,
  primary500: colors.cyan500,
  primary600: colors.cyan600,
  primary700: colors.cyan700,
  primary800: colors.cyan800,
  primary900: colors.cyan900,
  canvas: 'color-mix(in srgb, var(--color-cyan500) 16%, var(--color-gray50))',
} as const satisfies MicrofrontendTheme;
