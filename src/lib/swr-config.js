'use client';

/**
 * Configuration SWR globale
 * - Cache persistant localStorage
 * - Revalidation automatique
 * - Gestion erreurs
 */

// Provider de cache localStorage pour SWR
export function localStorageProvider() {
  if (typeof window === 'undefined') {
    return new Map();
  }

  const CACHE_KEY = 'school-app-cache';
  
  // Charger le cache existant
  const map = new Map(JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'));

  // Sauvegarder avant de quitter la page
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem(CACHE_KEY, appCache);
  });

  // Sauvegarder périodiquement (toutes les 30 secondes)
  setInterval(() => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem(CACHE_KEY, appCache);
  }, 30000);

  return map;
}

// Configuration SWR par défaut
export const swrConfig = {
  // Revalidation
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 60000, // Rafraîchir toutes les 60 secondes
  
  // Cache
  dedupingInterval: 5000, // Éviter les requêtes dupliquées pendant 5s
  
  // Erreurs
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Callbacks
  onError: (error, key) => {
    console.error(`[SWR Error] ${key}:`, error);
  },
  
  onSuccess: (data, key) => {
    console.log(`[SWR Success] ${key}: ${data?.length || 0} items`);
  },
};

// Fonction pour forcer la sauvegarde du cache
export function saveCache() {
  if (typeof window === 'undefined') return;
  
  const CACHE_KEY = 'school-app-cache';
  const event = new Event('beforeunload');
  window.dispatchEvent(event);
}

// Fonction pour vider le cache
export function clearCache() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('school-app-cache');
  localStorage.removeItem('school-app-pending-operations');
  console.log('[Cache] Cleared');
}
