'use client';

/**
 * Hook pour gérer le statut de connexion
 * - Détection online/offline
 * - Déclenchement sync à la reconnexion
 */

import { useState, useEffect, useCallback } from 'react';
import { syncPendingOperations, getPendingCount, deletePendingOperations } from './offline-manager';
import { apiClient } from './api-client';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Synchroniser les opérations en attente
  const sync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncPendingOperations(apiClient);
      setLastSyncResult(result);
      setPendingCount(getPendingCount());
      return result;
    } catch (error) {
      console.error('[Sync] Error:', error);
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const clean = () => {
    deletePendingOperations();
    setPendingCount(0);
    setLastSyncResult(null);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // État initial
    setIsOnline(navigator.onLine);
    setPendingCount(getPendingCount());

    // Handlers
    const handleOnline = () => {
      console.log('[Network] Online');
      setIsOnline(true);
      // Synchroniser automatiquement à la reconnexion
      setTimeout(sync, 10000);
    };

    const handleOffline = () => {
      console.log('[Network] Offline');
      setIsOnline(false);
    };

    // Écouter les événements
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mettre à jour le compteur périodiquement
    const interval = setInterval(() => {
      setPendingCount(getPendingCount());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [sync, clean]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncResult,
    sync,
    clean,
  };
}
