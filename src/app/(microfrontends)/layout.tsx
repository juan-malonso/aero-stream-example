import type { ReactNode } from 'react';

import { SecurityProvider } from '@/libs/security';
import { AppRouteFrame } from '@/modules/home/app';

export default async function MicrofrontendsLayout({ children }: { children: ReactNode }) {
  return (
    <SecurityProvider>
      <AppRouteFrame>{children}</AppRouteFrame>
    </SecurityProvider>
  );
}
