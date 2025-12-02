'use client';

/**
 * Hook useFamilles - SIMPLIFIÉ
 */

import useSWR from 'swr';
import { configswr } from './index';

const API_URL = '/api/familles';

const fetcher = (url) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Erreur réseau');
  return res.json();
});

export function useFamilles() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_URL,
    fetcher,
    configswr
  );

  /**
   * Ajouter une famille
   */
  const addFamille = async (familleData) => {
    const tempId = `FAM_${Date.now()}`;
    const newFamille = {
      ID: tempId,
      'ID FAMILLE': tempId,
      'NOM FAMILLE': familleData.nomFamille || '',
      CONTACT: familleData.contact || '',
      EMAIL: familleData.email || '',
      'NB ENFANTS': familleData.nbEnfants || '0',
      'TOTAL FAMILLE': familleData.totalFamille || '0',
      PAYÉ: familleData.paye || '0',
      RESTE: familleData.reste || '0',
      STATUT: familleData.statut || 'EN ATTENTE',
      rowIndex: tempId,
      _isOptimistic: true,
    };

    console.log('👨‍👩‍👧‍👦 Adding famille:', newFamille['NOM FAMILLE']);

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return [...existing, newFamille];
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(familleData),
    })
      .then(() => {
        console.log('✅ Famille ajoutée');
        setTimeout(() => mutate(), 300);
      })
      .catch(error => {
        console.error('❌ Erreur ajout famille:', error);
        mutate(
          (current) => {
            const existing = Array.isArray(current) ? current : [];
            return existing.filter(f => f.rowIndex !== tempId);
          },
          false
        );
      });

    return { success: true, data: newFamille };
  };

  /**
   * Mettre à jour une famille
   */
  const updateFamille = async (rowIndex, familleData) => {
    console.log('✏️ Updating famille:', rowIndex);

    const previousData = data;

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return existing.map((f) =>
          f.rowIndex === rowIndex
            ? {
              ...f,
              'NOM FAMILLE': familleData.nomFamille || f['NOM FAMILLE'],
              CONTACT: familleData.contact || f.CONTACT,
              EMAIL: familleData.email || f.EMAIL,
              'NB ENFANTS': familleData.nbEnfants || f['NB ENFANTS'],
              'TOTAL FAMILLE': familleData.totalFamille || f['TOTAL FAMILLE'],
              PAYÉ: familleData.paye || f.PAYÉ,
              RESTE: familleData.reste || f.RESTE,
              STATUT: familleData.statut || f.STATUT,
              _isOptimistic: true,
            }
            : f
        );
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...familleData, rowIndex }),
    })
      .then(() => {
        console.log('✅ Famille mise à jour');
        setTimeout(() => mutate(), 300);
      })
      .catch(error => {
        console.error('❌ Erreur update famille:', error);
        mutate(previousData, false);
      });

    return { success: true };
  };

  /**
   * Supprimer une famille
   */
  const deleteFamille = async (rowIndex) => {
    console.log('🗑️ Deleting famille:', rowIndex);

    const previousData = data;

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return existing.filter((f) => f.rowIndex !== rowIndex);
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(`${API_URL}?rowIndex=${rowIndex}`, {
      method: 'DELETE',
    })
      .then(() => {
        console.log('✅ Famille supprimée');
      })
      .catch(error => {
        console.error('❌ Erreur delete famille:', error);
        mutate(previousData, false);
      });

    return { success: true };
  };

  const refresh = () => {
    console.log('🔄 Manual refresh');
    return mutate();
  };

  // Stats
  const stats = {
    total: Array.isArray(data) ? data.length : 0,
    actives: Array.isArray(data)
      ? data.filter(f => f.STATUT === 'ACTIF').length
      : 0,
  };

  return {
    familles: Array.isArray(data) ? data : [],
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