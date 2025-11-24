'use client';

/**
 * Provider SWR global
 * Configure SWR pour toute l'application
 */

import { SWRConfig } from 'swr';
import { localStorageProvider, swrConfig } from '@/lib/swr-config';

export function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        ...swrConfig,
        provider: localStorageProvider,
      }}
    >
      {children}
    </SWRConfig>
  );
}
