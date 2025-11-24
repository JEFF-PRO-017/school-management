'use client';

/**
 * Hook SWR pour la gestion des familles
 */

import useSWR from 'swr';
import { api, NetworkError } from '@/lib/api-client';
import { addPendingOperation, OP_TYPES } from '@/lib/offline-manager';

const API_URL = '/api/familles';

const fetcher = async (url) => {
  const data = await api.get(url);
  return data;
};

export function useFamilles() {
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
   * Ajouter une famille
   */
  const addFamille = async (familleData) => {
    const tempId = `FAM_${Date.now()}`;
    const newFamille = {
      ...familleData,
      'ID FAMILLE': tempId,
      rowIndex: tempId,
      _isOptimistic: true,
    };

    try {
      await mutate(
        (currentData) => [...(currentData || []), newFamille],
        { revalidate: false }
      );

      const result = await api.post(API_URL, familleData);
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.CREATE,
          entity: 'familles',
          data: familleData,
        });
        return { success: true, offline: true, data: newFamille };
      }

      await mutate();
      throw error;
    }
  };

  /**
   * Mettre à jour une famille
   */
  const updateFamille = async (rowIndex, familleData) => {
    const previousData = data;

    try {
      await mutate(
        (currentData) =>
          currentData?.map((f) =>
            f.rowIndex === rowIndex
              ? { ...f, ...familleData, _isOptimistic: true }
              : f
          ),
        { revalidate: false }
      );

      const result = await api.put(API_URL, { ...familleData, rowIndex });
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.UPDATE,
          entity: 'familles',
          data: familleData,
          rowIndex,
        });
        return { success: true, offline: true };
      }

      await mutate(previousData, { revalidate: false });
      throw error;
    }
  };

  /**
   * Supprimer une famille
   */
  const deleteFamille = async (rowIndex) => {
    const previousData = data;

    try {
      await mutate(
        (currentData) =>
          currentData?.filter((f) => f.rowIndex !== rowIndex),
        { revalidate: false }
      );

      await api.delete(`${API_URL}?rowIndex=${rowIndex}`);

      return { success: true };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.DELETE,
          entity: 'familles',
          rowIndex,
        });
        return { success: true, offline: true };
      }

      await mutate(previousData, { revalidate: false });
      throw error;
    }
  };

  const refresh = () => mutate();

  // Stats
  const stats = {
    total: data?.length || 0,
    actives: data?.filter(f => f.STATUT === 'ACTIF').length || 0,
  };

  return {
    familles: data || [],
    stats,
    isLoading,
    isValidating,
    error,
    addFamille,
    updateFamille,
    deleteFamille,
    refresh,
    mutate,
  };
}
