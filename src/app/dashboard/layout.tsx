'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Truck,
  Briefcase,
  Users2,
  PackageSearch,
  ArrowUpDown,
  FileText,
  TrendingUp,
  LogOut,
  Menu,
  X,
  HardHat,
  User,
  Bell,
  Settings,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: ('SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'PROJECT_MANAGER' | 'DATA_ENTRY_OPERATOR')[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER', 'DATA_ENTRY_OPERATOR'],
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderKanban,
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'],
  },
  {
    name: 'Suppliers',
    href: '/dashboard/suppliers',
    icon: Truck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'DATA_ENTRY_OPERATOR'],
  },
  {
    name: 'Contractors',
    href: '/dashboard/contractors',
    icon: Briefcase,
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'DATA_ENTRY_OPERATOR'],
  },
  {
    name: 'Employees & Labor',
    href: '/dashboard/employees',
    icon: Users2,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER', 'DATA_ENTRY_OPERATOR'],
  },
  {
    name: 'Materials',
    href: '/dashboard/materials',
    icon: PackageSearch,
    roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'DATA_ENTRY_OPERATOR'],
  },
  {
    name: 'Transactions',
    href: '/dashboard/transactions',
    icon: ArrowUpDown,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'DATA_ENTRY_OPERATOR'],
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER', 'DATA_ENTRY_OPERATOR'],
  },
  {
    name: 'Reports & P&L',
    href: '/dashboard/reports',
    icon: TrendingUp,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  },
  {
    name: 'User Management',
    href: '/dashboard/users',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER', 'DATA_ENTRY_OPERATOR'],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; date: string }[]>([]);

  // Sample quick notifications for due alerts as requested in phase description
  useEffect(() => {
    setNotifications([
      { id: '1', text: 'Supplier Apex Steel payment due in 3 days', date: 'Just now' },
      { id: '2', text: 'Low Inventory: Portland Cement is below 50 bags', date: '10 mins ago' },
      { id: '3', text: 'Salary payment due for Employee Sarah Jenkins', date: '1 hour ago' },
      { id: '4', text: 'Project Skyline Heights is approaching expected deadline', date: 'Yesterday' }
    ]);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-semibold tracking-wide">Loading portal session...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Next.js middleware handles redirect, return null here to avoid flicker
  }

  // Filter navigation links based on user role
  const allowedNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="h-9 w-9 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center text-cyan-400">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              CPMAS ERP
            </span>
            <p className="text-[10px] text-slate-500 font-medium -mt-0.5">Management Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border-l-2 border-cyan-500 pl-3.5'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100 pl-4'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card at footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase">
              {user.fullName.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{user.fullName}</p>
              <p className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-800/30 text-slate-400 border border-slate-700/80 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (backdrop + nav) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center text-cyan-400">
                  <HardHat className="h-4.5 w-4.5" />
                </div>
                <span className="font-bold text-sm text-cyan-400">CPMAS Mobile</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border-l-2 border-cyan-500'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase">
                  {user.fullName.slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">{user.fullName}</p>
                  <p className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wider">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 text-slate-400 text-xs font-bold rounded-lg cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-lg hover:bg-slate-800/40 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm lg:text-base font-bold text-slate-200 uppercase tracking-wider">
              {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Notification alert icon */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-lg hover:bg-slate-800/40 cursor-pointer"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between mb-3 border-b border-slate-850 pb-2">
                  <span className="text-xs font-bold text-slate-300">Live Due & Stock Alerts</span>
                  <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:text-slate-300">Clear all</button>
                </div>
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-4">No new alerts.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="text-xs p-2 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                        <p className="text-slate-300 font-medium leading-relaxed">{n.text}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">{n.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-slate-400 font-semibold">{user.fullName}</span>
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold uppercase">
                {user.fullName.slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content container */}
        <main className="flex-1 p-4 lg:p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
