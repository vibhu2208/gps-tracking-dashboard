'use client';

import { getVehicles } from '@/lib/data';
import VehicleCard from '@/components/VehicleCard';
import { useRouter } from 'next/navigation';
import { Search, Filter, Truck, Activity, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vehicle } from '@/types';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoading(true);
      const data = await getVehicles();
      setVehicles(data);
      setIsLoading(false);
    };
    loadVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const movingCount = vehicles.filter(v => v.status === 'moving').length;
  const idleCount = vehicles.filter(v => v.status === 'idle').length;
  const offlineCount = vehicles.filter(v => v.status === 'offline').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Fleet Vehicles
          </h1>
          <p className="text-gray-600 mt-2">Manage and monitor your entire fleet</p>
        </div>
        <div className="hidden md:block">
          <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <p className="text-sm font-semibold text-gray-700">Total Fleet</p>
            <p className="text-2xl font-bold text-gray-900">{vehicles.length} Vehicles</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{movingCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Idle</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{idleCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Offline</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{offlineCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vehicles, plates, or drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-4 rounded-xl border-2 border-gray-200">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-3.5 bg-transparent border-none focus:ring-0 outline-none font-semibold text-gray-700 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="moving">Moving</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </p>
        </div>

        {/* Vehicle Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-gray-500 mt-4 font-medium">Loading vehicles...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                />
              ))}
            </div>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-16">
                <Truck className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold text-lg">No vehicles found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
