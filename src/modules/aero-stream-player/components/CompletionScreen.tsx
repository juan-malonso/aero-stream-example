'use client';

import type { CSSProperties } from 'react';

import { colors, radii, typography } from '@/styles/tokens';

interface CompletionScreenProperties {
  ok: boolean;
}

export function CompletionScreen({ ok }: CompletionScreenProperties) {
  const accent = ok ? colors.green400 : colors.amber400;
  const bg = ok ? 'rgba(34, 197, 94, 0.14)' : 'rgba(245, 158, 11, 0.14)';
  const title = ok ? 'Proceso completado' : 'Proceso finalizado con error';
  const subtitle = ok
    ? 'La sesión ha concluido correctamente.'
    : 'La sesión terminó de forma inesperada.';

  return (
    <div style={screenStyle}>
      <div style={{ ...panelStyle, borderTop: `4px solid ${accent}` }}>
        <div style={{ ...iconStyle, background: bg, border: `1px solid ${accent}` }}>
          {ok ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" />
            </svg>
          )}
        </div>

        <div style={copyStyle}>
          <span style={titleStyle}>{title}</span>
          <span style={subtitleStyle}>{subtitle}</span>
        </div>

        <div style={dividerStyle} />

        <span style={statusStyle}>{ok ? 'SESSION COMPLETED' : 'SESSION ENDED'}</span>
      </div>
    </div>
  );
}

const screenStyle: CSSProperties = {
  alignItems: 'center',
  background: colors.gray300,
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  padding: '2rem',
};

const panelStyle: CSSProperties = {
  alignItems: 'center',
  background: '#111827',
  border: `1px solid ${colors.gray700}`,
  borderRadius: radii.xl,
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.1rem',
  maxWidth: '22rem',
  padding: '2.25rem 2rem',
  textAlign: 'center',
  width: '100%',
};

const iconStyle: CSSProperties = {
  alignItems: 'center',
  borderRadius: '50%',
  display: 'flex',
  flexShrink: 0,
  height: '3.5rem',
  justifyContent: 'center',
  width: '3.5rem',
};

const copyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
};

const titleStyle: CSSProperties = {
  color: colors.white,
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.bold,
};

const subtitleStyle: CSSProperties = {
  color: colors.gray300,
  fontSize: typography.sizes.sm,
  lineHeight: 1.5,
};

const dividerStyle: CSSProperties = {
  background: colors.gray700,
  height: '1px',
  width: '100%',
};

const statusStyle: CSSProperties = {
  color: colors.gray400,
  fontFamily: 'monospace',
  fontSize: typography.sizes.xs,
  letterSpacing: '0.03em',
};
