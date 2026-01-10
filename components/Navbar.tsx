'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, User, LogOut, Menu, Settings, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getRecentAlerts } from '@/lib/data';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      const alerts = await getRecentAlerts(5);
      setNotifications(alerts);
      setUnreadCount(alerts.length);
    };
    loadNotifications();
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <header className="bg-white border-b-2 border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Welcome back, {user?.name}
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Track and manage your fleet in real-time
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserDropdown(false);
                }}
                className="relative p-2.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all group"
              >
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{unreadCount} unread alerts</p>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityColor(notification.severity)}`}>
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {notification.type.replace('_', ' ').toUpperCase()}
                                  </p>
                                  <button
                                    onClick={() => clearNotification(notification.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                  </span>
                                  <span>•</span>
                                  <span className="font-medium">{notification.vehicleName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">All caught up!</p>
                        <p className="text-sm text-gray-400 mt-1">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50">
                  {/* User Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => router.push('/dashboard/settings')}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                    >
                      <Settings className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="font-medium">Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-semibold">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
