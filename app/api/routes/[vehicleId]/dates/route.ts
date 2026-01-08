import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    const db = await connectToDatabase();
    const routes = await db.collection('routes')
      .find({ vehicleId })
      .project({ date: 1, _id: 0 })
      .toArray();
    
    const dates = routes.map(r => r.date).sort().reverse();
    
    return NextResponse.json(dates);
  } catch (error) {
    console.error('Error fetching dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dates' },
      { status: 500 }
    );
  }
}

