import { StepCard } from '../../StepCard';

import { type AeroStreamErrorScreen } from 'aero-stream-pilot';
import React from 'react';
import { Column, Row } from '@/components/ui';
import { colors, typography } from '@/styles/tokens';

export const ErrorScreen: AeroStreamErrorScreen<React.ReactNode> = ({
  data,
}) => {
  return (
    <StepCard title="Session Interrupted">
      <Column style={{ width: '100%', maxWidth: '24rem', marginBottom: '50px' }} gap="1.5rem" align="center">
        <Row justify="center">
          <div style={{
            width: '5rem',
            height: '5rem',
            backgroundColor: colors.red50,
            color: colors.red500,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg
              style={{ width: '2.5rem', height: '2.5rem' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </Row>

        <p style={{
          fontSize: typography.sizes.lg,
          color: colors.gray700,
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {data.message}
        </p>

        <span style={{
          display: 'inline-block',
          fontFamily: 'monospace',
          fontSize: typography.sizes.sm,
          color: colors.red600,
          backgroundColor: colors.red50,
          padding: '0.25rem 0.75rem',
          borderRadius: '0.25rem',
          border: `1px solid ${colors.red200}`,
          letterSpacing: '0.025em',
        }}>
          {data.code}
        </span>
      </Column>
    </StepCard>
  );
};
