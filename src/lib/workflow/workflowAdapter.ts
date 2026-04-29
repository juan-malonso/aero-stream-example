import { type TowerWorkflow, type WorkflowConfig, type WorkflowStep, type WorkflowTransition } from './workflow';
import { COMPONENT_REGISTRY, EXECUTION_TYPE_TO_NODE, NODE_TYPE_TO_EXECUTION } from './componentRegistry';
import { type OutputConfig, type StepNodeData } from '@/components/steps/types';

import { type Edge, type Node } from '@xyflow/react';
import { colors } from '@/styles/tokens';

const NODE_GAP_X = 400;
const START_OFFSET_X = 100;
const STEP_OFFSET_X = 250;
const ROW_Y = 200;
const NODE_GAP_Y = 400;

export function parseTowerToReactFlow(towerWorkflow: TowerWorkflow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const colCounts: Record<number, number> = {};
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const visited = new Set<string>();

  const placeNode = (id: string, col: number) => {
    if (visited.has(id)) return;
    visited.add(id);

    colCounts[col] = (colCounts[col] || 0);
    const x = id === 'start_node' ? START_OFFSET_X : STEP_OFFSET_X + (col - 1) * NODE_GAP_X;
    const y = ROW_Y + colCounts[col] * NODE_GAP_Y;
    nodePositions[id] = { x, y };
    colCounts[col]++;

    if (id === 'start_node' && towerWorkflow.start) {
      placeNode(towerWorkflow.start, col + 1);
    } else if (id !== 'start_node' && towerWorkflow.steps[id]) {
      towerWorkflow.steps[id].transitions.forEach((t) => {
        placeNode(t.next, col + 1);
      });
    }
  };

  placeNode('start_node', 0);

  // Unlinked nodes
  let maxCol = Math.max(0, ...Object.keys(colCounts).map(Number));
  for (const stepId of Object.keys(towerWorkflow.steps)) {
    if (!visited.has(stepId)) {
      placeNode(stepId, maxCol + 1);
    }
  }

  nodes.push({
    id: 'start_node',
    type: 'startNode',
    position: nodePositions['start_node'],
    data: { label: 'Start' },
  });

  if (towerWorkflow.start) {
    edges.push({
      id: `e-start_node-${towerWorkflow.start}`,
      source: 'start_node',
      sourceHandle: 'start',
      target: towerWorkflow.start,
      targetHandle: 'flow-in',
      animated: true,
      style: { stroke: colors.green500, strokeWidth: 2 },
      zIndex: 100
    });
  }

  Object.entries(towerWorkflow.steps).forEach(([stepId, step]) => {
    if (!step) return;

    const executionType = step.execution.type;
    const nodeType = EXECUTION_TYPE_TO_NODE[executionType] || 'welcomeStep';
    const meta = COMPONENT_REGISTRY[executionType];

    const currentOutputs: OutputConfig[] = [];
    const nodeData = {
      label: step.name,
      stepName: step.name,
      props: { ...step.props },
      specs: executionType === 'DoneComponent' ? { stopWorkflow: true, ...step.specs } : { ...step.specs },
      execution: { ...step.execution },
      fields: meta?.fields || [],
      hideOutputs: executionType === 'DoneComponent' || step.specs?.stopWorkflow === true,
      outputs: currentOutputs,
    };

    nodes.push({
      id: stepId,
      type: nodeType,
      position: nodePositions[stepId] || { x: 0, y: 0 },
      data: nodeData,
    });

    step.transitions.forEach((transition, tIndex) => {
      let sourceHandle = 'default';

      if (typeof transition.condition === 'object' && transition.condition !== null) {
        const opKeys = Object.keys(transition.condition);
        if (opKeys.length > 0) {
          const operator = opKeys[0];
          const args = (transition.condition as unknown as Record<string, unknown>)[operator];
          
          if (Array.isArray(args) && args.length === 2 && args[0] && (args[0] as Record<string, unknown>).var !== undefined) {
            let field = (args[0] as Record<string, string>).var;
            if (typeof field === 'string' && !field.startsWith('{{')) {
              field = `{{${field}}}`;
            }
            const value = args[1];
            const opRevMap: Record<string, string> = { '==': 'eq', '!=': 'neq', '>': 'gt', '<': 'lt' };
            const internalOp = opRevMap[operator] || 'eq';
            
            const outId = `out_${stepId}_${tIndex}`;
            currentOutputs.push({
              id: outId,
              field,
              operator: internalOp,
              value: String(value)
            });
            sourceHandle = outId;
          }
        }
      }

      edges.push({
        id: `e-${stepId}-${transition.next}-${tIndex}`,
        source: stepId,
        sourceHandle,
        target: transition.next,
        targetHandle: 'flow-in',
        animated: true,
        style: { stroke: colors.green500, strokeWidth: 2 },
        zIndex: 100
      });
    });
  });

  return { nodes, edges };
}

export function parseReactFlowToTower(nodes: Node[], edges: Edge[], name: string, config?: WorkflowConfig): TowerWorkflow {
  const steps: Record<string, WorkflowStep> = {};

  const startEdge = edges.find((e) => e.source === 'start_node');
  const startStepId = startEdge?.target || '';

  const opMap: Record<string, string> = { eq: '==', neq: '!=', gt: '>', lt: '<' };

  nodes.forEach((node) => {
    if (node.type === 'startNode') return;

    const nodeData = node.data as unknown as StepNodeData;
    const outEdges = edges.filter((e) => e.source === node.id);
    const executionType = NODE_TYPE_TO_EXECUTION[node.type || ''] || node.type || '';

    const sortedTransitions: WorkflowTransition[] = [];

    (nodeData.outputs || []).forEach((output) => {
      const edge = outEdges.find((e) => e.sourceHandle === output.id);
      if (edge) {
        const sym = opMap[output.operator] || '==';
        let varField = output.field || '';
        if (typeof varField === 'string' && varField !== '' && !varField.startsWith('{{')) {
          varField = `{{${varField}}}`;
        }
        
        sortedTransitions.push({
          condition: {
            [sym]: [{ var: varField }, output.value],
          },
          next: edge.target,
        });
      }
    });

    const defaultEdge = outEdges.find((e) => e.sourceHandle === 'default');
    if (defaultEdge) {
      sortedTransitions.push({
        condition: true,
        next: defaultEdge.target,
      });
    }

    steps[node.id] = {
      execution: nodeData.execution || { mode: 'FRONT', type: executionType },
      name: nodeData.stepName || nodeData.label || '',
      props: nodeData.props || {},
      specs: nodeData.specs || {},
      transitions: sortedTransitions,
    };
  });

  return {
    name,
    version: 1,
    start: startStepId,
    steps,
    globals: {},
    config: config ?? { allowedOrigins: ['http://localhost:3000'], secret: 'my-super-secret-token' },
  };
}