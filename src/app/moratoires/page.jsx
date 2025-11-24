'use client';

/**
 * Page de gestion des moratoires
 * Avec filtres par période et tableau avancé
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  X,
  Eye
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import TableAdvanced from '@/components/ui/TableAdvanced';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { formatCurrency } from '@/lib/utils';
import { useMoratoires } from '@/hooks/useMoratoires';
import { useFamilles } from '@/hooks/useFamilles';

export default function MoratoiresPage() {
  const router = useRouter();
  
  // Hooks SWR
  const { 
    moratoires,
    filteredMoratoires,
    stats,
    isLoading,
    isValidating,
    dateDebut,
    dateFin,
    setDateDebut,
    setDateFin,
    setFilterPreset,
    clearFilters,
    addMoratoire,
    refresh
  } = useMoratoires();
  
  const { familles } = useFamilles();
  
  // États locaux
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    idFamille: '',
    date: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    notes: '',
  });
  
  // Ajouter un moratoire
  const handleAddMoratoire = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await addMoratoire(formData);
      setShowAddModal(false);
      setFormData({
        idFamille: '',
        date: new Date().toISOString().split('T')[0],
        dateEcheance: '',
        notes: '',
      });
      
      if (result.offline) {
        alert('Moratoire enregistré localement. Il sera synchronisé à la reconnexion.');
      } else {
        alert('Moratoire ajouté avec succès !');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout du moratoire');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Enrichir les moratoires avec les infos familles
  const moratoiresEnrichis = filteredMoratoires.map(moratoire => {
    const famille = familles.find(f => 
      f.ID === moratoire['ID FAMILLE'] ||
      f['ID FAMILLE'] === moratoire['ID FAMILLE']
    );
    return { ...moratoire, famille };
  });
  
  // Colonnes du tableau
  const columns = [
    {
      header: 'N°',
      accessor: 'ID',
      render: (row) => (
        <Badge variant="warning" size="sm">
          #{row.ID || row['N° MORATOIRE'] || row.rowIndex}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessor: 'DATE',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{row.DATE || row['DATE DÉBUT']}</span>
        </div>
      ),
    },
    {
      header: 'Échéance',
      accessor: 'DATE ECHEANCE',
      render: (row) => {
        const echeance = row['DATE ECHEANCE'] || row['DATE FIN'];
        if (!echeance) return '-';
        
        // Calculer si en retard
        const dateEch = new Date(echeance.split('/').reverse().join('-'));
        const today = new Date();
        const joursRestants = Math.ceil((dateEch - today) / (1000 * 60 * 60 * 24));
        
        return (
          <div className="flex items-center gap-2">
            <span>{echeance}</span>
            {joursRestants < 0 && (
              <Badge variant="danger" size="sm">En retard</Badge>
            )}
            {joursRestants >= 0 && joursRestants <= 7 && (
              <Badge variant="warning" size="sm">{joursRestants}j</Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Famille',
      accessor: 'ID FAMILLE',
      render: (row) => (
        <div>
          <p className="font-medium">
            {row.famille?.['NOM FAMILLE'] || row.famille?.NOM_FAMILLE || `Famille ${row['ID FAMILLE']}`}
          </p>
          <p className="text-xs text-gray-500">ID: {row['ID FAMILLE']}</p>
        </div>
      ),
    },
    {
      header: 'Statut',
      accessor: 'STATUT',
      render: (row) => {
        const statut = row.STATUT || 'EN COURS';
        const variants = {
          'TERMINÉ': 'success',
          'EN RETARD': 'danger',
          'EN COURS': 'warning',
        };
        const icons = {
          'TERMINÉ': <CheckCircle className="w-3 h-3" />,
          'EN RETARD': <AlertTriangle className="w-3 h-3" />,
          'EN COURS': <Clock className="w-3 h-3" />,
        };
        return (
          <Badge variant={variants[statut] || 'warning'} size="sm" className="inline-flex items-center gap-1">
            {icons[statut]}
            {statut}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => router.push(`/moratoires/${row.rowIndex}`)}
        >
          <Eye className="w-4 h-4 mr-1" />
          Voir
        </Button>
      ),
    },
  ];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement des moratoires...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Moratoires</h1>
          <p className="text-gray-600 mt-1">
            Échelonnement et report de paiements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus showDetails />
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={20} className="mr-2" />
            Nouveau moratoire
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-600">En cours</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.enCours}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600">En retard</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.enRetard}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-600">Terminés</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.termines}</p>
        </div>
      </div>
      
      {/* Filtres par période */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Filtrer par période</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Présets */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Tous' },
                { key: 'this-month', label: 'Ce mois' },
                { key: 'last-month', label: 'Mois dernier' },
                { key: 'this-year', label: 'Cette année' },
              ].map(preset => (
                <button
                  key={preset.key}
                  onClick={() => setFilterPreset(preset.key)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    !dateDebut && !dateFin && preset.key === 'all'
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {/* Dates personnalisées */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateDebut || ''}
                onChange={(e) => setDateDebut(e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Date début"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={dateFin || ''}
                onChange={(e) => setDateFin(e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Date fin"
              />
            </div>
            
            {/* Bouton clear */}
            {(dateDebut || dateFin) && (
              <button
                onClick={clearFilters}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Indicateur de filtre actif */}
        {(dateDebut || dateFin) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              📅 Affichage de <span className="font-medium">{stats.filtered}</span> moratoire(s) 
              {dateDebut && ` à partir du ${dateDebut}`}
              {dateFin && ` jusqu'au ${dateFin}`}
            </p>
          </div>
        )}
      </Card>
      
      {/* Information */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">À propos des moratoires</h3>
            <p className="text-sm text-amber-800">
              Un moratoire permet d'accorder un délai supplémentaire à une famille pour le paiement des frais de scolarité. 
              Utilisez les filtres ci-dessus pour afficher les moratoires d'une période spécifique.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Tableau */}
      <TableAdvanced
        columns={columns}
        data={moratoiresEnrichis}
        onRowClick={(row) => router.push(`/moratoires/${row.rowIndex}`)}
        title="Liste des moratoires"
        subtitle={`${stats.filtered} moratoire(s) ${(dateDebut || dateFin) ? 'filtré(s)' : ''}`}
        emptyMessage="Aucun moratoire pour cette période"
        exportable={true}
        refreshable={true}
        onRefresh={refresh}
      />
      
      {/* Modal Ajout Moratoire */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Accorder un moratoire"
        size="md"
      >
        <form onSubmit={handleAddMoratoire} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex gap-2">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-amber-800 font-medium mb-1">Information importante</p>
                <p className="text-xs text-amber-700">
                  En accordant un moratoire, vous donnez à la famille un délai supplémentaire pour effectuer les paiements. 
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Famille concernée <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.idFamille}
              onChange={(e) => setFormData({ ...formData, idFamille: e.target.value })}
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Sélectionner une famille</option>
              {familles.map((famille) => (
                <option key={famille.rowIndex} value={famille.ID || famille['ID FAMILLE']}>
                  {famille['NOM FAMILLE'] || famille.NOM_FAMILLE} (ID: {famille.ID || famille['ID FAMILLE']})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date d'accord"
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Date d'échéance"
              name="dateEcheance"
              type="date"
              value={formData.dateEcheance}
              onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Raison du moratoire, conditions, etc."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="warning" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Accorder le moratoire'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              fullWidth
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
