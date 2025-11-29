import { NextResponse } from 'next/server';
import { getPaiements, addPaiement, deletePaiement } from '@/lib/google-sheets';
import { logAudit, extractAuditInfo, AUDIT_ACTIONS } from '@/lib/audit';

// Cache en mémoire
let cacheData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 secondes

export async function GET(request) {
  try {
    // ✅ Vérifier configuration
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Configuration Google Sheets manquante' },
        { status: 500 }
      );
    }

    // ✅ Utiliser le cache si frais
    const now = Date.now();
    if (cacheData && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('✨ Using cache for /api/paiements');
      return NextResponse.json(cacheData);
    }

    // ✅ Fetch depuis Google Sheets
    console.log('🔍 Fetching from Google Sheets...');
    const paiements = await getPaiements();
    
    // ✅ Mettre en cache
    cacheData = paiements;
    cacheTimestamp = now;
    
    console.log(`✅ GET /api/paiements: ${paiements.length} items`);
    return NextResponse.json(paiements);
    
  } catch (error) {
    console.error('❌ GET /api/paiements:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paiements', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    
    console.log('💰 POST /api/paiements:', data.nomEleve, data.montantPaye);
    
    const result = await addPaiement(data);
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'paiements',
      entityId: `${data.nomEleve} - ${data.montantPaye}`,
      details: data,
    });
    
    console.log('✅ Paiement enregistré');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ POST /api/paiements:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.CREATE, 
      entity: 'paiements', 
      status: 'ERROR', 
      details: error.message 
    });
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auditInfo = extractAuditInfo(request);
  const { searchParams } = new URL(request.url);
  const rowIndex = searchParams.get('rowIndex');
  
  try {
    if (!rowIndex) {
      return NextResponse.json(
        { error: 'rowIndex requis' }, 
        { status: 400 }
      );
    }
    
    console.log('🗑️ DELETE /api/paiements:', rowIndex);
    
    const result = await deletePaiement(parseInt(rowIndex));
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'paiements',
      entityId: `Row ${rowIndex}`,
    });
    
    console.log('✅ Paiement supprimé');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ DELETE /api/paiements:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.DELETE, 
      entity: 'paiements', 
      status: 'ERROR', 
      details: error.message 
    });
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: error.message }, 
      { status: 500 }
    );
  }
}