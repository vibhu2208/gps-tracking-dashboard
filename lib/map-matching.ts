/**
 * Mapbox Map-Matching Service
 * 
 * Snaps GPS coordinates to real road network using Mapbox Map-Matching API.
 * Designed to be modular - can be replaced with OSRM later.
 */

export interface RawGPSPoint {
  timestamp: string;
  vehicle: string;
  ward: string;
  phase: 'TRAVEL' | 'WORKING' | 'BREAK';
  location_name: string;
  latitude: number;
  longitude: number;
}

export interface MatchedGPSPoint extends RawGPSPoint {
  raw_lat: number;
  raw_lng: number;
  matched_lat: number;
  matched_lng: number;
  confidence: number;
  matched: boolean;
}

export interface MapMatchBatch {
  vehicleId: string;
  date: string;
  startIndex: number;
  endIndex: number;
  points: RawGPSPoint[];
}

export interface MapMatchResult {
  matchedPoints: MatchedGPSPoint[];
  confidence: number;
  matchedGeometry: GeoJSON.LineString | null;
  warnings: string[];
}

const MAPBOX_API_URL = 'https://api.mapbox.com/matching/v5/mapbox/driving';
const MAX_BATCH_SIZE = 100; // Mapbox limit is 100 coordinates
const MIN_MOVEMENT_THRESHOLD = 0.00001; // ~1 meter - skip matching if no movement

/**
 * Calculate distance between two GPS points (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if points have significant movement (to skip idle periods)
 */
function hasSignificantMovement(points: RawGPSPoint[]): boolean {
  if (points.length < 2) return false;
  
  const first = points[0];
  const last = points[points.length - 1];
  const distance = calculateDistance(first.latitude, first.longitude, last.latitude, last.longitude);
  
  return distance > 5; // More than 5 meters movement
}

/**
 * Create batches of GPS points for map-matching
 * Groups by vehicle, date, and continuous timestamps
 */
export function createBatches(points: RawGPSPoint[], batchSize: number = 50): MapMatchBatch[] {
  const batches: MapMatchBatch[] = [];
  
  // Group by vehicle first
  const byVehicle = new Map<string, RawGPSPoint[]>();
  for (const point of points) {
    const existing = byVehicle.get(point.vehicle) || [];
    existing.push(point);
    byVehicle.set(point.vehicle, existing);
  }
  
  // For each vehicle, group by date and create batches
  for (const [vehicleId, vehiclePoints] of byVehicle) {
    // Sort by timestamp
    vehiclePoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Group by date
    const byDate = new Map<string, RawGPSPoint[]>();
    for (const point of vehiclePoints) {
      const date = point.timestamp.split(' ')[0];
      const existing = byDate.get(date) || [];
      existing.push(point);
      byDate.set(date, existing);
    }
    
    // Create batches for each date
    for (const [date, datePoints] of byDate) {
      for (let i = 0; i < datePoints.length; i += batchSize) {
        const batchPoints = datePoints.slice(i, Math.min(i + batchSize, datePoints.length));
        batches.push({
          vehicleId,
          date,
          startIndex: i,
          endIndex: Math.min(i + batchSize, datePoints.length) - 1,
          points: batchPoints,
        });
      }
    }
  }
  
  return batches;
}

/**
 * Call Mapbox Map-Matching API for a batch of points
 */
