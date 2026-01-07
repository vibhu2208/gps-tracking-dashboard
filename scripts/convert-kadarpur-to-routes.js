/**
 * Convert Kadarpur CSV to routes.json format
 * 
 * Converts the Kadarpur GPS CSV to the JSON format expected by the dashboard
 */

const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../data/kadarpur_hr38f6826_aug25_sep11_2025.csv');
const outputFilePath = path.join(__dirname, '../public/data/routes.json');

// Convert IST timestamp to UTC ISO string
function istToUtc(istTimestamp) {
  // IST is UTC+5:30
  const [datePart, timePart] = istTimestamp.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  // Create date in IST and convert to UTC by subtracting 5:30
  const istDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  // Subtract 5 hours 30 minutes to convert IST to UTC
  istDate.setUTCHours(istDate.getUTCHours() - 5);
  istDate.setUTCMinutes(istDate.getUTCMinutes() - 30);
  
  return istDate.toISOString();
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate speed in km/h
function calculateSpeed(lat1, lng1, lat2, lng2, timeDiffMinutes) {
  if (timeDiffMinutes === 0) return 0;
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  const speed = (distance / timeDiffMinutes) * 60; // km/h
  return Math.round(speed);
}

function parseCSV() {
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  const routes = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 7) continue;
    
    const timestamp = parts[0];
    const vehicle = parts[1];
    const ward = parts[2];
    const phase = parts[3]; // TRAVEL_OUT, WORKING, BREAK, TRAVEL_BACK
    const locationName = parts[4];
    const latitude = parseFloat(parts[5]);
    const longitude = parseFloat(parts[6]);
    
    const date = timestamp.split(' ')[0];
    const isoTimestamp = istToUtc(timestamp);
    
    if (!routes[vehicle]) {
      routes[vehicle] = {};
    }
    
    if (!routes[vehicle][date]) {
      routes[vehicle][date] = {
        points: [],
        summary: {
          totalDistance: 0,
          drivingDuration: 0,
          idleDuration: 0,
          maxSpeed: 0
        }
      };
    }
    
    // Determine if point is a stop based on phase
    const isStop = phase === 'BREAK' || phase === 'WORKING';
    
    // Map phase to status for compatibility
    let status = phase;
    if (phase === 'TRAVEL_OUT') status = 'TRAVEL_OUT';
    else if (phase === 'TRAVEL_BACK') status = 'TRAVEL_BACK';
    else if (phase === 'WORKING') status = 'WORKING';
    else if (phase === 'BREAK') status = 'BREAK';
    
    routes[vehicle][date].points.push({
      lat: latitude,
      lng: longitude,
      timestamp: isoTimestamp,
      speed: 0, // Will be calculated later
      location: locationName,
      status: status,
      phase: phase,
      isStop: isStop
    });
  }
  
  // Calculate speeds, distances, and summaries
  for (const vehicle in routes) {
    for (const date in routes[vehicle]) {
      const points = routes[vehicle][date].points;
      
      let totalDistance = 0;
      let drivingDuration = 0;
      let idleDuration = 0;
      let maxSpeed = 0;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        
        // Calculate distance
        const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        totalDistance += distance;
        
        // Calculate time difference in minutes
        const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60);
        
        // Calculate speed
        const speed = calculateSpeed(prev.lat, prev.lng, curr.lat, curr.lng, timeDiff);
        curr.speed = speed;
        
        if (speed > maxSpeed) {
          maxSpeed = speed;
        }
        
        // Determine if moving or idle based on speed and phase
        if (curr.phase === 'TRAVEL_OUT' || curr.phase === 'TRAVEL_BACK') {
          drivingDuration += timeDiff;
        } else if (curr.phase === 'WORKING') {
          // Working can have some movement, but mostly idle
          if (speed > 5) {
            drivingDuration += timeDiff;
          } else {
            idleDuration += timeDiff;
          }
        } else if (curr.phase === 'BREAK') {
          idleDuration += timeDiff;
        } else {
          // Default: if speed > 5 km/h, consider it driving
          if (speed > 5) {
            drivingDuration += timeDiff;
          } else {
            idleDuration += timeDiff;
          }
        }
      }
      
      routes[vehicle][date].summary = {
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        drivingDuration: Math.round(drivingDuration),
        idleDuration: Math.round(idleDuration),
        maxSpeed: Math.round(maxSpeed)
      };
    }
  }
  
  // Read existing routes.json if it exists and merge
  let existingRoutes = {};
  if (fs.existsSync(outputFilePath)) {
    try {
      const existingContent = fs.readFileSync(outputFilePath, 'utf-8');
      existingRoutes = JSON.parse(existingContent);
    } catch (error) {
      console.warn('Could not read existing routes.json, creating new file');
    }
  }
  
  // Merge new routes with existing routes
  for (const vehicle in routes) {
    if (!existingRoutes[vehicle]) {
      existingRoutes[vehicle] = {};
    }
    // Merge dates
    for (const date in routes[vehicle]) {
      existingRoutes[vehicle][date] = routes[vehicle][date];
    }
  }
  
  // Ensure directory exists
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFilePath, JSON.stringify(existingRoutes, null, 2));
  console.log(`✅ Routes data generated successfully at ${outputFilePath}`);
  console.log(`📊 Total vehicles: ${Object.keys(existingRoutes).length}`);
  
  for (const vehicle in routes) {
    const dates = Object.keys(routes[vehicle]);
    console.log(`🚗 Vehicle ${vehicle}: ${dates.length} days of data (${dates[0]} to ${dates[dates.length - 1]})`);
  }
}

parseCSV();

