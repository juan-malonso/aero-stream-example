import { colors } from '@/styles/tokens';

export interface ComponentMeta {
  fields: string[];
  propKeys: string[];
  accentColor: string;
}

export const COMPONENT_REGISTRY: Record<string, ComponentMeta> = {
  KYCComponent: {
    fields: ['name', 'email', 'phone'],
    propKeys: ['title', 'description'],
    accentColor: colors.emerald500,
  },
  WelcomeComponent: {
    fields: ['status'],
    propKeys: ['title', 'description'],
    accentColor: colors.blue500,
  },
  VideoComponent: {
    fields: ['status'],
    propKeys: ['title', 'subtitle'],
    accentColor: colors.cyan500,
  },
  DoneComponent: {
    fields: ['status'],
    propKeys: ['title', 'message'],
    accentColor: colors.amber500,
  },
};

export const EXECUTION_TYPE_TO_NODE: Record<string, string> = {
  KYCComponent: 'kycStep',
  WelcomeComponent: 'welcomeStep',
  VideoComponent: 'videoStep',
  DoneComponent: 'doneStep',
};

export const NODE_TYPE_TO_EXECUTION: Record<string, string> = Object.fromEntries(
  Object.entries(EXECUTION_TYPE_TO_NODE).map(([k, v]) => [v, k])
);
