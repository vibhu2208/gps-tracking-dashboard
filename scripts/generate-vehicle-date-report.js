/**
 * Generate Date-wise Vehicle Report
 * 
 * Generates a comprehensive report showing vehicle activity organized by date.
 * Can export to CSV or display in console.
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

const VEHICLE_ID = process.argv[2];
const START_DATE = process.argv[3]; // Optional: YYYY-MM-DD
const END_DATE = process.argv[4]; // Optional: YYYY-MM-DD
const OUTPUT_FORMAT = process.argv[5] || 'console'; // 'console' or 'csv'

/**
 * Calculate distance between two points (Haversine)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format duration in minutes to HH:MM
 */
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get phase statistics from points
 */
function getPhaseStats(points) {
  const stats = {
    TRAVEL_OUT: { count: 0, duration: 0 },
    WORKING: { count: 0, duration: 0 },
    BREAK: { count: 0, duration: 0 },
    TRAVEL_BACK: { count: 0, duration: 0 }
  };

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const phase = point.phase || point.status || 'UNKNOWN';
    
    if (stats[phase]) {
      stats[phase].count++;
      stats[phase].duration += 1; // Assuming 1 minute per point
    }
  }

  return stats;
}

/**
 * Generate report for a single vehicle
 */
async function generateVehicleReport(vehicleId, startDate, endDate) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    const vehiclesCollection = db.collection('vehicles');

    // Get vehicle info
    const vehicle = await vehiclesCollection.findOne({ id: vehicleId });
    if (!vehicle) {
      console.error(`❌ Vehicle ${vehicleId} not found`);
      return null;
    }

    console.log(`\n📊 Generating report for: ${vehicle.name} (${vehicle.plateNumber})`);
    console.log(`📍 Ward: ${vehicle.ward || 'N/A'}, Location: ${vehicle.location || 'N/A'}\n`);

    // Build query
    const query = { vehicleId: vehicleId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    // Get all routes
    const routes = await routesCollection.find(query)
      .sort({ date: 1 })
      .toArray();

    if (routes.length === 0) {
      console.log('❌ No route data found for this vehicle');
      return null;
    }

    // Process routes by date
    const reportData = [];
    let totalDistance = 0;
    let totalDrivingTime = 0;
    let totalWorkingTime = 0;
    let totalBreakTime = 0;
    let totalTravelTime = 0;
    let maxSpeedOverall = 0;

    routes.forEach(route => {
      const points = route.points || [];
      if (points.length === 0) return;

      // Get location from first point
      const location = points[0].location || 'Unknown';
      
      // Calculate distance
      let dayDistance = 0;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        dayDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      }

      // Get summary from route or calculate
      const summary = route.summary || {};
      const totalDistanceKm = summary.totalDistance || dayDistance;
      const drivingDuration = summary.drivingDuration || 0;
      const idleDuration = summary.idleDuration || 0;
      const maxSpeed = summary.maxSpeed || 0;

      // Get phase statistics
      const phaseStats = getPhaseStats(points);
      const workingDuration = phaseStats.WORKING.duration;
      const breakDuration = phaseStats.BREAK.duration;
      const travelOutDuration = phaseStats.TRAVEL_OUT.duration;
      const travelBackDuration = phaseStats.TRAVEL_BACK.duration;
      const totalTravelDuration = travelOutDuration + travelBackDuration;

      // Get time range
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const startTime = firstPoint.timestamp ? new Date(firstPoint.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : 'N/A';
      const endTime = lastPoint.timestamp ? new Date(lastPoint.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : 'N/A';

      reportData.push({
        date: route.date,
        location: location,
        totalDistance: parseFloat(totalDistanceKm.toFixed(2)),
        drivingDuration: drivingDuration,
        workingDuration: workingDuration,
        breakDuration: breakDuration,
        travelDuration: totalTravelDuration,
        idleDuration: idleDuration,
        maxSpeed: maxSpeed,
        totalPoints: points.length,
        startTime: startTime,
        endTime: endTime,
        summary: summary
      });

      // Accumulate totals
      totalDistance += totalDistanceKm;
      totalDrivingTime += drivingDuration;
      totalWorkingTime += workingDuration;
      totalBreakTime += breakDuration;
      totalTravelTime += totalTravelDuration;
      if (maxSpeed > maxSpeedOverall) maxSpeedOverall = maxSpeed;
    });

    return {
      vehicle: vehicle,
      reportData: reportData,
      totals: {
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalDrivingTime: totalDrivingTime,
        totalWorkingTime: totalWorkingTime,
        totalBreakTime: totalBreakTime,
        totalTravelTime: totalTravelTime,
        maxSpeed: maxSpeedOverall,
        totalDays: reportData.length
      }
    };

  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Display report in console
 */
function displayReport(report) {
  const { vehicle, reportData, totals } = report;

  console.log('═'.repeat(100));
  console.log(`📋 DATE-WISE VEHICLE REPORT`);
  console.log('═'.repeat(100));
  console.log(`\n🚗 Vehicle: ${vehicle.name} (${vehicle.plateNumber})`);
  console.log(`👤 Driver: ${vehicle.driver || 'N/A'}`);
  console.log(`📍 Ward: ${vehicle.ward || 'N/A'}`);
  console.log(`🏭 Model: ${vehicle.model || 'N/A'}`);
  console.log(`\n📊 SUMMARY`);
  console.log('─'.repeat(100));
  console.log(`Total Days: ${totals.totalDays}`);
  console.log(`Total Distance: ${totals.totalDistance} km`);
  console.log(`Total Driving Time: ${formatDuration(totals.totalDrivingTime)}`);
  console.log(`Total Working Time: ${formatDuration(totals.totalWorkingTime)}`);
  console.log(`Total Break Time: ${formatDuration(totals.totalBreakTime)}`);
  console.log(`Total Travel Time: ${formatDuration(totals.totalTravelTime)}`);
  console.log(`Max Speed: ${totals.maxSpeed} km/h`);
  console.log(`Average Distance per Day: ${(totals.totalDistance / totals.totalDays).toFixed(2)} km`);

  console.log(`\n\n📅 DATE-WISE DETAILS`);
  console.log('═'.repeat(100));
  console.log(
    'Date'.padEnd(12) +
    'Location'.padEnd(25) +
    'Distance'.padEnd(12) +
    'Driving'.padEnd(12) +
    'Working'.padEnd(12) +
    'Break'.padEnd(12) +
    'Max Speed'.padEnd(12) +
    'Time Range'
  );
  console.log('─'.repeat(100));

  reportData.forEach(day => {
    console.log(
      day.date.padEnd(12) +
      (day.location || 'Unknown').padEnd(25) +
      `${day.totalDistance} km`.padEnd(12) +
      formatDuration(day.drivingDuration).padEnd(12) +
      formatDuration(day.workingDuration).padEnd(12) +
      formatDuration(day.breakDuration).padEnd(12) +
      `${day.maxSpeed} km/h`.padEnd(12) +
      `${day.startTime} - ${day.endTime}`
    );
  });

  console.log('═'.repeat(100));
}

/**
 * Export report to CSV
 */
function exportToCSV(report, vehicleId) {
  const { vehicle, reportData, totals } = report;
  const outputDir = path.join(__dirname, '../data/reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `vehicle-report-${vehicleId}-${new Date().toISOString().split('T')[0]}.csv`;
  const filepath = path.join(outputDir, filename);

  // Create CSV content
  let csv = 'Date,Location,Distance (km),Driving Time,Working Time,Break Time,Travel Time,Idle Time,Max Speed (km/h),Total Points,Start Time,End Time\n';
  
  reportData.forEach(day => {
    csv += `${day.date},${day.location || 'Unknown'},${day.totalDistance},${formatDuration(day.drivingDuration)},${formatDuration(day.workingDuration)},${formatDuration(day.breakDuration)},${formatDuration(day.travelDuration)},${formatDuration(day.idleDuration)},${day.maxSpeed},${day.totalPoints},${day.startTime},${day.endTime}\n`;
  });

  // Add summary row
  csv += `\nSUMMARY,,,,,,,,,,\n`;
  csv += `Total Days,${totals.totalDays},,,,,,,,,\n`;
  csv += `Total Distance (km),${totals.totalDistance},,,,,,,,,\n`;
  csv += `Total Driving Time,${formatDuration(totals.totalDrivingTime)},,,,,,,,,\n`;
  csv += `Total Working Time,${formatDuration(totals.totalWorkingTime)},,,,,,,,,\n`;
  csv += `Total Break Time,${formatDuration(totals.totalBreakTime)},,,,,,,,,\n`;
  csv += `Total Travel Time,${formatDuration(totals.totalTravelTime)},,,,,,,,,\n`;
  csv += `Max Speed (km/h),${totals.maxSpeed},,,,,,,,,\n`;
  csv += `Average Distance per Day (km),${(totals.totalDistance / totals.totalDays).toFixed(2)},,,,,,,,,\n`;

  fs.writeFileSync(filepath, csv, 'utf8');
  console.log(`\n✅ Report exported to: ${filepath}`);
}

/**
 * Main function
 */
async function main() {
  if (!VEHICLE_ID) {
    console.error('Usage: node generate-vehicle-date-report.js <VEHICLE_ID> [START_DATE] [END_DATE] [OUTPUT_FORMAT]');
    console.error('Example: node generate-vehicle-date-report.js HR26EW4731 2025-08-25 2025-12-24 csv');
    console.error('Output format: console (default) or csv');
    process.exit(1);
  }

  try {
    const report = await generateVehicleReport(VEHICLE_ID, START_DATE, END_DATE);
    
    if (!report) {
      process.exit(1);
    }

    if (OUTPUT_FORMAT.toLowerCase() === 'csv') {
      exportToCSV(report, VEHICLE_ID);
      console.log('\n📊 Report Summary:');
      console.log(`   Total Days: ${report.totals.totalDays}`);
      console.log(`   Total Distance: ${report.totals.totalDistance} km`);
      console.log(`   Date Range: ${report.reportData[0].date} to ${report.reportData[report.reportData.length - 1].date}`);
    } else {
      displayReport(report);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();



