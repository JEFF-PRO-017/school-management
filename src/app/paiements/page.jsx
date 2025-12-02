'use client';

/**
 * Page d'historique des paiements - Mobile First
 * Optimisé pour Android
 */

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, Eye, TrendingUp } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import TableAdvanced from '@/components/ui/TableAdvanced';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { formatCurrency } from '@/lib/utils';
import { usePaiements } from '@/hooks/usePaiements';
import { isAdmin } from '@/lib/device-id';

export default function PaiementsPage() {
  const router = useRouter();

  // Protection hydratation
  const [mounted, setMounted] = useState(false);

  const { paiements, isLoading, refresh } = usePaiements();

  // Montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Statistiques
  const stats = useMemo(() => {
    const totalPaiements = paiements.reduce(
      (sum, p) => sum + (parseFloat(p['montantPaye'] || p['MONTANT PAYÉ']) || 0),
      0
    );

    const paiementsParType = paiements.reduce((acc, p) => {
      const type = p.type || p.TYPE || 'AUTRE';
      acc[type] = (acc[type] || 0) + (parseFloat(p['montantPaye'] || p['MONTANT PAYÉ']) || 0);
      return acc;
    }, {});

    const moyenne = paiements.length > 0 ? totalPaiements / paiements.length : 0;

    return {
      totalPaiements,
      paiementsParType,
      count: paiements.length,
      moyenne
    };
  }, [paiements]);

  // Colonnes du tableau - responsive
  const columns = [
    {
      header: 'Date',
      accessor: 'DATE',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
          <span>{row.DATE}</span>
        </div>
      ),
    },
    {
      header: 'Élève',
      accessor: 'nomEleve',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
            {row.nomEleve || row['NOM ÉLÈVE']}
          </p>
          <p className="text-xs text-gray-500">
            Famille: {row['idFamille'] || row['ID FAMILLE']}
          </p>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => {
        const type = row.type || row.TYPE || 'ESPECES';
        const typeIcons = {
          ESPECES: '💵',
          CHEQUE: '📝',
          VIREMENT: '🏦',
          MOBILE_MONEY: '📱',
          CARTE: '💳',
        };
        return (
          <Badge variant="success" size="sm">
            <span className="hidden sm:inline">{typeIcons[type]} {type}</span>
            <span className="sm:hidden">{typeIcons[type]}</span>
          </Badge>
        );
      },
    },
    {
      header: 'Montant',
      accessor: 'montantPaye',
      render: (row) => (
        <span className="font-bold text-green-600 text-sm sm:text-base whitespace-nowrap">
          {formatCurrency(row.montantPaye || row['MONTANT PAYÉ'])}
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
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">Voir</span>
        </button>
      ),
    },
  ];

  // Attendre le montage
  if (!mounted) {
    return (
      <div className="space-y-4 p-3 sm:p-0">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
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
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paiements</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">{stats.count} transactions</p>
          </div>
          <SyncStatus />
        </div>
      </div>

      {isAdmin() &&
        <>

          {/* Statistiques en grille 2x2 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Total encaissé - mise en avant */}
            <div className="col-span-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs sm:text-sm text-green-100">Total Encaissé</p>
                  <p className="text-3xl sm:text-4xl font-bold mt-1">
                    {formatCurrency(stats.totalPaiements)}
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                  <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-green-100">
                <TrendingUp className="w-4 h-4" />
                <span>{stats.count} transactions au total</span>
              </div>
            </div>

            {/* Moyenne */}
            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-md">
              <p className="text-xs sm:text-sm text-blue-600 font-medium mb-2">Moyenne</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">
                {formatCurrency(stats.moyenne, true)}
              </p>
              <p className="text-xs text-gray-500 mt-1">par transaction</p>
            </div>

            {/* Types de paiement */}
            <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-md">
              <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2">Méthodes</p>
              <div className="space-y-1">
                {Object.entries(stats.paiementsParType).slice(0, 2).map(([type, montant]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{type}:</span>
                    <span className="font-medium ml-1">{formatCurrency(montant, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Répartition par type */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-md">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Répartition par type</h3>
            <div className="space-y-2">
              {Object.entries(stats.paiementsParType).map(([type, montant]) => {
                const percentage = (montant / stats.totalPaiements) * 100;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-gray-600">{type}</span>
                      <span className="font-medium">{formatCurrency(montant)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      }
      {/* Tableau */}
      <TableAdvanced
        columns={columns}
        data={paiements.sort((a, b) => {
          const dateA = new Date(a.DATE?.split('/').reverse().join('-') || 0);
          const dateB = new Date(b.DATE?.split('/').reverse().join('-') || 0);
          return dateB - dateA;
        })}
        onRowClick={(row) => router.push(`/paiements/${row.rowIndex}`)}
        title="Historique des paiements"
        subtitle="Cliquez pour voir le reçu"
        emptyMessage="Aucun paiement enregistré"
        exportable={true}
        refreshable={true}
        onRefresh={refresh}
      />
    </div>
  );
}