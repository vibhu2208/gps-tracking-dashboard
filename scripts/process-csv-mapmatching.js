/**
 * CSV Processing Script with Mapbox Map-Matching
 * 
 * Reads GPS data from CSV, applies map-matching, and outputs processed CSV + updates MongoDB.
 * 
 * Usage:
 *   node scripts/process-csv-mapmatching.js [--dry-run] [--limit=N]
 * 
 * Options:
 *   --dry-run    Process without saving to database or calling API
 *   --limit=N    Process only first N rows (for testing)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const CONFIG = {
  INPUT_CSV: path.join(__dirname, '../data/fleetzi_jcb_directions_fixed_aug25_to_dec24_2025.csv'),
  OUTPUT_CSV: path.join(__dirname, '../data/gps_matched_output.csv'),
  OUTPUT_JSON: path.join(__dirname, '../data/routes_matched.json'),
  PUBLIC_JSON: path.join(__dirname, '../public/data/routes.json'),
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  MONGODB_DB: process.env.MONGODB_DB || 'gps_tracking',
  BATCH_SIZE: 50,
  DELAY_BETWEEN_BATCHES: 150, // ms - to avoid rate limiting
  MIN_MOVEMENT_METERS: 5,
};

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT_ARG = args.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;

console.log('='.repeat(60));
console.log('GPS Map-Matching Processor');
console.log('='.repeat(60));
console.log(`Input CSV: ${CONFIG.INPUT_CSV}`);
console.log(`Output CSV: ${CONFIG.OUTPUT_CSV}`);
console.log(`Dry Run: ${DRY_RUN}`);
console.log(`Limit: ${LIMIT || 'None'}`);
console.log(`Mapbox Token: ${CONFIG.MAPBOX_TOKEN ? 'Set (' + CONFIG.MAPBOX_TOKEN.substring(0, 10) + '...)' : 'NOT SET!'}`);
console.log('='.repeat(60));

if (!CONFIG.MAPBOX_TOKEN && !DRY_RUN) {
  console.error('\nERROR: MAPBOX_ACCESS_TOKEN or NEXT_PUBLIC_MAPBOX_TOKEN not set in .env');
  console.error('Please add your Mapbox token to the .env file');
  process.exit(1);
}

/**
 * Parse CSV file
 */
function parseCSV(filePath, limit = null) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  const rows = [];
  const maxLines = limit ? Math.min(limit + 1, lines.length) : lines.length;
  
  for (let i = 1; i < maxLines; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;
    
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
  
  return rows;
}

/**
 * Calculate distance between two GPS points (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
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
 * Check if batch has significant movement
 */
function hasSignificantMovement(points) {
  if (points.length < 2) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return calculateDistance(first.latitude, first.longitude, last.latitude, last.longitude) > CONFIG.MIN_MOVEMENT_METERS;
}

/**
 * Create batches grouped by vehicle and date
 */
function createBatches(points) {
  const batches = [];
  
  // Group by vehicle
  const byVehicle = new Map();
  for (const point of points) {
    const existing = byVehicle.get(point.vehicle) || [];
    existing.push(point);
    byVehicle.set(point.vehicle, existing);
  }
  
  // For each vehicle, group by date
  for (const [vehicleId, vehiclePoints] of byVehicle) {
    vehiclePoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const byDate = new Map();
    for (const point of vehiclePoints) {
      const date = point.timestamp.split(' ')[0];
      const existing = byDate.get(date) || [];
      existing.push(point);
      byDate.set(date, existing);
    }
    
    for (const [date, datePoints] of byDate) {
      for (let i = 0; i < datePoints.length; i += CONFIG.BATCH_SIZE) {
        const batchPoints = datePoints.slice(i, Math.min(i + CONFIG.BATCH_SIZE, datePoints.length));
        batches.push({
          vehicleId,
          date,
          startIndex: i,
          endIndex: Math.min(i + CONFIG.BATCH_SIZE, datePoints.length) - 1,
          points: batchPoints,
        });
      }
    }
  }
  
  return batches;
}

/**
 * Call Mapbox Map-Matching API
 */
