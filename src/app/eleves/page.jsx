'use client';

import { useState, useEffect } from 'react';
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
import { isAdmin } from '@/lib/device-id';

export default function ElevesPage() {
  const router = useRouter();

  // Protection hydratation
  const [mounted, setMounted] = useState(false);

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

  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Configuration des colonnes - responsive
  const columns = [
    {
      header: 'Élève',
      accessor: 'NOM',
      render: (row) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${row._isOptimistic
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
            : 'bg-gradient-to-br from-primary-400 to-primary-600'
            }`}>
            {row.NOM?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {row.NOM}
            </p>
            {row._isOptimistic && (
              <span className="text-xs text-yellow-600">En attente</span>
            )}
            <p className="text-xs text-gray-500 sm:hidden">{row.CLASSE}</p>
          </div>
        </div>
      ),
    },

    {
      header: 'PRÉNOM',
      accessor: 'PRÉNOM',
      render: (row) => (
        <div className="flex items-center gap-2 sm:gap-3">

          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {row.PRÉNOM}
            </p>
            {row._isOptimistic && (
              <span className="text-xs text-yellow-600">En attente</span>
            )}
            <p className="text-xs text-gray-500 sm:hidden">{row.rowIndex}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Classe',
      accessor: 'CLASSE',
      render: (row) => (
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm font-medium">
          <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          {row.CLASSE || '-'}
        </span>
      ),
    },
    {
      header: 'Total Dû',
      accessor: 'TOTAL DÛ',
      render: (row) => (
        <span className="font-semibold text-gray-900 text-xs sm:text-sm">
          {formatCurrency(row['TOTAL DÛ'] || 0)}
        </span>
      ),
    },
    {
      header: 'Reste',
      accessor: 'RESTE',
      render: (row) => {
        const reste = parseFloat(row.RESTE || 0);
        return (
          <span className={`font-bold text-xs sm:text-sm ${reste > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
            <span className="hidden sm:inline">{statut}</span>
            <span className="sm:hidden">{statut.substring(0, 3)}</span>
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={(e) => openPaymentModal(row, e)}
            disabled={row._isOptimistic}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <span className="hidden sm:inline">💰 Payer</span>
            <span className="sm:hidden">💰</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/eleves/${row.rowIndex}`);
            }}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Statistiques
  const stats = {
    total: eleves.length,
    soldes: eleves.filter(e => e.STATUT === '✅ PAYÉ').length,
    partiels: eleves.filter(e => e.STATUT === '⚠️ PARTIEL').length,
    enAttente: eleves.filter(e => e.STATUT === '❌ NON PAYÉ' || !e.STATUT).length,
  };

  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-6 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 text-sm sm:text-base">Chargement des élèves...</p>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error && eleves.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 p-4">
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gérez les inscriptions et suivez les paiements</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <SyncStatus showDetails />
          {isAdmin() && <Button onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-initial">
            <Plus size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">Nouvel élève</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>}
        </div>
      </div>

      {/* Indicateur de rafraîchissement */}
      {isValidating && (
        <div className="text-center text-xs sm:text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Mise à jour...
          </span>
        </div>
      )}

      {/* Stats rapides - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 shadow-sm">
          <p className="text-xs sm:text-sm text-green-600">Soldés</p>
          <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.soldes}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200 shadow-sm">
          <p className="text-xs sm:text-sm text-yellow-600">Partiels</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-700">{stats.partiels}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200 shadow-sm">
          <p className="text-xs sm:text-sm text-red-600">Attente</p>
          <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.enAttente}</p>
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

      {/* Modal Détails - Responsive */}
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
          <div className="space-y-4 sm:space-y-6">
            {/* En-tête avec avatar */}
            <div className="flex items-center gap-3 sm:gap-4 pb-4 border-b border-gray-200">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl ${selectedEleve._isOptimistic
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                : 'bg-gradient-to-br from-primary-400 to-primary-600'
                }`}>
                {selectedEleve.NOM?.charAt(0)}{selectedEleve.PRÉNOM?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {selectedEleve.NOM} {selectedEleve.PRÉNOM}
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">{selectedEleve.CLASSE}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={getStatusColor(selectedEleve.STATUT)} size="sm">
                    {selectedEleve.STATUT || 'EN ATTENTE'}
                  </Badge>
                  {selectedEleve._isOptimistic && (
                    <Badge variant="warning" size="sm">En attente de sync</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Informations - Responsive */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Informations personnelles</h4>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date de naissance</span>
                    <span className="font-medium">{selectedEleve['DATE NAISS.'] || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Classe</span>
                    <span className="font-medium">{selectedEleve.CLASSE || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ID Famille</span>
                    <span className="font-medium">{selectedEleve['ID FAMILLE'] || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Situation financière</h4>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inscription</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.INSCRIPTION || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Scolarité</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.SCOLARITÉ || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dossier</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.DOSSIER || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Autres</span>
                    <span className="font-medium">{formatCurrency(selectedEleve.AUTRES || 0)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-base sm:text-lg">
                      <span className="font-semibold">Total dû</span>
                      <span className="font-bold">{formatCurrency(selectedEleve['TOTAL DÛ'] || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé des paiements */}
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total dû</p>
                  <p className="text-base sm:text-xl font-bold text-gray-900">{formatCurrency(selectedEleve['TOTAL DÛ'] || 0)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-green-600">Payé</p>
                  <p className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(selectedEleve.PAYÉ || 0)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-red-600">Reste</p>
                  <p className="text-base sm:text-xl font-bold text-red-700">{formatCurrency(selectedEleve.RESTE || 0)}</p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-4">
                <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (parseFloat(selectedEleve.PAYÉ || 0) / parseFloat(selectedEleve['TOTAL DÛ'] || 1)) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">
                  {Math.round((parseFloat(selectedEleve.PAYÉ || 0) / parseFloat(selectedEleve['TOTAL DÛ'] || 1)) * 100)}% payé
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
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