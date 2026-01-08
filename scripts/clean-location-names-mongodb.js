/**
 * Clean Location Names in MongoDB Routes
 * Removes street names and extra text from location fields
 * Changes "Behrampur - Street 1" to "Behrampur"
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

const VEHICLE_ID = 'HP38F6826';

async function cleanLocationNames() {
  const client = new MongoClient(uri);
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');

    // Find all routes for the vehicle
    const routes = await routesCollection.find({
      vehicleId: VEHICLE_ID
    }).toArray();

    console.log(`\n📦 Found ${routes.length} routes to clean...`);

    let totalPointsUpdated = 0;
    for (const route of routes) {
      let pointsUpdated = 0;
      
      // Clean location_name in points array
      if (route.points && Array.isArray(route.points)) {
        route.points.forEach(point => {
          if (point.location) {
            // Remove " - Street X" or any text after " - "
            const cleanedLocation = point.location.split(' - ')[0];
            if (point.location !== cleanedLocation) {
              point.location = cleanedLocation;
              pointsUpdated++;
            }
          }
        });

        if (pointsUpdated > 0) {
          await routesCollection.updateOne(
            { _id: route._id },
            { $set: { points: route.points } }
          );
          console.log(`✅ Updated ${pointsUpdated} points in route ${route.date}`);
          totalPointsUpdated += pointsUpdated;
        }
      }
    }

    console.log(`\n✨ Location name cleanup completed!`);
    console.log(`📊 Total points updated: ${totalPointsUpdated}`);

  } catch (error) {
    console.error('❌ Error cleaning location names:', error);
    throw error;
  } finally {
    await client.close();
  }
}

cleanLocationNames();

