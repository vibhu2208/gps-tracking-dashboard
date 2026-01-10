/**
 * Migrate vehicle data from one vehicle ID to another and change ward
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const OLD_VEHICLE_ID = process.argv[2] || 'HR55W9227';
const NEW_VEHICLE_ID = process.argv[3] || 'HR15F3079';
const OLD_WARD = process.argv[4] || '29';
const NEW_WARD = process.argv[5] || '30';

async function migrateVehicle() {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    
    // Get all routes for the old vehicle
    console.log(`\n📦 Fetching routes for vehicle ${OLD_VEHICLE_ID}...`);
    const routesCollection = db.collection('routes');
    const routes = await routesCollection.find({ vehicleId: OLD_VEHICLE_ID }).toArray();
    console.log(`✅ Found ${routes.length} route documents`);
    
    if (routes.length === 0) {
      console.log('⚠️  No routes found to migrate');
      return;
    }
    
    // Migrate routes
    console.log(`\n🔄 Migrating routes from ${OLD_VEHICLE_ID} to ${NEW_VEHICLE_ID} (Ward ${OLD_WARD} → ${NEW_WARD})...`);
    let routesMigrated = 0;
    for (const route of routes) {
      // Update vehicle ID and ward
      const updateDoc = {
        vehicleId: NEW_VEHICLE_ID,
        ward: NEW_WARD
      };
      
      // Update ward in points array if it exists
      if (route.points && Array.isArray(route.points)) {
        route.points.forEach(point => {
          if (point.ward) {
            point.ward = NEW_WARD;
          }
        });
        updateDoc.points = route.points;
      }
      
      // Remove _id and insert new route with updated vehicle ID and ward
      const { _id, ...routeWithoutId } = route;
      await routesCollection.insertOne({
        ...routeWithoutId,
        vehicleId: NEW_VEHICLE_ID,
        ward: NEW_WARD,
        points: route.points || []
      });
      routesMigrated++;
    }
    console.log(`✅ Migrated ${routesMigrated} route documents`);
    
    // Migrate alerts
    console.log(`\n🔄 Migrating alerts from ${OLD_VEHICLE_ID} to ${NEW_VEHICLE_ID}...`);
    const alertsCollection = db.collection('alerts');
    const alerts = await alertsCollection.find({ vehicleId: OLD_VEHICLE_ID }).toArray();
    console.log(`✅ Found ${alerts.length} alert documents`);
    
    if (alerts.length > 0) {
      for (const alert of alerts) {
        const { _id, ...alertWithoutId } = alert;
        await alertsCollection.insertOne({
          ...alertWithoutId,
          vehicleId: NEW_VEHICLE_ID,
          ward: NEW_WARD
        });
      }
      console.log(`✅ Migrated ${alerts.length} alert documents`);
    }
    
    // Migrate vehicle document
    console.log(`\n🔄 Migrating vehicle document...`);
    const vehiclesCollection = db.collection('vehicles');
    const oldVehicle = await vehiclesCollection.findOne({ id: OLD_VEHICLE_ID });
    
    if (oldVehicle) {
      const { _id, ...vehicleWithoutId } = oldVehicle;
      // Use upsert to avoid duplicate key error if vehicle already exists
      await vehiclesCollection.updateOne(
        { id: NEW_VEHICLE_ID },
        { $set: { ...vehicleWithoutId, id: NEW_VEHICLE_ID, ward: NEW_WARD } },
        { upsert: true }
      );
      console.log(`✅ Migrated/updated vehicle document`);
    }
    
    // Delete old vehicle data
    console.log(`\n🗑️  Deleting old vehicle ${OLD_VEHICLE_ID}...`);
    const deleteRoutes = await routesCollection.deleteMany({ vehicleId: OLD_VEHICLE_ID });
    const deleteAlerts = await alertsCollection.deleteMany({ vehicleId: OLD_VEHICLE_ID });
    const deleteVehicle = await vehiclesCollection.deleteOne({ id: OLD_VEHICLE_ID });
    
    console.log(`✅ Deleted ${deleteRoutes.deletedCount} route documents`);
    console.log(`✅ Deleted ${deleteAlerts.deletedCount} alert documents`);
    console.log(`✅ Deleted ${deleteVehicle.deletedCount} vehicle document`);
    
    console.log(`\n✨ Migration completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Routes migrated: ${routesMigrated}`);
    console.log(`   - Alerts migrated: ${alerts.length}`);
    console.log(`   - Old vehicle deleted: ${OLD_VEHICLE_ID}`);
    console.log(`   - New vehicle created: ${NEW_VEHICLE_ID} (Ward ${NEW_WARD})`);
    
  } catch (error) {
    console.error('❌ Error migrating vehicle:', error);
    throw error;
  } finally {
    await client.close();
  }
}

migrateVehicle();

