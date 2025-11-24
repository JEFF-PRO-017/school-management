'use client';

/**
 * Page de détail d'un élève
 * Affiche toutes les informations et l'historique des paiements
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Users, 
  Calendar,
  CreditCard,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
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

export default function ShowElevePage() {
  const params = useParams();
  const router = useRouter();
  const eleveId = parseInt(params.id);

  // Hooks SWR
  const { eleves, isLoading: loadingEleves, updateEleve, deleteEleve } = useEleves();
  const { paiements, isLoading: loadingPaiements, addPaiement } = usePaiements();
  const { familles } = useFamilles();

  // États locaux
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trouver l'élève
  const eleve = useMemo(() => 
    eleves.find(e => e.rowIndex === eleveId),
    [eleves, eleveId]
  );

  // Trouver la famille
  const famille = useMemo(() => {
    if (!eleve) return null;
    return familles.find(f => f.ID === eleve['ID FAMILLE'] || f['ID FAMILLE'] === eleve['ID FAMILLE']);
  }, [eleve, familles]);

  // Paiements de cet élève
  const elevePaiements = useMemo(() => {
    if (!eleve) return [];
    return paiements.filter(p => 
      p['ID ÉLÈVE'] === eleve.rowIndex?.toString() ||
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
      header: 'N° Trans',
      accessor: 'N° TRANS',
      render: (row) => (
        <Badge variant="gray" size="sm">#{row['N° TRANS']}</Badge>
      ),
    },
    {
      header: 'Type',
      accessor: 'TYPE',
      render: (row) => {
        const colors = {
          ESPECES: 'success',
          CHEQUE: 'primary',
          VIREMENT: 'warning',
          MOBILE_MONEY: 'primary',
        };
        return <Badge variant={colors[row.TYPE] || 'gray'} size="sm">{row.TYPE}</Badge>;
      },
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
  if (loadingEleves || loadingPaiements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Élève non trouvé
  if (!eleve) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Élève non trouvé</h2>
        <p className="text-gray-500">L'élève demandé n'existe pas ou a été supprimé.</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/eleves')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux élèves</span>
        </button>
        <div className="flex items-center gap-2">
          <Button variant="success" onClick={() => setShowPaymentModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau paiement
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* En-tête avec avatar */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-3xl border-4 border-white/30">
              {eleve.NOM?.charAt(0)}{eleve.PRÉNOM?.charAt(0)}
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">{eleve.NOM} {eleve.PRÉNOM}</h1>
              <div className="flex items-center gap-4 mt-2 opacity-90">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {eleve.CLASSE || 'Non assigné'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {eleve['DATE NAISS.'] || 'Date non renseignée'}
                </span>
              </div>
              <div className="mt-3">
                <Badge 
                  variant={eleve.STATUT === 'SOLDÉ' ? 'success' : eleve.STATUT === 'PARTIEL' ? 'warning' : 'danger'}
                  size="lg"
                >
                  {eleve.STATUT || 'EN ATTENTE'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Informations personnelles
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow label="Nom" value={eleve.NOM} />
              <InfoRow label="Prénom" value={eleve.PRÉNOM} />
              <InfoRow label="Date de naissance" value={eleve['DATE NAISS.']} />
              <InfoRow label="Classe" value={eleve.CLASSE} />
              <InfoRow label="ID Famille" value={eleve['ID FAMILLE']} />
            </div>

            {/* Infos famille */}
            {famille && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pt-4">
                  <Users className="w-5 h-5 text-primary-600" />
                  Famille
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <InfoRow label="Nom famille" value={famille['NOM FAMILLE'] || famille.NOM_FAMILLE} />
                  <InfoRow 
                    label="Contact" 
                    value={famille.CONTACT || famille.TELEPHONE}
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <InfoRow 
                    label="Email" 
                    value={famille.EMAIL}
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>
              </>
            )}
          </div>

          {/* Situation financière */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Frais de scolarité
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow label="Inscription" value={formatCurrency(eleve.INSCRIPTION || 0)} />
              <InfoRow label="Scolarité" value={formatCurrency(eleve.SCOLARITÉ || 0)} />
              <InfoRow label="Dossier" value={formatCurrency(eleve.DOSSIER || 0)} />
              <InfoRow label="Autres frais" value={formatCurrency(eleve.AUTRES || 0)} />
              <div className="border-t border-gray-300 pt-3 mt-3">
                <InfoRow 
                  label="Total dû" 
                  value={formatCurrency(totalDu)} 
                  valueClass="text-lg font-bold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Résumé paiements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Résumé des paiements
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-primary-50 rounded-xl p-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900">{pourcentage}%</div>
                <div className="text-sm text-gray-600">payé</div>
              </div>
              
              {/* Barre de progression circulaire simplifiée */}
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${pourcentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/60 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(paye)}</div>
                  <div className="text-xs text-gray-600">Payé</div>
                </div>
                <div className="text-center p-3 bg-white/60 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{formatCurrency(reste)}</div>
                  <div className="text-xs text-gray-600">Reste</div>
                </div>
              </div>

              <Button 
                variant="success" 
                fullWidth 
                className="mt-4"
                onClick={() => setShowPaymentModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Enregistrer un paiement
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      <TableAdvanced
        columns={paiementsColumns}
        data={elevePaiements}
        title="Historique des paiements"
        subtitle={`${elevePaiements.length} paiement(s) enregistré(s)`}
        emptyMessage="Aucun paiement enregistré pour cet élève"
        exportable={true}
      />

      {/* Modal Paiement */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Enregistrer un paiement"
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
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Supprimer {eleve.NOM} {eleve.PRÉNOM} ?
          </h3>
          <p className="text-gray-500 mb-6">
            Cette action est irréversible. Toutes les données de cet élève seront supprimées.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              fullWidth 
              onClick={() => setShowDeleteModal(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="danger" 
              fullWidth 
              onClick={handleDelete}
              disabled={isSubmitting}
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
    <div className="flex justify-between items-center">
      <span className="text-gray-600 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`font-medium ${valueClass}`}>{value || '-'}</span>
    </div>
  );
}
