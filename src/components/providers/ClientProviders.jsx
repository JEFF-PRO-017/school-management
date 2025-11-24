'use client';

/**
 * Providers côté client
 * Wrap l'application avec SWR et autres providers
 */

import { SWRProvider } from '@/components/providers/SWRProvider';
import { OfflineBanner } from '@/components/ui/SyncStatus';
import { DeviceSetup } from '@/components/ui/DeviceSetup';

export function ClientProviders({ children }) {
  return (
    <SWRProvider>
      <DeviceSetup />
      <OfflineBanner />
      {children}
    </SWRProvider>
  );
}
