const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = 'gps_tracker';

async function migrateData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // 1. Migrate Vehicles
    console.log('\n📦 Migrating vehicles...');
    const vehiclesPath = path.join(__dirname, '../data/vehicles.json');
    const vehiclesData = JSON.parse(fs.readFileSync(vehiclesPath, 'utf-8'));
    
    const vehiclesCollection = db.collection('vehicles');
    await vehiclesCollection.deleteMany({});
    
    for (const vehicle of vehiclesData) {
      await vehiclesCollection.updateOne(
        { id: vehicle.id },
        { $set: vehicle },
        { upsert: true }
      );
    }
    console.log(`✅ Migrated ${vehiclesData.length} vehicles`);
    
    // 2. Migrate Routes
    console.log('\n📦 Migrating routes...');
    const routesPath = path.join(__dirname, '../public/data/routes.json');
    
    if (fs.existsSync(routesPath)) {
      const routesData = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
      const routesCollection = db.collection('routes');
      
      let totalPoints = 0;
      let totalDays = 0;
      
      for (const [vehicleId, vehicleRoutes] of Object.entries(routesData)) {
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
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await routesCollection.updateOne(
            { vehicleId, date },
            { $set: routeDoc },
            { upsert: true }
          );
          
          totalPoints += (routeData.points || []).length;
          totalDays++;
        }
      }
      
      console.log(`✅ Migrated ${totalDays} route days with ${totalPoints} total points`);
    } else {
      console.log('⚠️  routes.json not found, skipping routes migration');
    }
    
    // 3. Migrate Alerts (if exists)
    console.log('\n📦 Migrating alerts...');
    const alertsPath = path.join(__dirname, '../data/alerts.json');
    
    if (fs.existsSync(alertsPath)) {
      const alertsData = JSON.parse(fs.readFileSync(alertsPath, 'utf-8'));
      const alertsCollection = db.collection('alerts');
      
      await alertsCollection.deleteMany({});
      if (Array.isArray(alertsData) && alertsData.length > 0) {
        await alertsCollection.insertMany(alertsData);
        console.log(`✅ Migrated ${alertsData.length} alerts`);
      }
    } else {
      console.log('⚠️  alerts.json not found, skipping alerts migration');
    }
    
    // 4. Create Indexes
    console.log('\n📦 Creating indexes...');
    
    // Vehicles indexes
    await vehiclesCollection.createIndex({ id: 1 }, { unique: true });
    await vehiclesCollection.createIndex({ plateNumber: 1 });
    
    // Routes indexes (redeclare if routes were migrated)
    if (fs.existsSync(routesPath)) {
      const routesCollection = db.collection('routes');
      await routesCollection.createIndex({ vehicleId: 1, date: 1 }, { unique: true });
      await routesCollection.createIndex({ vehicleId: 1 });
      await routesCollection.createIndex({ date: 1 });
      await routesCollection.createIndex({ 'points.timestamp': 1 });
    }
    
    // Alerts indexes
    const alertsCollection = db.collection('alerts');
    await alertsCollection.createIndex({ vehicleId: 1 });
    await alertsCollection.createIndex({ timestamp: -1 });
    await alertsCollection.createIndex({ type: 1 });
    
    console.log('✅ Indexes created');
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run migration
migrateData().catch(console.error);

