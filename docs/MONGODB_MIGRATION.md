# MongoDB Migration Documentation

## Overview

All GPS tracking data and static data have been migrated from JSON/CSV files to MongoDB for better scalability, performance, and data management.

## MongoDB Connection

**Connection String**: `mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/`

**Database Name**: `gps_tracker`

## Database Collections

### 1. `vehicles` Collection
**Purpose**: Stores vehicle information (static data)

**Schema**:
```javascript
{
  _id: ObjectId,
  id: String,              // Unique vehicle ID (e.g., "HR38F6826")
  name: String,            // Vehicle name
  plateNumber: String,     // License plate
  status: String,           // "moving", "idle", "offline", "maintenance"
  lastSeen: Date,          // ISO date string
  driver: String,           // Driver name
  model: String,           // Vehicle model
  color: String,           // Vehicle color
  city: String,            // City name
  ward: String,            // Ward number
  location: String         // Current location
}
```

**Indexes**:
- `id` (unique)
- `plateNumber`

### 2. `routes` Collection
**Purpose**: Stores GPS route data for each vehicle and date

**Schema**:
```javascript
{
  _id: ObjectId,
  vehicleId: String,       // Vehicle ID (e.g., "HR38F6826")
  date: String,            // Date in YYYY-MM-DD format
  points: Array,            // Array of route points
  summary: {
    totalDistance: Number,
    drivingDuration: Number,
    idleDuration: Number,
    maxSpeed: Number
  },
  createdAt: Date,         // First creation timestamp
  updatedAt: Date          // Last update timestamp
}
```

**Route Point Schema**:
```javascript
{
  lat: Number,             // Latitude
  lng: Number,             // Longitude
  timestamp: String,       // ISO timestamp
  speed: Number,           // Speed in km/h
  location: String,       // Location name
  status: String,          // "TRAVEL_OUT", "WORKING", "BREAK", "TRAVEL_BACK"
  phase: String,          // Same as status
  isStop: Boolean          // Whether vehicle is stopped
}
```

**Indexes**:
- `vehicleId, date` (unique compound index)
- `vehicleId`
- `date`
- `points.timestamp`

### 3. `alerts` Collection
**Purpose**: Stores vehicle alerts and notifications

**Schema**:
```javascript
{
  _id: ObjectId,
  id: String,              // Alert ID
  vehicleId: String,       // Vehicle ID
  type: String,            // Alert type
  message: String,        // Alert message
  timestamp: Date,        // Alert timestamp
  severity: String        // "low", "medium", "high"
}
```

**Indexes**:
- `vehicleId`
- `timestamp` (descending)
- `type`

## File Structure

### New Files Created

1. **`lib/mongodb.ts`**
   - MongoDB connection utility
   - Handles connection pooling
   - Exports `connectToDatabase()` function

2. **`scripts/migrate-to-mongodb.js`**
   - One-time migration script
   - Migrates vehicles, routes, and alerts from JSON/CSV to MongoDB
   - Creates indexes

3. **`app/api/vehicles/route.ts`**
   - API endpoint: `GET /api/vehicles`
   - Returns all vehicles

4. **`app/api/vehicles/[id]/route.ts`**
   - API endpoint: `GET /api/vehicles/[id]`
   - Returns specific vehicle by ID

5. **`app/api/routes/[vehicleId]/[date]/route.ts`**
   - API endpoint: `GET /api/routes/[vehicleId]/[date]`
   - Returns route data for specific vehicle and date

6. **`app/api/routes/[vehicleId]/dates/route.ts`**
   - API endpoint: `GET /api/routes/[vehicleId]/dates`
   - Returns available dates for a vehicle

7. **`app/api/alerts/route.ts`**
   - API endpoint: `GET /api/alerts`
   - Returns alerts (supports query params: `vehicleId`, `limit`)

### Modified Files

1. **`lib/data.ts`**
   - All functions now use API routes instead of direct file access
   - All functions are now async
   - Functions updated:
     - `getVehicles()` → async, fetches from `/api/vehicles`
     - `getVehicleById()` → async, fetches from `/api/vehicles/[id]`
     - `getRouteData()` → async, fetches from `/api/routes/[vehicleId]/[date]`
     - `getAvailableDates()` → async, fetches from `/api/routes/[vehicleId]/dates`
     - `getAlerts()` → async, fetches from `/api/alerts`
     - `getAlertsByVehicle()` → async, fetches from `/api/alerts?vehicleId=...`
     - `getRecentAlerts()` → async, fetches from `/api/alerts?limit=...`

2. **`scripts/convert-kadarpur-to-routes.js`**
   - Now also saves to MongoDB after generating routes.json
   - Added `saveToMongoDB()` function

3. **Component Updates** (all now use async data fetching):
   - `app/dashboard/page.tsx` - Uses `useEffect` for async data
   - `app/dashboard/vehicles/page.tsx` - Uses `useEffect` for async data
   - `app/dashboard/vehicles/[id]/page.tsx` - Uses `useEffect` for async data
   - `app/dashboard/reports/page.tsx` - Uses `useEffect` for async data
   - `app/dashboard/settings/page.tsx` - Uses `useEffect` for async data

