import { google } from 'googleapis';

// Configuration de l'authentification Google
const getGoogleSheetsClient = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  // Vérification des credentials
  if (!clientEmail) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL non défini dans .env.local');
  }
  
  if (!privateKey) {
    throw new Error('GOOGLE_PRIVATE_KEY non défini dans .env.local');
  }
  
  console.log('🔐 Connexion Google avec:', clientEmail);
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Vérification au démarrage
if (!SPREADSHEET_ID) {
  console.warn('⚠️ GOOGLE_SHEETS_SPREADSHEET_ID non défini - l\'application ne fonctionnera pas correctement');
}

// Fonction utilitaire pour convertir les lignes en objets
const rowsToObjects = (headers, rows) => {
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
};

// ÉLÈVES
export const getEleves = async () => {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ELEVES!A3:M',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return rowsToObjects(headers, dataRows).map((eleve, index) => ({
      ...eleve,
      rowIndex: index + 2, // +2 car index 0 = header, et Sheets commence à 1
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des élèves:', error);
    throw error;
  }
};

export const getEleveById = async (id) => {
  const eleves = await getEleves();
  return eleves.find(e => e['ID FAMILLE'] === id || e.rowIndex === parseInt(id));
};

export const addEleve = async (eleveData) => {
  try {
    const sheets = getGoogleSheetsClient();
    const values = [[
      eleveData.nom || '',
      eleveData.prenom || '',
      eleveData.dateNaissance || '',
      eleveData.classe || '',
      eleveData.idFamille || '',
      eleveData.inscription || '0',
      eleveData.scolarite || '0',
      eleveData.dossier || '0',
      eleveData.autres || '0',
      eleveData.totalDu || '0',
      eleveData.paye || '0',
      eleveData.reste || '0',
      eleveData.statut || 'EN ATTENTE',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ELEVES!A:M',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'élève:', error);
    throw error;
  }
};

export const updateEleve = async (rowIndex, eleveData) => {
  try {
    const sheets = getGoogleSheetsClient();
    const values = [[
      eleveData.nom || '',
      eleveData.prenom || '',
      eleveData.dateNaissance || '',
      eleveData.classe || '',
      eleveData.idFamille || '',
      eleveData.inscription || '0',
      eleveData.scolarite || '0',
      eleveData.dossier || '0',
      eleveData.autres || '0',
      eleveData.totalDu || '0',
      eleveData.paye || '0',
      eleveData.reste || '0',
      eleveData.statut || 'EN ATTENTE',
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `ELEVES!A${rowIndex}:M${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'élève:', error);
    throw error;
  }
};

// PAIEMENTS
export const getPaiements = async () => {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'PAIEMENTS!A15:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return rowsToObjects(headers, dataRows).map((paiement, index) => ({
      ...paiement,
      rowIndex: index + 2,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    throw error;
  }
};

export const addPaiement = async (paiementData) => {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Générer un numéro de transaction unique
    const paiements = await getPaiements();
    const lastTransNum = paiements.length > 0 
      ? Math.max(...paiements.map(p => parseInt(p['N° TRANS']) || 0))
      : 0;
    const newTransNum = lastTransNum + 1;

    const values = [[
      newTransNum.toString(),
      paiementData.date || new Date().toLocaleDateString('fr-FR'),
      paiementData.idEleve || '',
      paiementData.nomEleve || '',
      paiementData.idFamille || '',
      paiementData.type || '',
      paiementData.montantPaye || '0',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'PAIEMENTS!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    return { success: true, transNum: newTransNum };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du paiement:', error);
    throw error;
  }
};

// FAMILLES
export const getFamilles = async () => {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'FAMILLES!A2:I',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return rowsToObjects(headers, dataRows).map((famille, index) => ({
      ...famille,
      rowIndex: index + 2,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des familles:', error);
    throw error;
  }
};

export const getFamilleById = async (id) => {
  const familles = await getFamilles();
  return familles.find(f => f.ID === id || f.rowIndex === parseInt(id));
};

export const addFamille = async (familleData) => {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Générer un ID unique pour la famille
    const familles = await getFamilles();
    const lastId = familles.length > 0 
      ? Math.max(...familles.map(f => parseInt(f.ID) || 0))
      : 0;
    const newId = lastId + 1;

    const values = [[
      newId.toString(),
      familleData.nomFamille || '',
      familleData.contact || '',
      familleData.email || '',
      familleData.nbEnfants || '0',
      familleData.totalFamille || '0',
      familleData.paye || '0',
      familleData.reste || '0',
      familleData.statut || 'EN ATTENTE',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'FAMILLES!A:I',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    return { success: true, id: newId };
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la famille:', error);
    throw error;
  }
};

export const updateFamille = async (rowIndex, familleData) => {
  try {
    const sheets = getGoogleSheetsClient();
    const values = [[
      familleData.id || '',
      familleData.nomFamille || '',
      familleData.contact || '',
      familleData.email || '',
      familleData.nbEnfants || '0',
      familleData.totalFamille || '0',
      familleData.paye || '0',
      familleData.reste || '0',
      familleData.statut || 'EN ATTENTE',
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `FAMILLES!A${rowIndex}:I${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la famille:', error);
    throw error;
  }
};

// MORATOIRES
export const getMoratoires = async () => {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MORATOIRE!A1:C',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return rowsToObjects(headers, dataRows).map((moratoire, index) => ({
      ...moratoire,
      rowIndex: index + 2,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des moratoires:', error);
    throw error;
  }
};

export const addMoratoire = async (moratoireData) => {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Générer un ID unique
    const moratoires = await getMoratoires();
    const lastId = moratoires.length > 0 
      ? Math.max(...moratoires.map(m => parseInt(m.ID) || 0))
      : 0;
    const newId = lastId + 1;

    const values = [[
      newId.toString(),
      moratoireData.idFamille || '',
      moratoireData.date || new Date().toLocaleDateString('fr-FR'),
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MORATOIRE!A:C',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    return { success: true, id: newId };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du moratoire:', error);
    throw error;
  }
};

export const updateMoratoire = async (rowIndex, moratoireData) => {
  try {
    const sheets = getGoogleSheetsClient();
    const values = [[
      moratoireData.id || '',
      moratoireData.idFamille || '',
      moratoireData.date || '',
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `MORATOIRE!A${rowIndex}:C${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du moratoire:', error);
    throw error;
  }
};

// ===== FONCTIONS DE SUPPRESSION =====

/**
 * Fonction générique de suppression d'une ligne
 * Note: Google Sheets API ne permet pas de supprimer une ligne directement via values API
 * On vide donc la ligne et elle reste en place
 */
const clearRow = async (sheetName, rowIndex, numColumns) => {
  try {
    const sheets = getGoogleSheetsClient();
    const emptyValues = [Array(numColumns).fill('')];
    
    const columnLetter = String.fromCharCode(64 + numColumns); // A=1, B=2, etc.
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex}:${columnLetter}${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: emptyValues },
    });

    return { success: true };
  } catch (error) {
    console.error(`Erreur lors de la suppression dans ${sheetName}:`, error);
    throw error;
  }
};

/**
 * Suppression réelle d'une ligne via batchUpdate
 */
const deleteRow = async (sheetName, rowIndex) => {
  try {
    const sheets = getGoogleSheetsClient();
    
    // D'abord, obtenir l'ID de la feuille
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets.find(
      s => s.properties.title === sheetName
    );
    
    if (!sheet) {
      throw new Error(`Feuille ${sheetName} non trouvée`);
    }
    
    const sheetId = sheet.properties.sheetId;
    
    // Supprimer la ligne
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
    console.error(`Erreur lors de la suppression de la ligne ${rowIndex} dans ${sheetName}:`, error);
    throw error;
  }
};

export const deleteEleve = async (rowIndex) => {
  return deleteRow('ELEVES', rowIndex);
};

export const deletePaiement = async (rowIndex) => {
  return deleteRow('PAIEMENTS', rowIndex);
};

export const deleteFamille = async (rowIndex) => {
  return deleteRow('FAMILLES', rowIndex);
};

export const deleteMoratoire = async (rowIndex) => {
  return deleteRow('MORATOIRE', rowIndex);
};
