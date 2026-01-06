/**
 * Generate Realistic Travel Routes
 * 
 * Replaces straight-line TRAVEL_OUT and TRAVEL_BACK coordinates with
 * actual driving routes using Mapbox Directions API.
 * 
 * Usage:
 *   node scripts/generate-realistic-travel-routes.js
 *   node scripts/generate-realistic-travel-routes.js --dry-run
 *   node scripts/generate-realistic-travel-routes.js --limit=10
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const CONFIG = {
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN,
  INPUT_CSV: path.join(__dirname, '../data/fleetzi_jcb_roundtrip_realistic_roads_aug25_to_dec24_2025.csv'),
  OUTPUT_CSV: path.join(__dirname, '../data/fleetzi_jcb_directions_fixed_aug25_to_dec24_2025.csv'),
  OUTPUT_JSON: path.join(__dirname, '../data/routes_directions.json'),
  PUBLIC_JSON: path.join(__dirname, '../public/data/routes.json'),
  COMMUNITY_CENTER: { lat: 28.4508, lng: 77.0656 },
  DELAY_BETWEEN_REQUESTS: 200, // ms
  MAX_RETRIES: 3,
};

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT_ARG = args.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;

// Route cache to avoid duplicate API calls
const routeCache = new Map();

/**
 * Get driving directions from Mapbox API
 */
async function getDirections(start, end, retries = CONFIG.MAX_RETRIES) {
  const cacheKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}-${end.lat.toFixed(4)},${end.lng.toFixed(4)}`;
  
  if (routeCache.has(cacheKey)) {
    return { success: true, route: routeCache.get(cacheKey), cached: true };
  }

  if (DRY_RUN) {
    return { success: false, route: null, error: 'Dry run - skipping API call' };
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?` +
    `access_token=${CONFIG.MAPBOX_TOKEN}&` +
    `geometries=geojson&` +
    `overview=full&` +
    `steps=false`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (attempt === retries) {
          return { success: false, route: null, error: `API error: ${response.status}` };
        }
        await delay(1000 * attempt);
        continue;
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
          coordinates: data.routes[0].geometry.coordinates,
        };
        routeCache.set(cacheKey, route);
        return { success: true, route, cached: false };
      }

      return { success: false, route: null, error: 'No route found' };
    } catch (error) {
      if (attempt === retries) {
        return { success: false, route: null, error: `Fetch error: ${error.message}` };
      }
      await delay(1000 * attempt);
    }
  }

  return { success: false, route: null, error: 'Max retries exceeded' };
}

/**
 * Calculate Haversine distance between two points
 */
function haversineDistance(coord1, coord2) {
  const R = 6371000;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Generate GPS points along a route at 1-minute intervals
 */
function generatePointsAlongRoute(route, startTime, durationMinutes) {
  const coordinates = route.coordinates;
  if (!coordinates || coordinates.length < 2) {
    return [];
  }

  // Calculate cumulative distances
  const cumulativeDistances = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const prev = { lat: coordinates[i - 1][1], lng: coordinates[i - 1][0] };
    const curr = { lat: coordinates[i][1], lng: coordinates[i][0] };
    const dist = haversineDistance(prev, curr);
    cumulativeDistances.push(cumulativeDistances[i - 1] + dist);
  }

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
  const totalPoints = durationMinutes;
  const points = [];

  for (let i = 0; i < totalPoints; i++) {
    const progress = i / (totalPoints - 1 || 1);
    const targetDistance = progress * totalDistance;

    // Find segment containing this distance
    let segmentIndex = 0;
    for (let j = 1; j < cumulativeDistances.length; j++) {
      if (cumulativeDistances[j] >= targetDistance) {
        segmentIndex = j - 1;
        break;
      }
      segmentIndex = j - 1;
    }

    // Interpolate within segment
    const segmentStart = cumulativeDistances[segmentIndex];
    const segmentEnd = cumulativeDistances[segmentIndex + 1] || segmentStart;
    const segmentLength = segmentEnd - segmentStart;

    let lat, lng;
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
    });
  }

  return points;
}

/**
 * Format timestamp as "YYYY-MM-DD HH:MM:SS"
 */
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse timestamp string to Date
 */
function parseTimestamp(str) {
  // "2025-08-25 09:00:00" -> Date
  const [datePart, timePart] = str.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse CSV file
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= headers.length) {
      rows.push({
        timestamp: values[0],
        vehicle: values[1],
        ward: values[2],
        phase: values[3],
        location_name: values[4],
        latitude: parseFloat(values[5]),
        longitude: parseFloat(values[6]),
      });
    }
  }

  return rows;
}

/**
 * Group rows into travel segments
 */
