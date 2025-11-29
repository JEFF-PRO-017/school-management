import { google } from 'googleapis';

// ============================================
// CONFIGURATION
// ============================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Définition des tables avec leurs colonnes
const TABLES = {
  ELEVES: {
    name: 'ELEVES',
    headers: ['NOM', 'PRÉNOM', 'DATE NAISS.', 'CLASSE', 'ID FAMILLE', 'INSCRIPTION', 'PENSION', 'DOSSIER', 'RÉDUCTION', 'MOTIF RÉDUCTION', 'TOTAL DÛ', 'PAYÉ', 'RESTE', 'STATUT'],
    columns: 'A:N',
  },
  PAIEMENTS: {
    name: 'PAIEMENTS',
    headers: ['N° TRANS', 'DATE', 'ID ÉLÈVE', 'NOM ÉLÈVE', 'ID FAMILLE', 'TYPE', 'MONTANT PAYÉ'],
    columns: 'A:G',
  },
  FAMILLES: {
    name: 'FAMILLES',
    headers: ['ID', 'NOM FAMILLE', 'CONTACT', 'EMAIL', 'NB ENFANTS', 'TOTAL FAMILLE', 'PAYÉ', 'RESTE', 'STATUT'],
    columns: 'A:I',
  },
  MORATOIRE: {
    name: 'MORATOIRE',
    headers: ['ID', 'ID FAMILLE', 'DATE DÉBUT', 'DATE FIN', 'DURÉE', 'NOTES', 'STATUT'],
    columns: 'A:G',
  },
};

// ============================================
// CLIENT GOOGLE SHEETS
// ============================================

const getGoogleSheetsClient = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!clientEmail || !privateKey) {
    throw new Error('❌ Variables d\'environnement Google manquantes');
  }
  
  if (!SPREADSHEET_ID) {
    throw new Error('❌ GOOGLE_SHEETS_SPREADSHEET_ID non défini');
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Convertir les lignes en objets
 */
const rowsToObjects = (headers, rows) => {
  return rows.map((row, index) => {
    const obj = { rowIndex: index + 2 }; // +2 car header + index Sheets commence à 1
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });
};

/**
 * Vérifier si une feuille existe
 */
const sheetExists = async (sheets, sheetName) => {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    return spreadsheet.data.sheets.some(s => s.properties.title === sheetName);
  } catch (error) {
    return false;
  }
};

/**
 * Créer une feuille avec ses en-têtes
 */
const createSheet = async (sheets, tableName) => {
  try {
    const table = TABLES[tableName];
    if (!table) {
      throw new Error(`Table ${tableName} non définie`);
    }
    
    console.log(`📝 Création de la feuille ${table.name}...`);
    
    // Créer la feuille
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: table.name,
            },
          },
        }],
      },
    });
    
    // Ajouter les en-têtes
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${table.name}!A1:${String.fromCharCode(64 + table.headers.length)}1`,
      valueInputOption: 'RAW',
      resource: {
        values: [table.headers],
      },
    });
    
    console.log(`✅ Feuille ${table.name} créée avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur création feuille ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * S'assurer qu'une feuille existe (créer si nécessaire)
 */
const ensureSheetExists = async (sheets, tableName) => {
  const exists = await sheetExists(sheets, TABLES[tableName].name);
  if (!exists) {
    await createSheet(sheets, tableName);
  }
  return true;
};

/**
 * Obtenir l'ID d'une feuille
 */
const getSheetId = async (sheets, sheetName) => {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  const sheet = spreadsheet.data.sheets.find(
    s => s.properties.title === sheetName
  );
  
  if (!sheet) {
    throw new Error(`Feuille ${sheetName} non trouvée`);
  }
  
  return sheet.properties.sheetId;
};

// ============================================
// OPÉRATIONS CRUD GÉNÉRIQUES
// ============================================

/**
 * GET - Récupérer toutes les données d'une table
 */
const getAll = async (tableName) => {
  try {
    const sheets = getGoogleSheetsClient();
    const table = TABLES[tableName];
    
    // S'assurer que la feuille existe
    await ensureSheetExists(sheets, tableName);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${table.name}!${table.columns}`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return rowsToObjects(headers, dataRows);
  } catch (error) {
    console.error(`❌ Erreur GET ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * GET BY ID - Récupérer un élément par ID ou rowIndex
 */
const getById = async (tableName, id) => {
  const items = await getAll(tableName);
  return items.find(item => 
    item.ID === id || 
    item['ID FAMILLE'] === id || 
    item.rowIndex === parseInt(id)
  );
};

/**
 * ADD - Ajouter une ligne
 */
const add = async (tableName, data, generateId = false) => {
  try {
    const sheets = getGoogleSheetsClient();
    const table = TABLES[tableName];
    
    // S'assurer que la feuille existe
    await ensureSheetExists(sheets, tableName);
    
    let values = data;
    
    // Générer un ID automatique si demandé
    if (generateId) {
      const items = await getAll(tableName);
      const lastId = items.length > 0 
        ? Math.max(...items.map(item => parseInt(item.ID || item['N° TRANS'] || 0)))
        : 0;
      const newId = lastId + 1;
      values = [newId.toString(), ...data.slice(1)];
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${table.name}!${table.columns}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [values] },
    });

    return { success: true, id: values[0] };
  } catch (error) {
    console.error(`❌ Erreur ADD ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * UPDATE - Mettre à jour une ligne
 */
const update = async (tableName, rowIndex, data) => {
  try {
    const sheets = getGoogleSheetsClient();
    const table = TABLES[tableName];

    const lastColumn = String.fromCharCode(64 + table.headers.length);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${table.name}!A${rowIndex}:${lastColumn}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [data] },
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur UPDATE ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * DELETE - Supprimer une ligne
 */
const deleteRow = async (tableName, rowIndex) => {
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = await getSheetId(sheets, TABLES[tableName].name);
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-indexed
              endIndex: rowIndex,
            },
          },
        }],
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur DELETE ${tableName}:`, error.message);
    throw error;
  }
};

