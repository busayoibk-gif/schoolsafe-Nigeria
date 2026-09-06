import React, { useState } from 'react';
import {
  Settings,
  School,
  Clock,
  Shield,
  Bell,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
  Monitor,
  Palette,
} from 'lucide-react';
import { store } from '../../services/store';
import { useTheme, ThemeMode } from '../../services/theme';

export const SettingsView: React.FC = () => {
  const school = store.school;
  const currentProfile = store.currentProfile;
  const { mode, isDark, setMode } = useTheme();

  const [schoolName, setSchoolName] = useState(school.name);
  const [schoolAddress, setSchoolAddress] = useState(school.address || '');
  const [openingTime, setOpeningTime] = useState('07:30');
  const [lateThreshold, setLateThreshold] = useState('08:15');
  const [closingTime, setClosingTime] = useState('15:30');
  const [senderId, setSenderId] = useState('SchoolSafe');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.school.name = schoolName;
    store.school.address = schoolAddress;
    store.logAudit('Updated school settings and timings', 'school', store.school.id, {
      openingTime,
      lateThreshold,
      closingTime,
      senderId,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (currentProfile.role !== 'admin') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <Lock className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          System settings can only be managed by a verified School Administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          School Configuration & Timings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Operating parameters for Africa/Lagos timezone, appearance preferences, Termii SMS sender identities, and attendance thresholds.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200 text-xs rounded-xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-semibold">School settings updated and recorded to the audit log.</span>
        </div>
      )}

      {/* Appearance & Theme Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Display Appearance</h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Currently active: <strong className="text-blue-600 dark:text-blue-400 capitalize">{mode} ({isDark ? 'Dark' : 'Light'})</strong>
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose your interface appearance preference. Changes apply instantly across the dashboard and persist in your browser.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light mode option */}
          <button
            type="button"
            onClick={() => setMode('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              mode === 'light'
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`p-2 rounded-lg ${mode === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Light Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">High-contrast daytime view</div>
            </div>
          </button>

          {/* Dark mode option */}
          <button
            type="button"
            onClick={() => setMode('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              mode === 'dark'
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`p-2 rounded-lg ${mode === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Dark Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Eye-friendly evening view</div>
            </div>
          </button>

          {/* System option */}
          <button
            type="button"
            onClick={() => setMode('system')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
              mode === 'system'
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`p-2 rounded-lg ${mode === 'system' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">System Match</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Syncs with OS settings</div>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Identity */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <School className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Institution Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">School Name *</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
              <input
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Attendance Timings */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              School Hours & Thresholds (Africa/Lagos WAT)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Morning Gate Opening Time
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Late Arrival Threshold
              </label>
              <input
                type="time"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-bold text-amber-800 dark:text-amber-400 focus:ring-1 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Arrivals after this time automatically flag as "Late".
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dismissal & Pickup Time
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Messaging Configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notification Identifiers</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Termii SMS Sender ID (Max 11 chars)
              </label>
              <input
                type="text"
                maxLength={11}
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Sender ID displayed on parents' Nigerian mobile phones (+234).
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resend Email From Address
              </label>
              <input
                type="text"
                value="notifications@schoolsafe.ng"
                disabled
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-500 dark:text-slate-400 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

