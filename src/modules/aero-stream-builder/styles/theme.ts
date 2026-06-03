import type { MicrofrontendTheme } from '@/styles/microfrontends';
import { colors } from '@/styles/tokens';

export const builderTheme = {
  key: 'builder',
  href: '/builder',
  label: 'AeroStream Builder',
  shortLabel: 'Builder',
  icon: 'puzzle',
  primary50: colors.pink50,
  primary100: colors.pink100,
  primary200: colors.pink200,
  primary300: colors.pink300,
  primary400: colors.pink400,
  primary500: colors.pink500,
  primary600: colors.pink600,
  primary700: colors.pink700,
  primary800: colors.pink800,
  primary900: colors.pink900,
  canvas: 'color-mix(in srgb, var(--color-pink500) 16%, var(--color-gray50))',
} as const satisfies MicrofrontendTheme;
