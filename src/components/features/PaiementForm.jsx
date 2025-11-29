'use client';

/**
 * Formulaire de paiement - Mobile First
 * Interface simplifiée et intuitive pour Android
 */

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Users, User, Calculator, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { useEleves } from '@/hooks/useEleves';
import { useFamilles } from '@/hooks/useFamilles';

// Montants rapides proposés (optimisés pour mobile)
const MONTANTS_RAPIDES = [
  5000, 10000, 15000, 20000, 
  25000, 30000, 40000, 50000
];

// Types de paiement
const TYPES_PAIEMENT = ['ESPECES'];

/**
 * Algorithme de répartition intelligente - ZÉRO PERTE
 */
function repartirMontantIntelligent(montantTotal, nombreEnfants, restesAPayer) {
  if (nombreEnfants === 0) return { repartition: [], montantDistribue: 0, perte: 0 };
  
  const montantBase = Math.floor(montantTotal / nombreEnfants);
  
  let montantArrondi;
  if (montantBase >= 5000) {
    montantArrondi = Math.floor(montantBase / 1000) * 1000;
  } else {
    montantArrondi = Math.floor(montantBase / 500) * 500;
  }
  
  if (montantArrondi < 500) {
    montantArrondi = 500;
  }
  
  const repartition = [];
  let montantDistribue = 0;
  
  for (let i = 0; i < nombreEnfants; i++) {
    const resteAPayer = restesAPayer[i] || 0;
    let montantPourCetEnfant = Math.min(montantArrondi, resteAPayer);
    
    if (montantPourCetEnfant < 500 && resteAPayer >= 500) {
      montantPourCetEnfant = 500;
    }
    
    repartition.push(montantPourCetEnfant);
    montantDistribue += montantPourCetEnfant;
  }
  
  let resteADistribuer = montantTotal - montantDistribue;
  
  while (resteADistribuer > 0) {
    const indicesDisponibles = repartition
      .map((montant, index) => ({ 
        index, 
        capaciteRestante: restesAPayer[index] - montant 
      }))
      .filter(item => item.capaciteRestante > 0)
      .sort((a, b) => b.capaciteRestante - a.capaciteRestante);
    
    if (indicesDisponibles.length === 0) break;
    
    const { index } = indicesDisponibles[0];
    const capaciteRestante = restesAPayer[index] - repartition[index];
    
    let montantAjouter;
    if (resteADistribuer >= 1000 && capaciteRestante >= 1000) {
      montantAjouter = 1000;
    } else if (resteADistribuer >= 500 && capaciteRestante >= 500) {
      montantAjouter = 500;
    } else {
      montantAjouter = Math.min(resteADistribuer, capaciteRestante);
    }
    
    repartition[index] += montantAjouter;
    resteADistribuer -= montantAjouter;
    montantDistribue += montantAjouter;
  }
  
  return {
    repartition,
    montantDistribue: repartition.reduce((sum, m) => sum + m, 0),
    perte: montantTotal - repartition.reduce((sum, m) => sum + m, 0),
  };
}

