'use client';

import type { CSSProperties } from 'react';

import { Button } from '@/libs/ui';
import { colors, radii, typography } from '@/styles/tokens';

interface InitializeScreenProperties {
  onAccept: () => void;
}

const INTEGRATOR_NOTICE = 'TERMS AND COMPLETION SCREENS ARE 100% INTEGRATOR RESPONSIBILITY, NOT PILOT.';

export function InitializeScreen({ onAccept }: InitializeScreenProperties) {
  return (
    <div style={screenStyle}>
      <div style={panelStyle}>
        <div style={iconStyle}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={colors.amber300} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div style={copyStyle}>
          <span style={eyebrowStyle}>Terms and conditions</span>
          <h1 style={titleStyle}>Before starting the flow</h1>
          <p style={paragraphStyle}>
            The terms and conditions must be accepted before the flow starts because data capture begins at that moment.
            This terms screen and the completion screen shown after the flow exits are wrapper screens, not flow steps.
          </p>
          <p style={paragraphStyle}>
            By accepting, you agree that video and process data may be recorded during this session. In this demo,
            captured data will be deleted and will not be distributed.
          </p>
          <span style={noticeStyle}>{INTEGRATOR_NOTICE}</span>
        </div>

        <Button onClick={onAccept} size="lg" variant="primary" fullWidth>
          Accept and start
        </Button>
      </div>
    </div>
  );
}

const screenStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  background: colors.gray300,
  height: '100%',
  justifyContent: 'center',
  padding: '2rem',
};

const panelStyle: CSSProperties = {
  alignItems: 'stretch',
  background: '#111827',
  border: `1px solid ${colors.gray700}`,
  borderRadius: radii.xl,
  borderTop: `4px solid ${colors.amber400}`,
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  maxWidth: '30rem',
  maxHeight: 'calc(100% - 2rem)',
  overflowY: 'auto',
  padding: '2rem',
  width: '100%',
};

const iconStyle: CSSProperties = {
  alignItems: 'center',
  alignSelf: 'center',
  background: 'rgba(245, 158, 11, 0.14)',
  border: `1px solid ${colors.amber400}`,
  borderRadius: '50%',
  display: 'flex',
  height: '4rem',
  justifyContent: 'center',
  width: '4rem',
};

const copyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.7rem',
  textAlign: 'center',
};

const eyebrowStyle: CSSProperties = {
  color: colors.amber300,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  color: colors.white,
  fontSize: typography.sizes.xl,
  fontWeight: typography.weights.bold,
  margin: 0,
};

const paragraphStyle: CSSProperties = {
  color: colors.gray300,
  fontSize: typography.sizes.base,
  lineHeight: 1.6,
  margin: 0,
};

const noticeStyle: CSSProperties = {
  color: colors.gray300,
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  lineHeight: 1.45,
  marginTop: '0.25rem',
  textTransform: 'uppercase',
};