// ============================================
// API ÉLÈVES
// ============================================

export const getEleves = () => getAll('ELEVES');

export const getEleveById = (id) => getById('ELEVES', id);

export const addEleve = async (eleveData) => {
  const data = [
    eleveData.nom || '',
    eleveData.prenom || '',
    eleveData.dateNaissance || '',
    eleveData.classe || '',
    eleveData.idFamille || '',
    eleveData.inscription || '10000', // Inscription fixe
    eleveData.pension || '0', // Pension (ancien scolarité)
    eleveData.dossier || '0',
    eleveData.reduction || '0', // Réduction (ancien autres en négatif)
    eleveData.motifReduction || '', // Motif de la réduction
    eleveData.totalDu || '0',
    eleveData.paye || '0',
    eleveData.reste || '0',
    eleveData.statut || 'EN ATTENTE',
  ];
  return add('ELEVES', data);
};

export const updateEleve = async (rowIndex, eleveData) => {
  const data = [
    eleveData.nom || '',
    eleveData.prenom || '',
    eleveData.dateNaissance || '',
    eleveData.classe || '',
    eleveData.idFamille || '',
    eleveData.inscription || '10000',
    eleveData.pension || '0',
    eleveData.dossier || '0',
    eleveData.reduction || '0',
    eleveData.motifReduction || '',
    eleveData.totalDu || '0',
    eleveData.paye || '0',
    eleveData.reste || '0',
    eleveData.statut || 'EN ATTENTE',
  ];
  return update('ELEVES', rowIndex, data);
};

export const deleteEleve = (rowIndex) => deleteRow('ELEVES', rowIndex);

// ============================================
// API PAIEMENTS
// ============================================

export const getPaiements = () => getAll('PAIEMENTS');

export const addPaiement = async (paiementData) => {
  const data = [
    '', // ID sera généré automatiquement
    paiementData.date || new Date().toLocaleDateString('fr-FR'),
    paiementData.idEleve || '',
    paiementData.nomEleve || '',
    paiementData.idFamille || '',
    paiementData.type || 'ESPECES',
    paiementData.montantPaye || '0',
  ];
  return add('PAIEMENTS', data, true);
};

export const deletePaiement = (rowIndex) => deleteRow('PAIEMENTS', rowIndex);

// ============================================
// API FAMILLES
// ============================================

export const getFamilles = () => getAll('FAMILLES');

export const getFamilleById = (id) => getById('FAMILLES', id);

export const addFamille = async (familleData) => {
  const data = [
    '', // ID sera généré automatiquement
    familleData.nomFamille || '',
    familleData.contact || '',
    familleData.email || '',
    familleData.nbEnfants || '0',
    familleData.totalFamille || '0',
    familleData.paye || '0',
    familleData.reste || '0',
    familleData.statut || 'EN ATTENTE',
  ];
  return add('FAMILLES', data, true);
};

export const updateFamille = async (rowIndex, familleData) => {
  const data = [
    familleData.id || '',
    familleData.nomFamille || '',
    familleData.contact || '',
    familleData.email || '',
    familleData.nbEnfants || '0',
    familleData.totalFamille || '0',
    familleData.paye || '0',
    familleData.reste || '0',
    familleData.statut || 'EN ATTENTE',
  ];
  return update('FAMILLES', rowIndex, data);
};

export const deleteFamille = (rowIndex) => deleteRow('FAMILLES', rowIndex);

// ============================================
// API MORATOIRES
// ============================================

export const getMoratoires = () => getAll('MORATOIRE');

export const addMoratoire = async (moratoireData) => {
  // Calculer la date de fin automatiquement
  const dateDebut = new Date();
  const dateFin = new Date(dateDebut);
  dateFin.setDate(dateFin.getDate() + (parseInt(moratoireData.duree) * 7));
  
  // Calculer le statut
  const today = new Date();
  let statut = 'EN COURS';
  if (today > dateFin) {
    statut = 'EN RETARD';
  }
  
  const data = [
    '', // ID sera généré automatiquement
    moratoireData.idFamille || '',
    dateDebut.toLocaleDateString('fr-FR'),
    dateFin.toLocaleDateString('fr-FR'),
    moratoireData.duree || '1',
    moratoireData.notes || '',
    statut,
  ];
  return add('MORATOIRE', data, true);
};

export const updateMoratoire = async (rowIndex, moratoireData) => {
  const data = [
    moratoireData.id || '',
    moratoireData.idFamille || '',
    moratoireData.dateDebut || '',
    moratoireData.dateFin || '',
    moratoireData.duree || '',
    moratoireData.notes || '',
    moratoireData.statut || 'EN COURS',
  ];
  return update('MORATOIRE', rowIndex, data);
};

export const deleteMoratoire = (rowIndex) => deleteRow('MORATOIRE', rowIndex);

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialiser toutes les tables (créer si elles n'existent pas)
 */
export const initializeTables = async () => {
  try {
    console.log('🚀 Initialisation des tables...');
    const sheets = getGoogleSheetsClient();
    
    for (const tableName of Object.keys(TABLES)) {
      await ensureSheetExists(sheets, tableName);
    }
    
    console.log('✅ Toutes les tables sont prêtes');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur initialisation:', error.message);
    throw error;
  }
};