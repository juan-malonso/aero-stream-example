import React from 'react';
import { BUILDER_STEP_DEFINITIONS } from '@/aero-stream-example-library';
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
    <Column style={{ borderTop: `1px solid ${colors.gray200}`, flex: 1, background: colors.white }} gap="0" align="stretch">
      <Row justify="space-between" align="center" style={{ 
        padding: '1rem 1.25rem', 
        borderBottom: `1px solid ${colors.gray200}`, 
        background: colors.gray50,
      }}>
          <div style={sectionHeaderStyle}>Component Toolbox</div>
      </Row>

      <Column gap="0.75rem" align="stretch" style={{ padding: '0.75rem' }}>
        {BUILDER_STEP_DEFINITIONS.map((step) => (
          <div
            key={step.id}
            style={toolboxItemStyle(step.accentColor)}
            onDragStart={(event) => onDragStart(event, step.nodeType, step.label)}
            draggable
          >
            <div style={{ fontWeight: 700 }}>{step.toolboxLabel}</div>
            <ExecutionBadge mode="FRONT" />
          </div>
        ))}
      </Column>
    </Column>
  );
}
