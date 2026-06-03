import { builderTheme } from '@/modules/aero-stream-builder/styles/theme';
import { playerTheme } from '@/modules/aero-stream-player/styles/theme';
import { runnerTheme } from '@/modules/aero-stream-runner/styles/theme';
import { trackerTheme } from '@/modules/aero-stream-tracker/styles/theme';
import { homeTheme } from '@/modules/home/styles/theme';
import type { MicrofrontendTheme } from '@/styles/microfrontends';

export const MICROFRONTEND_THEMES: readonly MicrofrontendTheme[] = [
  homeTheme,
  builderTheme,
  runnerTheme,
  playerTheme,
  trackerTheme,
] as const;

export function getMicrofrontendTheme(pathname: string | null): MicrofrontendTheme {
  return MICROFRONTEND_THEMES.find((theme) => pathname?.startsWith(theme.href)) ?? homeTheme;
}
