import React from 'react';
import { colors, radii, spacing, typography } from '@/styles/tokens';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ style, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          border: `1px solid ${colors.gray300}`,
          borderRadius: radii.md,
          fontSize: typography.sizes.md,
          color: colors.gray700,
          backgroundColor: colors.white,
          outline: 'none',
          ...style,
        }}
        className={`nodrag ${className || ''}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
