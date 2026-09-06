import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  RefreshCw,
  Key,
  AlertCircle,
} from 'lucide-react';
import { getCustomSupabaseConfig, updateCustomSupabaseConfig, getSupabase } from '../services/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'credentials'>('status');
  const [sqlContent, setSqlContent] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [loadingServer, setLoadingServer] = useState(false);

  const config = getCustomSupabaseConfig();
  const [inputUrl, setInputUrl] = useState(config.url || '');
  const [inputKey, setInputKey] = useState(config.key || '');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch server status
      setLoadingServer(true);
      fetch('/api/config/status')
        .then((res) => res.json())
        .then((data) => setServerStatus(data))
        .catch((err) => console.error('Failed to fetch server status', err))
        .finally(() => setLoadingServer(false));

      // Fetch SQL content
      fetch('/supabase-schema.sql')
        .then((res) => res.text())
        .then((txt) => setSqlContent(txt))
        .catch(() => {
          setSqlContent('-- Please refer to /supabase-schema.sql in the project root.');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    if (sqlContent) {
      navigator.clipboard.writeText(sqlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomSupabaseConfig(inputUrl, inputKey);
    setSaveMessage('Credentials saved! The application will refresh with active Supabase connection.');
  };

  const handleReset = () => {
    updateCustomSupabaseConfig('', '');
    setInputUrl('');
    setInputKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Database & API Integration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supabase PostgreSQL, RLS, Termii SMS & Resend Email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            System & Services Status
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            SQL Migration Schema & RLS
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Connect Custom Supabase
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300 text-sm space-y-4">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Supabase Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Supabase PostgreSQL & Auth</span>
                  </div>
                  {config.isConfigured ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Ready / Seed DB Loaded
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {config.isConfigured
                    ? `Connected to Supabase project at ${config.url}`
                    : 'The app is fully functional with the full Nigerian school schema and seed data loaded. You can attach your live Supabase project anytime via the "Connect Custom Supabase" tab or by supplying VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'}
                </p>
              </div>

              {/* Server APIs Status Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Server-Side Notification Integrations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Termii SMS */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>Termii SMS API</span>
                      {serverStatus?.hasTermiiKey ? (
                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px] font-bold">LIVE</span>
                      ) : (
                        <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded text-[10px] font-bold">SIMULATOR ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Sender ID: <code className="text-blue-700 dark:text-blue-400 font-mono">{serverStatus?.termiiSenderId || 'SchoolSafe'}</code>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dispatches arrival & pickup SMS to Nigerian parent phone numbers (+234).
                    </p>
                  </div>

                  {/* Resend Email */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>Resend Email API</span>
                      {serverStatus?.hasResendKey ? (
                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px] font-bold">LIVE</span>
                      ) : (
                        <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded text-[10px] font-bold">SIMULATOR ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      From: <code className="text-blue-700 dark:text-blue-400 font-mono">{serverStatus?.emailFrom || 'SchoolSafe Nigeria <notifications@schoolsafe.ng>'}</code>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dispatches HTML formatted arrival & pickup email alerts.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/60 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">Resilience guarantee:</strong> Even if an external SMS or email provider experiences latency or failure, the primary attendance and pickup records are never lost. Failures are stored with error logs and can be retried at any time from the Notifications tab.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Execute this SQL in your Supabase project's <strong>SQL Editor</strong> to configure all tables, foreign keys, unique constraints, and Row Level Security (RLS) policies.
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy SQL Schema'}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-blue-300 font-mono text-xs rounded-xl overflow-x-auto max-h-80 border border-slate-800 leading-relaxed select-all">
                  {sqlContent || 'Loading schema...'}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                You can link a live Supabase project by providing your project URL and publishable anon key.
              </p>

              {saveMessage && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs rounded-lg border border-blue-200 dark:border-blue-800">
                  {saveMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Publishable Anon Key (VITE_SUPABASE_PUBLISHABLE_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJh..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium"
                >
                  Clear Custom Credentials
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
