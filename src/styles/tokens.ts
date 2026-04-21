// ---------------------------------------------------------------------------
// Design Tokens — Single source of truth for ALL visual constants.
// Every color, spacing, radius, shadow, and font value in the app
// MUST originate from this file.
// ---------------------------------------------------------------------------

export const colors = {
  // Neutrals
  white: 'var(--color-white)',
  black: 'var(--color-black)',
  
  // Grays
  gray50: 'var(--color-gray50)',
  gray100: 'var(--color-gray100)',
  gray200: 'var(--color-gray200)',
  gray300: 'var(--color-gray300)',
  gray400: 'var(--color-gray400)',
  gray500: 'var(--color-gray500)',
  gray600: 'var(--color-gray600)',
  gray700: 'var(--color-gray700)',
  gray800: 'var(--color-gray800)',
  gray900: 'var(--color-gray900)',

  // Primary (Brand/Indigo)
  primary50: 'var(--color-primary50)',
  primary100: 'var(--color-primary100)',
  primary200: 'var(--color-primary200)',
  primary300: 'var(--color-primary300)',
  primary400: 'var(--color-primary400)',
  primary500: 'var(--color-primary500)',
  primary600: 'var(--color-primary600)',
  primary700: 'var(--color-primary700)',
  primary800: 'var(--color-primary800)',
  primary900: 'var(--color-primary900)',

  // Blue
  blue50: 'var(--color-blue50)',
  blue100: 'var(--color-blue100)',
  blue200: 'var(--color-blue200)',
  blue300: 'var(--color-blue300)',
  blue400: 'var(--color-blue400)',
  blue500: 'var(--color-blue500)',
  blue600: 'var(--color-blue600)',
  blue700: 'var(--color-blue700)',
  blue800: 'var(--color-blue800)',
  blue900: 'var(--color-blue900)',

  // Cyan
  cyan50: 'var(--color-cyan50)',
  cyan100: 'var(--color-cyan100)',
  cyan200: 'var(--color-cyan200)',
  cyan300: 'var(--color-cyan300)',
  cyan400: 'var(--color-cyan400)',
  cyan500: 'var(--color-cyan500)',
  cyan600: 'var(--color-cyan600)',
  cyan700: 'var(--color-cyan700)',
  cyan800: 'var(--color-cyan800)',
  cyan900: 'var(--color-cyan900)',

  // Green
  green50: 'var(--color-green50)',
  green100: 'var(--color-green100)',
  green200: 'var(--color-green200)',
  green300: 'var(--color-green300)',
  green400: 'var(--color-green400)',
  green500: 'var(--color-green500)',
  green600: 'var(--color-green600)',
  green700: 'var(--color-green700)',
  green800: 'var(--color-green800)',
  green900: 'var(--color-green900)',

  // Emerald
  emerald50: 'var(--color-emerald50)',
  emerald100: 'var(--color-emerald100)',
  emerald200: 'var(--color-emerald200)',
  emerald300: 'var(--color-emerald300)',
  emerald400: 'var(--color-emerald400)',
  emerald500: 'var(--color-emerald500)',
  emerald600: 'var(--color-emerald600)',
  emerald700: 'var(--color-emerald700)',
  emerald800: 'var(--color-emerald800)',
  emerald900: 'var(--color-emerald900)',

  // Teal
  teal50: 'var(--color-teal50)',
  teal100: 'var(--color-teal100)',
  teal200: 'var(--color-teal200)',
  teal300: 'var(--color-teal300)',
  teal400: 'var(--color-teal400)',
  teal500: 'var(--color-teal500)',
  teal600: 'var(--color-teal600)',
  teal700: 'var(--color-teal700)',
  teal800: 'var(--color-teal800)',
  teal900: 'var(--color-teal900)',

  // Yellow
  yellow50: 'var(--color-yellow50)',
  yellow100: 'var(--color-yellow100)',
  yellow200: 'var(--color-yellow200)',
  yellow300: 'var(--color-yellow300)',
  yellow400: 'var(--color-yellow400)',
  yellow500: 'var(--color-yellow500)',
  yellow600: 'var(--color-yellow600)',
  yellow700: 'var(--color-yellow700)',
  yellow800: 'var(--color-yellow800)',
  yellow900: 'var(--color-yellow900)',

  // Amber
  amber50: 'var(--color-amber50)',
  amber100: 'var(--color-amber100)',
  amber200: 'var(--color-amber200)',
  amber300: 'var(--color-amber300)',
  amber400: 'var(--color-amber400)',
  amber500: 'var(--color-amber500)',
  amber600: 'var(--color-amber600)',
  amber700: 'var(--color-amber700)',
  amber800: 'var(--color-amber800)',
  amber900: 'var(--color-amber900)',

  // Orange (field edges)
  orange50: 'var(--color-orange50)',
  orange100: 'var(--color-orange100)',
  orange200: 'var(--color-orange200)',
  orange300: 'var(--color-orange300)',
  orange400: 'var(--color-orange400)',
  orange500: 'var(--color-orange500)',
  orange600: 'var(--color-orange600)',
  orange700: 'var(--color-orange700)',
  orange800: 'var(--color-orange800)',
  orange900: 'var(--color-orange900)',

  // Red
  red50: 'var(--color-red50)',
  red100: 'var(--color-red100)',
  red200: 'var(--color-red200)',
  red300: 'var(--color-red300)',
  red400: 'var(--color-red400)',
  red500: 'var(--color-red500)',
  red600: 'var(--color-red600)',
  red700: 'var(--color-red700)',
  red800: 'var(--color-red800)',
  red900: 'var(--color-red900)',

  // Pink
  pink50: 'var(--color-pink50)',
  pink100: 'var(--color-pink100)',
  pink200: 'var(--color-pink200)',
  pink300: 'var(--color-pink300)',
  pink400: 'var(--color-pink400)',
  pink500: 'var(--color-pink500)',
  pink600: 'var(--color-pink600)',
  pink700: 'var(--color-pink700)',
  pink800: 'var(--color-pink800)',
  pink900: 'var(--color-pink900)',

  // Violet
  violet50: 'var(--color-violet50)',
  violet100: 'var(--color-violet100)',
  violet200: 'var(--color-violet200)',
  violet300: 'var(--color-violet300)',
  violet400: 'var(--color-violet400)',
  violet500: 'var(--color-violet500)',
  violet600: 'var(--color-violet600)',
  violet700: 'var(--color-violet700)',
  violet800: 'var(--color-violet800)',
  violet900: 'var(--color-violet900)',

  // Fuchsia
  fuchsia50: 'var(--color-fuchsia50)',
  fuchsia100: 'var(--color-fuchsia100)',
  fuchsia200: 'var(--color-fuchsia200)',
  fuchsia300: 'var(--color-fuchsia300)',
  fuchsia400: 'var(--color-fuchsia400)',
  fuchsia500: 'var(--color-fuchsia500)',
  fuchsia600: 'var(--color-fuchsia600)',
  fuchsia700: 'var(--color-fuchsia700)',
  fuchsia800: 'var(--color-fuchsia800)',
  fuchsia900: 'var(--color-fuchsia900)',

  // Semantic
  stepFlow: 'var(--color-stepFlow)',
  fieldData: 'var(--color-fieldData)',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  '4xl': '2rem',
} as const;

export const radii = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
} as const;

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  sizes: {
    '2xs': '9px',
    xs: '10px',
    sm: '11px',
    md: '12px',
    base: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
    '2xl': '1.5rem',
    '3xl': '1.7rem',
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;