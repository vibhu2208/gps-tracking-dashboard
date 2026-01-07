/**
 * Generate Realistic GPS Data for JCB HR38F6826 in Kadarpur, Ward 20
 * 
 * Generates CSV with GPS coordinates for a JCB operating strictly within Kadarpur
 * following the specified daily operation pattern.
 * Uses Mapbox Directions API to generate realistic road-following routes.
 */

const fs = require('fs');
const path = require('path');
// Try .env.local first, then .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && !process.env.MAPBOX_ACCESS_TOKEN) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

// Fixed Locations
const DEPOT = { lat: 28.387882, lng: 77.091767 };
const STREETS = [
  { id: 'S1', lat: 28.393138, lng: 77.092405, name: 'Street 1' },
  { id: 'S2', lat: 28.390365, lng: 77.091585, name: 'Street 2' },
  { id: 'S3', lat: 28.386860, lng: 77.093400, name: 'Street 3' },
  { id: 'S4', lat: 28.385439, lng: 77.096412, name: 'Street 4' },
  { id: 'S5', lat: 28.381727, lng: 77.091737, name: 'Street 5' },
  { id: 'S6', lat: 28.382639, lng: 77.097631, name: 'Street 6' },
];

// Configuration
const CONFIG = {
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN,
  VEHICLE: 'HR38F6826',
  WARD: '20',
  LOCATION: 'Kadarpur',
  START_DATE: new Date('2025-08-25'),
  END_DATE: new Date('2025-09-11'),
  WORK_START: 9, // 09:00
  WORK_END: 17,   // 17:00
  TRAVEL_START: 9 * 60 + 10, // 09:10 in minutes
  WORK_START_MIN: 9 * 60 + 20, // 09:20 in minutes
  WORK_END_MIN: 16 * 60 + 40, // 16:40 in minutes
  RETURN_START: 16 * 60 + 40, // 16:40 in minutes
  GPS_INTERVAL: 1, // 1 minute
  DELAY_BETWEEN_REQUESTS: 200, // ms
  MAX_RETRIES: 3,
};

// Route cache to avoid duplicate API calls
const routeCache = new Map();
const workingRouteCache = new Map();

/**
 * Calculate distance between two points (Haversine)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get driving directions from Mapbox API
 */
