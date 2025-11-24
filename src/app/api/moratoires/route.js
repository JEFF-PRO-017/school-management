import { NextResponse } from 'next/server';
import { getMoratoires, addMoratoire, updateMoratoire, deleteMoratoire } from '@/lib/google-sheets';
import { logAudit, extractAuditInfo, AUDIT_ACTIONS } from '@/lib/audit';

export async function GET() {
  try {
    const moratoires = await getMoratoires();
    return NextResponse.json(moratoires);
  } catch (error) {
    console.error('GET /moratoires:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}

export async function POST(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    const result = await addMoratoire(data);
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'moratoires',
      entityId: data.nomEleve,
      details: data,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /moratoires:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.CREATE, entity: 'moratoires', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const { rowIndex, ...data } = await request.json();
    const result = await updateMoratoire(rowIndex, data);
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'moratoires',
      entityId: `Row ${rowIndex}`,
      details: data,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /moratoires:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.UPDATE, entity: 'moratoires', status: 'ERROR', details: error.message });
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
    
    const result = await deleteMoratoire(parseInt(rowIndex));
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'moratoires',
      entityId: `Row ${rowIndex}`,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /moratoires:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.DELETE, entity: 'moratoires', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
