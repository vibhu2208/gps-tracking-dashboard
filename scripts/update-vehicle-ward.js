/**
 * Update vehicle ward number in MongoDB
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const VEHICLE_ID = 'HR38T3206';
const NEW_WARD = '33';
const OLD_WARD = '10';

async function updateVehicleWard() {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const vehiclesCollection = db.collection('vehicles');
    
    console.log(`\n📦 Updating vehicle ${VEHICLE_ID} ward from ${OLD_WARD} to ${NEW_WARD}...`);
    
    const result = await vehiclesCollection.updateOne(
      { id: VEHICLE_ID },
      { 
        $set: { 
          ward: NEW_WARD,
          driver: `Ward ${NEW_WARD} Operator`
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      console.log(`⚠️  Vehicle ${VEHICLE_ID} not found in database`);
    } else {
      console.log(`✅ Updated vehicle ${VEHICLE_ID} ward to ${NEW_WARD}`);
      console.log(`   - Matched: ${result.matchedCount} document(s)`);
      console.log(`   - Modified: ${result.modifiedCount} document(s)`);
    }
    
    // Verify the update
    const vehicle = await vehiclesCollection.findOne({ id: VEHICLE_ID });
    if (vehicle) {
      console.log(`\n✅ Verification:`);
      console.log(`   Vehicle ID: ${vehicle.id}`);
      console.log(`   Ward: ${vehicle.ward}`);
      console.log(`   Driver: ${vehicle.driver}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating vehicle ward:', error);
    throw error;
  } finally {
    await client.close();
  }
}

updateVehicleWard();





