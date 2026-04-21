import { type CSSProperties } from 'react';
import { badgeStyle } from '@/styles/theme';

export function ExecutionBadge({ mode, style }: { mode: string; style?: CSSProperties }) {
  return (
    <span style={{ ...badgeStyle(mode), ...style }}>
      {mode}
    </span>
  );
}
