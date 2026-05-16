import { StepCard } from '../../live/StepCard';

import { type AeroStreamComponent } from 'aero-stream-pilot';
import React, { useEffect, useState } from 'react';
import { Column, Input, Label, Button } from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { LiveStepDefinition } from '../../types';

const FormField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
  <Column gap="0.5rem" align="stretch">
    <Label style={{ color: colors.gray700, fontSize: '1.125rem', textTransform: 'none', letterSpacing: 'normal' }}>
      {label}
    </Label>
    <Input
      name={name}
      {...props}
      style={{ padding: '0.5rem', fontSize: '1rem' }}
    />
  </Column>
);

export const KYCComponent: AeroStreamComponent<React.ReactNode> = ({
  data,
  submit,
  reject,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(name.length > 2 && email.length > 2 && phone.length > 2);
  }, [name, email, phone]);

  const config = data as {
    title?: string;
    description?: string;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid) {
      setIsLoading(true);
      submit({ name, email, phone });
    }
  };

  const handleReject = () => {
    reject({});
  };

  return (
    <StepCard title={config.title} description={config.description} onReject={handleReject}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '24rem', marginBottom: '50px' }}>
        <Column gap="1.5rem" align="stretch">
          <FormField label="Full Name" name="name" placeholder="Enter your full name" value={name} onChange={(e) => { setName(e.target.value); }} required disabled={isLoading} />
          <FormField label="Email" name="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => { setEmail(e.target.value); }} required disabled={isLoading} />
          <FormField label="Phone" name="phone" type="tel" placeholder="Enter your phone number" value={phone} onChange={(e) => { setPhone(e.target.value); }} required disabled={isLoading} />
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            variant="primary"
            style={{ width: '100%', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </Column>
      </form>
    </StepCard>
  );
};

export const kycLiveStep: LiveStepDefinition = {
  executionType: 'KYCComponent',
  render: (props) => <KYCComponent {...props} />,
};
