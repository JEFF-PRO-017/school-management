'use client';

/**
 * Page de détail d'un paiement - Mobile First
 * Affichage du reçu avec possibilité d'impression/export
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  User,
  CreditCard,
  Printer,
  Download,
  Share2,
  CheckCircle,
  DollarSign,
  FileText,
  Users
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { usePaiements } from '@/hooks/usePaiements';
import { useEleves } from '@/hooks/useEleves';
import { useFamilles } from '@/hooks/useFamilles';

export default function ShowPaiementPage() {
  const params = useParams();
  const router = useRouter();
  const receiptRef = useRef(null);
  
  // Protection hydratation
  const [mounted, setMounted] = useState(false);
  
  // Hooks SWR
  const { paiements, isLoading: loadingPaiements } = usePaiements();
  const { eleves } = useEleves();
  const { familles } = useFamilles();
  
  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Parser l'ID après le montage
  const paiementId = mounted ? parseInt(params.id) : null;
  
  // Trouver le paiement
  const paiement = useMemo(() => {
    if (!mounted || !paiementId) return null;
    return paiements.find(p => p.rowIndex === paiementId);
  }, [paiements, paiementId, mounted]);
  
  // Trouver l'élève
  const eleve = useMemo(() => {
    if (!paiement) return null;
    return eleves.find(e => 
      e.rowIndex === parseInt(paiement['ID ÉLÈVE'] || paiement.idEleve) ||
      `${e.NOM} ${e.PRÉNOM}`.toLowerCase() === paiement['NOM ÉLÈVE']?.toLowerCase()
    );
  }, [paiement, eleves]);
  
  // Trouver la famille
  const famille = useMemo(() => {
    if (!paiement) return null;
    return familles.find(f => 
      f.ID === paiement['ID FAMILLE'] ||
      f['ID FAMILLE'] === paiement['ID FAMILLE'] ||
      f.ID === paiement.idFamille
    );
  }, [paiement, familles]);
  
  // Imprimer le reçu
  const handlePrint = () => {
    if (!receiptRef.current) return;
    window.print();
  };
  
  // Partager le reçu
  const handleShare = async () => {
    if (!paiement) return;
    
    const text = `Reçu de paiement #${paiement['N° TRANS'] || paiement.numeroTransaction}
Montant: ${formatCurrency(paiement['MONTANT PAYÉ'] || paiement.montantPaye)}
Date: ${paiement.DATE}
Élève: ${paiement['NOM ÉLÈVE'] || paiement.nomEleve}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reçu de paiement',
          text: text,
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier dans le presse-papiers
      navigator.clipboard.writeText(text);
      alert('Reçu copié dans le presse-papiers');
    }
  };
  
  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-4 p-3 sm:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }
  
  // Chargement
  if (loadingPaiements) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Paiement non trouvé
  if (!paiement) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <FileText className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 text-center">Paiement non trouvé</h2>
        <p className="text-gray-500 text-center">Le paiement demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => router.push('/paiements')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }
  
  // Extraire les données
  const montant = parseFloat(paiement['MONTANT PAYÉ'] || paiement.montantPaye || 0);
  const numeroTransaction = paiement['N° TRANS'] || paiement.numeroTransaction || 'N/A';
  const date = paiement.DATE;
  const type = paiement.TYPE || paiement.type || 'ESPECES';
  const nomEleve = paiement['NOM ÉLÈVE'] || paiement.nomEleve || 'Non spécifié';
  const notes = paiement.NOTES || paiement.notes || '';
  
  // Icônes et couleurs par type
  const typeConfig = {
    ESPECES: { icon: '💵', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    CHEQUE: { icon: '📝', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    VIREMENT: { icon: '🏦', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    MOBILE_MONEY: { icon: '📱', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    CARTE: { icon: '💳', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  };
  
  const config = typeConfig[type] || typeConfig.ESPECES;
  
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-3 sm:p-0">
      {/* Header - Non imprimé */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push('/paiements')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Retour</span>
        </button>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleShare}
            className="px-2 sm:px-3"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Partager</span>
          </Button>
          <Button 
            size="sm"
            onClick={handlePrint}
            className="px-2 sm:px-3"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Imprimer</span>
          </Button>
        </div>
      </div>
      
      {/* Reçu de paiement */}
      <div 
        ref={receiptRef}
        className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden print:shadow-none print:border print:rounded-none"
      >
        {/* En-tête du reçu avec succès */}
        <div className={`${config.bg} ${config.border} border-b-2 p-4 sm:p-6`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 ${config.bg} border-2 ${config.border} rounded-full flex items-center justify-center`}>
              <CheckCircle className={`w-8 h-8 sm:w-10 sm:h-10 ${config.color}`} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            Paiement confirmé
          </h1>
          <p className="text-center text-gray-600 text-sm sm:text-base">
            Transaction #{numeroTransaction}
          </p>
        </div>
        
        {/* Montant principal */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 sm:p-8 text-center border-b-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Montant payé</p>
          <p className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">
            {formatCurrency(montant)}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <Badge variant="success" size="lg">
              {type}
            </Badge>
          </div>
        </div>
        
        {/* Détails de la transaction */}
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Détails de la transaction
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow 
                label="Date de paiement" 
                value={date}
                icon={<Calendar className="w-4 h-4" />}
              />
              <InfoRow 
                label="N° de transaction" 
                value={numeroTransaction}
                icon={<FileText className="w-4 h-4" />}
              />
              <InfoRow 
                label="Mode de paiement" 
                value={type}
                icon={<CreditCard className="w-4 h-4" />}
              />
            </div>
          </div>
          
          {/* Informations élève */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Informations élève
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <InfoRow 
                label="Nom de l'élève" 
                value={nomEleve}
                icon={<User className="w-4 h-4" />}
              />
              {eleve && (
                <>
                  <InfoRow 
                    label="Classe" 
                    value={eleve.CLASSE}
                  />
                  <InfoRow 
                    label="ID Élève" 
                    value={eleve.rowIndex}
                  />
                </>
              )}
              {famille && (
                <>
                  <InfoRow 
                    label="Famille" 
                    value={famille['NOM FAMILLE'] || famille.NOM_FAMILLE}
                    icon={<Users className="w-4 h-4" />}
                  />
                  <InfoRow 
                    label="Contact" 
                    value={famille.CONTACT || famille.TELEPHONE}
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Notes */}
          {notes && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Notes</h2>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">{notes}</p>
              </div>
            </div>
          )}
          
          {/* Informations supplémentaires */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 print:hidden">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-blue-600 flex-shrink-0 w-5 h-5 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Paiement validé
                </p>
                <p className="text-xs text-blue-700">
                  Ce reçu confirme le paiement de {formatCurrency(montant)} effectué le {date}. 
                  Conservez ce document comme preuve de paiement.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pied de page */}
        <div className="bg-gray-100 border-t-2 border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-600">
            Reçu généré le {new Date().toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Document officiel - Merci pour votre confiance
          </p>
        </div>
      </div>
      
      {/* Actions supplémentaires - Non imprimées */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        {eleve && (
          <Button 
            variant="ghost" 
            fullWidth
            onClick={() => router.push(`/eleves/${eleve.rowIndex}`)}
            className="py-3"
          >
            <User className="w-4 h-4 mr-2" />
            Voir le profil de l'élève
          </Button>
        )}
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