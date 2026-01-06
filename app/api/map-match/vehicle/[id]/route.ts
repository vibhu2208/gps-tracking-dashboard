import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, COLLECTIONS } from '@/lib/mongodb';
import { 
  RawGPSPoint, 
  processAllPoints,
  MatchedGPSPoint 
} from '@/lib/map-matching';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/map-match/vehicle/:id
 * 
 * Map-match GPS points for a specific vehicle
 * 
 * Request body:
 * {
 *   points: RawGPSPoint[],
 *   date?: string (YYYY-MM-DD),
 *   saveToDb?: boolean
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: vehicleId } = await params;
    
    if (!MAPBOX_TOKEN) {
      return NextResponse.json(
        { error: 'Mapbox token not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { points, date, saveToDb = false } = body;

    if (!points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: 'Points array is required' },
        { status: 400 }
      );
    }

    // Filter points for this vehicle
    const vehiclePoints = points.filter((p: RawGPSPoint) => p.vehicle === vehicleId);
    
    if (vehiclePoints.length === 0) {
      return NextResponse.json(
        { error: `No points found for vehicle ${vehicleId}` },
        { status: 404 }
      );
    }

    // Process with map-matching
    const result = await processAllPoints(vehiclePoints, MAPBOX_TOKEN, {
      batchSize: 50,
      delayBetweenBatches: 100,
    });

    // Optionally save to MongoDB
    if (saveToDb) {
      try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTIONS.GPS_POINTS);
        
        // Prepare documents for insertion
        const documents = result.matchedPoints.map((point: MatchedGPSPoint) => ({
          vehicleId,
          date: point.timestamp.split(' ')[0],
          timestamp: new Date(point.timestamp.replace(' ', 'T') + 'Z'),
          raw_lat: point.raw_lat,
          raw_lng: point.raw_lng,
          matched_lat: point.matched_lat,
          matched_lng: point.matched_lng,
          confidence: point.confidence,
          matched: point.matched,
          phase: point.phase,
          location_name: point.location_name,
          ward: point.ward,
          createdAt: new Date(),
        }));

        // Upsert documents (update if exists, insert if not)
        const bulkOps = documents.map(doc => ({
          updateOne: {
            filter: { 
              vehicleId: doc.vehicleId, 
              timestamp: doc.timestamp 
            },
            update: { $set: doc },
            upsert: true,
          }
        }));

        if (bulkOps.length > 0) {
          await collection.bulkWrite(bulkOps);
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue - don't fail the request if DB save fails
      }
    }

    return NextResponse.json({
      success: true,
      vehicleId,
      data: {
        matchedPoints: result.matchedPoints,
        stats: {
          totalPoints: vehiclePoints.length,
          matchedPoints: result.matchedPoints.filter((p: MatchedGPSPoint) => p.matched).length,
          totalBatches: result.totalBatches,
          successfulBatches: result.successfulBatches,
          estimatedCost: result.estimatedCost,
        },
        warnings: result.warnings,
      }
    });

  } catch (error) {
    console.error('Map-match vehicle API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/map-match/vehicle/:id
 * 
 * Get map-matched points for a vehicle from database
 * 
 * Query params:
 * - date: YYYY-MM-DD (optional, returns all dates if not specified)
 * - showRaw: boolean (include raw coordinates, default true)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: vehicleId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const showRaw = searchParams.get('showRaw') !== 'false';

    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTIONS.GPS_POINTS);

    // Build query
    const query: Record<string, unknown> = { vehicleId };
    if (date) {
      query.date = date;
    }

    // Fetch points
    const points = await collection
      .find(query)
      .sort({ timestamp: 1 })
      .toArray();

    if (points.length === 0) {
      return NextResponse.json({
        success: true,
        vehicleId,
        data: {
          points: [],
          availableDates: [],
        }
      });
    }

    // Get available dates
    const availableDates = await collection.distinct('date', { vehicleId });

    // Format response
    const formattedPoints = points.map(p => ({
      timestamp: p.timestamp,
      lat: p.matched_lat,
      lng: p.matched_lng,
      ...(showRaw && { raw_lat: p.raw_lat, raw_lng: p.raw_lng }),
      confidence: p.confidence,
      matched: p.matched,
      phase: p.phase,
      location: p.location_name,
    }));

    return NextResponse.json({
      success: true,
      vehicleId,
      data: {
        points: formattedPoints,
        availableDates: availableDates.sort().reverse(),
        stats: {
          totalPoints: points.length,
          matchedPoints: points.filter(p => p.matched).length,
        }
      }
    });

  } catch (error) {
    console.error('Get vehicle points error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
