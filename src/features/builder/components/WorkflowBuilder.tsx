'use client';

import { Sidebar } from './Sidebar';
import { StartNode } from './StartNode';
import { SelfConnectingEdge } from './SelfConnectingEdge';
import { WelcomeNode, KYCNode, VideoNode, DoneNode } from '@/components/steps/nodes';

import { useWorkflowGraph } from '@/hooks/useWorkflow';
import { useImplicitEdges } from '@/hooks/useImplicitEdges';
import { COMPONENT_REGISTRY, NODE_TYPE_TO_EXECUTION } from '@/lib/workflow/componentRegistry';
import { generateId } from '@/lib/uuid';
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
import { type OutputConfig, type StepNodeData } from '@/components/steps/types';

const nodeTypes = {
  welcomeStep: WelcomeNode,
  kycStep: KYCNode,
  videoStep: VideoNode,
  doneStep: DoneNode,
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
        let filtered = eds;

        if (isFieldEdge) {
          filtered = eds.filter(e => e.target !== params.target || e.targetHandle !== params.targetHandle);
        } else {
          filtered = eds.filter(e => e.source !== params.source || e.sourceHandle !== params.sourceHandle);
        }

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

      const executionType = NODE_TYPE_TO_EXECUTION[type] || type;
      const meta = COMPONENT_REGISTRY[executionType];

      const nodeData: StepNodeData = {
        label,
        fields: meta?.fields || [],
        props: meta ? Object.fromEntries(meta.propKeys.map((k) => [k, ''])) : {},
        execution: { mode: 'FRONT', type: executionType },
        hideOutputs: executionType === 'DoneComponent',
        specs: executionType === 'DoneComponent' ? { stopWorkflow: true } : {},
      };

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
    <div style={{ display: 'flex', flexGrow: 1, height: '100%', width: '100%' }}>
      <ReactFlowProvider>
        <Sidebar />
        <WorkflowCanvas />
      </ReactFlowProvider>
    </div>
  );
};
