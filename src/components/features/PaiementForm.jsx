'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

export default function PaiementForm({ eleve, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'ESPECES',
    montantPaye: '',
  });
  
  const [loading, setLoading] = useState(false);
  
  const reste = parseFloat(eleve?.RESTE || 0);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const montant = parseFloat(formData.montantPaye);
    
    if (montant <= 0) {
      alert('Le montant doit être supérieur à 0');
      setLoading(false);
      return;
    }
    
    if (montant > reste) {
      if (!confirm(`Le montant saisi (${formatCurrency(montant)}) est supérieur au reste à payer (${formatCurrency(reste)}). Continuer ?`)) {
        setLoading(false);
        return;
      }
    }
    
    const dataToSubmit = {
      date: formData.date,
      idEleve: eleve.rowIndex,
      nomEleve: `${eleve.NOM} ${eleve.PRÉNOM}`,
      idFamille: eleve['ID FAMILLE'],
      type: formData.type,
      montantPaye: formData.montantPaye,
    };
    
    try {
      await onSubmit(dataToSubmit);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info élève */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Informations élève</h4>
        <div className="space-y-1 text-sm">
          <p><span className="text-gray-600">Nom:</span> <span className="font-medium">{eleve?.NOM} {eleve?.PRÉNOM}</span></p>
          <p><span className="text-gray-600">Classe:</span> <span className="font-medium">{eleve?.CLASSE}</span></p>
          <p><span className="text-gray-600">Total dû:</span> <span className="font-medium">{formatCurrency(eleve?.['TOTAL DÛ'] || 0)}</span></p>
          <p><span className="text-gray-600">Déjà payé:</span> <span className="font-medium text-green-600">{formatCurrency(eleve?.PAYÉ || 0)}</span></p>
          <p><span className="text-gray-600">Reste à payer:</span> <span className="font-bold text-red-600">{formatCurrency(reste)}</span></p>
        </div>
      </div>
      
      <Input
        label="Date du paiement"
        name="date"
        type="date"
        value={formData.date}
        onChange={handleChange}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mode de paiement <span className="text-red-500">*</span>
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="ESPECES">Espèces</option>
          <option value="CHEQUE">Chèque</option>
          <option value="VIREMENT">Virement</option>
          <option value="MOBILE_MONEY">Mobile Money</option>
          <option value="CARTE">Carte bancaire</option>
        </select>
      </div>
      
      <Input
        label="Montant payé"
        name="montantPaye"
        type="number"
        value={formData.montantPaye}
        onChange={handleChange}
        required
        placeholder="Entrez le montant"
        helperText={`Reste à payer: ${formatCurrency(reste)}`}
      />
      
      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="success" loading={loading} fullWidth>
          Enregistrer le paiement
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
