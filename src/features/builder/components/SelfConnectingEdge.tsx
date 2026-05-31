import { BaseEdge, type EdgeProps } from '@xyflow/react';

export function SelfConnectingEdge(properties: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, style, markerEnd } = properties;
  const path = `M ${sourceX} ${sourceY} C ${sourceX - 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`;
  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}
