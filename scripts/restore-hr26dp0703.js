/**
 * Restore HR26DP0703 data from all CSV files
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

// All CSV files for HR26DP0703
const csvFiles = [
  'kadarpur_hr26dp0703_aug25_sep5_2025.csv',
  'kadarpur_hr26dp0703_sep6_sep18_2025.csv',
  'kadarpur_hr26dp0703_sep19_sep22_2025.csv',
  'kadarpur_hr26dp0703_sep23_oct12_2025.csv',
  'kadarpur_hr26dp0703_oct13_oct18_2025.csv',
  'kadarpur_hr26dp0703_oct19_oct23_2025.csv',
  'kadarpur_hr26dp0703_oct24_nov11_2025.csv',
  'kadarpur_hr26dp0703_nov12_nov29_2025.csv',
  'kadarpur_hr26dp0703_nov30_dec2_2025.csv',
  'kadarpur_hr26dp0703_dec3_dec15_2025.csv',
  'kadarpur_hr26dp0703_dec15_dec25_2025.csv',
];

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

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}

// Calculate speed in km/h
function calculateSpeed(lat1, lng1, lat2, lng2, timeDiffMs) {
  if (timeDiffMs === 0) return 0;
  const distance = calculateDistance(lat1, lng1, lat2, lng2); // meters
  const timeHours = timeDiffMs / (1000 * 60 * 60);
  return distance / 1000 / timeHours; // km/h
}

async function saveToMongoDB(routes) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('\n📦 Saving to MongoDB...');

    const db = client.db(dbName);
    const routesCollection = db.collection('routes');

    let totalPoints = 0;
    let totalDays = 0;

    for (const [vehicleId, vehicleRoutes] of Object.entries(routes)) {
      for (const [date, routeData] of Object.entries(vehicleRoutes)) {
        const routeDoc = {
          vehicleId,
          date,
          points: routeData.points || [],
          summary: routeData.summary || {
            totalDistance: 0,
            drivingDuration: 0,
            idleDuration: 0,
            maxSpeed: 0
          },
          updatedAt: new Date()
        };

        await routesCollection.updateOne(
          { vehicleId, date },
          { $set: routeDoc, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );

        totalPoints += (routeData.points || []).length;
        totalDays++;
      }
    }

    console.log(`✅ Saved ${totalDays} route days with ${totalPoints} total points to MongoDB`);

  } catch (error) {
    console.error('❌ MongoDB save error:', error);
  } finally {
    await client.close();
  }
}

function parseCSV(csvFilePath) {
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
    const phase = parts[3];
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
    
    const isStop = phase === 'BREAK' || phase === 'WORKING';
    
    let status = phase;
    if (phase === 'TRAVEL_OUT') status = 'TRAVEL_OUT';
    else if (phase === 'TRAVEL_BACK') status = 'TRAVEL_BACK';
    else if (phase === 'WORKING') status = 'WORKING';
    else if (phase === 'BREAK') status = 'BREAK';
    
    routes[vehicle][date].points.push({
      lat: latitude,
      lng: longitude,
      timestamp: isoTimestamp,
      speed: 0,
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
        
        const prevTime = new Date(prev.timestamp);
        const currTime = new Date(curr.timestamp);
        const timeDiff = currTime - prevTime;
        
        const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        const speed = calculateSpeed(prev.lat, prev.lng, curr.lat, curr.lng, timeDiff);
        
        curr.speed = speed;
        totalDistance += distance;
        maxSpeed = Math.max(maxSpeed, speed);
        
        if (speed > 1) {
          drivingDuration += timeDiff;
        } else {
          idleDuration += timeDiff;
        }
      }
      
      routes[vehicle][date].summary = {
        totalDistance: Math.round(totalDistance),
        drivingDuration: Math.round(drivingDuration / 1000),
        idleDuration: Math.round(idleDuration / 1000),
        maxSpeed: Math.round(maxSpeed)
      };
    }
  }
  
  return routes;
}

async function main() {
  const dataDir = path.join(__dirname, '../data');
  const allRoutes = {};
  
  console.log('🔄 Restoring HR26DP0703 data from CSV files...\n');
  
  for (const csvFile of csvFiles) {
    const csvPath = path.join(dataDir, csvFile);
    if (fs.existsSync(csvPath)) {
      console.log(`📄 Processing ${csvFile}...`);
      const routes = parseCSV(csvPath);
      
      // Merge into allRoutes
      for (const vehicle in routes) {
        if (!allRoutes[vehicle]) {
          allRoutes[vehicle] = {};
        }
        for (const date in routes[vehicle]) {
          allRoutes[vehicle][date] = routes[vehicle][date];
        }
      }
    } else {
      console.log(`⚠️  File not found: ${csvFile}`);
    }
  }
  
  console.log(`\n✅ Parsed ${Object.keys(allRoutes).length} vehicle(s)`);
  for (const vehicle in allRoutes) {
    const dates = Object.keys(allRoutes[vehicle]).sort();
    console.log(`   ${vehicle}: ${dates.length} days (${dates[0]} to ${dates[dates.length - 1]})`);
  }
  
  // Save to MongoDB
  await saveToMongoDB(allRoutes);
  
  console.log('\n✨ Restoration complete!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

