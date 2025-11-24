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
    
    // Calculer les dates automatiquement
    const dateDebut = new Date();
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + (parseInt(data.duree) * 7)); // duree en semaines
    
    // Formater les dates en DD/MM/YYYY
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    const moratoireData = {
      idFamille: data.idFamille,
      date: formatDate(dateDebut), // Date de début (aujourd'hui)
      dateEcheance: formatDate(dateEcheance), // Date calculée
      montant: data.montant || '',
      statut: 'EN COURS',
      notes: data.notes || '',
    };
    
    const result = await addMoratoire(moratoireData);
    
    // Audit
    await logAudit({
      action: AUDIT_ACTIONS.CREATE,
      entity: 'moratoire',
      entityId: result.rowIndex,
      details: `Famille ${data.idFamille} - ${data.duree} semaine(s)`,
      ...auditInfo,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /moratoires:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    const { rowIndex, ...updateData } = data;
    
    if (!rowIndex) {
      return NextResponse.json({ error: 'rowIndex requis' }, { status: 400 });
    }
    
    const result = await updateMoratoire(rowIndex, updateData);
    
    // Audit
    await logAudit({
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'moratoire',
      entityId: rowIndex,
      details: `Mise à jour moratoire ${rowIndex}`,
      ...auditInfo,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /moratoires:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = parseInt(searchParams.get('rowIndex'));
    
    if (!rowIndex) {
      return NextResponse.json({ error: 'rowIndex requis' }, { status: 400 });
    }
    
    const moratoires = await getMoratoires();
    const moratoire = moratoires.find(m => m.rowIndex === rowIndex);
    
    await deleteMoratoire(rowIndex);
    
    // Audit
    await logAudit({
      action: AUDIT_ACTIONS.DELETE,
      entity: 'moratoire',
      entityId: rowIndex,
      details: moratoire ? `Famille ${moratoire['ID FAMILLE']}` : 'Moratoire supprimé',
      ...auditInfo,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /moratoires:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
