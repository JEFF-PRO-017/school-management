import { NextResponse } from 'next/server';
import { getPaiements, addPaiement, deletePaiement } from '@/lib/google-sheets';
import { getEleves, updateEleve } from '@/lib/google-sheets';
import { logAudit, extractAuditInfo, AUDIT_ACTIONS } from '@/lib/audit';

export async function GET() {
  try {
    const paiements = await getPaiements();
    return NextResponse.json(paiements);
  } catch (error) {
    console.error('GET /paiements:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}

export async function POST(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const data = await request.json();
    const result = await addPaiement(data);
    
    // Mettre à jour le solde de l'élève
    const eleves = await getEleves();
    const eleve = eleves.find(e => e.rowIndex === parseInt(data.idEleve));
    
    if (eleve) {
      const nouveauPaye = parseFloat(eleve.PAYÉ || 0) + parseFloat(data.montantPaye);
      const totalDu = parseFloat(eleve['TOTAL DÛ'] || 0);
      const nouveauReste = Math.max(0, totalDu - nouveauPaye);
      
      let nouveauStatut = 'EN ATTENTE';
      if (nouveauPaye >= totalDu) nouveauStatut = 'SOLDÉ';
      else if (nouveauPaye > 0) nouveauStatut = 'PARTIEL';
      
      await updateEleve(eleve.rowIndex, {
        nom: eleve.NOM,
        prenom: eleve.PRÉNOM,
        dateNaissance: eleve['DATE NAISS.'],
        classe: eleve.CLASSE,
        idFamille: eleve['ID FAMILLE'],
        inscription: eleve.INSCRIPTION,
        scolarite: eleve.SCOLARITÉ,
        dossier: eleve.DOSSIER,
        autres: eleve.AUTRES,
        totalDu: eleve['TOTAL DÛ'],
        paye: nouveauPaye.toString(),
        reste: nouveauReste.toString(),
        statut: nouveauStatut,
      });
    }
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'paiements',
      entityId: `${data.nomEleve} - ${data.montantPaye}`,
      details: data,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /paiements:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.CREATE, entity: 'paiements', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
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
    
    const result = await deletePaiement(parseInt(rowIndex));
    
    await logAudit({
      ...auditInfo,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'paiements',
      entityId: `Row ${rowIndex}`,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /paiements:', error);
    await logAudit({ ...auditInfo, action: AUDIT_ACTIONS.DELETE, entity: 'paiements', status: 'ERROR', details: error.message });
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
