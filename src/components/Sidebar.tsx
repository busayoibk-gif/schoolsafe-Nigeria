import React, { useState } from 'react';
import {
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
  CheckCircle2,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { store } from '../services/store';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const currentProfile = store.currentProfile;
  const school = store.school;

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'parent'] },
    { id: 'students', label: currentProfile.role === 'parent' ? 'My Children' : 'Students', icon: Users, roles: ['admin', 'staff', 'parent'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'staff', 'parent'] },
    { id: 'pickup', label: 'Pickup Management', icon: UserCheck, roles: ['admin', 'staff', 'parent'] },
    { id: 'classes', label: 'Classes & Streams', icon: GraduationCap, roles: ['admin', 'staff'] },
    { id: 'parents', label: 'Parents/Guardians', icon: HeartHandshake, roles: ['admin', 'staff'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'staff', 'parent'] },
    { id: 'reports', label: 'Reports & CSV', icon: FileBarChart, roles: ['admin', 'staff'] },
    { id: 'users', label: 'Staff & Roles', icon: UserCog, roles: ['admin'] },
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

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'staff':
        return 'Staff / Teacher';
      case 'parent':
        return 'Parent / Guardian';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800/80">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => {
              onSelectTab('dashboard');
              onCloseMobile();
            }}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-lg italic shadow-xs">
              S
            </div>
            <div>
              <div className="font-bold text-white text-base leading-tight">SchoolSafe</div>
              <span className="text-xs font-normal text-slate-400">Nigeria v1.0</span>
            </div>
          </div>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Institution label */}
        <div className="px-6 pt-3 pb-1">
          <p className="text-[11px] font-medium text-slate-400 truncate">
            {school.name}
          </p>
        </div>

        {/* Nav Links */}
        <nav className="px-4 space-y-1 mt-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-3 shrink-0 ${
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Role Switcher */}
      <div className="p-4 border-t border-slate-800 relative">
        <button
          type="button"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {getInitials(currentProfile.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentProfile.full_name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
                {getRoleLabel(currentProfile.role)}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
              profileDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Role Switching Dropdown */}
        {profileDropdownOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-slate-800 dark:text-slate-100">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Switch Role (Simulate Access)
              </p>
            </div>

            <div className="p-1 space-y-1">
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                  currentProfile.role === 'admin'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Dr. Folashade Adeleke</div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400">School Administrator</div>
                </div>
                {currentProfile.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('staff')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                  currentProfile.role === 'staff'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Mr. Chinedu Eze</div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400">Teacher / Staff</div>
                </div>
                {currentProfile.role === 'staff' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('parent')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                  currentProfile.role === 'parent'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Engr. Olumide Balogun</div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400">Parent (Ayomide & Boluwatife)</div>
                </div>
                {currentProfile.role === 'parent' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </button>
            </div>

            <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
              {currentProfile.email}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col border-r border-slate-800 shrink-0 h-screen select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] bg-slate-900 text-slate-300 h-full shadow-2xl z-10 flex flex-col border-r border-slate-800">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
