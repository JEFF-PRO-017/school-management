'use client';

/**
 * Composant pour configurer le nom de l'appareil
 * Affiché au premier lancement ou accessible via les paramètres
 */

import { useState, useEffect } from 'react';
import { Smartphone, Save, X } from 'lucide-react';
import { getDeviceName, setDeviceName, isNewDevice, getDeviceId } from '@/lib/device-id';

export function DeviceSetup({ onComplete }) {
  const [name, setName] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher au premier lancement
    if (isNewDevice()) {
      setIsVisible(true);
    }
  }, []);

  const handleSave = () => {
    if (name.trim()) {
      setDeviceName(name.trim());
      setIsVisible(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setDeviceName(`Appareil ${getDeviceId().slice(-6)}`);
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Bienvenue !</h2>
          <p className="text-gray-600 mt-2">
            Donnez un nom à cet appareil pour faciliter le suivi des opérations.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'appareil
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: PC Bureau Marie, Tablette Accueil..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Ce nom apparaîtra dans l'historique des opérations.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              Passer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Petit composant pour modifier le nom de l'appareil
 */
export function DeviceNameEditor() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [currentName, setCurrentName] = useState('');

  useEffect(() => {
    setCurrentName(getDeviceName());
    setName(getDeviceName());
  }, []);

  const handleSave = () => {
    if (name.trim()) {
      setDeviceName(name.trim());
      setCurrentName(name.trim());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setName(currentName);
            setIsEditing(false);
          }}
          className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
    >
      <Smartphone className="w-4 h-4" />
      {currentName}
    </button>
  );
}
