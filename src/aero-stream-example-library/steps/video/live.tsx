import { VideoComponent } from '@/components/steps';
import type { LiveStepDefinition } from '../../types';

export const videoLiveStep: LiveStepDefinition = {
  executionType: 'VideoComponent',
  render: (props) => <VideoComponent {...props} />,
};
