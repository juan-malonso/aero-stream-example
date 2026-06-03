'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { colors } from '@/styles/tokens';

import { getMicrofrontendTheme } from '../styles/microfrontendThemes';

const THEME_STORAGE_KEY = 'aerostream-theme';
type ThemeMode = 'dark' | 'light';

export function AppRouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const theme = getMicrofrontendTheme(pathname);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
    setThemeMode(initialTheme);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  useEffect(() => {
    const updateFromStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (event.newValue === 'light' || event.newValue === 'dark') {
        setThemeMode(event.newValue);
      }
    };

    const updateFromMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { theme?: unknown; type?: unknown };
      if (data.type !== 'aerostream-theme') return;
      if (data.theme === 'light' || data.theme === 'dark') {
        setThemeMode(data.theme);
      }
    };

    window.addEventListener('storage', updateFromStorage);
    window.addEventListener('message', updateFromMessage);

    return () => {
      window.removeEventListener('storage', updateFromStorage);
      window.removeEventListener('message', updateFromMessage);
    };
  }, []);

  const pageStyle: CSSProperties = {
    '--surface-primary50': theme.primary50,
    '--surface-primary100': theme.primary100,
    '--surface-primary200': theme.primary200,
    '--surface-primary300': theme.primary300,
    '--surface-primary400': theme.primary400,
    '--surface-primary500': theme.primary500,
    '--surface-primary600': theme.primary600,
    '--surface-primary700': theme.primary700,
    '--surface-primary800': theme.primary800,
    '--surface-primary900': theme.primary900,
    '--surface-canvas': theme.canvas,
    backgroundColor: theme.canvas,
    height: '100vh',
    overflow: 'hidden',
  } as CSSProperties;

  const mainStyle: CSSProperties = {
    background: theme.key === 'runner'
      ? theme.canvas
      : `linear-gradient(180deg, ${theme.canvas} 0, ${colors.gray50} 72px)`,
    height: '100%',
    minHeight: 0,
    position: 'relative',
  };

  return (
    <div style={pageStyle}>
      <main style={mainStyle}>{children}</main>
    </div>
  );
}
