import React from 'react';
import { colors, radii, spacing, typography } from '@/styles/tokens';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ style, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: `${spacing.sm} ${spacing.lg}`,
          border: `1px solid ${colors.gray300}`,
          borderRadius: radii.md,
          fontSize: typography.sizes.sm,
          color: colors.gray900,
          backgroundColor: colors.white,
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...style,
        }}
        className={`nodrag ${className || ''}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
