'use client';

import { Header } from '@/components/Header';
import { WorkflowProvider } from '@/contexts/shared/workflow/WorkflowContext';
import { getMicrofrontendTheme } from '@/styles/microfrontends';
import { colors } from '@/styles/tokens';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

export function MicrofrontendShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const theme = getMicrofrontendTheme(pathname);

  const pageStyle: CSSProperties = {
    '--surface-primary50': theme.primary50,
    '--surface-primary100': theme.primary100,
    '--surface-primary200': theme.primary200,
    '--surface-primary500': theme.primary500,
    '--surface-primary600': theme.primary600,
    '--surface-primary700': theme.primary700,
    '--surface-canvas': theme.canvas,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: theme.canvas,
  } as CSSProperties;

  const mainStyle: CSSProperties = {
    flex: '1 1 0%',
    minHeight: 0,
    position: 'relative',
    borderTop: `3px solid ${theme.primary500}`,
    background: `linear-gradient(180deg, ${theme.canvas} 0, ${colors.gray50} 72px)`,
  };

  return (
    <WorkflowProvider>
      <div style={pageStyle}>
        <Header />
        <main style={mainStyle}>{children}</main>
      </div>
    </WorkflowProvider>
  );
}
