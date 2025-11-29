'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  Download,
  RefreshCw,
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
  // Protection hydratation
  const [mounted, setMounted] = useState(false);
  
  // États
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtrage des données
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    let result = [...data];

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

    return result;
  }, [data, globalSearch, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Handlers
  const clearAllFilters = useCallback(() => {
    setGlobalSearch('');
    setCurrentPage(1);
  }, []);

  const handleExport = useCallback(() => {
    const headers = columns.map(col => col.header).join(',');
    const rows = filteredData.map(row => 
      columns.map(col => {
        const value = col.accessor ? row[col.accessor] : '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [columns, filteredData]);

  // Générer les numéros de page (simplifié pour mobile)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3; // Réduit pour mobile
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 2) pages.push('...');
      if (currentPage > 1 && currentPage < totalPages) pages.push(currentPage);
      if (currentPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = globalSearch;

  // Attendre le montage
  if (!mounted) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="text-center py-12 sm:py-16">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm sm:text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header avec titre et actions */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Titre */}
          <div>
            {title && <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''} 
              {hasActiveFilters && ` (filtré sur ${data.length})`}
            </p>
          </div>

          {/* Actions - Responsive */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Recherche globale */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 sm:pl-9 pr-8 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-all"
                title="Effacer les filtres"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Refresh */}
            {refreshable && onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Export */}
            {exportable && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs sm:text-sm font-medium"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exporter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table - Responsive avec scroll horizontal sur mobile */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    ${onRowClick ? 'hover:bg-primary-50 cursor-pointer active:bg-primary-100' : 'hover:bg-gray-50'}
                    transition-colors duration-150
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900"
                    >
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 sm:py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm sm:text-base">Aucun résultat</p>
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
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

      {/* Pagination - Simplifiée pour mobile */}
      {filteredData.length > 0 && (
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Info et sélecteur de lignes */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-gray-600">Lignes</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {[5, 10, 25, 50].map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-500 flex-1 text-center sm:text-left">
                <span className="font-medium">{startIndex + 1}</span>
                {'-'}
                <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span>
                {' sur '}
                <span className="font-medium">{filteredData.length}</span>
              </div>
            </div>

            {/* Boutons de pagination */}
            <div className="flex items-center gap-1 w-full sm:w-auto justify-center">
              {/* Page précédente */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numéros de page */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={idx} className="px-2 text-gray-400 text-xs sm:text-sm">...</span>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 rounded-lg font-medium text-xs sm:text-sm transition-all ${
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

              {/* Page suivante */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-3 h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}