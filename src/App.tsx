import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SupabaseModal } from './components/SupabaseModal';
import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { AttendanceView } from './components/views/AttendanceView';
import { PickupView } from './components/views/PickupView';
import { ClassesView } from './components/views/ClassesView';
import { ParentsView } from './components/views/ParentsView';
import { NotificationsView } from './components/views/NotificationsView';
import { ReportsView } from './components/views/ReportsView';
import { UsersView } from './components/views/UsersView';
import { SettingsView } from './components/views/SettingsView';
import { AuditLogsView } from './components/views/AuditLogsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [tabParams, setTabParams] = useState<any>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const currentProfile = store.currentProfile;

  // Handle role-based tab restrictions
  useEffect(() => {
    if (currentProfile.role === 'parent') {
      const parentAllowed = ['dashboard', 'students', 'attendance', 'pickup', 'notifications'];
      if (!parentAllowed.includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    } else if (currentProfile.role === 'staff') {
      const staffAllowed = ['dashboard', 'students', 'attendance', 'pickup', 'classes', 'parents', 'notifications', 'reports'];
      if (!staffAllowed.includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    }
  }, [currentProfile.role, currentTab]);

  const handleNavigate = (tab: string, params?: any) => {
    setTabParams(params || null);
    setCurrentTab(tab);
  };

  return (
    <div className="h-screen w-full flex flex-row bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden antialiased selection:bg-blue-200 dark:selection:bg-blue-900 selection:text-blue-950 dark:selection:text-blue-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onNavigateNotifications={() => handleNavigate('notifications')}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
          {currentTab === 'students' && <StudentsView onNavigate={handleNavigate} />}
          {currentTab === 'attendance' && <AttendanceView initialStudentId={tabParams?.studentId} />}
          {currentTab === 'pickup' && <PickupView initialStudentId={tabParams?.studentId} />}
          {currentTab === 'classes' && <ClassesView />}
          {currentTab === 'parents' && <ParentsView />}
          {currentTab === 'notifications' && <NotificationsView />}
          {currentTab === 'reports' && <ReportsView />}
          {currentTab === 'users' && <UsersView />}
          {currentTab === 'settings' && <SettingsView />}
          {currentTab === 'audit' && <AuditLogsView />}
        </main>
      </div>

      {/* Supabase Integration Modal */}
      {isSupabaseModalOpen && (
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      )}
    </div>
  );
}
