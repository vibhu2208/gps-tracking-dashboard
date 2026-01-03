import { Vehicle, RouteData, Alert } from '@/types';
import vehiclesData from '@/data/vehicles.json';
import alertsData from '@/data/alerts.json';

export const getVehicles = (): Vehicle[] => {
  return vehiclesData as Vehicle[];
};

export const getVehicleById = (id: string): Vehicle | undefined => {
  return vehiclesData.find((v) => v.id === id) as Vehicle | undefined;
};

export const getRouteData = async (vehicleId: string, date: string): Promise<RouteData | null> => {
  try {
    const response = await fetch('/data/routes.json');
    if (!response.ok) return null;
    const allRoutes = await response.json();
    
    if (allRoutes[vehicleId] && allRoutes[vehicleId][date]) {
      return allRoutes[vehicleId][date];
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const getAvailableDates = async (vehicleId: string): Promise<string[]> => {
  try {
    const response = await fetch('/data/routes.json');
    if (!response.ok) return [];
    const allRoutes = await response.json();
    
    if (allRoutes[vehicleId]) {
      return Object.keys(allRoutes[vehicleId]).sort().reverse();
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const getAlerts = (): Alert[] => {
  return alertsData as Alert[];
};

export const getAlertsByVehicle = (vehicleId: string): Alert[] => {
  return (alertsData as Alert[]).filter((alert) => alert.vehicleId === vehicleId);
};

export const getRecentAlerts = (limit: number = 10): Alert[] => {
  const alerts = alertsData as Alert[];
  return alerts.slice(0, limit);
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Wrap all values in quotes to ensure proper Excel formatting
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
