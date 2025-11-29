'use client';

/**
 * Formulaire de moratoire - Mobile First
 * Interface simplifiée avec boutons de durées rapides
 */

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useFamilles } from '@/hooks/useFamilles';

// Durées rapides proposées (en semaines)
const DUREES_RAPIDES = [
  { semaines: 1, label: '1 semaine', jours: 7 },
  { semaines: 2, label: '2 semaines', jours: 14 },
  { semaines: 3, label: '3 semaines', jours: 21 },
  { semaines: 4, label: '1 mois', jours: 30 },
];

export default function MoratoireForm({ onSubmit, onCancel, isLoading }) {
  const { familles } = useFamilles();
  
  // Protection hydratation
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    idFamille: '',
    duree: '', // Durée en semaines
    notes: '',
  });
  
  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Sélectionner une durée rapide
  const handleDureeRapide = (semaines) => {
    setFormData({ ...formData, duree: semaines.toString() });
  };
  
  // Calculer la date d'échéance approximative
  const dateInfo = useMemo(() => {
    if (!formData.duree || !mounted) return null;
    
    const today = new Date();
    const jours = parseInt(formData.duree) * 7;
    const dateEcheance = new Date(today);
    dateEcheance.setDate(dateEcheance.getDate() + jours);
    
    return {
      dateEcheance: dateEcheance.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      jours,
    };
  }, [formData.duree, mounted]);
  
  // Validation
  const formValide = formData.idFamille && formData.duree && parseInt(formData.duree) > 0;
  
  // Soumettre
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formValide) {
      alert('Veuillez sélectionner une famille et une durée');
      return;
    }
    
    await onSubmit({
      idFamille: formData.idFamille,
      duree: formData.duree,
      notes: formData.notes.trim(),
    });
  };
  
  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Information importante */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Moratoire de paiement</p>
            <p className="text-xs text-amber-700">
              Accordez un délai supplémentaire à une famille pour régulariser ses paiements.
            </p>
          </div>
        </div>
      </div>
      
      {/* Sélection famille */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Famille concernée <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.idFamille}
          onChange={(e) => setFormData({ ...formData, idFamille: e.target.value })}
          required
          className="block w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
        
        {/* Boutons durées rapides - 2x2 sur mobile */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {DUREES_RAPIDES.map(({ semaines, label, jours }) => (
            <button
              key={semaines}
              type="button"
              onClick={() => handleDureeRapide(semaines)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl text-sm font-medium transition-all border-2 active:scale-95 ${
                formData.duree === semaines.toString()
                  ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="w-6 h-6 mb-2" />
              <span className="font-bold">{label}</span>
              <span className="text-xs text-gray-500 mt-1">{jours} jours</span>
            </button>
          ))}
        </div>
        
        {/* Champ durée personnalisée */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Ou spécifier une durée personnalisée (en semaines)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="52"
            value={formData.duree}
            onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
            placeholder="Ex: 5"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>
      
      {/* Aperçu de l'échéance */}
      {dateInfo && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Échéance du moratoire
              </p>
              <p className="text-base font-bold text-green-700 mb-2">
                {dateInfo.dateEcheance}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  {formData.duree} semaine{parseInt(formData.duree) > 1 ? 's' : ''}
                </Badge>
                <Badge variant="success" size="sm">
                  {dateInfo.jours} jours
                </Badge>
              </div>
              <p className="text-xs text-green-600 mt-2">
                À partir d'aujourd'hui
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes / Raison <span className="text-gray-400 text-xs">(Optionnel)</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="block w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          placeholder="Ex: Difficultés temporaires, promesse de régularisation..."
        />
      </div>
      
      {/* Info date automatique */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            La date de début sera automatiquement aujourd'hui lors de l'enregistrement.
          </p>
        </div>
      </div>
      
      {/* Boutons */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          variant="warning"
          fullWidth
          disabled={isLoading || !formValide}
          className="py-4 text-base font-semibold shadow-lg"
        >
          {isLoading ? 'Enregistrement...' : 'Accorder le moratoire'}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          fullWidth
          className="py-3"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}