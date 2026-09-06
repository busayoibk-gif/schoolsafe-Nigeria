import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  UserCheck,
  Calendar,
  Filter,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  Send,
  UserPlus,
} from 'lucide-react';
import { store } from '../../services/store';
import { getLagosDate, formatLagosFullDate, formatClassStream } from '../../utils/nigerian';

interface DashboardViewProps {
  onNavigate: (tab: string, filterParams?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getLagosDate());
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('all');

  const classes = store.classes;
  const streams = store.streams;
  const allStudents = store.getAllStudentsWithDetails(selectedDate);
  const currentProfile = store.currentProfile;

  // Filter students
  const filteredStudents = allStudents.filter((s) => {
    if (selectedClassId !== 'all' && s.class_id !== selectedClassId) return false;
    if (selectedStreamId !== 'all' && s.stream_id !== selectedStreamId) return false;
    return true;
  });

  // Calculate metrics
  const totalStudents = filteredStudents.length;

  const presentCount = filteredStudents.filter(
    (s) => s.today_attendance?.status === 'Present'
  ).length;

  const lateCount = filteredStudents.filter(
    (s) => s.today_attendance?.status === 'Late'
  ).length;

  const absentCount = filteredStudents.filter(
    (s) => s.today_attendance?.status === 'Absent'
  ).length;

  const excusedCount = filteredStudents.filter(
    (s) => s.today_attendance?.status === 'Excused'
  ).length;

  const arrivedCount = presentCount + lateCount;
  const pickedUpCount = filteredStudents.filter((s) => Boolean(s.today_pickup)).length;
  const notYetPickedUpCount = Math.max(0, arrivedCount - pickedUpCount);

  // Available streams for selected class
  const availableStreams =
    selectedClassId === 'all'
      ? streams
      : streams.filter((st) => st.class_id === selectedClassId);

  // Sample stream for capacity spotlight in roster header
  const sampleStreamStats = streams.length > 0 ? store.getStreamStats(streams[0].id) : null;
  const streamCapacityPercent = sampleStreamStats
    ? Math.round((sampleStreamStats.currentStudents / sampleStreamStats.capacity) * 100)
    : 85;

