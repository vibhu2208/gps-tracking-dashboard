# GPS Map-Matching Pipeline Documentation

## Overview

This document describes the complete GPS processing pipeline that:
1. **Generates realistic travel routes** using Mapbox Directions API
2. **Snaps GPS coordinates** to the road network using Mapbox Map-Matching API

## Quick Start

```bash
# Step 1: Generate realistic travel routes (TRAVEL_OUT + TRAVEL_BACK)
node scripts/generate-realistic-travel-routes.js

# Step 2: (Optional) Apply map-matching to further refine coordinates
node scripts/process-csv-mapmatching.js
```

---

## Part 1: Realistic Travel Routes (Directions API)

### Problem Solved

The original synthetic GPS data had TRAVEL_OUT and TRAVEL_BACK phases that moved in **straight lines** between Community Center and work sites, cutting through buildings and empty land.

### Solution

Use **Mapbox Directions API** to get actual driving routes, then generate GPS points along those routes at 1-minute intervals.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Input CSV      │     │  Mapbox          │     │  Output CSV     │
│  (straight-line │ ──► │  Directions API  │ ──► │  (road-aligned  │
│   TRAVEL)       │     │  (driving route) │     │   TRAVEL)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Usage

```bash
# Full processing (calls Mapbox Directions API)
node scripts/generate-realistic-travel-routes.js

# Dry run (no API calls)
node scripts/generate-realistic-travel-routes.js --dry-run

# Limit to first N travel segments (for testing)
node scripts/generate-realistic-travel-routes.js --limit=10
```

### Input/Output Files

| Type | File |
|------|------|
| **Input CSV** | `data/fleetzi_jcb_roundtrip_realistic_roads_aug25_to_dec24_2025.csv` |
| **Output CSV** | `data/fleetzi_jcb_directions_fixed_aug25_to_dec24_2025.csv` |
| **Output JSON** | `data/routes_directions.json` |
| **Public JSON** | `public/data/routes.json` |

### How It Works

1. **Parse CSV** - Read all GPS points from input file
2. **Group Travel Segments** - Identify TRAVEL_OUT and TRAVEL_BACK phases
3. **Get Directions** - For each travel segment:
   - TRAVEL_OUT: Community Center → Work Site
   - TRAVEL_BACK: Work Site → Community Center
4. **Generate Points** - Create GPS points along the route at 1-minute intervals
5. **Cache Routes** - Reuse routes for same start/end coordinates (reduces API calls)
6. **Write Output** - Save CSV and JSON files

### Route Caching

Routes are cached by start/end coordinates (rounded to 4 decimal places). This means:
- 244 travel segments → only 22 unique API calls
- Same route reused when JCB returns to same work site

### Cost Estimation

| Metric | Value |
|--------|-------|
| Travel segments | 244 |
| Unique routes | 22 |
| API calls | 22 |
| Cost | ~$0.01 (within free tier) |

---

## Part 2: Map-Matching (Snapping to Roads)

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   CSV Data  │ ──► │  Batch       │ ──► │  Mapbox     │ ──► │  MongoDB /   │
│   (Raw GPS) │     │  Processor   │     │  API        │     │  JSON Output │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                           │                    │
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Skip idle   │     │  Fallback   │
                    │  batches     │     │  to raw     │
                    └──────────────┘     └─────────────┘
```

## Files

| File | Description |
|------|-------------|
| `lib/mongodb.ts` | MongoDB connection singleton |
| `lib/map-matching.ts` | Core map-matching service module |
| `scripts/process-csv-mapmatching.js` | Batch processing script for CSV data |
| `app/api/map-match/route.ts` | REST API endpoint for map-matching |
| `app/api/map-match/vehicle/[id]/route.ts` | Vehicle-specific map-matching API |

## Usage

### 1. Processing CSV Data

Run the batch processing script to map-match all GPS data from CSV:

```bash
# Full processing (calls Mapbox API)
node scripts/process-csv-mapmatching.js

# Dry run (no API calls, just validates data)
node scripts/process-csv-mapmatching.js --dry-run

# Process only first N rows (for testing)
node scripts/process-csv-mapmatching.js --limit=1000
```

**Output files:**
- `data/gps_matched_output.csv` - Full CSV with raw + matched coordinates
- `data/routes_matched.json` - JSON format for frontend
- `public/data/routes.json` - Public JSON for frontend access

### 2. API Endpoints

#### POST /api/map-match
Map-match a batch of GPS points.

**Request:**
```json
{
  "points": [
    {
      "timestamp": "2025-08-25 09:00:00",
      "vehicle": "HR26DP0703",
      "ward": "19",
      "phase": "TRAVEL",
      "location_name": "Bhondsi",
      "latitude": 28.4508,
      "longitude": 77.0656
    }
  ],
  "options": {
    "batchSize": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matchedPoints": [...],
    "stats": {
      "totalPoints": 100,
      "matchedPoints": 95,
      "totalBatches": 2,
      "successfulBatches": 2,
      "estimatedCost": 0
    },
    "warnings": []
  }
}
```

#### POST /api/map-match/vehicle/:id
Map-match points for a specific vehicle with optional database storage.

**Request:**
```json
{
  "points": [...],
  "date": "2025-08-25",
  "saveToDb": true
}
```

#### GET /api/map-match/vehicle/:id
Retrieve map-matched points from database.

**Query params:**
- `date` - Filter by date (YYYY-MM-DD)
- `showRaw` - Include raw coordinates (default: true)

## Configuration

### Environment Variables

Add to `.env`:

```env
# Mapbox (required for map-matching)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here

