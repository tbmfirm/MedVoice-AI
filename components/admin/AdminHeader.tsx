'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useSession } from '@/lib/auth/client';
import { LogOut, User, Bell, ChevronDown } from 'lucide-react';
import OrganizationSwitcher from './OrganizationSwitcher';
import { useIsSuperAdmin } from '@/lib/auth/client';

const AdminHeader: React.FC = () => {
  const { user } = useSession();
  const isSuperAdmin = useIsSuperAdmin();
  const [showUserMenu, setShowUserMenu] = useState(false);


  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {isSuperAdmin && <OrganizationSwitcher />}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400">{user?.email || ''}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20">
                <div className="p-4 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400 mt-1">{user?.email || ''}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {user?.role || 'staff'}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/login' });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
