'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Settings,
  Building2,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import { useIsSuperAdmin } from '@/lib/auth/client';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useSession();
  const isSuperAdmin = useIsSuperAdmin();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Define navigation items based on role
  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Appointments',
      href: '/admin/appointments',
      icon: Calendar,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Doctors',
      href: '/admin/doctors',
      icon: Stethoscope,
      roles: ['admin'],
    },
    {
      name: 'Patients',
      href: '/admin/patients',
      icon: Users,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UserCog,
      roles: ['admin'],
    },
    ...(isSuperAdmin
      ? [
          {
            name: 'All Clinics',
            href: '/admin/clinics',
            icon: Building2,
            roles: ['admin'],
          },
        ]
      : []),
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-300 hover:text-white"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">MedVoice</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-800">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">
                {user?.role || 'staff'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;
