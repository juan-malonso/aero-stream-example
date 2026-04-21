import React from 'react';
import { colors, spacing, typography } from '@/styles/tokens';

export function Label({ children, color = colors.gray600, style, ...props }: React.HTMLAttributes<HTMLDivElement> & { color?: string }) {
  return (
    <div
      style={{
        color,
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
