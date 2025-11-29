import { NextResponse } from 'next/server';
import { getFamilles, addFamille, updateFamille, deleteFamille } from '@/lib/google-sheets';
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
      console.log('✨ Using cache for /api/familles');
      return NextResponse.json(cacheData);
    }

    // ✅ Fetch depuis Google Sheets
    console.log('🔍 Fetching from Google Sheets...');
    const familles = await getFamilles();
    
    // ✅ Mettre en cache
    cacheData = familles;
    cacheTimestamp = now;
    
    console.log(`✅ GET /api/familles: ${familles.length} items`);
    return NextResponse.json(familles);
    
  } catch (error) {
    console.error('❌ GET /api/familles:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des familles', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    
    console.log('👨‍👩‍👧‍👦 POST /api/familles:', data.nomFamille);
    
    const result = await addFamille(data);
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'familles',
      entityId: data.nomFamille,
      details: data,
    });
    
    console.log('✅ Famille ajoutée');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ POST /api/familles:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.CREATE, 
      entity: 'familles', 
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
    
    console.log('✏️ PUT /api/familles:', rowIndex);
    
    const result = await updateFamille(rowIndex, data);
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'familles',
      entityId: `Row ${rowIndex}`,
      details: data,
    });
    
    console.log('✅ Famille mise à jour');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ PUT /api/familles:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.UPDATE, 
      entity: 'familles', 
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
    
    console.log('🗑️ DELETE /api/familles:', rowIndex);
    
    const result = await deleteFamille(parseInt(rowIndex));
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'familles',
      entityId: `Row ${rowIndex}`,
    });
    
    console.log('✅ Famille supprimée');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ DELETE /api/familles:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.DELETE, 
      entity: 'familles', 
      status: 'ERROR', 
      details: error.message 
    });
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: error.message }, 
      { status: 500 }
    );
  }
}