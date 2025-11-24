'use client';

/**
 * Hook SWR pour la gestion des paiements
 * - Cache automatique
 * - Mutations optimistes
 * - Support offline
 */

import useSWR from 'swr';
import { api, NetworkError } from '@/lib/api-client';
import { addPendingOperation, OP_TYPES } from '@/lib/offline-manager';

const API_URL = '/api/paiements';

// Fetcher
const fetcher = async (url) => {
  const data = await api.get(url);
  return data;
};

export function usePaiements() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_URL,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      keepPreviousData: true,
    }
  );

  /**
   * Ajouter un paiement
   */
  const addPaiement = async (paiementData) => {
    const tempId = `temp_${Date.now()}`;
    const newPaiement = {
      ...paiementData,
      rowIndex: tempId,
      'N° TRANS': tempId,
      DATE: new Date().toISOString().split('T')[0],
      _isOptimistic: true,
    };

    try {
      // Mise à jour optimiste
      await mutate(
        (currentData) => [newPaiement, ...(currentData || [])],
        { revalidate: false }
      );

      // Appel API
      const result = await api.post(API_URL, paiementData);

      // Recharger
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.CREATE,
          entity: 'paiements',
          data: paiementData,
        });
        return { success: true, offline: true, data: newPaiement };
      }

      await mutate();
      throw error;
    }
  };

  /**
   * Mettre à jour un paiement
   */
  const updatePaiement = async (rowIndex, paiementData) => {
    const previousData = data;

    try {
      await mutate(
        (currentData) =>
          currentData?.map((p) =>
            p.rowIndex === rowIndex
              ? { ...p, ...paiementData, _isOptimistic: true }
              : p
          ),
        { revalidate: false }
      );

      const result = await api.put(API_URL, { ...paiementData, rowIndex });
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.UPDATE,
          entity: 'paiements',
          data: paiementData,
          rowIndex,
        });
        return { success: true, offline: true };
      }

      await mutate(previousData, { revalidate: false });
      throw error;
    }
  };

  /**
   * Supprimer un paiement
   */
  const deletePaiement = async (rowIndex) => {
    const previousData = data;

    try {
      await mutate(
        (currentData) =>
          currentData?.filter((p) => p.rowIndex !== rowIndex),
        { revalidate: false }
      );

      await api.delete(`${API_URL}?rowIndex=${rowIndex}`);

      return { success: true };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.DELETE,
          entity: 'paiements',
          rowIndex,
        });
        return { success: true, offline: true };
      }

      await mutate(previousData, { revalidate: false });
      throw error;
    }
  };

  /**
   * Rafraîchir
   */
  const refresh = () => mutate();

  // Statistiques calculées
  const stats = {
    total: data?.length || 0,
    totalMontant: data?.reduce((sum, p) => sum + (parseFloat(p['MONTANT PAYÉ']) || 0), 0) || 0,
    parType: data?.reduce((acc, p) => {
      const type = p.TYPE || 'AUTRE';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {},
  };

  return {
    paiements: data || [],
    stats,
    isLoading,
    isValidating,
    error,
    addPaiement,
    updatePaiement,
    deletePaiement,
    refresh,
    mutate,
  };
}
