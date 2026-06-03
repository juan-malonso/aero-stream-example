import type { MicrofrontendTheme } from '@/styles/microfrontends';
import { colors } from '@/styles/tokens';

export const homeTheme = {
  key: 'home',
  href: '/home',
  label: 'AeroStream Home',
  shortLabel: 'Home',
  icon: 'play',
  primary50: colors.blue50,
  primary100: colors.blue100,
  primary200: colors.blue200,
  primary300: colors.blue300,
  primary400: colors.blue400,
  primary500: colors.blue500,
  primary600: colors.blue600,
  primary700: colors.blue700,
  primary800: colors.blue800,
  primary900: colors.blue900,
  canvas: 'color-mix(in srgb, var(--color-blue500) 14%, var(--color-gray50))',
} as const satisfies MicrofrontendTheme;
