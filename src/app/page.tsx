'use client';

import { PilotExample } from '@/features/live';
import { WorkflowBuilder } from '@/features/builder';

import { Header } from '@/components/Header';
import { WorkflowProvider } from '@/context/WorkflowContext';
import { colors } from '@/styles/tokens';

import React, { type CSSProperties,useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'builder' | 'live'>('builder');

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
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={mainStyle}>
          {activeTab === 'live' && <PilotExample />}
          {activeTab === 'builder' && <WorkflowBuilder />}
        </main>
      </div>
    </WorkflowProvider>
  );
}
