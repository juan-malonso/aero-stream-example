import { StepCard } from '../StepCard';

import { type AeroStreamComponent } from 'aero-stream-pilot';
import React from 'react';
import { Column, Row, Button } from '@/components/ui';
import { colors } from '@/styles/tokens';

export const DoneComponent: AeroStreamComponent<React.ReactNode> = ({
  data, 
  submit,
  reject,
}) => {
  const config = data as {
    title?: string;
    message?: string;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ status: 'finished' });
  };

  const handleReject = () => {
    reject({});
  };

  return (
    <StepCard title={config.title} message={config.message} onReject={handleReject}>
      <Column onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '24rem', marginBottom: '50px'}} gap="1.5rem" align="stretch">
        <Row justify="center">
          <div style={{ width: '5rem', height: '5rem', backgroundColor: colors.gray100, color: colors.green600, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '2.5rem', height: '2.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </Row>
        <Button 
          type="button"
          onClick={handleSubmit}
          variant="primary"
          style={{ width: '100%', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        >
           Finish
        </Button>
      </Column>
    </StepCard>
  );
}