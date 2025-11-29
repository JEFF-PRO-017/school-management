import { NextResponse } from 'next/server';
import { getMoratoires, addMoratoire, updateMoratoire, deleteMoratoire } from '@/lib/google-sheets';
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
      console.log('✨ Using cache for /api/moratoires');
      return NextResponse.json(cacheData);
    }

    // ✅ Fetch depuis Google Sheets
    console.log('🔍 Fetching from Google Sheets...');
    const moratoires = await getMoratoires();
    
    // ✅ Mettre en cache
    cacheData = moratoires;
    cacheTimestamp = now;
    
    console.log(`✅ GET /api/moratoires: ${moratoires.length} items`);
    return NextResponse.json(moratoires);
    
  } catch (error) {
    console.error('❌ GET /api/moratoires:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des moratoires', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    
    console.log('⏰ POST /api/moratoires:', data.idFamille, data.duree, 'semaines');
    
    const result = await addMoratoire(data);
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'moratoires',
      entityId: `Famille ${data.idFamille} - ${data.duree} semaines`,
      details: data,
    });
    
    console.log('✅ Moratoire accordé');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ POST /api/moratoires:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.CREATE, 
      entity: 'moratoires', 
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
    
    console.log('✏️ PUT /api/moratoires:', rowIndex);
    
    const result = await updateMoratoire(rowIndex, data);
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'moratoires',
      entityId: `Row ${rowIndex}`,
      details: data,
    });
    
    console.log('✅ Moratoire mis à jour');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ PUT /api/moratoires:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.UPDATE, 
      entity: 'moratoires', 
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
    
    console.log('🗑️ DELETE /api/moratoires:', rowIndex);
    
    const result = await deleteMoratoire(parseInt(rowIndex));
    
    // ✅ Invalider le cache
    cacheData = null;
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'moratoires',
      entityId: `Row ${rowIndex}`,
    });
    
    console.log('✅ Moratoire supprimé');
    return NextResponse.json({ success: true, ...result });
    
  } catch (error) {
    console.error('❌ DELETE /api/moratoires:', error);
    await logAudit({ 
      ...auditInfo, 
      action: AUDIT_ACTIONS.DELETE, 
      entity: 'moratoires', 
      status: 'ERROR', 
      details: error.message 
    });
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: error.message }, 
      { status: 500 }
    );
  }
}