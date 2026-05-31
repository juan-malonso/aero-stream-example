import type { CSSProperties, InputHTMLAttributes } from 'react';
import React from 'react';

import { colors, radii, spacing, typography } from '@/styles/tokens';

export type ControlSize = 'lg' | 'md' | 'sm' | 'xs';

export interface InputProperties extends InputHTMLAttributes<HTMLInputElement> {
  controlSize?: ControlSize;
  invalid?: boolean;
}

const CONTROL_SIZE_STYLES: Record<ControlSize, CSSProperties> = {
  lg: {
    fontSize: typography.sizes.base,
    minHeight: '40px',
    padding: `${spacing.md} ${spacing.lg}`,
  },
  md: {
    fontSize: typography.sizes.sm,
    minHeight: '34px',
    padding: `${spacing.sm} ${spacing.lg}`,
  },
  sm: {
    fontSize: typography.sizes.xs,
    minHeight: '28px',
    padding: `${spacing.xs} ${spacing.sm}`,
  },
  xs: {
    fontSize: typography.sizes.xs,
    minHeight: '24px',
    padding: `0 ${spacing.sm}`,
  },
};

export const Input = React.forwardRef<HTMLInputElement, InputProperties>(
  (
    {
      className,
      controlSize = 'md',
      invalid = false,
      style,
      ...properties
    },
    reference,
  ) => (
    <input
      ref={reference}
      className={['nodrag', className].filter(Boolean).join(' ')}
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${invalid ? colors.red500 : colors.gray300}`,
        borderRadius: radii.md,
        boxSizing: 'border-box',
        color: colors.gray900,
        fontFamily: typography.fontFamily,
        lineHeight: 1.2,
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        width: '100%',
        ...CONTROL_SIZE_STYLES[controlSize],
        ...style,
      }}
      {...properties}
    />
  ),
);
Input.displayName = 'Input';
