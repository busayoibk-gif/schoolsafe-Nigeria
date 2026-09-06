import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Users,
  CalendarCheck,
  UserCheck,
  GraduationCap,
  HeartHandshake,
  Bell,
  FileBarChart,
  UserCog,
  Settings,
  History,
  Menu,
  X,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { store } from '../services/store';
import { getLagosTime, formatLagosFullDate } from '../utils/nigerian';
import { UserRole } from '../types';
import { isSupabaseConfigured } from '../services/supabase';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSupabaseModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lagosTime, setLagosTime] = useState(getLagosTime());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const currentProfile = store.currentProfile;
  const school = store.school;

  useEffect(() => {
    const timer = setInterval(() => {
      setLagosTime(getLagosTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter navigation items based on user role
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'parent'] },
    { id: 'students', label: currentProfile.role === 'parent' ? 'My Children' : 'Students', icon: Users, roles: ['admin', 'staff', 'parent'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'staff', 'parent'] },
    { id: 'pickup', label: 'Student Pickup', icon: UserCheck, roles: ['admin', 'staff', 'parent'] },
    { id: 'classes', label: 'Classes & Streams', icon: GraduationCap, roles: ['admin', 'staff'] },
    { id: 'parents', label: 'Parents / Guardians', icon: HeartHandshake, roles: ['admin', 'staff'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'staff', 'parent'] },
    { id: 'reports', label: 'Reports & CSV', icon: FileBarChart, roles: ['admin', 'staff'] },
    { id: 'users', label: 'Staff & Users', icon: UserCog, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    { id: 'audit', label: 'Audit Logs', icon: History, roles: ['admin'] },
  ];

  const visibleNavItems = allNavItems.filter((item) =>
    item.roles.includes(currentProfile.role)
  );

  const handleRoleSwitch = (role: UserRole) => {
    store.setCurrentUserRole(role);
    setProfileDropdownOpen(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'School Administrator', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'staff':
        return { label: 'Teacher / Staff', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'parent':
        return { label: 'Parent / Guardian', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  const currentBadge = getRoleBadge(currentProfile.role);

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & School Info */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5 text-emerald-100" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-base tracking-tight leading-none">
                      SchoolSafe
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold uppercase rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      NG
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-[260px]">
                    {school.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Africa/Lagos Time Widget */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs text-slate-700">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-slate-900">{lagosTime}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-normal">WAT (Africa/Lagos)</span>
            </div>

            {/* Right: Database Status & Role Switcher */}
            <div className="flex items-center gap-2.5">
              {/* Supabase Status Button */}
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs"
                title="View Database & Supabase Integration"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Supabase DB</span>
                {isSupabaseConfigured ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected to Supabase" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Running with local PostgreSQL schema" />
                )}
              </button>

              {/* Role Switcher Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <img
                    src={currentProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                    alt={currentProfile.full_name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                      {currentProfile.full_name}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium leading-none">
                      {currentBadge.label}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Switch Active Role (Testing)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Test access controls & view the app as:
                      </p>
                    </div>

                    <div className="p-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => handleRoleSwitch('admin')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                          currentProfile.role === 'admin'
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium">Dr. Folashade Adeleke</div>
                          <div className="text-[11px] text-emerald-700">School Administrator</div>
                        </div>
                        {currentProfile.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleSwitch('staff')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                          currentProfile.role === 'staff'
                            ? 'bg-blue-50 text-blue-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium">Mr. Chinedu Eze</div>
                          <div className="text-[11px] text-blue-700">Teacher / Staff</div>
                        </div>
                        {currentProfile.role === 'staff' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleSwitch('parent')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                          currentProfile.role === 'parent'
                            ? 'bg-amber-50 text-amber-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium">Engr. Olumide Balogun</div>
                          <div className="text-[11px] text-amber-700">Parent (Ayomide & Boluwatife)</div>
                        </div>
                        {currentProfile.role === 'parent' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </button>
                    </div>

                    <div className="px-3 py-1.5 border-t border-slate-100 text-[11px] text-slate-400">
                      Logged in as {currentProfile.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden lg:block border-t border-slate-100 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 overflow-x-auto py-1.5 no-scrollbar">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">SchoolSafe Nigeria</span>
                  <p className="text-[10px] text-slate-500">{school.name}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Role Switcher */}
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Current Role
              </span>
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div className="font-medium text-slate-900">{currentProfile.full_name}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">{currentBadge.label}</div>
                </div>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lagosTime} (WAT)</span>
              </div>
              <div>{formatLagosFullDate()}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
