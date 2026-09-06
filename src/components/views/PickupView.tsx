import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  UserX,
  FileCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { store } from '../../services/store';
import { StudentWithDetails, AuthorizedPickup } from '../../types';
import { getLagosDate, getLagosTime, formatLagosFullDate, formatClassStream } from '../../utils/nigerian';

interface PickupViewProps {
  initialStudentId?: string;
}

export const PickupView: React.FC<PickupViewProps> = ({ initialStudentId }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getLagosDate());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(() => {
    if (initialStudentId) {
      return store.getStudentWithDetails(initialStudentId) || null;
    }
    return null;
  });

  const [selectedPickupPerson, setSelectedPickupPerson] = useState<AuthorizedPickup | null>(null);
  const [pickupNotes, setPickupNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupResult, setPickupResult] = useState<{
    success: boolean;
    error?: string;
    notificationResult?: any;
    studentName?: string;
  } | null>(null);

  const [confirmDuplicateModal, setConfirmDuplicateModal] = useState(false);

  const currentProfile = store.currentProfile;
  const allStudents = store.getAllStudentsWithDetails(selectedDate);
  const pickupsToday = store.getPickupsForDate(selectedDate);

  // Filter students for search dropdown
  const matchingStudents = searchQuery.trim()
    ? allStudents.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.full_name.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q) ||
          s.display_class.toLowerCase().includes(q)
        );
      })
    : [];

  const handleSelectStudent = (stu: StudentWithDetails) => {
    setSelectedStudent(stu);
    setSelectedPickupPerson(null);
    setSearchQuery('');
    setPickupResult(null);
  };

  const handleConfirmPickup = async (forceOverwrite = false) => {
    if (!selectedStudent || !selectedPickupPerson) return;

    // Check if already picked up
    if (selectedStudent.today_pickup && !forceOverwrite) {
      setConfirmDuplicateModal(true);
      return;
    }

    setConfirmDuplicateModal(false);
    setIsProcessing(true);
    setPickupResult(null);

    const result = await store.recordPickup({
      student_id: selectedStudent.id,
      targetDate: selectedDate,
      pickup_person_id: selectedPickupPerson.id,
      remarks: pickupNotes,
      overrideDuplicate: forceOverwrite,
    });

    setIsProcessing(false);

    if (result.success) {
      setPickupResult({
        success: true,
        notificationResult: result.notificationResults,
        studentName: selectedStudent.full_name,
      });

      // Update student details
      const updated = store.getStudentWithDetails(selectedStudent.id, selectedDate);
      setSelectedStudent(updated);
      setSelectedPickupPerson(null);
      setPickupNotes('');
    } else {
      setPickupResult({
        success: false,
        error: result.error,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Secure Student Pickup Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Authorized gatekeeper release workflow. Prevents unauthorized release, records exact Lagos time, and dispatches parent alerts.
        </p>
      </div>

      {/* Success / Error Banner */}
      {pickupResult && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in duration-150 ${
            pickupResult.success
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {pickupResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold">
                {pickupResult.success
                  ? `Safe Release Verified: ${pickupResult.studentName} has been picked up!`
                  : `Pickup Blocked: ${pickupResult.error}`}
              </p>
              {pickupResult.success && (
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Notification status: SMS (Termii) & Email (Resend) dispatched to parents.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setPickupResult(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Duplicate Pickup Warning Modal */}
      {confirmDuplicateModal && selectedStudent && selectedStudent.today_pickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-800 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Duplicate Pickup Warning</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Student already released today</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>{selectedStudent.full_name}</strong> was already logged as picked up today at{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100 underline">{selectedStudent.today_pickup.exact_time}</span> by{' '}
              <strong>{selectedStudent.today_pickup.pickup_person_name}</strong>.
            </p>

            {currentProfile.role === 'admin' ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 rounded-lg text-xs border border-amber-200 dark:border-amber-800">
                <strong>Administrator Override:</strong> As a school administrator, you may record an authorized pickup correction.
              </div>
            ) : (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 rounded-lg text-xs border border-rose-200 dark:border-rose-800">
                Only an Administrator can override an already recorded pickup.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDuplicateModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              {currentProfile.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleConfirmPickup(true)}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Admin Override
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Pickup Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Search & Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Step 1: Search & Select Student
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Type student name or ID (e.g. SSN-2026)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-600"
              />

              {/* Autocomplete Dropdown */}
              {matchingStudents.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto z-20 divide-y divide-slate-100 dark:divide-slate-800">
                  {matchingStudents.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="p-3 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            s.photo_url ||
                            'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80&auto=format&fit=crop&q=80'
                          }
                          alt={s.full_name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{s.full_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {s.student_id} • {s.display_class}
                          </div>
                        </div>
                      </div>

                      {s.today_pickup ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                          Picked Up
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          In School
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick list of students waiting for pickup today */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Recently Arrived / In School Today:
              </span>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {allStudents
                  .filter((s) => s.today_attendance && (s.today_attendance.status === 'Present' || s.today_attendance.status === 'Late'))
                  .map((stu) => {
                    const isSelected = selectedStudent?.id === stu.id;
                    const isPickedUp = Boolean(stu.today_pickup);

                    return (
                      <div
                        key={stu.id}
                        onClick={() => handleSelectStudent(stu)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                            : isPickedUp
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              stu.photo_url ||
                              'https://images.unsplash.com/photo-1544717305-2782549b5136?w=80&auto=format&fit=crop&q=80'
                            }
                            alt={stu.full_name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{stu.full_name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{stu.display_class}</div>
                          </div>
                        </div>

                        {isPickedUp ? (
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded">
                            Picked Up
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/50 px-1.5 py-0.5 rounded uppercase">
                            Ready
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification & Release Confirmation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedStudent ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              {/* Selected Student Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      selectedStudent.photo_url ||
                      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80'
                    }
                    alt={selectedStudent.full_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 shadow-xs"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedStudent.full_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-mono font-semibold">{selectedStudent.student_id}</span>
                      <span>•</span>
                      <span className="font-medium text-blue-700 dark:text-blue-400">{selectedStudent.display_class}</span>
                    </div>
                  </div>
                </div>

                {selectedStudent.today_pickup ? (
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 rounded-lg text-right">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">Picked Up Today</span>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300">
                      Released at {selectedStudent.today_pickup.exact_time} by {selectedStudent.today_pickup.pickup_person_name}
                    </span>
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold text-xs rounded-full inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    Currently In School
                  </span>
                )}
              </div>

              {/* Step 2: Select Authorized Person */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Step 2: Verify & Select Authorized Person
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Only active authorized contacts can pick up
                  </span>
                </div>

                {selectedStudent.authorized_pickups.filter((ap) => ap.is_active).length === 0 ? (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Security Alert:</strong> No active authorized pickup persons registered for this student. Unauthorized pickup cannot proceed. Please contact school administration.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedStudent.authorized_pickups
                      .filter((ap) => ap.is_active)
                      .map((ap) => {
                        const isSelected = selectedPickupPerson?.id === ap.id;

                        return (
                          <div
                            key={ap.id}
                            onClick={() => setSelectedPickupPerson(ap)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <img
                              src={
                                ap.photo_url ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={ap.full_name}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                                  {ap.full_name}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                                {ap.relationship}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {ap.phone}
                              </div>
                              {ap.id_number_ref && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  ID: {ap.id_number_ref}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Step 3: Release Notes & Confirmation Button */}
              {selectedPickupPerson && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Step 3: Verification & Release
                  </h3>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Gate Notes / Verification Observations (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Visual ID confirmed, driven in silver Corolla KJA-294AB"
                      value={pickupNotes}
                      onChange={(e) => setPickupNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                      <span>Releasing Staff:</span>
                      <span>{currentProfile.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Exact Release Time:</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">{getLagosTime()} (WAT)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dispatch Notifications:</span>
                      <span className="text-blue-700 dark:text-blue-400 font-medium">Instant SMS (Termii) & Email (Resend)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleConfirmPickup(false)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-5 h-5" />
                    {isProcessing ? 'Verifying & Recording Pickup...' : `Confirm & Release ${selectedStudent.full_name}`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Student Selected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Search or pick a student on the left panel to inspect authorized pickup persons, verify identification, and log safe release.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pickups Log Table for the day */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Completed Pickups Log — {formatLagosFullDate(selectedDate)} ({pickupsToday.length})
            </h3>
          </div>
        </div>

        {pickupsToday.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            No students have been picked up yet for {formatLagosFullDate(selectedDate)}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Student</th>
                  <th className="py-4 px-4">Picked Up By</th>
                  <th className="py-4 px-4">Relationship</th>
                  <th className="py-4 px-4">Time (WAT)</th>
                  <th className="py-4 px-4">Releasing Staff</th>
                  <th className="py-4 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pickupsToday.map((p) => {
                  const stu = store.getStudentWithDetails(p.student_id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{stu?.full_name || 'Unknown'}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{p.pickup_person_name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.relationship}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{p.exact_time}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.releasing_staff_name}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 italic">{p.remarks || '—'}</td>
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
