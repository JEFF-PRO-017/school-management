'use client';

/**
 * Page d'historique des paiements
 * Avec filtres, recherche et navigation vers les détails
 */

import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, Eye, CreditCard } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TableAdvanced from '@/components/ui/TableAdvanced';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { formatCurrency } from '@/lib/utils';
import { usePaiements } from '@/hooks/usePaiements';

export default function PaiementsPage() {
  const router = useRouter();
  const { paiements, stats, isLoading, refresh } = usePaiements();
  
  // Statistiques
  const totalPaiements = paiements.reduce(
    (sum, p) => sum + (parseFloat(p['MONTANT PAYÉ']) || 0),
    0
  );
  
  const paiementsParType = paiements.reduce((acc, p) => {
    const type = p.TYPE || 'AUTRE';
    acc[type] = (acc[type] || 0) + (parseFloat(p['MONTANT PAYÉ']) || 0);
    return acc;
  }, {});
  
  // Colonnes du tableau
  const columns = [
    {
      header: 'N° Trans',
      accessor: 'N° TRANS',
      render: (row) => (
        <Badge variant="gray" size="sm">#{row['N° TRANS']}</Badge>
      ),
    },
    {
      header: 'Date',
      accessor: 'DATE',
      render: (row) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar size={14} className="text-gray-400" />
          {row.DATE}
        </div>
      ),
    },
    {
      header: 'Élève',
      accessor: 'NOM ÉLÈVE',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row['NOM ÉLÈVE']}</p>
          <p className="text-xs text-gray-500">Famille: {row['ID FAMILLE']}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'TYPE',
      render: (row) => {
        const typeColors = {
          ESPECES: 'success',
          CHEQUE: 'primary',
          VIREMENT: 'warning',
          MOBILE_MONEY: 'primary',
          CARTE: 'primary',
        };
        const typeIcons = {
          ESPECES: '💵',
          CHEQUE: '📝',
          VIREMENT: '🏦',
          MOBILE_MONEY: '📱',
          CARTE: '💳',
        };
        return (
          <Badge variant={typeColors[row.TYPE] || 'gray'} size="sm">
            {typeIcons[row.TYPE] || '💰'} {row.TYPE}
          </Badge>
        );
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
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/paiements/${row.rowIndex}`);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-3 h-3" />
          Voir
        </button>
      ),
    },
  ];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement des paiements...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historique des Paiements</h1>
          <p className="text-gray-600 mt-1">{paiements.length} transactions enregistrées</p>
        </div>
        <SyncStatus showDetails />
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Total Encaissé</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totalPaiements)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
        </Card>
        
        <Card>
          <div>
            <p className="text-sm text-gray-600 mb-2">Répartition par type</p>
            <div className="space-y-1">
              {Object.entries(paiementsParType).slice(0, 3).map(([type, montant]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-gray-600">{type}:</span>
                  <span className="font-medium">{formatCurrency(montant)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        
        <Card>
          <div>
            <p className="text-sm text-gray-600 mb-1">Transactions</p>
            <p className="text-2xl font-bold text-primary-600">{paiements.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              Moyenne: {paiements.length > 0 ? formatCurrency(totalPaiements / paiements.length) : '0 FCFA'}
            </p>
          </div>
        </Card>
        
        <Card>
          <div>
            <p className="text-sm text-gray-600 mb-2">Types de paiement</p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(paiementsParType).map(type => (
                <Badge key={type} variant="gray" size="sm">{type}</Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tableau */}
      <TableAdvanced
        columns={columns}
        data={paiements.sort((a, b) => {
          const dateA = new Date(a.DATE?.split('/').reverse().join('-') || 0);
          const dateB = new Date(b.DATE?.split('/').reverse().join('-') || 0);
          return dateB - dateA;
        })}
        onRowClick={(row) => router.push(`/paiements/${row.rowIndex}`)}
        title="Liste des paiements"
        subtitle="Cliquez sur une ligne pour voir le reçu"
        emptyMessage="Aucun paiement enregistré"
        exportable={true}
        refreshable={true}
        onRefresh={refresh}
      />
    </div>
  );
}
