const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../data/fleetzi_jcb_ward19_roads_aligned_aug25_to_dec24_2025.csv');
const outputFilePath = path.join(__dirname, '../data/routes.json');

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
    const location = parts[3];
    const latitude = parseFloat(parts[4]);
    const longitude = parseFloat(parts[5]);
    const status = parts[6];
    
    const date = timestamp.split(' ')[0];
    const isoTimestamp = timestamp.replace(' ', 'T') + 'Z';
    
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
    
    routes[vehicle][date].points.push({
      lat: latitude,
      lng: longitude,
      timestamp: isoTimestamp,
      speed: status === 'WORKING_ON_ROAD' ? 1 : 0,
      location: location,
      status: status
    });
  }
  
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
        
        const R = 6371;
        const dLat = (curr.lat - prev.lat) * Math.PI / 180;
        const dLon = (curr.lng - prev.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        totalDistance += distance;
        
        const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60);
        
        if (curr.speed > 0) {
          drivingDuration += timeDiff;
        } else {
          idleDuration += timeDiff;
        }
        
        if (curr.speed > maxSpeed) {
          maxSpeed = curr.speed;
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
  
  fs.writeFileSync(outputFilePath, JSON.stringify(routes, null, 2));
  console.log(`Routes data generated successfully at ${outputFilePath}`);
  console.log(`Total vehicles: ${Object.keys(routes).length}`);
  
  for (const vehicle in routes) {
    const dates = Object.keys(routes[vehicle]);
    console.log(`Vehicle ${vehicle}: ${dates.length} days of data (${dates[0]} to ${dates[dates.length - 1]})`);
  }
}

parseCSV();
