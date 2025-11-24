'use client';

/**
 * Hook SWR pour la gestion des élèves
 * - Cache automatique
 * - Mutations optimistes
 * - Support offline
 */

import useSWR from 'swr';
import { api, NetworkError } from '@/lib/api-client';
import { addPendingOperation, OP_TYPES } from '@/lib/offline-manager';

const API_URL = '/api/eleves';

// Fetcher avec gestion d'erreur
const fetcher = async (url) => {
  const data = await api.get(url);
  return data;
};

export function useEleves() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_URL,
    fetcher,
    {
      // Utiliser le cache si offline
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Garder les données obsolètes pendant le rechargement
      keepPreviousData: true,
    }
  );

  /**
   * Ajouter un élève
   * - Mise à jour optimiste locale
   * - Sync avec le serveur
   * - Queue offline si pas de connexion
   */
  const addEleve = async (eleveData) => {
    const tempId = `temp_${Date.now()}`;
    const newEleve = {
      ...eleveData,
      rowIndex: tempId,
      _isOptimistic: true,
    };

    try {
      // Mise à jour optimiste
      await mutate(
        (currentData) => [...(currentData || []), newEleve],
        { revalidate: false }
      );

      // Appel API
      const result = await api.post(API_URL, eleveData);

      // Mettre à jour avec les vraies données
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        // Mode offline : ajouter à la queue
        addPendingOperation({
          type: OP_TYPES.CREATE,
          entity: 'eleves',
          data: eleveData,
        });
        return { success: true, offline: true, data: newEleve };
      }

      // Rollback en cas d'erreur
      await mutate();
      throw error;
    }
  };

  /**
   * Mettre à jour un élève
   */
  const updateEleve = async (rowIndex, eleveData) => {
    const previousData = data;

    try {
      // Mise à jour optimiste
      await mutate(
        (currentData) =>
          currentData?.map((eleve) =>
            eleve.rowIndex === rowIndex
              ? { ...eleve, ...eleveData, _isOptimistic: true }
              : eleve
          ),
        { revalidate: false }
      );

      // Appel API
      const result = await api.put(API_URL, { ...eleveData, rowIndex });

      // Recharger les données
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        // Mode offline
        addPendingOperation({
          type: OP_TYPES.UPDATE,
          entity: 'eleves',
          data: eleveData,
          rowIndex,
        });
        return { success: true, offline: true };
      }

      // Rollback
      await mutate(previousData, { revalidate: false });
      throw error;
    }
  };

  /**
   * Supprimer un élève
   */
  const deleteEleve = async (rowIndex) => {
    const previousData = data;

    try {
      // Mise à jour optimiste
      await mutate(
        (currentData) =>
          currentData?.filter((eleve) => eleve.rowIndex !== rowIndex),
        { revalidate: false }
      );

      // Appel API
      await api.delete(`${API_URL}?rowIndex=${rowIndex}`);

      return { success: true };
    } catch (error) {
      if (error instanceof NetworkError) {
        // Mode offline
        addPendingOperation({
          type: OP_TYPES.DELETE,
          entity: 'eleves',
          rowIndex,
        });
        return { success: true, offline: true };
      }

      // Rollback
      await mutate(previousData, { revalidate: false });
      throw error;
    }
  };

  /**
   * Rafraîchir les données
   */
  const refresh = () => mutate();

  return {
    // Données
    eleves: data || [],
    
    // États
    isLoading,
    isValidating,
    error,
    
    // Actions
    addEleve,
    updateEleve,
    deleteEleve,
    refresh,
    
    // Utilitaires
    mutate,
  };
}
