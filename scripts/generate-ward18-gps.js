/**
 * Generate Realistic GPS Data for JCB HR26EW4731 in Ward 18
 * 
 * Generates CSV with GPS coordinates for a JCB operating across multiple localities
 * with random rotation between localities and streets, working 2-3 days consecutively
 * in each locality/street combination.
 * Uses Mapbox Directions API to generate realistic road-following routes.
 */

const fs = require('fs');
const path = require('path');
// Try .env.local first, then .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && !process.env.MAPBOX_ACCESS_TOKEN) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

// Localities with their depots and streets
const LOCALITIES = [
  {
    name: 'Dayanand Colony',
    depot: { lat: 28.47412877242752, lng: 77.02091658834189 },
    streets: [
      { id: 'S1', lat: 28.474498882392133, lng: 77.02033873837613, name: 'Street 1' },
      { id: 'S2', lat: 28.474741614193103, lng: 77.01978687049991, name: 'Street 2' },
      { id: 'S3', lat: 28.47430167947464, lng: 77.01954440293595, name: 'Street 3' },
      { id: 'S4', lat: 28.473820754948523, lng: 77.01920867861438, name: 'Street 4' },
      { id: 'S5', lat: 28.473135980864757, lng: 77.02070342686805, name: 'Street 5' },
      { id: 'S6', lat: 28.472242257984227, lng: 77.02313696585111, name: 'Street 6' },
      { id: 'S7', lat: 28.471807964332605, lng: 77.02299868380054, name: 'Street 7' },
    ]
  },
  {
    name: 'Ashok Puri',
    depot: { lat: 28.473167918418408, lng: 77.02264044813549 },
    streets: [
      { id: 'S1', lat: 28.47208114940716, lng: 77.02087044604599, name: 'Street 1' },
      { id: 'S2', lat: 28.472199494586384, lng: 77.02113874347866, name: 'Street 2' },
      { id: 'S3', lat: 28.47194820727614, lng: 77.02202715929239, name: 'Street 3' },
      { id: 'S4', lat: 28.473138121326027, lng: 77.02248678136188, name: 'Street 4' },
      { id: 'S5', lat: 28.47332042581226, lng: 77.02296602142714, name: 'Street 5' },
      { id: 'S6', lat: 28.472881909092372, lng: 77.02323787107417, name: 'Street 6' },
      { id: 'S7', lat: 28.471580161768482, lng: 77.02175406933338, name: 'Street 7' },
    ]
  },
  {
    name: 'Mahavir Pura',
    depot: { lat: 28.469469345926893, lng: 77.02496258336024 },
    streets: [
      { id: 'S1', lat: 28.470488182062027, lng: 77.0250847994533, name: 'Street 1' },
      { id: 'S2', lat: 28.469469594560703, lng: 77.02477366320846, name: 'Street 2' },
      { id: 'S3', lat: 28.468977475421998, lng: 77.02546338847682, name: 'Street 3' },
      { id: 'S4', lat: 28.469356984905968, lng: 77.02562332060585, name: 'Street 4' },
    ]
  },
  {
    name: 'Jawahar Nagar',
    depot: { lat: 28.46446870594227, lng: 77.02885741473166 },
    streets: [
      { id: 'S1', lat: 28.46598199872933, lng: 77.02739836879847, name: 'Street 1' },
      { id: 'S2', lat: 28.465396525191203, lng: 77.02647082113988, name: 'Street 2' },
      { id: 'S3', lat: 28.465984688852988, lng: 77.02613933727018, name: 'Street 3' },
      { id: 'S4', lat: 28.466567502342862, lng: 77.02703647249761, name: 'Street 4' },
      { id: 'S5', lat: 28.467056742381942, lng: 77.02656205522068, name: 'Street 5' },
      { id: 'S6', lat: 28.46532561785404, lng: 77.02766700137252, name: 'Street 6' },
    ]
  },
  {
    name: 'Subhash Nagar',
    depot: { lat: 28.467961437816648, lng: 77.02205510378629 },
    streets: [
      { id: 'S1', lat: 28.468423029786617, lng: 77.02391501056451, name: 'Street 1' },
      { id: 'S2', lat: 28.46853917003371, lng: 77.02432602476141, name: 'Street 2' },
      { id: 'S3', lat: 28.46716811114602, lng: 77.02298289632589, name: 'Street 3' },
      { id: 'S4', lat: 28.4677308245005, lng: 77.02542984825888, name: 'Street 4' },
      { id: 'S5', lat: 28.46444238955026, lng: 77.02347518646481, name: 'Street 5' },
      { id: 'S6', lat: 28.463906851433407, lng: 77.02384216143686, name: 'Street 6' },
      { id: 'S7', lat: 28.46359068910018, lng: 77.02324766197788, name: 'Street 7' },
    ]
  },
  {
    name: 'Prem Nagar',
    depot: { lat: 28.468639357981758, lng: 77.0362563018178 },
    streets: [
      { id: 'S1', lat: 28.46902787354673, lng: 77.03518400338533, name: 'Street 1' },
      { id: 'S2', lat: 28.468475941466334, lng: 77.03450684387467, name: 'Street 2' },
      { id: 'S3', lat: 28.46837187122948, lng: 77.03577243225233, name: 'Street 3' },
      { id: 'S4', lat: 28.467786350018223, lng: 77.03578445498174, name: 'Street 4' },
      { id: 'S5', lat: 28.467302288508932, lng: 77.03483706390072, name: 'Street 5' },
      { id: 'S6', lat: 28.46658374488699, lng: 77.03467747717124, name: 'Street 6' },
    ]
  },
  {
    name: 'NAI BASTI',
    depot: { lat: 28.460760951251604, lng: 77.02175016050151 },
    streets: [
      { id: 'S1', lat: 28.46011830448518, lng: 77.02265243337187, name: 'Street 1' },
      { id: 'S2', lat: 28.459687990209236, lng: 77.022734569761, name: 'Street 2' },
      { id: 'S3', lat: 28.460617879477905, lng: 77.02360957372886, name: 'Street 3' },
      { id: 'S4', lat: 28.460673878892724, lng: 77.02287034625475, name: 'Street 4' },
      { id: 'S5', lat: 28.46001071954111, lng: 77.02223396420597, name: 'Street 5' },
    ]
  },
  {
    name: 'pratap nagar',
    depot: { lat: 28.4648746706228, lng: 77.02107583915402 },
    streets: [
      { id: 'S1', lat: 28.464343541849658, lng: 77.0212128290625, name: 'Street 1' },
      { id: 'S2', lat: 28.4647239143059, lng: 77.02027804106883, name: 'Street 2' },
      { id: 'S3', lat: 28.463882910176704, lng: 77.02017021258341, name: 'Street 3' },
      { id: 'S4', lat: 28.46323877744549, lng: 77.02149794213716, name: 'Street 4' },
      { id: 'S5', lat: 28.462779690435532, lng: 77.02048486262336, name: 'Street 5' },
    ]
  },
  {
    name: 'Rattan Garden',
    depot: { lat: 28.4691504189515, lng: 77.01949372654398 },
    streets: [
      { id: 'S1', lat: 28.468904191855515, lng: 77.01960865663469, name: 'Street 1' },
      { id: 'S2', lat: 28.468430692563885, lng: 77.01881081834978, name: 'Street 2' },
      { id: 'S3', lat: 28.467853497932726, lng: 77.01862151262476, name: 'Street 3' },
      { id: 'S4', lat: 28.46741957658694, lng: 77.01874694034156, name: 'Street 4' },
      { id: 'S5', lat: 28.46769302818058, lng: 77.01983228059, name: 'Street 5' },
      { id: 'S6', lat: 28.467562274727317, lng: 77.02022509314963, name: 'Street 6' },
    ]
  },
  {
    name: 'Bhim Nagar',
    depot: { lat: 28.470401969689693, lng: 77.02120427195605 },
    streets: [
      { id: 'S1', lat: 28.472251415345994, lng: 77.01943919274532, name: 'Street 1' },
      { id: 'S2', lat: 28.47179193830884, lng: 77.02027465147577, name: 'Street 2' },
      { id: 'S3', lat: 28.47125936587641, lng: 77.0201270464293, name: 'Street 3' },
      { id: 'S4', lat: 28.471069245042212, lng: 77.02077916901695, name: 'Street 4' },
      { id: 'S5', lat: 28.470067970251637, lng: 77.02136902204867, name: 'Street 5' },
      { id: 'S6', lat: 28.470027882925432, lng: 77.02184133003257, name: 'Street 6' },
      { id: 'S7', lat: 28.469240450343396, lng: 77.02072407735977, name: 'Street 7' },
    ]
  },
];

