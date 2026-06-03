import type { LabelHTMLAttributes } from 'react';

import { colors, spacing, typography } from '@/styles/tokens';

export interface LabelProperties extends LabelHTMLAttributes<HTMLLabelElement> {
  color?: string;
}

export function Label({
  children,
  color = colors.gray600,
  style,
  ...properties
}: LabelProperties) {
  return (
    <label
      style={{
        color,
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
        letterSpacing: '0.05em',
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        ...style,
      }}
      {...properties}
    >
      {children}
    </label>
  );
}
