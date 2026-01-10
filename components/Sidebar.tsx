'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, FileText, Settings, ChevronRight, HelpCircle, Zap } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Vehicles', href: '/dashboard/vehicles', icon: Truck, badge: null },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText, badge: null },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, badge: null },
  { name: 'Help & Support', href: '/dashboard/help', icon: HelpCircle, badge: null },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col shadow-2xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Fleetzi</h1>
            <p className="text-xs text-blue-300 font-medium">GPS Fleet Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</p>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50' 
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
              
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
              <span className="font-semibold flex-1">{item.name}</span>
              
              {/* Arrow on hover */}
              <ChevronRight className={`w-4 h-4 transition-all duration-200 ${
                isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
              }`} />
              
              {item.badge && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">System Status</h3>
              <p className="text-xs text-blue-300">All systems operational</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Uptime</span>
            <span className="text-green-400 font-bold">99.9%</span>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="p-4 border-t border-slate-700/50">
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all group text-slate-300 hover:text-white">
          <HelpCircle className="w-5 h-5" />
          <span className="font-semibold text-sm flex-1 text-left">Help & Support</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
