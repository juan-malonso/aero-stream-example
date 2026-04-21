import React from 'react';
import { COMPONENT_REGISTRY } from '@/lib/workflow/componentRegistry';
import { ExecutionBadge } from '@/components/shared/ExecutionBadge';
import { sectionHeaderStyle, toolboxItemStyle } from '@/styles/theme';
import { Column, Row } from '@/components/ui';
import { colors } from '@/styles/tokens';

export function ComponentToolbox() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Column style={{ borderTop: `1px solid ${colors.gray200}`, flex: 1, overflowY: 'auto', background: colors.white }} gap="0" align="stretch">
      <Row justify="space-between" align="center" style={{ 
        padding: '1rem 1.25rem', 
        borderBottom: `1px solid ${colors.gray200}`, 
        background: colors.gray50,
      }}>
          <div style={sectionHeaderStyle}>Component Toolbox</div>
      </Row>

      <Column gap="0.75rem" align="stretch" style={{ padding: '0.75rem' }}>
        <div style={toolboxItemStyle(COMPONENT_REGISTRY.WelcomeComponent.accentColor)} onDragStart={(event) => onDragStart(event, 'welcomeStep', 'Welcome')} draggable>
          <div style={{ fontWeight: 700 }}>Welcome Node</div>
          <ExecutionBadge mode="FRONT" />
        </div>
        <div style={toolboxItemStyle(COMPONENT_REGISTRY.KYCComponent.accentColor)} onDragStart={(event) => onDragStart(event, 'kycStep', 'KYC')} draggable>
          <div style={{ fontWeight: 700 }}>KYC Node</div>
          <ExecutionBadge mode="FRONT" />
        </div>
        <div style={toolboxItemStyle(COMPONENT_REGISTRY.VideoComponent.accentColor)} onDragStart={(event) => onDragStart(event, 'videoStep', 'Video')} draggable>
          <div style={{ fontWeight: 700 }}>Video Node</div>
          <ExecutionBadge mode="FRONT" />
        </div>
        <div style={toolboxItemStyle(COMPONENT_REGISTRY.DoneComponent.accentColor)} onDragStart={(event) => onDragStart(event, 'doneStep', 'Done')} draggable>
          <div style={{ fontWeight: 700 }}>Done Node</div>
          <ExecutionBadge mode="FRONT" />
        </div>
      </Column>
    </Column>
  );
}
