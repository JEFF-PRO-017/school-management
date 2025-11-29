'use client';

/**
 * Page de gestion des moratoires - Mobile First
 * Optimisé pour Android avec filtres par période
 */

import { useState, useEffect, useMemo } from 'react';
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
import TableAdvanced from '@/components/ui/TableAdvanced';
import { SyncStatus } from '@/components/ui/SyncStatus';
import MoratoireForm from '@/components/features/MoratoireForm';
import { useMoratoires } from '@/hooks/useMoratoires';
import { useFamilles } from '@/hooks/useFamilles';

export default function MoratoiresPage() {
  const router = useRouter();
  
  // Protection hydratation
  const [mounted, setMounted] = useState(false);
  
  // Hooks SWR
  const { 
    moratoires,
    filteredMoratoires,
    stats,
    isLoading,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Ajouter un moratoire
  const handleAddMoratoire = async (formData) => {
    setIsSubmitting(true);
    
    try {
      const result = await addMoratoire(formData);
      setShowAddModal(false);
      
      if (result.offline) {
        alert('Moratoire enregistré localement.');
      } else {
        alert('Moratoire accordé avec succès !');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout du moratoire');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Enrichir les moratoires avec les infos familles
  const moratoiresEnrichis = useMemo(() => {
    return filteredMoratoires.map(moratoire => {
      const famille = familles.find(f => 
        f.ID === moratoire['ID FAMILLE'] ||
        f['ID FAMILLE'] === moratoire['ID FAMILLE']
      );
      return { ...moratoire, famille };
    });
  }, [filteredMoratoires, familles]);
  
  // Colonnes du tableau - responsive
  const columns = [
    {
      header: 'Date',
      accessor: 'DATE',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
          <span>{row.DATE || row['DATE DÉBUT']}</span>
        </div>
      ),
    },
    {
      header: 'Famille',
      accessor: 'ID FAMILLE',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-sm sm:text-base truncate">
            {row.famille?.['NOM FAMILLE'] || row.famille?.NOM_FAMILLE || `Famille ${row['ID FAMILLE']}`}
          </p>
          <p className="text-xs text-gray-500">ID: {row['ID FAMILLE']}</p>
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
          <div className="space-y-1">
            <span className="text-xs sm:text-sm">{echeance}</span>
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
            <span className="hidden sm:inline">{statut}</span>
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
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/moratoires/${row.rowIndex}`);
          }}
          className="px-2 sm:px-3"
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      ),
    },
  ];
  
  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-4 p-3 sm:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Moratoires</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Échelonnements de paiements</p>
          </div>
          <SyncStatus />
        </div>
        
        <Button 
          onClick={() => setShowAddModal(true)}
          variant="warning"
          className="w-full py-4 text-base font-semibold shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Accorder un moratoire
        </Button>
      </div>
      
      {/* Stats en grille 2x2 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md">
          <p className="text-xs sm:text-sm text-gray-500 font-medium mb-2">Total</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-xs sm:text-sm text-amber-600 font-medium">En cours</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700">{stats.enCours}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-xs sm:text-sm text-red-600 font-medium">En retard</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.enRetard}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs sm:text-sm text-green-600 font-medium">Terminés</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.termines}</p>
        </div>
      </div>
      
      {/* Filtres par période */}
      <Card className="border-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700 text-sm">Filtrer par période</span>
          </div>
          
          {/* Présets - 2x2 sur mobile */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'this-month', label: 'Ce mois' },
              { key: 'last-month', label: 'Mois dernier' },
              { key: 'this-year', label: 'Cette année' },
            ].map(preset => (
              <button
                key={preset.key}
                onClick={() => setFilterPreset(preset.key)}
                className={`px-3 py-2 text-xs sm:text-sm rounded-lg font-medium transition-all active:scale-95 ${
                  !dateDebut && !dateFin && preset.key === 'all'
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          {/* Dates personnalisées */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="date"
              value={dateDebut || ''}
              onChange={(e) => setDateDebut(e.target.value || null)}
              className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Date début"
            />
            <span className="text-gray-400 text-center">→</span>
            <input
              type="date"
              value={dateFin || ''}
              onChange={(e) => setDateFin(e.target.value || null)}
              className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Date fin"
            />
            
            {/* Bouton clear */}
            {(dateDebut || dateFin) && (
              <button
                onClick={clearFilters}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Indicateur de filtre actif */}
        {(dateDebut || dateFin) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">
              📅 <span className="font-medium">{stats.filtered}</span> moratoire(s) affiché(s)
              {dateDebut && ` à partir du ${dateDebut}`}
              {dateFin && ` jusqu'au ${dateFin}`}
            </p>
          </div>
        )}
      </Card>
      
      {/* Information */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 w-5 h-5 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1 text-sm">À propos des moratoires</h3>
            <p className="text-xs text-amber-800">
              Un moratoire accorde un délai supplémentaire pour les paiements. 
              Utilisez les filtres pour afficher une période spécifique.
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
        <MoratoireForm
          onSubmit={handleAddMoratoire}
          onCancel={() => setShowAddModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}