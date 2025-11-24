'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, GraduationCap, AlertCircle, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import TableAdvanced from '@/components/ui/TableAdvanced';
import { SyncStatus } from '@/components/ui/SyncStatus';
import EleveForm from '@/components/features/EleveForm';
import PaiementForm from '@/components/features/PaiementForm';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { useEleves } from '@/hooks/useEleves';
import { useFamilles } from '@/hooks/useFamilles';
import { usePaiements } from '@/hooks/usePaiements';

export default function ElevesPage() {
  const router = useRouter();
  
  // Hooks SWR
  const { 
    eleves, 
    isLoading, 
    isValidating, 
    error, 
    addEleve, 
    refresh: refreshEleves 
  } = useEleves();
  
  const { familles } = useFamilles();
  const { addPaiement, refresh: refreshPaiements } = usePaiements();
  
  // États locaux pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddEleve = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await addEleve(data);
      setShowAddModal(false);
      
      if (result.offline) {
        alert('Élève ajouté localement. Il sera synchronisé à la reconnexion.');
      } else {
        alert('Élève ajouté avec succès !');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout de l\'élève');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePayment = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await addPaiement(data);
      
      // Rafraîchir les élèves car le solde change
      await refreshEleves();
      
      setShowPaymentModal(false);
      setSelectedEleve(null);
      
      if (result.offline) {
        alert('Paiement enregistré localement. Il sera synchronisé à la reconnexion.');
      } else {
        alert('Paiement enregistré avec succès !');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openPaymentModal = (eleve, e) => {
    e?.stopPropagation();
    setSelectedEleve(eleve);
    setShowPaymentModal(true);
  };

  const openDetailModal = (eleve) => {
    setSelectedEleve(eleve);
    setShowDetailModal(true);
  };

  const handleRefresh = () => {
    refreshEleves();
    refreshPaiements();
  };
  
  // Configuration des colonnes
  const columns = [
    {
      header: 'Élève',
      accessor: 'NOM',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            row._isOptimistic 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
              : 'bg-gradient-to-br from-primary-400 to-primary-600'
          }`}>
            {row.NOM?.charAt(0)}{row.PRÉNOM?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {row.NOM} {row.PRÉNOM}
              {row._isOptimistic && <span className="text-xs text-yellow-600 ml-2">(en attente)</span>}
            </p>
            <p className="text-xs text-gray-500">{row['DATE NAISS.'] || 'Date non renseignée'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Classe',
      accessor: 'CLASSE',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <GraduationCap className="w-3.5 h-3.5" />
          {row.CLASSE || '-'}
        </span>
      ),
    },
    {
      header: 'Famille',
      accessor: 'ID FAMILLE',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
          <Users className="w-3.5 h-3.5" />
          ID: {row['ID FAMILLE'] || '-'}
        </span>
      ),
    },
    {
      header: 'Total Dû',
      accessor: 'TOTAL DÛ',
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(row['TOTAL DÛ'] || 0)}
        </span>
      ),
    },
    {
      header: 'Payé',
      accessor: 'PAYÉ',
      render: (row) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(row.PAYÉ || 0)}
        </span>
      ),
    },
    {
      header: 'Reste',
      accessor: 'RESTE',
      render: (row) => {
        const reste = parseFloat(row.RESTE || 0);
        return (
          <span className={`font-bold ${reste > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(reste)}
          </span>
        );
      },
    },
    {
      header: 'Statut',
      accessor: 'STATUT',
      render: (row) => {
        const statut = row.STATUT || 'EN ATTENTE';
        return (
          <Badge variant={getStatusColor(statut)} size="sm">
            {statut}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => openPaymentModal(row, e)}
            disabled={row._isOptimistic}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            💰 Payer
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/eleves/${row.rowIndex}`);
            }}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Détails
          </button>
        </div>
      ),
    },
  ];
  
  // Statistiques
  const stats = {
    total: eleves.length,
    soldes: eleves.filter(e => e.STATUT === 'SOLDÉ').length,
    partiels: eleves.filter(e => e.STATUT === 'PARTIEL').length,
    enAttente: eleves.filter(e => e.STATUT === 'EN ATTENTE' || !e.STATUT).length,
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement des élèves...</p>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error && eleves.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div>
            <p className="text-red-600 font-medium">Erreur de chargement</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </div>
          <Button onClick={refreshEleves}>Réessayer</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
          <p className="text-gray-600 mt-1">Gérez les inscriptions et suivez les paiements</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus showDetails />
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={20} className="mr-2" />
            Nouvel élève
          </Button>
        </div>
      </div>
      
      {/* Indicateur de rafraîchissement */}
      {isValidating && (
        <div className="text-center text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Mise à jour en cours...
          </span>
        </div>
      )}
      
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total élèves</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <p className="text-sm text-green-600">Soldés</p>
          <p className="text-2xl font-bold text-green-700">{stats.soldes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm">
          <p className="text-sm text-yellow-600">Paiements partiels</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.partiels}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <p className="text-sm text-red-600">En attente</p>
          <p className="text-2xl font-bold text-red-700">{stats.enAttente}</p>
        </div>
      </div>
      
      {/* Table avancée */}
      <TableAdvanced
        columns={columns}
        data={eleves}
        onRowClick={openDetailModal}
        title="Liste des élèves"
        subtitle="Cliquez sur une ligne pour voir les détails"
        emptyMessage="Aucun élève enregistré"
        exportable={true}
        refreshable={true}
        onRefresh={handleRefresh}
      />
      
      {/* Modal Ajout Élève */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un nouvel élève"
        size="lg"
      >
        <EleveForm
          familles={familles}
          onSubmit={handleAddEleve}
          onCancel={() => setShowAddModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
      
      {/* Modal Paiement */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedEleve(null);
        }}
        title="Enregistrer un paiement"
        size="md"
      >
        {selectedEleve && (
          <PaiementForm
            eleve={selectedEleve}
            onSubmit={handlePayment}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedEleve(null);
            }}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEleve(null);
        }}
        title="Détails de l'élève"
        size="lg"
      >
        {selectedEleve && (
          <div className="space-y-6">
            {/* En-tête avec avatar */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                selectedEleve._isOptimistic 
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                  : 'bg-gradient-to-br from-primary-400 to-primary-600'
              }`}>
                {selectedEleve.NOM?.charAt(0)}{selectedEleve.PRÉNOM?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEleve.NOM} {selectedEleve.PRÉNOM}
                </h3>
                <p className="text-gray-500">{selectedEleve.CLASSE}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusColor(selectedEleve.STATUT)} size="sm">
                    {selectedEleve.STATUT || 'EN ATTENTE'}
                  </Badge>
                  {selectedEleve._isOptimistic && (
                    <Badge variant="warning" size="sm">En attente de sync</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Informations personnelles</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de naissance</span>
                    <span className="font-medium">{selectedEleve['DATE NAISS.'] || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Classe</span>
                    <span className="font-medium">{selectedEleve.CLASSE || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Famille</span>
                    <span className="font-medium">{selectedEleve['ID FAMILLE'] || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Situation financière</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inscription</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.INSCRIPTION || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scolarité</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.SCOLARITÉ || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dossier</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.DOSSIER || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Autres</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.AUTRES || 0)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total dû</span>
                      <span className="font-bold">{formatCurrency(selectedEleve['TOTAL DÛ'] || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé des paiements */}
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Total dû</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedEleve['TOTAL DÛ'] || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Payé</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(selectedEleve.PAYÉ || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-red-600">Reste</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(selectedEleve.RESTE || 0)}</p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (parseFloat(selectedEleve.PAYÉ || 0) / parseFloat(selectedEleve['TOTAL DÛ'] || 1)) * 100)}%` 
                    }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {Math.round((parseFloat(selectedEleve.PAYÉ || 0) / parseFloat(selectedEleve['TOTAL DÛ'] || 1)) * 100)}% payé
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button 
                variant="success" 
                onClick={() => {
                  setShowDetailModal(false);
                  openPaymentModal(selectedEleve);
                }}
                disabled={selectedEleve._isOptimistic}
                fullWidth
              >
                💰 Enregistrer un paiement
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowDetailModal(false)}
                fullWidth
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
