/**
 * Update Location Name in MongoDB Routes
 * Changes "Kadarpur" to "Ullahawas" for HP38F6826 from Sep 12-27, 2025
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
const START_DATE = '2025-09-12';
const END_DATE = '2025-09-27';
const OLD_LOCATION = 'Kadarpur';
const NEW_LOCATION = 'Ullahawas';

async function updateLocation() {
  const client = new MongoClient(uri);
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');

    // Find all routes for the vehicle in the date range
    const routes = await routesCollection.find({
      vehicleId: VEHICLE_ID,
      date: { $gte: START_DATE, $lte: END_DATE }
    }).toArray();

    console.log(`\n📦 Found ${routes.length} routes to update...`);

    let totalPointsUpdated = 0;
    for (const route of routes) {
      let pointsUpdated = 0;
      
      // Update location_name in points array
      if (route.points && Array.isArray(route.points)) {
        route.points.forEach(point => {
          if (point.location) {
            // Replace "Kadarpur" with "Ullahawas" in location field
            if (point.location.includes(OLD_LOCATION)) {
              point.location = point.location.replace(OLD_LOCATION, NEW_LOCATION);
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

    console.log(`\n✨ Location update completed!`);
    console.log(`📊 Total points updated: ${totalPointsUpdated}`);

  } catch (error) {
    console.error('❌ Error updating location:', error);
    throw error;
  } finally {
    await client.close();
  }
}

updateLocation();

