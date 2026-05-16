import { WelcomeComponent } from './WelcomeComponent';
import type { LiveStepDefinition } from '../../types';

export const welcomeLiveStep: LiveStepDefinition = {
  executionType: 'WelcomeComponent',
  render: (props) => <WelcomeComponent {...props} />,
};
