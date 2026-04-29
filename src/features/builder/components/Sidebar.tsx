import React from 'react';
import { ComponentToolbox } from './ComponentToolbox';
import { WorkflowList } from './WorkflowList';
import { sidebarContainerStyle } from '@/styles/theme';

export const Sidebar = () => {
  return (
    <aside style={{ ...sidebarContainerStyle, overflowY: 'auto' }}>
      <ComponentToolbox />
      <WorkflowList />
    </aside>
  );
};