async function getDirections(start, end, retries = CONFIG.MAX_RETRIES) {
  const cacheKey = `${start.lat.toFixed(6)},${start.lng.toFixed(6)}-${end.lat.toFixed(6)},${end.lng.toFixed(6)}`;
  
  if (routeCache.has(cacheKey)) {
    return { success: true, route: routeCache.get(cacheKey), cached: true };
  }

  if (!CONFIG.MAPBOX_TOKEN) {
    return { success: false, route: null, error: 'No Mapbox token' };
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?` +
    `access_token=${CONFIG.MAPBOX_TOKEN}&` +
    `geometries=geojson&` +
    `overview=full&` +
    `steps=false`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (attempt === retries) {
          console.warn(`⚠️  Mapbox API error: ${response.status}. Using straight-line interpolation.`);
          return { success: false, route: null, error: `API error: ${response.status}` };
        }
        await delay(1000 * attempt);
        continue;
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
          coordinates: data.routes[0].geometry.coordinates,
        };
        routeCache.set(cacheKey, route);
        return { success: true, route, cached: false };
      }

      return { success: false, route: null, error: 'No route found' };
    } catch (error) {
      if (attempt === retries) {
        console.warn(`⚠️  Fetch error: ${error.message}. Using straight-line interpolation.`);
        return { success: false, route: null, error: `Fetch error: ${error.message}` };
      }
      await delay(1000 * attempt);
    }
  }

  return { success: false, route: null, error: 'Max retries exceeded' };
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Interpolate between two points (fallback for straight-line)
 */
function interpolatePoint(start, end, progress) {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
}

/**
 * Generate points along a route using Mapbox directions or fallback to straight-line
 */
async function generateRoutePoints(start, end, numPoints) {
  const directionsResult = await getDirections(start, end);
  
  if (directionsResult.success && directionsResult.route) {
    // Use Mapbox route
    const coordinates = directionsResult.route.coordinates;
    if (!coordinates || coordinates.length < 2) {
      return generateStraightLinePoints(start, end, numPoints);
    }

    // Calculate cumulative distances
    const cumulativeDistances = [0];
    for (let i = 1; i < coordinates.length; i++) {
      const prev = { lat: coordinates[i - 1][1], lng: coordinates[i - 1][0] };
      const curr = { lat: coordinates[i][1], lng: coordinates[i][0] };
      const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      cumulativeDistances.push(cumulativeDistances[i - 1] + dist);
    }

    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
    const points = [];

    for (let i = 0; i <= numPoints; i++) {
      const progress = i / (numPoints || 1);
      const targetDistance = progress * totalDistance;

      // Find segment containing this distance
      let segmentIndex = 0;
      for (let j = 1; j < cumulativeDistances.length; j++) {
        if (cumulativeDistances[j] >= targetDistance) {
          segmentIndex = j - 1;
          break;
        }
        segmentIndex = j - 1;
      }

      // Interpolate within segment
      const segmentStart = cumulativeDistances[segmentIndex];
      const segmentEnd = cumulativeDistances[segmentIndex + 1] || segmentStart;
      const segmentLength = segmentEnd - segmentStart;

      let lat, lng;
      if (segmentLength > 0) {
        const segmentProgress = (targetDistance - segmentStart) / segmentLength;
        const startCoord = coordinates[segmentIndex];
        const endCoord = coordinates[segmentIndex + 1] || startCoord;
        lng = startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress;
        lat = startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress;
      } else {
        lng = coordinates[segmentIndex][0];
        lat = coordinates[segmentIndex][1];
      }

      points.push({ lat, lng });
    }

    return points;
  } else {
    // Fallback to straight-line
    return generateStraightLinePoints(start, end, numPoints);
  }
}

/**
 * Generate straight-line points (fallback)
 */
function generateStraightLinePoints(start, end, numPoints) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const progress = i / (numPoints || 1);
    const point = interpolatePoint(start, end, progress);
    points.push(point);
  }
  return points;
}

/**
 * Generate working points along roads near street center
 * Creates unique route pattern per day (different parts of street)
 * Uses Mapbox to get actual road routes and interpolates points along them
 * Points are evenly spaced along the route to follow roads properly
 */
async function generateWorkingPoints(streetCenter, numPoints, dayOffset = 0) {
  const points = [];
  
  // Create unique working area per day using dayOffset
  // This ensures different parts of street are worked on different days
  const baseRouteLength = 0.0012; // ~135 meters base length
  
  // Vary the working area based on day offset (different part of street each day)
  const dayVariation = (dayOffset % 4) / 4; // 0 to 0.75
  const routeLength = baseRouteLength * (0.8 + dayVariation * 0.4); // Vary length
  const routeOffset = (dayOffset % 3) * 0.0004; // Offset along street
  
  // Create simple start and end points for working along the street
  // Different parts of street each day
  const startPoint = { 
    lat: streetCenter.lat + routeOffset, 
    lng: streetCenter.lng - routeLength/2 
  };
  const endPoint = { 
    lat: streetCenter.lat + routeOffset, 
    lng: streetCenter.lng + routeLength/2 
  };
  
  // Create unique cache key per day/street combination
  const cacheKey = `${streetCenter.lat.toFixed(6)},${streetCenter.lng.toFixed(6)},${dayOffset}`;
  let routeCoordinates = workingRouteCache.get(cacheKey);
  
  // Get route from Mapbox if not cached
  if (!routeCoordinates && CONFIG.MAPBOX_TOKEN) {
    const directionsResult = await getDirections(startPoint, endPoint);
    
    if (directionsResult.success && directionsResult.route) {
      routeCoordinates = directionsResult.route.coordinates;
      workingRouteCache.set(cacheKey, routeCoordinates);
    }
    
    // Small delay to avoid rate limiting
    await delay(100);
  }
  
  // Generate points along the route using proper interpolation
  if (routeCoordinates && routeCoordinates.length > 0) {
    // Calculate cumulative distances along the route
    const cumulativeDistances = [0];
    for (let i = 1; i < routeCoordinates.length; i++) {
      const prev = { lat: routeCoordinates[i - 1][1], lng: routeCoordinates[i - 1][0] };
      const curr = { lat: routeCoordinates[i][1], lng: routeCoordinates[i][0] };
      const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      cumulativeDistances.push(cumulativeDistances[i - 1] + dist);
    }
    
    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
    
    if (totalDistance > 0) {
      // Divide route into 3-5 progressive sections
      const numSections = Math.min(5, Math.max(3, Math.floor(numPoints / 100) + 1));
      const pointsPerSection = Math.floor(numPoints / numSections);
      
      // Generate points for each section progressively
      for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
        // Section boundaries (progressive: Section 1: 0-33%, Section 2: 33-66%, etc.)
        const sectionStartProgress = sectionIdx / numSections;
        const sectionEndProgress = (sectionIdx + 1) / numSections;
        const sectionStartDistance = sectionStartProgress * totalDistance;
        const sectionEndDistance = sectionEndProgress * totalDistance;
        const sectionDistance = sectionEndDistance - sectionStartDistance;
        
        // Points for this section (last section gets remaining points)
        const sectionPoints = (sectionIdx === numSections - 1) 
          ? numPoints - (sectionIdx * pointsPerSection)
          : pointsPerSection;
        
        // Within each section: back-and-forth pattern
        const cycleLength = Math.max(15, Math.floor(sectionPoints / 3)); // Points per direction within section
        
        for (let i = 0; i < sectionPoints; i++) {
          // Back and forth pattern within this section
          const cycle = Math.floor(i / cycleLength) % 2;
          const positionInCycle = (i % cycleLength) / cycleLength;
          
          // Alternate direction: even cycles go forward, odd go backward (within section boundaries)
          const sectionProgress = cycle === 0 ? positionInCycle : (1 - positionInCycle);
          
          // Map section progress to overall route distance
          const targetDistance = sectionStartDistance + (sectionProgress * sectionDistance);
          
          // Find the segment containing this distance
          let segmentIndex = 0;
          for (let j = 1; j < cumulativeDistances.length; j++) {
            if (cumulativeDistances[j] >= targetDistance) {
              segmentIndex = j - 1;
              break;
            }
            segmentIndex = j - 1;
          }
          
          // Interpolate within the segment
          const segmentStart = cumulativeDistances[segmentIndex];
          const segmentEnd = cumulativeDistances[segmentIndex + 1] || segmentStart;
          const segmentLength = segmentEnd - segmentStart;
          
          let lat, lng;
          if (segmentLength > 0) {
            const segmentProgress = (targetDistance - segmentStart) / segmentLength;
            const startCoord = routeCoordinates[segmentIndex];
            const endCoord = routeCoordinates[segmentIndex + 1] || startCoord;
            lng = startCoord[0] + (endCoord[0] - startCoord[0]) * segmentProgress;
            lat = startCoord[1] + (endCoord[1] - startCoord[1]) * segmentProgress;
          } else {
            lng = routeCoordinates[segmentIndex][0];
            lat = routeCoordinates[segmentIndex][1];
          }
          
          // Add realistic GPS tracking variations (zig-zag pattern) to working points
          // This simulates real GPS accuracy limitations and makes the data dynamic
          const pointIndex = points.length;
          if (pointIndex > 0 && pointIndex < numPoints - 1) {
            // Calculate route direction for perpendicular offset
            const prevPoint = pointIndex > 0 ? points[pointIndex - 1] : { lat, lng };
            const nextPoint = { lat, lng }; // Will be calculated next, use current as approximation
            
            // Calculate route angle
            const routeAngle = Math.atan2(
              lat - prevPoint.lat,
              (lng - prevPoint.lng) * Math.cos(lat * Math.PI / 180)
            );
            
            // Create zig-zag pattern (alternating left-right)
            const zigZagDirection = (pointIndex % 2 === 0) ? 1 : -1;
            
            // Add small GPS variation (0.5-1.5 meters) perpendicular to route
            const variationMeters = 0.5 + Math.random() * 1.0; // 0.5-1.5 meters
            const variationDegrees = variationMeters / 111000; // Convert to degrees
            
            // Perpendicular angle with reduced variation
            const perpAngle = routeAngle + (Math.PI / 2) + (zigZagDirection * (Math.PI / 12));
            
            const latOffset = Math.cos(perpAngle) * variationDegrees;
            const lngOffset = Math.sin(perpAngle) * variationDegrees * Math.cos(lat * Math.PI / 180);
            
            lat += latOffset;
            lng += lngOffset;
          }
          
          points.push({ lat, lng });
        }
      }
    } else {
      // If route has no distance, use start point
      for (let i = 0; i < numPoints; i++) {
        points.push({ lat: startPoint.lat, lng: startPoint.lng });
      }
    }
  } else {
    // Fallback: use generateRoutePoints which handles straight-line properly
    const routePoints = await generateRoutePoints(startPoint, endPoint, Math.floor(numPoints / 2));
    
    if (routePoints.length > 0) {
      // Divide route into 3-5 progressive sections
      const numSections = Math.min(5, Math.max(3, Math.floor(numPoints / 100) + 1));
      const pointsPerSection = Math.floor(numPoints / numSections);
      
      // Generate points for each section progressively
      for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
        // Section boundaries (progressive: Section 1: 0-33%, Section 2: 33-66%, etc.)
        const sectionStartProgress = sectionIdx / numSections;
        const sectionEndProgress = (sectionIdx + 1) / numSections;
        
        // Points for this section (last section gets remaining points)
        const sectionPoints = (sectionIdx === numSections - 1) 
          ? numPoints - (sectionIdx * pointsPerSection)
          : pointsPerSection;
        
        // Within each section: back-and-forth pattern
        const cycleLength = Math.max(15, Math.floor(sectionPoints / 3));
        
        for (let i = 0; i < sectionPoints; i++) {
          // Back and forth pattern within this section
          const cycle = Math.floor(i / cycleLength) % 2;
          const positionInCycle = (i % cycleLength) / cycleLength;
          
          // Alternate direction: even cycles go forward, odd go backward (within section boundaries)
          const sectionProgress = cycle === 0 ? positionInCycle : (1 - positionInCycle);
          
          // Map section progress to route points
          const overallProgress = sectionStartProgress + (sectionProgress * (sectionEndProgress - sectionStartProgress));
          const index = Math.floor(overallProgress * (routePoints.length - 1));
          
          let point = routePoints[index] || startPoint;
          
          // Add realistic GPS tracking variations (zig-zag pattern) to working points
          const pointIndex = points.length;
          if (pointIndex > 0 && pointIndex < numPoints - 1 && routePoints.length > 1) {
            // Calculate route direction
            const prevIndex = Math.max(0, index - 1);
            const nextIndex = Math.min(routePoints.length - 1, index + 1);
            const prevPoint = routePoints[prevIndex];
            const nextPoint = routePoints[nextIndex];
            
            const routeAngle = Math.atan2(
              nextPoint.lat - prevPoint.lat,
              (nextPoint.lng - prevPoint.lng) * Math.cos(point.lat * Math.PI / 180)
            );
            
            // Create zig-zag pattern (alternating left-right)
            const zigZagDirection = (pointIndex % 2 === 0) ? 1 : -1;
            
            // Add small GPS variation (0.5-1.5 meters) perpendicular to route
            const variationMeters = 0.5 + Math.random() * 1.0; // 0.5-1.5 meters
            const variationDegrees = variationMeters / 111000; // Convert to degrees
            
            // Perpendicular angle with reduced variation
            const perpAngle = routeAngle + (Math.PI / 2) + (zigZagDirection * (Math.PI / 12));
            
            const latOffset = Math.cos(perpAngle) * variationDegrees;
            const lngOffset = Math.sin(perpAngle) * variationDegrees * Math.cos(point.lat * Math.PI / 180);
            
            point = {
              lat: point.lat + latOffset,
              lng: point.lng + lngOffset
            };
          }
          
          points.push(point);
        }
      }
    } else {
      // If no route points, use start point
      for (let i = 0; i < numPoints; i++) {
        points.push({ lat: startPoint.lat, lng: startPoint.lng });
      }
    }
  }
  
  return points;
}

/**
 * Generate break points (vehicle stays at same location during break)
 * Uses the current location (last working point) instead of random location
 */
function generateBreakPoints(currentLocation, numPoints) {
  const points = [];
  // During break, vehicle stays at the current location (where break started)
  for (let i = 0; i < numPoints; i++) {
    points.push({ lat: currentLocation.lat, lng: currentLocation.lng });
  }
  
  return points;
}

/**
 * Format date as YYYY-MM-DD HH:MM:SS
 */
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate random time within range (human-like variation)
 */
function randomTime(baseHour, baseMinute, variationMinutes = 15) {
  const totalMinutes = baseHour * 60 + baseMinute;
  const variation = Math.floor((Math.random() - 0.5) * variationMinutes * 2);
  const randomMinutes = totalMinutes + variation;
  return {
    hour: Math.floor(randomMinutes / 60),
    minute: randomMinutes % 60
  };
}

/**
 * Generate GPS data for a single day
 */
async function generateDayData(date, street, dayOffset = 0) {
  const rows = [];
  
  // Randomize start time (08:45 to 09:15)
  const startTimeRandom = randomTime(9, 0, 15);
  const startTime = new Date(date);
  startTime.setHours(startTimeRandom.hour, startTimeRandom.minute, 0, 0);
  
  rows.push({
    timestamp: formatTimestamp(startTime),
    vehicle: CONFIG.VEHICLE,
    ward: CONFIG.WARD,
    phase: 'TRAVEL_OUT',
    location_name: CONFIG.LOCATION,
    latitude: DEPOT.lat,
    longitude: DEPOT.lng,
  });
  
  // Travel from depot to street (randomized: 15-25 minutes after start)
  const travelDurationMinutes = 15 + Math.floor(Math.random() * 10); // 15-25 minutes
  const travelStart = new Date(startTime);
  travelStart.setMinutes(travelStart.getMinutes() + 1);
  
  const travelEnd = new Date(startTime);
  travelEnd.setMinutes(travelEnd.getMinutes() + travelDurationMinutes);
  
  const travelPoints = await generateRoutePoints(DEPOT, street, travelDurationMinutes);
  
  // Add delay between API calls
  if (CONFIG.MAPBOX_TOKEN) {
    await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
  }
  
  for (let i = 0; i < travelPoints.length; i++) {
    const pointTime = new Date(travelStart);
    pointTime.setMinutes(pointTime.getMinutes() + i);
    
    rows.push({
      timestamp: formatTimestamp(pointTime),
      vehicle: CONFIG.VEHICLE,
      ward: CONFIG.WARD,
      phase: 'TRAVEL_OUT',
      location_name: CONFIG.LOCATION,
      latitude: travelPoints[i].lat,
      longitude: travelPoints[i].lng,
    });
  }
  
  // Work at street with randomized breaks
  const workStart = new Date(travelEnd);
  
  // Randomize work end time (16:30 to 17:00)
  const endTimeRandom = randomTime(16, 45, 15);
  const workEnd = new Date(date);
  workEnd.setHours(endTimeRandom.hour, endTimeRandom.minute, 0, 0);
  
  // Define 2-3 randomized break periods
  const break1Time = randomTime(10, 45, 20); // ~11:00 ±20 min
  const break2Time = randomTime(12, 30, 30); // ~12:30 ±30 min (lunch)
  const break3Time = randomTime(14, 45, 20); // ~15:00 ±20 min
  
  const breaks = [
    { 
      start: break1Time, 
      duration: 10 + Math.floor(Math.random() * 10) // 10-20 min
    },
    { 
      start: break2Time, 
      duration: 25 + Math.floor(Math.random() * 15) // 25-40 min (lunch)
    },
    { 
      start: break3Time, 
      duration: 10 + Math.floor(Math.random() * 10) // 10-20 min
    },
  ];
  
  // Sort breaks by time
  breaks.sort((a, b) => {
    const timeA = a.start.hour * 60 + a.start.minute;
    const timeB = b.start.hour * 60 + b.start.minute;
    return timeA - timeB;
  });
  
  // Remove breaks that are too close to work start/end
  const workStartMinutes = workStart.getHours() * 60 + workStart.getMinutes();
  const workEndMinutes = workEnd.getHours() * 60 + workEnd.getMinutes();
  const validBreaks = breaks.filter(breakItem => {
    const breakStartMinutes = breakItem.start.hour * 60 + breakItem.start.minute;
    return breakStartMinutes > workStartMinutes + 30 && 
           breakStartMinutes < workEndMinutes - 30;
  });
  
  // Use 2-3 breaks randomly
  const numBreaks = 2 + Math.floor(Math.random() * 2); // 2 or 3 breaks
  const selectedBreaks = validBreaks.slice(0, Math.min(numBreaks, validBreaks.length));
  
  // Calculate total working time (excluding breaks)
  const totalWorkDuration = (workEnd - workStart) / (1000 * 60);
  const totalBreakDuration = selectedBreaks.reduce((sum, b) => sum + b.duration, 0);
  const totalWorkingMinutes = Math.floor(totalWorkDuration - totalBreakDuration);
  
  // Generate ALL working points for the entire day as one continuous sequence
  // This ensures smooth path following without jumps between work periods
  const allWorkPoints = await generateWorkingPoints(street, totalWorkingMinutes, dayOffset);
  
  // Now distribute these points across work periods (between breaks)
  let workPointIndex = 0;
  let currentTime = new Date(workStart);
  
  for (let breakIdx = 0; breakIdx <= selectedBreaks.length; breakIdx++) {
    let periodEnd;
    
    if (breakIdx < selectedBreaks.length) {
      // Period ends at break start
      periodEnd = new Date(date);
      periodEnd.setHours(selectedBreaks[breakIdx].start.hour, selectedBreaks[breakIdx].start.minute, 0, 0);
    } else {
      // Last period ends at work end
      periodEnd = new Date(workEnd);
    }
    
    // Calculate points for this work period
    const periodDuration = (periodEnd - currentTime) / (1000 * 60); // minutes
    if (periodDuration > 0) {
      const pointsForPeriod = Math.floor(periodDuration);
      
      for (let i = 0; i < pointsForPeriod && workPointIndex < allWorkPoints.length; i++) {
        const pointTime = new Date(currentTime);
        pointTime.setMinutes(pointTime.getMinutes() + i);
        
        rows.push({
          timestamp: formatTimestamp(pointTime),
          vehicle: CONFIG.VEHICLE,
          ward: CONFIG.WARD,
          phase: 'WORKING',
          location_name: `${CONFIG.LOCATION} - ${street.name}`,
          latitude: allWorkPoints[workPointIndex].lat,
          longitude: allWorkPoints[workPointIndex].lng,
        });
        
        workPointIndex++;
      }
      
      currentTime = new Date(periodEnd);
    }
    
    // Add break if not the last iteration
    if (breakIdx < selectedBreaks.length) {
      const breakStart = new Date(date);
      breakStart.setHours(selectedBreaks[breakIdx].start.hour, selectedBreaks[breakIdx].start.minute, 0, 0);
      
      const breakEnd = new Date(breakStart);
      breakEnd.setMinutes(breakEnd.getMinutes() + selectedBreaks[breakIdx].duration);
      
      const breakDuration = selectedBreaks[breakIdx].duration;
      
      // Get the last working point location (where break starts)
      const lastWorkingPoint = workPointIndex > 0 
        ? allWorkPoints[workPointIndex - 1] 
        : (allWorkPoints.length > 0 ? allWorkPoints[0] : { lat: street.lat, lng: street.lng });
      
      const breakPoints = generateBreakPoints(lastWorkingPoint, breakDuration);
      
      for (let i = 0; i < breakPoints.length; i++) {
        const pointTime = new Date(breakStart);
        pointTime.setMinutes(pointTime.getMinutes() + i);
        
        rows.push({
          timestamp: formatTimestamp(pointTime),
          vehicle: CONFIG.VEHICLE,
          ward: CONFIG.WARD,
          phase: 'BREAK',
          location_name: `${CONFIG.LOCATION} - ${street.name}`,
          latitude: breakPoints[i].lat,
          longitude: breakPoints[i].lng,
        });
      }
      
      currentTime = new Date(breakEnd);
    }
  }
  
  // Return to depot (randomized: 15-25 minutes)
  const returnStart = new Date(workEnd);
  const returnDurationMinutes = 15 + Math.floor(Math.random() * 10); // 15-25 minutes
  const returnEnd = new Date(returnStart);
  returnEnd.setMinutes(returnEnd.getMinutes() + returnDurationMinutes);
  const returnPoints = await generateRoutePoints(street, DEPOT, returnDurationMinutes);
  
  // Add delay between API calls
  if (CONFIG.MAPBOX_TOKEN) {
    await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
  }
  
  for (let i = 0; i < returnPoints.length; i++) {
    const pointTime = new Date(returnStart);
    pointTime.setMinutes(pointTime.getMinutes() + i);
    
    rows.push({
      timestamp: formatTimestamp(pointTime),
      vehicle: CONFIG.VEHICLE,
      ward: CONFIG.WARD,
      phase: 'TRAVEL_BACK',
      location_name: CONFIG.LOCATION,
      latitude: returnPoints[i].lat,
      longitude: returnPoints[i].lng,
    });
  }
  
  // End at depot
  rows.push({
    timestamp: formatTimestamp(returnEnd),
    vehicle: CONFIG.VEHICLE,
    ward: CONFIG.WARD,
    phase: 'TRAVEL_BACK',
    location_name: CONFIG.LOCATION,
    latitude: DEPOT.lat,
    longitude: DEPOT.lng,
  });
  
  return rows;
}

/**
 * Main function to generate all data
 */
async function generateAllData() {
  const allRows = [];
  const startDate = new Date(CONFIG.START_DATE);
  const endDate = new Date(CONFIG.END_DATE);
  
  // Calculate total days
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Create street assignment plan to ensure all streets are used and not repeated unnecessarily
  const streetPlan = [];
  const streetsPerDay = Math.ceil(totalDays / STREETS.length);
  
  // Distribute streets evenly
  for (let i = 0; i < totalDays; i++) {
    const streetIndex = Math.floor(i / streetsPerDay) % STREETS.length;
    streetPlan.push(streetIndex);
  }
  
  // Shuffle to make it more natural (but keep some continuity)
  for (let i = 0; i < streetPlan.length - 1; i++) {
    // Occasionally switch streets (30% chance)
    if (Math.random() < 0.3 && i > 0) {
      const newStreet = Math.floor(Math.random() * STREETS.length);
      streetPlan[i] = newStreet;
    }
  }
  
  let currentDate = new Date(startDate);
  let dayCount = 0;
  
  while (currentDate <= endDate) {
    dayCount++;
    const streetIndex = streetPlan[dayCount - 1];
    const street = STREETS[streetIndex];
    
    // Calculate day offset for unique working patterns
    const dayOffset = dayCount - 1;
    
    console.log(`📅 Processing ${formatTimestamp(currentDate).split(' ')[0]} (${dayCount}/${totalDays}) - ${street.name}...`);
    
    const dayRows = await generateDayData(currentDate, street, dayOffset);
    allRows.push(...dayRows);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return allRows;
}

/**
 * Write CSV file
 */
function writeCSV(rows, outputPath) {
  const header = 'timestamp,vehicle,ward,phase,location_name,latitude,longitude\n';
  const csvRows = rows.map(row => 
    `${row.timestamp},${row.vehicle},${row.ward},${row.phase},${row.location_name},${row.latitude.toFixed(6)},${row.longitude.toFixed(6)}`
  );
  
  const csv = header + csvRows.join('\n');
  fs.writeFileSync(outputPath, csv, 'utf8');
  
  console.log(`✅ Generated ${rows.length} GPS points`);
  console.log(`📁 Saved to: ${outputPath}`);
}

// Main execution
async function main() {
  const outputPath = path.join(__dirname, '../data/kadarpur_hr38f6826_aug25_sep11_2025.csv');

  console.log('🚀 Generating GPS data for JCB HR38F6826 in Kadarpur...');
  console.log(`📅 Date range: ${CONFIG.START_DATE.toISOString().split('T')[0]} to ${CONFIG.END_DATE.toISOString().split('T')[0]}`);
  console.log(`📍 Location: ${CONFIG.LOCATION}, Ward ${CONFIG.WARD}`);
  console.log(`🏭 Depot: ${DEPOT.lat}, ${DEPOT.lng}`);
  console.log(`🛣️  Working streets: ${STREETS.length}`);
  
  if (CONFIG.MAPBOX_TOKEN) {
    console.log('✅ Using Mapbox Directions API for realistic routes');
  } else {
    console.log('⚠️  No Mapbox token found. Using straight-line interpolation.');
    console.log('   Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local for realistic routes.');
  }
  console.log('');

  const rows = await generateAllData();
  writeCSV(rows, outputPath);

  console.log(`\n📊 Travel route cache: ${routeCache.size} unique routes`);
  console.log(`📊 Working route cache: ${workingRouteCache.size} unique routes`);
  console.log('✨ Generation complete!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