export async function mapMatchBatch(
  batch: MapMatchBatch,
  mapboxToken: string
): Promise<MapMatchResult> {
  const warnings: string[] = [];
  const points = batch.points;
  
  // If no significant movement, skip API call and return raw coordinates
  if (!hasSignificantMovement(points)) {
    warnings.push(`Batch ${batch.startIndex}-${batch.endIndex}: No significant movement, using raw coordinates`);
    return {
      matchedPoints: points.map(p => ({
        ...p,
        raw_lat: p.latitude,
        raw_lng: p.longitude,
        matched_lat: p.latitude,
        matched_lng: p.longitude,
        confidence: 1.0,
        matched: false,
      })),
      confidence: 1.0,
      matchedGeometry: null,
      warnings,
    };
  }
  
  // Build coordinates string for API (lng,lat format)
  const coordinates = points.map(p => `${p.longitude},${p.latitude}`).join(';');
  
  // Build timestamps for better matching
  const timestamps = points.map(p => {
    const date = new Date(p.timestamp.replace(' ', 'T') + 'Z');
    return Math.floor(date.getTime() / 1000);
  }).join(';');
  
  const url = `${MAPBOX_API_URL}/${coordinates}?` + new URLSearchParams({
    access_token: mapboxToken,
    geometries: 'geojson',
    tidy: 'true',
    timestamps: timestamps,
    radiuses: points.map(() => '25').join(';'), // 25m search radius
  });
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      warnings.push(`Mapbox API error: ${response.status} - ${errorText}`);
      // Fall back to raw coordinates
      return {
        matchedPoints: points.map(p => ({
          ...p,
          raw_lat: p.latitude,
          raw_lng: p.longitude,
          matched_lat: p.latitude,
          matched_lng: p.longitude,
          confidence: 0,
          matched: false,
        })),
        confidence: 0,
        matchedGeometry: null,
        warnings,
      };
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.matchings || data.matchings.length === 0) {
      warnings.push(`No match found for batch ${batch.startIndex}-${batch.endIndex}: ${data.code}`);
      return {
        matchedPoints: points.map(p => ({
          ...p,
          raw_lat: p.latitude,
          raw_lng: p.longitude,
          matched_lat: p.latitude,
          matched_lng: p.longitude,
          confidence: 0,
          matched: false,
        })),
        confidence: 0,
        matchedGeometry: null,
        warnings,
      };
    }
    
    const matching = data.matchings[0];
    const tracepoints = data.tracepoints;
    const overallConfidence = matching.confidence || 0;
    
    // Map matched coordinates back to original points
    const matchedPoints: MatchedGPSPoint[] = points.map((point, index) => {
      const tracepoint = tracepoints[index];
      
      if (tracepoint && tracepoint.location) {
        return {
          ...point,
          raw_lat: point.latitude,
          raw_lng: point.longitude,
          matched_lat: tracepoint.location[1], // GeoJSON is [lng, lat]
          matched_lng: tracepoint.location[0],
          confidence: overallConfidence,
          matched: true,
        };
      } else {
        // No match for this point, use raw coordinates
        warnings.push(`Point ${index} in batch could not be matched`);
        return {
          ...point,
          raw_lat: point.latitude,
          raw_lng: point.longitude,
          matched_lat: point.latitude,
          matched_lng: point.longitude,
          confidence: 0,
          matched: false,
        };
      }
    });
    
    return {
      matchedPoints,
      confidence: overallConfidence,
      matchedGeometry: matching.geometry || null,
      warnings,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    warnings.push(`Map-matching failed: ${errorMessage}`);
    
    return {
      matchedPoints: points.map(p => ({
        ...p,
        raw_lat: p.latitude,
        raw_lng: p.longitude,
        matched_lat: p.latitude,
        matched_lng: p.longitude,
        confidence: 0,
        matched: false,
      })),
      confidence: 0,
      matchedGeometry: null,
      warnings,
    };
  }
}

/**
 * Process all GPS points with map-matching
 * Includes rate limiting and progress callback
 */
export async function processAllPoints(
  points: RawGPSPoint[],
  mapboxToken: string,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    onProgress?: (processed: number, total: number, currentBatch: MapMatchBatch) => void;
  } = {}
): Promise<{
  matchedPoints: MatchedGPSPoint[];
  totalBatches: number;
  successfulBatches: number;
  warnings: string[];
  estimatedCost: number;
}> {
  const { batchSize = 50, delayBetweenBatches = 100, onProgress } = options;
  
  const batches = createBatches(points, batchSize);
  const allMatchedPoints: MatchedGPSPoint[] = [];
  const allWarnings: string[] = [];
  let successfulBatches = 0;
  let apiCallsMade = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    if (onProgress) {
      onProgress(i, batches.length, batch);
    }
    
    const result = await mapMatchBatch(batch, mapboxToken);
    allMatchedPoints.push(...result.matchedPoints);
    allWarnings.push(...result.warnings);
    
    if (result.confidence > 0) {
      successfulBatches++;
      apiCallsMade++;
    }
    
    // Rate limiting delay
    if (i < batches.length - 1 && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  // Sort by timestamp
  allMatchedPoints.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Estimate cost: Mapbox charges per request, not per coordinate
  // Free tier: 100,000 requests/month
  // After that: $0.50 per 1000 requests
  const estimatedCost = apiCallsMade > 100000 ? (apiCallsMade - 100000) * 0.0005 : 0;
  
  return {
    matchedPoints: allMatchedPoints,
    totalBatches: batches.length,
    successfulBatches,
    warnings: allWarnings,
    estimatedCost,
  };
}
