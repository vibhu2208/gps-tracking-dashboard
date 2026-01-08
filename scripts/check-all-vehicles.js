/**
 * Check all vehicles and their data in MongoDB
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const START_DATE = '2025-08-25';
const END_DATE = '2025-12-25';

async function checkAllVehicles() {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    
    // Get all routes in the date range
    const allRoutes = await routesCollection.find({
      date: { $gte: START_DATE, $lte: END_DATE }
    })
    .sort({ vehicleId: 1, date: 1 })
    .toArray();
    
    console.log(`\n📊 Checking all vehicles from ${START_DATE} to ${END_DATE}`);
    console.log(`\n✅ Total routes found: ${allRoutes.length}\n`);
    
    // Group by vehicle
    const vehicleGroups = {};
    allRoutes.forEach(route => {
      if (!vehicleGroups[route.vehicleId]) {
        vehicleGroups[route.vehicleId] = [];
      }
      vehicleGroups[route.vehicleId].push(route);
    });
    
    // Check each vehicle
    Object.keys(vehicleGroups).sort().forEach(vehicleId => {
      const routes = vehicleGroups[vehicleId];
      const dates = routes.map(r => r.date).sort();
      const uniqueDates = [...new Set(dates)];
      
      console.log(`\n🚗 Vehicle: ${vehicleId}`);
      console.log(`   Total routes: ${routes.length}`);
      console.log(`   Unique dates: ${uniqueDates.length}`);
      
      if (routes.length !== uniqueDates.length) {
        console.log(`   ⚠️  DUPLICATES FOUND: ${routes.length - uniqueDates.length} duplicate date(s)`);
        
        // Find duplicates
        const dateCounts = {};
        dates.forEach(date => {
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
        
        const duplicates = Object.entries(dateCounts)
          .filter(([date, count]) => count > 1)
          .map(([date, count]) => ({ date, count }));
        
        if (duplicates.length > 0) {
          console.log(`   Duplicate dates:`);
          duplicates.forEach(({ date, count }) => {
            console.log(`      ${date}: ${count} entries`);
          });
        }
      }
      
      if (uniqueDates.length > 0) {
        console.log(`   First date: ${uniqueDates[0]}`);
        console.log(`   Last date: ${uniqueDates[uniqueDates.length - 1]}`);
      }
    });
    
    // Check for cross-vehicle duplicates
    console.log(`\n\n🔍 Checking for cross-vehicle date overlaps...`);
    const allDates = allRoutes.map(r => r.date);
    const dateCounts = {};
    allDates.forEach(date => {
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    const sharedDates = Object.entries(dateCounts)
      .filter(([date, count]) => count > 1)
      .map(([date, count]) => ({ date, count }));
    
    if (sharedDates.length > 0) {
      console.log(`⚠️  Found ${sharedDates.length} dates that appear in multiple vehicles:`);
      sharedDates.slice(0, 10).forEach(({ date, count }) => {
        const routesForDate = allRoutes.filter(r => r.date === date);
        const vehicles = [...new Set(routesForDate.map(r => r.vehicleId))];
        console.log(`   ${date}: ${count} entries across vehicles: ${vehicles.join(', ')}`);
      });
      if (sharedDates.length > 10) {
        console.log(`   ... and ${sharedDates.length - 10} more`);
      }
    } else {
      console.log(`✅ No cross-vehicle date overlaps found`);
    }
    
    // Summary
    const totalUniqueDates = new Set(allRoutes.map(r => r.date)).size;
    const expectedDays = 123; // Aug 25 to Dec 25 = 123 days
    const expectedTotal = expectedDays * Object.keys(vehicleGroups).length;
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   Total vehicles: ${Object.keys(vehicleGroups).length}`);
    console.log(`   Total route entries: ${allRoutes.length}`);
    console.log(`   Total unique dates: ${totalUniqueDates}`);
    console.log(`   Expected total (123 days × ${Object.keys(vehicleGroups).length} vehicles): ${expectedTotal}`);
    console.log(`   Difference: ${allRoutes.length - expectedTotal} extra entries`);
    
  } catch (error) {
    console.error('❌ Error checking vehicles:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkAllVehicles();

