// ---------------------------------------------------------------------------
// Theme — Semantic style compositions built from design tokens.
// Components import styles from here, never from raw tokens directly.
// ---------------------------------------------------------------------------

import { type CSSProperties } from "react";
import { colors, radii, shadows, typography } from "./tokens";

// ---------------------------------------------------------------------------
// Badge styles
// ---------------------------------------------------------------------------

export const BADGE_PALETTE: Record<string, { bg: string; text: string }> = {
  FRONT: { bg: colors.blue100, text: colors.blue700 },
  BACK: { bg: colors.yellow100, text: colors.yellow700 },
};

export const badgeStyle = (mode: string): CSSProperties => {
  const palette = BADGE_PALETTE[mode] ?? {
    bg: colors.gray100,
    text: colors.gray700,
  };
  return {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: typography.sizes["2xs"],
    fontWeight: typography.weights.bold,
    borderRadius: radii.full,
    background: palette.bg,
    color: palette.text,
    textTransform: "uppercase",
  };
};

// ---------------------------------------------------------------------------
// Card styles
// ---------------------------------------------------------------------------

export const cardStyle: CSSProperties = {
  border: `1px solid ${colors.gray200}`,
  borderRadius: radii.lg,
  background: colors.white,
  fontSize: typography.sizes.md,
  minWidth: "240px",
  display: "flex",
  flexDirection: "column",
  boxShadow: shadows.md,
  fontFamily: typography.fontFamily,
};

export const cardHeaderStyle = (accentColor: string): CSSProperties => ({
  fontWeight: typography.weights.semibold,
  textAlign: "center",
  borderBottom: `3px solid ${accentColor}`,
  borderTopLeftRadius: radii.lg,
  borderTopRightRadius: radii.lg,
  padding: "10px 12px",
  background: colors.gray50,
  color: colors.gray800,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4px",
});

// ---------------------------------------------------------------------------
// Handle styles (graph ports)
// ---------------------------------------------------------------------------

export const handleStyles = {
  flowSource: (size = 10): CSSProperties => ({
    background: colors.stepFlow,
    width: `${size}px`,
    height: `${size}px`,
    border: "none",
  }),
  flowTarget: (size = 10): CSSProperties => ({
    background: colors.white,
    width: `${size}px`,
    height: `${size}px`,
    border: `3px solid ${colors.stepFlow}`,
    boxSizing: "border-box" as const,
  }),
  fieldSource: (size = 10): CSSProperties => ({
    background: colors.fieldData,
    width: `${size}px`,
    height: `${size}px`,
    border: "none",
  }),
  fieldTarget: (size = 10): CSSProperties => ({
    background: colors.white,
    width: `${size}px`,
    height: `${size}px`,
    border: `3px solid ${colors.fieldData}`,
    boxSizing: "border-box" as const,
  }),
};

// ---------------------------------------------------------------------------
// Section label style (used inside StepNode sections)
// ---------------------------------------------------------------------------

export const sectionLabelStyle = (color: string): CSSProperties => ({
  color,
  fontSize: typography.sizes.xs,
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: typography.weights.semibold,
});

// ---------------------------------------------------------------------------
// Input styles
// ---------------------------------------------------------------------------

export const inputBaseStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px",
  border: `1px solid ${colors.gray300}`,
  borderRadius: radii.md,
  outline: "none",
  color: colors.gray700,
  fontFamily: typography.fontFamily,
};

export const inputSmallStyle: CSSProperties = {
  ...inputBaseStyle,
  padding: "4px 6px",
  fontSize: typography.sizes.sm,
};

// ---------------------------------------------------------------------------
// Edge styles (graph connections)
// ---------------------------------------------------------------------------

export const edgeFlowStyle: CSSProperties = {
  stroke: colors.stepFlow,
  strokeWidth: 2,
};

export const edgeFieldStyle: CSSProperties = {
  stroke: colors.orange500,
  strokeWidth: 2,
};

// ---------------------------------------------------------------------------
// Sidebar styles
// ---------------------------------------------------------------------------

export const sidebarContainerStyle: CSSProperties = {
  width: "330px",
  borderRight: `1px solid ${colors.gray200}`,
  display: "grid",
  gridTemplateRows: "1fr 1fr",
  background: colors.gray50,
  height: "100%",
  fontFamily: typography.fontFamily,
};

export const toolboxItemStyle = (accentColor: string): CSSProperties => ({
  padding: "12px 16px",
  border: `1px solid ${colors.gray200}`,
  borderBottom: `3px solid ${accentColor}`,
  borderRadius: radii.lg,
  cursor: "grab",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: colors.white,
  boxShadow: shadows.xs,
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.medium,
  color: colors.gray700,
  transition: "transform 0.1s, box-shadow 0.1s",
});

export const sectionHeaderStyle: CSSProperties = {
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.bold,
  color: "var(--surface-primary500, var(--color-gray500))",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
