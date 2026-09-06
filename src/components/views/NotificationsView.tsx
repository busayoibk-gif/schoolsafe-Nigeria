import React, { useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Filter,
  Search,
  Mail,
  Smartphone,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { store } from '../../services/store';
import { NotificationRecord } from '../../types';
import { formatLagosFullDate, getLagosTime } from '../../utils/nigerian';

export const NotificationsView: React.FC = () => {
  const notifications = store.notifications;
  const currentProfile = store.currentProfile;

  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'email'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'sent' | 'failed' | 'pending'>('all');
  const [eventFilter, setEventFilter] = useState<'all' | 'arrival' | 'pickup'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryAllState, setRetryAllState] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = notifications.filter((item) => {
    // If parent role, only show notifications where recipient is this parent
    if (currentProfile.role === 'parent' && item.recipient_name !== currentProfile.full_name) {
      return false;
    }

    if (channelFilter !== 'all' && item.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter) return false;
    if (eventFilter !== 'all' && item.event_type !== eventFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.recipient_name.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q) ||
        item.message_body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const failedCount = notifications.filter((n) => n.status === 'Failed').length;

  const handleRetryNotification = async (notificationId: string) => {
    setRetryingId(notificationId);
    await store.retryNotification(notificationId);
    setRetryingId(null);
  };

  const handleRetryAllFailed = async () => {
    setRetryAllState('Retrying all failed alerts...');
    const failed = store.notifications.filter((n) => n.status === 'Failed');
    for (const item of failed) {
      await store.retryNotification(item.id);
    }
    setRetryAllState('Retry process finished.');
    setTimeout(() => setRetryAllState(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Notification Dispatches & Delivery Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time audit log of SMS alerts (Termii API) and HTML Email alerts (Resend API) dispatched to parents.
          </p>
        </div>

        {failedCount > 0 && currentProfile.role !== 'parent' && (
          <button
            type="button"
            onClick={handleRetryAllFailed}
            disabled={Boolean(retryAllState)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            {retryAllState || `Retry All Failed (${failedCount})`}
          </button>
        )}
      </div>

      {/* Resilience notice */}
      <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
          <strong className="text-blue-950 dark:text-blue-100">Transaction Integrity:</strong> Attendance and Pickup entries are primary school security transactions. Under no circumstances is an attendance record or pickup release rejected if a third-party SMS or Email provider experiences network timeouts. Failed dispatches are safely queued here for retry.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search recipient, destination (+234)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Channel */}
          <div>
            <select
              value={channelFilter}
              onChange={(e: any) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Channels (SMS & Email)</option>
              <option value="sms">SMS Only (Termii)</option>
              <option value="email">Email Only (Resend)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="delivered">Delivered / Sent</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed Delivery</option>
            </select>
          </div>

          {/* Event */}
          <div>
            <select
              value={eventFilter}
              onChange={(e: any) => setEventFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Event Types</option>
              <option value="arrival">Morning Arrival Attendance</option>
              <option value="pickup">Afternoon Student Pickup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Showing {filteredLogs.length} Notification Records
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            No notification logs found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Recipient</th>
                  <th className="py-4 px-4">Channel & Destination</th>
                  <th className="py-4 px-4">Event</th>
                  <th className="py-4 px-4">Message Content</th>
                  <th className="py-4 px-4">Status & Provider</th>
                  <th className="py-4 px-4">Timestamp (WAT)</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{log.recipient_name}</td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        {log.channel === 'sms' ? (
                          <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                        <span className="font-mono text-xs">{log.destination}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.event_type === 'arrival'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                        }`}
                      >
                        {log.event_type}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate" title={log.message_body}>
                      <span className="text-slate-600 dark:text-slate-400">{log.message_body}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.status === 'Delivered' || log.status === 'Sent'
                              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                              : log.status === 'Failed'
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                              : 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                          }`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {log.provider} {log.provider_ref ? `(${log.provider_ref})` : ''}
                        </div>
                        {log.error_message && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold truncate max-w-xs mt-0.5">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {log.status === 'Failed' && currentProfile.role !== 'parent' && (
                        <button
                          type="button"
                          disabled={retryingId === log.id}
                          onClick={() => handleRetryNotification(log.id)}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1 border border-amber-200 dark:border-amber-800"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
