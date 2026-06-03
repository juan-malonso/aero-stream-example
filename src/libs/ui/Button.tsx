import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import React from 'react';

import { colors, radii, spacing, typography } from '@/styles/tokens';

export type ButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

export interface ButtonProperties extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  iconOnly?: boolean;
  isActive?: boolean;
  leadingIcon?: ReactNode;
  size?: ButtonSize;
  trailingIcon?: ReactNode;
  variant?: ButtonVariant;
}

const BUTTON_SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  lg: {
    fontSize: typography.sizes.base,
    minHeight: '40px',
    padding: `${spacing.md} ${spacing['2xl']}`,
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

function resolveButtonColors({
  disabled,
  isActive,
  variant,
}: {
  disabled?: boolean;
  isActive?: boolean;
  variant: ButtonVariant;
}) {
  if (disabled) {
    return {
      backgroundColor: variant === 'ghost' ? 'transparent' : colors.gray400,
      borderColor: variant === 'secondary' ? colors.gray400 : 'transparent',
      color: colors.gray100,
    };
  }

  switch (variant) {
    case 'danger':
      return {
        backgroundColor: isActive ? colors.red600 : colors.red500,
        borderColor: 'transparent',
        color: colors.white,
      };
    case 'ghost':
      return {
        backgroundColor: isActive ? colors.gray100 : 'transparent',
        borderColor: 'transparent',
        color: colors.gray600,
      };
    case 'secondary':
      return {
        backgroundColor: isActive ? colors.gray200 : colors.white,
        borderColor: colors.gray300,
        color: colors.gray700,
      };
    case 'primary':
    default:
      return {
        backgroundColor: isActive
          ? 'var(--surface-primary600, var(--color-blue600))'
          : 'var(--surface-primary500, var(--color-blue500))',
        borderColor: 'transparent',
        color: colors.white,
      };
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProperties>(
  (
    {
      children,
      className,
      fullWidth = false,
      iconOnly = false,
      isActive,
      leadingIcon,
      size = 'md',
      style,
      trailingIcon,
      variant = 'primary',
      ...properties
    },
    reference,
  ) => {
    const colorStyles = resolveButtonColors({
      disabled: properties.disabled,
      isActive,
      variant,
    });
    const sizeStyles = BUTTON_SIZE_STYLES[size];

    return (
      <button
        ref={reference}
        className={className}
        style={{
          alignItems: 'center',
          backgroundColor: colorStyles.backgroundColor,
          border: `1px solid ${colorStyles.borderColor}`,
          borderRadius: radii.md,
          boxSizing: 'border-box',
          color: colorStyles.color,
          cursor: properties.disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          fontFamily: typography.fontFamily,
          fontWeight: typography.weights.semibold,
          gap: spacing.sm,
          justifyContent: 'center',
          lineHeight: 1.1,
          transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
          width: fullWidth ? '100%' : undefined,
          ...(iconOnly ? {
            aspectRatio: '1 / 1',
            padding: 0,
            width: sizeStyles.minHeight,
          } : sizeStyles),
          ...style,
        }}
        {...properties}
      >
        {leadingIcon}
        {iconOnly ? <span style={visuallyHiddenStyle}>{children}</span> : children}
        {trailingIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';

const visuallyHiddenStyle: CSSProperties = {
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
};