async function mapMatchBatch(batch) {
  const points = batch.points;
  
  // Skip if no significant movement
  if (!hasSignificantMovement(points)) {
    return {
      matchedPoints: points.map(p => ({
        ...p,
        raw_lat: p.latitude,
        raw_lng: p.longitude,
        matched_lat: p.latitude,
        matched_lng: p.longitude,
        confidence: 1.0,
        matched: false,
        skipped_reason: 'no_movement',
      })),
      confidence: 1.0,
      apiCalled: false,
    };
  }
  
  // Build coordinates string (lng,lat format for Mapbox)
  const coordinates = points.map(p => `${p.longitude},${p.latitude}`).join(';');
  
  // Build timestamps
  const timestamps = points.map(p => {
    const date = new Date(p.timestamp.replace(' ', 'T') + 'Z');
    return Math.floor(date.getTime() / 1000);
  }).join(';');
  
  const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}?` + 
    `access_token=${CONFIG.MAPBOX_TOKEN}&` +
    `geometries=geojson&` +
    `tidy=true&` +
    `timestamps=${timestamps}&` +
    `radiuses=${points.map(() => '25').join(';')}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`  API Error ${response.status} for batch ${batch.date} ${batch.startIndex}-${batch.endIndex}`);
      return {
        matchedPoints: points.map(p => ({
          ...p,
          raw_lat: p.latitude,
          raw_lng: p.longitude,
          matched_lat: p.latitude,
          matched_lng: p.longitude,
          confidence: 0,
          matched: false,
          skipped_reason: 'api_error',
        })),
        confidence: 0,
        apiCalled: true,
      };
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.matchings || data.matchings.length === 0) {
      return {
        matchedPoints: points.map(p => ({
          ...p,
          raw_lat: p.latitude,
          raw_lng: p.longitude,
          matched_lat: p.latitude,
          matched_lng: p.longitude,
          confidence: 0,
          matched: false,
          skipped_reason: 'no_match',
        })),
        confidence: 0,
        apiCalled: true,
      };
    }
    
    const matching = data.matchings[0];
    const tracepoints = data.tracepoints;
    const overallConfidence = matching.confidence || 0;
    
    const matchedPoints = points.map((point, index) => {
      const tracepoint = tracepoints[index];
      
      if (tracepoint && tracepoint.location) {
        return {
          ...point,
          raw_lat: point.latitude,
          raw_lng: point.longitude,
          matched_lat: tracepoint.location[1],
          matched_lng: tracepoint.location[0],
          confidence: overallConfidence,
          matched: true,
        };
      } else {
        return {
          ...point,
          raw_lat: point.latitude,
          raw_lng: point.longitude,
          matched_lat: point.latitude,
          matched_lng: point.longitude,
          confidence: 0,
          matched: false,
          skipped_reason: 'point_not_matched',
        };
      }
    });
    
    return {
      matchedPoints,
      confidence: overallConfidence,
      apiCalled: true,
    };
    
  } catch (error) {
    console.warn(`  Error: ${error.message}`);
    return {
      matchedPoints: points.map(p => ({
        ...p,
        raw_lat: p.latitude,
        raw_lng: p.longitude,
        matched_lat: p.latitude,
        matched_lng: p.longitude,
        confidence: 0,
        matched: false,
        skipped_reason: 'fetch_error',
      })),
      confidence: 0,
      apiCalled: true,
    };
  }
}

/**
 * Write matched data to CSV
 */
