import React, { CSSProperties } from 'react';
import { spacing } from '@/styles/tokens';

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  gap?: string;
  wrap?: boolean;
}

export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ align = 'center', justify = 'flex-start', gap = spacing.md, wrap = false, style, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap: gap,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          ...style,
        }}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Row.displayName = 'Row';
