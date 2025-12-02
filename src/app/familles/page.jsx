'use client';

/**
 * Page de gestion des familles
 * Avec hooks SWR et navigation vers les détails
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import TableAdvanced from '@/components/ui/TableAdvanced';
import { SyncStatus } from '@/components/ui/SyncStatus';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { useFamilles } from '@/hooks/useFamilles';
import { useEleves } from '@/hooks/useEleves';
import { isAdmin } from '@/lib/device-id';

export default function FamillesPage() {
  const router = useRouter();

  // Hooks SWR
  const { familles, isLoading: loadingFamilles, addFamille, refresh } = useFamilles();
  const { eleves, isLoading: loadingEleves } = useEleves();

  // États locaux
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nomFamille: '',
    contact: '',
    email: '',
  });

  // Grouper les élèves par famille
  const elevesParFamille = useMemo(() => {
    const grouped = {};
    eleves.forEach(eleve => {
      const familleId = eleve['ID FAMILLE'];
      if (familleId) {
        if (!grouped[familleId]) grouped[familleId] = [];
        grouped[familleId].push(eleve);
      }
    });
    return grouped;
  }, [eleves]);

  // Calculer les statistiques par famille
  const famillesAvecStats = useMemo(() => {
    return familles.map(famille => {
      const familleId = famille.ID || famille['ID FAMILLE'];
      const enfants = elevesParFamille[familleId] || [];
      const totalDu = enfants.reduce((sum, e) => sum + (parseFloat(e['TOTAL DÛ']) || 0), 0);
      const totalPaye = enfants.reduce((sum, e) => sum + (parseFloat(e.PAYÉ) || 0), 0);
      const reste = totalDu - totalPaye;

      let statut = 'EN ATTENTE';
      if (totalPaye >= totalDu && totalDu > 0) statut = 'SOLDÉ';
      else if (totalPaye > 0) statut = 'PARTIEL';

      return {
        ...famille,
        enfants,
        nbEnfants: enfants.length,
        totalDu,
        totalPaye,
        reste,
        statutCalcule: statut,
      };
    });
  }, [familles, elevesParFamille]);

  // Ajouter une famille
  const handleAddFamille = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addFamille({
        ...formData,
        nbEnfants: '0',
        totalFamille: '0',
        paye: '0',
        reste: '0',
        statut: 'EN ATTENTE',
      });

      setShowAddModal(false);
      setFormData({ nomFamille: '', contact: '', email: '' });

      if (result.offline) {
        alert('Famille enregistrée localement.');
      } else {
        alert('Famille ajoutée avec succès !');
      }
    } catch (error) {
      alert('Erreur lors de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Colonnes du tableau
  const columns = [
    {
      header: 'Famille',
      accessor: 'NOM FAMILLE',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {row['NOM FAMILLE'] || row.NOM_FAMILLE || `Famille ${row.ID}`}
            </p>
            <p className="text-xs text-gray-500">ID: {row.ID || row['ID FAMILLE']}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'CONTACT',
      render: (row) => (
        <div className="text-sm">
          {row.CONTACT && <p>📞 {row.CONTACT}</p>}
          {row.EMAIL && <p className="text-gray-500 text-xs">✉️ {row.EMAIL}</p>}
        </div>
      ),
    },
    {
      header: 'Enfants',
      accessor: 'nbEnfants',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.nbEnfants}</span>
          <span className="text-gray-500 text-sm">enfant(s)</span>
        </div>
      ),
    },
    {
      header: 'Total Dû',
      accessor: 'totalDu',
      render: (row) => formatCurrency(row.totalDu),
    },
    {
      header: 'Payé',
      accessor: 'totalPaye',
      render: (row) => (
        <span className="text-green-600 font-medium">{formatCurrency(row.totalPaye)}</span>
      ),
    },
    {
      header: 'Reste',
      accessor: 'reste',
      render: (row) => (
        <span className="text-red-600 font-medium">{formatCurrency(row.reste)}</span>
      ),
    },
    {
      header: 'Statut',
      accessor: 'statutCalcule',
      render: (row) => (
        <Badge variant={getStatusColor(row.statutCalcule)} size="sm">
          {row.statutCalcule}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/familles/${row.rowIndex}`);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          Voir
        </Button>
      ),
    },
  ];

  // Stats globales
  const stats = useMemo(() => ({
    total: familles.length,
    soldees: famillesAvecStats.filter(f => f.statutCalcule === 'SOLDÉ').length,
    partielles: famillesAvecStats.filter(f => f.statutCalcule === 'PARTIEL').length,
    enAttente: famillesAvecStats.filter(f => f.statutCalcule === 'EN ATTENTE').length,
  }), [familles, famillesAvecStats]);

  if (loadingFamilles || loadingEleves) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-500">Chargement des familles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Familles</h1>
          <p className="text-gray-600 mt-1">{familles.length} familles enregistrées</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus showDetails />
          {isAdmin() && <Button onClick={() => setShowAddModal(true)}>
            <Plus size={20} className="mr-2" />
            Nouvelle famille
          </Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <p className="text-sm text-green-600">Soldées</p>
          <p className="text-xl font-bold text-green-700">{stats.soldees}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm">
          <p className="text-sm text-yellow-600">Partielles</p>
          <p className="text-xl font-bold text-yellow-700">{stats.partielles}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <p className="text-sm text-red-600">En attente</p>
          <p className="text-xl font-bold text-red-700">{stats.enAttente}</p>
        </div>
      </div>

      {/* Tableau */}
      <TableAdvanced
        columns={columns}
        data={famillesAvecStats}
        onRowClick={(row) => router.push(`/familles/${row.rowIndex}`)}
        title="Liste des familles"
        subtitle="Cliquez sur une ligne pour voir les détails"
        emptyMessage="Aucune famille enregistrée"
        exportable={true}
        refreshable={true}
        onRefresh={refresh}
      />

      {/* Modal Ajout */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter une nouvelle famille"
        size="md"
      >
        <form onSubmit={handleAddFamille} className="space-y-4">
          <Input
            label="Nom de la famille"
            name="nomFamille"
            value={formData.nomFamille}
            onChange={(e) => setFormData({ ...formData, nomFamille: e.target.value })}
            required
            placeholder="Ex: Famille MBARGA"
          />

          <Input
            label="Téléphone"
            name="contact"
            type="tel"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            placeholder="Ex: 6XXXXXXXX"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="exemple@email.com"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Ajouter la famille'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              fullWidth
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
