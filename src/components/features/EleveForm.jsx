'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function EleveForm({ initialData, familles = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nom: initialData?.NOM || '',
    prenom: initialData?.PRÉNOM || '',
    // dateNaissance: initialData?['DATE NAISS.'] || '',
    classe: initialData?.CLASSE || '',
    idFamille: initialData?.['ID FAMILLE'] || '',
    inscription: initialData?.INSCRIPTION || '0',
    scolarite: initialData?.SCOLARITÉ || '0',
    dossier: initialData?.DOSSIER || '0',
    autres: initialData?.AUTRES || '0',
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const calculateTotal = () => {
    const inscription = parseFloat(formData.inscription) || 0;
    const scolarite = parseFloat(formData.scolarite) || 0;
    const dossier = parseFloat(formData.dossier) || 0;
    const autres = parseFloat(formData.autres) || 0;
    return inscription + scolarite + dossier + autres;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const totalDu = calculateTotal();
    const dataToSubmit = {
      ...formData,
      totalDu: totalDu.toString(),
      paye: initialData?.PAYÉ || '0',
      reste: (totalDu - (parseFloat(initialData?.PAYÉ) || 0)).toString(),
      statut: initialData?.STATUT || 'EN ATTENTE',
    };
    
    try {
      await onSubmit(dataToSubmit);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nom"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          required
          placeholder="Nom de l'élève"
        />
        
        <Input
          label="Prénom"
          name="prenom"
          value={formData.prenom}
          onChange={handleChange}
          required
          placeholder="Prénom de l'élève"
        />
        
        <Input
          label="Date de naissance"
          name="dateNaissance"
          type="date"
          value={formData.dateNaissance}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Classe"
          name="classe"
          value={formData.classe}
          onChange={handleChange}
          required
          placeholder="Ex: 6ème A"
        />
        
        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Famille <span className="text-red-500">*</span>
          </label>
          <select
            name="idFamille"
            value={formData.idFamille}
            onChange={handleChange}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Sélectionner une famille</option>
            {familles.map((famille) => (
              <option key={famille.ID} value={famille.ID}>
                {famille['NOM FAMILLE']} (ID: {famille.ID})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Frais de scolarité</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Frais d'inscription"
            name="inscription"
            type="number"
            value={formData.inscription}
            onChange={handleChange}
            placeholder="0"
          />
          
          <Input
            label="Frais de scolarité"
            name="scolarite"
            type="number"
            value={formData.scolarite}
            onChange={handleChange}
            placeholder="0"
          />
          
          <Input
            label="Frais de dossier"
            name="dossier"
            type="number"
            value={formData.dossier}
            onChange={handleChange}
            placeholder="0"
          />
          
          <Input
            label="Autres frais"
            name="autres"
            type="number"
            value={formData.autres}
            onChange={handleChange}
            placeholder="0"
          />
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total à payer:</span>
            <span className="text-lg font-bold text-primary-600">
              {new Intl.NumberFormat('fr-FR').format(calculateTotal())} FCFA
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="submit" loading={loading} fullWidth>
          {initialData ? 'Mettre à jour' : 'Ajouter l\'élève'}
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
