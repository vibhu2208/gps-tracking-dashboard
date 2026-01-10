'use client';

import { getVehicles, getRecentAlerts } from '@/lib/data';
import VehicleCard from '@/components/VehicleCard';
import AlertCard from '@/components/AlertCard';
import { useRouter } from 'next/navigation';
import { Car, AlertTriangle, Activity, TrendingUp, ArrowUpRight, Truck, MapPin, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vehicle, Alert } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [vehiclesData, alertsData] = await Promise.all([
        getVehicles(),
        getRecentAlerts(5)
      ]);
      setVehicles(vehiclesData);
      setAlerts(alertsData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const movingVehicles = vehicles.filter(v => v.status === 'moving').length;
  const idleVehicles = vehicles.filter(v => v.status === 'idle').length;
  const offlineVehicles = vehicles.filter(v => v.status === 'offline').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

  const stats = [
    {
      title: 'Total Vehicles',
      value: vehicles.length,
      icon: Car,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      change: '+2 this month',
      changeType: 'positive',
    },
    {
      title: 'Active Now',
      value: movingVehicles,
      icon: Activity,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      iconBg: 'bg-green-500',
      change: 'Moving',
      changeType: 'neutral',
    },
    {
      title: 'Idle Vehicles',
      value: idleVehicles,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-100',
      iconBg: 'bg-amber-500',
      change: 'Stationary',
      changeType: 'neutral',
    },
    {
      title: 'Active Alerts',
      value: alerts.length,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      bgGradient: 'from-red-50 to-rose-100',
      iconBg: 'bg-red-500',
      change: 'Last 24h',
      changeType: 'warning',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Monitor your fleet in real-time
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 font-medium">Last Updated</p>
            <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title} 
              className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-2">{stat.title}</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      stat.changeType === 'positive' ? 'bg-green-100 text-green-700' :
                      stat.changeType === 'warning' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Vehicles Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Active Vehicles</h2>
                    <p className="text-sm text-gray-600">{vehicles.length} vehicles in fleet</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/vehicles')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm shadow-sm border border-blue-200"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.slice(0, 4).map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No vehicles available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Alerts Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Alerts</h2>
                    <p className="text-sm text-gray-600">{alerts.length} active alerts</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No active alerts</p>
                  <p className="text-sm text-gray-400 mt-1">All systems operational</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
