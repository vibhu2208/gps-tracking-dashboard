'use client';

import { getVehicles, getRecentAlerts } from '@/lib/data';
import VehicleCard from '@/components/VehicleCard';
import AlertCard from '@/components/AlertCard';
import { useRouter } from 'next/navigation';
import { Car, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
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
      color: 'bg-blue-500',
      change: '+2 this month',
    },
    {
      title: 'Moving',
      value: movingVehicles,
      icon: Activity,
      color: 'bg-green-500',
      change: 'Active now',
    },
    {
      title: 'Idle',
      value: idleVehicles,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      change: 'Stationary',
    },
    {
      title: 'Alerts',
      value: alerts.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: 'Last 24h',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Monitor your fleet in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Active Vehicles</h2>
              <button
                onClick={() => router.push('/dashboard/vehicles')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.slice(0, 4).map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              <span className="text-sm text-gray-500">{alerts.length} new</span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
