import { NextResponse } from 'next/server';
import { getEleves, addEleve, updateEleve, deleteEleve } from '@/lib/google-sheets';
import { logAudit, extractAuditInfo, AUDIT_ACTIONS } from '@/lib/audit';

export async function GET(request) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Configuration Google Sheets manquante' },
        { status: 500 }
      );
    }
    
    const eleves = await getEleves();
    return NextResponse.json(eleves);
  } catch (error) {
    console.error('❌ GET /eleves:', error.message);
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
    const result = await addEleve(data);
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'eleves',
      entityId: `${data.NOM} ${data.PRÉNOM}`,
      details: data,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /eleves:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.CREATE, entity: 'eleves', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const { rowIndex, ...data } = await request.json();
    const result = await updateEleve(rowIndex, data);
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'eleves',
      entityId: `Row ${rowIndex}`,
      details: data,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /eleves:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.UPDATE, entity: 'eleves', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auditInfo = extractAuditInfo(request);
  const { searchParams } = new URL(request.url);
  const rowIndex = searchParams.get('rowIndex');
  
  try {
    if (!rowIndex) {
      return NextResponse.json({ error: 'rowIndex requis' }, { status: 400 });
    }
    
    const result = await deleteEleve(parseInt(rowIndex));
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'eleves',
      entityId: `Row ${rowIndex}`,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /eleves:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.DELETE, entity: 'eleves', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
