'use client';

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
  type ReactFlowInstance,
  ReactFlowProvider,
} from '@xyflow/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  BUILDER_NODE_TYPES,
  createStepNodeData,
  getBuilderStepByNodeType,
  type StepNodeData,
} from '@/aero-stream-example-library';
import { Button, Column, Input, Row } from '@/components/ui';
import { useImplicitEdges } from '@/contexts/builder/workflow/useImplicitEdges';
import {
  useWorkflowGraph,
  useWorkflowMetadata,
} from '@/contexts/shared/workflow/useWorkflow';
import { resolveWorkflowNodeOverlaps } from '@/lib/builder/workflow/workflowAdapter';
import { generateId } from '@/lib/shared/uuid';
import { edgeFieldStyle, edgeFlowStyle } from '@/styles/theme';
import { colors, radii, typography } from '@/styles/tokens';

import { ComponentToolbox } from './ComponentToolbox';
import { SelfConnectingEdge } from './SelfConnectingEdge';
import { StartNode } from './StartNode';
import { WorkflowList } from './WorkflowList';
import { WorkflowStepPanel } from './WorkflowStepPanel';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  ...BUILDER_NODE_TYPES,
  startNode: StartNode,
};

const edgeTypes = {
  selfEdge: SelfConnectingEdge,
};

