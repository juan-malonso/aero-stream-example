import React from 'react';
import { colors, radii, shadows } from '@/styles/tokens';

export function Card({ children, style, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        boxShadow: shadows.md,
        border: `1px solid ${colors.gray200}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
