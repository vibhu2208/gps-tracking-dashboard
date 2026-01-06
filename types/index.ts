export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  status: 'moving' | 'idle' | 'offline' | 'maintenance';
  lastSeen: string;
  driver: string;
  model: string;
  color: string;
  city: string;
  ward?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
  location?: string;
  status?: string;
  isStop?: boolean;
  phase?: string;
  raw_lat?: number;
  raw_lng?: number;
  confidence?: number;
  matched?: boolean;
}

export interface RouteSummary {
  totalDistance: number;
  drivingDuration: number;
  idleDuration: number;
  maxSpeed: number;
  avgSpeed?: number;
  stops?: number;
}

export interface RouteData {
  points: RoutePoint[];
  summary: RouteSummary;
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'overspeed' | 'geofence_entry' | 'geofence_exit' | 'long_idle' | 'maintenance';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface AppSettings {
  mapStyle: 'streets' | 'satellite';
  defaultZoom: number;
  distanceUnit: 'km' | 'miles';
  speedUnit: 'kmh' | 'mph';
  playbackSpeed: 1 | 2 | 4;
}

export interface TrackingSettings {
  updateFrequency: number;
  idleThreshold: number;
  overspeedThreshold: number;
  dataRetention: number;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  alertCategories: {
    overspeed: boolean;
    geofence: boolean;
    longIdle: boolean;
    offline: boolean;
  };
}
