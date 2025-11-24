/**
 * Gestionnaire Offline
 * - Queue des opérations en attente
 * - Synchronisation automatique à la reconnexion
 * - Persistance localStorage
 */

import { getDeviceId, getDeviceName } from './device-id';

const PENDING_OPS_KEY = 'school-app-pending-operations';
const SYNC_STATUS_KEY = 'school-app-sync-status';

// Types d'opérations
export const OP_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Ajouter une opération à la queue
 */
export function addPendingOperation(operation) {
  if (typeof window === 'undefined') return;
  
  const pending = getPendingOperations();
  
  const newOp = {
    id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    synced: false,
    retryCount: 0,
    ...operation,
  };
  
  pending.push(newOp);
  localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(pending));
  
  console.log('[Offline] Operation queued:', newOp.id);
  return newOp;
}

/**
 * Obtenir toutes les opérations en attente
 */
export function getPendingOperations() {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem(PENDING_OPS_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Marquer une opération comme synchronisée
 */
export function markOperationSynced(operationId) {
  if (typeof window === 'undefined') return;
  
  const pending = getPendingOperations();
  const updated = pending.filter(op => op.id !== operationId);
  localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(updated));
  
  console.log('[Offline] Operation synced:', operationId);
}

/**
 * Incrémenter le compteur de retry
 */
export function incrementRetryCount(operationId) {
  if (typeof window === 'undefined') return;
  
  const pending = getPendingOperations();
  const updated = pending.map(op => {
    if (op.id === operationId) {
      return { ...op, retryCount: op.retryCount + 1 };
    }
    return op;
  });
  localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(updated));
}

/**
 * Synchroniser toutes les opérations en attente
 */
export async function syncPendingOperations(apiClient) {
  const pending = getPendingOperations();
  
  if (pending.length === 0) {
    console.log('[Sync] No pending operations');
    return { success: true, synced: 0, failed: 0 };
  }
  
  console.log(`[Sync] Starting sync of ${pending.length} operations...`);
  
  let synced = 0;
  let failed = 0;
  
  // Trier par timestamp (plus ancien d'abord)
  const sorted = [...pending].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  for (const operation of sorted) {
    // Abandonner après 5 tentatives
    if (operation.retryCount >= 5) {
      console.warn('[Sync] Operation abandoned after 5 retries:', operation.id);
      markOperationSynced(operation.id); // Retirer de la queue
      failed++;
      continue;
    }
    
    try {
      await executeOperation(operation, apiClient);
      markOperationSynced(operation.id);
      synced++;
    } catch (error) {
      console.error('[Sync] Operation failed:', operation.id, error);
      incrementRetryCount(operation.id);
      failed++;
    }
  }
  
  console.log(`[Sync] Complete: ${synced} synced, ${failed} failed`);
  
  // Sauvegarder le statut de sync
  setSyncStatus({
    lastSync: new Date().toISOString(),
    synced,
    failed,
    pending: getPendingOperations().length,
  });
  
  return { success: failed === 0, synced, failed };
}

/**
 * Exécuter une opération
 */
async function executeOperation(operation, apiClient) {
  const { type, entity, data, rowIndex } = operation;
  
  switch (type) {
    case OP_TYPES.CREATE:
      return await apiClient.post(`/api/${entity}`, data);
      
    case OP_TYPES.UPDATE:
      return await apiClient.put(`/api/${entity}`, { ...data, rowIndex });
      
    case OP_TYPES.DELETE:
      return await apiClient.delete(`/api/${entity}?rowIndex=${rowIndex}`);
      
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

/**
 * Obtenir le statut de synchronisation
 */
export function getSyncStatus() {
  if (typeof window === 'undefined') return null;
  
  try {
    return JSON.parse(localStorage.getItem(SYNC_STATUS_KEY) || 'null');
  } catch {
    return null;
  }
}

/**
 * Définir le statut de synchronisation
 */
export function setSyncStatus(status) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
}

/**
 * Vérifier s'il y a des opérations en attente
 */
export function hasPendingOperations() {
  return getPendingOperations().length > 0;
}

/**
 * Obtenir le nombre d'opérations en attente
 */
export function getPendingCount() {
  return getPendingOperations().length;
}
