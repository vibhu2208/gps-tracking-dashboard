import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string; date: string }> }
) {
  try {
    const { vehicleId, date } = await params;
    const db = await connectToDatabase();
    const route = await db.collection('routes').findOne({
      vehicleId,
      date
    });
    
    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }
    
    // Remove MongoDB _id field
    const { _id, ...routeData } = route;
    
    return NextResponse.json(routeData);
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 }
    );
  }
}

