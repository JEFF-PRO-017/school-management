'use client';

import { useState, useEffect, useMemo } from 'react';
import { GraduationCap, DollarSign, AlertCircle, CheckCircle, Percent } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

// Tarifs par classe
const TARIFS_CLASSES = {
  'NURSERY 1': { pension: 50000, dossier: [0] },
  'NURSERY 2': { pension: 50000, dossier: [0] },
  'PS': { pension: 45000, dossier: [0] },
  'MS': { pension: 45000, dossier: [0] },
  'GS': { pension: 45000, dossier: [0] },
  'SIL': { pension: 45000, dossier: [0] },
  'CP': { pension: 45000, dossier: [0] },
  'CE1': { pension: 45000, dossier: [0] },
  'CE2': { pension: 45000, dossier: [0] },
  'CM1': { pension: 45000, dossier: [0] },
  'CM2': { pension: 50000, dossier: [10000, 15000, 20000] },
  'CLASSE 1': { pension: 50000, dossier: [0] },
  'CLASSE 2': { pension: 50000, dossier: [0] },
  'CLASSE 3': { pension: 50000, dossier: [0] },
  'CLASSE 4': { pension: 50000, dossier: [0] },
  'CLASSE 5': { pension: 50000, dossier: [0] },
  'CLASSE 6': { pension: 55000, dossier: [10000, 15000, 20000] },
};

const INSCRIPTION_FIXE = 10000;

