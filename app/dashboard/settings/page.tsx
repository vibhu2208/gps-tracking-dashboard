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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account and application preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-gray-200">
          <nav className="flex space-x-2 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
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

        <div className="p-8">
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
    <div className="space-y-6 max-w-4xl">
      {/* Profile Information Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          Profile Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input 
              type="text" 
              defaultValue={user?.name} 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              defaultValue={user?.email} 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input 
              type="tel" 
              placeholder="+91 98765 43210" 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            />
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </h3>
        <div className="space-y-4">
          <input 
            type="password" 
            placeholder="Current Password" 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
          />
          <input 
            type="password" 
            placeholder="New Password" 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
          />
          <input 
            type="password" 
            placeholder="Confirm New Password" 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
          />
        </div>
      </div>

      {/* Regional Settings Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Regional Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
            <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white">
              <option>Asia/Kolkata (IST)</option>
              <option>Asia/Dubai</option>
              <option>UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white">
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
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
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleAddVehicle = () => {
    setShowPricingModal(true);
  };

  const handleEdit = () => {
    alert('⚠️ Administrator Permission Required\n\nYou need administrator privileges to edit vehicle details.\n\nPlease contact your system administrator for access.');
  };

  const handleDelete = () => {
    alert('⚠️ Administrator Permission Required\n\nYou need administrator privileges to delete vehicles.\n\nPlease contact your system administrator for access.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Fleet Management</h3>
        <button 
          onClick={handleAddVehicle}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
        >
          Add Vehicle
        </button>
      </div>

      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.slice(0, 10).map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{vehicle.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vehicle.plateNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vehicle.driver}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    vehicle.status === 'moving' ? 'bg-green-100 text-green-800' :
                    vehicle.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                    vehicle.status === 'offline' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button 
                    onClick={handleEdit}
                    className="text-blue-600 hover:text-blue-700 font-semibold mr-4 hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 font-semibold hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-blue-100">Select a plan to add more vehicles to your fleet</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Plan */}
                <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-xl transition-all">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">₹999</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Up to 10 vehicles
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      30 days data retention
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Basic reports
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Email support
                    </li>
                  </ul>
                  <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                    Select Plan
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-blue-500 rounded-2xl p-6 relative hover:shadow-2xl transition-all bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Popular
                  </div>
                  <div className="text-center mb-6 mt-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">₹2,999</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Up to 50 vehicles
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      90 days data retention
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced reports
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority support
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Geofencing alerts
                    </li>
                  </ul>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
                    Select Plan
                  </button>
                </div>

                {/* Enterprise Plan */}
                <div className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-xl transition-all">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">Custom</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited vehicles
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Custom data retention
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Custom reports
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      24/7 dedicated support
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      API access
                    </li>
                  </ul>
                  <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                    Contact Sales
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
