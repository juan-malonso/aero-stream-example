export type MicrofrontendKey = 'builder' | 'home' | 'player' | 'runner' | 'tracker';

export interface MicrofrontendTheme {
  key: MicrofrontendKey;
  href: string;
  label: string;
  shortLabel: string;
  icon: 'history' | 'play' | 'puzzle';
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;
  canvas: string;
}