function WorkflowCanvas({
  onSelectStep,
  selectedStepId,
}: {
  onSelectStep: (stepId: string | null) => void;
  selectedStepId: string | null;
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges } = useWorkflowGraph();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const decoratedNodes = useMemo(
    () => decorateWorkflowNodes(nodes, edges, selectedStepId),
    [edges, nodes, selectedStepId]
  );

  const onConnect = useCallback(
    (parameters: Connection | Edge) => {
      setEdges((currentEdges) => {
        const isFieldEdge = parameters.sourceHandle?.includes('field-');
        const filtered = isFieldEdge
          ? currentEdges.filter(edge => edge.target !== parameters.target || edge.targetHandle !== parameters.targetHandle)
          : currentEdges.filter(edge => edge.source !== parameters.source || edge.sourceHandle !== parameters.sourceHandle);

        const nextEdge: Connection | Edge = {
          ...parameters,
          animated: true,
          style: {
            stroke: isFieldEdge ? edgeFieldStyle.stroke : edgeFlowStyle.stroke,
            strokeWidth: 2,
          },
        };

        return addEdge(nextEdge, filtered);
      });

      if (parameters.sourceHandle?.includes('field-')) {
        const fieldName = parameters.sourceHandle.replace('l-field-', '').replace('r-field-', '');
        const targetHandle = parameters.targetHandle ?? '';

        setNodes((currentNodes) => {
          return currentNodes.map((node) => {
            if (node.id === parameters.target) {
              const templateValue = `{{steps.${parameters.source}.result.${fieldName}}}`;
              const nodeData = node.data as unknown as StepNodeData;

              if (targetHandle.startsWith('prop-') || targetHandle.startsWith('prop-r-')) {
                const propertyKey = targetHandle.replace('prop-r-', '').replace('prop-', '');
                return {
                  ...node,
                  data: {
                    ...nodeData,
                    props: {
                      ...(nodeData.props ?? {}),
                      [propertyKey]: templateValue,
                    },
                  },
                };
              } else if (targetHandle.startsWith('target-')) {
                const outputId = targetHandle.replace('target-', '');
                const updatedOutputs = (nodeData.outputs ?? []).map((output) => (
                  output.id === outputId ? { ...output, field: templateValue } : output
                ));
                return {
                  ...node,
                  data: { ...nodeData, outputs: updatedOutputs },
                };
              }
            }
            return node;
          });
        });
      }
    },
    [setEdges, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      const droppedLabel = event.dataTransfer.getData('application/reactflow/label');
      const label = droppedLabel === '' ? `${type} node` : droppedLabel;

      if (type === undefined || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const stepDefinition = getBuilderStepByNodeType(type);
      if (!stepDefinition) return;

      const nodeData: StepNodeData = createStepNodeData(stepDefinition, label);

      const newNode: Node = {
        id: generateId(),
        type,
        position,
        data: nodeData as unknown as Record<string, unknown>,
      };

      setNodes((currentNodes) => resolveWorkflowNodeOverlaps(
        currentNodes.concat(newNode),
        { fixedIds: new Set([newNode.id]) },
      ));
    },
    [reactFlowInstance, setNodes]
  );

  useImplicitEdges(nodes, setEdges);

  return (
    <div style={{ flexGrow: 1, height: '100%', position: 'relative' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, node) => {
          const nodeData = node.data as unknown as Partial<StepNodeData>;
          onSelectStep(nodeData.execution ? node.id : null);
        }}
        onPaneClick={() => { onSelectStep(null); }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

function decorateWorkflowNodes(
  nodes: Node[],
  edges: Edge[],
  selectedStepId: string | null,
): Node[] {
  const nameCounts = new Map<string, number>();

  for (const node of nodes) {
    const nodeData = node.data as unknown as Partial<StepNodeData>;
    if (!nodeData.execution) continue;

    const normalizedName = getNodeDisplayName(nodeData).trim().toLowerCase();
    if (!normalizedName) continue;

    nameCounts.set(normalizedName, (nameCounts.get(normalizedName) ?? 0) + 1);
  }

  return nodes.map((node) => {
    const nodeData = node.data as unknown as Partial<StepNodeData>;
    if (!nodeData.execution) return { ...node, selected: false };

    const normalizedName = getNodeDisplayName(nodeData).trim().toLowerCase();
    const isNameDuplicated = normalizedName !== '' && (nameCounts.get(normalizedName) ?? 0) > 1;
    const isOutputDisconnected = hasDisconnectedOutputs(node.id, nodeData, edges);

    return {
      ...node,
      selected: node.id === selectedStepId,
      data: {
        ...nodeData,
        isNameDuplicated,
        isOutputDisconnected,
      } as unknown as Record<string, unknown>,
    };
  });
}

function hasDisconnectedOutputs(
  nodeId: string,
  nodeData: Partial<StepNodeData>,
  edges: Edge[],
): boolean {
  if (nodeData.hideOutputs) return false;

  return (nodeData.outputs ?? []).some(output =>
    !edges.some(edge => edge.source === nodeId && edge.sourceHandle === output.id),
  );
}

function getNodeDisplayName(nodeData: Partial<StepNodeData>): string {
  return nodeData.stepName ?? nodeData.label ?? nodeData.execution?.type ?? '';
}

export const WorkflowBuilder = () => {
  const {
    activeWorkflowId,
    activeWorkflowName,
    createNewWorkflow,
    isSaving,
    saveWorkflow,
    security,
    selectWorkflow,
    setActiveWorkflowName,
    setSecurity,
    workflows,
  } = useWorkflowMetadata();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const handleCreate = useCallback(() => {
    createNewWorkflow();
    setIsCreating(true);
    setIsEditorOpen(true);
  }, [createNewWorkflow]);

  const handleEdit = useCallback((workflowId: string) => {
    setIsCreating(false);
    setIsEditorOpen(true);
    void selectWorkflow(workflowId);
  }, [selectWorkflow]);

  const handleInspect = useCallback((workflowId: string) => {
    void selectWorkflow(workflowId);
  }, [selectWorkflow]);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setSelectedStepId(null);

    if (!activeWorkflowId && workflows[0]?.id) {
      void selectWorkflow(workflows[0].id);
    }
  }, [activeWorkflowId, selectWorkflow, workflows]);

  const handleSave = useCallback(async () => {
    await saveWorkflow();
    setIsCreating(false);
  }, [saveWorkflow]);

  if (isEditorOpen) {
    return (
      <div
        style={{
          background: colors.gray50,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'absolute',
          inset: 0,
          width: '100%',
          zIndex: 5,
        }}
      >
        <WorkflowEditorToolbar
          activeWorkflowName={activeWorkflowName}
          isCreating={isCreating}
          isSaving={isSaving}
          onClose={handleCloseEditor}
          onSave={handleSave}
          security={security}
          setActiveWorkflowName={setActiveWorkflowName}
          setSecurity={setSecurity}
        />
        <div style={editorBodyStyle}>
          <WorkflowStepPanel
            onSelectStep={setSelectedStepId}
            selectedStepId={selectedStepId}
          />
          <Column align="stretch" gap="0" style={graphColumnStyle}>
            <ComponentToolbox orientation="horizontal" />
            <ReactFlowProvider>
              <WorkflowCanvas
                onSelectStep={setSelectedStepId}
                selectedStepId={selectedStepId}
              />
            </ReactFlowProvider>
          </Column>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface-canvas, transparent)',
        boxSizing: 'border-box',
        display: 'flex',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        padding: '0.875rem',
        width: '100%',
      }}
    >
      <WorkflowList
        onCreate={handleCreate}
        onEdit={handleEdit}
        onInspect={handleInspect}
      />
    </div>
  );
};

