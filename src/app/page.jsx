'use client';

/**
 * Tableau de bord principal - Mobile First
 * Optimisé pour écrans Android
 */

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Eye,
  Clock,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { SyncStatus } from '@/components/ui/SyncStatus';
import PaiementForm from '@/components/features/PaiementForm';
import { formatCurrency } from '@/lib/utils';
import { useEleves } from '@/hooks/useEleves';
import { usePaiements } from '@/hooks/usePaiements';
import { useFamilles } from '@/hooks/useFamilles';
import { isAdmin } from '@/lib/device-id';

export default function Dashboard() {
  const router = useRouter();

  // États locaux
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [today, setToday] = useState('');
  const [mounted, setMounted] = useState(false);

  // Hooks SWR
  const { eleves, isLoading: loadingEleves } = useEleves();
  const { paiements, isLoading: loadingPaiements, addPaiement } = usePaiements();
  const { familles, isLoading: loadingFamilles } = useFamilles();

  // Date du jour (côté client uniquement)
  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
    setMounted(true);
  }, []);

  // Paiements du jour
  const todayPayments = useMemo(() => {
    if (!today) return [];
    return paiements.filter(p => p.DATE === today);
  }, [paiements, today]);

  const todayTotal = useMemo(() => {
    return todayPayments.reduce((sum, p) => sum + parseFloat(p['MONTANT PAYÉ'] || 0), 0);
  }, [todayPayments]);

  // Statistiques
  const stats = useMemo(() => {
    if (!eleves.length) return null;

    const totalEleves = eleves.length;
    const totalDu = eleves.reduce((sum, e) => sum + parseFloat(e['TOTAL DÛ'] || 0), 0);
    const totalPaye = eleves.reduce((sum, e) => sum + parseFloat(e.PAYÉ || 0), 0);
    const totalReste = eleves.reduce((sum, e) => sum + parseFloat(e.RESTE || 0), 0);

    const elevesSoldes = eleves.filter(e => e.STATUT === '✅ PAYÉ').length;
    const elevesImpaye = eleves.filter(e => e.STATUT !== '✅ PAYÉ' || !e.STATUT).length;

    const tauxRecouvrement = totalDu > 0 ? (totalPaye / totalDu) * 100 : 0;

    return {
      totalEleves,
      totalDu,
      totalPaye,
      totalReste,
      elevesSoldes,
      elevesImpaye,
      tauxRecouvrement,
    };
  }, [eleves]);

  // Ajouter un paiement
  const handlePayment = async (data) => {
    setIsSubmitting(true);
    try {
      await addPaiement(data);
      setShowPaymentModal(false);
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chargement
  const isLoading = loadingEleves || loadingPaiements || loadingFamilles;

  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-4 p-3 sm:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
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
      {/* Header Mobile First */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Vue d'ensemble</p>
          </div>
          <SyncStatus />
        </div>

        {/* Bouton paiement principal - Grand et visible */}
        <Button
          onClick={() => setShowPaymentModal(true)}
          className="w-full py-4 text-base font-semibold shadow-lg"
          variant="success"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau paiement
        </Button>
      </div>

      {/* Card Paiements du jour - Mise en avant */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 text-white">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">Aujourd'hui</h2>
                <p className="text-xs text-green-100">
                  {today && new Date(today).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              </div>
            </div>
            <Badge variant="success" className="bg-white/20 backdrop-blur text-white border-white/30">
              {todayPayments.length} transactions
            </Badge>
          </div>

          {/* Montant total */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
            <p className="text-xs sm:text-sm text-green-100 mb-1">Total encaissé</p>
            <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(todayTotal)}</p>
          </div>

          {/* Liste des paiements ou message vide */}
          {todayPayments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todayPayments.slice(0, 3).map((paiement, index) => (
                <div
                  key={paiement.rowIndex || index}
                  onClick={() => router.push(`/paiements/${paiement.rowIndex}`)}
                  className="bg-white/10 backdrop-blur rounded-xl p-3 hover:bg-white/20 transition-all active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">{paiement['NOM ÉLÈVE']}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="success" size="sm" className="text-xs bg-white/20 text-white border-white/30">
                            {paiement.TYPE}
                          </Badge>
                          <span className="text-xs text-green-100 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {paiement.DATE}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="font-bold text-base ml-2">{formatCurrency(paiement['MONTANT PAYÉ'])}</p>
                  </div>
                </div>
              ))}

              {todayPayments.length > 3 && (
                <button
                  onClick={() => router.push('/paiements')}
                  className="w-full py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  Voir tout ({todayPayments.length})
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 bg-white/5 rounded-xl backdrop-blur">
              <Calendar className="w-10 h-10 text-white/50 mx-auto mb-2" />
              <p className="text-sm text-green-100 mb-3">Aucun paiement aujourd'hui</p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Enregistrer un paiement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques rapides - Grid 2x2 pour mobile */}
      {isAdmin() && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Total élèves */}
          <div
            onClick={() => router.push('/eleves')}
            className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-md border border-blue-100 hover:shadow-lg transition-all active:scale-95"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Élèves</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalEleves}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">{stats.elevesSoldes} soldés</span>
            </div>
          </div>

          {/* Total payé */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-md border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Encaissé</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaye, true)}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              sur {formatCurrency(stats.totalDu, true)}
            </div>
          </div>

          {/* Reste à payer */}
          <div
            onClick={() => router.push('/eleves')}
            className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-md border border-red-100 hover:shadow-lg transition-all active:scale-95"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Impayé</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalReste, true)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-red-600 font-medium">{stats.elevesImpaye} non soldés</span>
            </div>
          </div>

          {/* Taux de recouvrement */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl p-4 shadow-md text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium">Taux</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">
              {Math.round(stats.tauxRecouvrement)}%
            </p>
            <div className="mt-2 w-full bg-white/20 rounded-full h-1.5 overflow-hidden backdrop-blur">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${stats.tauxRecouvrement}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => router.push('/eleves')}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all active:scale-95 text-left"
        >
          <Users className="w-8 h-8 text-primary-600 mb-2" />
          <p className="font-semibold text-gray-900 text-sm sm:text-base">Gérer les élèves</p>
          <p className="text-xs text-gray-500 mt-1">Inscriptions & paiements</p>
          <ArrowRight className="w-4 h-4 text-gray-400 mt-2" />
        </button>

        <button
          onClick={() => router.push('/paiements')}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all active:scale-95 text-left"
        >
          <DollarSign className="w-8 h-8 text-green-600 mb-2" />
          <p className="font-semibold text-gray-900 text-sm sm:text-base">Historique</p>
          <p className="text-xs text-gray-500 mt-1">Tous les paiements</p>
          <ArrowRight className="w-4 h-4 text-gray-400 mt-2" />
        </button>
      </div>

      {/* Modal Paiement */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Enregistrer un paiement"
        size="md"
      >
        <PaiementForm
          onSubmit={handlePayment}
          onCancel={() => setShowPaymentModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}