// Configuration
const CONFIG = {
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN,
  VEHICLE: 'HR26ED7915',
  WARD: '31',
  START_DATE: new Date('2025-08-25'),
  END_DATE: new Date('2025-12-24'),
  WORK_START: 9, // 09:00
  WORK_END: 17,   // 17:00
  GPS_INTERVAL: 1, // 1 minute
  DELAY_BETWEEN_REQUESTS: 200, // ms
  MAX_RETRIES: 3,
  MIN_CONSECUTIVE_DAYS: 2, // Minimum days to work in same locality/street
  MAX_CONSECUTIVE_DAYS: 3, // Maximum days to work in same locality/street
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
 */
async function generateWorkingPoints(streetCenter, numPoints, dayOffset = 0) {
  const points = [];
  
  // Create unique working area per day using dayOffset
  const baseRouteLength = 0.0012; // ~135 meters base length
  
  // Vary the working area based on day offset (different part of street each day)
  const dayVariation = (dayOffset % 4) / 4; // 0 to 0.75
  const routeLength = baseRouteLength * (0.8 + dayVariation * 0.4); // Vary length
  const routeOffset = (dayOffset % 3) * 0.0004; // Offset along street
  
  // Create simple start and end points for working along the street
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
  
  // Generate points along the route
  if (routeCoordinates && routeCoordinates.length > 0) {
    const cumulativeDistances = [0];
    for (let i = 1; i < routeCoordinates.length; i++) {
      const prev = { lat: routeCoordinates[i - 1][1], lng: routeCoordinates[i - 1][0] };
      const curr = { lat: routeCoordinates[i][1], lng: routeCoordinates[i][0] };
      const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      cumulativeDistances.push(cumulativeDistances[i - 1] + dist);
    }
    
    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
    
    if (totalDistance > 0) {
      const numSections = Math.min(5, Math.max(3, Math.floor(numPoints / 100) + 1));
      const pointsPerSection = Math.floor(numPoints / numSections);
      
      for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
        const sectionStartProgress = sectionIdx / numSections;
        const sectionEndProgress = (sectionIdx + 1) / numSections;
        const sectionStartDistance = sectionStartProgress * totalDistance;
        const sectionEndDistance = sectionEndProgress * totalDistance;
        const sectionDistance = sectionEndDistance - sectionStartDistance;
        
        const sectionPoints = (sectionIdx === numSections - 1) 
          ? numPoints - (sectionIdx * pointsPerSection)
          : pointsPerSection;
        
        const cycleLength = Math.max(15, Math.floor(sectionPoints / 3));
        
        for (let i = 0; i < sectionPoints; i++) {
          const cycle = Math.floor(i / cycleLength) % 2;
          const positionInCycle = (i % cycleLength) / cycleLength;
          const sectionProgress = cycle === 0 ? positionInCycle : (1 - positionInCycle);
          const targetDistance = sectionStartDistance + (sectionProgress * sectionDistance);
          
          let segmentIndex = 0;
          for (let j = 1; j < cumulativeDistances.length; j++) {
            if (cumulativeDistances[j] >= targetDistance) {
              segmentIndex = j - 1;
              break;
            }
            segmentIndex = j - 1;
          }
          
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
          
          // Add GPS variation
          const pointIndex = points.length;
          if (pointIndex > 0 && pointIndex < numPoints - 1) {
            const prevPoint = pointIndex > 0 ? points[pointIndex - 1] : { lat, lng };
            const routeAngle = Math.atan2(
              lat - prevPoint.lat,
              (lng - prevPoint.lng) * Math.cos(lat * Math.PI / 180)
            );
            
            const zigZagDirection = (pointIndex % 2 === 0) ? 1 : -1;
            const variationMeters = 0.5 + Math.random() * 1.0;
            const variationDegrees = variationMeters / 111000;
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
      for (let i = 0; i < numPoints; i++) {
        points.push({ lat: startPoint.lat, lng: startPoint.lng });
      }
    }
  } else {
    const routePoints = await generateRoutePoints(startPoint, endPoint, Math.floor(numPoints / 2));
    
    if (routePoints.length > 0) {
      const numSections = Math.min(5, Math.max(3, Math.floor(numPoints / 100) + 1));
      const pointsPerSection = Math.floor(numPoints / numSections);
      
      for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
        const sectionStartProgress = sectionIdx / numSections;
        const sectionEndProgress = (sectionIdx + 1) / numSections;
        
        const sectionPoints = (sectionIdx === numSections - 1) 
          ? numPoints - (sectionIdx * pointsPerSection)
          : pointsPerSection;
        
        const cycleLength = Math.max(15, Math.floor(sectionPoints / 3));
        
        for (let i = 0; i < sectionPoints; i++) {
          const cycle = Math.floor(i / cycleLength) % 2;
          const positionInCycle = (i % cycleLength) / cycleLength;
          const sectionProgress = cycle === 0 ? positionInCycle : (1 - positionInCycle);
          const overallProgress = sectionStartProgress + (sectionProgress * (sectionEndProgress - sectionStartProgress));
          const index = Math.floor(overallProgress * (routePoints.length - 1));
          
          let point = routePoints[index] || startPoint;
          
          const pointIndex = points.length;
          if (pointIndex > 0 && pointIndex < numPoints - 1 && routePoints.length > 1) {
            const prevIndex = Math.max(0, index - 1);
            const nextIndex = Math.min(routePoints.length - 1, index + 1);
            const prevPoint = routePoints[prevIndex];
            const nextPoint = routePoints[nextIndex];
            
            const routeAngle = Math.atan2(
              nextPoint.lat - prevPoint.lat,
              (nextPoint.lng - prevPoint.lng) * Math.cos(point.lat * Math.PI / 180)
            );
            
            const zigZagDirection = (pointIndex % 2 === 0) ? 1 : -1;
            const variationMeters = 0.5 + Math.random() * 1.0;
            const variationDegrees = variationMeters / 111000;
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
      for (let i = 0; i < numPoints; i++) {
        points.push({ lat: startPoint.lat, lng: startPoint.lng });
      }
    }
  }
  
  return points;
}

/**
 * Generate break points (vehicle stays at same location during break)
 */
function generateBreakPoints(currentLocation, numPoints) {
  const points = [];
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
async function generateDayData(date, locality, street, dayOffset = 0) {
  const rows = [];
  const depot = locality.depot;
  
  // Randomize start time (08:45 to 09:15)
  const startTimeRandom = randomTime(9, 0, 15);
  const startTime = new Date(date);
  startTime.setHours(startTimeRandom.hour, startTimeRandom.minute, 0, 0);
  
  rows.push({
    timestamp: formatTimestamp(startTime),
    vehicle: CONFIG.VEHICLE,
    ward: CONFIG.WARD,
    phase: 'TRAVEL_OUT',
    location_name: locality.name,
    latitude: depot.lat,
    longitude: depot.lng,
  });
  
  // Travel from depot to street
  const travelDurationMinutes = 15 + Math.floor(Math.random() * 10);
  const travelStart = new Date(startTime);
  travelStart.setMinutes(travelStart.getMinutes() + 1);
  
  const travelEnd = new Date(startTime);
  travelEnd.setMinutes(travelEnd.getMinutes() + travelDurationMinutes);
  
  const travelPoints = await generateRoutePoints(depot, street, travelDurationMinutes);
  
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
      location_name: locality.name,
      latitude: travelPoints[i].lat,
      longitude: travelPoints[i].lng,
    });
  }
  
  // Work at street with randomized breaks
  const workStart = new Date(travelEnd);
  
  const endTimeRandom = randomTime(16, 45, 15);
  const workEnd = new Date(date);
  workEnd.setHours(endTimeRandom.hour, endTimeRandom.minute, 0, 0);
  
  const break1Time = randomTime(10, 45, 20);
  const break2Time = randomTime(12, 30, 30);
  const break3Time = randomTime(14, 45, 20);
  
  const breaks = [
    { start: break1Time, duration: 10 + Math.floor(Math.random() * 10) },
    { start: break2Time, duration: 25 + Math.floor(Math.random() * 15) },
    { start: break3Time, duration: 10 + Math.floor(Math.random() * 10) },
  ];
  
  breaks.sort((a, b) => {
    const timeA = a.start.hour * 60 + a.start.minute;
    const timeB = b.start.hour * 60 + b.start.minute;
    return timeA - timeB;
  });
  
  const workStartMinutes = workStart.getHours() * 60 + workStart.getMinutes();
  const workEndMinutes = workEnd.getHours() * 60 + workEnd.getMinutes();
  const validBreaks = breaks.filter(breakItem => {
    const breakStartMinutes = breakItem.start.hour * 60 + breakItem.start.minute;
    return breakStartMinutes > workStartMinutes + 30 && 
           breakStartMinutes < workEndMinutes - 30;
  });
  
  const numBreaks = 2 + Math.floor(Math.random() * 2);
  const selectedBreaks = validBreaks.slice(0, Math.min(numBreaks, validBreaks.length));
  
  const totalWorkDuration = (workEnd - workStart) / (1000 * 60);
  const totalBreakDuration = selectedBreaks.reduce((sum, b) => sum + b.duration, 0);
  const totalWorkingMinutes = Math.floor(totalWorkDuration - totalBreakDuration);
  
  const allWorkPoints = await generateWorkingPoints(street, totalWorkingMinutes, dayOffset);
  
  let workPointIndex = 0;
  let currentTime = new Date(workStart);
  
  for (let breakIdx = 0; breakIdx <= selectedBreaks.length; breakIdx++) {
    let periodEnd;
    
    if (breakIdx < selectedBreaks.length) {
      periodEnd = new Date(date);
      periodEnd.setHours(selectedBreaks[breakIdx].start.hour, selectedBreaks[breakIdx].start.minute, 0, 0);
    } else {
      periodEnd = new Date(workEnd);
    }
    
    const periodDuration = (periodEnd - currentTime) / (1000 * 60);
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
          location_name: locality.name,
          latitude: allWorkPoints[workPointIndex].lat,
          longitude: allWorkPoints[workPointIndex].lng,
        });
        
        workPointIndex++;
      }
      
      currentTime = new Date(periodEnd);
    }
    
    if (breakIdx < selectedBreaks.length) {
      const breakStart = new Date(date);
      breakStart.setHours(selectedBreaks[breakIdx].start.hour, selectedBreaks[breakIdx].start.minute, 0, 0);
      
      const breakEnd = new Date(breakStart);
      breakEnd.setMinutes(breakEnd.getMinutes() + selectedBreaks[breakIdx].duration);
      
      const breakDuration = selectedBreaks[breakIdx].duration;
      
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
          location_name: locality.name,
          latitude: breakPoints[i].lat,
          longitude: breakPoints[i].lng,
        });
      }
      
      currentTime = new Date(breakEnd);
    }
  }
  
  // Return to depot
  const returnStart = new Date(workEnd);
  const returnDurationMinutes = 15 + Math.floor(Math.random() * 10);
  const returnEnd = new Date(returnStart);
  returnEnd.setMinutes(returnEnd.getMinutes() + returnDurationMinutes);
  const returnPoints = await generateRoutePoints(street, depot, returnDurationMinutes);
  
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
      location_name: locality.name,
      latitude: returnPoints[i].lat,
      longitude: returnPoints[i].lng,
    });
  }
  
  rows.push({
    timestamp: formatTimestamp(returnEnd),
    vehicle: CONFIG.VEHICLE,
    ward: CONFIG.WARD,
    phase: 'TRAVEL_BACK',
    location_name: locality.name,
    latitude: depot.lat,
    longitude: depot.lng,
  });
  
  return rows;
}

