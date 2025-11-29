'use client';

/**
 * Hook personnalisé pour les toasts
 * Simplifie l'utilisation de notistack
 */

import { useSnackbar } from 'notistack';

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const toast = {
    /**
     * Toast de succès
     */
    success: (message, options = {}) => {
      return enqueueSnackbar(message, {
        variant: 'success',
        ...options,
      });
    },

    /**
     * Toast d'erreur
     */
    error: (message, options = {}) => {
      return enqueueSnackbar(message, {
        variant: 'error',
        ...options,
      });
    },

    /**
     * Toast d'avertissement
     */
    warning: (message, options = {}) => {
      return enqueueSnackbar(message, {
        variant: 'warning',
        ...options,
      });
    },

    /**
     * Toast d'information
     */
    info: (message, options = {}) => {
      return enqueueSnackbar(message, {
        variant: 'info',
        ...options,
      });
    },

    /**
     * Toast par défaut
     */
    default: (message, options = {}) => {
      return enqueueSnackbar(message, {
        variant: 'default',
        ...options,
      });
    },

    /**
     * Toast avec action personnalisée
     */
    withAction: (message, actionLabel, onAction, options = {}) => {
      return enqueueSnackbar(message, {
        ...options,
        action: (key) => (
          <button
            onClick={() => {
              onAction();
              closeSnackbar(key);
            }}
            className="text-white font-medium hover:underline"
          >
            {actionLabel}
          </button>
        ),
      });
    },

    /**
     * Toast persistant (ne disparaît pas automatiquement)
     */
    persistent: (message, variant = 'default', options = {}) => {
      return enqueueSnackbar(message, {
        variant,
        persist: true,
        ...options,
      });
    },

    /**
     * Fermer un toast spécifique
     */
    close: (key) => {
      closeSnackbar(key);
    },

    /**
     * Fermer tous les toasts
     */
    closeAll: () => {
      closeSnackbar();
    },

    /**
     * Toast de chargement
     */
    loading: (message = 'Chargement...') => {
      return enqueueSnackbar(message, {
        variant: 'info',
        persist: true,
      });
    },

    /**
     * Mettre à jour un toast de chargement en succès
     */
    updateLoading: (key, message) => {
      closeSnackbar(key);
      return toast.success(message);
    },
  };

  return toast;
}

/**
 * Exemples d'utilisation:
 * 
 * const toast = useToast();
 * 
 * // Succès
 * toast.success('Élève ajouté avec succès !');
 * 
 * // Erreur
 * toast.error('Erreur lors de l\'ajout');
 * 
 * // Avec action
 * toast.withAction('Élève supprimé', 'Annuler', () => {
 *   // Restaurer l'élève
 * });
 * 
 * // Chargement puis succès
 * const loadingKey = toast.loading('Enregistrement...');
 * await api.post(...);
 * toast.updateLoading(loadingKey, 'Élève enregistré !');
 */