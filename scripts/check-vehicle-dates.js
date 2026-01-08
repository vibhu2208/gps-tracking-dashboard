/**
 * Check available dates for a vehicle in MongoDB
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
const START_DATE = '2025-08-25';
const END_DATE = '2025-12-25';

async function checkVehicleDates() {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    
    // Get all routes for the vehicle in the date range
    const routes = await routesCollection.find({
      vehicleId: VEHICLE_ID,
      date: { $gte: START_DATE, $lte: END_DATE }
    })
    .sort({ date: 1 })
    .toArray();
    
    console.log(`\n📊 Checking dates for vehicle ${VEHICLE_ID}`);
    console.log(`📅 Date range: ${START_DATE} to ${END_DATE}`);
    console.log(`\n✅ Found ${routes.length} route days in database\n`);
    
    // Extract dates and sort
    const availableDates = routes.map(r => r.date).sort();
    
    // Generate all expected dates
    const expectedDates = [];
    const start = new Date(START_DATE);
    const end = new Date(END_DATE);
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      expectedDates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }
    
    // Find missing dates
    const missingDates = expectedDates.filter(date => !availableDates.includes(date));
    
    // Display available dates
    if (availableDates.length > 0) {
      console.log('📋 Available dates:');
      availableDates.forEach((date, index) => {
        if (index < 10 || index >= availableDates.length - 10) {
          console.log(`   ${date}`);
        } else if (index === 10) {
          console.log(`   ... (${availableDates.length - 20} more dates) ...`);
        }
      });
    }
    
    // Display missing dates
    if (missingDates.length > 0) {
      console.log(`\n❌ Missing dates (${missingDates.length}):`);
      missingDates.forEach(date => {
        console.log(`   ${date}`);
      });
    } else {
      console.log(`\n✅ All dates from ${START_DATE} to ${END_DATE} are present!`);
    }
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Total expected dates: ${expectedDates.length}`);
    console.log(`   Available dates: ${availableDates.length}`);
    console.log(`   Missing dates: ${missingDates.length}`);
    console.log(`   Coverage: ${((availableDates.length / expectedDates.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error checking vehicle dates:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkVehicleDates();

