/**
 * Remove Om Nagar from Ward 19 and extend Maruti Kunj and Ekta Enclave
 * 
 * 1. Delete Om Nagar routes (Oct 13-18)
 * 2. Generate new GPS data for Maruti Kunj (Oct 13-15, 3 days)
 * 3. Generate new GPS data for Ekta Enclave (Oct 16-18, 3 days)
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
// Import the generate-kadarpur-gps functions
const generateScript = require('./generate-kadarpur-gps.js');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI || 'mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/';
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';
const VEHICLE_ID = 'HR26DP0703';

// Maruti Kunj configuration
const MARUTI_KUNJ = {
  DEPOT: { lat: 28.356594, lng: 77.081320 },
  STREETS: [
    { id: 'S1', lat: 28.359242, lng: 77.081505, name: 'Street 1' },
    { id: 'S2', lat: 28.359903, lng: 77.081443, name: 'Street 2' },
    { id: 'S3', lat: 28.360542, lng: 77.080490, name: 'Street 3' },
    { id: 'S4', lat: 28.360562, lng: 77.079410, name: 'Street 4' },
    { id: 'S5', lat: 28.361115, lng: 77.080592, name: 'Street 5' },
    { id: 'S6', lat: 28.361109, lng: 77.081574, name: 'Street 6' },
  ],
  START_DATE: new Date('2025-10-13'),
  END_DATE: new Date('2025-10-15'),
  LOCATION: 'Maruti Kunj'
};

// Ekta Enclave configuration
const EKTA_ENCLAVE = {
  DEPOT: { lat: 28.501235, lng: 77.044732 },
  STREETS: [
    { id: 'S1', lat: 28.501187, lng: 77.043816, name: 'Street 1' },
    { id: 'S2', lat: 28.501504, lng: 77.043806, name: 'Street 2' },
    { id: 'S3', lat: 28.501801, lng: 77.044520, name: 'Street 3' },
    { id: 'S4', lat: 28.501186, lng: 77.043336, name: 'Street 4' },
  ],
  START_DATE: new Date('2025-10-16'),
  END_DATE: new Date('2025-10-18'),
  LOCATION: 'Ekta Enclave'
};

async function deleteOmNagarRoutes() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    
    // Delete Om Nagar routes (Oct 13-18)
    const dates = ['2025-10-13', '2025-10-14', '2025-10-15', '2025-10-16', '2025-10-17', '2025-10-18'];
    
    console.log('\n🗑️  Deleting Om Nagar routes...');
    const result = await routesCollection.deleteMany({
      vehicleId: VEHICLE_ID,
      date: { $in: dates }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} Om Nagar route days`);
    
  } catch (error) {
    console.error('❌ Error deleting Om Nagar routes:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function generateAndSaveLocality(localityConfig) {
  // This will be done by running generate-kadarpur-gps.js with different configs
  // For now, we'll create a simplified version
  console.log(`\n📅 Generating data for ${localityConfig.LOCATION}...`);
  console.log(`   Date range: ${localityConfig.START_DATE.toISOString().split('T')[0]} to ${localityConfig.END_DATE.toISOString().split('T')[0]}`);
  
  // We'll need to modify generate-kadarpur-gps.js to accept parameters
  // For now, let's create CSV files and then convert them
}

async function main() {
  console.log('🚀 Removing Om Nagar and extending Maruti Kunj and Ekta Enclave...\n');
  
  // Step 1: Delete Om Nagar routes
  await deleteOmNagarRoutes();
  
  // Step 2: Generate new data for Maruti Kunj (Oct 13-15)
  // Step 3: Generate new data for Ekta Enclave (Oct 16-18)
  
  // We'll need to run generate-kadarpur-gps.js twice with different configs
  console.log('\n⚠️  Please run generate-kadarpur-gps.js twice:');
  console.log('   1. For Maruti Kunj: Oct 13-15');
  console.log('   2. For Ekta Enclave: Oct 16-18');
  console.log('\n   Then run convert-kadarpur-to-routes.js to save to MongoDB');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});



