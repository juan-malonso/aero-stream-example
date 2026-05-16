'use client';

import { Sidebar } from './Sidebar';
import { StartNode } from './StartNode';
import { SelfConnectingEdge } from './SelfConnectingEdge';

import { BUILDER_NODE_TYPES, createStepNodeData, getBuilderStepByNodeType } from '@/aero-stream-example-library';
import { useWorkflowGraph } from '@/contexts/shared/workflow/useWorkflow';
import { useImplicitEdges } from '@/contexts/builder/workflow/useImplicitEdges';
import { generateId } from '@/lib/shared/uuid';
import { edgeFlowStyle, edgeFieldStyle } from '@/styles/theme';

import '@xyflow/react/dist/style.css';

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  ReactFlow,
  ReactFlowProvider,
  type ReactFlowInstance,
} from '@xyflow/react';
import React, { useCallback, useRef, useState } from 'react';
import { type OutputConfig, type StepNodeData } from '@/aero-stream-example-library';

const nodeTypes = {
  ...BUILDER_NODE_TYPES,
  startNode: StartNode,
};

const edgeTypes = {
  selfEdge: SelfConnectingEdge,
};

function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges } = useWorkflowGraph();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => {
        const isFieldEdge = params.sourceHandle?.includes('field-');
        const filtered = isFieldEdge
          ? eds.filter(e => e.target !== params.target || e.targetHandle !== params.targetHandle)
          : eds.filter(e => e.source !== params.source || e.sourceHandle !== params.sourceHandle);

        return addEdge({
          ...params,
          animated: true,
          style: {
            stroke: isFieldEdge ? edgeFieldStyle.stroke : edgeFlowStyle.stroke,
            strokeWidth: 2
          }
        } as any, filtered);
      });

      if (params.sourceHandle?.includes('field-')) {
        const fieldName = params.sourceHandle.replace('l-field-', '').replace('r-field-', '');
        const targetHandle = params.targetHandle || '';

        setNodes((nds) => {
          return nds.map((node) => {
            if (node.id === params.target) {
              const templateVal = `{{steps.${params.source}.result.${fieldName}}}`;

              if (targetHandle.startsWith('prop-') || targetHandle.startsWith('prop-r-')) {
                const propKey = targetHandle.replace('prop-r-', '').replace('prop-', '');
                return { ...node, data: { ...node.data, props: { ...(node.data.props as Record<string, string>), [propKey]: templateVal } } };
              } else if (targetHandle.startsWith('target-')) {
                const outputId = targetHandle.replace('target-', '');
                const updatedOutputs = ((node.data.outputs as OutputConfig[]) || []).map((out) => out.id === outputId ? { ...out, field: templateVal } : out);
                return { ...node, data: { ...node.data, outputs: updatedOutputs } };
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
      const label = event.dataTransfer.getData('application/reactflow/label') || `${type} node`;

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const stepDefinition = getBuilderStepByNodeType(type);
      if (!stepDefinition) return;

      const nodeData: StepNodeData = createStepNodeData(stepDefinition, label);

      const newNode = {
        id: generateId(),
        type,
        position,
        data: nodeData,
      } as any;

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  useImplicitEdges(nodes, setEdges);

  return (
    <div style={{ flexGrow: 1, height: '100%', position: 'relative' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
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

export const WorkflowBuilder = () => {
  return (
    <div style={{ display: 'flex', flexGrow: 1, height: '100%', width: '100%', background: 'var(--surface-canvas, transparent)' }}>
      <ReactFlowProvider>
        <Sidebar />
        <WorkflowCanvas />
      </ReactFlowProvider>
    </div>
  );
};
