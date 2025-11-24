'use client';

/**
 * Formulaire de paiement intelligent
 * - Boutons de montants rapides
 * - Paiement par famille (division automatique)
 * - Interface ergonomique
 */

import { useState, useEffect } from 'react';
import { CreditCard, Users, User, Calculator } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { useEleves } from '@/hooks/useEleves';
import { useFamilles } from '@/hooks/useFamilles';

// Montants rapides proposés
const MONTANTS_RAPIDES = [5000, 10000, 20000, 25000, 30000, 40000, 50000];

// Types de paiement
const TYPES_PAIEMENT = ['ESPECES', 'CHEQUE', 'VIREMENT', 'MOBILE_MONEY', 'CARTE'];

export default function PaiementForm({ eleve, onSubmit, onCancel, isLoading }) {
  const { eleves } = useEleves();
  const { familles } = useFamilles();
  
  // Mode : individuel ou famille
  const [modePayment, setModePayment] = useState('individuel'); // 'individuel' | 'famille'
  
  const [formData, setFormData] = useState({
    idEleve: eleve?.rowIndex?.toString() || '',
    idFamille: '',
    montant: '',
    type: 'ESPECES',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [montantPersonnalise, setMontantPersonnalise] = useState('');
  const [familleSelectionnee, setFamilleSelectionnee] = useState(null);
  const [elevesAffectes, setElevesAffectes] = useState([]);
  
  // Charger la famille si un élève est présélectionné
  useEffect(() => {
    if (eleve) {
      const famille = familles.find(f => 
        f.ID === eleve['ID FAMILLE'] || 
        f['ID FAMILLE'] === eleve['ID FAMILLE']
      );
      if (famille) {
        setFamilleSelectionnee(famille);
        setFormData(prev => ({ ...prev, idFamille: famille.ID || famille['ID FAMILLE'] }));
      }
    }
  }, [eleve, familles]);
  
  // Calculer les élèves affectés et montants
  useEffect(() => {
    if (modePayment === 'famille' && familleSelectionnee && formData.montant) {
      const enfants = eleves.filter(e => 
        e['ID FAMILLE'] === (familleSelectionnee.ID || familleSelectionnee['ID FAMILLE'])
      ).filter(e => parseFloat(e.RESTE || 0) > 0); // Seulement ceux avec reste à payer
      
      const montantTotal = parseFloat(formData.montant);
      const montantParEnfant = Math.floor(montantTotal / enfants.length); // Pas de virgule
      
      setElevesAffectes(enfants.map(e => ({
        ...e,
        montantAPayer: montantParEnfant,
      })));
    } else {
      setElevesAffectes([]);
    }
  }, [modePayment, familleSelectionnee, formData.montant, eleves]);
  
  // Sélectionner un montant rapide
  const handleMontantRapide = (montant) => {
    setFormData({ ...formData, montant: montant.toString() });
    setMontantPersonnalise('');
  };
  
  // Saisie personnalisée
  const handleMontantPersonnalise = (value) => {
    // Enlever tout sauf les chiffres
    const cleaned = value.replace(/[^0-9]/g, '');
    setMontantPersonnalise(cleaned);
    setFormData({ ...formData, montant: cleaned });
  };
  
  // Changer de mode
  const handleModeChange = (mode) => {
    setModePayment(mode);
    if (mode === 'individuel' && eleve) {
      setFormData(prev => ({ ...prev, idEleve: eleve.rowIndex?.toString() }));
    } else if (mode === 'famille' && familleSelectionnee) {
      setFormData(prev => ({ ...prev, idEleve: '' }));
    }
  };
  
  // Soumettre
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modePayment === 'famille') {
      // Créer un paiement pour chaque enfant
      const paiements = elevesAffectes.map(enfant => ({
        idEleve: enfant.rowIndex?.toString(),
        idFamille: formData.idFamille,
        nomEleve: `${enfant.NOM} ${enfant.PRÉNOM}`,
        montantPaye: enfant.montantAPayer.toString(),
        type: formData.type,
        date: formData.date,
      }));
      
      await onSubmit({ mode: 'famille', paiements });
    } else {
      // Paiement individuel
      const eleveSelectionne = eleves.find(e => e.rowIndex?.toString() === formData.idEleve);
      
      await onSubmit({
        mode: 'individuel',
        idEleve: formData.idEleve,
        idFamille: eleveSelectionne?.['ID FAMILLE'] || formData.idFamille,
        nomEleve: eleveSelectionne ? `${eleveSelectionne.NOM} ${eleveSelectionne.PRÉNOM}` : '',
        montantPaye: formData.montant,
        type: formData.type,
        date: formData.date,
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode de paiement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Mode de paiement
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleModeChange('individuel')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              modePayment === 'individuel'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Individuel</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('famille')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              modePayment === 'famille'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Famille</span>
          </button>
        </div>
      </div>
      
      {/* Sélection élève ou famille */}
      {modePayment === 'individuel' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Élève <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.idEleve}
            onChange={(e) => setFormData({ ...formData, idEleve: e.target.value })}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Sélectionner une famille</option>
            {familles.map((f) => (
              <option key={f.rowIndex} value={f.ID || f['ID FAMILLE']}>
                {f['NOM FAMILLE'] || f.NOM_FAMILLE} (ID: {f.ID || f['ID FAMILLE']})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Montant avec boutons rapides */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Montant <span className="text-red-500">*</span>
        </label>
        
        {/* Boutons montants rapides */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {MONTANTS_RAPIDES.map((montant) => (
            <button
              key={montant}
              type="button"
              onClick={() => handleMontantRapide(montant)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.montant === montant.toString()
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {formatCurrency(montant)}
            </button>
          ))}
        </div>
        
        {/* Champ personnalisé */}
        <div className="relative">
          <input
            type="text"
            value={montantPersonnalise}
            onChange={(e) => handleMontantPersonnalise(e.target.value)}
            placeholder="Ou saisir un montant personnalisé..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:ring-primary-500 focus:border-primary-500"
          />
          <CreditCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        
        {formData.montant && (
          <p className="mt-2 text-sm text-gray-600">
            Montant sélectionné: <span className="font-bold text-green-600">{formatCurrency(formData.montant)}</span>
          </p>
        )}
      </div>
      
      {/* Aperçu division famille */}
      {modePayment === 'famille' && elevesAffectes.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Division du montant</h3>
          </div>
          <div className="space-y-2">
            {elevesAffectes.map((enfant, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-sm font-medium">{enfant.NOM} {enfant.PRÉNOM}</span>
                <Badge variant="success">{formatCurrency(enfant.montantAPayer)}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <div className="flex items-center justify-between font-bold">
              <span>Total:</span>
              <span className="text-purple-700">{formatCurrency(formData.montant)}</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Divisé entre {elevesAffectes.length} enfant(s) avec reste à payer
            </p>
          </div>
        </div>
      )}
      
      {/* Type de paiement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de paiement <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES_PAIEMENT.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, type })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.type === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Date */}
      <Input
        label="Date du paiement"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />
      
      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="success"
          fullWidth
          disabled={isLoading || !formData.montant}
        >
          {isLoading ? 'Enregistrement...' : `Enregistrer ${modePayment === 'famille' ? `(${elevesAffectes.length} paiements)` : ''}`}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
          Annuler
        </Button>
      </div>
    </form>
  );
}
