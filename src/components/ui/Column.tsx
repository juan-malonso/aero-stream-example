import React, { CSSProperties } from 'react';
import { spacing } from '@/styles/tokens';

export interface ColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  gap?: string;
}

export const Column = React.forwardRef<HTMLDivElement, ColumnProps>(
  ({ align = 'flex-start', justify = 'flex-start', gap = spacing.md, style, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: align,
          justifyContent: justify,
          gap: gap,
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
Column.displayName = 'Column';
