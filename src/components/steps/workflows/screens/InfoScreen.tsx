'use client';

import React from 'react';
import { type AeroStreamInfoScreen } from 'aero-stream-pilot';
import { Column } from '@/components/ui';
import { colors, typography } from '@/styles/tokens';
import { StepCard } from '../../StepCard';

export const InfoScreen: AeroStreamInfoScreen<React.ReactNode> = ({ message }) => {
  return (
    <StepCard title="En espera">
      <Column style={{ width: '100%', maxWidth: '24rem', marginBottom: '50px' }} gap="1.5rem" align="center">
        <div style={{
          width: '5rem',
          height: '5rem',
          backgroundColor: colors.blue50,
          color: colors.blue500,
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
            <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p style={{
          fontSize: typography.sizes.lg,
          color: colors.gray700,
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {message}
        </p>
      </Column>
    </StepCard>
  );
};
