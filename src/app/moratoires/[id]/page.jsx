'use client';

/**
 * Page de détail d'un moratoire - Mobile First
 * Optimisé pour Android avec protection hydratation
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Trash2,
  XCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useMoratoires } from '@/hooks/useMoratoires';
import { useFamilles } from '@/hooks/useFamilles';
import { useEleves } from '@/hooks/useEleves';

export default function ShowMoratoirePage() {
  const params = useParams();
  const router = useRouter();
  
  // Protection hydratation
  const [mounted, setMounted] = useState(false);
  
  // États locaux
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks SWR
  const { moratoires, isLoading: loadingMoratoires, deleteMoratoire } = useMoratoires();
  const { familles } = useFamilles();
  const { eleves } = useEleves();
  
  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Parser l'ID après le montage
  const moratoireId = mounted ? parseInt(params.id) : null;
  
  // Trouver le moratoire
  const moratoire = useMemo(() => {
    if (!mounted || !moratoireId) return null;
    return moratoires.find(m => m.rowIndex === moratoireId);
  }, [moratoires, moratoireId, mounted]);
  
  // Trouver la famille
  const famille = useMemo(() => {
    if (!moratoire) return null;
    return familles.find(f => 
      f.ID === moratoire['ID FAMILLE'] ||
      f['ID FAMILLE'] === moratoire['ID FAMILLE']
    );
  }, [moratoire, familles]);
  
  // Enfants de cette famille
  const enfants = useMemo(() => {
    if (!famille) return [];
    return eleves.filter(e => 
      e['ID FAMILLE'] === famille.ID || 
      e['ID FAMILLE'] === famille['ID FAMILLE']
    );
  }, [eleves, famille]);
  
  // Calculer les jours restants et le statut
  const infosDelai = useMemo(() => {
    if (!moratoire || !mounted) return null;
    
    const dateEcheance = moratoire['DATE ECHEANCE'] || moratoire['DATE FIN'];
    if (!dateEcheance) return null;
    
    const dateEch = new Date(dateEcheance.split('/').reverse().join('-'));
    const today = new Date();
    const joursRestants = Math.ceil((dateEch - today) / (1000 * 60 * 60 * 24));
    
    let statut = moratoire.STATUT || 'EN COURS';
    let variant = 'warning';
    let icon = <Clock className="w-6 h-6" />;
    
    if (statut === 'TERMINÉ') {
      variant = 'success';
      icon = <CheckCircle className="w-6 h-6" />;
    } else if (joursRestants < 0 || statut === 'EN RETARD') {
      statut = 'EN RETARD';
      variant = 'danger';
      icon = <AlertTriangle className="w-6 h-6" />;
    }
    
    return {
      joursRestants,
      statut,
      variant,
      icon,
      dateEcheance
    };
  }, [moratoire, mounted]);
  
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
  if (loadingMoratoires) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Moratoire non trouvé
  if (!moratoire) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 text-center">Moratoire non trouvé</h2>
        <p className="text-gray-500 text-center">Le moratoire demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => router.push('/moratoires')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-3 sm:p-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/moratoires')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="px-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* En-tête avec statut */}
        {infosDelai && (
          <div className={`p-4 sm:p-6 ${
            infosDelai.variant === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            infosDelai.variant === 'danger' ? 'bg-gradient-to-r from-red-500 to-red-600' :
            'bg-gradient-to-r from-amber-500 to-yellow-600'
          }`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white border-4 border-white/30 flex-shrink-0">
                {infosDelai.icon}
              </div>
              <div className="text-white min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold mb-2">
                  Moratoire #{moratoire.ID || moratoire['N° MORATOIRE'] || moratoire.rowIndex}
                </h1>
                <Badge 
                  variant={infosDelai.variant}
                  size="lg"
                  className="bg-white/20 backdrop-blur"
                >
                  {infosDelai.statut}
                </Badge>
                {infosDelai.joursRestants >= 0 && infosDelai.statut !== 'TERMINÉ' && (
                  <p className="text-sm opacity-90 mt-2">
                    {infosDelai.joursRestants === 0 ? "Expire aujourd'hui" :
                     infosDelai.joursRestants === 1 ? "Expire demain" :
                     `${infosDelai.joursRestants} jours restants`}
                  </p>
                )}
                {infosDelai.joursRestants < 0 && (
                  <p className="text-sm opacity-90 mt-2">
                    En retard de {Math.abs(infosDelai.joursRestants)} jour(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Contenu */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Chronologie du moratoire */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 sm:p-6 border-2 border-amber-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-amber-600" />
              Période du moratoire
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Date de début</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {moratoire.DATE || moratoire['DATE DÉBUT']}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                  infosDelai?.variant === 'success' ? 'bg-green-500' :
                  infosDelai?.variant === 'danger' ? 'bg-red-500' :
                  'bg-amber-500'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Date d'échéance</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {infosDelai?.dateEcheance || '-'}
                  </p>
                </div>
              </div>
              
              {moratoire.duree && (
                <div className="bg-white/60 rounded-lg p-3 mt-3">
                  <p className="text-sm text-gray-600 text-center">
                    Durée: <span className="font-bold text-amber-700">
                      {moratoire.duree} semaine{parseInt(moratoire.duree) > 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Informations - stacked mobile */}
          <div className="space-y-4">
            {/* Famille concernée */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary-600" />
                Famille concernée
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <InfoRow 
                  label="Nom famille" 
                  value={famille ? (famille['NOM FAMILLE'] || famille.NOM_FAMILLE) : `Famille ${moratoire['ID FAMILLE']}`}
                />
                <InfoRow 
                  label="ID Famille" 
                  value={moratoire['ID FAMILLE']}
                />
                {famille?.CONTACT && (
                  <InfoRow 
                    label="Contact" 
                    value={famille.CONTACT || famille.TELEPHONE}
                  />
                )}
                {enfants.length > 0 && (
                  <InfoRow 
                    label="Nombre d'enfants" 
                    value={`${enfants.length} enfant${enfants.length > 1 ? 's' : ''}`}
                  />
                )}
              </div>
              
              {/* Mini-cards enfants */}
              {enfants.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Enfants inscrits:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {enfants.slice(0, 4).map((enfant) => (
                      <button
                        key={enfant.rowIndex}
                        onClick={() => router.push(`/eleves/${enfant.rowIndex}`)}
                        className="bg-white border border-gray-200 rounded-lg p-2 text-left hover:bg-gray-50 transition-colors active:scale-95"
                      >
                        <p className="text-xs font-medium truncate">
                          {enfant.PRÉNOM} {enfant.NOM}
                        </p>
                        <p className="text-xs text-gray-500">{enfant.CLASSE}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Notes/Raison */}
            {moratoire.notes && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Notes / Raison
                </h3>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">{moratoire.notes}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Avertissement si en retard */}
          {infosDelai?.variant === 'danger' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">
                    Moratoire en retard
                  </p>
                  <p className="text-xs text-red-700">
                    Ce moratoire a expiré. Veuillez contacter la famille pour régulariser la situation.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Info si en cours */}
          {infosDelai?.variant === 'warning' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="text-blue-600 flex-shrink-0 w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Moratoire en cours
                  </p>
                  <p className="text-xs text-blue-700">
                    Le délai accordé expire le {infosDelai.dateEcheance}.
                    La famille dispose encore de {infosDelai.joursRestants} jour(s) pour régulariser.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {famille && (
          <Button 
            variant="ghost" 
            fullWidth
            onClick={() => router.push(`/familles/${famille.rowIndex}`)}
            className="py-3"
          >
            <Users className="w-4 h-4 mr-2" />
            Voir la famille
          </Button>
        )}
      </div>
      
      {/* Modal Suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le moratoire"
        size="sm"
      >
        <div className="text-center py-4 px-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Supprimer ce moratoire ?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Cette action est irréversible. Le moratoire sera définitivement supprimé.
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
function InfoRow({ label, value, icon }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-xs sm:text-sm font-medium text-right">
        {value || '-'}
      </span>
    </div>
  );
}