'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVehicles } from '@/lib/data';
import { User, Settings as SettingsIcon, MapPin, Bell, Truck, CreditCard, Save } from 'lucide-react';
import { Vehicle } from '@/types';

type TabType = 'profile' | 'app' | 'tracking' | 'notifications' | 'fleet' | 'billing';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const loadVehicles = async () => {
      const data = await getVehicles();
      setVehicles(data);
    };
    loadVehicles();
  }, []);

  const tabs = [
    { id: 'profile' as TabType, name: 'Profile', icon: User },
    { id: 'app' as TabType, name: 'Application', icon: SettingsIcon },
    { id: 'tracking' as TabType, name: 'Tracking', icon: MapPin },
    { id: 'notifications' as TabType, name: 'Notifications', icon: Bell },
    { id: 'fleet' as TabType, name: 'Fleet', icon: Truck },
    { id: 'billing' as TabType, name: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'app' && <ApplicationTab />}
          {activeTab === 'tracking' && <TrackingTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'fleet' && <FleetTab vehicles={vehicles} />}
          {activeTab === 'billing' && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input type="text" defaultValue={user?.name} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" defaultValue={user?.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4">
          <input type="password" placeholder="Current Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="password" placeholder="New Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="password" placeholder="Confirm New Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Asia/Kolkata (IST)</option>
              <option>Asia/Dubai</option>
              <option>UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>
      </div>

      <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
        <Save className="w-4 h-4" />
        Save Changes
      </button>
    </div>
  );
}

function ApplicationTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Map Style</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Street View</option>
              <option>Satellite View</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Zoom Level</label>
            <input type="range" min="8" max="18" defaultValue="12" className="w-full" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Units</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distance Unit</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Kilometers (km)</option>
              <option>Miles (mi)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Speed Unit</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>km/h</option>
              <option>mph</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Playback Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Default Playback Speed</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>1x (Normal)</option>
            <option>2x (Fast)</option>
            <option>4x (Very Fast)</option>
          </select>
        </div>
      </div>

      <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
        <Save className="w-4 h-4" />
        Save Changes
      </button>
    </div>
  );
}

function TrackingTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">These settings control how vehicle tracking data is collected and processed.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location Update Frequency</label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Every 30 seconds</option>
            <option>Every 1 minute</option>
            <option>Every 2 minutes</option>
            <option>Every 5 minutes</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">More frequent updates consume more data</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Idle Detection Threshold (minutes)</label>
          <input type="number" defaultValue="15" min="5" max="60" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Overspeed Threshold (km/h)</label>
          <input type="number" defaultValue="80" min="40" max="120" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period (days)</label>
          <select defaultValue="90" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">365 days</option>
          </select>
        </div>
      </div>

      <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
        <Save className="w-4 h-4" />
        Save Changes
      </button>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-gray-700">Email Alerts</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-gray-700">Push Notifications</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Categories</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <div>
                <p className="font-medium text-gray-900">Overspeed Alerts</p>
                <p className="text-sm text-gray-500">When vehicles exceed speed limits</p>
              </div>
            </div>
          </label>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <div>
                <p className="font-medium text-gray-900">Geofence Alerts</p>
                <p className="text-sm text-gray-500">Entry/exit from designated zones</p>
              </div>
            </div>
          </label>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <div>
                <p className="font-medium text-gray-900">Long Idle Alerts</p>
                <p className="text-sm text-gray-500">Extended idle periods</p>
              </div>
            </div>
          </label>
          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <div>
                <p className="font-medium text-gray-900">Offline Vehicle Alerts</p>
                <p className="text-sm text-gray-500">When vehicles go offline</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
        <Save className="w-4 h-4" />
        Save Changes
      </button>
    </div>
  );
}

function FleetTab({ vehicles }: { vehicles: any[] }) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddVehicle = () => {
    alert('Add Vehicle functionality would be implemented here.\n\nIn production, this would:\n• Open a modal form\n• Collect vehicle details (name, plate, driver, etc.)\n• Save to database\n• Refresh the vehicle list');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Fleet Management</h3>
        <button 
          onClick={handleAddVehicle}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Add Vehicle
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.slice(0, 10).map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.plateNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.driver}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    vehicle.status === 'moving' ? 'bg-green-100 text-green-800' :
                    vehicle.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                    vehicle.status === 'offline' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-blue-600 hover:text-blue-700 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h3 className="text-xl font-semibold mb-2">Current Plan: MVP Demo</h3>
        <p className="text-blue-100">Full-featured demo access</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Vehicles</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">30</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Data Retention</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">90 days</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Storage Used</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">2.4 GB</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Options</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Basic</h4>
            <p className="text-3xl font-bold text-gray-900 mb-4">₹999<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Up to 10 vehicles</li>
              <li>• 30 days retention</li>
              <li>• Basic reports</li>
            </ul>
            <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition">Current Plan</button>
          </div>
          <div className="border-2 border-blue-500 rounded-lg p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">Popular</div>
            <h4 className="font-semibold text-gray-900 mb-2">Pro</h4>
            <p className="text-3xl font-bold text-gray-900 mb-4">₹2,999<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Up to 50 vehicles</li>
              <li>• 90 days retention</li>
              <li>• Advanced reports</li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Upgrade</button>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Enterprise</h4>
            <p className="text-3xl font-bold text-gray-900 mb-4">Custom</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Unlimited vehicles</li>
              <li>• Custom retention</li>
              <li>• API access</li>
            </ul>
            <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}
