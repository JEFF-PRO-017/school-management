'use client';

/**
 * Page de détail d'une famille
 * Affiche la famille, ses enfants et l'historique des paiements
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
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
  Plus,
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

export default function ShowFamillePage() {
  const params = useParams();
  const router = useRouter();
  const familleId = parseInt(params.id);

  // Hooks SWR
  const { familles, isLoading: loadingFamilles, deleteFamille } = useFamilles();
  const { eleves, isLoading: loadingEleves } = useEleves();
  const { paiements } = usePaiements();

  // États locaux
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trouver la famille
  const famille = useMemo(() => 
    familles.find(f => f.rowIndex === familleId),
    [familles, familleId]
  );

  // Enfants de cette famille
  const enfants = useMemo(() => {
    if (!famille) return [];
    return eleves.filter(e => 
      e['ID FAMILLE'] === famille.ID || 
      e['ID FAMILLE'] === famille['ID FAMILLE'] ||
      e['ID FAMILLE'] === famille.rowIndex?.toString()
    );
  }, [eleves, famille]);

  // Paiements de cette famille
  const famillePaiements = useMemo(() => {
    if (!famille) return [];
    return paiements.filter(p => 
      p['ID FAMILLE'] === famille.ID ||
      p['ID FAMILLE'] === famille['ID FAMILLE']
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

  // Colonnes pour les enfants
  const enfantsColumns = [
    {
      header: 'Élève',
      accessor: 'NOM',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
            {row.NOM?.charAt(0)}{row.PRÉNOM?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.NOM} {row.PRÉNOM}</p>
            <p className="text-xs text-gray-500">{row['DATE NAISS.']}</p>
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
      header: 'Total Dû',
      accessor: 'TOTAL DÛ',
      render: (row) => formatCurrency(row['TOTAL DÛ'] || 0),
    },
    {
      header: 'Payé',
      accessor: 'PAYÉ',
      render: (row) => (
        <span className="text-green-600 font-medium">{formatCurrency(row.PAYÉ || 0)}</span>
      ),
    },
    {
      header: 'Reste',
      accessor: 'RESTE',
      render: (row) => (
        <span className="text-red-600 font-medium">{formatCurrency(row.RESTE || 0)}</span>
      ),
    },
    {
      header: 'Statut',
      accessor: 'STATUT',
      render: (row) => (
        <Badge variant={getStatusColor(row.STATUT)} size="sm">
          {row.STATUT || 'EN ATTENTE'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => router.push(`/eleves/${row.rowIndex}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // Colonnes pour les paiements
  const paiementsColumns = [
    {
      header: 'Date',
      accessor: 'DATE',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{row.DATE}</span>
        </div>
      ),
    },
    {
      header: 'Élève',
      accessor: 'NOM ÉLÈVE',
    },
    {
      header: 'Type',
      accessor: 'TYPE',
      render: (row) => <Badge variant="gray" size="sm">{row.TYPE}</Badge>,
    },
    {
      header: 'Montant',
      accessor: 'MONTANT PAYÉ',
      render: (row) => (
        <span className="font-bold text-green-600">
          {formatCurrency(row['MONTANT PAYÉ'])}
        </span>
      ),
    },
  ];

  // Chargement
  if (loadingFamilles || loadingEleves) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Famille non trouvée
  if (!famille) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Famille non trouvée</h2>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/familles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux familles</span>
        </button>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white border-4 border-white/30">
              <Users className="w-12 h-12" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">
                Famille {famille['NOM FAMILLE'] || famille.NOM_FAMILLE || famille.ID}
              </h1>
              <div className="flex items-center gap-4 mt-2 opacity-90">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {enfants.length} enfant(s)
                </span>
              </div>
              <div className="mt-3">
                <Badge 
                  variant={famille.STATUT === 'SOLDÉ' ? 'success' : famille.STATUT === 'PARTIEL' ? 'warning' : 'danger'}
                  size="lg"
                >
                  {famille.STATUT || 'EN ATTENTE'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coordonnées */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Coordonnées
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow 
                label="Téléphone" 
                value={famille.CONTACT || famille.TELEPHONE}
                icon={<Phone className="w-4 h-4" />}
              />
              <InfoRow 
                label="Email" 
                value={famille.EMAIL}
                icon={<Mail className="w-4 h-4" />}
              />
              <InfoRow 
                label="Adresse" 
                value={famille.ADRESSE}
                icon={<MapPin className="w-4 h-4" />}
              />
              <InfoRow label="ID Famille" value={famille.ID || famille['ID FAMILLE']} />
            </div>
          </div>

          {/* Stats enfants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Enfants inscrits
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {enfants.slice(0, 4).map((enfant, i) => (
                <div 
                  key={i}
                  onClick={() => router.push(`/eleves/${enfant.rowIndex}`)}
                  className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                      {enfant.NOM?.charAt(0)}{enfant.PRÉNOM?.charAt(0)}
                    </div>
                    <div className="text-sm font-medium truncate">{enfant.PRÉNOM}</div>
                  </div>
                  <div className="text-xs text-gray-500">{enfant.CLASSE}</div>
                  <Badge variant={getStatusColor(enfant.STATUT)} size="sm" className="mt-1">
                    {enfant.STATUT || 'EN ATTENTE'}
                  </Badge>
                </div>
              ))}
              {enfants.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  Aucun enfant inscrit
                </div>
              )}
            </div>
          </div>

          {/* Résumé financier */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Situation financière
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-purple-50 rounded-xl p-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900">{pourcentage}%</div>
                <div className="text-sm text-gray-600">payé globalement</div>
              </div>
              
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${pourcentage}%` }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total dû</span>
                  <span className="font-bold">{formatCurrency(totalDuFamille)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Payé</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalPayeFamille)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-red-600">Reste à payer</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalResteFamille)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des enfants */}
      <TableAdvanced
        columns={enfantsColumns}
        data={enfants}
        title="Enfants de la famille"
        subtitle={`${enfants.length} enfant(s) inscrit(s)`}
        emptyMessage="Aucun enfant inscrit dans cette famille"
        exportable={true}
      />

      {/* Historique des paiements */}
      <TableAdvanced
        columns={paiementsColumns}
        data={famillePaiements}
        title="Historique des paiements"
        subtitle={`${famillePaiements.length} paiement(s)`}
        emptyMessage="Aucun paiement enregistré"
        exportable={true}
      />

      {/* Modal Suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Supprimer cette famille ?
          </h3>
          {enfants.length > 0 ? (
            <p className="text-red-500 mb-6">
              ⚠️ Cette famille a {enfants.length} enfant(s) inscrit(s). 
              Veuillez d'abord supprimer ou réassigner les enfants.
            </p>
          ) : (
            <p className="text-gray-500 mb-6">
              Cette action est irréversible.
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="danger" 
              fullWidth 
              onClick={handleDelete}
              disabled={isSubmitting || enfants.length > 0}
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
    <div className="flex justify-between items-center">
      <span className="text-gray-600 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  );
}
