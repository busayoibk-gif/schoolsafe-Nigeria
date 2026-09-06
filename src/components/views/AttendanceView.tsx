import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserX,
  ShieldCheck,
  Calendar,
  Filter,
  Search,
  Bell,
  AlertTriangle,
  Send,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import { store } from '../../services/store';
import { AttendanceStatus } from '../../types';
import { getLagosDate, getLagosTime, formatLagosFullDate, formatClassStream } from '../../utils/nigerian';

interface AttendanceViewProps {
  initialStudentId?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialStudentId }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getLagosDate());
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [notificationStatus, setNotificationStatus] = useState<{
    studentName: string;
    status: AttendanceStatus;
    result: any;
  } | null>(null);

  const [confirmOverwrite, setConfirmOverwrite] = useState<{
    studentId: string;
    studentName: string;
    existingStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
  } | null>(null);

  const classes = store.classes;
  const streams = store.streams;
  const currentProfile = store.currentProfile;
  const allStudents = store.getAllStudentsWithDetails(selectedDate);

  // Filter students
  const filteredStudents = allStudents.filter((s) => {
    if (selectedClassId !== 'all' && s.class_id !== selectedClassId) return false;
    if (selectedStreamId !== 'all' && s.stream_id !== selectedStreamId) return false;

    if (filterStatus !== 'all') {
      if (filterStatus === 'unmarked' && s.today_attendance) return false;
      if (filterStatus !== 'unmarked' && s.today_attendance?.status !== filterStatus) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.display_class.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableStreams =
    selectedClassId === 'all'
      ? streams
      : streams.filter((st) => st.class_id === selectedClassId);

  // Handle marking attendance
  const handleMarkAttendance = async (
    studentId: string,
    status: AttendanceStatus,
    forceOverwrite = false
  ) => {
    const student = allStudents.find((s) => s.id === studentId);
    if (!student) return;

    // Check if already marked today
    if (student.today_attendance && !forceOverwrite) {
      if (student.today_attendance.status === status) return; // Same status, no change
      setConfirmOverwrite({
        studentId,
        studentName: student.full_name,
        existingStatus: student.today_attendance.status,
        newStatus: status,
      });
      return;
    }

    setConfirmOverwrite(null);

    const result = await store.recordAttendance({
      student_id: studentId,
      targetDate: selectedDate,
      status,
      overrideDuplicate: forceOverwrite,
    });

    if (result.success) {
      setNotificationStatus({
        studentName: student.full_name,
        status,
        result: result.notificationResults,
      });

      // Clear alert banner after 5 seconds
      setTimeout(() => {
        setNotificationStatus(null);
      }, 5000);
    }
  };

  // Bulk mark all unmarked in current view as Present
  const handleMarkAllUnmarkedPresent = async () => {
    const unmarked = filteredStudents.filter((s) => !s.today_attendance);
    for (const stu of unmarked) {
      await store.recordAttendance({
        student_id: stu.id,
        targetDate: selectedDate,
        status: 'Present',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Student Attendance Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official morning arrival logging with automatic Lagos time recording and instant parent SMS/Email alerts.
          </p>
        </div>

        {currentProfile.role !== 'parent' && (
          <button
            type="button"
            onClick={handleMarkAllUnmarkedPresent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Filtered as Present
          </button>
        )}
      </div>

      {/* Notification Toast / Alert Banner */}
      {notificationStatus && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
                Attendance Recorded: {notificationStatus.studentName} marked as{' '}
                <span className="underline">{notificationStatus.status}</span>
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                Timestamp: {getLagosTime()} (Africa/Lagos). Parent notification dispatched via{' '}
                {notificationStatus.result?.channels?.join(' & ') || 'SMS/Email'}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotificationStatus(null)}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overwrite Confirmation Dialog */}
      {confirmOverwrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-amber-800 dark:text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Duplicate Attendance Record</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Notice of existing daily record</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>{confirmOverwrite.studentName}</strong> is already recorded today as{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100 underline">{confirmOverwrite.existingStatus}</span>.
              Do you want to update their status to{' '}
              <span className="font-bold text-blue-700 dark:text-blue-400 underline">{confirmOverwrite.newStatus}</span>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmOverwrite(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Keep Existing
              </button>
              <button
                type="button"
                onClick={() =>
                  handleMarkAttendance(
                    confirmOverwrite.studentId,
                    confirmOverwrite.newStatus,
                    true
                  )
                }
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-slate-800 dark:text-slate-100 font-semibold focus:ring-0 text-xs p-0 cursor-pointer w-full"
            />
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Class Filter */}
          {currentProfile.role !== 'parent' && (
            <>
              <div>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedStreamId('all');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stream Filter */}
              <div>
                <select
                  value={selectedStreamId}
                  onChange={(e) => setSelectedStreamId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All Streams</option>
                  {availableStreams.map((st) => {
                    const cls = classes.find((c) => c.id === st.class_id);
                    return (
                      <option key={st.id} value={st.id}>
                        {formatClassStream(cls?.name || '', st.name)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </>
          )}

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              <option value="unmarked">Unmarked Only</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Attendance for {formatLagosFullDate(selectedDate)} ({filteredStudents.length} Students)
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            No students found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Student</th>
                  <th className="py-4 px-4">Class & Stream</th>
                  <th className="py-4 px-4">Current Status</th>
                  <th className="py-4 px-4">Arrival Time (WAT)</th>
                  <th className="py-4 px-4">Recorded By</th>
                  <th className="py-4 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((stu) => {
                  const att = stu.today_attendance;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              stu.photo_url ||
                              'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={stu.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{stu.full_name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{stu.student_id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{stu.display_class}</span>
                      </td>

                      <td className="py-3 px-4">
                        {att ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                          <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">Unmarked</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {att ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            {new Date(att.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {att ? (
                          <span className="text-slate-600 dark:text-slate-400">{att.recorded_by_name}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {currentProfile.role !== 'parent' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(stu.id, 'Present')}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                att?.status === 'Present'
                                  ? 'bg-green-600 text-white shadow-xs'
                                  : 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/60'
                              }`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(stu.id, 'Late')}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                att?.status === 'Late'
                                  ? 'bg-orange-500 text-white shadow-xs'
                                  : 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60'
                              }`}
                            >
                              Late
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(stu.id, 'Absent')}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                att?.status === 'Absent'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60'
                              }`}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(stu.id, 'Excused')}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                att?.status === 'Excused'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                              }`}
                            >
                              Excused
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Read-only parent view</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
