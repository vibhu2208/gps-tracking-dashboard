import { NextRequest, NextResponse } from 'next/server';
import { 
  RawGPSPoint, 
  createBatches, 
  mapMatchBatch, 
  processAllPoints 
} from '@/lib/map-matching';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;

/**
 * POST /api/map-match
 * 
 * Accepts raw GPS points and returns map-matched coordinates
 * 
 * Request body:
 * {
 *   points: RawGPSPoint[],
 *   options?: {
 *     batchSize?: number,
 *     skipIdle?: boolean
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    if (!MAPBOX_TOKEN) {
      return NextResponse.json(
        { error: 'Mapbox token not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { points, options = {} } = body;

    if (!points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: 'Points array is required' },
        { status: 400 }
      );
    }

    // Validate points structure
    for (const point of points) {
      if (!point.latitude || !point.longitude || !point.timestamp) {
        return NextResponse.json(
          { error: 'Each point must have latitude, longitude, and timestamp' },
          { status: 400 }
        );
      }
    }

    const result = await processAllPoints(points as RawGPSPoint[], MAPBOX_TOKEN, {
      batchSize: options.batchSize || 50,
      delayBetweenBatches: 100,
    });

    return NextResponse.json({
      success: true,
      data: {
        matchedPoints: result.matchedPoints,
        stats: {
          totalPoints: points.length,
          matchedPoints: result.matchedPoints.filter(p => p.matched).length,
          totalBatches: result.totalBatches,
          successfulBatches: result.successfulBatches,
          estimatedCost: result.estimatedCost,
        },
        warnings: result.warnings,
      }
    });

  } catch (error) {
    console.error('Map-match API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/map-match
 * 
 * Returns API info and status
 */
export async function GET() {
  return NextResponse.json({
    service: 'Map-Matching API',
    version: '1.0.0',
    status: MAPBOX_TOKEN ? 'ready' : 'not_configured',
    endpoints: {
      'POST /api/map-match': {
        description: 'Map-match GPS points to road network',
        body: {
          points: 'Array of GPS points with timestamp, latitude, longitude, vehicle, phase, etc.',
          options: {
            batchSize: 'Number of points per batch (default: 50, max: 100)',
          }
        }
      }
    },
    limits: {
      maxBatchSize: 100,
      rateLimit: '300 requests/minute',
    }
  });
}
