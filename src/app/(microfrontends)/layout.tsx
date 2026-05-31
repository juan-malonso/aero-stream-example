import type { ReactNode } from 'react';

import { requireAccessPage } from '@/lib/auth/access-token';

import { MicrofrontendShell } from './MicrofrontendShell';

export default async function MicrofrontendsLayout({ children }: { children: ReactNode }) {
  await requireAccessPage();

  return <MicrofrontendShell>{children}</MicrofrontendShell>;
}
