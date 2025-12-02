/**
 * Client API centralisé
 * - Headers d'audit automatiques
 * - Gestion des erreurs
 * - Support offline
 */

import { getDeviceId, getDeviceName, getDeviceInfo } from './device-id';

class ApiClient {
  constructor() {
    this.baseUrl = '';
  }

  // Headers communs avec infos d'audit
  getHeaders() {
    const deviceInfo = getDeviceInfo();

    return {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceInfo.deviceId,
      'X-Device-Name': deviceInfo.deviceName,
      'X-Request-Time': new Date().toISOString(),
    };
  }

  // Requête générique
  async request(url, options = {}) {
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
      });

      // Parser la réponse
      const data = await response.json();
      console.log('data', data)
      if (!response.ok) {
        throw new ApiError(
          data.error || 'Une erreur est survenue',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      // Erreur réseau (offline)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new NetworkError('Pas de connexion internet');
      }

      // Relancer l'erreur si c'est déjà une ApiError
      // if (error instanceof ApiError || error instanceof NetworkError) {
      //   throw error;
      // }

      // Erreur inattendue
      throw new ApiError(error.message, 500);
    }
  }

  // GET
  async get(url) {
    return this.request(url, { method: 'GET' });
  }

  // POST
  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
  // PUT
  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE
  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

// Classe d'erreur API
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Classe d'erreur réseau
export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
    this.isOffline = true;
  }
}

// Instance singleton
export const apiClient = new ApiClient();

// Fonctions de commodité
export const api = {
  get: (url) => { apiClient.get(url) },
  post: (url, data) => apiClient.post(url, data),
  put: (url, data) => apiClient.put(url, data),
  delete: (url) => apiClient.delete(url),
};
