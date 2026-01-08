/**
 * Update vehicles.json data in MongoDB
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

async function updateVehicles() {
  const client = new MongoClient(uri);
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const vehiclesCollection = db.collection('vehicles');

    // Read vehicles.json
    const vehiclesFilePath = path.join(__dirname, '../data/vehicles.json');
    if (!fs.existsSync(vehiclesFilePath)) {
      console.log('⚠️  vehicles.json not found');
      return;
    }

    const vehiclesData = JSON.parse(fs.readFileSync(vehiclesFilePath, 'utf-8'));
    
    console.log(`\n📦 Updating ${vehiclesData.length} vehicles in MongoDB...`);
    for (const vehicle of vehiclesData) {
      await vehiclesCollection.updateOne(
        { id: vehicle.id },
        { $set: vehicle },
        { upsert: true }
      );
      console.log(`✅ Updated vehicle: ${vehicle.id} (${vehicle.plateNumber})`);
    }

    console.log('\n✨ Vehicles update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating vehicles:', error);
    throw error;
  } finally {
    await client.close();
  }
}

updateVehicles();

