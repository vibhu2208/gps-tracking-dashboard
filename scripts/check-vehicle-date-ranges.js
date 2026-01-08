/**
 * Check date ranges for a vehicle in MongoDB
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const VEHICLE_ID = process.argv[2] || 'HR26DP0703';

async function checkDateRanges() {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    
    // Get all routes for the vehicle
    const routes = await routesCollection.find({
      vehicleId: VEHICLE_ID
    })
    .sort({ date: 1 })
    .toArray();
    
    console.log(`\n📊 Date ranges for vehicle ${VEHICLE_ID}\n`);
    
    if (routes.length === 0) {
      console.log('❌ No routes found for this vehicle');
      return;
    }
    
    // Extract dates and locations
    const dateLocationMap = {};
    routes.forEach(route => {
      if (!dateLocationMap[route.date]) {
        dateLocationMap[route.date] = {
          date: route.date,
          points: route.points || []
        };
      }
    });
    
    const dates = Object.keys(dateLocationMap).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    console.log(`📅 First date: ${firstDate}`);
    console.log(`📅 Last date: ${lastDate}`);
    console.log(`📊 Total days: ${dates.length}\n`);
    
    // Group by location (from points)
    const locationGroups = {};
    dates.forEach(date => {
      const route = routes.find(r => r.date === date);
      if (route && route.points && route.points.length > 0) {
        // Get location from first point
        const location = route.points[0].location || 'Unknown';
        if (!locationGroups[location]) {
          locationGroups[location] = [];
        }
        locationGroups[location].push(date);
      }
    });
    
    console.log('📍 Locations and date ranges:');
    console.log('─'.repeat(60));
    
    Object.keys(locationGroups).sort().forEach(location => {
      const locDates = locationGroups[location].sort();
      const start = locDates[0];
      const end = locDates[locDates.length - 1];
      console.log(`\n${location}:`);
      console.log(`   Start: ${start}`);
      console.log(`   End: ${end}`);
      console.log(`   Days: ${locDates.length}`);
    });
    
    // Check for gaps
    console.log('\n\n🔍 Checking for date gaps...');
    const gaps = [];
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffDays = Math.floor((next - current) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        gaps.push({
          after: dates[i],
          before: dates[i + 1],
          gap: diffDays - 1
        });
      }
    }
    
    if (gaps.length > 0) {
      console.log(`\n⚠️  Found ${gaps.length} gap(s):`);
      gaps.forEach(gap => {
        console.log(`   Gap of ${gap.gap} day(s) between ${gap.after} and ${gap.before}`);
      });
    } else {
      console.log('✅ No gaps found - all dates are consecutive!');
    }
    
  } catch (error) {
    console.error('❌ Error checking date ranges:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkDateRanges();

