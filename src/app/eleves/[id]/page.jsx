'use client';

/**
 * Page de gestion des élèves - Mobile First Ultra Simple
 * Optimisé pour Android avec édition en modal
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, GraduationCap, Eye, Edit, X, Save } from 'lucide-react';
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
  
  // Protection hydratation
  const [mounted, setMounted] = useState(false);
  
  // Hooks SWR
  const { 
    eleves, 
    isLoading, 
    addEleve,
    updateEleve,
    refresh: refreshEleves 
  } = useEleves();
  
  const { familles } = useFamilles();
  const { addPaiement, refresh: refreshPaiements } = usePaiements();
  
  // États locaux
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  
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
        alert('Élève ajouté localement.');
      } else {
        alert('Élève ajouté avec succès !');
      }
    } catch (error) {
      alert('Erreur lors de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateEleve = async () => {
    if (!editData || !selectedEleve) return;
    
    setIsSubmitting(true);
    try {
      await updateEleve(selectedEleve.rowIndex, editData);
      setIsEditing(false);
      setEditData(null);
      alert('Élève mis à jour avec succès !');
      
      // Rafraîchir et fermer
      await refreshEleves();
      setShowDetailModal(false);
      setSelectedEleve(null);
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePayment = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await addPaiement(data);
      await refreshEleves();
      
      setShowPaymentModal(false);
      setSelectedEleve(null);
      
      if (result.offline) {
        alert('Paiement enregistré localement.');
      } else {
        alert('Paiement enregistré avec succès !');
      }
    } catch (error) {
      alert('Erreur lors du paiement');
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
    setEditData({
      NOM: eleve.NOM,
      PRÉNOM: eleve.PRÉNOM,
      CLASSE: eleve.CLASSE,
      'DATE NAISS.': eleve['DATE NAISS.'],
      'ID FAMILLE': eleve['ID FAMILLE'],
    });
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const handleRefresh = () => {
    refreshEleves();
    refreshPaiements();
  };
  
  // Colonnes du tableau
  const columns = [
    {
      header: 'Élève',
      accessor: 'NOM',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {row.NOM?.charAt(0)}{row.PRÉNOM?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {row.NOM} {row.PRÉNOM}
            </p>
            <p className="text-xs text-gray-500 sm:hidden">{row.CLASSE}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Classe',
      accessor: 'CLASSE',
      render: (row) => (
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
          <GraduationCap className="w-3 h-3" />
          {row.CLASSE || '-'}
        </span>
      ),
    },
    {
      header: 'Reste',
      accessor: 'RESTE',
      render: (row) => {
        const reste = parseFloat(row.RESTE || 0);
        return (
          <span className={`font-bold text-sm ${reste > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(reste, true)}
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
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => openPaymentModal(row, e)}
            className="px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 active:scale-95"
          >
            💰
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDetailModal(row);
            }}
            className="px-2 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 active:scale-95"
          >
            <Eye className="w-3 h-3" />
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Élèves</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">{stats.total} élèves</p>
          </div>
          <SyncStatus />
        </div>
        
        <Button 
          onClick={() => setShowAddModal(true)}
          className="w-full py-4 text-base font-semibold shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvel élève
        </Button>
      </div>
      
      {/* Stats en grille 2x2 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md">
          <p className="text-xs sm:text-sm text-gray-500 font-medium mb-2">Total</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-md">
          <p className="text-xs sm:text-sm text-green-600 font-medium mb-2">Soldés</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.soldes}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-yellow-200 shadow-md">
          <p className="text-xs sm:text-sm text-yellow-600 font-medium mb-2">Partiels</p>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{stats.partiels}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-md">
          <p className="text-xs sm:text-sm text-red-600 font-medium mb-2">Attente</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.enAttente}</p>
        </div>
      </div>
      
      {/* Tableau */}
      <TableAdvanced
        columns={columns}
        data={eleves}
        onRowClick={openDetailModal}
        title="Liste des élèves"
        subtitle="Cliquez pour voir les détails"
        emptyMessage="Aucun élève enregistré"
        exportable={true}
        refreshable={true}
        onRefresh={handleRefresh}
      />
      
      {/* Modal Ajout */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nouvel élève"
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
        title="Nouveau paiement"
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

      {/* Modal Détails SIMPLIFIÉ */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEleve(null);
          setIsEditing(false);
          setEditData(null);
        }}
        title={isEditing ? "Modifier l'élève" : "Détails de l'élève"}
        size="md"
      >
        {selectedEleve && (
          <div className="space-y-4">
            {/* Avatar + Nom */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {selectedEleve.NOM?.charAt(0)}{selectedEleve.PRÉNOM?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                {!isEditing ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {selectedEleve.NOM} {selectedEleve.PRÉNOM}
                    </h3>
                    <p className="text-gray-500">{selectedEleve.CLASSE}</p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editData.NOM}
                      onChange={(e) => setEditData({...editData, NOM: e.target.value})}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                      placeholder="Nom"
                    />
                    <input
                      type="text"
                      value={editData.PRÉNOM}
                      onChange={(e) => setEditData({...editData, PRÉNOM: e.target.value})}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                      placeholder="Prénom"
                    />
                  </div>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg active:scale-95"
                >
                  {/* <Edit className="w-5 h-5" /> */}
                </button>
              )}
            </div>

            {/* Infos - Mode Lecture */}
            {!isEditing && (
              <>
                {/* Infos de base */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Classe</span>
                    <span className="font-medium">{selectedEleve.CLASSE || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date naiss.</span>
                    <span className="font-medium">{selectedEleve['DATE NAISS.'] || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Famille</span>
                    <span className="font-medium">{selectedEleve['ID FAMILLE'] || '-'}</span>
                  </div>
                </div>

                {/* Situation financière */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedEleve['TOTAL DÛ'], true)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Payé</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(selectedEleve.PAYÉ, true)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-red-600">Reste</p>
                      <p className="text-lg font-bold text-red-700">
                        {formatCurrency(selectedEleve.RESTE, true)}
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (parseFloat(selectedEleve.PAYÉ || 0) / parseFloat(selectedEleve['TOTAL DÛ'] || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-center text-xs text-gray-600">
                      {Math.round((parseFloat(selectedEleve.PAYÉ || 0) / parseFloat(selectedEleve['TOTAL DÛ'] || 1)) * 100)}% payé
                    </p>
                  </div>
                </div>

                {/* Statut */}
                <div className="flex justify-center">
                  <Badge variant={getStatusColor(selectedEleve.STATUT)} size="lg">
                    {selectedEleve.STATUT || 'EN ATTENTE'}
                  </Badge>
                </div>
              </>
            )}

            {/* Infos - Mode Édition */}
            {isEditing && editData && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                  <select
                    value={editData.CLASSE}
                    onChange={(e) => setEditData({...editData, CLASSE: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                  >
                    <optgroup label="Maternelle">
                      <option>NURSERY 1</option>
                      <option>NURSERY 2</option>
                      <option>MATERNELLE</option>
                    </optgroup>
                    <optgroup label="Primaire">
                      <option>SIL</option>
                      <option>CP</option>
                      <option>CE1</option>
                      <option>CE2</option>
                      <option>CM1</option>
                      <option>CM2</option>
                    </optgroup>
                    <optgroup label="Secondaire">
                      <option>CLASSE 1</option>
                      <option>CLASSE 2</option>
                      <option>CLASSE 3</option>
                      <option>CLASSE 4</option>
                      <option>CLASSE 5</option>
                      <option>CLASSE 6</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date naissance</label>
                  <input
                    type="date"
                    value={editData['DATE NAISS.']}
                    onChange={(e) => setEditData({...editData, 'DATE NAISS.': e.target.value})}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Famille</label>
                  <select
                    value={editData['ID FAMILLE']}
                    onChange={(e) => setEditData({...editData, 'ID FAMILLE': e.target.value})}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Sans famille</option>
                    {familles.map(f => (
                      <option key={f.rowIndex} value={f.ID || f['ID FAMILLE']}>
                        {f['NOM FAMILLE'] || f.NOM_FAMILLE}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              {!isEditing ? (
                <>
                  <Button 
                    variant="success" 
                    onClick={() => {
                      setShowDetailModal(false);
                      openPaymentModal(selectedEleve);
                    }}
                    fullWidth
                    className="py-3"
                  >
                    💰 Enregistrer un paiement
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDetailModal(false)}
                    fullWidth
                    className="py-3"
                  >
                    Fermer
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleUpdateEleve}
                    disabled={isSubmitting}
                    fullWidth
                    className="py-3"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        NOM: selectedEleve.NOM,
                        PRÉNOM: selectedEleve.PRÉNOM,
                        CLASSE: selectedEleve.CLASSE,
                        'DATE NAISS.': selectedEleve['DATE NAISS.'],
                        'ID FAMILLE': selectedEleve['ID FAMILLE'],
                      });
                    }}
                    fullWidth
                    className="py-3"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}