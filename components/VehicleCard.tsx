'use client';

import { Vehicle } from '@/types';
import { Truck, Clock, Circle, MapPin, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const statusConfig = {
    moving: { 
      color: 'bg-green-500', 
      text: 'Moving', 
      textColor: 'text-green-700', 
      bgColor: 'bg-green-50',
      gradient: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-200',
      dotColor: 'bg-green-500'
    },
    idle: { 
      color: 'bg-amber-500', 
      text: 'Idle', 
      textColor: 'text-amber-700', 
      bgColor: 'bg-amber-50',
      gradient: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-200',
      dotColor: 'bg-amber-500'
    },
    offline: { 
      color: 'bg-gray-500', 
      text: 'Offline', 
      textColor: 'text-gray-700', 
      bgColor: 'bg-gray-50',
      gradient: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-500'
    },
    maintenance: { 
      color: 'bg-orange-500', 
      text: 'Maintenance', 
      textColor: 'text-orange-700', 
      bgColor: 'bg-orange-50',
      gradient: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-200',
      dotColor: 'bg-orange-500'
    },
  };

  const status = statusConfig[vehicle.status];
  const [lastSeenText, setLastSeenText] = useState('');

  useEffect(() => {
    setLastSeenText(formatDistanceToNow(new Date(vehicle.lastSeen), { addSuffix: true }));
  }, [vehicle.lastSeen]);

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border-2 border-gray-200 p-5 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{vehicle.name}</h3>
              <p className="text-sm text-gray-500 font-medium">{vehicle.plateNumber}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${status.bgColor} border ${status.borderColor} shadow-sm`}>
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.color}`}></span>
            </span>
            <span className={`text-xs font-bold ${status.textColor} uppercase tracking-wide`}>{status.text}</span>
          </div>
        </div>

        {/* Vehicle details */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-600 font-medium">Ward</span>
            <span className="font-bold text-gray-900">{vehicle.ward || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-600 font-medium">Model</span>
            <span className="font-bold text-gray-900">{vehicle.model}</span>
          </div>
          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-600 font-medium">Location</span>
            <span className="font-bold text-gray-900 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              {vehicle.city}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{lastSeenText || 'recently'}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
