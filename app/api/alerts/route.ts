import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const db = await connectToDatabase();
    let query = {};
    
    if (vehicleId) {
      query = { vehicleId };
    }
    
    const alerts = await db.collection('alerts')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

