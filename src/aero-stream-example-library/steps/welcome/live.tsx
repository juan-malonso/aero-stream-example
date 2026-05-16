import { WelcomeComponent } from '@/components/steps';
import type { LiveStepDefinition } from '../../types';

export const welcomeLiveStep: LiveStepDefinition = {
  executionType: 'WelcomeComponent',
  render: (props) => <WelcomeComponent {...props} />,
};
