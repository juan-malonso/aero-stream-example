import { DoneComponent } from './DoneComponent';
import type { LiveStepDefinition } from '../../types';

export const doneLiveStep: LiveStepDefinition = {
  executionType: 'DoneComponent',
  render: (props) => <DoneComponent {...props} />,
};
