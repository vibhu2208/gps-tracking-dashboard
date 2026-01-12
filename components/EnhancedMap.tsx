'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RoutePoint } from '@/types';
import { Maximize, Minimize, Map as MapIcon, Satellite } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrOHVpZGZhZjBhMGczZW56YnRvbWJkdGEifQ.example';

interface EnhancedMapProps {
  points: RoutePoint[];
  currentIndex?: number;
  showPlayback?: boolean;
  overspeedThreshold?: number;
  vehicleNumber?: string;
}

export default function EnhancedMap({ 
  points, 
  currentIndex = 0, 
  showPlayback = false,
  overspeedThreshold = 80,
  vehicleNumber = 'Unknown'
}: EnhancedMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [77.2090, 28.6139],
        zoom: 12,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      mapRef.current = map;

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const styleUrl = mapStyle === 'streets' 
      ? 'mapbox://styles/mapbox/streets-v12'
      : 'mapbox://styles/mapbox/satellite-streets-v12';

    mapRef.current.setStyle(styleUrl);
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;

    const map = mapRef.current;

    if (startMarkerRef.current) startMarkerRef.current.remove();
    if (endMarkerRef.current) endMarkerRef.current.remove();
    if (markerRef.current) markerRef.current.remove();
    stopMarkersRef.current.forEach(marker => marker.remove());
    stopMarkersRef.current = [];

    map.on('load', async () => {
      // Remove all existing route sources and layers
      if (map.getSource('route')) {
        map.removeLayer('route-normal');
        map.removeLayer('route-overspeed');
        map.removeSource('route');
      }

      for (let i = 0; i < points.length; i++) {
        if (map.getSource(`route-segment-${i}`)) {
          map.removeLayer(`route-segment-${i}`);
          map.removeSource(`route-segment-${i}`);
        }
        if (map.getSource(`overspeed-${i}`)) {
          map.removeLayer(`overspeed-${i}`);
          map.removeSource(`overspeed-${i}`);
        }
      }

      // Create individual line segments for each consecutive point pair
      // This ensures forward and backward movements are both visible
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      // Helper function to calculate distance between two points
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        
        // Check if this is a working area segment
        const isWorkingArea = startPoint.phase === 'WORKING' || endPoint.phase === 'WORKING';
        
        // Create segment coordinates
        let segmentCoordinates = [[startPoint.lng, startPoint.lat], [endPoint.lng, endPoint.lat]];

        // Calculate distance to decide if we need route matching
        const distance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);
        
        // Use Directions API for segments longer than 5 meters to get detailed routes with more points
        // This creates more visible lines with intermediate waypoints
        if (mapboxToken && distance > 5) {
          try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?` + new URLSearchParams({
              access_token: mapboxToken,
              geometries: 'geojson',
              overview: 'full', // Get full detailed geometry
              steps: 'false',
            });

            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (data.routes && data.routes.length > 0 && data.routes[0].geometry) {
                segmentCoordinates = data.routes[0].geometry.coordinates;
              }
            }
          } catch (error) {
            // If Directions API fails, try interpolating more points along the straight line
            const numIntermediatePoints = Math.max(3, Math.floor(distance / 5)); // Add point every ~5 meters
            segmentCoordinates = [];
            for (let j = 0; j <= numIntermediatePoints; j++) {
              const progress = j / numIntermediatePoints;
              const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress;
              const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress;
              segmentCoordinates.push([lng, lat]);
            }
          }
        } else if (distance > 0) {
          // For short segments, add intermediate points to make lines more visible
          const numIntermediatePoints = Math.max(2, Math.floor(distance / 2)); // Add point every ~2 meters
          segmentCoordinates = [];
          for (let j = 0; j <= numIntermediatePoints; j++) {
            const progress = j / numIntermediatePoints;
            const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress;
            const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress;
            segmentCoordinates.push([lng, lat]);
          }
        }

        // Zig-zag variations are now baked into the CSV data, so we just display it as-is
        // The map will show the realistic GPS tracking pattern from the data

        // Add source for this segment
        map.addSource(`route-segment-${i}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: segmentCoordinates
            }
          }
        });

        // Add layer for this segment with thicker, more visible lines
        map.addLayer({
          id: `route-segment-${i}`,
          type: 'line',
          source: `route-segment-${i}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3B82F6',
            'line-width': 6, // Increased from 4 to 6 for better visibility
            'line-opacity': 0.9 // Increased from 0.8 to 0.9 for better visibility
          }
        });
      }

      const startEl = document.createElement('div');
      startEl.className = 'start-marker';
      startEl.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: #10B981;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      startMarkerRef.current = new mapboxgl.Marker({ element: startEl })
        .setLngLat([points[0].lng, points[0].lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Start Point</strong>'))
        .addTo(map);

      const endEl = document.createElement('div');
      endEl.className = 'end-marker';
      endEl.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: #EF4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      endMarkerRef.current = new mapboxgl.Marker({ element: endEl })
        .setLngLat([points[points.length - 1].lng, points[points.length - 1].lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>End Point</strong>'))
        .addTo(map);

      // Stop markers removed - all traces are now shown as visible lines

      if (showPlayback) {
        const jcbEl = document.createElement('div');
        jcbEl.innerHTML = `
          <div style="position: relative; width: 48px; height: 48px;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 48px; height: 48px; background: rgba(255, 255, 255, 0.95); border-radius: 50%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;">
              <img src="/jcb.png" alt="JCB" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
            <div style="position: absolute; top: 0; left: 0; width: 48px; height: 48px; border: 2px solid #F59E0B; border-radius: 50%; animation: pulse 2s infinite;"></div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.1); }
            }
          </style>
        `;
        jcbEl.style.cursor = 'pointer';

        const currentPoint = points[currentIndex];
        const locationName = currentPoint.location || 'Unknown Location';
        const displayStatus = currentPoint.status === 'WORKING' ? 'WORKING' : (currentPoint.status || 'Unknown');

        markerRef.current = new mapboxgl.Marker({ element: jcbEl })
          .setLngLat([currentPoint.lng, currentPoint.lat])
          .addTo(map);

        popupRef.current = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setLngLat([currentPoint.lng, currentPoint.lat])
          .setHTML(`
            <div style="padding: 10px; min-width: 180px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1f2937;">Current Position</div>
              <div style="font-size: 12px; color: #4b5563; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Vehicle:</span>
                  <strong style="color: #3B82F6;">${vehicleNumber}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Status:</span>
                  <strong style="color: #10B981;">${displayStatus}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Location:</span>
                  <strong style="color: #10B981;">${locationName}</strong>
                </div>
              </div>
            </div>
          `)
          .addTo(map);
      }

      const bounds = new mapboxgl.LngLatBounds();
      points.forEach(point => bounds.extend([point.lng, point.lat]));
      map.fitBounds(bounds, { padding: 50 });
    });

    if (map.isStyleLoaded()) {
      map.fire('load');
    }
  }, [points, overspeedThreshold, showPlayback]);

  useEffect(() => {
    if (!mapRef.current || !showPlayback || !markerRef.current || !popupRef.current || points.length === 0) return;

    const currentPoint = points[currentIndex];
    if (currentPoint) {
      const locationName = currentPoint.location || 'Unknown Location';
      const displayStatus = currentPoint.status === 'WorkingI' ? 'WORKING' : (currentPoint.status || 'Unknown');

      markerRef.current.setLngLat([currentPoint.lng, currentPoint.lat]);
      popupRef.current.setLngLat([currentPoint.lng, currentPoint.lat]);
      popupRef.current.setHTML(`
        <div style="padding: 10px; min-width: 180px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1f2937;">Current Position</div>
          <div style="font-size: 12px; color: #4b5563; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Vehicle:</span>
              <strong style="color: #3B82F6;">${vehicleNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Status:</span>
              <strong style="color: #10B981;">${displayStatus}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Location:</span>
              <strong style="color: #10B981;">${locationName}</strong>
            </div>
          </div>
        </div>
      `);
      
      mapRef.current.panTo([currentPoint.lng, currentPoint.lat], { duration: 500 });
    }
  }, [currentIndex, showPlayback, points, overspeedThreshold]);

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setMapStyle('streets')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
              mapStyle === 'streets' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Street
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-t ${
              mapStyle === 'satellite' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Satellite className="w-4 h-4" />
            Satellite
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5 text-gray-700" />
          ) : (
            <Maximize className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-700">Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
