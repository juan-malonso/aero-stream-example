import { StepCard } from '../../live/StepCard';
import { Button, Column } from '@/components/ui';

import { type AeroStreamComponent } from 'aero-stream-pilot';
import React from 'react';
import type { LiveStepDefinition } from '../../types';

export const WelcomeComponent: AeroStreamComponent<React.ReactNode> = ({
  data,
  submit,
  reject,
}) => {
  const config = data as {
    title?: string;
    description?: string;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ status: 'started' });
  };

  const handleReject = () => {
    reject({});
  };

  return (
    <StepCard title={config.title} description={config.description} onReject={handleReject}>
      <Column style={{ width: '100%', maxWidth: '24rem' }} align="stretch">
        <Button
          type="button"
          onClick={handleSubmit}
          variant="primary"
          style={{ width: '100%', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        >
          Continue
        </Button>
      </Column>
    </StepCard>
  );
};

export const welcomeLiveStep: LiveStepDefinition = {
  executionType: 'WelcomeComponent',
  render: (props) => <WelcomeComponent {...props} />,
};