function WorkflowEditorToolbar({
  activeWorkflowName,
  isCreating,
  isSaving,
  onClose,
  onSave,
  security,
  setActiveWorkflowName,
  setSecurity,
}: {
  activeWorkflowName: string;
  isCreating: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  security: WorkflowSecurity;
  setActiveWorkflowName: (name: string) => void;
  setSecurity: React.Dispatch<React.SetStateAction<WorkflowSecurity>>;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <Column
        align="stretch"
        gap="0.5rem"
        style={{
          background: colors.white,
          borderBottom: `1px solid ${colors.gray200}`,
          padding: '0.5rem 0.875rem',
        }}
      >
        <Row align="center" justify="space-between" gap="1rem">
          <Row align="center" gap="0.625rem" style={{ minWidth: 0 }}>
            <div
              style={{
                color: colors.gray900,
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
                whiteSpace: 'nowrap',
              }}
            >
              {isCreating ? 'Crear flujo' : 'Editar flujo'}
            </div>
            <Row align="center" gap="0.375rem" style={{ minWidth: 0 }}>
              <div style={workflowNameInputWrapStyle}>
                <Input
                  onChange={(event) => { setActiveWorkflowName(event.target.value); }}
                  placeholder="Workflow name"
                  style={workflowNameInputStyle}
                  type="text"
                  value={activeWorkflowName}
                />
                <span aria-hidden="true" style={workflowNameIconStyle}>
                  <PencilIcon />
                </span>
              </div>
              <Button
                aria-label="Workflow settings"
                isActive={isSettingsOpen}
                onClick={() => { setIsSettingsOpen(true); }}
                size="sm"
                style={{
                  borderRadius: radii.full,
                  height: '1.875rem',
                  padding: 0,
                  width: '1.875rem',
                }}
                title="Ajustes del flujo"
                type="button"
                variant="ghost"
              >
                <SettingsIcon />
              </Button>
            </Row>
          </Row>
          <Row gap="0.5rem">
            <Button
              disabled={isSaving || !activeWorkflowName.trim()}
              onClick={() => {
                void onSave();
              }}
              size="sm"
              style={toolbarActionButtonStyle}
              type="button"
            >
              {isSaving ? 'Guardando...' : isCreating ? 'Crear' : 'Guardar'}
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              style={toolbarActionButtonStyle}
              type="button"
              variant="secondary"
            >
              Cerrar
            </Button>
          </Row>
        </Row>
      </Column>

      {isSettingsOpen ? (
        <WorkflowSettingsDrawer
          onClose={() => { setIsSettingsOpen(false); }}
          security={security}
          setSecurity={setSecurity}
        />
      ) : null}
    </>
  );
}

