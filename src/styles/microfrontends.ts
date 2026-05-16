import { colors } from './tokens';

export type MicrofrontendKey = 'builder' | 'live' | 'sessions';

export interface MicrofrontendTheme {
  key: MicrofrontendKey;
  href: string;
  label: string;
  shortLabel: string;
  icon: 'puzzle' | 'play' | 'history';
  primary50: string;
  primary100: string;
  primary200: string;
  primary500: string;
  primary600: string;
  primary700: string;
  canvas: string;
}

export const MICROFRONTEND_THEMES: readonly MicrofrontendTheme[] = [
  {
    key: 'builder',
    href: '/builder',
    label: 'Workflow Builder',
    shortLabel: 'Builder',
    icon: 'puzzle',
    primary50: colors.pink50,
    primary100: colors.pink100,
    primary200: colors.pink200,
    primary500: colors.pink500,
    primary600: colors.pink600,
    primary700: colors.pink700,
    canvas: 'color-mix(in srgb, var(--color-pink500) 16%, var(--color-gray50))',
  },
  {
    key: 'live',
    href: '/live',
    label: 'Session Player',
    shortLabel: 'Player',
    icon: 'play',
    primary50: colors.blue50,
    primary100: colors.blue100,
    primary200: colors.blue200,
    primary500: colors.blue500,
    primary600: colors.blue600,
    primary700: colors.blue700,
    canvas: 'color-mix(in srgb, var(--color-blue500) 16%, var(--color-gray50))',
  },
  {
    key: 'sessions',
    href: '/sessions',
    label: 'Sessions',
    shortLabel: 'Sessions',
    icon: 'history',
    primary50: colors.yellow50,
    primary100: colors.yellow100,
    primary200: colors.yellow200,
    primary500: colors.yellow500,
    primary600: colors.yellow600,
    primary700: colors.yellow700,
    canvas: 'color-mix(in srgb, var(--color-yellow500) 18%, var(--color-gray50))',
  },
] as const;

export function getMicrofrontendTheme(pathname: string | null): MicrofrontendTheme {
  return MICROFRONTEND_THEMES.find((theme) => pathname?.startsWith(theme.href)) ?? MICROFRONTEND_THEMES[1];
}
