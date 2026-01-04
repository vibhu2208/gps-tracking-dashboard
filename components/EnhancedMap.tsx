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

    map.on('load', () => {
      if (map.getSource('route')) {
        map.removeLayer('route-normal');
        map.removeLayer('route-overspeed');
        map.removeSource('route');
      }

      const normalSegments: [number, number][] = [];
      const overspeedSegments: [number, number][] = [];

      points.forEach((point, idx) => {
        if (idx === 0) return;
        
        const prevPoint = points[idx - 1];
        const segment: [number, number][] = [
          [prevPoint.lng, prevPoint.lat],
          [point.lng, point.lat]
        ];

        if (point.speed > overspeedThreshold) {
          overspeedSegments.push(...segment);
        } else {
          normalSegments.push(...segment);
        }
      });

      const routeCoordinates = points.map(p => [p.lng, p.lat]);

      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      map.addLayer({
        id: 'route-normal',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3B82F6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      if (overspeedSegments.length > 0) {
        points.forEach((point, idx) => {
          if (point.speed > overspeedThreshold && idx > 0) {
            const prevPoint = points[idx - 1];
            
            map.addSource(`overspeed-${idx}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [[prevPoint.lng, prevPoint.lat], [point.lng, point.lat]]
                }
              }
            });

            map.addLayer({
              id: `overspeed-${idx}`,
              type: 'line',
              source: `overspeed-${idx}`,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#EF4444',
                'line-width': 5,
                'line-opacity': 0.9
              }
            });
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

      points.forEach((point, idx) => {
        if (point.isStop && idx > 0 && idx < points.length - 1) {
          const stopEl = document.createElement('div');
          stopEl.style.cssText = `
            width: 20px;
            height: 20px;
            background-color: #F59E0B;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          `;

          const stopMarker = new mapboxgl.Marker({ element: stopEl })
            .setLngLat([point.lng, point.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div style="padding: 4px;">
                <strong>Stop Point</strong><br/>
                <small>${new Date(point.timestamp).toLocaleTimeString()}</small>
              </div>
            `))
            .addTo(map);

          stopMarkersRef.current.push(stopMarker);
        }
      });

      if (showPlayback) {
        const carEl = document.createElement('div');
        carEl.innerHTML = `
          <div style="position: relative; width: 48px; height: 48px;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 50%; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div style="position: absolute; top: 0; left: 0; width: 48px; height: 48px; border: 2px solid #3B82F6; border-radius: 50%; animation: pulse 2s infinite;"></div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.1); }
            }
          </style>
        `;
        carEl.style.cursor = 'pointer';

        const currentPoint = points[currentIndex];
        const locationName = currentPoint.location || 'Unknown Location';
        const displayStatus = currentPoint.status === 'WORKING' ? 'WORKING' : (currentPoint.status || 'Unknown');

        markerRef.current = new mapboxgl.Marker({ element: carEl })
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
                  <span>Speed:</span>
                  <strong style="color: ${currentPoint.speed > overspeedThreshold ? '#EF4444' : '#10B981'}">${currentPoint.speed} km/h</strong>
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
              <span>Speed:</span>
              <strong style="color: ${currentPoint.speed > overspeedThreshold ? '#EF4444' : '#10B981'}">${currentPoint.speed} km/h</strong>
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
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Normal Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Overspeed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
