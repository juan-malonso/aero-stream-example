import React from 'react';

import { sidebarContainerStyle } from '@/styles/theme';

import { ComponentToolbox } from './ComponentToolbox';

export const Sidebar = () => {
  return (
    <aside
      style={{
        ...sidebarContainerStyle,
        gridTemplateRows: '1fr',
        overflowY: 'auto',
        width: '290px',
      }}
    >
      <ComponentToolbox />
    </aside>
  );
};
