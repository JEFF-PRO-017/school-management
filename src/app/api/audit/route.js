import { NextResponse } from 'next/server';
import { getAuditHistory } from '@/lib/audit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtres optionnels
    const filters = {
      entity: searchParams.get('entity'),
      deviceId: searchParams.get('deviceId'),
      action: searchParams.get('action'),
      fromDate: searchParams.get('fromDate'),
      toDate: searchParams.get('toDate'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 100,
    };
    
    // Supprimer les filtres null
    Object.keys(filters).forEach(key => {
      if (filters[key] === null) delete filters[key];
    });
    
    const audits = await getAuditHistory(filters);
    
    return NextResponse.json(audits);
  } catch (error) {
    console.error('GET /audit:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'audit' },
      { status: 500 }
    );
  }
}