export default function EleveForm({ initialData, familles = [], onSubmit, onCancel, isLoading }) {
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    classe: '',
    idFamille: '',
    inscription: INSCRIPTION_FIXE.toString(),
    pension: '0',
    dossier: '0',
    reduction: '0',
    motifReduction: '',
  });

  // Montage côté client
  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.NOM || '',
        prenom: initialData.PRÉNOM || '',
        dateNaissance: initialData['DATE NAISS.'] || '',
        classe: initialData.CLASSE || '',
        idFamille: initialData['ID FAMILLE'] || '',
        inscription: initialData.INSCRIPTION?.toString() || INSCRIPTION_FIXE.toString(),
        pension: initialData.SCOLARITÉ?.toString() || '0',
        dossier: initialData.DOSSIER?.toString() || '0',
        reduction: '0',
        motifReduction: '',
      });
    }
    setMounted(true);
  }, [initialData]);

  // Calculer les tarifs automatiquement selon la classe
  useEffect(() => {
    if (formData.classe && TARIFS_CLASSES[formData.classe]) {
      const tarif = TARIFS_CLASSES[formData.classe];
      setFormData(prev => ({
        ...prev,
        pension: tarif.pension.toString(),
        // Garder le dossier actuel s'il est dans la liste, sinon prendre le premier
        dossier: tarif.dossier.includes(parseInt(prev.dossier))
          ? prev.dossier
          : tarif.dossier[0].toString()
      }));
    }
  }, [formData.classe]);

  // Options de frais de dossier selon la classe
  const optionsDossier = useMemo(() => {
    if (!formData.classe || !TARIFS_CLASSES[formData.classe]) {
      return [10000, 15000, 20000];
    }
    return TARIFS_CLASSES[formData.classe].dossier;
  }, [formData.classe]);

  // Calcul du total
  const totaux = useMemo(() => {
    const inscription = parseFloat(formData.inscription) || 0;
    const pension = parseFloat(formData.pension) || 0;
    const dossier = parseFloat(formData.dossier) || 0;
    const reduction = parseFloat(formData.reduction) || 0;

    const sousTotal = inscription + pension + dossier;
    const total = Math.max(0, sousTotal - reduction);

    return {
      sousTotal,
      reduction,
      total,
      economie: reduction > 0 ? ((reduction / sousTotal) * 100).toFixed(1) : 0
    };
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      alert('Le nom et le prénom sont obligatoires');
      return;
    }

    if (!formData.classe) {
      alert('La classe est obligatoire');
      return;
    }

    if (parseFloat(formData.reduction) > 0 && !formData.motifReduction.trim()) {
      alert('Veuillez indiquer le motif de la réduction');
      return;
    }

    const dataToSubmit = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      dateNaissance: formData.dateNaissance,
      classe: formData.classe,
      idFamille: formData.idFamille || '', // Optionnel
      inscription: formData.inscription,
      scolarite: formData.pension,
      dossier: formData.dossier,
      autres: formData.reduction > 0 ? `-${formData.reduction}` : '0', // Réduction en négatif
      totalDu: totaux.total.toString(),
      paye: initialData?.PAYÉ || '0',
      reste: (totaux.total - (parseFloat(initialData?.PAYÉ) || 0)).toString(),
      statut: initialData?.STATUT || 'EN ATTENTE',
      motifReduction: formData.motifReduction,
    };

    await onSubmit(dataToSubmit);
  };

  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Informations personnelles */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Informations de l'élève</h3>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              placeholder="Nom de l'élève"
              className="text-sm"
            />

            <Input
              label="Prénom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              placeholder="Prénom de l'élève"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Date de naissance"
              name="dateNaissance"
              type="date"
              value={formData.dateNaissance}
              onChange={handleChange}
              className="text-sm"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classe <span className="text-red-500">*</span>
              </label>
              <select
                name="classe"
                value={formData.classe}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner une classe</option>
                <optgroup label="Maternelle">
                  <option value="NURSERY 1">NURSERY 1</option>
                  <option value="NURSERY 2">NURSERY 2</option>
                  <option value="PS">PETITE SECTION</option>
                  <option value="MS">MOYENNE SECTION</option>
                  <option value="GS">GRANDE SECTION</option>
                </optgroup>
                <optgroup label="Primaire">
                  <option value="SIL">SIL</option>
                  <option value="CP">CP</option>
                  <option value="CE1">CE1</option>
                  <option value="CE2">CE2</option>
                  <option value="CM1">CM1</option>
                  <option value="CM2">CM2</option>
                </optgroup>
                <optgroup label="Secondaire">
                  <option value="CLASSE 1">CLASSE 1</option>
                  <option value="CLASSE 2">CLASSE 2</option>
                  <option value="CLASSE 3">CLASSE 3</option>
                  <option value="CLASSE 4">CLASSE 4</option>
                  <option value="CLASSE 5">CLASSE 5</option>
                  <option value="CLASSE 6">CLASSE 6</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Famille <span className="text-gray-400 text-xs">(Optionnel)</span>
            </label>
            <select
              name="idFamille"
              value={formData.idFamille}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Aucune famille</option>
              {familles.map((famille) => (
                <option key={famille.ID || famille.rowIndex} value={famille.ID || famille['ID FAMILLE']}>
                  {famille['NOM FAMILLE'] || famille.NOM_FAMILLE} (ID: {famille.ID || famille['ID FAMILLE']})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Frais de scolarité */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Frais de scolarité</h3>
        </div>

        {formData.classe && TARIFS_CLASSES[formData.classe] && (
          <div className="bg-white rounded-lg p-3 mb-4 border border-green-300">
            <div className="flex items-center gap-2 text-green-700 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Tarifs automatiques pour {formData.classe}</span>
            </div>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {/* Inscription (fixe) */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Frais d'inscription</p>
                <p className="text-xs text-gray-500">Montant fixe pour toutes les classes</p>
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('fr-FR').format(INSCRIPTION_FIXE)}
                </p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </div>
          </div>

          {/* Pension */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Pension annuelle</p>
                <p className="text-xs text-gray-500">
                  {formData.classe ? `Tarif classe ${formData.classe}` : 'Sélectionnez une classe'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('fr-FR').format(parseFloat(formData.pension) || 0)}
                </p>
                <p className="text-xs text-gray-500">FCFA</p>
              </div>
            </div>
          </div>

          {/* Frais de dossier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frais de dossier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {optionsDossier.map((montant) => (
                <button
                  key={montant}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, dossier: montant.toString() }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.dossier === montant.toString()
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(montant)}
                </button>
              ))}
            </div>
          </div>

          {/* Réduction */}
          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">Réduction (optionnel)</p>
            </div>

            <div className="space-y-3">
              <Input
                label="Montant de la réduction"
                name="reduction"
                type="number"
                value={formData.reduction}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="text-sm"
              />

              {parseFloat(formData.reduction) > 0 && (
                <Input
                  label="Motif de la réduction"
                  name="motifReduction"
                  value={formData.motifReduction}
                  onChange={handleChange}
                  placeholder="Ex: Bourse, situation familiale..."
                  required
                  className="text-sm"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Récapitulatif</h3>

        <div className="space-y-2 text-sm sm:text-base">
          <div className="flex justify-between">
            <span className="text-gray-600">Inscription</span>
            <span className="font-medium">{new Intl.NumberFormat('fr-FR').format(parseFloat(formData.inscription))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pension</span>
            <span className="font-medium">{new Intl.NumberFormat('fr-FR').format(parseFloat(formData.pension))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Frais de dossier</span>
            <span className="font-medium">{new Intl.NumberFormat('fr-FR').format(parseFloat(formData.dossier))}</span>
          </div>

          {totaux.reduction > 0 && (
            <>
              <div className="border-t border-purple-200 pt-2">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span className="font-medium">{new Intl.NumberFormat('fr-FR').format(totaux.sousTotal)}</span>
                </div>
              </div>
              <div className="flex justify-between text-yellow-600">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Réduction ({totaux.economie}%)
                </span>
                <span className="font-medium">-{new Intl.NumberFormat('fr-FR').format(totaux.reduction)}</span>
              </div>
            </>
          )}

          <div className="border-t border-purple-300 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total à payer</span>
              <span className="text-xl sm:text-2xl font-bold text-primary-600">
                {new Intl.NumberFormat('fr-FR').format(totaux.total)} FCFA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" loading={isLoading} fullWidth variant="success">
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