import type { CSSProperties, HTMLAttributes } from 'react';

import { colors, radii, shadows, spacing, typography } from '@/styles/tokens';

export type CardVariant = 'elevated' | 'flat' | 'outlined';

export interface CardProperties extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof spacing | 'none';
  variant?: CardVariant;
}

const CARD_VARIANT_STYLES: Record<CardVariant, CSSProperties> = {
  elevated: {
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray200}`,
    boxShadow: shadows.md,
  },
  flat: {
    backgroundColor: colors.gray50,
    border: `1px solid ${colors.gray200}`,
    boxShadow: 'none',
  },
  outlined: {
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray200}`,
    boxShadow: 'none',
  },
};

export function Card({
  children,
  className,
  padding = 'none',
  style,
  variant = 'elevated',
  ...properties
}: CardProperties) {
  return (
    <div
      className={className}
      style={{
        borderRadius: radii.lg,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: typography.fontFamily,
        overflow: 'hidden',
        padding: padding === 'none' ? undefined : spacing[padding],
        ...CARD_VARIANT_STYLES[variant],
        ...style,
      }}
      {...properties}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  style,
  ...properties
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        alignItems: 'center',
        borderBottom: `1px solid ${colors.gray200}`,
        boxSizing: 'border-box',
        display: 'flex',
        gap: spacing.md,
        justifyContent: 'space-between',
        padding: `${spacing.lg} ${spacing.xl}`,
        ...style,
      }}
      {...properties}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  style,
  ...properties
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        gap: spacing.lg,
        padding: spacing.xl,
        ...style,
      }}
      {...properties}
    >
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  style,
  ...properties
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        alignItems: 'center',
        borderTop: `1px solid ${colors.gray200}`,
        boxSizing: 'border-box',
        display: 'flex',
        gap: spacing.md,
        justifyContent: 'flex-end',
        padding: `${spacing.lg} ${spacing.xl}`,
        ...style,
      }}
      {...properties}
    >
      {children}
    </div>
  );
}
