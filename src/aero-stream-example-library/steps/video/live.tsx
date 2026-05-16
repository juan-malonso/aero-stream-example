import { VideoComponent } from './VideoComponent';
import type { LiveStepDefinition } from '../../types';

export const videoLiveStep: LiveStepDefinition = {
  executionType: 'VideoComponent',
  render: (props) => <VideoComponent {...props} />,
};
