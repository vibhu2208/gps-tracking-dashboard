# GPS Tracking Dashboard - Implementation Documentation

## Date: January 8, 2025

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features Implemented](#features-implemented)
3. [File Structure and Changes](#file-structure-and-changes)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Technical Implementation Details](#technical-implementation-details)
6. [Configuration and Setup](#configuration-and-setup)

---

## Project Overview

### Purpose
This project is a GPS tracking dashboard for monitoring JCB (excavator) vehicles operating in Kadarpur, Haryana. The system generates realistic GPS tracking data, visualizes routes on interactive maps, and provides detailed route history with playback functionality.

### Technology Stack
- **Frontend**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Mapbox GL JS
- **Icons**: Lucide React
- **Data Processing**: Node.js scripts

---

## Features Implemented

### 1. Realistic GPS Data Generation
**Why**: Generate realistic GPS tracking data for a JCB vehicle operating in Kadarpur, Haryana with specific operational patterns.

**What**: 
- Daily operational schedule (09:00 - 17:00 IST)
- Progressive section-based working pattern
- Realistic GPS tracking variations (zig-zag pattern)
- Street rotation logic (2-3 days per street)
- Randomized break periods (2-3 breaks per day)

**How**: 
- Script: `scripts/generate-kadarpur-gps.js`
- Uses Mapbox Directions API for road-following routes
- Implements progressive section-based working (forward movement between sections, back-and-forth within sections)
- Adds GPS tracking noise (0.5-1.5m variations) to simulate real GPS accuracy

### 2. Progressive Section-Based Working Pattern
**Why**: Make the JCB working pattern more realistic - like a real driver who works on one section, completes it, then moves forward to the next section.

**What**:
- Route divided into 3-5 progressive sections
- Within each section: back-and-forth movement allowed
- Between sections: only forward progression (never goes back)
- Each section represents a portion of the street

**How**:
- File: `scripts/generate-kadarpur-gps.js` (lines 279-340)
- Function: `generateWorkingPoints()`
- Divides route into sections based on working duration
- Generates points with back-and-forth pattern within section boundaries
- Progresses forward through sections sequentially

### 3. GPS Tracking Variations (Zig-Zag Pattern)
**Why**: Simulate real GPS tracking data which has slight variations due to GPS accuracy limitations.

**What**:
- Small random variations (0.5-1.5 meters) perpendicular to route
- Alternating left-right pattern (zig-zag)
- Variations baked into CSV data (not generated on-the-fly)

**How**:
- File: `scripts/generate-kadarpur-gps.js` (lines 338-356, 382-400)
- Applied during point generation in `generateWorkingPoints()`
- Calculates perpendicular direction to route
- Adds variations based on route angle
- Variations stored directly in CSV coordinates

### 4. Route Visualization with All Traces
**Why**: Show all vehicle movements (forward and backward) as visible lines on the map, not just sequential connections.

**What**:
- Individual line segments for each consecutive point pair
- All traces visible (forward and backward movements)
- Lines follow roads using Mapbox Directions API
- Removed orange stop markers for cleaner visualization

**How**:
- File: `components/EnhancedMap.tsx` (lines 122-195)
- Creates individual LineString segments for each point pair
- Uses Mapbox Directions API to get road-following routes
- Applies map matching for segments longer than 5 meters
- Each segment rendered as separate layer

### 5. Break Location Fix
**Why**: Breaks should occur at the current working location, not jump to random locations.

**What**:
- Break points use the last working point's location
- No location jumps during breaks
- Vehicle stays at current position during breaks

**How**:
- File: `scripts/generate-kadarpur-gps.js` (lines 427-430, 595-600)
- Function: `generateBreakPoints()` modified to accept current location
- Gets last working point before break starts
- All break points use same location as last working point

### 6. JCB Icon for Playback
**Why**: Replace generic car icon with JCB-specific icon for better visual representation.

**What**:
- Custom JCB PNG icon used during route playback
- Orange/amber color scheme
- Pulsing animation effect

**How**:
- File: `components/EnhancedMap.tsx` (lines 244-270)
- Image: `public/jcb.png`
- Uses `<img>` tag with JCB PNG image
- White circular background with shadow for visibility

---

## File Structure and Changes

### Modified Files

#### 1. `scripts/generate-kadarpur-gps.js`
**Purpose**: Generate realistic GPS tracking data for JCB vehicle

**Key Functions**:
- `generateWorkingPoints()` (lines 225-394)
  - Creates progressive section-based working pattern
  - Adds GPS tracking variations (zig-zag)
  - Uses Mapbox Directions API for road-following routes
  
- `generateBreakPoints()` (lines 427-430)
  - Generates break points at current location
  - Accepts current location parameter instead of street center
  
- `generateDayData()` (lines 440-650)
  - Orchestrates daily schedule
  - Handles breaks and work periods
  - Generates continuous working points

**Key Changes**:
- Lines 279-340: Progressive section-based pattern implementation
- Lines 338-356: GPS variations added to working points
- Lines 427-430: Break points use current location
- Lines 595-600: Break location fix implementation

#### 2. `components/EnhancedMap.tsx`
**Purpose**: Interactive map visualization with route playback

**Key Functions**:
- Route rendering (lines 122-195)
  - Creates individual line segments for each point pair
  - Uses Mapbox Directions API for road-following routes
  - Applies map matching for realistic paths
  
- Playback marker (lines 244-270)
  - JCB icon display during playback
  - Pulsing animation effect
  - Popup with vehicle information

**Key Changes**:
- Lines 122-195: Individual segment rendering (replaced single LineString)
- Lines 164-181: Removed stop markers
- Lines 244-270: Replaced car icon with JCB PNG image
- Lines 89-104: Removed zig-zag generation (now in CSV data)

#### 3. `scripts/convert-kadarpur-to-routes.js`
**Purpose**: Convert CSV data to routes.json format for dashboard

**Key Functions**:
- `parseCSV()`: Reads and parses CSV file
- `calculateSpeed()`: Calculates speed between points
- `convertToRoutes()`: Converts to routes.json format

**Usage**: Run after generating CSV to update dashboard data

#### 4. `public/jcb.png`
**Purpose**: JCB icon image for map playback

**Location**: Copied from `docs/jcb.png` to `public/jcb.png`
**Usage**: Referenced in `EnhancedMap.tsx` as `/jcb.png`

### Data Files

#### 1. `data/kadarpur_hr38f6826_aug25_sep11_2025.csv`
**Purpose**: Raw GPS tracking data

**Format**:
```
timestamp,vehicle,ward,phase,location_name,latitude,longitude
2025-08-25 09:00:00,HR38F6826,20,TRAVEL_OUT,Kadarpur,28.387882,77.091767
```

**Phases**:
- `TRAVEL_OUT`: Travel from depot to working street
- `WORKING`: Working on street (with GPS variations)
- `BREAK`: Break period (at current location)
- `TRAVEL_BACK`: Return to depot

#### 2. `public/data/routes.json`
**Purpose**: Formatted route data for dashboard consumption

**Structure**:
```json
{
  "HR38F6826": {
    "2025-08-25": {
      "points": [
        {
          "lat": 28.387882,
          "lng": 77.091767,
          "timestamp": "2025-08-25T09:00:00Z",
          "speed": 15,
          "phase": "TRAVEL_OUT",
          "status": "TRAVEL_OUT"
        }
      ],
      "summary": {
        "totalDistance": 0,
        "drivingDuration": 0,
        "idleDuration": 0,
        "maxSpeed": 0
      }
    }
  }
}
```

---

## Data Flow Architecture

### 1. Data Generation Flow

```
generate-kadarpur-gps.js
    ↓
1. Load Configuration (depot, streets, dates)
    ↓
2. For each date:
    a. Select street (rotation logic)
    b. Generate travel route (depot → street)
    c. Generate working points (progressive sections with variations)
    d. Generate break points (at current location)
    e. Generate return route (street → depot)
    ↓
3. Write to CSV file
    ↓
data/kadarpur_hr38f6826_aug25_sep11_2025.csv
```

### 2. Data Conversion Flow

```
convert-kadarpur-to-routes.js
    ↓
1. Read CSV file
    ↓
2. Parse each row
    ↓
3. Calculate speeds and distances
    ↓
4. Group by vehicle and date
    ↓
5. Generate summary statistics
    ↓
6. Write to routes.json
    ↓
public/data/routes.json
```

### 3. Dashboard Display Flow

```
Dashboard Page (vehicles/[id]/page.tsx)
    ↓
1. Load route data from routes.json
    ↓
2. Pass points to EnhancedMap component
    ↓
EnhancedMap.tsx
    ↓
3. For each consecutive point pair:
    a. Get route from Mapbox Directions API
    b. Create LineString segment
    c. Add to map as layer
    ↓
4. Display JCB icon at current playback position
    ↓
5. Update on playback index change
```

### 4. Working Points Generation Flow

```
generateWorkingPoints(streetCenter, numPoints, dayOffset)
    ↓
1. Calculate unique working area (based on dayOffset)
    ↓
2. Get route from Mapbox (start → end)
    ↓
3. Divide route into 3-5 sections
    ↓
4. For each section:
    a. Calculate section boundaries (0-33%, 33-66%, etc.)
    b. Generate points with back-and-forth pattern
    c. Apply GPS variations (zig-zag)
    ↓
5. Return points array
```

### 5. GPS Variations Application Flow

```
For each working point:
    ↓
1. Calculate route direction (from previous point)
    ↓
2. Determine perpendicular angle
    ↓
3. Calculate zig-zag direction (alternating left-right)
    ↓
4. Apply variation (0.5-1.5 meters perpendicular)
    ↓
5. Update coordinates
    ↓
6. Store in CSV
```

---

## Technical Implementation Details

### 1. Progressive Section-Based Pattern

**Location**: `scripts/generate-kadarpur-gps.js`, lines 279-340

**Algorithm**:
```javascript
// Divide route into sections
const numSections = Math.min(5, Math.max(3, Math.floor(numPoints / 100) + 1));

for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
  // Section boundaries
  const sectionStartProgress = sectionIdx / numSections;
  const sectionEndProgress = (sectionIdx + 1) / numSections;
  
  // Back-and-forth within section
  const cycle = Math.floor(i / cycleLength) % 2;
  const sectionProgress = cycle === 0 ? positionInCycle : (1 - positionInCycle);
  
  // Map to route distance
  const targetDistance = sectionStartDistance + (sectionProgress * sectionDistance);
}
```

**Key Points**:
- Sections progress forward (0% → 33% → 66% → 100%)
- Within each section: back-and-forth movement
- Never goes back to previous sections

### 2. GPS Variations (Zig-Zag Pattern)

**Location**: `scripts/generate-kadarpur-gps.js`, lines 338-356

**Algorithm**:
```javascript
// Calculate route direction
const routeAngle = Math.atan2(
  lat - prevPoint.lat,
  (lng - prevPoint.lng) * Math.cos(lat * Math.PI / 180)
);

// Zig-zag direction (alternating)
const zigZagDirection = (pointIndex % 2 === 0) ? 1 : -1;

// Perpendicular angle with variation
const perpAngle = routeAngle + (Math.PI / 2) + (zigZagDirection * (Math.PI / 12));

// Apply variation (0.5-1.5 meters)
const variationMeters = 0.5 + Math.random() * 1.0;
const variationDegrees = variationMeters / 111000;

const latOffset = Math.cos(perpAngle) * variationDegrees;
const lngOffset = Math.sin(perpAngle) * variationDegrees * Math.cos(lat * Math.PI / 180);
```

**Key Points**:
- Variations are perpendicular to route direction
- Alternating left-right pattern
- Small variations (0.5-1.5m) for realism
- Baked into CSV data (not generated on-the-fly)

### 3. Individual Segment Rendering

**Location**: `components/EnhancedMap.tsx`, lines 122-195

**Algorithm**:
```javascript
for (let i = 0; i < points.length - 1; i++) {
  const startPoint = points[i];
  const endPoint = points[i + 1];
  
  // Get route from Mapbox Directions API
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/...`;
  
  // Create segment source
  map.addSource(`route-segment-${i}`, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: segmentCoordinates
      }
    }
  });
  
  // Add segment layer
  map.addLayer({
    id: `route-segment-${i}`,
    type: 'line',
    source: `route-segment-${i}`,
    paint: {
      'line-color': '#3B82F6',
      'line-width': 6,
      'line-opacity': 0.9
    }
  });
}
```

**Key Points**:
- Each segment is a separate layer
- All segments visible simultaneously
- Forward and backward movements both shown
- Uses Mapbox Directions API for road-following

### 4. Break Location Fix

**Location**: `scripts/generate-kadarpur-gps.js`, lines 427-430, 595-600

**Implementation**:
```javascript
// Modified function signature
function generateBreakPoints(currentLocation, numPoints) {
  // Use current location instead of random
  for (let i = 0; i < numPoints; i++) {
    points.push({ lat: currentLocation.lat, lng: currentLocation.lng });
  }
}

