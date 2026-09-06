import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';
import { store } from '../../services/store';
import { getLagosDate, formatLagosFullDate, formatClassStream } from '../../utils/nigerian';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'attendance' | 'pickup' | 'students' | 'capacity'>('attendance');
  const [selectedDate, setSelectedDate] = useState<string>(getLagosDate());
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('all');

  const classes = store.classes;
  const streams = store.streams;
  const allStudents = store.getAllStudentsWithDetails(selectedDate);
  const pickups = store.getPickupsForDate(selectedDate);

  // Filter students
  const filteredStudents = allStudents.filter((s) => {
    if (selectedClassId !== 'all' && s.class_id !== selectedClassId) return false;
    if (selectedStreamId !== 'all' && s.stream_id !== selectedStreamId) return false;
    return true;
  });

  // Generate and download CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `SchoolSafe_${reportType}_${selectedDate}.csv`;

    if (reportType === 'attendance') {
      headers = [
        'Student ID',
        'Student Name',
        'Class & Stream',
        'Date (WAT)',
        'Status',
        'Arrival Timestamp',
        'Recorded By Staff',
      ];
      rows = filteredStudents.map((s) => [
        `"${s.student_id}"`,
        `"${s.full_name}"`,
        `"${s.display_class}"`,
        `"${selectedDate}"`,
        `"${s.today_attendance?.status || 'Unmarked'}"`,
        `"${s.today_attendance ? new Date(s.today_attendance.timestamp).toLocaleTimeString() : 'N/A'}"`,
        `"${s.today_attendance?.recorded_by_name || 'N/A'}"`,
      ]);
    } else if (reportType === 'pickup') {
      headers = [
        'Student ID',
        'Student Name',
        'Class & Stream',
        'Date (WAT)',
        'Release Time (WAT)',
        'Picked Up By',
        'Relationship',
        'Releasing Staff',
        'Gate Notes',
      ];
      rows = pickups.map((p) => {
        const student = store.getStudentWithDetails(p.student_id);
        return [
          `"${student?.student_id || p.student_id}"`,
          `"${student?.full_name || 'Unknown'}"`,
          `"${student?.display_class || 'N/A'}"`,
          `"${p.date}"`,
          `"${p.exact_time}"`,
          `"${p.pickup_person_name}"`,
          `"${p.relationship}"`,
          `"${p.releasing_staff_name}"`,
          `"${p.remarks || ''}"`,
        ];
      });
    } else if (reportType === 'students') {
      headers = [
        'Student ID',
        'Full Name',
        'Class & Stream',
        'Gender',
        'Date of Birth',
        'Emergency Contact Name',
        'Emergency Phone',
        'Status',
      ];
      rows = filteredStudents.map((s) => [
        `"${s.student_id}"`,
        `"${s.full_name}"`,
        `"${s.display_class}"`,
        `"${s.gender}"`,
        `"${s.date_of_birth}"`,
        `"${s.emergency_contact_name}"`,
        `"${s.emergency_contact_phone}"`,
        `"${s.is_active ? 'Active' : 'Inactive'}"`,
      ]);
    } else if (reportType === 'capacity') {
      headers = [
        'Class Name',
        'Stream Name',
        'Current Enrolled Students',
        'Max Capacity',
        'Available Spaces',
        'Is Full',
      ];
      rows = streams.map((st) => {
        const stats = store.getStreamStats(st.id);
        return [
          `"${stats.className}"`,
          `"${stats.stream.name || 'Main'}"`,
          `"${stats.currentStudents}"`,
          `"${stats.capacity}"`,
          `"${stats.availableSpaces}"`,
          `"${stats.isFull ? 'YES' : 'NO'}"`,
        ];
      });
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            School Reports & CSV Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Export official attendance sheets, daily pickup security manifests, and student roster datasets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Export CSV File
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow-sm gap-1">
        <button
          onClick={() => setReportType('attendance')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
            reportType === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Attendance Report
        </button>
        <button
          onClick={() => setReportType('pickup')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
            reportType === 'pickup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pickup Logs Report
        </button>
        <button
          onClick={() => setReportType('students')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
            reportType === 'students'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Student Registry
        </button>
        <button
          onClick={() => setReportType('capacity')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
            reportType === 'capacity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Capacity Audit
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-slate-800 dark:text-slate-200 font-semibold focus:ring-0 text-xs p-0 cursor-pointer w-full"
            />
          </div>

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

          <div>
            <select
              value={selectedStreamId}
              onChange={(e) => setSelectedStreamId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">All Streams</option>
              {streams
                .filter((st) => selectedClassId === 'all' || st.class_id === selectedClassId)
                .map((st) => {
                  const cls = classes.find((c) => c.id === st.class_id);
                  return (
                    <option key={st.id} value={st.id}>
                      {formatClassStream(cls?.name || '', st.name)}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Data Preview ({formatLagosFullDate(selectedDate)})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Click "Export CSV File" above to download</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'attendance' && (
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Student ID</th>
                  <th className="py-4 px-4">Student Name</th>
                  <th className="py-4 px-4">Class & Stream</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Timestamp (WAT)</th>
                  <th className="py-4 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium">{s.student_id}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">{s.full_name}</td>
                    <td className="py-2.5 px-4">{s.display_class}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.today_attendance?.status === 'Present'
                            ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                            : s.today_attendance?.status === 'Late'
                            ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                            : s.today_attendance?.status === 'Absent'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {s.today_attendance?.status || 'Unmarked'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {s.today_attendance ? new Date(s.today_attendance.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{s.today_attendance?.recorded_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'pickup' && (
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Student</th>
                  <th className="py-4 px-4">Class</th>
                  <th className="py-4 px-4">Pickup Time</th>
                  <th className="py-4 px-4">Collected By</th>
                  <th className="py-4 px-4">Relationship</th>
                  <th className="py-4 px-4">Releasing Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {pickups.map((p) => {
                  const stu = store.getStudentWithDetails(p.student_id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">{stu?.full_name || 'Unknown'}</td>
                      <td className="py-2.5 px-4">{stu?.display_class || '—'}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{p.exact_time}</td>
                      <td className="py-2.5 px-4 font-medium">{p.pickup_person_name}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{p.relationship}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{p.releasing_staff_name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'capacity' && (
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Class & Stream</th>
                  <th className="py-4 px-4">Enrolled Students</th>
                  <th className="py-4 px-4">Capacity Limit</th>
                  <th className="py-4 px-4">Available Spaces</th>
                  <th className="py-4 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {streams.map((st) => {
                  const stats = store.getStreamStats(st.id);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">{stats.displayName}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold">{stats.currentStudents}</td>
                      <td className="py-2.5 px-4 font-mono">{stats.capacity}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {stats.availableSpaces}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            stats.isFull ? 'bg-red-600 text-white' : 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                          }`}
                        >
                          {stats.isFull ? 'FULL' : 'OPEN'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
