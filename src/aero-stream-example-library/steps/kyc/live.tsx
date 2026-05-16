import { KYCComponent } from '@/components/steps';
import type { LiveStepDefinition } from '../../types';

export const kycLiveStep: LiveStepDefinition = {
  executionType: 'KYCComponent',
  render: (props) => <KYCComponent {...props} />,
};
