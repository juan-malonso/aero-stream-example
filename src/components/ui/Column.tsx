import type { CSSProperties, HTMLAttributes } from 'react';
import React from 'react';

import { spacing } from '@/styles/tokens';

export interface ColumnProperties extends HTMLAttributes<HTMLDivElement> {
  align?: CSSProperties['alignItems'];
  fullWidth?: boolean;
  gap?: string;
  justify?: CSSProperties['justifyContent'];
}

export const Column = React.forwardRef<HTMLDivElement, ColumnProperties>(
  (
    {
      align = 'flex-start',
      children,
      className,
      fullWidth = false,
      gap = spacing.md,
      justify = 'flex-start',
      style,
      ...properties
    },
    reference,
  ) => (
    <div
      ref={reference}
      className={className}
      style={{
        alignItems: align,
        display: 'flex',
        flexDirection: 'column',
        gap,
        justifyContent: justify,
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
      {...properties}
    >
      {children}
    </div>
  ),
);
Column.displayName = 'Column';
