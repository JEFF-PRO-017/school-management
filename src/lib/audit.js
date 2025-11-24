/**
 * Système d'audit pour tracer les opérations
 * Enregistre qui fait quoi et quand
 */

import { google } from 'googleapis';

const AUDIT_SHEET_NAME = 'AUDIT';

// Colonnes de la feuille AUDIT
const AUDIT_HEADERS = [
  'TIMESTAMP',
  'DEVICE_ID',
  'DEVICE_NAME',
  'ACTION',
  'ENTITY',
  'ENTITY_ID',
  'DETAILS',
  'IP_ADDRESS',
  'USER_AGENT',
  'STATUS',
];

/**
 * Obtenir le client Google Sheets
 */
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

/**
 * Extraire les infos d'audit des headers de la requête
 */
export function extractAuditInfo(request) {
  const headers = request.headers;
  
  return {
    deviceId: headers.get('x-device-id') || 'unknown',
    deviceName: headers.get('x-device-name') || 'unknown',
    requestTime: headers.get('x-request-time') || new Date().toISOString(),
    userAgent: headers.get('user-agent') || 'unknown',
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               'unknown',
  };
}

/**
 * Enregistrer une entrée d'audit
 */
export async function logAudit({
  deviceId,
  deviceName,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
  status = 'SUCCESS',
}) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Vérifier si la feuille AUDIT existe, sinon la créer
    await ensureAuditSheetExists(sheets, spreadsheetId);

    // Ajouter l'entrée d'audit
    const values = [[
      new Date().toISOString(),
      deviceId,
      deviceName,
      action,
      entity,
      entityId || '',
      typeof details === 'object' ? JSON.stringify(details) : details || '',
      ipAddress,
      userAgent?.substring(0, 200) || '', // Limiter la taille
      status,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${AUDIT_SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    console.log(`[Audit] ${action} on ${entity} by ${deviceName}`);
  } catch (error) {
    // Ne pas faire échouer l'opération principale si l'audit échoue
    console.error('[Audit] Error logging:', error.message);
  }
}

/**
 * S'assurer que la feuille AUDIT existe
 */
async function ensureAuditSheetExists(sheets, spreadsheetId) {
  try {
    // Vérifier si la feuille existe
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const auditSheet = response.data.sheets.find(
      sheet => sheet.properties.title === AUDIT_SHEET_NAME
    );

    if (!auditSheet) {
      // Créer la feuille
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: AUDIT_SHEET_NAME,
              },
            },
          }],
        },
      });

      // Ajouter les en-têtes
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${AUDIT_SHEET_NAME}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [AUDIT_HEADERS],
        },
      });

      console.log('[Audit] Sheet created');
    }
  } catch (error) {
    console.error('[Audit] Error ensuring sheet exists:', error.message);
  }
}

/**
 * Obtenir l'historique d'audit
 */
export async function getAuditHistory(filters = {}) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${AUDIT_SHEET_NAME}!A:J`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);

    let audits = dataRows.map((row, index) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    // Appliquer les filtres
    if (filters.entity) {
      audits = audits.filter(a => a.ENTITY === filters.entity);
    }
    if (filters.deviceId) {
      audits = audits.filter(a => a.DEVICE_ID === filters.deviceId);
    }
    if (filters.action) {
      audits = audits.filter(a => a.ACTION === filters.action);
    }
    if (filters.fromDate) {
      audits = audits.filter(a => new Date(a.TIMESTAMP) >= new Date(filters.fromDate));
    }
    if (filters.toDate) {
      audits = audits.filter(a => new Date(a.TIMESTAMP) <= new Date(filters.toDate));
    }

    // Trier par date décroissante
    audits.sort((a, b) => new Date(b.TIMESTAMP) - new Date(a.TIMESTAMP));

    // Limiter le nombre de résultats
    if (filters.limit) {
      audits = audits.slice(0, filters.limit);
    }

    return audits;
  } catch (error) {
    console.error('[Audit] Error getting history:', error.message);
    return [];
  }
}

/**
 * Actions d'audit standards
 */
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  LOGIN: 'LOGIN',
  SYNC: 'SYNC',
};
