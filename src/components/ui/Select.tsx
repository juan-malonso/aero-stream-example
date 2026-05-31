import type { SelectHTMLAttributes } from 'react';
import React from 'react';

import { colors, radii, spacing, typography } from '@/styles/tokens';

import type { ControlSize } from './Input';

export interface SelectProperties extends SelectHTMLAttributes<HTMLSelectElement> {
  controlSize?: ControlSize;
  invalid?: boolean;
}

const SELECT_HEIGHTS: Record<ControlSize, string> = {
  lg: '40px',
  md: '34px',
  sm: '28px',
  xs: '24px',
};

const SELECT_FONT_SIZES: Record<ControlSize, string> = {
  lg: typography.sizes.base,
  md: typography.sizes.sm,
  sm: typography.sizes.xs,
  xs: typography.sizes.xs,
};

const SELECT_PADDING: Record<ControlSize, string> = {
  lg: `${spacing.md} ${spacing.lg}`,
  md: `${spacing.sm} ${spacing.lg}`,
  sm: `${spacing.xs} ${spacing.sm}`,
  xs: `0 ${spacing.sm}`,
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProperties>(
  (
    {
      children,
      className,
      controlSize = 'md',
      invalid = false,
      style,
      ...properties
    },
    reference,
  ) => (
    <select
      ref={reference}
      className={['nodrag', className].filter(Boolean).join(' ')}
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${invalid ? colors.red500 : colors.gray300}`,
        borderRadius: radii.md,
        boxSizing: 'border-box',
        color: colors.gray700,
        fontFamily: typography.fontFamily,
        fontSize: SELECT_FONT_SIZES[controlSize],
        lineHeight: 1.2,
        minHeight: SELECT_HEIGHTS[controlSize],
        outline: 'none',
        padding: SELECT_PADDING[controlSize],
        width: '100%',
        ...style,
      }}
      {...properties}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
