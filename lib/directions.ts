/**
 * Mapbox Directions API Service
 * 
 * Provides driving routes between two points following real road networks.
 * Used to generate realistic TRAVEL_OUT and TRAVEL_BACK GPS coordinates.
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface DirectionsRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    type: string;
    coordinates: [number, number][]; // [lng, lat] pairs
  };
}

export interface DirectionsResponse {
  success: boolean;
  route: DirectionsRoute | null;
  error?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  distanceFromStart: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;

/**
 * Get driving directions between two points using Mapbox Directions API
 */
export async function getDirections(
  start: Coordinate,
  end: Coordinate,
  retries: number = 3
): Promise<DirectionsResponse> {
  if (!MAPBOX_TOKEN) {
    return { success: false, route: null, error: 'Mapbox token not configured' };
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?` +
    `access_token=${MAPBOX_TOKEN}&` +
    `geometries=geojson&` +
    `overview=full&` +
    `steps=false`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (attempt === retries) {
          return { 
            success: false, 
            route: null, 
            error: `Directions API error: ${response.status}` 
          };
        }
        await delay(1000 * attempt); // Exponential backoff
        continue;
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          success: true,
          route: {
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry,
          },
        };
      }

      return { success: false, route: null, error: 'No route found' };
    } catch (error: any) {
      if (attempt === retries) {
        return { 
          success: false, 
          route: null, 
          error: `Fetch error: ${error.message}` 
        };
      }
      await delay(1000 * attempt);
    }
  }

  return { success: false, route: null, error: 'Max retries exceeded' };
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Generate GPS points along a route at 1-minute intervals
 */
export function generatePointsAlongRoute(
  route: DirectionsRoute,
  startTime: Date,
  targetDurationMinutes?: number
): RoutePoint[] {
  const coordinates = route.geometry.coordinates;
  if (!coordinates || coordinates.length < 2) {
    return [];
  }

  // Calculate cumulative distances along the route
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const prev = { lat: coordinates[i - 1][1], lng: coordinates[i - 1][0] };
    const curr = { lat: coordinates[i][1], lng: coordinates[i][0] };
    const dist = haversineDistance(prev, curr);
    cumulativeDistances.push(cumulativeDistances[i - 1] + dist);
  }

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
  
  // Use target duration or API duration, minimum 1 minute
  const durationMinutes = targetDurationMinutes || Math.max(1, Math.ceil(route.duration / 60));
  const totalPoints = durationMinutes + 1; // Include start and end points
  
  const points: RoutePoint[] = [];
  
  for (let i = 0; i < totalPoints; i++) {
    const progress = i / (totalPoints - 1); // 0 to 1
    const targetDistance = progress * totalDistance;
    
    // Find the segment containing this distance
    let segmentIndex = 0;
    for (let j = 1; j < cumulativeDistances.length; j++) {
      if (cumulativeDistances[j] >= targetDistance) {
        segmentIndex = j - 1;
        break;
      }
      segmentIndex = j - 1;
    }
    
    // Interpolate within the segment
    const segmentStart = cumulativeDistances[segmentIndex];
    const segmentEnd = cumulativeDistances[segmentIndex + 1] || segmentStart;
    const segmentLength = segmentEnd - segmentStart;
    
    let lat: number, lng: number;
    
    if (segmentLength > 0) {
      const segmentProgress = (targetDistance - segmentStart) / segmentLength;
      const startCoord = coordinates[segmentIndex];
      const endCoord = coordinates[segmentIndex + 1] || startCoord;
      
      lng = startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress;
      lat = startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress;
    } else {
      lng = coordinates[segmentIndex][0];
      lat = coordinates[segmentIndex][1];
    }
    
    const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
    
    points.push({
      lat,
      lng,
      timestamp: formatTimestamp(timestamp),
      distanceFromStart: targetDistance,
    });
  }
  
  return points;
}

/**
 * Format timestamp as "YYYY-MM-DD HH:MM:SS"
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cache for routes to reduce API calls
 */
const routeCache = new Map<string, DirectionsRoute>();

function getCacheKey(start: Coordinate, end: Coordinate): string {
  return `${start.lat.toFixed(4)},${start.lng.toFixed(4)}-${end.lat.toFixed(4)},${end.lng.toFixed(4)}`;
}

/**
 * Get directions with caching
 */
export async function getDirectionsCached(
  start: Coordinate,
  end: Coordinate
): Promise<DirectionsResponse> {
  const cacheKey = getCacheKey(start, end);
  
  if (routeCache.has(cacheKey)) {
    return { success: true, route: routeCache.get(cacheKey)! };
  }
  
  const result = await getDirections(start, end);
  
  if (result.success && result.route) {
    routeCache.set(cacheKey, result.route);
  }
  
  return result;
}

/**
 * Clear route cache
 */
export function clearRouteCache(): void {
  routeCache.clear();
}

/**
 * Get cache size
 */
export function getRouteCacheSize(): number {
  return routeCache.size;
}
