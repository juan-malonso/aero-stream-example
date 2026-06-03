'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { MicrofrontendTheme } from '@/styles/microfrontends';
import { colors, typography } from '@/styles/tokens';

import { MICROFRONTEND_THEMES } from '../styles/microfrontendThemes';

const HOME_APPS = MICROFRONTEND_THEMES.filter(theme => theme.key !== 'home' && theme.key !== 'player');
const THEME_STORAGE_KEY = 'aerostream-theme';
type ThemeMode = 'dark' | 'light';

export function HomeApp() {
  const iframeReference = useRef<HTMLIFrameElement>(null);
  const [activeApp, setActiveApp] = useState(HOME_APPS[0]);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const frameUrl = useMemo(() => activeApp.href, [activeApp]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
    setThemeMode(initialTheme);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', themeMode === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    iframeReference.current?.contentWindow?.postMessage({
      theme: themeMode,
      type: 'aerostream-theme',
    }, window.location.origin);
  }, [themeMode, activeApp]);

  const toggleTheme = () => {
    setThemeMode(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div style={homeStyle}>
      <header style={headerStyle(activeApp, themeMode)}>
        <div style={brandStyle}>
          <span style={brandAccentStyle(activeApp)}>Aero</span>
          <span style={brandMutedStyle(themeMode)}>Stream</span>
        </div>
        <nav style={navStyle}>
          {HOME_APPS.map((app) => (
            <button
              key={app.key}
              onClick={() => {
                if (app.key === activeApp.key) return;
                setIsFrameLoading(true);
                setActiveApp(app);
              }}
              type="button"
              style={navButtonStyle(activeApp, app, themeMode)}
            >
              {navigationLabel(app)}
            </button>
          ))}
        </nav>
        <button
          onClick={toggleTheme}
          type="button"
          style={themeButtonStyle(activeApp, themeMode)}
        >
          {themeMode === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </header>
      <main style={stageStyle}>
        <iframe
          ref={iframeReference}
          title={activeApp.label}
          src={frameUrl}
          style={iframeStyle(isFrameLoading)}
          onLoad={() => {
            setIsFrameLoading(false);
            iframeReference.current?.contentWindow?.postMessage({
              theme: themeMode,
              type: 'aerostream-theme',
            }, window.location.origin);
          }}
        />
        <div aria-hidden="true" style={loadingCoverStyle(activeApp, isFrameLoading, themeMode)}>
          {navigationLabel(activeApp)}
        </div>
      </main>
    </div>
  );
}

function navigationLabel(app: MicrofrontendTheme): string {
  switch (app.key) {
    case 'builder':
      return 'Builder';
    case 'runner':
      return 'Runner';
    case 'tracker':
      return 'Tracker';
    default:
      return app.shortLabel;
  }
}

function navButtonStyle(activeApp: MicrofrontendTheme, app: MicrofrontendTheme, themeMode: ThemeMode): CSSProperties {
  const isActive = activeApp.key === app.key;
  return {
    alignItems: 'center',
    alignSelf: 'stretch',
    background: isActive
      ? themeMode === 'dark'
        ? activeApp.primary100
        : activeApp.primary700
      : 'transparent',
    border: 0,
    borderLeft: `1px solid ${isActive ? 'transparent' : 'rgba(148, 163, 184, 0.2)'}`,
    borderRadius: 0,
    borderRight: `1px solid ${isActive ? 'transparent' : 'rgba(148, 163, 184, 0.2)'}`,
    boxShadow: isActive ? `inset 0 -3px 0 ${activeApp.primary500}` : undefined,
    color: isActive
      ? themeMode === 'dark'
        ? activeApp.primary800
        : activeApp.primary100
      : themeMode === 'dark'
        ? '#dbeafe'
        : colors.gray700,
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    justifyContent: 'center',
    minWidth: '180px',
    padding: '0 1.5rem',
    textTransform: 'uppercase',
    transition: 'background-color 0.18s, color 0.18s',
  };
}

const homeStyle: CSSProperties = {
  background: colors.gray900,
  display: 'grid',
  gridTemplateRows: '3.5rem minmax(0, 1fr)',
  height: '100%',
};

function headerStyle(activeApp: MicrofrontendTheme, themeMode: ThemeMode): CSSProperties {
  return {
    alignItems: 'center',
    background: themeMode === 'dark' ? '#0b1220' : colors.white,
    borderBottom: `2px solid ${activeApp.primary500}`,
    boxShadow: themeMode === 'dark' ? 'none' : `0 1px 0 ${colors.gray200}`,
    display: 'grid',
    gridTemplateColumns: '220px minmax(0, 1fr) 200px',
    minHeight: 0,
    zIndex: 1,
  };
}

const brandStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  fontSize: typography.sizes['2xl'],
  gap: '0.25rem',
  height: '100%',
  padding: '0 1.5rem',
};

function brandAccentStyle(activeApp: MicrofrontendTheme): CSSProperties {
  return {
    color: activeApp.primary400,
    fontWeight: 800,
  };
}

function brandMutedStyle(themeMode: ThemeMode): CSSProperties {
  return {
    color: themeMode === 'dark' ? '#f8fafc' : colors.gray800,
    fontWeight: 300,
  };
}

const navStyle: CSSProperties = {
  display: 'flex',
  height: '100%',
  justifyContent: 'flex-start',
  minWidth: 0,
};

function themeButtonStyle(activeApp: MicrofrontendTheme, themeMode: ThemeMode): CSSProperties {
  return {
    alignSelf: 'center',
    background: themeMode === 'dark' ? 'transparent' : activeApp.primary50,
    border: `1px solid ${themeMode === 'dark' ? '#cbd5e1' : activeApp.primary300}`,
    borderRadius: '0.55rem',
    color: themeMode === 'dark' ? '#f8fafc' : activeApp.primary800,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    justifySelf: 'end',
    letterSpacing: '0.04em',
    marginRight: '1.25rem',
    minHeight: '32px',
    padding: '0 0.9rem',
    textTransform: 'uppercase',
  };
}

const stageStyle: CSSProperties = {
  background: 'var(--surface-canvas, var(--color-gray100))',
  minHeight: 0,
  overflow: 'hidden',
  position: 'relative',
};

function iframeStyle(isFrameLoading: boolean): CSSProperties {
  return {
    border: 0,
    height: '100%',
    opacity: isFrameLoading ? 0 : 1,
    transition: 'opacity 0.12s ease-out',
    width: '100%',
  };
}

function loadingCoverStyle(activeApp: MicrofrontendTheme, isFrameLoading: boolean, themeMode: ThemeMode): CSSProperties {
  return {
    alignItems: 'center',
    background: themeMode === 'dark' ? '#0f172a' : activeApp.canvas,
    color: themeMode === 'dark' ? activeApp.primary200 : activeApp.primary800,
    display: 'flex',
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    inset: 0,
    justifyContent: 'center',
    letterSpacing: '0.08em',
    opacity: isFrameLoading ? 1 : 0,
    pointerEvents: isFrameLoading ? 'auto' : 'none',
    position: 'absolute',
    textTransform: 'uppercase',
    transition: 'opacity 0.12s ease-out',
    zIndex: 2,
  };
}
