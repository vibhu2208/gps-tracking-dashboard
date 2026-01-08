/**
 * Delete all data for a specific vehicle from MongoDB
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

async function deleteVehicleData() {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    
    // Delete from routes collection
    console.log(`\n📦 Deleting routes for vehicle ${VEHICLE_ID}...`);
    const routesCollection = db.collection('routes');
    const routesResult = await routesCollection.deleteMany({ vehicleId: VEHICLE_ID });
    console.log(`✅ Deleted ${routesResult.deletedCount} route documents`);
    
    // Delete from alerts collection
    console.log(`\n📦 Deleting alerts for vehicle ${VEHICLE_ID}...`);
    const alertsCollection = db.collection('alerts');
    const alertsResult = await alertsCollection.deleteMany({ vehicleId: VEHICLE_ID });
    console.log(`✅ Deleted ${alertsResult.deletedCount} alert documents`);
    
    // Optionally delete vehicle from vehicles collection (commented out to keep vehicle record)
    // console.log(`\n📦 Deleting vehicle ${VEHICLE_ID}...`);
    // const vehiclesCollection = db.collection('vehicles');
    // const vehicleResult = await vehiclesCollection.deleteOne({ id: VEHICLE_ID });
    // console.log(`✅ Deleted ${vehicleResult.deletedCount} vehicle document`);
    
    console.log(`\n✨ Successfully deleted all data for vehicle ${VEHICLE_ID}`);
    console.log(`📊 Summary:`);
    console.log(`   - Routes deleted: ${routesResult.deletedCount}`);
    console.log(`   - Alerts deleted: ${alertsResult.deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error deleting vehicle data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

deleteVehicleData();