# MongoDB (optional, for database storage)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=gps_tracking
```

### Batch Processing Config

In `scripts/process-csv-mapmatching.js`:

```javascript
const CONFIG = {
  BATCH_SIZE: 50,              // Points per API call (max 100)
  DELAY_BETWEEN_BATCHES: 150,  // ms delay to avoid rate limiting
  MIN_MOVEMENT_METERS: 5,      // Skip batches with less movement
};
```

## Cost Estimation

### Mapbox Pricing
- **Free tier**: 100,000 requests/month
- **After free tier**: $0.50 per 1,000 requests

### Optimization Strategies

1. **Batch efficiently**: Group 50 points per request (max 100)
2. **Skip idle periods**: Don't call API when vehicle hasn't moved
3. **Cache results**: Store matched coordinates to avoid re-processing
4. **Process by date**: Only process new data incrementally

### Example Cost Calculation

For 70,000 GPS points with 50 points/batch:
- Total batches: ~1,400
- Skipped (no movement): ~500 (WORKING/BREAK phases)
- API calls: ~900
- **Cost**: $0 (within free tier)

## Data Schema

### GPS Point (Raw)
```typescript
interface RawGPSPoint {
  timestamp: string;      // "2025-08-25 09:00:00"
  vehicle: string;        // "HR26DP0703"
  ward: string;           // "19"
  phase: 'TRAVEL' | 'WORKING' | 'BREAK';
  location_name: string;  // "Bhondsi"
  latitude: number;       // 28.4508
  longitude: number;      // 77.0656
}
```

### GPS Point (Matched)
```typescript
interface MatchedGPSPoint extends RawGPSPoint {
  raw_lat: number;        // Original latitude
  raw_lng: number;        // Original longitude
  matched_lat: number;    // Snapped latitude
  matched_lng: number;    // Snapped longitude
  confidence: number;     // 0-1 match confidence
  matched: boolean;       // Whether point was matched
}
```

### MongoDB Document
```javascript
{
  _id: ObjectId,
  vehicleId: "HR26DP0703",
  date: "2025-08-25",
  timestamp: ISODate("2025-08-25T09:00:00Z"),
  raw_lat: 28.4508,
  raw_lng: 77.0656,
  matched_lat: 28.4509,
  matched_lng: 77.0657,
  confidence: 0.95,
  matched: true,
  phase: "TRAVEL",
  location_name: "Bhondsi",
  ward: "19",
  createdAt: ISODate("2025-01-06T00:00:00Z")
}
```

## Frontend Integration

### Toggle Raw vs Snapped

The vehicle detail page includes a toggle to switch between:
- **Snapped**: Road-aligned coordinates (default)
- **Raw**: Original GPS coordinates

```typescript
const data = await getRouteData(vehicleId, date, { 
  useRawCoordinates: showRawCoordinates 
});
```

### Route Data Format

The `routes.json` file includes both coordinates:

```json
{
  "HR26DP0703": {
    "2025-08-25": {
      "points": [
        {
          "lat": 28.4509,           // matched (default)
          "lng": 77.0657,
          "raw_lat": 28.4508,       // original
          "raw_lng": 77.0656,
          "timestamp": "2025-08-25T09:00:00Z",
          "phase": "TRAVEL",
          "confidence": 0.95,
          "matched": true
        }
      ],
      "summary": {
        "totalDistance": 15.5,
        "drivingDuration": 42,
        "workingDuration": 480,
        "idleDuration": 60
      }
    }
  }
}
```

## Error Handling

### Low Confidence Matches
- If confidence < 0.5, a warning is logged
- Original coordinates are preserved as fallback

### API Errors
- On 4xx/5xx errors, raw coordinates are used
- Errors are logged but don't stop processing

### No Road Match
- Some points may not match to roads (off-road areas)
- These points keep their raw coordinates with `matched: false`

## Replacing Mapbox with OSRM

The service is designed to be modular. To use OSRM instead:

1. Create `lib/osrm-matching.ts` with same interface
2. Update import in processing script
3. Change API endpoint URL:
   ```
   http://your-osrm-server/match/v1/driving/{coords}
   ```

## Troubleshooting

### "Mapbox token not configured"
Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env`

### "No match found for batch"
- Points may be in an area without road data
- Try increasing the search radius (default: 25m)

### High API costs
- Increase `BATCH_SIZE` to reduce API calls
- Enable idle detection to skip stationary periods
- Process data incrementally instead of full re-runs
