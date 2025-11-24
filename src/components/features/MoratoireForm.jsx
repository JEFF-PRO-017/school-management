'use client';

/**
 * Formulaire de moratoire intelligent
 * - Boutons de durées rapides (1, 2, 3 semaines)
 * - Date de début gérée côté back-end
 * - Interface ergonomique
 */

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useFamilles } from '@/hooks/useFamilles';

// Durées rapides proposées (en semaines)
const DUREES_RAPIDES = [
  { semaines: 1, label: '1 semaine' },
  { semaines: 2, label: '2 semaines' },
  { semaines: 3, label: '3 semaines' },
];

export default function MoratoireForm({ onSubmit, onCancel, isLoading }) {
  const { familles } = useFamilles();
  
  const [formData, setFormData] = useState({
    idFamille: '',
    duree: '', // Durée en semaines
    notes: '',
  });
  
  // Sélectionner une durée rapide
  const handleDureeRapide = (semaines) => {
    setFormData({ ...formData, duree: semaines.toString() });
  };
  
  // Calculer la date d'échéance approximative (juste pour affichage)
  const getDateEcheanceApproximative = () => {
    if (!formData.duree) return null;
    const today = new Date();
    const jours = parseInt(formData.duree) * 7;
    const dateEcheance = new Date(today.setDate(today.getDate() + jours));
    return dateEcheance.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Soumettre
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Envoyer seulement idFamille et duree
    // Le back-end calculera dateDebut (aujourd'hui) et dateEcheance
    await onSubmit({
      idFamille: formData.idFamille,
      duree: formData.duree, // en semaines
      notes: formData.notes,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sélection famille */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Famille concernée <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.idFamille}
          onChange={(e) => setFormData({ ...formData, idFamille: e.target.value })}
          required
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Sélectionner une famille</option>
          {familles.map((f) => (
            <option key={f.rowIndex} value={f.ID || f['ID FAMILLE']}>
              {f['NOM FAMILLE'] || f.NOM_FAMILLE} (ID: {f.ID || f['ID FAMILLE']})
            </option>
          ))}
        </select>
      </div>
      
      {/* Durée avec boutons rapides */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Durée du moratoire <span className="text-red-500">*</span>
        </label>
        
        {/* Boutons durées rapides */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {DUREES_RAPIDES.map(({ semaines, label }) => (
            <button
              key={semaines}
              type="button"
              onClick={() => handleDureeRapide(semaines)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                formData.duree === semaines.toString()
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              {label}
            </button>
          ))}
        </div>
        
        {/* Champ durée personnalisée */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Ou spécifier un nombre de semaines personnalisé:
          </label>
          <input
            type="number"
            min="1"
            max="52"
            value={formData.duree}
            onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
            placeholder="Ex: 4"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        
        {formData.duree && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Échéance approximative</span>
            </div>
            <p className="text-sm text-amber-700">
              {getDateEcheanceApproximative()}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              ({formData.duree} semaine{parseInt(formData.duree) > 1 ? 's' : ''} à partir d'aujourd'hui)
            </p>
          </div>
        )}
      </div>
      
      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes / Raison (optionnel)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
          placeholder="Ex: Difficultés financières temporaires, promesse de régularisation..."
        />
      </div>
      
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Date de début automatique</p>
            <p className="text-xs text-blue-700 mt-1">
              La date de début du moratoire sera automatiquement définie à aujourd'hui lors de l'enregistrement.
            </p>
          </div>
        </div>
      </div>
      
      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="warning"
          fullWidth
          disabled={isLoading || !formData.duree || !formData.idFamille}
        >
          {isLoading ? 'Enregistrement...' : 'Accorder le moratoire'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
          Annuler
        </Button>
      </div>
    </form>
  );
}
