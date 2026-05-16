import { KYCComponent } from './KYCComponent';
import type { LiveStepDefinition } from '../../types';

export const kycLiveStep: LiveStepDefinition = {
  executionType: 'KYCComponent',
  render: (props) => <KYCComponent {...props} />,
};
