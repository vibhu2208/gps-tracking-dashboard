/**
 * Restore Ward 19 data from CSV files
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const VEHICLE_ID = 'HR26DP0703';

// Convert IST timestamp to UTC ISO string
function istToUtc(istTimestamp) {
  const [datePart, timePart] = istTimestamp.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  const istDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  istDate.setUTCHours(istDate.getUTCHours() - 5);
  istDate.setUTCMinutes(istDate.getUTCMinutes() - 30);
  
  return istDate.toISOString();
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate speed
function calculateSpeed(lat1, lng1, lat2, lng2, timeDiffMinutes) {
  if (timeDiffMinutes === 0) return 0;
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  const speed = (distance / timeDiffMinutes) * 60;
  return Math.round(speed);
}

async function restoreWard19() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    const vehiclesCollection = db.collection('vehicles');
    
    // Find all CSV files for HR26DP0703
    const dataDir = path.join(__dirname, '../data');
    const csvFiles = fs.readdirSync(dataDir)
      .filter(file => file.includes('hr26dp0703') && file.endsWith('.csv'))
      .map(file => path.join(dataDir, file))
      .sort();
    
    console.log(`\n📁 Found ${csvFiles.length} CSV files to restore`);
    
    const routes = {};
    let totalPoints = 0;
    
    // Process each CSV file
    for (const csvFile of csvFiles) {
      console.log(`\n📄 Processing: ${path.basename(csvFile)}`);
      
      const csvContent = fs.readFileSync(csvFile, 'utf-8');
      const lines = csvContent.trim().split('\n');
      const header = lines[0].split(',');
      
      // Group points by date
      const pointsByDate = {};
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        header.forEach((key, idx) => {
          row[key] = values[idx];
        });
        
        const date = row.timestamp.split(' ')[0];
        if (!pointsByDate[date]) {
          pointsByDate[date] = [];
        }
        
        const point = {
          lat: parseFloat(row.latitude),
          lng: parseFloat(row.longitude),
          timestamp: istToUtc(row.timestamp),
          phase: row.phase || 'WORKING',
          location: row.location_name || 'Unknown',
          status: row.phase === 'WORKING' ? 'working' : 'moving'
        };
        
        pointsByDate[date].push(point);
      }
      
      // Calculate summary for each date
      for (const [date, points] of Object.entries(pointsByDate)) {
        if (!routes[date]) {
          routes[date] = {
            points: [],
            summary: {
              totalDistance: 0,
              drivingDuration: 0,
              idleDuration: 0,
              maxSpeed: 0
            }
          };
        }
        
        routes[date].points.push(...points);
        totalPoints += points.length;
        
        // Calculate summary
        let totalDistance = 0;
        let maxSpeed = 0;
        let drivingTime = 0;
        
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          
          const time1 = new Date(prev.timestamp);
          const time2 = new Date(curr.timestamp);
          const timeDiffMinutes = (time2 - time1) / (1000 * 60);
          
          if (timeDiffMinutes > 0) {
            const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
            totalDistance += distance;
            
            if (prev.phase !== 'WORKING' && curr.phase !== 'WORKING') {
              const speed = calculateSpeed(prev.lat, prev.lng, curr.lat, curr.lng, timeDiffMinutes);
              maxSpeed = Math.max(maxSpeed, speed);
              drivingTime += timeDiffMinutes;
            }
          }
        }
        
        routes[date].summary.totalDistance = Math.round(totalDistance * 100) / 100;
        routes[date].summary.maxSpeed = maxSpeed;
        routes[date].summary.drivingDuration = Math.round(drivingTime);
      }
    }
    
    // Save to MongoDB
    console.log(`\n📦 Saving ${Object.keys(routes).length} days of routes to MongoDB...`);
    
    for (const [date, routeData] of Object.entries(routes)) {
      const routeDoc = {
        vehicleId: VEHICLE_ID,
        date,
        points: routeData.points,
        summary: routeData.summary,
        updatedAt: new Date()
      };
      
      await routesCollection.updateOne(
        { vehicleId: VEHICLE_ID, date },
        { $set: routeDoc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    }
    
    // Restore vehicle
    const vehiclesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/vehicles.json'), 'utf-8'));
    const vehicle = vehiclesData.find(v => v.id === VEHICLE_ID);
    
    if (vehicle) {
      await vehiclesCollection.updateOne(
        { id: VEHICLE_ID },
        { $set: vehicle },
        { upsert: true }
      );
      console.log(`✅ Restored vehicle: ${VEHICLE_ID}`);
    }
    
    console.log(`\n✨ Restored ${Object.keys(routes).length} route days with ${totalPoints} total points`);
    console.log(`📅 Date range: ${Object.keys(routes).sort()[0]} to ${Object.keys(routes).sort().reverse()[0]}`);
    
  } catch (error) {
    console.error('❌ Error restoring Ward 19:', error);
    throw error;
  } finally {
    await client.close();
  }
}

restoreWard19().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});