// In generateDayData()
const lastWorkingPoint = workPointIndex > 0 
  ? allWorkPoints[workPointIndex - 1] 
  : (allWorkPoints.length > 0 ? allWorkPoints[0] : { lat: street.lat, lng: street.lng });

const breakPoints = generateBreakPoints(lastWorkingPoint, breakDuration);
```

**Key Points**:
- Break points use last working point location
- No location jumps during breaks
- Consistent with real vehicle behavior

---

## Configuration and Setup

### Environment Variables

**File**: `.env.local` or `.env`

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**Usage**:
- Used in `scripts/generate-kadarpur-gps.js` for Mapbox Directions API
- Used in `components/EnhancedMap.tsx` for map rendering and route matching

### Street Coordinates

**File**: `scripts/generate-kadarpur-gps.js`, lines 20-27

```javascript
const STREETS = [
  { name: 'Street 1', lat: 28.393138, lng: 77.092405 },
  { name: 'Street 2', lat: 28.390365, lng: 77.091585 },
  { name: 'Street 3', lat: 28.386860, lng: 77.093400 },
  { name: 'Street 4', lat: 28.385439, lng: 77.096412 },
  { name: 'Street 5', lat: 28.381727, lng: 77.091737 },
  { name: 'Street 6', lat: 28.382639, lng: 77.097631 }
];
```

### Depot Location

**File**: `scripts/generate-kadarpur-gps.js`, line 19

```javascript
const DEPOT = { lat: 28.387882, lng: 77.091767 };
```

### Working Hours

**File**: `scripts/generate-kadarpur-gps.js`, lines 403-497

- Start time: Randomized 08:45 - 09:15
- End time: Randomized 16:30 - 17:00
- Breaks: 2-3 randomized breaks per day

---

## Running the System

### 1. Generate GPS Data

```bash
cd /Users/krishnaupadhyay/Desktop/tracker/gps-tracking-dashboard
node scripts/generate-kadarpur-gps.js
```

**Output**: `data/kadarpur_hr38f6826_aug25_sep11_2025.csv`

### 2. Convert to Routes Format

```bash
node scripts/convert-kadarpur-to-routes.js
```

**Output**: `public/data/routes.json`

### 3. Run Dashboard

```bash
npm run dev
```

**Access**: http://localhost:3000

---

## Key Design Decisions

### 1. Why Progressive Sections?
- **Realistic**: Real JCB drivers work on one section, complete it, then move forward
- **Visual**: Clear progression through work area
- **Logical**: Prevents confusing back-and-forth across entire route

### 2. Why GPS Variations in CSV?
- **Consistency**: Same pattern every time data is viewed
- **Realistic**: Simulates real GPS tracking accuracy limitations
- **Performance**: No on-the-fly calculations needed

### 3. Why Individual Segments?
- **Visibility**: All movements (forward and backward) are visible
- **Clarity**: Each movement is a separate line
- **Realism**: Shows actual path taken, not just sequential connection

### 4. Why Mapbox Directions API?
- **Accuracy**: Routes follow actual roads
- **Realism**: No straight-line jumps
- **Quality**: Professional-grade routing

---

## Future Enhancements

1. **Real-time Tracking**: Add WebSocket support for live tracking
2. **Multiple Vehicles**: Support for multiple JCB vehicles
3. **Analytics**: Add speed analysis, idle time tracking
4. **Export**: Enhanced Excel export with detailed statistics
5. **Alerts**: Speed alerts, geofence violations
6. **Historical Comparison**: Compare routes across different days

---

## Troubleshooting

### Issue: Routes not following roads
**Solution**: Check Mapbox token is set in `.env.local`

### Issue: Zig-zag pattern too intense
**Solution**: Adjust variation range in `generate-kadarpur-gps.js` (line 351)

### Issue: Break location jumps
**Solution**: Ensure `generateBreakPoints()` receives current location (line 600)

### Issue: JCB icon not showing
**Solution**: Verify `public/jcb.png` exists and path is correct

---

## Summary

This implementation creates a realistic GPS tracking system for JCB vehicles with:
- Progressive section-based working patterns
- Realistic GPS tracking variations
- Road-following routes using Mapbox
ā- Clean visualization with all traces visible
- JCB-specific icon for playback
- Consistent data generation and display

All features are integrated and working together to provide a comprehensive GPS tracking dashboard.

