'use client';

/**
 * Hook useEleves - SIMPLIFIÉ
 * Fetch natif, pas de wrapper api-client
 */

import useSWR from 'swr';

const API_URL = '/api/eleves';

// ✅ Fetcher simple avec fetch natif
const fetcher = (url) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Erreur réseau');
  return res.json();
});

export function useEleves() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_URL,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,        // ✨ 10s entre requêtes
      keepPreviousData: true,
    }
  );

  /**
   * Ajouter un élève - UI INSTANTANÉE
   */
  const addEleve = async (eleveData) => {
    const tempId = `temp_${Date.now()}`;
    const newEleve = {
      NOM: eleveData.nom || '',
      PRÉNOM: eleveData.prenom || '',
      'DATE NAISS.': eleveData.dateNaissance || '',
      CLASSE: eleveData.classe || '',
      'ID FAMILLE': eleveData.idFamille || '',
      INSCRIPTION: eleveData.inscription || '10000',
      PENSION: eleveData.pension || '0',
      DOSSIER: eleveData.dossier || '0',
      RÉDUCTION: eleveData.reduction || '0',
      'MOTIF RÉDUCTION': eleveData.motifReduction || '',
      'TOTAL DÛ': eleveData.totalDu || '0',
      PAYÉ: eleveData.paye || '0',
      RESTE: eleveData.reste || '0',
      // STATUT: eleveData.statut || 'EN ATTENTE',
      rowIndex: tempId,
      _isOptimistic: true,
    };

    console.log('➕ Adding élève:', newEleve.NOM, newEleve.PRÉNOM);

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return [...existing, newEleve];
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eleveData),
    })
      .then(res => res.json())
      .then(() => {
        console.log('✅ Élève ajouté côté serveur');
        // Refresh après 300ms pour laisser Google Sheets écrire
        setTimeout(() => mutate(), 300);
      })
      .catch(error => {
        console.error('❌ Erreur ajout:', error);
        // Rollback: retirer l'élève optimiste
        mutate(
          (current) => {
            const existing = Array.isArray(current) ? current : [];
            return existing.filter(e => e.rowIndex !== tempId);
          },
          false
        );
      });

    return { success: true };
  };

  /**
   * Mettre à jour un élève - UI INSTANTANÉE
   */
  // Hook useEleves - Partie updateEleve CORRIGÉE

  const updateEleve = async (rowIndex, eleveData) => {
    console.log('✏️ Updating élève:', rowIndex, eleveData);

    // Sauvegarder pour rollback
    const previousData = data;

    // ✨ UI INSTANTANÉE - Spread direct des données
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return existing.map((eleve) =>
          eleve.rowIndex === rowIndex
            ? {
              ...eleve,
              ...eleveData, // ✅ Spread direct (clés Excel correctes)
              _isOptimistic: true,
            }
            : eleve
        );
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex, ...eleveData }),
      });

      if (!res.ok) throw new Error('Erreur serveur');

      const result = await res.json();
      console.log('✅ Élève mis à jour côté serveur');

      // Refresh après 300ms
      setTimeout(() => mutate(), 300);

      return { success: true, ...result };
    } catch (error) {
      console.error('❌ Erreur update:', error);
      // Rollback en cas d'erreur
      mutate(previousData, false);
      throw error;
    }
  };
  /**
   * Supprimer un élève - UI INSTANTANÉE
   */
  const deleteEleve = async (rowIndex) => {
    console.log('🗑️ Deleting élève:', rowIndex);

    const previousData = data;

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return existing.filter((eleve) => eleve.rowIndex !== rowIndex);
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(`${API_URL}?rowIndex=${rowIndex}`, {
      method: 'DELETE',
    })
      .then(() => {
        console.log('✅ Élève supprimé côté serveur');
      })
      .catch(error => {
        console.error('❌ Erreur delete:', error);
        // Rollback
        mutate(previousData, false);
      });

    return { success: true };
  };

  const refresh = () => {
    console.log('🔄 Manual refresh');
    return mutate();
  };

  return {
    eleves: Array.isArray(data) ? data : [],
    isLoading,
    isValidating,
    error,
    addEleve,
    updateEleve,
    deleteEleve,
    refresh,
    mutate,
  };
}