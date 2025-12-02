'use client';

/**
 * Indicateur de statut de synchronisation
 * - Affiche si online/offline
 * - Nombre d'opérations en attente
 * - Bouton de sync manuelle
 */

import { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useOnlineStatus } from '@/lib/use-online-status';

export function SyncStatus({ showDetails = false }) {
  const { isOnline, isSyncing, pendingCount, lastSyncResult, sync, clean } = useOnlineStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  // Couleur selon le statut
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500 bg-red-50';
    if (pendingCount > 0) return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  // Icône selon le statut
  const getStatusIcon = () => {
    if (isSyncing) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (!isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    if (pendingCount > 0) {
      return <CloudOff className="w-4 h-4" />;
    }
    return <Cloud className="w-4 h-4" />;
  };

  // Texte du statut
  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation...';
    if (!isOnline) return 'Hors ligne';
    if (pendingCount > 0) return `${pendingCount} en attente`;
    return 'Synchronisé';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${getStatusColor()}`}
      >
        {getStatusIcon()}
        {showDetails && <span>{getStatusText()}</span>}
        {!showDetails && pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Tooltip détaillé */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">État de synchronisation</h3>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Statut connexion */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Connecté à internet</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-700">Hors ligne</span>
              </>
            )}
          </div>

          {/* Opérations en attente */}
          <div className="mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Opérations en attente</span>
              <span className={`text-sm font-medium ${pendingCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {pendingCount}
              </span>
            </div>
          </div>

          {/* Dernier résultat de sync */}
          {lastSyncResult && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Dernière synchronisation</p>
              <div className="flex items-center gap-2">
                {lastSyncResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-gray-700">
                  {lastSyncResult.synced || 0} synchronisé(s)
                  {lastSyncResult.failed > 0 && `, ${lastSyncResult.failed} échec(s)`}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={clean}
            className="w-full mb-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
          >
            Nettoyer l'état de synchronisation
          </button>

          {/* Bouton sync manuelle */}
          <button
            onClick={sync}
            disabled={isSyncing || !isOnline || pendingCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
          </button>

          {!isOnline && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Les modifications seront synchronisées à la reconnexion
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Bannière offline pour afficher en haut de page
 */
export function OfflineBanner() {
  const { isOnline, pendingCount } = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`px-4 py-2 text-sm text-center ${isOnline ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      }`}>
      {!isOnline ? (
        <span className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Mode hors ligne - Les modifications seront synchronisées à la reconnexion
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <CloudOff className="w-4 h-4" />
          {pendingCount} modification(s) en attente de synchronisation
        </span>
      )}
    </div>
  );
}
