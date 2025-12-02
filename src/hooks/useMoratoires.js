'use client';

/**
 * Hook useMoratoires - SIMPLIFIÉ
 * Avec filtres par période
 */

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { configswr } from './index';

const API_URL = '/api/moratoires';

const fetcher = (url) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Erreur réseau');
  return res.json();
});

export function useMoratoires() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_URL,
    fetcher,
    configswr
  );

  // États pour les filtres de date
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);

  /**
   * Parser une date (DD/MM/YYYY ou YYYY-MM-DD)
   */
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  /**
   * Données filtrées par période
   */
  const filteredMoratoires = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let result = [...data];

    if (dateDebut) {
      const debut = new Date(dateDebut);
      result = result.filter(m => {
        const dateMoratoire = parseDate(m['DATE DÉBUT'] || m.DATE);
        return dateMoratoire && dateMoratoire >= debut;
      });
    }

    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      result = result.filter(m => {
        const dateMoratoire = parseDate(m['DATE DÉBUT'] || m.DATE);
        return dateMoratoire && dateMoratoire <= fin;
      });
    }

    // Tri par date décroissante
    result.sort((a, b) => {
      const dateA = parseDate(a['DATE DÉBUT'] || a.DATE);
      const dateB = parseDate(b['DATE DÉBUT'] || b.DATE);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    });

    return result;
  }, [data, dateDebut, dateFin]);

  /**
   * Filtres prédéfinis
   */
  const setFilterPreset = (preset) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    switch (preset) {
      case 'today':
        setDateDebut(today.toISOString().split('T')[0]);
        setDateFin(today.toISOString().split('T')[0]);
        break;
      case 'this-week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setDateDebut(startOfWeek.toISOString().split('T')[0]);
        setDateFin(today.toISOString().split('T')[0]);
        break;
      case 'this-month':
        setDateDebut(startOfMonth.toISOString().split('T')[0]);
        setDateFin(endOfMonth.toISOString().split('T')[0]);
        break;
      case 'last-month':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateDebut(lastMonthStart.toISOString().split('T')[0]);
        setDateFin(lastMonthEnd.toISOString().split('T')[0]);
        break;
      case 'this-year':
        setDateDebut(startOfYear.toISOString().split('T')[0]);
        setDateFin(today.toISOString().split('T')[0]);
        break;
      case 'all':
      default:
        setDateDebut(null);
        setDateFin(null);
        break;
    }
  };

  const clearFilters = () => {
    setDateDebut(null);
    setDateFin(null);
  };

  /**
   * Ajouter un moratoire
   */
  const addMoratoire = async (moratoireData) => {
    // Calculs automatiques
    const dateDebutObj = new Date();
    const dateFinObj = new Date(dateDebutObj);
    dateFinObj.setDate(dateFinObj.getDate() + (parseInt(moratoireData.duree) * 7));

    const dateDebutStr = dateDebutObj.toLocaleDateString('fr-FR');
    const dateFinStr = dateFinObj.toLocaleDateString('fr-FR');

    const statut = new Date() > dateFinObj ? 'EN RETARD' : 'EN COURS';

    const tempId = `MOR_${Date.now()}`;
    const newMoratoire = {
      ID: tempId,
      'N° MORATOIRE': tempId,
      'ID FAMILLE': moratoireData.idFamille,
      'DATE DÉBUT': dateDebutStr,
      'DATE FIN': dateFinStr,
      DURÉE: moratoireData.duree,
      NOTES: moratoireData.notes || '',
      STATUT: statut,
      rowIndex: tempId,
      _isOptimistic: true,
    };

    console.log('⏰ Adding moratoire:', newMoratoire['ID FAMILLE'], newMoratoire.DURÉE, 'semaines');

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return [newMoratoire, ...existing];
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moratoireData),
    })
      .then(() => {
        console.log('✅ Moratoire accordé');
        setTimeout(() => mutate(), 300);
      })
      .catch(error => {
        console.error('❌ Erreur moratoire:', error);
        mutate(
          (current) => {
            const existing = Array.isArray(current) ? current : [];
            return existing.filter(m => m.rowIndex !== tempId);
          },
          false
        );
      });

    return { success: true, data: newMoratoire };
  };

  /**
   * Mettre à jour un moratoire
   */
  const updateMoratoire = async (rowIndex, moratoireData) => {
    console.log('✏️ Updating moratoire:', rowIndex);

    const previousData = data;

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return existing.map((m) =>
          m.rowIndex === rowIndex
            ? { ...m, ...moratoireData, _isOptimistic: true }
            : m
        );
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...moratoireData, rowIndex }),
    })
      .then(() => {
        console.log('✅ Moratoire mis à jour');
        setTimeout(() => mutate(), 300);
      })
      .catch(error => {
        console.error('❌ Erreur update moratoire:', error);
        mutate(previousData, false);
      });

    return { success: true };
  };

  /**
   * Supprimer un moratoire
   */
  const deleteMoratoire = async (rowIndex) => {
    console.log('🗑️ Deleting moratoire:', rowIndex);

    const previousData = data;

    // ✨ UI INSTANTANÉE
    mutate(
      (current) => {
        const existing = Array.isArray(current) ? current : [];
        return existing.filter((m) => m.rowIndex !== rowIndex);
      },
      false
    );

    // 🚀 BACKEND ASYNCHRONE
    fetch(`${API_URL}?rowIndex=${rowIndex}`, {
      method: 'DELETE',
    })
      .then(() => {
        console.log('✅ Moratoire supprimé');
      })
      .catch(error => {
        console.error('❌ Erreur delete moratoire:', error);
        mutate(previousData, false);
      });

    return { success: true };
  };

  const refresh = () => {
    console.log('🔄 Manual refresh');
    return mutate();
  };

  // Stats
  const stats = useMemo(() => ({
    total: Array.isArray(data) ? data.length : 0,
    filtered: filteredMoratoires.length,
    enCours: Array.isArray(data)
      ? data.filter(m => m.STATUT === 'EN COURS').length
      : 0,
    termines: Array.isArray(data)
      ? data.filter(m => m.STATUT === 'TERMINÉ').length
      : 0,
    enRetard: Array.isArray(data)
      ? data.filter(m => m.STATUT === 'EN RETARD').length
      : 0,
  }), [data, filteredMoratoires]);

  return {
    moratoires: Array.isArray(data) ? data : [],
    filteredMoratoires,
    stats,
    isLoading,
    isValidating,
    error,
    dateDebut,
    dateFin,
    setDateDebut,
    setDateFin,
    setFilterPreset,
    clearFilters,
    addMoratoire,
    updateMoratoire,
    deleteMoratoire,
    refresh,
    mutate,
  };
}