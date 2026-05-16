import { DoneNode } from './steps/done/builder';
import { KYCNode } from './steps/kyc/builder';
import { VideoNode } from './steps/video/builder';
import { WelcomeNode } from './steps/welcome/builder';

export const BUILDER_NODE_TYPES = {
  welcomeStep: WelcomeNode,
  kycStep: KYCNode,
  videoStep: VideoNode,
  doneStep: DoneNode,
};