## Migration Process

### Step 1: Initial Migration
Run the migration script to move existing data to MongoDB:

```bash
node scripts/migrate-to-mongodb.js
```

**What it does**:
1. Connects to MongoDB
2. Migrates vehicles from `data/vehicles.json`
3. Migrates routes from `public/data/routes.json`
4. Migrates alerts from `data/alerts.json` (if exists)
5. Creates indexes for optimal query performance

### Step 2: Ongoing Data Updates
After generating new GPS data:

```bash
# Generate GPS data
node scripts/generate-kadarpur-gps.js

# Convert and save to MongoDB
node scripts/convert-kadarpur-to-routes.js
```

The `convert-kadarpur-to-routes.js` script now:
1. Converts CSV to routes.json format
2. Saves to `public/data/routes.json` (for backward compatibility)
3. **Automatically saves to MongoDB** (new)

## API Endpoints

### Vehicles

**GET `/api/vehicles`**
- Returns all vehicles
- Response: `Vehicle[]`

**GET `/api/vehicles/[id]`**
- Returns specific vehicle
- Response: `Vehicle | 404`

### Routes

**GET `/api/routes/[vehicleId]/[date]`**
- Returns route data for specific vehicle and date
- Response: `RouteData | 404`
- Example: `/api/routes/HR38F6826/2025-08-25`

**GET `/api/routes/[vehicleId]/dates`**
- Returns available dates for a vehicle
- Response: `string[]` (sorted, most recent first)
- Example: `/api/routes/HR38F6826/dates`

### Alerts

**GET `/api/alerts`**
- Query params:
  - `vehicleId` (optional): Filter by vehicle
  - `limit` (optional): Limit results (default: 10)
- Response: `Alert[]`
- Examples:
  - `/api/alerts` - All alerts
  - `/api/alerts?vehicleId=HR38F6826` - Alerts for specific vehicle
  - `/api/alerts?limit=5` - Last 5 alerts

## Data Flow

### Before (File-Based)
```
CSV/JSON Files
    ↓
Direct File Access (lib/data.ts)
    ↓
Components
```

### After (MongoDB-Based)
```
MongoDB
    ↓
API Routes (/app/api/*)
    ↓
lib/data.ts (async functions)
    ↓
Components (useEffect hooks)
```

## Environment Variables

Create `.env.local` file:

```env
MONGODB_URI=mongodb+srv://krishnaupadhyay112211_db_user:Ram161003@gps-tracker.ozcq3tw.mongodb.net/
MONGODB_DB_NAME=gps_tracker
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## Benefits of MongoDB Migration

1. **Scalability**: Can handle millions of GPS points efficiently
2. **Performance**: Indexed queries are much faster
3. **Flexibility**: Easy to query and filter data
4. **Real-time**: Can add real-time updates in the future
5. **Backup**: MongoDB Atlas provides automatic backups
6. **Analytics**: Easy to run complex queries and aggregations
7. **Multi-user**: Supports concurrent access
8. **Data Integrity**: Unique indexes prevent duplicate data

## Query Examples

### Get all routes for a vehicle
```javascript
db.routes.find({ vehicleId: "HR38F6826" })
```

### Get routes for a date range
```javascript
db.routes.find({
  vehicleId: "HR38F6826",
  date: { $gte: "2025-08-25", $lte: "2025-09-11" }
})
```

### Get working points only
```javascript
db.routes.aggregate([
  { $match: { vehicleId: "HR38F6826", date: "2025-08-25" } },
  { $unwind: "$points" },
  { $match: { "points.phase": "WORKING" } }
])
```

### Count total GPS points
```javascript
db.routes.aggregate([
  { $group: { _id: null, totalPoints: { $sum: { $size: "$points" } } } }
])
```

## Troubleshooting

### Issue: Cannot connect to MongoDB
**Solution**: 
- Check connection string in `.env.local`
- Verify network access to MongoDB Atlas
- Check MongoDB Atlas IP whitelist

### Issue: API routes return 500 error
**Solution**:
- Check MongoDB connection in `lib/mongodb.ts`
- Verify database and collection names
- Check server logs for detailed errors

### Issue: Data not showing in dashboard
**Solution**:
- Verify data exists in MongoDB (use MongoDB Compass or Atlas UI)
- Check API routes are working (test with browser/Postman)
- Verify components are using async data fetching

### Issue: Migration script fails
**Solution**:
- Ensure MongoDB connection string is correct
- Check file paths in migration script
- Verify JSON files exist and are valid

## Next Steps

1. **Real-time Updates**: Add WebSocket support for live tracking
2. **Data Analytics**: Create aggregation pipelines for insights
3. **Caching**: Add Redis for frequently accessed data
4. **Backup Strategy**: Set up automated backups
5. **Monitoring**: Add MongoDB performance monitoring
6. **User Management**: Add user authentication and authorization

## Summary

✅ All data migrated to MongoDB
✅ API routes created for data access
✅ Components updated for async data fetching
✅ Indexes created for optimal performance
✅ Migration scripts ready for ongoing use
✅ Backward compatibility maintained (routes.json still generated)

The system is now fully migrated to MongoDB and ready for production use!

