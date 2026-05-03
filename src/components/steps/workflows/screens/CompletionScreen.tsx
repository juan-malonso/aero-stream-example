'use client';

import React from 'react';
import { colors, radii, shadows, typography } from '@/styles/tokens';

interface CompletionScreenProps {
  ok: boolean;
}

export function CompletionScreen({ ok }: CompletionScreenProps) {
  const accent = ok ? colors.green700 : colors.amber600;
  const bg = ok ? colors.green100 : colors.amber50;
  const title = ok ? 'Proceso completado' : 'Proceso finalizado con error';
  const subtitle = ok
    ? 'La sesión ha concluido correctamente.'
    : 'La sesión terminó de forma inesperada.';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '2rem',
    }}>
      <div style={{
        background: colors.white,
        border: `1px solid ${colors.gray100}`,
        borderTop: `4px solid ${accent}`,
        borderRadius: radii.xl,
        boxShadow: shadows.lg,
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '20rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        textAlign: 'center',
      }}>
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          background: bg,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <span style={{
            fontSize: typography.sizes.base,
            fontWeight: typography.weights.bold,
            color: colors.gray900,
          }}>
            {title}
          </span>
          <span style={{
            fontSize: typography.sizes.sm,
            color: colors.gray500,
            lineHeight: 1.5,
          }}>
            {subtitle}
          </span>
        </div>

        <div style={{
          width: '100%',
          height: '1px',
          background: colors.gray100,
        }} />

        <span style={{
          fontSize: typography.sizes.xs,
          color: colors.gray400,
          fontFamily: 'monospace',
          letterSpacing: '0.03em',
        }}>
          {ok ? 'SESSION COMPLETED' : 'SESSION ENDED'}
        </span>
      </div>
    </div>
  );
}