function groupTravelSegments(rows) {
  const segments = [];
  let currentSegment = null;

  for (const row of rows) {
    if (row.phase === 'TRAVEL_OUT' || row.phase === 'TRAVEL_BACK') {
      if (!currentSegment || currentSegment.phase !== row.phase) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          phase: row.phase,
          vehicle: row.vehicle,
          ward: row.ward,
          location_name: row.location_name,
          points: [],
        };
      }
      currentSegment.points.push(row);
    } else {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = null;
      }
      // Non-travel rows are kept as-is
      segments.push({ phase: row.phase, points: [row], isNonTravel: true });
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Main processing function
 */
async function processCSV() {
  console.log('============================================================');
  console.log('Generate Realistic Travel Routes with Mapbox Directions API');
  console.log('============================================================');
  console.log(`Input CSV: ${CONFIG.INPUT_CSV}`);
  console.log(`Output CSV: ${CONFIG.OUTPUT_CSV}`);
  console.log(`Dry Run: ${DRY_RUN}`);
  console.log(`Limit: ${LIMIT || 'None'}`);
  console.log(`Mapbox Token: ${CONFIG.MAPBOX_TOKEN ? 'Set' : 'NOT SET'}`);
  console.log('============================================================\n');

  if (!CONFIG.MAPBOX_TOKEN && !DRY_RUN) {
    console.error('ERROR: Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN in .env');
    process.exit(1);
  }

  // Read CSV
  console.log('[1/5] Reading CSV file...');
  const content = fs.readFileSync(CONFIG.INPUT_CSV, 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Loaded ${rows.length} GPS points\n`);

  // Group into segments
  console.log('[2/5] Grouping travel segments...');
  const segments = groupTravelSegments(rows);
  const travelSegments = segments.filter(s => !s.isNonTravel);
  console.log(`  Found ${travelSegments.length} travel segments (TRAVEL_OUT + TRAVEL_BACK)\n`);

  // Process travel segments
  console.log('[3/5] Processing travel segments with Directions API...');
  const outputRows = [];
  let apiCalls = 0;
  let cachedRoutes = 0;
  let failedRoutes = 0;
  let processedSegments = 0;
  const segmentLimit = LIMIT || travelSegments.length;

  for (const segment of segments) {
    if (segment.isNonTravel) {
      // Keep non-travel rows as-is
      for (const point of segment.points) {
        outputRows.push({
          ...point,
          route_source: 'original',
        });
      }
      continue;
    }

    processedSegments++;
    if (processedSegments > segmentLimit) {
      // Keep remaining travel segments as-is
      for (const point of segment.points) {
        outputRows.push({
          ...point,
          route_source: 'original',
        });
      }
      continue;
    }

    const firstPoint = segment.points[0];
    const lastPoint = segment.points[segment.points.length - 1];
    const startTime = parseTimestamp(firstPoint.timestamp);
    const durationMinutes = segment.points.length;

    // Determine start and end coordinates
    let start, end;
    if (segment.phase === 'TRAVEL_OUT') {
      start = CONFIG.COMMUNITY_CENTER;
      end = { lat: lastPoint.latitude, lng: lastPoint.longitude };
    } else {
      // TRAVEL_BACK
      start = { lat: firstPoint.latitude, lng: firstPoint.longitude };
      end = CONFIG.COMMUNITY_CENTER;
    }

    // Get directions
    const result = await getDirections(start, end);

    if (result.success && result.route) {
      if (result.cached) {
        cachedRoutes++;
      } else {
        apiCalls++;
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      // Generate points along the route
      const routePoints = generatePointsAlongRoute(result.route, startTime, durationMinutes);

      for (const point of routePoints) {
        outputRows.push({
          timestamp: point.timestamp,
          vehicle: segment.vehicle,
          ward: segment.ward,
          phase: segment.phase,
          location_name: segment.location_name,
          latitude: point.lat,
          longitude: point.lng,
          route_source: 'mapbox_directions',
        });
      }

      const distanceKm = (result.route.distance / 1000).toFixed(2);
      const durationMin = Math.round(result.route.duration / 60);
      process.stdout.write(`\r  Progress: ${processedSegments}/${segmentLimit} segments, ${apiCalls} API calls, ${cachedRoutes} cached`);
    } else {
      failedRoutes++;
      console.log(`\n  WARNING: Failed to get route for ${segment.phase} on ${firstPoint.timestamp}: ${result.error}`);
      
      // Fallback: keep original points
      for (const point of segment.points) {
        outputRows.push({
          ...point,
          route_source: 'fallback_original',
        });
      }
    }
  }

  console.log(`\n  Completed! API calls: ${apiCalls}, Cached: ${cachedRoutes}, Failed: ${failedRoutes}\n`);

  // Sort by timestamp
  outputRows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Write output CSV
  console.log('[4/5] Writing output files...');
  const csvHeaders = 'timestamp,vehicle,ward,phase,location_name,latitude,longitude,route_source';
  const csvLines = [csvHeaders];
  for (const row of outputRows) {
    csvLines.push([
      row.timestamp,
      row.vehicle,
      row.ward,
      row.phase,
      row.location_name,
      row.latitude,
      row.longitude,
      row.route_source,
    ].join(','));
  }
  fs.writeFileSync(CONFIG.OUTPUT_CSV, csvLines.join('\n'));
  console.log(`  Written ${outputRows.length} rows to ${CONFIG.OUTPUT_CSV}`);

  // Generate routes.json for frontend
  const routesJson = generateRoutesJson(outputRows);
  fs.writeFileSync(CONFIG.OUTPUT_JSON, JSON.stringify(routesJson, null, 2));
  console.log(`  Written routes to ${CONFIG.OUTPUT_JSON}`);

  // Copy to public folder
  fs.mkdirSync(path.dirname(CONFIG.PUBLIC_JSON), { recursive: true });
  fs.writeFileSync(CONFIG.PUBLIC_JSON, JSON.stringify(routesJson, null, 2));
  console.log(`  Written routes to ${CONFIG.PUBLIC_JSON}\n`);

  // Summary
  console.log('[5/5] Summary');
  console.log('============================================================');
  console.log(`Total points processed: ${outputRows.length}`);
  console.log(`Travel segments processed: ${Math.min(processedSegments, segmentLimit)}`);
  console.log(`Directions API calls: ${apiCalls}`);
  console.log(`Cached routes used: ${cachedRoutes}`);
  console.log(`Failed routes (fallback): ${failedRoutes}`);
  console.log(`Route cache size: ${routeCache.size}`);
  console.log(`\nEstimated Mapbox cost: $${(apiCalls * 0.0005).toFixed(4)}`);
  console.log('(Free tier: 100,000 requests/month)\n');
  console.log('✅ Processing complete!\n');
  console.log('Output files:');
  console.log(`  - CSV: ${CONFIG.OUTPUT_CSV}`);
  console.log(`  - JSON: ${CONFIG.OUTPUT_JSON}`);
  console.log(`  - Public: ${CONFIG.PUBLIC_JSON}`);
}

/**
 * Generate routes.json structure for frontend
 */
function generateRoutesJson(rows) {
  const routes = {};

  for (const row of rows) {
    const vehicleId = row.vehicle;
    const date = row.timestamp.split(' ')[0];

    if (!routes[vehicleId]) {
      routes[vehicleId] = {};
    }
    if (!routes[vehicleId][date]) {
      routes[vehicleId][date] = {
        points: [],
        summary: {
          totalDistance: 0,
          drivingDuration: 0,
          workingDuration: 0,
          idleDuration: 0,
          maxSpeed: 0,
          avgSpeed: 0,
        },
      };
    }

    routes[vehicleId][date].points.push({
      lat: row.latitude,
      lng: row.longitude,
      timestamp: row.timestamp.replace(' ', 'T') + 'Z',
      speed: 0,
      phase: row.phase,
      location_name: row.location_name,
      route_source: row.route_source,
    });
  }

  // Calculate summaries
  for (const vehicleId in routes) {
    for (const date in routes[vehicleId]) {
      const dayData = routes[vehicleId][date];
      const points = dayData.points;

      let totalDistance = 0;
      let travelPoints = 0;
      let workingPoints = 0;

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const dist = haversineDistance(
          { lat: prev.lat, lng: prev.lng },
          { lat: curr.lat, lng: curr.lng }
        );
        totalDistance += dist;

        // Calculate speed (m/min -> km/h)
        const speedKmh = (dist / 1000) * 60;
        curr.speed = Math.round(speedKmh);

        if (curr.phase === 'TRAVEL_OUT' || curr.phase === 'TRAVEL_BACK') {
          travelPoints++;
        } else if (curr.phase === 'WORKING') {
          workingPoints++;
        }
      }

      dayData.summary.totalDistance = Math.round(totalDistance / 1000 * 10) / 10;
      dayData.summary.drivingDuration = travelPoints;
      dayData.summary.workingDuration = workingPoints;
      dayData.summary.maxSpeed = Math.max(...points.map(p => p.speed || 0));
      dayData.summary.avgSpeed = Math.round(
        points.reduce((sum, p) => sum + (p.speed || 0), 0) / points.length
      );
    }
  }

  return routes;
}

// Run
processCSV().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