export default function PaiementForm({ eleve, onSubmit, onCancel, isLoading }) {
  const { eleves } = useEleves();
  const { familles } = useFamilles();
  
  // Protection hydratation
  const [mounted, setMounted] = useState(false);
  
  // Mode : individuel ou famille
  const [modePayment, setModePayment] = useState('individuel');
  
  const [formData, setFormData] = useState({
    idEleve: '',
    idFamille: '',
    montant: '',
    type: 'ESPECES',
    date: '',
  });
  
  const [montantPersonnalise, setMontantPersonnalise] = useState('');
  const [familleSelectionnee, setFamilleSelectionnee] = useState(null);
  
  // Initialisation côté client uniquement
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      idEleve: eleve?.rowIndex?.toString() || '',
      date: new Date().toISOString().split('T')[0],
    }));
    setMounted(true);
  }, [eleve]);
  
  // Charger la famille si un élève est présélectionné
  useEffect(() => {
    if (!mounted || !eleve) return;
    
    const famille = familles.find(f => 
      f.ID === eleve['ID FAMILLE'] || 
      f['ID FAMILLE'] === eleve['ID FAMILLE']
    );
    
    if (famille) {
      setFamilleSelectionnee(famille);
      setFormData(prev => ({ 
        ...prev, 
        idFamille: famille.ID || famille['ID FAMILLE'] 
      }));
    }
  }, [mounted, eleve, familles]);
  
  // Calculer les élèves affectés avec algorithme intelligent
  const elevesAffectes = useMemo(() => {
    if (modePayment !== 'famille' || !familleSelectionnee || !formData.montant) {
      return { enfants: [], montantDistribue: 0, perte: 0 };
    }
    
    const enfants = eleves.filter(e => 
      e['ID FAMILLE'] === (familleSelectionnee.ID || familleSelectionnee['ID FAMILLE'])
    ).filter(e => parseFloat(e.RESTE || 0) > 0);
    
    if (enfants.length === 0) return { enfants: [], montantDistribue: 0, perte: 0 };
    
    const montantTotal = parseFloat(formData.montant);
    const restesAPayer = enfants.map(e => parseFloat(e.RESTE || 0));
    
    const { repartition, montantDistribue, perte } = repartirMontantIntelligent(
      montantTotal, 
      enfants.length, 
      restesAPayer
    );
    
    return {
      enfants: enfants.map((e, index) => ({
        ...e,
        montantAPayer: repartition[index],
      })),
      montantDistribue,
      perte,
    };
  }, [modePayment, familleSelectionnee, formData.montant, eleves]);
  
  // Validation du formulaire
  const formValide = useMemo(() => {
    if (!formData.montant || !formData.type || !formData.date) return false;
    
    const montant = parseFloat(formData.montant);
    if (isNaN(montant) || montant <= 0) return false;
    
    if (modePayment === 'individuel') {
      return !!formData.idEleve;
    } else {
      return !!formData.idFamille && elevesAffectes.enfants?.length > 0;
    }
  }, [formData, modePayment, elevesAffectes]);
  
  // Sélectionner un montant rapide
  const handleMontantRapide = (montant) => {
    setFormData({ ...formData, montant: montant.toString() });
    setMontantPersonnalise('');
  };
  
  // Saisie personnalisée
  const handleMontantPersonnalise = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setMontantPersonnalise(cleaned);
    setFormData({ ...formData, montant: cleaned });
  };
  
  // Changer de mode
  const handleModeChange = (mode) => {
    setModePayment(mode);
    setFormData(prev => ({ 
      ...prev, 
      montant: '', 
      idEleve: mode === 'individuel' && eleve ? eleve.rowIndex?.toString() : '' 
    }));
    setMontantPersonnalise('');
  };
  
  // Soumettre
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formValide) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (modePayment === 'famille') {
      const paiements = elevesAffectes.enfants.map(enfant => ({
        idEleve: enfant.rowIndex?.toString(),
        idFamille: formData.idFamille,
        nomEleve: `${enfant.NOM} ${enfant.PRÉNOM}`,
        montantPaye: enfant.montantAPayer.toString(),
        type: formData.type,
        date: formData.date,
      }));
      
      await onSubmit({ mode: 'famille', paiements });
    } else {
      const eleveSelectionne = eleves.find(e => e.rowIndex?.toString() === formData.idEleve);
      
      if (!eleveSelectionne) {
        alert('Élève non trouvé');
        return;
      }
      
      const montant = parseFloat(formData.montant);
      const reste = parseFloat(eleveSelectionne.RESTE || 0);
      
      if (montant > reste) {
        const confirmer = window.confirm(
          `Le montant (${formatCurrency(montant)}) dépasse le reste à payer (${formatCurrency(reste)}). Continuer ?`
        );
        if (!confirmer) return;
      }
      
      await onSubmit({
        mode: 'individuel',
        idEleve: formData.idEleve,
        idFamille: eleveSelectionne?.['ID FAMILLE'] || formData.idFamille,
        nomEleve: `${eleveSelectionne.NOM} ${eleveSelectionne.PRÉNOM}`,
        montantPaye: formData.montant,
        type: formData.type,
        date: formData.date,
      });
    }
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
      {/* Mode de paiement - Grand et tactile */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Mode de paiement
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleModeChange('individuel')}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              modePayment === 'individuel'
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                : 'border-gray-200 hover:border-gray-300 active:scale-95'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="font-medium text-sm">Individuel</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('famille')}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              modePayment === 'famille'
                ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                : 'border-gray-200 hover:border-gray-300 active:scale-95'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="font-medium text-sm">Famille</span>
          </button>
        </div>
      </div>
      
      {/* Sélection élève ou famille */}
      {modePayment === 'individuel' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Élève <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.idEleve}
            onChange={(e) => setFormData({ ...formData, idEleve: e.target.value })}
            required
            className="block w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Sélectionner un élève</option>
            {eleves.map((e) => (
              <option key={e.rowIndex} value={e.rowIndex?.toString()}>
                {e.NOM} {e.PRÉNOM} - {e.CLASSE} - Reste: {formatCurrency(e.RESTE || 0)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Famille <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.idFamille}
            onChange={(e) => {
              const famille = familles.find(f => (f.ID || f['ID FAMILLE']) === e.target.value);
              setFamilleSelectionnee(famille);
              setFormData({ ...formData, idFamille: e.target.value });
            }}
            required
            className="block w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Sélectionner une famille</option>
            {familles.map((f) => (
              <option key={f.rowIndex} value={f.ID || f['ID FAMILLE']}>
                {f['NOM FAMILLE'] || f.NOM_FAMILLE}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Montant - Interface tactile optimisée */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Montant <span className="text-red-500">*</span>
        </label>
        
        {/* Boutons montants rapides - 4 colonnes sur mobile */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {MONTANTS_RAPIDES.map((montant) => (
            <button
              key={montant}
              type="button"
              onClick={() => handleMontantRapide(montant)}
              className={`px-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                formData.montant === montant.toString()
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(montant)}
            </button>
          ))}
        </div>
        
        {/* Champ personnalisé - Grand et visible */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={montantPersonnalise}
            onChange={(e) => handleMontantPersonnalise(e.target.value)}
            placeholder="Montant personnalisé"
            className="block w-full rounded-xl border-2 border-gray-300 px-12 py-4 text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {formData.montant && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Badge variant="success" className="text-xs">
                {formatCurrency(formData.montant)}
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      {/* Aperçu division famille */}
      {modePayment === 'famille' && elevesAffectes.enfants?.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900 text-sm">Répartition intelligente</h3>
          </div>
          
          <div className="space-y-2 mb-3">
            {elevesAffectes.enfants.map((enfant, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate">{enfant.NOM} {enfant.PRÉNOM}</span>
                </div>
                <Badge variant="success" className="ml-2">
                  {formatCurrency(enfant.montantAPayer)}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="pt-3 border-t-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-700">Total distribué</span>
              <span className="text-xl font-bold text-purple-700">
                {formatCurrency(elevesAffectes.montantDistribue)}
              </span>
            </div>
            
            {elevesAffectes.perte === 0 ? (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg p-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">100% distribué - Zéro perte</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formatCurrency(elevesAffectes.perte)} non distribué</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Type de paiement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de paiement <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {TYPES_PAIEMENT.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, type })}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                formData.type === type
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date du paiement <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          className="block w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      {/* Boutons - Grand et visible */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          variant="success"
          fullWidth
          disabled={isLoading || !formValide}
          className="py-4 text-base font-semibold shadow-lg"
        >
          {isLoading ? 'Enregistrement...' : modePayment === 'famille' 
            ? `Enregistrer ${elevesAffectes.enfants?.length || 0} paiements` 
            : 'Enregistrer le paiement'}
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