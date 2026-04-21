import { useEffect } from 'react';
import { type Edge, type Node } from '@xyflow/react';
import { type OutputConfig } from '@/components/steps/types';
import { edgeFieldStyle } from '@/styles/theme';

const FIELD_REF_PATTERN = /\{\{steps\.([a-zA-Z0-9_-]+)\.result\.([a-zA-Z0-9_]+)\}\}/;

interface ImplicitEdgeParams {
  sourceId: string;
  fieldName: string;
  targetId: string;
  targetHandle: string;
  isSameNode: boolean;
  isSourceLeft: boolean;
}

function buildImplicitEdge({ sourceId, fieldName, targetId, targetHandle, isSameNode, isSourceLeft }: ImplicitEdgeParams): Edge {
  const sourceHandle = isSameNode
    ? `l-field-${fieldName}`
    : (isSourceLeft ? `r-field-${fieldName}` : `l-field-${fieldName}`);

  return {
    id: `implicit-${sourceId}-${fieldName}-${targetId}-${targetHandle}`,
    source: sourceId,
    sourceHandle,
    target: targetId,
    targetHandle,
    animated: true,
    type: isSameNode ? 'selfEdge' : 'default',
    style: edgeFieldStyle,
    zIndex: 100,
  };
}

function resolveTargetHandle(type: 'prop' | 'output', keyOrId: string, isSameNode: boolean, isSourceLeft: boolean): string {
  if (type === 'output') return `target-${keyOrId}`;
  return (isSameNode || isSourceLeft) ? `prop-${keyOrId}` : `prop-r-${keyOrId}`;
}

function extractImplicitEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];

  nodes.forEach((node) => {
    const targetId = node.id;
    const targetPos = node.position;

    const processFieldRef = (val: string, type: 'prop' | 'output', keyOrId: string) => {
      if (typeof val !== 'string') return;
      const match = val.match(FIELD_REF_PATTERN);
      if (!match) return;

      const sourceId = match[1];
      const fieldName = match[2];
      const sourceNode = nodes.find((n) => n.id === sourceId);
      if (!sourceNode) return;

      const isSameNode = sourceId === targetId;
      const isSourceLeft = sourceNode.position.x < targetPos.x;
      const targetHandle = resolveTargetHandle(type, keyOrId, isSameNode, isSourceLeft);

      edges.push(buildImplicitEdge({ sourceId, fieldName, targetId, targetHandle, isSameNode, isSourceLeft }));
    };

    Object.entries(node.data.props || {}).forEach(([k, v]) => processFieldRef(String(v), 'prop', k));
    ((node.data.outputs as OutputConfig[]) || []).forEach((out) => processFieldRef(String(out.field), 'output', out.id));
  });

  return edges;
}

function mergeImplicitEdges(existing: Edge[], implicit: Edge[]): Edge[] | null {
  let changed = false;
  let merged = [...existing];

  implicit.forEach((ie) => {
    const exists = merged.some(
      (e) => e.source === ie.source && e.target === ie.target && e.sourceHandle === ie.sourceHandle && e.targetHandle === ie.targetHandle
    );
    if (!exists) {
      merged = merged.filter((e) => !(e.target === ie.target && e.targetHandle === ie.targetHandle));
      merged.push(ie);
      changed = true;
    }
  });

  return changed ? merged : null;
}

export function useImplicitEdges(nodes: Node[], setEdges: React.Dispatch<React.SetStateAction<Edge[]>>) {
  useEffect(() => {
    const implicit = extractImplicitEdges(nodes);
    if (implicit.length === 0) return;

    setEdges((eds) => mergeImplicitEdges(eds, implicit) ?? eds);
  }, [nodes, setEdges]);
}
