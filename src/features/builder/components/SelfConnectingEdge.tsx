import { BaseEdge, type EdgeProps } from '@xyflow/react';

export function SelfConnectingEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, style, markerEnd } = props;
  const path = `M ${sourceX} ${sourceY} C ${sourceX - 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`;
  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}
