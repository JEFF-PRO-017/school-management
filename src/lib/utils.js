// Formater les montants en devise
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF', // Franc CFA (Cameroun)
    minimumFractionDigits: 0,
  }).format(num);
};

// Formater les dates
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return dateString;
  }
};

// Obtenir le statut de paiement avec couleur
export const getPaymentStatus = (totalDu, paye) => {
  const total = parseFloat(totalDu) || 0;
  const paid = parseFloat(paye) || 0;
  
  if (paid >= total) {
    return { label: 'SOLDÉ', color: 'success' };
  } else if (paid > 0) {
    return { label: 'PARTIEL', color: 'warning' };
  } else {
    return { label: 'EN ATTENTE', color: 'danger' };
  }
};

// Calculer le reste à payer
export const calculateRemaining = (totalDu, paye) => {
  const total = parseFloat(totalDu) || 0;
  const paid = parseFloat(paye) || 0;
  return Math.max(0, total - paid);
};

// Calculer le pourcentage de paiement
export const calculatePaymentPercentage = (totalDu, paye) => {
  const total = parseFloat(totalDu) || 0;
  const paid = parseFloat(paye) || 0;
  
  if (total === 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
};

// Validation d'email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validation de téléphone (format Cameroun)
export const isValidPhone = (phone) => {
  // Format: 6XXXXXXXX ou +2376XXXXXXXX
  const regex = /^(\+237)?6[0-9]{8}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

// Générer une couleur basée sur le statut
export const getStatusColor = (statut) => {
  const status = statut?.toUpperCase() || '';
  
  if (status.includes('SOLDÉ')) return 'success';
  if (status.includes('PARTIEL')) return 'warning';
  if (status.includes('ATTENTE') || status.includes('IMPAYÉ')) return 'danger';
  
  return 'primary';
};

// Trier un tableau par une clé
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key] || '';
    const bVal = b[key] || '';
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

// Filtrer un tableau par recherche textuelle
export const filterBySearch = (array, searchTerm, keys) => {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key]?.toString().toLowerCase() || '';
      return value.includes(term);
    });
  });
};

// Grouper les élèves par famille
export const groupByFamily = (eleves) => {
  const grouped = {};
  
  eleves.forEach(eleve => {
    const familyId = eleve['ID FAMILLE'];
    if (!grouped[familyId]) {
      grouped[familyId] = [];
    }
    grouped[familyId].push(eleve);
  });
  
  return grouped;
};

// Calculer les statistiques globales
export const calculateStats = (eleves, paiements) => {
  const totalEleves = eleves.length;
  
  const totalDu = eleves.reduce((sum, e) => 
    sum + (parseFloat(e['TOTAL DÛ']) || 0), 0
  );
  
  const totalPaye = eleves.reduce((sum, e) => 
    sum + (parseFloat(e['PAYÉ']) || 0), 0
  );
  
  const totalReste = eleves.reduce((sum, e) => 
    sum + (parseFloat(e['RESTE']) || 0), 0
  );
  
  const elevesSoldes = eleves.filter(e => {
    const du = parseFloat(e['TOTAL DÛ']) || 0;
    const paye = parseFloat(e['PAYÉ']) || 0;
    return paye >= du && du > 0;
  }).length;
  
  const elevesPartiels = eleves.filter(e => {
    const du = parseFloat(e['TOTAL DÛ']) || 0;
    const paye = parseFloat(e['PAYÉ']) || 0;
    return paye > 0 && paye < du;
  }).length;
  
  const elevesImpaye = eleves.filter(e => {
    const paye = parseFloat(e['PAYÉ']) || 0;
    return paye === 0;
  }).length;
  
  return {
    totalEleves,
    totalDu,
    totalPaye,
    totalReste,
    elevesSoldes,
    elevesPartiels,
    elevesImpaye,
    tauxRecouvrement: totalDu > 0 ? (totalPaye / totalDu) * 100 : 0,
  };
};

// Générer un ID aléatoire
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// Debounce pour les recherches
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
