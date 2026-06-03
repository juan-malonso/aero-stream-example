import type { CSSProperties, HTMLAttributes } from 'react';
import React from 'react';

import { spacing } from '@/styles/tokens';

export interface RowProperties extends HTMLAttributes<HTMLDivElement> {
  align?: CSSProperties['alignItems'];
  fullWidth?: boolean;
  gap?: string;
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
}

export const Row = React.forwardRef<HTMLDivElement, RowProperties>(
  (
    {
      align = 'center',
      children,
      className,
      fullWidth = false,
      gap = spacing.md,
      justify = 'flex-start',
      style,
      wrap = false,
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
        flexDirection: 'row',
        flexWrap: wrap ? 'wrap' : 'nowrap',
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
Row.displayName = 'Row';