/**
 * Create a realistic schedule that randomly distributes dates across localities and streets
 * with 2-3 consecutive days per locality/street combination
 * CONSTRAINT: No more than 3 consecutive days in the same locality
 */
function createSchedule(startDate, endDate) {
  const schedule = [];
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Create all locality/street combinations
  const combinations = [];
  LOCALITIES.forEach((locality, locIdx) => {
    locality.streets.forEach((street, streetIdx) => {
      combinations.push({
        locality: locality,
        street: street,
        localityIndex: locIdx,
        streetIndex: streetIdx,
        key: `${locality.name}-${street.name}`
      });
    });
  });
  
  // Calculate how many days each combination should get (roughly equal)
  const daysPerCombination = Math.floor(totalDays / combinations.length);
  const extraDays = totalDays % combinations.length;
  
  // Assign base days to each combination
  const combinationDays = combinations.map((combo, idx) => ({
    ...combo,
    assignedDays: daysPerCombination + (idx < extraDays ? 1 : 0)
  }));
  
  // Shuffle combinations for randomness
  for (let i = combinationDays.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combinationDays[i], combinationDays[j]] = [combinationDays[j], combinationDays[i]];
  }
  
  // Track consecutive days per locality to enforce constraint
  let currentLocalityConsecutiveDays = 0;
  let lastLocalityName = null;
  let mustSwitchLocality = false; // Flag to force locality switch
  
  // Create schedule with 2-3 consecutive days per combination
  // CONSTRAINT: No more than 3 consecutive days in same locality
  let currentDay = 0;
  
  // Create a pool of available combinations
  const availableCombos = [...combinationDays];
  
  while (currentDay < totalDays) {
    // If we must switch locality, filter out the current locality
    let validCombos;
    if (mustSwitchLocality && lastLocalityName) {
      // Force different locality
      validCombos = availableCombos.filter(combo => 
        combo.assignedDays > 0 && combo.locality.name !== lastLocalityName
      );
      mustSwitchLocality = false;
      currentLocalityConsecutiveDays = 0;
    } else {
      // Filter combinations that don't violate locality constraint
      validCombos = availableCombos.filter(combo => {
        if (combo.assignedDays <= 0) return false;
        // If same locality and already at limit, skip
        if (lastLocalityName === combo.locality.name && currentLocalityConsecutiveDays >= 3) {
          return false;
        }
        return true;
      });
    }
    
    // If no valid combinations, we must switch to a different locality
    if (validCombos.length === 0) {
      // Force switch to different locality
      const differentLocalityCombos = availableCombos.filter(combo => 
        combo.assignedDays > 0 && (lastLocalityName === null || combo.locality.name !== lastLocalityName)
      );
      
      if (differentLocalityCombos.length === 0) {
        // No more combinations available, use any remaining
        const anyRemaining = availableCombos.filter(c => c.assignedDays > 0);
        if (anyRemaining.length === 0) break;
        
        const randomCombo = anyRemaining[Math.floor(Math.random() * anyRemaining.length)];
        schedule.push({
          dayIndex: currentDay,
          locality: randomCombo.locality,
          street: randomCombo.street,
        });
        currentDay++;
        randomCombo.assignedDays--;
        // Reset counter when forced to use same locality
        currentLocalityConsecutiveDays = 1;
        lastLocalityName = randomCombo.locality.name;
        continue;
      }
      
      // Use a different locality
      const randomCombo = differentLocalityCombos[Math.floor(Math.random() * differentLocalityCombos.length)];
      schedule.push({
        dayIndex: currentDay,
        locality: randomCombo.locality,
        street: randomCombo.street,
      });
      currentDay++;
      randomCombo.assignedDays--;
      currentLocalityConsecutiveDays = 1;
      lastLocalityName = randomCombo.locality.name;
      continue;
    }
    
    // Select a random valid combination
    const selectedCombo = validCombos[Math.floor(Math.random() * validCombos.length)];
    
    // Determine how many consecutive days to work (2-3, but respect constraint)
    let maxConsecutiveDays = CONFIG.MIN_CONSECUTIVE_DAYS + Math.floor(Math.random() * (CONFIG.MAX_CONSECUTIVE_DAYS - CONFIG.MIN_CONSECUTIVE_DAYS + 1));
    
    // If same locality, ensure we don't exceed limit
    if (lastLocalityName === selectedCombo.locality.name) {
      const remainingAllowed = 3 - currentLocalityConsecutiveDays;
      if (remainingAllowed <= 0) {
        // Should not happen due to filtering, but safety check
        maxConsecutiveDays = 0;
      } else {
        maxConsecutiveDays = Math.min(maxConsecutiveDays, remainingAllowed);
      }
    }
    
    const consecutiveDays = Math.min(
      selectedCombo.assignedDays,
      maxConsecutiveDays,
      totalDays - currentDay
    );
    
    // Add consecutive days to schedule
    for (let i = 0; i < consecutiveDays; i++) {
      // Check constraint before adding each day
      if (lastLocalityName === selectedCombo.locality.name && currentLocalityConsecutiveDays >= 3) {
        // Must switch locality - break and find different one
        mustSwitchLocality = true;
        break;
      }
      
      schedule.push({
        dayIndex: currentDay,
        locality: selectedCombo.locality,
        street: selectedCombo.street,
      });
      currentDay++;
      selectedCombo.assignedDays--;
      
      // Update locality tracking
      if (lastLocalityName === selectedCombo.locality.name) {
        currentLocalityConsecutiveDays++;
        // After 3 days, force switch on next iteration
        if (currentLocalityConsecutiveDays >= 3) {
          mustSwitchLocality = true; // Force switch to different locality next time
        }
      } else {
        currentLocalityConsecutiveDays = 1;
        lastLocalityName = selectedCombo.locality.name;
      }
    }
  }
  
  return schedule;
}

