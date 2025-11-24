'use client';

/**
 * Page de détail d'un moratoire
 * Affiche toutes les informations et les échéances
 */

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { 
  ArrowLeft, 
  Calendar,
  User,
  Users,
  FileText,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  CalendarDays
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { useMoratoires } from '@/hooks/useMoratoires';
import { useFamilles } from '@/hooks/useFamilles';
import { useEleves } from '@/hooks/useEleves';

export default function ShowMoratoirePage() {
  const params = useParams();
  const router = useRouter();
  const moratoireId = parseInt(params.id);

  // Hooks SWR
  const { moratoires, isLoading, deleteMoratoire, updateMoratoire } = useMoratoires();
  const { familles } = useFamilles();
  const { eleves } = useEleves();

  // États locaux
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trouver le moratoire
  const moratoire = useMemo(() => 
    moratoires.find(m => m.rowIndex === moratoireId),
    [moratoires, moratoireId]
  );

  // Trouver la famille associée
  const famille = useMemo(() => {
    if (!moratoire) return null;
    return familles.find(f => 
      f.ID === moratoire['ID FAMILLE'] ||
      f['ID FAMILLE'] === moratoire['ID FAMILLE']
    );
  }, [moratoire, familles]);

  // Enfants de la famille
  const enfants = useMemo(() => {
    if (!famille) return [];
    return eleves.filter(e => 
      e['ID FAMILLE'] === famille.ID || 
      e['ID FAMILLE'] === famille['ID FAMILLE']
    );
  }, [eleves, famille]);

  // Supprimer le moratoire
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteMoratoire(moratoireId);
      router.push('/moratoires');
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Marquer comme terminé
  const handleMarkComplete = async () => {
    setIsSubmitting(true);
    try {
      await updateMoratoire(moratoireId, {
        ...moratoire,
        STATUT: 'TERMINÉ',
      });
      alert('Moratoire marqué comme terminé');
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Moratoire non trouvé
  if (!moratoire) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Moratoire non trouvé</h2>
        <Button onClick={() => router.push('/moratoires')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  // Statut et couleurs
  const getStatusInfo = (statut) => {
    switch (statut) {
      case 'TERMINÉ':
        return { color: 'success', icon: <CheckCircle className="w-5 h-5" />, text: 'Terminé' };
      case 'EN RETARD':
        return { color: 'danger', icon: <AlertTriangle className="w-5 h-5" />, text: 'En retard' };
      case 'EN COURS':
      default:
        return { color: 'warning', icon: <Clock className="w-5 h-5" />, text: 'En cours' };
    }
  };

  const statusInfo = getStatusInfo(moratoire.STATUT);

  // Calculer les jours restants
  const dateEcheance = moratoire['DATE ECHEANCE'] || moratoire.DATE;
  let joursRestants = null;
  if (dateEcheance) {
    const echeance = new Date(dateEcheance.split('/').reverse().join('-'));
    const today = new Date();
    joursRestants = Math.ceil((echeance - today) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/moratoires')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux moratoires</span>
        </button>
        <div className="flex items-center gap-2">
          {moratoire.STATUT !== 'TERMINÉ' && (
            <Button variant="success" onClick={handleMarkComplete} disabled={isSubmitting}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer terminé
            </Button>
          )}
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* En-tête */}
        <div className={`px-6 py-8 ${
          moratoire.STATUT === 'TERMINÉ' 
            ? 'bg-gradient-to-r from-green-500 to-green-600'
            : moratoire.STATUT === 'EN RETARD'
            ? 'bg-gradient-to-r from-red-500 to-red-600'
            : 'bg-gradient-to-r from-amber-500 to-amber-600'
        }`}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white border-4 border-white/30">
              <FileText className="w-10 h-10" />
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="white" size="sm" className="bg-white/20 text-white border-white/30">
                  N° {moratoire.ID || moratoire['N° MORATOIRE'] || moratoireId}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold">Accord de moratoire</h1>
              <p className="opacity-90 mt-1">
                Famille {moratoire['ID FAMILLE']}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {statusInfo.icon}
                <span className="font-semibold">{statusInfo.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations moratoire */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Détails du moratoire
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow 
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                label="Date de création"
                value={moratoire.DATE || moratoire['DATE DÉBUT']}
              />
              <InfoRow 
                icon={<CalendarDays className="w-4 h-4 text-gray-400" />}
                label="Date d'échéance"
                value={moratoire['DATE ECHEANCE'] || moratoire['DATE FIN'] || '-'}
              />
              <InfoRow 
                icon={<Users className="w-4 h-4 text-gray-400" />}
                label="ID Famille"
                value={moratoire['ID FAMILLE']}
              />
              {moratoire.MONTANT && (
                <InfoRow 
                  label="Montant concerné"
                  value={formatCurrency(moratoire.MONTANT)}
                  valueClass="font-bold"
                />
              )}
              {moratoire.NOTES && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-900">{moratoire.NOTES}</p>
                </div>
              )}
            </div>

            {/* Alerte jours restants */}
            {joursRestants !== null && moratoire.STATUT !== 'TERMINÉ' && (
              <div className={`rounded-xl p-4 ${
                joursRestants < 0 
                  ? 'bg-red-50 border border-red-200'
                  : joursRestants <= 7
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-3">
                  {joursRestants < 0 ? (
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  ) : (
                    <Clock className="w-8 h-8 text-amber-500" />
                  )}
                  <div>
                    <p className={`font-bold ${
                      joursRestants < 0 ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {joursRestants < 0 
                        ? `En retard de ${Math.abs(joursRestants)} jour(s)`
                        : `${joursRestants} jour(s) restant(s)`
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      Échéance : {dateEcheance}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Famille et enfants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Famille concernée
            </h3>
            
            {famille ? (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {famille['NOM FAMILLE'] || famille.NOM_FAMILLE || `Famille ${famille.ID}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {famille.CONTACT || famille.TELEPHONE}
                    </p>
                  </div>
                </div>

                {/* Liste des enfants */}
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {enfants.length} enfant(s) inscrit(s)
                </p>
                <div className="space-y-2">
                  {enfants.map((enfant, i) => (
                    <div 
                      key={i}
                      onClick={() => router.push(`/eleves/${enfant.rowIndex}`)}
                      className="flex items-center justify-between p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold">
                          {enfant.NOM?.charAt(0)}{enfant.PRÉNOM?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{enfant.NOM} {enfant.PRÉNOM}</p>
                          <p className="text-xs text-gray-500">{enfant.CLASSE}</p>
                        </div>
                      </div>
                      <span className="text-sm text-red-600 font-medium">
                        {formatCurrency(enfant.RESTE || 0)} dû
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push(`/familles/${famille.rowIndex}`)}
                  className="mt-4 w-full text-center text-primary-600 hover:text-primary-700 text-sm font-medium py-2 bg-white rounded-lg"
                >
                  Voir la fiche famille →
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Famille non trouvée</p>
              </div>
            )}

            {/* Total dû par la famille */}
            {enfants.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-red-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Total dû par la famille</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(enfants.reduce((sum, e) => sum + parseFloat(e.RESTE || 0), 0))}
                </p>
              </div>
            )}
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
            Supprimer ce moratoire ?
          </h3>
          <p className="text-gray-500 mb-6">
            Cette action est irréversible.
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

function InfoRow({ icon, label, value, valueClass = '' }) {
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
