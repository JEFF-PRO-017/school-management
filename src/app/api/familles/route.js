import { NextResponse } from 'next/server';
import { getFamilles, addFamille, updateFamille, deleteFamille } from '@/lib/google-sheets';
import { logAudit, extractAuditInfo, AUDIT_ACTIONS } from '@/lib/audit';

export async function GET() {
  try {
    const familles = await getFamilles();
    return NextResponse.json(familles);
  } catch (error) {
    console.error('GET /familles:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}

export async function POST(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    const result = await addFamille(data);
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'familles',
      entityId: data.nomPere || data.nomMere,
      details: data,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /familles:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.CREATE, entity: 'familles', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const { rowIndex, ...data } = await request.json();
    const result = await updateFamille(rowIndex, data);
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'familles',
      entityId: `Row ${rowIndex}`,
      details: data,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /familles:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.UPDATE, entity: 'familles', status: 'ERROR', details: error.message });
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
    
    const result = await deleteFamille(parseInt(rowIndex));
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'familles',
      entityId: `Row ${rowIndex}`,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /familles:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.DELETE, entity: 'familles', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
