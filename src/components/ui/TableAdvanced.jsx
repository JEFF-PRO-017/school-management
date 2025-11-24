'use client';

import { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';

export default function TableAdvanced({ 
  columns, 
  data, 
  onRowClick, 
  emptyMessage = 'Aucune donnée disponible',
  title,
  subtitle,
  exportable = true,
  refreshable = false,
  onRefresh,
}) {
  // États
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col, idx) => ({ ...acc, [idx]: true }), {})
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Filtrage des données
  const filteredData = useMemo(() => {
    let result = [...(data || [])];

    // Recherche globale
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      result = result.filter(row => {
        return columns.some(col => {
          const value = col.accessor ? row[col.accessor] : '';
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // Filtres par colonne
    Object.keys(columnFilters).forEach(columnIndex => {
      const filterValue = columnFilters[columnIndex];
      if (filterValue) {
        const column = columns[columnIndex];
        if (column.accessor) {
          result = result.filter(row => {
            const cellValue = String(row[column.accessor] || '').toLowerCase();
            return cellValue.includes(filterValue.toLowerCase());
          });
        }
      }
    });

    return result;
  }, [data, globalSearch, columnFilters, columns]);

  // Tri des données
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const column = columns[sortConfig.key];
    if (!column || !column.accessor) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[column.accessor] || '';
      const bValue = b[column.accessor] || '';

      // Essayer de trier comme des nombres
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Sinon trier comme des chaînes
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Handlers
  const handleSort = useCallback((columnIndex) => {
    setSortConfig(prev => ({
      key: columnIndex,
      direction: prev.key === columnIndex && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleColumnFilterChange = useCallback((columnIndex, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setGlobalSearch('');
    setColumnFilters({});
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  }, []);

  const handleExport = useCallback(() => {
    const visibleCols = columns.filter((_, idx) => visibleColumns[idx]);
    const headers = visibleCols.map(col => col.header).join(',');
    const rows = sortedData.map(row => 
      visibleCols.map(col => {
        const value = col.accessor ? row[col.accessor] : '';
        // Échapper les virgules et guillemets
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [columns, sortedData, visibleColumns]);

  const toggleColumnVisibility = useCallback((columnIndex) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnIndex]: !prev[columnIndex]
    }));
  }, []);

  // Génération des numéros de page
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Colonnes visibles
  const displayedColumns = columns.filter((_, idx) => visibleColumns[idx]);

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = globalSearch || Object.values(columnFilters).some(v => v);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header avec titre et actions */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Titre */}
          <div>
            {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {sortedData.length} résultat{sortedData.length > 1 ? 's' : ''} 
              {hasActiveFilters && ` (filtré sur ${data.length})`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Recherche globale */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 w-48 lg:w-64 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-50 border-primary-300 text-primary-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Filtres par colonne"
            >
              <Filter className="w-5 h-5" />
            </button>

            {/* Sélecteur de colonnes */}
            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                title="Colonnes visibles"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
              
              {showColumnSelector && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Colonnes visibles</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {columns.map((col, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[idx]}
                          onChange={() => toggleColumnVisibility(idx)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{col.header}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-all"
                title="Effacer tous les filtres"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Refresh */}
            {refreshable && onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}

            {/* Export */}
            {exportable && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exporter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtres par colonne */}
      {showFilters && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 animate-fade-in">
          <div className="flex flex-wrap gap-3">
            {displayedColumns.map((column, displayIdx) => {
              const originalIdx = columns.indexOf(column);
              if (!column.accessor) return null;
              
              return (
                <div key={displayIdx} className="flex-1 min-w-[150px] max-w-[250px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {column.header}
                  </label>
                  <input
                    type="text"
                    placeholder={`Filtrer ${column.header.toLowerCase()}...`}
                    value={columnFilters[originalIdx] || ''}
                    onChange={(e) => handleColumnFilterChange(originalIdx, e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {displayedColumns.map((column, displayIdx) => {
                const originalIdx = columns.indexOf(column);
                const isSorted = sortConfig.key === originalIdx;
                
                return (
                  <th
                    key={displayIdx}
                    scope="col"
                    onClick={() => column.accessor && handleSort(originalIdx)}
                    className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                      column.accessor ? 'cursor-pointer hover:bg-gray-100 select-none transition-colors' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.accessor && (
                        <div className="flex flex-col">
                          <ChevronUp 
                            className={`w-3 h-3 -mb-1 ${
                              isSorted && sortConfig.direction === 'asc' 
                                ? 'text-primary-600' 
                                : 'text-gray-300'
                            }`}
                          />
                          <ChevronDown 
                            className={`w-3 h-3 ${
                              isSorted && sortConfig.direction === 'desc' 
                                ? 'text-primary-600' 
                                : 'text-gray-300'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    ${onRowClick ? 'hover:bg-primary-50 cursor-pointer' : 'hover:bg-gray-50'}
                    transition-colors duration-150
                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  `}
                >
                  {displayedColumns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={displayedColumns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Search className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">Aucun résultat pour ces filtres</p>
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Effacer les filtres
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info et sélecteur de lignes */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Afficher</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {[5, 10, 25, 50, 100].map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">lignes</span>
              </div>
              
              <div className="hidden sm:block text-sm text-gray-500">
                <span className="font-medium">{startIndex + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(endIndex, sortedData.length)}</span>
                {' sur '}
                <span className="font-medium">{sortedData.length}</span>
              </div>
            </div>

            {/* Boutons de pagination */}
            <div className="flex items-center gap-1">
              {/* Première page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Première page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Page précédente */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numéros de page */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={idx} className="px-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] h-10 rounded-lg font-medium text-sm transition-all ${
                        currentPage === page
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* Indicateur mobile */}
              <div className="sm:hidden px-4 py-2 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </div>

              {/* Page suivante */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dernière page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Dernière page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Style pour l'animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
