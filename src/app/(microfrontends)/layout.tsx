import type { ReactNode } from 'react';

import { MicrofrontendShell } from './MicrofrontendShell';

export default function MicrofrontendsLayout({ children }: { children: ReactNode }) {
  return <MicrofrontendShell>{children}</MicrofrontendShell>;
}
