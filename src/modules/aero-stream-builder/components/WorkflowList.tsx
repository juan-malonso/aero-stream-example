'use client';

import React, { useState } from 'react';

import { Button, Column, Row } from '@/libs/ui';
import { useWorkflowMetadata } from '@/modules/aero-stream-builder/lib/workflow/provider/useWorkflow';
import { colors, radii, typography } from '@/styles/tokens';

interface WorkflowListProperties {
  onCreate: () => void;
  onEdit: (workflowId: string) => void;
  onInspect: (workflowId: string) => void;
}

export function WorkflowList({
  onCreate,
  onEdit,
  onInspect,
}: WorkflowListProperties) {
  const {
    activeWorkflowId,
    deleteWorkflow,
    isLoading,
    workflows,
  } = useWorkflowMetadata();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | undefined>(undefined);

  return (
    <Column
      align="stretch"
      gap="0"
      style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radii.lg,
        boxSizing: 'border-box',
        flex: 1,
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <Row
        align="center"
        justify="space-between"
        style={{
          background: colors.gray50,
          borderBottom: `1px solid ${colors.gray200}`,
          padding: '0.875rem 1rem',
        }}
      >
        <div
          style={{
            color: colors.gray800,
            fontSize: typography.sizes.base,
            fontWeight: typography.weights.bold,
          }}
        >
          Flujos
        </div>
        <Button
          onClick={onCreate}
          size="md"
          style={{ fontSize: tableFontSize }}
          type="button"
        >
          Crear flujo
        </Button>
      </Row>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            fontSize: typography.sizes.md,
            tableLayout: 'fixed',
            width: '100%',
          }}
        >
          <thead>
            <tr style={{ background: colors.white }}>
              <th style={{ ...headerCellStyle, width: '40%' }}>Nombre</th>
              <th style={{ ...headerCellStyle, width: '25%' }}>ID</th>
              <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow, index) => {
              const isSelected = activeWorkflowId === workflow.id;
              const isConfirming = confirmDeleteId === workflow.id;
              const isLast = index === workflows.length - 1;

              return (
                <tr
                  key={workflow.id}
                  onClick={() => { onInspect(workflow.id); }}
                  style={{
                    background: isSelected ? colors.blue50 : colors.white,
                    borderBottom: isLast ? `1px solid ${colors.gray200}` : undefined,
                    borderTop: `1px solid ${colors.gray200}`,
                    cursor: 'pointer',
                  }}
                >
                  <td style={bodyCellStyle}>
                    <div
                      style={{
                        color: colors.gray900,
                        fontWeight: typography.weights.semibold,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={workflow.name}
                    >
                      {workflow.name}
                    </div>
                  </td>
                  <td style={bodyCellStyle}>
                    <code
                      style={{
                        color: colors.gray500,
                        display: 'block',
                        fontSize: tableFontSize,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={workflow.id}
                    >
                      {workflow.id}
                    </code>
                  </td>
                  <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                    <Row gap="0.375rem" justify="flex-end" wrap>
                      <Button
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(workflow.id);
                        }}
                        size="md"
                        style={{ fontSize: tableFontSize }}
                        type="button"
                        variant="secondary"
                      >
                        Editar
                      </Button>
                      {isConfirming ? (
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            setConfirmDeleteId(undefined);
                          }}
                          size="md"
                          style={{ fontSize: tableFontSize }}
                          type="button"
                          variant="ghost"
                        >
                          Cancelar
                        </Button>
                      ) : null}
                      <Button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!isConfirming) {
                            setConfirmDeleteId(workflow.id);
                            return;
                          }

                          setConfirmDeleteId(undefined);
                          void deleteWorkflow(workflow.id);
                        }}
                        size="md"
                        type="button"
                        variant={isConfirming ? 'danger' : 'ghost'}
                        style={{
                          color: isConfirming ? colors.white : colors.red600,
                          fontSize: tableFontSize,
                        }}
                      >
                        {isConfirming ? 'Confirmar' : 'Borrar'}
                      </Button>
                    </Row>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {workflows.length === 0 ? (
          <div
            style={{
              color: colors.gray500,
              fontSize: typography.sizes.base,
              padding: '2rem 1rem',
              textAlign: 'center',
            }}
          >
            {isLoading ? 'Cargando flujos...' : 'No hay flujos disponibles.'}
          </div>
        ) : null}
      </div>
    </Column>
  );
}

const tableFontSize = typography.sizes.base;

const headerCellStyle: React.CSSProperties = {
  color: colors.gray500,
  fontSize: tableFontSize,
  fontWeight: typography.weights.bold,
  padding: '0.75rem 1rem',
  textAlign: 'left',
  textTransform: 'uppercase',
};

const bodyCellStyle: React.CSSProperties = {
  fontSize: tableFontSize,
  padding: '0.75rem 1rem',
  verticalAlign: 'middle',
};
