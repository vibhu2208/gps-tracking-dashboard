/**
 * Delete routes for a specific vehicle and date range from MongoDB
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const VEHICLE_ID = process.argv[2] || 'HR55W9227';
const START_DATE = process.argv[3] || '2025-09-28';
const END_DATE = process.argv[4] || '2025-10-10';

async function deleteDateRange() {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    
    // Delete routes for the specific date range
    console.log(`\n📦 Deleting routes for vehicle ${VEHICLE_ID} from ${START_DATE} to ${END_DATE}...`);
    const routesCollection = db.collection('routes');
    const routesResult = await routesCollection.deleteMany({ 
      vehicleId: VEHICLE_ID,
      date: { $gte: START_DATE, $lte: END_DATE }
    });
    console.log(`✅ Deleted ${routesResult.deletedCount} route documents`);
    
    // Delete alerts for the same date range
    console.log(`\n📦 Deleting alerts for vehicle ${VEHICLE_ID} from ${START_DATE} to ${END_DATE}...`);
    const alertsCollection = db.collection('alerts');
    const alertsResult = await alertsCollection.deleteMany({ 
      vehicleId: VEHICLE_ID,
      date: { $gte: START_DATE, $lte: END_DATE }
    });
    console.log(`✅ Deleted ${alertsResult.deletedCount} alert documents`);
    
    console.log(`\n✨ Successfully deleted data for vehicle ${VEHICLE_ID}`);
    console.log(`📊 Summary:`);
    console.log(`   - Routes deleted: ${routesResult.deletedCount}`);
    console.log(`   - Alerts deleted: ${alertsResult.deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error deleting date range:', error);
    throw error;
  } finally {
    await client.close();
  }
}

deleteDateRange();




