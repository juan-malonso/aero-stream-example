'use client';

import { Header } from '@/components/Header';
import { WorkflowProvider } from '@/contexts/shared/workflow/WorkflowContext';
import { colors } from '@/styles/tokens';

import type { CSSProperties, ReactNode } from 'react';

export function MicrofrontendShell({ children }: { children: ReactNode }) {
  const pageStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: colors.gray50,
  };

  const mainStyle: CSSProperties = {
    flex: '1 1 0%',
    minHeight: 0,
    position: 'relative',
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
