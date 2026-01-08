import { Vehicle, RouteData, Alert } from '@/types';

export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const response = await fetch('/api/vehicles');
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};

export const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
  try {
    const response = await fetch(`/api/vehicles/${id}`);
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return undefined;
  }
};

export const getRouteData = async (
  vehicleId: string, 
  date: string,
  options: { useRawCoordinates?: boolean } = {}
): Promise<RouteData | null> => {
  try {
    const response = await fetch(`/api/routes/${vehicleId}/${date}`);
    if (!response.ok) return null;
    
    const routeData = await response.json();
    
    // If useRawCoordinates is true and raw coordinates exist, swap them
    if (options.useRawCoordinates && routeData.points) {
      routeData.points = routeData.points.map((point: any) => ({
        ...point,
        lat: point.raw_lat ?? point.lat,
        lng: point.raw_lng ?? point.lng,
      }));
    }
    
    return routeData;
  } catch (error) {
    console.error('Error fetching route data:', error);
    return null;
  }
};

export const getAvailableDates = async (vehicleId: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/routes/${vehicleId}/dates`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
};

export const getAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await fetch('/api/alerts');
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const getAlertsByVehicle = async (vehicleId: string): Promise<Alert[]> => {
  try {
    const response = await fetch(`/api/alerts?vehicleId=${vehicleId}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicle alerts:', error);
    return [];
  }
};

export const getRecentAlerts = async (limit: number = 10): Promise<Alert[]> => {
  try {
    const response = await fetch(`/api/alerts?limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    return [];
  }
};

export const getAllVehicleData = async (vehicleId: string): Promise<any[]> => {
  try {
    // Get all dates for this vehicle
    const dates = await getAvailableDates(vehicleId);
    if (dates.length === 0) return [];
    
    const vehicle = await getVehicleById(vehicleId);
    const allDataPoints: any[] = [];
    
    // Fetch route data for each date
    for (const date of dates) {
      const routeData = await getRouteData(vehicleId, date);
      if (routeData && routeData.points) {
        routeData.points.forEach((point: any) => {
          allDataPoints.push({
            Vehicle: vehicle?.name || vehicleId,
            PlateNumber: vehicle?.plateNumber || vehicleId,
            Driver: vehicle?.driver || 'Unknown',
            Ward: vehicle?.ward || 'Unknown',
            City: vehicle?.city || 'Unknown',
            Date: date,
            Timestamp: new Date(point.timestamp).toLocaleString(),
            Latitude: point.lat,
            Longitude: point.lng,
            Location: point.location || 'Unknown Location',
            Status: point.status || 'Unknown'
          });
        });
      }
    }
    
    // Sort by timestamp
    allDataPoints.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
    
    return allDataPoints;
  } catch (error) {
    console.error('Error fetching all vehicle data:', error);
    return [];
  }
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
