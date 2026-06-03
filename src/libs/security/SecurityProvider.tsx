import type { ReactElement, ReactNode } from 'react';

import { requireAccessPage } from './access-token';

export async function SecurityProvider({ children }: { children: ReactNode }): Promise<ReactElement> {
  await requireAccessPage();

  return <>{children}</>;
}
