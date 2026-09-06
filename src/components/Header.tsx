import React, { useState, useEffect } from 'react';
import {
  Menu,
  Database,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { getLagosTime, formatLagosFullDate, getLagosDate } from '../utils/nigerian';
import { isSupabaseConfigured } from '../services/supabase';
import { store } from '../services/store';
import { useTheme } from '../services/theme';

interface HeaderProps {
  currentTab: string;
  onOpenMobileMenu: () => void;
  onOpenSupabaseModal: () => void;
  onNavigateNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenSupabaseModal,
  onNavigateNotifications,
}) => {
  const [lagosTime, setLagosTime] = useState<string>(getLagosTime());
  const todayLagos = getLagosDate();
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setLagosTime(getLagosTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTabTitle = (tab: string): { title: string; subtitle?: string } => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'School Overview',
          subtitle: `${formatLagosFullDate(todayLagos)} • ${lagosTime} WAT`,
        };
      case 'students':
        return {
          title: store.currentProfile.role === 'parent' ? 'My Children' : 'Student Registry',
          subtitle: 'Active students, parent contacts & pickup authorizations',
        };
      case 'attendance':
        return {
          title: 'Attendance Terminal',
          subtitle: `Daily arrival recording & late threshold tracking • ${lagosTime} WAT`,
        };
      case 'pickup':
        return {
          title: 'Pickup Management',
          subtitle: 'Authorized guardian verification & secure gate release',
        };
      case 'classes':
        return {
          title: 'Classes & Streams',
          subtitle: 'Stream management & 20-student capacity constraints',
        };
      case 'parents':
        return {
          title: 'Parents & Guardians',
          subtitle: 'Directory of verified parents and emergency contacts',
        };
      case 'notifications':
        return {
          title: 'Notification Logs',
          subtitle: 'Termii SMS & Resend Email delivery audits',
        };
      case 'reports':
        return {
          title: 'Reports & CSV Export',
          subtitle: 'Daily attendance sheets & pickup security records',
        };
      case 'users':
        return {
          title: 'Staff & Roles',
          subtitle: 'User access levels, administrator and teacher permissions',
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'School information, opening hours, and late threshold timings',
        };
      case 'audit':
        return {
          title: 'Audit Logs',
          subtitle: 'Immutable system event records and security tracking',
        };
      default:
        return {
          title: 'SchoolSafe Nigeria',
          subtitle: `${formatLagosFullDate(todayLagos)} • ${lagosTime} WAT`,
        };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);
  const unreadAlerts = store.notificationLogs.filter((n) => n.status === 'Failed').length;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-10 transition-colors">
      {/* Left: Mobile hamburger + Tab title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {title}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-md">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Operational Pill, Supabase status, Dark/Light Mode toggle & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Systems Operational Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Systems Operational</span>
        </div>

        {/* Supabase Database Button */}
        <button
          type="button"
          onClick={onOpenSupabaseModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          title="Supabase Database Configuration"
        >
          <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden md:inline">Supabase</span>
          {isSupabaseConfigured ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggle}
          className="p-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Dark and Light Mode"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications Icon Button */}
        <button
          type="button"
          onClick={onNavigateNotifications}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
          title="Notification Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </button>
      </div>
    </header>
  );
};
