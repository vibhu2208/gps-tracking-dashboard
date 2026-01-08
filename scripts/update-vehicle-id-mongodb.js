/**
 * Update Vehicle ID in MongoDB
 * Changes HR38F6826 to HP38F6826 in routes collection
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const OLD_VEHICLE_ID = 'HR38F6826';
const NEW_VEHICLE_ID = 'HP38F6826';

async function updateVehicleId() {
  const client = new MongoClient(uri);
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    const vehiclesCollection = db.collection('vehicles');

    // Update routes collection
    console.log(`\n📦 Updating routes collection: ${OLD_VEHICLE_ID} → ${NEW_VEHICLE_ID}...`);
    const routesResult = await routesCollection.updateMany(
      { vehicleId: OLD_VEHICLE_ID },
      { $set: { vehicleId: NEW_VEHICLE_ID } }
    );
    console.log(`✅ Updated ${routesResult.modifiedCount} route documents`);

    // Update vehicles collection
    console.log(`\n📦 Updating vehicles collection: ${OLD_VEHICLE_ID} → ${NEW_VEHICLE_ID}...`);
    const vehicleResult = await vehiclesCollection.updateOne(
      { id: OLD_VEHICLE_ID },
      { 
        $set: { 
          id: NEW_VEHICLE_ID,
          name: `JCB ${NEW_VEHICLE_ID}`,
          plateNumber: NEW_VEHICLE_ID
        } 
      }
    );
    console.log(`✅ Updated ${vehicleResult.modifiedCount} vehicle document`);

    // Update alerts collection if needed
    console.log(`\n📦 Updating alerts collection: ${OLD_VEHICLE_ID} → ${NEW_VEHICLE_ID}...`);
    const alertsCollection = db.collection('alerts');
    const alertsResult = await alertsCollection.updateMany(
      { vehicleId: OLD_VEHICLE_ID },
      { $set: { vehicleId: NEW_VEHICLE_ID } }
    );
    console.log(`✅ Updated ${alertsResult.modifiedCount} alert documents`);

    console.log('\n✨ Vehicle ID update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating vehicle ID:', error);
    throw error;
  } finally {
    await client.close();
  }
}

updateVehicleId();

