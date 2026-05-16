import { DoneNode } from './steps/done/node';
import { KYCNode } from './steps/kyc/node';
import { VideoNode } from './steps/video/node';
import { WelcomeNode } from './steps/welcome/node';

export const BUILDER_NODE_TYPES = {
  welcomeStep: WelcomeNode,
  kycStep: KYCNode,
  videoStep: VideoNode,
  doneStep: DoneNode,
};