function writeCSV(points, filePath) {
  const headers = [
    'timestamp', 'vehicle', 'ward', 'phase', 'location_name',
    'raw_lat', 'raw_lng', 'matched_lat', 'matched_lng', 'confidence', 'matched'
  ];
  
  const lines = [headers.join(',')];
  
  for (const p of points) {
    lines.push([
      p.timestamp,
      p.vehicle,
      p.ward,
      p.phase,
      p.location_name,
      p.raw_lat,
      p.raw_lng,
      p.matched_lat,
      p.matched_lng,
      p.confidence,
      p.matched
    ].join(','));
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log(`\nWritten ${points.length} rows to ${filePath}`);
}

/**
 * Convert matched points to routes.json format for frontend
 */
function convertToRoutesFormat(points) {
  const routes = {};
  
  for (const point of points) {
    const vehicleId = point.vehicle;
    const date = point.timestamp.split(' ')[0];
    
    if (!routes[vehicleId]) {
      routes[vehicleId] = {};
    }
    
    if (!routes[vehicleId][date]) {
      routes[vehicleId][date] = {
        points: [],
        summary: {
          totalDistance: 0,
          drivingDuration: 0,
          idleDuration: 0,
          maxSpeed: 0,
        }
      };
    }
    
    routes[vehicleId][date].points.push({
      lat: point.matched_lat,
      lng: point.matched_lng,
      raw_lat: point.raw_lat,
      raw_lng: point.raw_lng,
      timestamp: point.timestamp.replace(' ', 'T') + 'Z',
      speed: point.phase === 'TRAVEL' ? 15 : (point.phase === 'WORKING' ? 2 : 0),
      location: point.location_name,
      phase: point.phase,
      confidence: point.confidence,
      matched: point.matched,
    });
  }
  
  // Calculate summaries
  for (const vehicleId in routes) {
    for (const date in routes[vehicleId]) {
      const dayPoints = routes[vehicleId][date].points;
      let totalDistance = 0;
      let travelDuration = 0;
      let workingDuration = 0;
      let breakDuration = 0;
      
      for (let i = 1; i < dayPoints.length; i++) {
        const prev = dayPoints[i - 1];
        const curr = dayPoints[i];
        
        // Calculate distance
        const dist = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        totalDistance += dist;
        
        // Calculate durations (assuming 1 minute intervals)
        if (curr.phase === 'TRAVEL') travelDuration++;
        else if (curr.phase === 'WORKING') workingDuration++;
        else if (curr.phase === 'BREAK') breakDuration++;
      }
      
      routes[vehicleId][date].summary = {
        totalDistance: Math.round(totalDistance) / 1000, // km
        drivingDuration: travelDuration,
        workingDuration: workingDuration,
        idleDuration: breakDuration,
        maxSpeed: 25, // JCB max speed estimate
      };
    }
  }
  
  return routes;
}

/**
 * Main processing function
 */
async function main() {
  console.log('\n[1/5] Reading CSV file...');
  const rawPoints = parseCSV(CONFIG.INPUT_CSV, LIMIT);
  console.log(`  Loaded ${rawPoints.length} GPS points`);
  
  console.log('\n[2/5] Creating batches...');
  const batches = createBatches(rawPoints);
  console.log(`  Created ${batches.length} batches`);
  
  // Get unique dates and vehicles
  const dates = [...new Set(rawPoints.map(p => p.timestamp.split(' ')[0]))];
  const vehicles = [...new Set(rawPoints.map(p => p.vehicle))];
  console.log(`  Vehicles: ${vehicles.join(', ')}`);
  console.log(`  Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  
  console.log('\n[3/5] Processing batches with map-matching...');
  const allMatchedPoints = [];
  let apiCalls = 0;
  let skippedBatches = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const progress = Math.round((i / batches.length) * 100);
    
    if (i % 50 === 0 || i === batches.length - 1) {
      process.stdout.write(`\r  Progress: ${progress}% (${i}/${batches.length} batches, ${apiCalls} API calls)`);
    }
    
    if (DRY_RUN) {
      // In dry run, just copy raw coordinates
      const matchedPoints = batch.points.map(p => ({
        ...p,
        raw_lat: p.latitude,
        raw_lng: p.longitude,
        matched_lat: p.latitude,
        matched_lng: p.longitude,
        confidence: 1.0,
        matched: false,
      }));
      allMatchedPoints.push(...matchedPoints);
    } else {
      const result = await mapMatchBatch(batch);
      allMatchedPoints.push(...result.matchedPoints);
      
      if (result.apiCalled) {
        apiCalls++;
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
      } else {
        skippedBatches++;
      }
    }
  }
  
  console.log(`\n  Completed! API calls: ${apiCalls}, Skipped (no movement): ${skippedBatches}`);
  
  // Sort by timestamp
  allMatchedPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  console.log('\n[4/5] Writing output files...');
  
  // Write CSV
  writeCSV(allMatchedPoints, CONFIG.OUTPUT_CSV);
  
  // Write routes JSON
  const routesData = convertToRoutesFormat(allMatchedPoints);
  fs.writeFileSync(CONFIG.OUTPUT_JSON, JSON.stringify(routesData, null, 2));
  console.log(`Written routes to ${CONFIG.OUTPUT_JSON}`);
  
  // Copy to public folder for frontend
  fs.writeFileSync(CONFIG.PUBLIC_JSON, JSON.stringify(routesData, null, 2));
  console.log(`Written routes to ${CONFIG.PUBLIC_JSON}`);
  
  console.log('\n[5/5] Summary');
  console.log('='.repeat(60));
  console.log(`Total points processed: ${allMatchedPoints.length}`);
  console.log(`Total batches: ${batches.length}`);
  console.log(`API calls made: ${apiCalls}`);
  console.log(`Batches skipped (no movement): ${skippedBatches}`);
  
  const matchedCount = allMatchedPoints.filter(p => p.matched).length;
  console.log(`Points matched to roads: ${matchedCount} (${Math.round(matchedCount / allMatchedPoints.length * 100)}%)`);
  
  // Cost estimate
  const estimatedCost = apiCalls > 100000 ? (apiCalls - 100000) * 0.0005 : 0;
  console.log(`\nEstimated Mapbox cost: $${estimatedCost.toFixed(2)}`);
  console.log(`(Free tier: 100,000 requests/month)`);
  
  console.log('\n✅ Processing complete!');
  console.log(`\nOutput files:`);
  console.log(`  - CSV: ${CONFIG.OUTPUT_CSV}`);
  console.log(`  - JSON: ${CONFIG.OUTPUT_JSON}`);
  console.log(`  - Public: ${CONFIG.PUBLIC_JSON}`);
}

main().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
