import React from 'react';
import { colors, radii, spacing, typography } from '@/styles/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isActive?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isActive, className, style, children, ...props }, ref) => {

    let bgColor, color, borderColor;

    if (props.disabled) {
      bgColor = variant === 'ghost' ? 'transparent' : colors.gray400;
      color = colors.gray100;
      borderColor = variant === 'secondary' ? colors.gray400 : 'transparent';
    } else {
      switch (variant) {
        case 'primary':
          bgColor = isActive ? 'var(--surface-primary600, var(--color-blue600))' : 'var(--surface-primary500, var(--color-blue500))';
          color = colors.white;
          borderColor = 'transparent';
          break;
        case 'secondary':
          bgColor = isActive ? colors.gray200 : colors.white;
          color = colors.gray700;
          borderColor = colors.gray300;
          break;
        case 'danger':
          bgColor = isActive ? colors.red600 : colors.red500;
          color = colors.white;
          borderColor = 'transparent';
          break;
        case 'ghost':
          bgColor = isActive ? colors.gray100 : 'transparent';
          color = colors.gray600;
          borderColor = 'transparent';
          break;
      }
    }

    let padding, fontSize;
    switch (size) {
      case 'sm':
        padding = `${spacing.xs} ${spacing.sm}`;
        fontSize = typography.sizes.xs;
        break;
      case 'md':
        padding = `${spacing.sm} ${spacing.lg}`;
        fontSize = typography.sizes.sm;
        break;
      case 'lg':
        padding = `${spacing.md} ${spacing['2xl']}`;
        fontSize = typography.sizes.base;
        break;
    }

    return (
      <button
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          color,
          border: `1px solid ${borderColor}`,
          padding,
          fontSize,
          fontWeight: typography.weights.semibold,
          borderRadius: radii.md,
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          ...style,
        }}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
