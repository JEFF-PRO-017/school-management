'use client';

/**
 * Hook usePaiements - SIMPLIFIÉ
 */

import useSWR from 'swr';

const API_URL = '/api/paiements';

const fetcher = (url) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Erreur réseau');
  return res.json();
});

export function usePaiements() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_URL,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  );

  /**
   * Ajouter un paiement (individuel ou famille)
   */
  const addPaiement = async (paiementData) => {
    const today = new Date().toLocaleDateString('fr-FR');
    
    // Mode famille: plusieurs paiements
    if (paiementData.mode === 'famille' && paiementData.paiements) {
      const newPaiements = paiementData.paiements.map((p, index) => ({
        'N° TRANS': `temp_${Date.now()}_${index}`,
        DATE: p.date || today,
        'ID ÉLÈVE': p.idEleve,
        'NOM ÉLÈVE': p.nomEleve,
        'ID FAMILLE': p.idFamille,
        TYPE: p.type,
        'MONTANT PAYÉ': p.montantPaye,
        rowIndex: `temp_${Date.now()}_${index}`,
        _isOptimistic: true,
      }));

      console.log('💰 Adding paiements famille:', newPaiements.length);

      // ✨ UI INSTANTANÉE
      mutate(
        (current) => {
          const existing = Array.isArray(current) ? current : [];
          return [...newPaiements, ...existing];
        },
        false
      );

      // 🚀 BACKEND ASYNCHRONE - Envoyer tous les paiements
      Promise.all(
        paiementData.paiements.map(p =>
          fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          })
        )
      )
        .then(() => {
          console.log('✅ Paiements famille enregistrés');
          setTimeout(() => mutate(), 300);
        })
        .catch(error => {
          console.error('❌ Erreur paiements famille:', error);
          mutate();
        });

      return { success: true, count: newPaiements.length };
    }
    
    // Mode individuel
    const newPaiement = {
      'N° TRANS': `temp_${Date.now()}`,
      DATE: paiementData.date || today,
      'ID ÉLÈVE': paiementData.idEleve,
      'NOM ÉLÈVE': paiementData.nomEleve,
      'ID FAMILLE': paiementData.idFamille,
      TYPE: paiementData.type,
      'MONTANT PAYÉ': paiementData.montantPaye,
      rowIndex: `temp_${Date.now()}`,
      _isOptimistic: true,
    };

    console.log('💰 Adding paiement:', newPaiement['NOM ÉLÈVE'], newPaiement['MONTANT PAYÉ']);

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return [newPaiement, ...existing];
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paiementData),
    })
      .then(() => {
        console.log('✅ Paiement enregistré');
        setTimeout(() => mutate(), 300);
      })
      .catch(error => {
        console.error('❌ Erreur paiement:', error);
        mutate(
          (current) => {
            const existing = Array.isArray(current) ? current : [];
            return existing.filter(p => p.rowIndex !== newPaiement.rowIndex);
          },
          false
        );
      });

    return { success: true };
  };

  /**
   * Supprimer un paiement
   */
  const deletePaiement = async (rowIndex) => {
    console.log('🗑️ Deleting paiement:', rowIndex);

    const previousData = data;

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return existing.filter((p) => p.rowIndex !== rowIndex);
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(`${API_URL}?rowIndex=${rowIndex}`, {
      method: 'DELETE',
    })
      .then(() => {
        console.log('✅ Paiement supprimé');
      })
      .catch(error => {
        console.error('❌ Erreur delete:', error);
        mutate(previousData, false);
      });

    return { success: true };
  };

  const refresh = () => {
    console.log('🔄 Manual refresh');
    return mutate();
  };

  // Statistiques
  const stats = {
    total: Array.isArray(data) ? data.length : 0,
    totalMontant: Array.isArray(data)
      ? data.reduce((sum, p) => sum + (parseFloat(p['MONTANT PAYÉ'] || p.montantPaye) || 0), 0)
      : 0,
    parType: Array.isArray(data)
      ? data.reduce((acc, p) => {
          const type = p.TYPE || p.type || 'AUTRE';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      : {},
  };

  return {
    paiements: Array.isArray(data) ? data : [],
    stats,
    isLoading,
    isValidating,
    error,
    addPaiement,
    deletePaiement,
    refresh,
    mutate,
  };
}