/**
 * Main function to generate all data
 */
async function generateAllData() {
  const allRows = [];
  const startDate = new Date(CONFIG.START_DATE);
  const endDate = new Date(CONFIG.END_DATE);
  
  // Create schedule
  const schedule = createSchedule(startDate, endDate);
  
  console.log(`📋 Created schedule with ${schedule.length} days`);
  console.log(`📍 Localities: ${LOCALITIES.length}`);
  console.log(`🛣️  Total streets: ${LOCALITIES.reduce((sum, loc) => sum + loc.streets.length, 0)}`);
  
  // Show schedule summary
  const scheduleSummary = {};
  schedule.forEach(day => {
    const key = `${day.locality.name}-${day.street.name}`;
    if (!scheduleSummary[key]) {
      scheduleSummary[key] = { count: 0, locality: day.locality.name, street: day.street.name };
    }
    scheduleSummary[key].count++;
  });
  
  console.log('\n📊 Schedule Summary:');
  Object.values(scheduleSummary).forEach(item => {
    console.log(`   ${item.locality} - ${item.street}: ${item.count} days`);
  });
  console.log('');
  
  let currentDate = new Date(startDate);
  let dayCount = 0;
  
  for (const scheduleItem of schedule) {
    dayCount++;
    const { locality, street } = scheduleItem;
    
    console.log(`📅 Processing ${formatTimestamp(currentDate).split(' ')[0]} (${dayCount}/${schedule.length}) - ${locality.name} / ${street.name}...`);
    
    const dayRows = await generateDayData(currentDate, locality, street, dayCount - 1);
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
  const outputPath = path.join(__dirname, '../data/ward31_hr26ed7915_aug25_dec24_2025.csv');

  console.log('🚀 Generating GPS data for JCB HR26ED7915 in Ward 31...');
  console.log(`📅 Date range: ${CONFIG.START_DATE.toISOString().split('T')[0]} to ${CONFIG.END_DATE.toISOString().split('T')[0]}`);
  console.log(`📍 Ward: ${CONFIG.WARD}`);
  console.log(`🏭 Localities: ${LOCALITIES.length}`);
  
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

