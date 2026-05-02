'use client';

import React from 'react';
import { type AeroStreamAlertScreen } from 'aero-stream-pilot';
import { Button } from '@/components/ui';
import { colors, radii, shadows, typography } from '@/styles/tokens';

export const AlertScreen: AeroStreamAlertScreen<React.ReactNode> = ({
  alertType,
  data,
  submit,
  reject,
}) => {
  if (alertType === 'SESSION_SWITCH') {
    return <SessionSwitchAlert data={data} submit={submit} reject={reject} />;
  }

  return <GenericAlert alertType={alertType} data={data} submit={submit} reject={reject} />;
};

interface AlertProps {
  alertType?: string;
  data: Record<string, unknown>;
  submit: (data?: Record<string, unknown>) => void;
  reject: () => void;
}

function SessionSwitchAlert({ data, submit, reject }: AlertProps) {
  const deviceType = String(data.deviceType ?? '—');
  const brand = data.brand ? String(data.brand) : null;
  const model = data.model ? String(data.model) : null;
  const osName = data.osName ? String(data.osName) : null;
  const browserName = data.browserName ? String(data.browserName) : null;
  const connectionId = String(data.connectionId ?? '');

  const deviceLabel = [brand, model].filter(Boolean).join(' ') || deviceType;
  const platformLabel = [osName, browserName].filter(Boolean).join(' / ');

  return (
    <Overlay>
      <div style={{
        background: colors.white,
        borderRadius: radii.xl,
        boxShadow: shadows.lg,
        padding: '2rem',
        width: '100%',
        maxWidth: '22rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.gray900 }}>
            Solicitud de cambio de dispositivo
          </h2>
          <p style={{ margin: 0, fontSize: typography.sizes.sm, color: colors.gray500 }}>
            Un nuevo dispositivo quiere tomar el control de esta sesión.
          </p>
        </div>

        <div style={{
          background: colors.gray50,
          borderRadius: radii.lg,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          <DeviceRow label="Dispositivo" value={deviceLabel} />
          {platformLabel && <DeviceRow label="Plataforma" value={platformLabel} />}
          <DeviceRow label="ID" value={connectionId.slice(0, 8) + '…'} mono />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Button onClick={() => submit({ connectionId })} style={{ width: '100%' }}>
            Autorizar
          </Button>
          <button
            onClick={reject}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              border: `1px solid ${colors.gray200}`,
              borderRadius: radii.md,
              background: 'transparent',
              color: colors.gray600,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.medium,
              cursor: 'pointer',
            }}
          >
            Rechazar
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function GenericAlert({ alertType, data, submit, reject }: AlertProps) {
  return (
    <Overlay>
      <div style={{
        background: colors.white,
        borderRadius: radii.xl,
        boxShadow: shadows.lg,
        padding: '2rem',
        width: '100%',
        maxWidth: '22rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <h2 style={{ margin: 0, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.gray900 }}>
          {alertType}
        </h2>
        <pre style={{
          margin: 0,
          fontSize: typography.sizes.xs,
          color: colors.gray600,
          background: colors.gray50,
          borderRadius: radii.md,
          padding: '0.75rem',
          overflow: 'auto',
          maxHeight: '200px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={() => submit()} style={{ flex: 1 }}>Aceptar</Button>
          <button
            onClick={reject}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              border: `1px solid ${colors.gray200}`,
              borderRadius: radii.md,
              background: 'transparent',
              color: colors.gray600,
              fontSize: typography.sizes.sm,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function DeviceRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
      <span style={{ fontSize: typography.sizes.xs, color: colors.gray400, fontWeight: typography.weights.semibold, textTransform: 'uppercase' as const, letterSpacing: '0.05em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: typography.sizes.sm, color: colors.gray700, fontFamily: mono ? 'monospace' : undefined, textAlign: 'right' as const, wordBreak: 'break-all' as const }}>
        {value}
      </span>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      zIndex: 100,
    }}>
      {children}
    </div>
  );
}
