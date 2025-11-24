'use client';

/**
 * Hook SWR pour la gestion des moratoires
 * Avec filtres par période (date début / date fin)
 */

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { api, NetworkError } from '@/lib/api-client';
import { addPendingOperation, OP_TYPES } from '@/lib/offline-manager';

const API_URL = '/api/moratoires';

const fetcher = async (url) => {
  const data = await api.get(url);
  return data;
};

export function useMoratoires() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    API_URL,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      keepPreviousData: true,
    }
  );

  // États pour les filtres de date
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);

  /**
   * Données filtrées par période
   */
  const filteredMoratoires = useMemo(() => {
    if (!data) return [];
    
    let result = [...data];

    // Filtre date début (supérieure ou égale)
    if (dateDebut) {
      const debut = new Date(dateDebut);
      result = result.filter(m => {
        const dateMoratoire = parseDate(m.DATE || m['DATE DÉBUT'] || m['DATE ECHEANCE']);
        return dateMoratoire && dateMoratoire >= debut;
      });
    }

    // Filtre date fin (inférieure ou égale)
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999); // Inclure toute la journée
      result = result.filter(m => {
        const dateMoratoire = parseDate(m.DATE || m['DATE DÉBUT'] || m['DATE ECHEANCE']);
        return dateMoratoire && dateMoratoire <= fin;
      });
    }

    // Trier par date décroissante
    result.sort((a, b) => {
      const dateA = parseDate(a.DATE || a['DATE DÉBUT'] || a['DATE ECHEANCE']);
      const dateB = parseDate(b.DATE || b['DATE DÉBUT'] || b['DATE ECHEANCE']);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    });

    return result;
  }, [data, dateDebut, dateFin]);

  /**
   * Parser une date (formats: DD/MM/YYYY, YYYY-MM-DD, etc.)
   */
  function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Format DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    }
    
    // Format ISO ou YYYY-MM-DD
    return new Date(dateStr);
  }

  /**
   * Définir la période de filtre
   */
  const setFilterPeriod = (debut, fin) => {
    setDateDebut(debut);
    setDateFin(fin);
  };

  /**
   * Réinitialiser les filtres
   */
  const clearFilters = () => {
    setDateDebut(null);
    setDateFin(null);
  };

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
        clearFilters();
        break;
    }
  };

  /**
   * Ajouter un moratoire
   */
  const addMoratoire = async (moratoireData) => {
    const tempId = `MOR_${Date.now()}`;
    const newMoratoire = {
      ...moratoireData,
      'N° MORATOIRE': tempId,
      rowIndex: tempId,
      _isOptimistic: true,
    };

    try {
      await mutate(
        (currentData) => [...(currentData || []), newMoratoire],
        { revalidate: false }
      );

      const result = await api.post(API_URL, moratoireData);
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.CREATE,
          entity: 'moratoires',
          data: moratoireData,
        });
        return { success: true, offline: true, data: newMoratoire };
      }

      await mutate();
      throw error;
    }
  };

  /**
   * Mettre à jour un moratoire
   */
  const updateMoratoire = async (rowIndex, moratoireData) => {
    const previousData = data;

    try {
      await mutate(
        (currentData) =>
          currentData?.map((m) =>
            m.rowIndex === rowIndex
              ? { ...m, ...moratoireData, _isOptimistic: true }
              : m
          ),
        { revalidate: false }
      );

      const result = await api.put(API_URL, { ...moratoireData, rowIndex });
      await mutate();

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.UPDATE,
          entity: 'moratoires',
          data: moratoireData,
          rowIndex,
        });
        return { success: true, offline: true };
      }

      await mutate(previousData, { revalidate: false });
      throw error;
    }
  };

  /**
   * Supprimer un moratoire
   */
  const deleteMoratoire = async (rowIndex) => {
    const previousData = data;

    try {
      await mutate(
        (currentData) =>
          currentData?.filter((m) => m.rowIndex !== rowIndex),
        { revalidate: false }
      );

      await api.delete(`${API_URL}?rowIndex=${rowIndex}`);

      return { success: true };
    } catch (error) {
      if (error instanceof NetworkError) {
        addPendingOperation({
          type: OP_TYPES.DELETE,
          entity: 'moratoires',
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
  const stats = useMemo(() => ({
    total: data?.length || 0,
    filtered: filteredMoratoires.length,
    enCours: data?.filter(m => m.STATUT === 'EN COURS').length || 0,
    termines: data?.filter(m => m.STATUT === 'TERMINÉ').length || 0,
    enRetard: data?.filter(m => m.STATUT === 'EN RETARD').length || 0,
  }), [data, filteredMoratoires]);

  return {
    // Données
    moratoires: data || [],
    filteredMoratoires,
    
    // États
    stats,
    isLoading,
    isValidating,
    error,
    
    // Filtres
    dateDebut,
    dateFin,
    setDateDebut,
    setDateFin,
    setFilterPeriod,
    setFilterPreset,
    clearFilters,
    
    // Actions
    addMoratoire,
    updateMoratoire,
    deleteMoratoire,
    refresh,
    mutate,
  };
}
