import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  UserCheck,
  ShieldAlert,
  Phone,
  Mail,
  Calendar,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  Camera,
  HeartHandshake,
} from 'lucide-react';
import { store } from '../../services/store';
import { StudentWithDetails, Student, AuthorizedPickup } from '../../types';
import { formatClassStream, parseNigerianPhone, formatLagosFullDate } from '../../utils/nigerian';

interface StudentsViewProps {
  onNavigate: (tab: string, params?: any) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddPickupModalOpen, setIsAddPickupModalOpen] = useState(false);

  // Form states for Add Student
  const [formStudentId, setFormStudentId] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formDob, setFormDob] = useState('2018-01-01');
  const [formGender, setFormGender] = useState<'Male' | 'Female'>('Male');
  const [formClassId, setFormClassId] = useState(store.classes[0]?.id || '');
  const [formStreamId, setFormStreamId] = useState(
    store.streams.find((s) => s.class_id === store.classes[0]?.id)?.id || ''
  );
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formParentId, setFormParentId] = useState(store.parents[0]?.id || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form states for Add Authorized Pickup
  const [pickupFullName, setPickupFullName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupRelationship, setPickupRelationship] = useState('Mother');
  const [pickupIdRef, setPickupIdRef] = useState('');
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState('');
  const [pickupError, setPickupError] = useState<string | null>(null);

  const classes = store.classes;
  const streams = store.streams;
  const parents = store.parents;
  const currentProfile = store.currentProfile;

  const allStudents = store.getAllStudentsWithDetails();

  // Search and filter logic
  const filteredStudents = allStudents.filter((stu) => {
    if (statusFilter === 'active' && !stu.is_active) return false;
    if (statusFilter === 'inactive' && stu.is_active) return false;
    if (selectedClassFilter !== 'all' && stu.class_id !== selectedClassFilter) return false;
    if (selectedStreamFilter !== 'all' && stu.stream_id !== selectedStreamFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = stu.full_name.toLowerCase().includes(q);
      const matchId = stu.student_id.toLowerCase().includes(q);
      const matchClass = stu.display_class.toLowerCase().includes(q);
      return matchName || matchId || matchClass;
    }

    return true;
  });

  // Handle Class change in Add Student Form to auto-select valid stream
  const handleFormClassChange = (newClassId: string) => {
    setFormClassId(newClassId);
    const validStreams = streams.filter((s) => s.class_id === newClassId);
    if (validStreams.length > 0) {
      setFormStreamId(validStreams[0].id);
    }
  };

  // Check selected stream capacity stats in real-time in the form
  const selectedStreamStats = formStreamId ? store.getStreamStats(formStreamId) : null;

  // Handle submit Add Student
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const result = store.addStudent({
      student_id: formStudentId,
      full_name: formFullName,
      date_of_birth: formDob,
      gender: formGender,
      class_id: formClassId,
      stream_id: formStreamId,
      emergency_contact_name: formEmergencyName,
      emergency_contact_phone: formEmergencyPhone,
      photo_url: formPhotoUrl || undefined,
      parent_ids: formParentId ? [formParentId] : [],
    });

    if (!result.success) {
      setFormError(result.error || 'Failed to add student');
      return;
    }

    setFormSuccess(`Student ${result.student?.full_name} enrolled successfully!`);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormSuccess(null);
      // Reset form
      setFormStudentId('');
      setFormFullName('');
      setFormEmergencyName('');
      setFormEmergencyPhone('');
    }, 1200);
  };

  // Handle submit Add Authorized Pickup Person
  const handleCreateAuthorizedPickup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setPickupError(null);

    const result = store.addAuthorizedPickup({
      student_id: selectedStudent.id,
      full_name: pickupFullName,
      phone: pickupPhone,
      relationship: pickupRelationship,
      id_number_ref: pickupIdRef,
      photo_url: pickupPhotoUrl,
    });

    if (!result.success) {
      setPickupError(result.error || 'Failed to add pickup person');
      return;
    }

    // Refresh selected student details
    const updated = store.getStudentWithDetails(selectedStudent.id);
    setSelectedStudent(updated);
    setIsAddPickupModalOpen(false);
    setPickupFullName('');
    setPickupPhone('');
    setPickupIdRef('');
    setPickupPhotoUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {currentProfile.role === 'parent' ? 'My Children' : 'Student Registry & Profiles'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentProfile.role === 'parent'
              ? 'Official registration records, security pickup list, and attendance logs for your children.'
              : 'Manage student records, stream enrollments, authorized pickup registries, and emergency contacts.'}
          </p>
        </div>

        {currentProfile.role === 'admin' && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search name, ID (e.g. SSN-2026)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Class Filter */}
          {currentProfile.role !== 'parent' && (
            <>
              <div>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    setSelectedClassFilter(e.target.value);
                    setSelectedStreamFilter('all');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
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
                  value={selectedStreamFilter}
                  onChange={(e) => setSelectedStreamFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All Streams</option>
                  {streams
                    .filter((st) => selectedClassFilter === 'all' || st.class_id === selectedClassFilter)
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

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Showing {filteredStudents.length} Students
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            No student records found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Student</th>
                  <th className="py-4 px-4">Class & Stream</th>
                  <th className="py-4 px-4">Gender & DOB</th>
                  <th className="py-4 px-4">Authorized Pickups</th>
                  <th className="py-4 px-4">Parent / Guardian</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((stu) => {
                  const activePickupsCount = stu.authorized_pickups.filter((ap) => ap.is_active).length;
                  const primaryParent = stu.parents[0];

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              stu.photo_url ||
                              'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80'
                            }
                            alt={stu.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{stu.full_name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                              ID: {stu.student_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                          {stu.display_class}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{stu.gender}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{formatLagosFullDate(stu.date_of_birth)}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(stu)}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{activePickupsCount} Authorized Persons</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        {primaryParent ? (
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{primaryParent.full_name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{primaryParent.phone}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">None linked</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            stu.is_active
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {stu.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(stu)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Full Profile & Pickup List"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {currentProfile.role !== 'parent' && (
                            <button
                              type="button"
                              onClick={() => onNavigate('pickup', { studentId: stu.id })}
                              className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                            >
                              Pickup
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: View Full Student Profile & Authorized Pickups */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedStudent.photo_url ||
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80'
                  }
                  alt={selectedStudent.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-600 shadow-xs"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedStudent.full_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold">{selectedStudent.student_id}</span>
                    <span>•</span>
                    <span className="font-medium text-blue-700 dark:text-blue-400">{selectedStudent.display_class}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Basic Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Gender</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{selectedStudent.gender}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Date of Birth</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {formatLagosFullDate(selectedStudent.date_of_birth)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Class Stream</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{selectedStudent.display_class}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Status</span>
                  <span
                    className={`text-xs font-bold ${
                      selectedStudent.is_active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {selectedStudent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  Primary Emergency Contact
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedStudent.emergency_contact_name}
                  </span>
                  <span className="font-mono text-amber-900 dark:text-amber-300 font-bold">
                    {selectedStudent.emergency_contact_phone}
                  </span>
                </div>
              </div>

              {/* Authorized Pickup Persons Section (Crucial security requirement) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Authorized Pickup Persons ({selectedStudent.authorized_pickups.length})
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Only active authorized persons listed here can collect this student during pickup.
                    </p>
                  </div>

                  {currentProfile.role !== 'parent' && (
                    <button
                      type="button"
                      onClick={() => setIsAddPickupModalOpen(true)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Pickup Person
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedStudent.authorized_pickups.map((ap) => (
                    <div
                      key={ap.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                        ap.is_active
                          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <img
                        src={
                          ap.photo_url ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={ap.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{ap.full_name}</div>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                              ap.is_active
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {ap.is_active ? 'Authorized' : 'Disabled'}
                          </span>
                        </div>
                        <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">{ap.relationship}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{ap.phone}</div>
                        {ap.id_number_ref && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            Ref: {ap.id_number_ref}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Parents */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Linked Parents / Guardians
                </h4>
                <div className="space-y-2">
                  {selectedStudent.parents.map((par) => (
                    <div
                      key={par.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {par.full_name} ({par.relationship})
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{par.phone}</span>
                          <span>•</span>
                          <span>{par.email || 'No email'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          {par.notification_preference === 'email_and_sms'
                            ? 'Email + SMS'
                            : par.notification_preference === 'email_only'
                            ? 'Email Only'
                            : 'SMS Only'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              {currentProfile.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    store.toggleStudentStatus(selectedStudent.id);
                    const updated = store.getStudentWithDetails(selectedStudent.id);
                    setSelectedStudent(updated);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedStudent.is_active
                      ? 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {selectedStudent.is_active ? 'Deactivate Student' : 'Reactivate Student'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 ml-auto"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Student (With Strict Class Capacity Enforcement) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Student</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify stream capacity and assign to Wisdom or Knowledge
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStudent} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Class & Stream Selection with Real-Time Capacity Badge */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>Class & Stream Assignment</span>
                  {selectedStreamStats && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedStreamStats.isFull
                          ? 'bg-rose-600 text-white'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {selectedStreamStats.displayName}: {selectedStreamStats.currentStudents}/
                      {selectedStreamStats.capacity} (
                      {selectedStreamStats.isFull
                        ? 'Class Full'
                        : `${selectedStreamStats.availableSpaces} spaces remaining`}
                      )
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Class</label>
                    <select
                      value={formClassId}
                      onChange={(e) => handleFormClassChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Stream</label>
                    <select
                      value={formStreamId}
                      onChange={(e) => setFormStreamId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    >
                      {streams
                        .filter((st) => st.class_id === formClassId)
                        .map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name || 'Single Stream'} ({st.capacity} max)
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {selectedStreamStats?.isFull && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cannot enroll another student. Only an Administrator can increase this stream's capacity.
                  </p>
                )}
              </div>

              {/* Student Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Student ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. SSN-2026-099"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="First & Last Name"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Gender & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                  <select
                    value={formGender}
                    onChange={(e: any) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Emergency Contact Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Folake Adeleke"
                      value={formEmergencyName}
                      onChange={(e) => setFormEmergencyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Emergency Phone (+234 format) *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0803 123 4567"
                      value={formEmergencyPhone}
                      onChange={(e) => setFormEmergencyPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Link Parent */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Registered Parent / Guardian
                </label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">None / Add later</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.relationship}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formPhotoUrl}
                  onChange={(e) => setFormPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedStreamStats?.isFull}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  Save & Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Authorized Pickup Person */}
      {isAddPickupModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add Authorized Pickup Person</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">For {selectedStudent.full_name}</p>
              </div>
              <button
                onClick={() => setIsAddPickupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAuthorizedPickup} className="p-6 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              {pickupError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
                  {pickupError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mallam Haruna Bello"
                  value={pickupFullName}
                  onChange={(e) => setPickupFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nigerian Phone Number (+234) *
                </label>
                <input
                  type="tel"
                  placeholder="0803 123 4567"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Relationship to Student *</label>
                <select
                  value={pickupRelationship}
                  onChange={(e) => setPickupRelationship(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Official Driver">Official Driver</option>
                  <option value="Nanny / Housekeeper">Nanny / Housekeeper</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Authorized Guardian">Authorized Guardian</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID / NIN / License Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. NIN: 4892-0193-4819 or Driver License"
                  value={pickupIdRef}
                  onChange={(e) => setPickupIdRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={pickupPhotoUrl}
                  onChange={(e) => setPickupPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPickupModalOpen(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Authorize Pickup Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
