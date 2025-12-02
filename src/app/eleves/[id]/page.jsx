'use client';

/**
 * Page de détail d'un élève - Mobile First
 * Optimisé pour Android avec protection hydratation
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  Calendar,
  CreditCard,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import TableAdvanced from '@/components/ui/TableAdvanced';
import PaiementForm from '@/components/features/PaiementForm';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { useEleves } from '@/hooks/useEleves';
import { usePaiements } from '@/hooks/usePaiements';
import { useFamilles } from '@/hooks/useFamilles';
import { isAdmin } from '@/lib/device-id';

export default function ShowElevePage() {
  const params = useParams();
  const router = useRouter();

  // Protection hydratation
  const [mounted, setMounted] = useState(false);

  // États locaux
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks SWR
  const { eleves, isLoading: loadingEleves, updateEleve, deleteEleve } = useEleves();
  const { paiements, isLoading: loadingPaiements, addPaiement } = usePaiements();
  const { familles } = useFamilles();

  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parser l'ID après le montage
  const eleveId = mounted ? parseInt(params.id) : null;

  // Trouver l'élève
  const eleve = useMemo(() => {
    if (!mounted || !eleveId) return null;
    return eleves.find(e => e.rowIndex === eleveId);
  }, [eleves, eleveId, mounted]);

  // Trouver la famille
  const famille = useMemo(() => {
    if (!eleve) return null;
    return familles.find(f =>
      f.ID === eleve['ID FAMILLE'] ||
      f['ID FAMILLE'] === eleve['ID FAMILLE']
    );
  }, [eleve, familles]);

  // Paiements de cet élève
  const elevePaiements = useMemo(() => {
    if (!eleve) return [];
    return paiements.filter(p =>
      p['ID ÉLÈVE'] === eleve.rowIndex?.toString() ||
      p['idEleve'] === eleve.rowIndex?.toString() ||
      p['NOM ÉLÈVE']?.toLowerCase().includes(eleve.NOM?.toLowerCase())
    ).sort((a, b) => {
      const dateA = new Date(a.DATE?.split('/').reverse().join('-') || 0);
      const dateB = new Date(b.DATE?.split('/').reverse().join('-') || 0);
      return dateB - dateA;
    });
  }, [paiements, eleve]);

  // Gérer le paiement
  const handlePayment = async (data) => {
    setIsSubmitting(true);
    try {
      await addPaiement(data);
      setShowPaymentModal(false);
      alert('Paiement enregistré avec succès !');
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer l'élève
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteEleve(eleveId);
      router.push('/eleves');
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Colonnes pour les paiements - responsive
  const paiementsColumns = [
    {
      header: 'Date',
      accessor: 'DATE',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <span>{row.DATE}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'TYPE',
      render: (row) => {
        const type = row.TYPE || row.type || 'ESPECES';
        const colors = {
          ESPECES: 'success',
          CHEQUE: 'primary',
          VIREMENT: 'warning',
          MOBILE_MONEY: 'primary',
        };
        return <Badge variant={colors[type] || 'gray'} size="sm">{type}</Badge>;
      },
    },
    {
      header: 'Montant',
      accessor: 'MONTANT PAYÉ',
      render: (row) => (
        <span className="font-bold text-green-600 text-sm sm:text-base">
          {formatCurrency(row['MONTANT PAYÉ'] || row.montantPaye)}
        </span>
      ),
    },
  ];

  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-4 p-3 sm:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Chargement
  if (loadingEleves || loadingPaiements) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Élève non trouvé
  if (!eleve) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 text-center">Élève non trouvé</h2>
        <p className="text-gray-500 text-center">L'élève demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => router.push('/eleves')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  // Calculs
  const totalDu = parseFloat(eleve['TOTAL DÛ'] || 0);
  const paye = parseFloat(eleve.PAYÉ || 0);
  const reste = parseFloat(eleve.RESTE || 0);
  const pourcentage = totalDu > 0 ? Math.round((paye / totalDu) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-3 sm:p-0">
      {/* Header mobile */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/eleves')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        <div className="flex items-center gap-2">

          {isAdmin() &&
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Payer</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="px-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          }
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* En-tête avec avatar */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl sm:text-2xl border-4 border-white/30 flex-shrink-0">
              {eleve.NOM?.charAt(0)}{eleve.PRÉNOM?.charAt(0)}
            </div>
            <div className="text-white min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {eleve.NOM} {eleve.PRÉNOM}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                  {eleve.CLASSE || 'Non assigné'}
                </span>
                {eleve['DATE NAISS.'] && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    {eleve['DATE NAISS.']}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <Badge
                  variant={eleve.STATUT === 'SOLDÉ' ? 'success' : eleve.STATUT === 'PARTIEL' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {eleve.STATUT || 'EN ATTENTE'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Résumé financier - priorité mobile */}
          <div className="bg-gradient-to-br from-green-50 to-primary-50 rounded-2xl p-4 sm:p-6 shadow-md">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Paiements
            </h3>

            <div className="text-center mb-4">
              <div className="text-4xl sm:text-5xl font-bold text-gray-900">{pourcentage}%</div>
              <div className="text-sm text-gray-600">payé</div>
            </div>

            {/* Barre de progression */}
            <div className="h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${pourcentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-white/80 rounded-xl">
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  {formatCurrency(paye, true)}
                </div>
                <div className="text-xs text-gray-600">Payé</div>
              </div>
              <div className="text-center p-3 bg-white/80 rounded-xl">
                <div className="text-lg sm:text-xl font-bold text-red-600">
                  {formatCurrency(reste, true)}
                </div>
                <div className="text-xs text-gray-600">Reste</div>
              </div>
            </div>

            <Button
              variant="success"
              fullWidth
              onClick={() => setShowPaymentModal(true)}
              className="py-3 sm:py-4 text-base font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Enregistrer un paiement
            </Button>
          </div>

          {/* Informations - grid 1 col mobile, 2 cols desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-primary-600" />
                Informations
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <InfoRow label="Nom" value={eleve.NOM} />
                <InfoRow label="Prénom" value={eleve.PRÉNOM} />
                <InfoRow label="Naissance" value={eleve['DATE NAISS.']} />
                <InfoRow label="Classe" value={eleve.CLASSE} />
                <InfoRow label="ID Famille" value={eleve['ID FAMILLE']} />
              </div>

              {/* Infos famille */}
              {famille && (
                <div className="mt-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-primary-600" />
                    Famille
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <InfoRow label="Nom" value={famille['NOM FAMILLE'] || famille.NOM_FAMILLE} />
                    <InfoRow
                      label="Contact"
                      value={famille.CONTACT || famille.TELEPHONE}
                      icon={<Phone className="w-4 h-4" />}
                    />
                    {famille.EMAIL && (
                      <InfoRow
                        label="Email"
                        value={famille.EMAIL}
                        icon={<Mail className="w-4 h-4" />}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Frais de scolarité */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-primary-600" />
                Frais de scolarité
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <InfoRow label="Inscription" value={formatCurrency(eleve.INSCRIPTION || 0)} />
                <InfoRow label="Scolarité" value={formatCurrency(eleve.SCOLARITÉ || 0)} />
                <InfoRow label="Dossier" value={formatCurrency(eleve.DOSSIER || 0)} />
                {eleve.AUTRES > 0 && (
                  <InfoRow label="Autres" value={formatCurrency(eleve.AUTRES || 0)} />
                )}
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <InfoRow
                    label="Total dû"
                    value={formatCurrency(totalDu)}
                    valueClass="text-lg font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      <TableAdvanced
        columns={paiementsColumns}
        data={elevePaiements}
        title="Historique des paiements"
        subtitle={`${elevePaiements.length} paiement(s)`}
        emptyMessage="Aucun paiement enregistré"
        exportable={true}
      />

      {/* Modal Paiement */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Nouveau paiement"
        size="md"
      >
        <PaiementForm
          eleve={eleve}
          onSubmit={handlePayment}
          onCancel={() => setShowPaymentModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Modal Suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'élève"
        size="sm"
      >
        <div className="text-center py-4 px-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Supprimer {eleve.NOM} {eleve.PRÉNOM} ?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Cette action est irréversible. Toutes les données seront supprimées.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
              className="py-3"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDelete}
              disabled={isSubmitting}
              className="py-3"
            >
              {isSubmitting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Composant pour afficher une ligne d'info
function InfoRow({ label, value, icon, valueClass = '' }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`text-xs sm:text-sm font-medium text-right truncate ${valueClass}`}>
        {value || '-'}
      </span>
    </div>
  );
}