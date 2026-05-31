import React from 'react';

import { BUILDER_STEP_DEFINITIONS } from '@/aero-stream-example-library';
import { ExecutionBadge } from '@/components/shared/ExecutionBadge';
import { Row } from '@/components/ui';
import { colors } from '@/styles/tokens';

interface ComponentToolboxProperties {
  orientation?: 'horizontal' | 'vertical';
}

export function ComponentToolbox({
  orientation = 'vertical',
}: ComponentToolboxProperties) {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (orientation === 'horizontal') {
    return (
      <Row align="center" gap="0.5rem" style={horizontalContainerStyle}>
        <Row gap="0.5rem" style={horizontalListStyle}>
          {BUILDER_STEP_DEFINITIONS.map((step) => (
            <div
              draggable
              key={step.id}
              onDragStart={(event) => { onDragStart(event, step.nodeType, step.label); }}
              style={horizontalItemStyle(step.accentColor)}
            >
              <span style={itemLabelStyle}>{step.toolboxLabel}</span>
              <ExecutionBadge mode={step.executionMode ?? 'CLIENT'} />
            </div>
          ))}
        </Row>
      </Row>
    );
  }

  return (
    <Row gap="0.5rem" wrap style={{ padding: '0.75rem' }}>
      {BUILDER_STEP_DEFINITIONS.map((step) => (
        <div
          draggable
          key={step.id}
          onDragStart={(event) => { onDragStart(event, step.nodeType, step.label); }}
          style={horizontalItemStyle(step.accentColor)}
        >
          <span style={itemLabelStyle}>{step.toolboxLabel}</span>
          <ExecutionBadge mode={step.executionMode ?? 'CLIENT'} />
        </div>
      ))}
    </Row>
  );
}

const horizontalContainerStyle: React.CSSProperties = {
  background: colors.white,
  borderTop: `1px solid ${colors.gray200}`,
  minHeight: '3.25rem',
  overflow: 'hidden',
  padding: '0.5rem 1rem',
};

const horizontalListStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflowX: 'auto',
  paddingBottom: '0.125rem',
};

const horizontalItemStyle = (accentColor: string): React.CSSProperties => ({
  alignItems: 'center',
  background: colors.white,
  border: `1px solid ${colors.gray200}`,
  borderBottom: `3px solid ${accentColor}`,
  borderRadius: '0.5rem',
  color: colors.gray700,
  cursor: 'grab',
  display: 'inline-flex',
  flexShrink: 0,
  gap: '0.5rem',
  minHeight: '2.125rem',
  padding: '0.375rem 0.625rem',
});

const itemLabelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};
