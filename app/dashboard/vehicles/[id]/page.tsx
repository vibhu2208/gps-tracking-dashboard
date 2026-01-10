'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVehicleById, getRouteData, getAlertsByVehicle, getAvailableDates, exportToCSV } from '@/lib/data';
import { RouteData } from '@/types';
import EnhancedMap from '@/components/EnhancedMap';
import AlertCard from '@/components/AlertCard';
import { Play, Pause, RotateCcw, Clock, Gauge, Route, ArrowLeft, Download, Briefcase, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import DatePicker from '@/components/DatePicker';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  
  const [vehicle, setVehicle] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const loadVehicle = async () => {
      const data = await getVehicleById(vehicleId);
      setVehicle(data);
    };
    loadVehicle();
  }, [vehicleId]);

  useEffect(() => {
    const loadAlerts = async () => {
      const data = await getAlertsByVehicle(vehicleId);
      setAlerts(data);
    };
    loadAlerts();
  }, [vehicleId]);

  useEffect(() => {
    const loadDates = async () => {
      const dates = await getAvailableDates(vehicleId);
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    };
    loadDates();
  }, [vehicleId]);

  useEffect(() => {
    const loadRouteData = async () => {
      setIsLoading(true);
      const data = await getRouteData(vehicleId, selectedDate, { useRawCoordinates: false });
      setRouteData(data);
      setCurrentIndex(0);
      setIsPlaying(false);
      setIsLoading(false);
    };
    loadRouteData();
  }, [vehicleId, selectedDate]);

  useEffect(() => {
    if (!isPlaying || !routeData) return;

    const intervalTime = 1000 / playbackSpeed;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= routeData.points.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, routeData, playbackSpeed]);

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
          <p className="text-gray-600 mb-4">The vehicle you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/vehicles')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(parseInt(e.target.value));
    setIsPlaying(false);
  };

  const handleExportRouteData = () => {
    if (!routeData || !vehicle) return;
    
    const exportData = routeData.points.map(point => ({
      Vehicle: vehicle.name,
      Plate: vehicle.plateNumber,
      Date: selectedDate,
      Time: format(new Date(point.timestamp), 'HH:mm:ss'),
      Latitude: point.lat.toFixed(6),
      Longitude: point.lng.toFixed(6),
      Location: point.location || 'Unknown Location'
    }));

    exportToCSV(exportData, `route-history-${vehicle.plateNumber}-${selectedDate}.csv`);
  };

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading vehicle data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/vehicles')}
          className="p-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all border-2 border-transparent hover:border-blue-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{vehicle.name}</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span className="font-semibold">{vehicle.plateNumber}</span>
            <span>•</span>
            <span>{vehicle.driver}</span>
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${
          vehicle.status === 'moving' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
          vehicle.status === 'idle' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' :
          'bg-gradient-to-r from-gray-500 to-slate-600 text-white'
        }`}>
          {vehicle.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-visible">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b-2 border-gray-200 overflow-visible">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Route History</h2>
                <div className="flex items-center gap-3 relative z-50">
                  <button
                    onClick={handleExportRouteData}
                    disabled={!routeData || isLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </button>
                  <DatePicker
                    selectedDate={selectedDate}
                    availableDates={availableDates}
                    onChange={setSelectedDate}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            <div className="p-6">

              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading route data...</p>
                  </div>
                </div>
              ) : routeData ? (
                <>
                  <div className="h-96 mb-6 rounded-xl overflow-hidden border-2 border-gray-200">
                    <EnhancedMap
                      points={routeData.points}
                      currentIndex={currentIndex}
                      showPlayback={true}
                      overspeedThreshold={80}
                      vehicleNumber={vehicle.plateNumber}
                    />
                  </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Speed:</label>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value) as 1 | 2 | 4)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="1">1x</option>
                      <option value="2">2x</option>
                      <option value="4">4x</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePlayPause}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleRestart}
                      className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max={routeData.points.length - 1}
                        value={currentIndex}
                        onChange={handleSliderChange}
                        className="w-full"
                      />
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {currentIndex + 1} / {routeData.points.length}
                    </span>
                  </div>

                  {routeData.points[currentIndex] && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 block mb-1">Location</span>
                          <span className="font-semibold text-blue-600 block">
                            {routeData.points[currentIndex].location || 'Unknown Location'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-1">Time (IST)</span>
                          <span className="font-semibold text-gray-900 block">
                            {(() => {
                              const date = new Date(routeData.points[currentIndex].timestamp);
                              return date.toLocaleTimeString('en-IN', { 
                                timeZone: 'Asia/Kolkata',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              });
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-1">Status</span>
                          <span className={`font-semibold block ${
                            routeData.points[currentIndex].phase === 'WORKING' ? 'text-green-600' :
                            routeData.points[currentIndex].phase === 'BREAK' ? 'text-yellow-600' :
                            routeData.points[currentIndex].phase === 'TRAVEL_OUT' ? 'text-blue-600' :
                            routeData.points[currentIndex].phase === 'TRAVEL_BACK' ? 'text-purple-600' :
                            'text-gray-600'
                          }`}>
                            {routeData.points[currentIndex].phase === 'TRAVEL_OUT' ? 'Moving to Work' :
                             routeData.points[currentIndex].phase === 'TRAVEL_BACK' ? 'Returning to Base' :
                             routeData.points[currentIndex].phase === 'WORKING' ? 'Working' :
                             routeData.points[currentIndex].phase === 'BREAK' ? 'Break' :
                             routeData.points[currentIndex].phase || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No route data available for this date</p>
                </div>
              )}
            </div>
          </div>

          {routeData && !isLoading && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Trip Summary</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(() => {
                  // Calculate actual driving duration from timestamps
                  const travelPoints = routeData.points.filter(p => 
                    p.phase === 'TRAVEL_OUT' || p.phase === 'TRAVEL_BACK'
                  );
                  
                  let drivingDurationMinutes = 0;
                  if (travelPoints.length > 1) {
                    const firstTravelTime = new Date(travelPoints[0].timestamp).getTime();
                    const lastTravelTime = new Date(travelPoints[travelPoints.length - 1].timestamp).getTime();
                    drivingDurationMinutes = Math.round((lastTravelTime - firstTravelTime) / (1000 * 60));
                  }
                  
                  // Calculate actual working duration from timestamps
                  const workingPoints = routeData.points.filter(p => p.phase === 'WORKING');
                  let workingDurationMinutes = 0;
                  if (workingPoints.length > 1) {
                    const firstWorkTime = new Date(workingPoints[0].timestamp).getTime();
                    const lastWorkTime = new Date(workingPoints[workingPoints.length - 1].timestamp).getTime();
                    workingDurationMinutes = Math.round((lastWorkTime - firstWorkTime) / (1000 * 60));
                  }
                  
                  // Calculate actual distance using Haversine formula
                  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
                    const R = 6371; // Earth radius in km
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLng = (lng2 - lng1) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                              Math.sin(dLng / 2) * Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                  };
                  
                  let totalDistance = 0;
                  for (let i = 0; i < routeData.points.length - 1; i++) {
                    const p1 = routeData.points[i];
                    const p2 = routeData.points[i + 1];
                    totalDistance += calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
                  }
                  
                  // Format durations
                  const formatDuration = (minutes: number): string => {
                    if (minutes < 60) return `${minutes} min`;
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                  };
                  
                  return (
                    <>
                      <div className="bg-white rounded-xl p-4 border-2 border-blue-100 hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                            <Route className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Distance</p>
                            <p className="text-xl font-bold text-gray-900">{totalDistance.toFixed(1)} km</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-purple-100 hover:border-purple-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</p>
                            <p className="text-xl font-bold text-gray-900">{format(new Date(selectedDate), 'MMM dd')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-green-100 hover:border-green-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">City</p>
                            <p className="text-xl font-bold text-gray-900">Gurugram</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Alerts</h2>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No alerts for this vehicle</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
