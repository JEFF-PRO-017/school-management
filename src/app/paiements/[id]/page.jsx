'use client';

/**
 * Page de détail d'un paiement
 * Affiche toutes les informations du paiement
 */

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { 
  ArrowLeft, 
  CreditCard,
  Calendar,
  User,
  Users,
  Hash,
  Banknote,
  Receipt,
  Trash2,
  AlertCircle,
  CheckCircle,
  Printer
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { usePaiements } from '@/hooks/usePaiements';
import { useEleves } from '@/hooks/useEleves';
import { useFamilles } from '@/hooks/useFamilles';

export default function ShowPaiementPage() {
  const params = useParams();
  const router = useRouter();
  const paiementId = parseInt(params.id);

  // Hooks SWR
  const { paiements, isLoading: loadingPaiements, deletePaiement } = usePaiements();
  const { eleves } = useEleves();
  const { familles } = useFamilles();

  // États locaux
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trouver le paiement
  const paiement = useMemo(() => 
    paiements.find(p => p.rowIndex === paiementId),
    [paiements, paiementId]
  );

  // Trouver l'élève et la famille associés
  const eleve = useMemo(() => {
    if (!paiement) return null;
    return eleves.find(e => 
      e.rowIndex?.toString() === paiement['ID ÉLÈVE'] ||
      `${e.NOM} ${e.PRÉNOM}`.toLowerCase() === paiement['NOM ÉLÈVE']?.toLowerCase()
    );
  }, [paiement, eleves]);

  const famille = useMemo(() => {
    if (!paiement) return null;
    return familles.find(f => 
      f.ID === paiement['ID FAMILLE'] ||
      f['ID FAMILLE'] === paiement['ID FAMILLE']
    );
  }, [paiement, familles]);

  // Supprimer le paiement
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deletePaiement(paiementId);
      router.push('/paiements');
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Imprimer le reçu
  const handlePrint = () => {
    window.print();
  };

  // Chargement
  if (loadingPaiements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Paiement non trouvé
  if (!paiement) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Paiement non trouvé</h2>
        <Button onClick={() => router.push('/paiements')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  // Couleur selon le type de paiement
  const getTypeColor = (type) => {
    const colors = {
      ESPECES: 'success',
      CHEQUE: 'primary',
      VIREMENT: 'warning',
      MOBILE_MONEY: 'primary',
      CARTE: 'primary',
    };
    return colors[type] || 'gray';
  };

  // Icône selon le type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'ESPECES': return '💵';
      case 'CHEQUE': return '📝';
      case 'VIREMENT': return '🏦';
      case 'MOBILE_MONEY': return '📱';
      case 'CARTE': return '💳';
      default: return '💰';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/paiements')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux paiements</span>
        </button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Reçu de paiement */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto print:shadow-none print:border-0">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Paiement effectué</h1>
          <div className="text-4xl font-bold text-white mt-2">
            {formatCurrency(paiement['MONTANT PAYÉ'] || 0)}
          </div>
          <Badge variant="white" size="lg" className="mt-4 bg-white/20 text-white border-white/30">
            {getTypeIcon(paiement.TYPE)} {paiement.TYPE}
          </Badge>
        </div>

        {/* Détails */}
        <div className="p-6 space-y-6">
          {/* Informations transaction */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Détails de la transaction
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow 
                icon={<Hash className="w-4 h-4 text-gray-400" />}
                label="N° Transaction"
                value={`#${paiement['N° TRANS']}`}
                highlight
              />
              <InfoRow 
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                label="Date"
                value={paiement.DATE}
              />
              <InfoRow 
                icon={<CreditCard className="w-4 h-4 text-gray-400" />}
                label="Type de paiement"
                value={
                  <Badge variant={getTypeColor(paiement.TYPE)} size="sm">
                    {paiement.TYPE}
                  </Badge>
                }
              />
              <InfoRow 
                icon={<Banknote className="w-4 h-4 text-gray-400" />}
                label="Montant"
                value={formatCurrency(paiement['MONTANT PAYÉ'])}
                valueClass="text-green-600 font-bold text-lg"
              />
            </div>
          </div>

          {/* Bénéficiaire */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Bénéficiaire
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow 
                icon={<User className="w-4 h-4 text-gray-400" />}
                label="Élève"
                value={paiement['NOM ÉLÈVE'] || '-'}
              />
              <InfoRow 
                icon={<Users className="w-4 h-4 text-gray-400" />}
                label="ID Famille"
                value={paiement['ID FAMILLE'] || '-'}
              />
              {eleve && (
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/eleves/${eleve.rowIndex}`)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Voir la fiche élève →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Situation après paiement */}
          {eleve && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Situation après paiement
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Total dû</div>
                    <div className="font-bold text-gray-900">
                      {formatCurrency(eleve['TOTAL DÛ'] || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600">Payé</div>
                    <div className="font-bold text-green-700">
                      {formatCurrency(eleve.PAYÉ || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-red-600">Reste</div>
                    <div className="font-bold text-red-700">
                      {formatCurrency(eleve.RESTE || 0)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                    style={{ 
                      width: `${Math.min(100, (parseFloat(eleve.PAYÉ || 0) / parseFloat(eleve['TOTAL DÛ'] || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Note de bas de page */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200 print:block">
            <p>Ce reçu a été généré automatiquement.</p>
            <p>Conservez-le comme preuve de paiement.</p>
          </div>
        </div>
      </div>

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
            Supprimer ce paiement ?
          </h3>
          <p className="text-red-500 mb-6">
            ⚠️ Attention : La suppression d'un paiement ne met pas automatiquement 
            à jour le solde de l'élève. Vous devrez le faire manuellement.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowDeleteModal(false)}>
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

function InfoRow({ icon, label, value, highlight = false, valueClass = '' }) {
  return (
    <div className={`flex justify-between items-center ${highlight ? 'pb-3 border-b border-gray-200' : ''}`}>
      <span className="text-gray-600 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`font-medium ${valueClass}`}>{value || '-'}</span>
    </div>
  );
}
