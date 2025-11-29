import { NextResponse } from 'next/server';
import { getEleves, addEleve, updateEleve, deleteEleve } from '@/lib/google-sheets';
import { logAudit, extractAuditInfo, AUDIT_ACTIONS } from '@/lib/audit';

// Cache simple en mémoire (production: Redis)
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
      console.log('✨ Using cache for /api/eleves');
      return NextResponse.json(cacheData);
    }

    // ✅ Fetch depuis Google Sheets
    console.log('🔍 Fetching from Google Sheets...');
    const eleves = await getEleves();
    
    // ✅ Mettre en cache
    cacheData = eleves;
    cacheTimestamp = now;
    
    console.log(`✅ GET /api/eleves: ${eleves.length} items`);
    return NextResponse.json(eleves);
    
  } catch (error) {
    console.error('❌ GET /api/eleves:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des élèves', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    
    console.log('➕ POST /api/eleves:', data.nom, data.prenom);
    
    const result = await addEleve(data);
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'eleves',
      entityId: `${data.nom} ${data.prenom}`,
      details: data,
    });
    
    console.log('✅ Élève ajouté');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ POST /api/eleves:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.CREATE, 
      entity: 'eleves', 
      status: 'ERROR', 
      details: error.message 
    });
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const { rowIndex, ...data } = await request.json();
    
    if (!rowIndex) {
      return NextResponse.json(
        { error: 'rowIndex requis' }, 
        { status: 400 }
      );
    }
    
    console.log('✏️ PUT /api/eleves:', rowIndex);
    
    const result = await updateEleve(rowIndex, data);
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'eleves',
      entityId: `Row ${rowIndex}`,
      details: data,
    });
    
    console.log('✅ Élève mis à jour');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ PUT /api/eleves:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.UPDATE, 
      entity: 'eleves', 
      status: 'ERROR', 
      details: error.message 
    });
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour', details: error.message }, 
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
    
    console.log('🗑️ DELETE /api/eleves:', rowIndex);
    
    const result = await deleteEleve(parseInt(rowIndex));
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'eleves',
      entityId: `Row ${rowIndex}`,
    });
    
    console.log('✅ Élève supprimé');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ DELETE /api/eleves:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.DELETE, 
      entity: 'eleves', 
      status: 'ERROR', 
      details: error.message 
    });
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: error.message }, 
      { status: 500 }
    );
  }
}