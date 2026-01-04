'use client';

import { useState } from 'react';
import { getVehicles, getRouteData, getAlerts, getAllVehicleData, exportToCSV } from '@/lib/data';
import { Download, FileText, Calendar, Car } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
  const vehicles = getVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState('2025-12-28');
  const [selectedWeekEnd, setSelectedWeekEnd] = useState('2025-12-28');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isExporting, setIsExporting] = useState(false);

  // Generate all dates from Dec 3 to Dec 28, 2025
  const generateDateOptions = () => {
    const dates = [];
    const start = new Date('2025-12-03');
    const end = new Date('2025-12-28');
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates.reverse(); // Most recent first
  };

  const dateOptions = generateDateOptions();

  const handleExportTrips = async () => {
    setIsExporting(true);
    try {
      const routeData = await getRouteData(selectedVehicle, selectedDate);
      if (!routeData) {
        alert('No data available for the selected vehicle and date');
        return;
      }

      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      const exportData = routeData.points.map(point => ({
        Vehicle: vehicle?.name,
        PlateNumber: vehicle?.plateNumber,
        Date: selectedDate,
        Timestamp: format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        Latitude: point.lat,
        Longitude: point.lng,
        Speed: point.speed,
        IsStop: point.isStop ? 'Yes' : 'No',
      }));

      exportToCSV(exportData, `trip-report-${vehicle?.plateNumber}-${selectedDate}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSummary = async () => {
    setIsExporting(true);
    try {
      const summaryData = await Promise.all(
        vehicles.map(async (vehicle) => {
          const routeData = await getRouteData(vehicle.id, selectedDate);
          return {
            Vehicle: vehicle.name,
            PlateNumber: vehicle.plateNumber,
            Driver: vehicle.driver,
            City: vehicle.city,
            Status: vehicle.status,
            TotalDistance: routeData?.summary.totalDistance || 0,
            DrivingDuration: routeData?.summary.drivingDuration || 0,
            IdleDuration: routeData?.summary.idleDuration || 0,
            MaxSpeed: routeData?.summary.maxSpeed || 0,
            AvgSpeed: routeData?.summary.avgSpeed || 0,
            Stops: routeData?.summary.stops || 0,
          };
        })
      );

      exportToCSV(summaryData, `fleet-summary-${selectedDate}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAlerts = () => {
    setIsExporting(true);
    try {
      const alerts = getAlerts();
      const exportData = alerts.map(alert => ({
        Vehicle: alert.vehicleName,
        VehicleID: alert.vehicleId,
        Type: alert.type,
        Severity: alert.severity,
        Message: alert.message,
        Location: alert.location,
        Timestamp: format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      }));

      exportToCSV(exportData, `alerts-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWeeklySummary = async () => {
    setIsExporting(true);
    try {
      const endDate = new Date(selectedWeekEnd);
      const startDate = subDays(endDate, 6);
      
      const weeklyData = await Promise.all(
        vehicles.map(async (vehicle) => {
          let totalDistance = 0;
          let totalDriving = 0;
          let totalIdle = 0;
          let maxSpeed = 0;
          let daysWithData = 0;

          for (let i = 0; i < 7; i++) {
            const date = format(subDays(endDate, i), 'yyyy-MM-dd');
            const routeData = await getRouteData(vehicle.id, date);
            if (routeData) {
              totalDistance += routeData.summary.totalDistance;
              totalDriving += routeData.summary.drivingDuration;
              totalIdle += routeData.summary.idleDuration;
              maxSpeed = Math.max(maxSpeed, routeData.summary.maxSpeed);
              daysWithData++;
            }
          }

          return {
            Vehicle: vehicle.name,
            PlateNumber: vehicle.plateNumber,
            Driver: vehicle.driver,
            WeekStart: format(startDate, 'yyyy-MM-dd'),
            WeekEnd: format(endDate, 'yyyy-MM-dd'),
            TotalDistance: Math.round(totalDistance * 10) / 10,
            TotalDrivingTime: totalDriving,
            TotalIdleTime: totalIdle,
            MaxSpeed: maxSpeed,
            DaysActive: daysWithData,
          };
        })
      );

      exportToCSV(weeklyData, `weekly-summary-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMonthlySummary = async () => {
    setIsExporting(true);
    try {
      const currentDate = new Date(selectedDate);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthlyData = await Promise.all(
        vehicles.map(async (vehicle) => {
          let totalDistance = 0;
          let totalDriving = 0;
          let totalIdle = 0;
          let maxSpeed = 0;
          let daysWithData = 0;

          let date = new Date(monthStart);
          while (date <= monthEnd && date <= new Date()) {
            const dateStr = format(date, 'yyyy-MM-dd');
            const routeData = await getRouteData(vehicle.id, dateStr);
            if (routeData) {
              totalDistance += routeData.summary.totalDistance;
              totalDriving += routeData.summary.drivingDuration;
              totalIdle += routeData.summary.idleDuration;
              maxSpeed = Math.max(maxSpeed, routeData.summary.maxSpeed);
              daysWithData++;
            }
            date = new Date(date.setDate(date.getDate() + 1));
          }

          return {
            Vehicle: vehicle.name,
            PlateNumber: vehicle.plateNumber,
            Driver: vehicle.driver,
            Month: format(currentDate, 'MMMM yyyy'),
            TotalDistance: Math.round(totalDistance * 10) / 10,
            TotalDrivingTime: totalDriving,
            TotalIdleTime: totalIdle,
            MaxSpeed: maxSpeed,
            DaysActive: daysWithData,
            AvgDistancePerDay: daysWithData > 0 ? Math.round((totalDistance / daysWithData) * 10) / 10 : 0,
          };
        })
      );

      exportToCSV(monthlyData, `monthly-summary-${format(currentDate, 'yyyy-MM')}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCompleteVehicleData = async () => {
    setIsExporting(true);
    try {
      const allData = await getAllVehicleData(selectedVehicle);
      if (allData.length === 0) {
        alert('No data available for the selected vehicle');
        return;
      }

      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      const filename = `complete-vehicle-data-${vehicle?.plateNumber || selectedVehicle}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      exportToCSV(allData, filename);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Export and analyze your fleet data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trip Details Report</h2>
              <p className="text-sm text-gray-600">Export detailed trip data for a specific vehicle</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vehicle
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.plateNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {dateOptions.map((date) => (
                    <option key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                      {format(date, 'MMMM dd, yyyy')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportTrips}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export Trip Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Complete Vehicle History</h2>
              <p className="text-sm text-gray-600">Export all data for a specific vehicle across all dates</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vehicle
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.plateNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-gray-900 text-sm">Complete Report Includes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All GPS coordinates and timestamps</li>
                <li>• Speed data for every point</li>
                <li>• Location and status information</li>
                <li>• Driver and vehicle details</li>
                <li>• Complete journey history across all dates</li>
                <li>• Stop/movement indicators</li>
              </ul>
              <div className="pt-2 border-t border-orange-200 mt-3">
                <span className="text-orange-700 font-medium">
                  This will export ALL available data for the selected vehicle
                </span>
              </div>
            </div>

            <button
              onClick={handleExportCompleteVehicleData}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : 'Export Complete Vehicle Data'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Fleet Summary Report</h2>
              <p className="text-sm text-gray-600">Export summary data for all vehicles</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {dateOptions.map((date) => (
                    <option key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                      {format(date, 'MMMM dd, yyyy')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-gray-900 text-sm">Report Includes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle information and status</li>
                <li>• Total distance traveled</li>
                <li>• Driving and idle durations</li>
                <li>• Maximum speeds recorded</li>
                <li>• Driver assignments</li>
              </ul>
            </div>

            <button
              onClick={handleExportSummary}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export Summary Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Alerts Report</h2>
              <p className="text-sm text-gray-600">Export all alerts and incidents</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-gray-900 text-sm">Report Includes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All alert types (overspeed, geofence, idle)</li>
                <li>• Severity levels</li>
                <li>• Timestamps and locations</li>
                <li>• Vehicle information</li>
                <li>• Alert descriptions</li>
              </ul>
              <div className="pt-2 border-t border-gray-200 mt-3">
                <span className="text-gray-600">Total Alerts:</span>
                <span className="ml-2 font-medium text-gray-900">{getAlerts().length}</span>
              </div>
            </div>

            <button
              onClick={handleExportAlerts}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export Alerts Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Weekly Summary Report</h2>
              <p className="text-sm text-gray-600">Export 7-day aggregated data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Week End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedWeekEnd}
                  onChange={(e) => setSelectedWeekEnd(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {dateOptions.map((date) => (
                    <option key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                      Week ending {format(date, 'MMMM dd, yyyy')}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Report will include 7 days ending on selected date
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-gray-900 text-sm">Report Includes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Total distance for the week</li>
                <li>• Cumulative driving and idle time</li>
                <li>• Maximum speed recorded</li>
                <li>• Number of active days</li>
                <li>• Per-vehicle breakdown</li>
              </ul>
            </div>

            <button
              onClick={handleExportWeeklySummary}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : 'Export Weekly Report'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monthly Summary Report</h2>
              <p className="text-sm text-gray-600">Export full month aggregated data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-gray-900 text-sm">Report Includes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Total monthly distance</li>
                <li>• Complete driving statistics</li>
                <li>• Average distance per day</li>
                <li>• Monthly activity overview</li>
                <li>• Fleet-wide analytics</li>
              </ul>
            </div>

            <button
              onClick={handleExportMonthlySummary}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : 'Export Monthly Report'}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Report Information</h2>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <p>
              All reports are exported in CSV format, which can be opened in Excel, Google Sheets, or any spreadsheet application.
            </p>
            <div className="bg-white rounded-lg p-3 space-y-2">
              <h3 className="font-medium text-gray-900">Available Data:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>✓ GPS coordinates and timestamps</li>
                <li>✓ Speed and distance metrics</li>
                <li>✓ Driver and vehicle information</li>
                <li>✓ Alert history and severity</li>
                <li>✓ Trip summaries and analytics</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 pt-2">
              Note: This is a prototype version. In production, reports would include historical data and advanced filtering options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
