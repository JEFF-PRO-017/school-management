// test-connection.js
// Exécutez avec : node test-connection.js

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Test de connexion Google Sheets\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Vérifier les variables d'environnement
console.log('1️⃣  Vérification des variables d\'environnement:\n');

const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;

if (spreadsheetId) {
  console.log('   ✅ GOOGLE_SHEETS_SPREADSHEET_ID:', spreadsheetId.substring(0, 20) + '...');
} else {
  console.log('   ❌ GOOGLE_SHEETS_SPREADSHEET_ID: MANQUANT !');
}

if (email) {
  console.log('   ✅ GOOGLE_SERVICE_ACCOUNT_EMAIL:', email);
} else {
  console.log('   ❌ GOOGLE_SERVICE_ACCOUNT_EMAIL: MANQUANT !');
}

if (privateKey) {
  const keyStart = privateKey.substring(0, 30);
  const keyEnd = privateKey.substring(privateKey.length - 30);
  console.log('   ✅ GOOGLE_PRIVATE_KEY: Présente');
  console.log('      Début:', keyStart + '...');
  console.log('      Fin: ...' + keyEnd);
  
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('   ⚠️  ATTENTION: La clé ne semble pas commencer correctement !');
  }
  if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    console.log('   ⚠️  ATTENTION: La clé ne semble pas finir correctement !');
  }
} else {
  console.log('   ❌ GOOGLE_PRIVATE_KEY: MANQUANTE !');
}

console.log('\n═══════════════════════════════════════════════════════════════\n');

// 2. Tester la connexion
if (spreadsheetId && email && privateKey) {
  console.log('2️⃣  Test de connexion à Google Sheets...\n');
  
  const { google } = require('googleapis');
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'ELEVES!A1:A5',
    }).then(response => {
      console.log('   ✅ CONNEXION RÉUSSIE !\n');
      console.log('   Données reçues:', response.data.values);
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('\n🎉 Tout fonctionne ! Vous pouvez lancer l\'application avec npm run dev\n');
    }).catch(error => {
      console.log('   ❌ ERREUR DE CONNEXION:\n');
      console.log('   Message:', error.message);
      
      if (error.message.includes('permission')) {
        console.log('\n   💡 Solution: Partagez le Google Sheet avec l\'email du service account');
      } else if (error.message.includes('not found')) {
        console.log('\n   💡 Solution: Vérifiez l\'ID du spreadsheet dans .env.local');
      } else if (error.message.includes('invalid_grant')) {
        console.log('\n   💡 Solution: La clé privée est incorrecte, vérifiez le format');
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════\n');
    });
    
  } catch (error) {
    console.log('   ❌ ERREUR:', error.message);
  }
} else {
  console.log('❌ Impossible de tester: variables d\'environnement manquantes\n');
  console.log('📝 Créez le fichier .env.local avec les bonnes valeurs.\n');
}
