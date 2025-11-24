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
    
    // Vérifier si c'est un paiement famille ou individuel
    if (data.mode === 'famille' && Array.isArray(data.paiements)) {
      // Paiement par famille - créer plusieurs paiements
      const results = [];
      
      for (const paiement of data.paiements) {
        const result = await addPaiement(paiement);
        results.push(result);
        
        // Mettre à jour le solde de l'élève
        await updateEleveSolde(paiement.idEleve, paiement.montantPaye);
        
        // Audit
        await logAudit({
          action: AUDIT_ACTIONS.CREATE,
          entity: 'paiement',
          entityId: result.rowIndex,
          details: `Paiement famille: ${paiement.nomEleve} - ${paiement.montantPaye} FCFA`,
          ...auditInfo,
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        count: results.length,
        results 
      });
      
    } else {
      // Paiement individuel
      const result = await addPaiement(data);
      
      // Mettre à jour le solde de l'élève
      await updateEleveSolde(data.idEleve, data.montantPaye);
      
      // Audit
      await logAudit({
        action: AUDIT_ACTIONS.CREATE,
        entity: 'paiement',
        entityId: result.rowIndex,
        details: `${data.nomEleve} - ${data.montantPaye} FCFA`,
        ...auditInfo,
      });
      
      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error('POST /paiements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fonction helper pour mettre à jour le solde
async function updateEleveSolde(idEleve, montantPaye) {
  const eleves = await getEleves();
  const eleve = eleves.find(e => e.rowIndex === parseInt(idEleve));
  
  if (eleve) {
    const nouveauPaye = parseFloat(eleve.PAYÉ || 0) + parseFloat(montantPaye);
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
}

export async function DELETE(request) {
  const auditInfo = extractAuditInfo(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const rowIndex = parseInt(searchParams.get('rowIndex'));
    
    if (!rowIndex) {
      return NextResponse.json({ error: 'rowIndex requis' }, { status: 400 });
    }
    
    const paiements = await getPaiements();
    const paiement = paiements.find(p => p.rowIndex === rowIndex);
    
    await deletePaiement(rowIndex);
    
    // Audit
    await logAudit({
      action: AUDIT_ACTIONS.DELETE,
      entity: 'paiement',
      entityId: rowIndex,
      details: paiement ? `${paiement['NOM ÉLÈVE']} - ${paiement['MONTANT PAYÉ']} FCFA` : 'Paiement supprimé',
      ...auditInfo,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /paiements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
