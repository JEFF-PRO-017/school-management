'use client';

/**
 * Page de détail d'une famille - Mobile First
 * Optimisé pour Android avec protection hydratation
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Trash2,
  AlertCircle,
  GraduationCap,
  Eye
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import TableAdvanced from '@/components/ui/TableAdvanced';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { useFamilles } from '@/hooks/useFamilles';
import { useEleves } from '@/hooks/useEleves';
import { usePaiements } from '@/hooks/usePaiements';
import { isAdmin } from '@/lib/device-id';

export default function ShowFamillePage() {
  const params = useParams();
  const router = useRouter();

  // Protection hydratation
  const [mounted, setMounted] = useState(false);

  // États locaux
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks SWR
  const { familles, isLoading: loadingFamilles, deleteFamille } = useFamilles();
  const { eleves, isLoading: loadingEleves } = useEleves();
  const { paiements } = usePaiements();

  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parser l'ID après le montage
  const familleId = mounted ? parseInt(params.id) : null;

  // Trouver la famille
  const famille = useMemo(() => {
    if (!mounted || !familleId) return null;
    return familles.find(f => f.rowIndex === familleId);
  }, [familles, familleId, mounted]);

  // Enfants de cette famille
  const enfants = useMemo(() => {
    if (!famille) return [];
    return eleves.filter(e =>
      e['ID FAMILLE'] === famille.ID
      // e['ID FAMILLE'] === famille['ID FAMILLE'] ||
      // e['ID FAMILLE'] === famille.rowIndex?.toString()
    );
  }, [eleves, famille]);

  // Paiements de cette famille
  const famillePaiements = useMemo(() => {
    if (!famille) return [];
    return paiements.filter(p =>
      p['ID FAMILLE'] === famille.ID
      // ||
      // p['ID FAMILLE'] === famille['ID FAMILLE'] ||
      // p.idFamille === famille.ID ||
      // p.idFamille === famille['ID FAMILLE']
    ).sort((a, b) => {
      const dateA = new Date(a.DATE?.split('/').reverse().join('-') || 0);
      const dateB = new Date(b.DATE?.split('/').reverse().join('-') || 0);
      return dateB - dateA;
    });
  }, [paiements, famille]);

  // Supprimer la famille
  const handleDelete = async () => {
    if (enfants.length > 0) {
      alert('Impossible de supprimer une famille avec des enfants inscrits.');
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteFamille(familleId);
      router.push('/familles');
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Colonnes pour les enfants - responsive
  const enfantsColumns = [
    {
      header: 'Élève',
      accessor: 'NOM',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
            {row.NOM?.charAt(0)}{row.PRÉNOM?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {row.NOM} {row.PRÉNOM}
            </p>
            <p className="text-xs text-gray-500">{row['DATE NAISS.']}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Classe',
      accessor: 'CLASSE',
      render: (row) => (
        <Badge variant="primary" size="sm">
          <GraduationCap className="w-3 h-3 mr-1 hidden sm:inline" />
          {row.CLASSE || '-'}
        </Badge>
      ),
    },
    {
      header: 'Reste',
      accessor: 'RESTE',
      render: (row) => (
        <div className="text-right">
          <p className="text-red-600 font-bold text-sm sm:text-base">
            {formatCurrency(row.RESTE || 0, true)}
          </p>
        </div>
      ),
    },
    {
      header: 'Statut',
      accessor: 'STATUT',
      render: (row) => (
        <Badge variant={getStatusColor(row.STATUT)} size="sm">
          <span className="hidden sm:inline">{row.STATUT || 'EN ATTENTE'}</span>
          <span className="sm:hidden">{(row.STATUT || 'EN ATTENTE').substring(0, 3)}</span>
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/eleves/${row.rowIndex}`);
          }}
          className="px-2"
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      ),
    },
  ];

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
      header: 'Élève',
      accessor: 'NOM ÉLÈVE',
      render: (row) => (
        <span className="text-xs sm:text-sm truncate">
          {row['NOM ÉLÈVE'] || row.nomEleve}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: 'TYPE',
      render: (row) => (
        <Badge variant="gray" size="sm">
          {row.TYPE || row.type || 'ESPECES'}
        </Badge>
      ),
    },
    {
      header: 'Montant',
      accessor: 'MONTANT PAYÉ',
      render: (row) => (
        <span className="font-bold text-green-600 text-sm sm:text-base whitespace-nowrap">
          {formatCurrency(row['MONTANT PAYÉ'] || row.montantPaye, true)}
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
  if (loadingFamilles || loadingEleves) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Famille non trouvée
  if (!famille) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 text-center">Famille non trouvée</h2>
        <Button onClick={() => router.push('/familles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  // Calculs
  const totalDuFamille = enfants.reduce((sum, e) => sum + parseFloat(e['TOTAL DÛ'] || 0), 0);
  const totalPayeFamille = enfants.reduce((sum, e) => sum + parseFloat(e.PAYÉ || 0), 0);
  const totalResteFamille = enfants.reduce((sum, e) => sum + parseFloat(e.RESTE || 0), 0);
  const pourcentage = totalDuFamille > 0 ? Math.round((totalPayeFamille / totalDuFamille) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-3 sm:p-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/familles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        {isAdmin() && <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="px-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>}
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white border-4 border-white/30 flex-shrink-0">
              <Users className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="text-white min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {famille['NOM FAMILLE'] || famille.NOM_FAMILLE || `Famille ${famille.ID}`}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm opacity-90">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{enfants.length} enfant{enfants.length > 1 ? 's' : ''}</span>
              </div>
              <div className="mt-2">
                <Badge
                  variant={famille.STATUT === 'SOLDÉ' ? 'success' : famille.STATUT === 'PARTIEL' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {famille.STATUT || 'EN ATTENTE'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Résumé financier - priorité mobile */}
          <div className="bg-gradient-to-br from-green-50 to-purple-50 rounded-2xl p-4 sm:p-6 shadow-md">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-green-600" />
              Situation financière
            </h3>

            <div className="text-center mb-4">
              <div className="text-4xl sm:text-5xl font-bold text-gray-900">{pourcentage}%</div>
              <div className="text-sm text-gray-600">payé globalement</div>
            </div>

            <div className="h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${pourcentage}%` }}
              />
            </div>

            <div className="space-y-2 bg-white/60 rounded-xl p-3 sm:p-4">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Total dû</span>
                <span className="font-bold">{formatCurrency(totalDuFamille, true)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-green-600">Payé</span>
                <span className="font-bold text-green-600">{formatCurrency(totalPayeFamille, true)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm sm:text-base">
                <span className="text-red-600 font-medium">Reste</span>
                <span className="font-bold text-red-600">{formatCurrency(totalResteFamille, true)}</span>
              </div>
            </div>
          </div>

          {/* Informations - stacked mobile */}
          <div className="space-y-4">
            {/* Coordonnées */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Phone className="w-5 h-5 text-purple-600" />
                Coordonnées
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <InfoRow
                  label="Téléphone"
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
                {famille.ADRESSE && (
                  <InfoRow
                    label="Adresse"
                    value={famille.ADRESSE}
                    icon={<MapPin className="w-4 h-4" />}
                  />
                )}
                <InfoRow label="ID" value={famille.ID || famille['ID FAMILLE']} />
              </div>
            </div>

            {/* Mini-cards enfants */}
            {enfants.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  Enfants inscrits ({enfants.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {enfants.slice(0, 4).map((enfant) => (
                    <button
                      key={enfant.rowIndex}
                      onClick={() => router.push(`/eleves/${enfant.rowIndex}`)}
                      className="bg-gray-50 rounded-xl p-3 text-left hover:bg-gray-100 transition-colors active:scale-95"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs flex-shrink-0">
                          {enfant.NOM?.charAt(0)}{enfant.PRÉNOM?.charAt(0)}
                        </div>
                        <div className="text-sm font-medium truncate">{enfant.PRÉNOM}</div>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">{enfant.CLASSE}</div>
                      <Badge variant={getStatusColor(enfant.STATUT)} size="sm">
                        {enfant.STATUT || 'EN ATTENTE'}
                      </Badge>
                    </button>
                  ))}
                  {enfants.length > 4 && (
                    <div className="col-span-2 text-center text-sm text-gray-500">
                      +{enfants.length - 4} autre(s)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des enfants */}
      <TableAdvanced
        columns={enfantsColumns}
        data={enfants}
        title="Tous les enfants"
        subtitle={`${enfants.length} enfant(s)`}
        emptyMessage="Aucun enfant inscrit"
        exportable={true}
      />

      {/* Historique des paiements */}
      <TableAdvanced
        columns={paiementsColumns}
        data={famillePaiements}
        title="Historique des paiements"
        subtitle={`${famillePaiements.length} paiement(s)`}
        emptyMessage="Aucun paiement"
        exportable={true}
      />

      {/* Modal Suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer la famille"
        size="sm"
      >
        <div className="text-center py-4 px-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Supprimer cette famille ?
          </h3>
          {enfants.length > 0 ? (
            <p className="text-sm text-red-500 mb-6">
              ⚠️ Cette famille a {enfants.length} enfant(s). Supprimez d'abord les enfants.
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              Cette action est irréversible.
            </p>
          )}
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
              disabled={isSubmitting || enfants.length > 0}
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

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-xs sm:text-sm font-medium text-right truncate">
        {value || '-'}
      </span>
    </div>
  );
}