  return (
    <div className="space-y-6">
      {/* Top Banner / School Operations Hub */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                School Operations Hub
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-medium border border-slate-700">
                WAT (Africa/Lagos)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, {currentProfile.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {currentProfile.role === 'parent'
                ? "Here is the real-time security, attendance, and pickup status for your linked children."
                : "Real-time student arrival logging, class capacity monitoring, and authorized student pickup security."}
            </p>
          </div>

          {currentProfile.role !== 'parent' && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Record Attendance
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pickup')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Student Pickup
              </button>
            </div>
          )}
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-600 opacity-15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Date & Class Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Dashboard Filter:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 text-slate-800 dark:text-slate-100 font-medium focus:ring-0 text-xs p-0 cursor-pointer"
              />
            </div>

            {/* Class filter */}
            {currentProfile.role !== 'parent' && (
              <>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedStreamId('all');
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>

                {/* Stream filter */}
                <select
                  value={selectedStreamId}
                  onChange={(e) => setSelectedStreamId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All Streams</option>
                  {availableStreams.map((st) => {
                    const cls = classes.find((c) => c.id === st.class_id);
                    const name = formatClassStream(cls?.name || '', st.name);
                    return (
                      <option key={st.id} value={st.id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </>
            )}

            {(selectedClassId !== 'all' || selectedStreamId !== 'all' || selectedDate !== getLagosDate()) && (
              <button
                onClick={() => {
                  setSelectedClassId('all');
                  setSelectedStreamId('all');
                  setSelectedDate(getLagosDate());
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Metrics 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Total Students
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalStudents}</h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">+12 this term</span>
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Present Today
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-500">{presentCount}</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {totalStudents > 0 ? `${Math.round((presentCount / totalStudents) * 100)}% Rate` : '0%'}
            </span>
          </div>
        </div>

        {/* Late Arrivals */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Late Arrivals
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-orange-500 dark:text-orange-400">{lateCount}</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Threshold: 08:15 AM</span>
          </div>
        </div>

        {/* Picked Up */}
        <div
          onClick={() => onNavigate('pickup')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Picked Up
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-400">{pickedUpCount}</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Remaining: {notYetPickedUpCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout (Live Roster + Security Quick Tools) */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left / Center Table (flex-[2]) */}
        <div className="flex-[2] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-w-0">
          {/* Header with Live Capacity Status */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-t-xl">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                {currentProfile.role === 'parent'
                  ? "Live Status – Linked Children"
                  : `Live Pickup & Attendance Status – ${sampleStreamStats?.displayName || 'Primary 3 (Wisdom)'}`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatLagosFullDate(selectedDate)}
              </p>
            </div>

            {currentProfile.role !== 'parent' && sampleStreamStats && (
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Capacity: <span className="text-blue-600 dark:text-blue-400">{sampleStreamStats.currentStudents}/{sampleStreamStats.capacity}</span>
                </div>
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${streamCapacityPercent}%` }}
                  />
                </div>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded uppercase">
                  {sampleStreamStats.availableSpaces} Slots Left
                </span>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                No student records found matching the active filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Arrival
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.slice(0, 10).map((stu) => {
                    const att = stu.today_attendance;
                    const pku = stu.today_pickup;
                    const latestNotif = store.notificationLogs.find((n) => n.student_id === stu.id);

                    // Formatted arrival time
                    const arrivalTime = att
                      ? new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                stu.photo_url ||
                                'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={stu.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stu.full_name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: {stu.student_id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {arrivalTime}
                        </td>

                        <td className="px-6 py-4">
                          {pku ? (
                            <span className="text-[10px] px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
                              Picked Up
                            </span>
                          ) : att ? (
                            <span
                              className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                                att.status === 'Present'
                                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                                  : att.status === 'Late'
                                  ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                                  : att.status === 'Absent'
                                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {att.status}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium uppercase">
                              Not Marked
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {latestNotif ? (
                            latestNotif.status === 'Failed' ? (
                              <span className="text-[10px] font-bold text-red-500 dark:text-red-400">
                                {latestNotif.channel} Failed
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                {latestNotif.channel} Sent ({new Date(latestNotif.sent_at || latestNotif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )
                          ) : att ? (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                              SMS Sent ({arrivalTime})
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {currentProfile.role !== 'parent' ? (
                            pku ? (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                By {pku.pickup_person_name} ({pku.exact_time})
                              </p>
                            ) : att ? (
                              <button
                                onClick={() => onNavigate('pickup', { studentId: stu.id })}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Record Pickup
                              </button>
                            ) : (
                              <button
                                onClick={() => onNavigate('attendance', { studentId: stu.id })}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Record Entry
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => onNavigate('students')}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side Panel: Security Quick Tools & Insight (flex-1) */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col p-6">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-4">Security Quick Tools</h4>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-between shadow-xs transition-colors"
            >
              <span>New Entry Recording</span>
              <span className="font-mono text-base">→</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('pickup')}
              className="w-full py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-sm flex items-center justify-between shadow-2xs transition-colors"
            >
              <span>Verify Pickup ID</span>
              <span className="font-mono text-base">→</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="w-full py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-sm flex items-center justify-between shadow-2xs transition-colors"
            >
              <span>Emergency Broadcast</span>
              <span className="text-red-500 text-lg font-bold">!</span>
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-900 dark:bg-slate-800/80 text-white p-4 rounded-xl relative overflow-hidden border border-slate-800 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-400">
                Administrator Insight
              </p>
              <p className="text-sm mt-2 relative z-10 text-slate-200">
                Current school capacity is at 82%. Consider opening{' '}
                <span className="text-blue-400 font-semibold">Primary 4 – Knowledge</span>{' '}
                stream for registration.
              </p>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-500 opacity-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Class Stream Capacities Spotlight */}
      {currentProfile.role !== 'parent' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Class Stream Capacities & Spaces
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Each stream has a strict maximum capacity of 20 students. Enforced for Wisdom and Knowledge.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('classes')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Manage Streams & Capacities <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {streams.slice(0, 8).map((st) => {
              const stats = store.getStreamStats(st.id);
              const percent = Math.min(100, Math.round((stats.currentStudents / stats.capacity) * 100));

              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    stats.isFull
                      ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                      : stats.availableSpaces <= 3
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {stats.displayName}
                    </span>
                    {stats.isFull ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                        Full
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase">
                        {stats.availableSpaces} spaces
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {stats.currentStudents} / {stats.capacity}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{percent}% filled</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stats.isFull
                          ? 'bg-rose-600'
                          : stats.availableSpaces <= 3
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