function WorkflowSettingsDrawer({
  onClose,
  security,
  setSecurity,
}: {
  onClose: () => void;
  security: WorkflowSecurity;
  setSecurity: React.Dispatch<React.SetStateAction<WorkflowSecurity>>;
}) {
  const origins = security.allowedOrigins.length > 0
    ? security.allowedOrigins
    : [''];

  const setOrigin = (index: number, value: string) => {
    const nextOrigins = [...origins];
    nextOrigins[index] = value;
    setSecurity(current => ({ ...current, allowedOrigins: nextOrigins }));
  };

  const removeOrigin = (index: number) => {
    const nextOrigins = origins.filter((_, itemIndex) => itemIndex !== index);
    setSecurity(current => ({ ...current, allowedOrigins: nextOrigins }));
  };

  return (
    <div
      onMouseDown={onClose}
      style={settingsOverlayStyle}
    >
      <Column
        align="stretch"
        gap="1rem"
        onMouseDown={(event) => { event.stopPropagation(); }}
        style={settingsDrawerStyle}
      >
        <Row align="center" justify="space-between" gap="0.75rem">
          <div
            style={{
              color: colors.gray900,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            Ajustes
          </div>
          <Button
            onClick={onClose}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cerrar
          </Button>
        </Row>

        <Column align="stretch" gap="0.375rem">
          <div style={toolbarLabelStyle}>Allowed Origins</div>
          <Column gap="0.5rem" align="stretch">
            {origins.map((origin, index) => (
              <Row
                key={index.toString()}
                gap="0.25rem"
                style={{
                  background: colors.gray50,
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: radii.md,
                  padding: '0.25rem',
                }}
              >
                <Input
                  onChange={(event) => { setOrigin(index, event.target.value); }}
                  placeholder="http://localhost:3000"
                  style={{
                    border: 'none',
                    flex: 1,
                    fontSize: typography.sizes.md,
                    minWidth: 0,
                    padding: '0.25rem 0.375rem',
                  }}
                  type="text"
                  value={origin}
                />
                <Button
                  disabled={origins.length === 1 && !origin}
                  onClick={() => { removeOrigin(index); }}
                  size="sm"
                  style={{
                    borderRadius: radii.md,
                    color: colors.red600,
                    padding: '0.25rem 0.5rem',
                  }}
                  type="button"
                  variant="ghost"
                >
                  Borrar
                </Button>
              </Row>
            ))}
            <Button
              onClick={() => {
                setSecurity(current => ({
                  ...current,
                  allowedOrigins: [...origins, ''],
                }));
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              Añadir origin
            </Button>
          </Column>
        </Column>

        <Column align="stretch" gap="0.375rem">
          <div style={toolbarLabelStyle}>Secret</div>
          <Input
            onChange={(event) => {
              setSecurity(current => ({ ...current, secret: event.target.value }));
            }}
            placeholder="my-super-secret-token"
            style={{
              fontSize: typography.sizes.md,
            }}
            type="text"
            value={security.secret}
          />
        </Column>
      </Column>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.42 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.42H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .42-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.42H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.58Z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const settingsOverlayStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.12)',
  inset: 0,
  position: 'absolute',
  zIndex: 12,
};

const settingsDrawerStyle: React.CSSProperties = {
  background: colors.white,
  borderLeft: `1px solid ${colors.gray200}`,
  boxShadow: '-16px 0 40px rgba(15, 23, 42, 0.14)',
  boxSizing: 'border-box',
  height: '100%',
  marginLeft: 'auto',
  maxWidth: 'calc(100% - 2rem)',
  overflow: 'auto',
  padding: '1rem',
  width: '25rem',
};

const editorBodyStyle: React.CSSProperties = {
  display: 'grid',
  flex: 1,
  gridTemplateColumns: 'minmax(360px, 1fr) minmax(0, 2fr)',
  minHeight: 0,
  minWidth: 0,
};

const graphColumnStyle: React.CSSProperties = {
  borderLeft: `2px solid ${colors.gray300}`,
  minHeight: 0,
  minWidth: 0,
};

const workflowNameInputWrapStyle: React.CSSProperties = {
  minWidth: 0,
  position: 'relative',
  width: '28rem',
};

const workflowNameInputStyle: React.CSSProperties = {
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.semibold,
  maxWidth: '100%',
  paddingRight: '2rem',
  width: '100%',
};

const workflowNameIconStyle: React.CSSProperties = {
  alignItems: 'center',
  color: colors.gray400,
  display: 'inline-flex',
  height: '100%',
  pointerEvents: 'none',
  position: 'absolute',
  right: '0.625rem',
  top: 0,
};

const toolbarLabelStyle: React.CSSProperties = {
  color: colors.gray500,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  textTransform: 'uppercase',
};

const toolbarActionButtonStyle: React.CSSProperties = {
  borderRadius: radii.md,
  minHeight: '30px',
  padding: '0 0.75rem',
};

interface WorkflowSecurity {
  allowedOrigins: string[];
  secret: string;
}
