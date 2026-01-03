'use client';

import { Alert } from '@/types';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AlertCardProps {
  alert: Alert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const severityConfig = {
    low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'bg-blue-500' },
    medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'bg-yellow-500' },
    high: { color: 'bg-red-100 text-red-800 border-red-200', icon: 'bg-red-500' },
  };

  const typeLabels = {
    overspeed: 'Overspeed',
    geofence_entry: 'Geofence Entry',
    geofence_exit: 'Geofence Exit',
    long_idle: 'Long Idle',
    maintenance: 'Maintenance',
  };

  const config = severityConfig[alert.severity];
  const timestamp = new Date(alert.timestamp);

  return (
    <div className={`border rounded-lg p-4 ${config.color}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${config.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{alert.vehicleName}</h4>
              <span className="text-xs font-medium px-2 py-1 bg-white rounded mt-1 inline-block">
                {typeLabels[alert.type]}
              </span>
            </div>
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {format(timestamp, 'MMM dd, HH:mm')}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{alert.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
