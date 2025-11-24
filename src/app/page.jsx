'use client';

/**
 * Tableau de bord principal
 * Avec hooks SWR pour éviter les rechargements
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, AlertCircle, CheckCircle, TrendingUp, Calendar, Eye, Clock, Plus } from 'lucide-react';
import StatCard from '@/components/features/StatCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { SyncStatus } from '@/components/ui/SyncStatus';
import PaiementForm from '@/components/features/PaiementForm';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { useEleves } from '@/hooks/useEleves';
import { usePaiements } from '@/hooks/usePaiements';
import { useFamilles } from '@/hooks/useFamilles';

export default function Dashboard() {
  const router = useRouter();
  
  // États locaux
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks SWR - données en cache, pas de rechargement inutile
  const { eleves, isLoading: loadingEleves } = useEleves();
  const { paiements, isLoading: loadingPaiements, addPaiement } = usePaiements();
  const { familles, isLoading: loadingFamilles } = useFamilles();
  
  // Date du jour
  const today = new Date().toISOString().split('T')[0];
  
  // Paiements du jour
  const todayPayments = useMemo(() => {
    return paiements.filter(p => {
      if (p.DATE) {
        const [day, month, year] = p.DATE.split('/');
        const paiementDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        return paiementDate === today;
      }
      return false;
    });
  }, [paiements, today]);
  
  const todayTotal = useMemo(() => {
    return todayPayments.reduce((sum, p) => sum + parseFloat(p['MONTANT PAYÉ'] || 0), 0);
  }, [todayPayments]);
  
  // Ajouter un paiement
  const handlePayment = async (data) => {
    setIsSubmitting(true);
    try {
      if (data.mode === 'famille') {
        // Paiement famille - envoyer tous les paiements
        await addPaiement(data);
        setShowPaymentModal(false);
        alert(`${data.paiements.length} paiements enregistrés avec succès !`);
      } else {
        // Paiement individuel
        await addPaiement(data);
        setShowPaymentModal(false);
        alert('Paiement enregistré avec succès !');
      }
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Statistiques calculées (mémorisées)
  const stats = useMemo(() => {
    if (!eleves.length) return null;
    
    const totalEleves = eleves.length;
    const totalDu = eleves.reduce((sum, e) => sum + parseFloat(e['TOTAL DÛ'] || 0), 0);
    const totalPaye = eleves.reduce((sum, e) => sum + parseFloat(e.PAYÉ || 0), 0);
    const totalReste = eleves.reduce((sum, e) => sum + parseFloat(e.RESTE || 0), 0);
    
    const elevesSoldes = eleves.filter(e => e.STATUT === 'SOLDÉ').length;
    const elevesPartiels = eleves.filter(e => e.STATUT === 'PARTIEL').length;
    const elevesImpaye = eleves.filter(e => e.STATUT === 'EN ATTENTE' || !e.STATUT).length;
    
    const tauxRecouvrement = totalDu > 0 ? (totalPaye / totalDu) * 100 : 0;
    
    return {
      totalEleves,
      totalDu,
      totalPaye,
      totalReste,
      elevesSoldes,
      elevesPartiels,
      elevesImpaye,
      tauxRecouvrement,
    };
  }, [eleves]);
  
  // Paiements récents (mémorisés) - HORS AUJOURD'HUI
  const recentPayments = useMemo(() => {
    return [...paiements]
      .filter(p => {
        if (p.DATE) {
          const [day, month, year] = p.DATE.split('/');
          const paiementDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          return paiementDate !== today;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.DATE?.split('/').reverse().join('-') || 0);
        const dateB = new Date(b.DATE?.split('/').reverse().join('-') || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [paiements, today]);
  
  // Élèves avec solde impayé (mémorisés)
  const unpaidStudents = useMemo(() => {
    return eleves
      .filter(e => parseFloat(e.RESTE || 0) > 0)
      .sort((a, b) => parseFloat(b.RESTE || 0) - parseFloat(a.RESTE || 0))
      .slice(0, 5);
  }, [eleves]);
  
  // Chargement
  const isLoading = loadingEleves || loadingPaiements || loadingFamilles;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de la gestion scolaire</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus showDetails />
          <Button onClick={() => setShowPaymentModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau paiement
          </Button>
        </div>
      </div>
      
      {/* 🆕 PAIEMENTS DU JOUR */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paiements du jour</h2>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total encaissé</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(todayTotal)}</p>
            <p className="text-sm text-gray-500">{todayPayments.length} transaction(s)</p>
          </div>
        </div>
        
        {todayPayments.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todayPayments.map((paiement, index) => (
              <div
                key={paiement.rowIndex || index}
                onClick={() => router.push(`/paiements/${paiement.rowIndex}`)}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{paiement['NOM ÉLÈVE']}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success" size="sm">{paiement.TYPE}</Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {paiement.DATE}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">
                    {formatCurrency(paiement['MONTANT PAYÉ'])}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/paiements/${paiement.rowIndex}`);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Voir reçu
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Aucun paiement enregistré aujourd'hui</p>
            <Button size="sm" onClick={() => setShowPaymentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Enregistrer un paiement
            </Button>
          </div>
        )}
      </Card>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Élèves"
            value={stats.totalEleves}
            subtitle={`${familles.length} famille(s)`}
            icon={<Users size={24} />}
            color="primary"
          />
          
          <StatCard
            title="Montant Total Dû"
            value={formatCurrency(stats.totalDu)}
            subtitle="Tous les élèves"
            icon={<DollarSign size={24} />}
            color="warning"
          />
          
          <StatCard
            title="Total Payé"
            value={formatCurrency(stats.totalPaye)}
            subtitle={`${stats.tauxRecouvrement.toFixed(1)}% de recouvrement`}
            icon={<CheckCircle size={24} />}
            color="success"
          />
          
          <StatCard
            title="Reste à Percevoir"
            value={formatCurrency(stats.totalReste)}
            subtitle={`${stats.elevesImpaye} élève(s) impayé(s)`}
            icon={<AlertCircle size={24} />}
            color="danger"
          />
        </div>
      )}
      
      {/* Détails des statuts */}
      {stats && (
        <Card title="Répartition des paiements">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/eleves')}
              className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-all cursor-pointer"
            >
              <div>
                <p className="text-sm text-gray-600">Soldés</p>
                <p className="text-2xl font-bold text-green-700">{stats.elevesSoldes}</p>
                <p className="text-xs text-green-600 mt-1">Cliquer pour voir →</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </button>
            
            <button
              onClick={() => router.push('/eleves')}
              className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-all cursor-pointer"
            >
              <div>
                <p className="text-sm text-gray-600">Paiements partiels</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.elevesPartiels}</p>
                <p className="text-xs text-yellow-600 mt-1">Cliquer pour voir →</p>
              </div>
              <TrendingUp className="text-yellow-600" size={32} />
            </button>
            
            <button
              onClick={() => router.push('/eleves')}
              className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
            >
              <div>
                <p className="text-sm text-gray-600">Non payés</p>
                <p className="text-2xl font-bold text-red-700">{stats.elevesImpaye}</p>
                <p className="text-xs text-red-600 mt-1">Cliquer pour voir →</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </button>
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paiements récents */}
        <Card 
          title="Paiements récents" 
          subtitle="Les 5 dernières transactions (hors aujourd'hui)"
          action={
            <button
              onClick={() => router.push('/paiements')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Voir tout →
            </button>
          }
        >
          {recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map((paiement) => (
                <div
                  key={paiement.rowIndex}
                  onClick={() => router.push(`/paiements/${paiement.rowIndex}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{paiement['NOM ÉLÈVE']}</p>
                      <Eye className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="gray" size="sm">{paiement.TYPE}</Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {paiement.DATE}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(paiement['MONTANT PAYÉ'])}
                    </p>
                    <Badge variant="gray" size="sm" className="mt-1">
                      #{paiement['N° TRANS']}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucun paiement enregistré</p>
            </div>
          )}
        </Card>
        
        {/* Élèves avec solde impayé */}
        <Card 
          title="Soldes impayés" 
          subtitle="Top 5 des montants restants"
          action={
            <button
              onClick={() => router.push('/eleves')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Voir tout →
            </button>
          }
        >
          {unpaidStudents.length > 0 ? (
            <div className="space-y-3">
              {unpaidStudents.map((eleve) => (
                <div
                  key={eleve.rowIndex}
                  onClick={() => router.push(`/eleves/${eleve.rowIndex}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {eleve.NOM} {eleve.PRÉNOM}
                      </p>
                      <Eye className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="gray" size="sm">{eleve.CLASSE}</Badge>
                      <Badge 
                        variant={getStatusColor(eleve.STATUT)} 
                        size="sm"
                      >
                        {eleve.STATUT || 'EN ATTENTE'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(eleve.RESTE)}
                    </p>
                    <p className="text-xs text-gray-500">
                      sur {formatCurrency(eleve['TOTAL DÛ'])}
                    </p>
                    <div className="mt-1 h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden ml-auto">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (parseFloat(eleve.RESTE) / parseFloat(eleve['TOTAL DÛ'] || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-green-600 font-medium">Tous les paiements sont à jour !</p>
              <p className="text-sm text-gray-500 mt-1">Aucun solde impayé</p>
            </div>
          )}
        </Card>
      </div>
      
      {/* Stats supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Total Familles</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{familles.length}</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Total Paiements</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{paiements.length}</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Taux de recouvrement</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats ? `${stats.tauxRecouvrement.toFixed(1)}%` : '-'}
            </p>
          </div>
        </Card>
      </div>
      
      {/* Modal Nouveau Paiement */}
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
