import React, { useState } from 'react';
import {
  HeartHandshake,
  Search,
  Plus,
  Phone,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import { store } from '../../services/store';
import { Parent, NotificationPreference } from '../../types';
import { parseNigerianPhone } from '../../utils/nigerian';

export const ParentsView: React.FC = () => {
  const parents = store.parents;
  const currentProfile = store.currentProfile;
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRelationship, setFormRelationship] = useState('Mother');
  const [formPreference, setFormPreference] = useState<NotificationPreference>('email_and_sms');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const filteredParents = parents.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateParent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const parsedPhone = parseNigerianPhone(formPhone);
    if (!parsedPhone.isValid) {
      setFormError('Invalid Nigerian phone number. Please enter a valid 11-digit or +234 number.');
      return;
    }

    const newParent: Parent = {
      id: 'par_' + Date.now(),
      school_id: store.school.id,
      full_name: formName.trim(),
      phone: parsedPhone.formatted,
      email: formEmail.trim() || '',
      relationship: formRelationship,
      notification_preference: formPreference,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.parents.push(newParent);
    store.logAudit('Created parent contact', 'parent', newParent.id, {
      name: newParent.full_name,
      phone: newParent.phone,
    });

    setFormSuccess(`Parent ${newParent.full_name} added successfully!`);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormSuccess(null);
      setFormName('');
      setFormPhone('');
      setFormEmail('');
    }, 1200);
  };

  const handleUpdatePreference = (parentId: string, pref: NotificationPreference) => {
    const parent = store.parents.find((p) => p.id === parentId);
    if (parent) {
      parent.notification_preference = pref;
      parent.updated_at = new Date().toISOString();
      store.logAudit('Updated notification preference', 'parent', parentId, { preference: pref });
      // trigger re-render
      setSearchQuery((q) => q + ' ');
      setSearchQuery((q) => q.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Parents & Guardians Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registered family contacts, Nigerian mobile numbers (+234), and notification dispatch preferences.
          </p>
        </div>

        {currentProfile.role === 'admin' && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Parent / Guardian
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search parent by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Parents Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParents.map((par) => {
          // Find linked students
          const linkedStudentIds = store.studentParents
            .filter((sp) => sp.parent_id === par.id)
            .map((sp) => sp.student_id);

          const linkedStudents = store.students.filter((s) => linkedStudentIds.includes(s.id));

          return (
            <div
              key={par.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{par.full_name}</h3>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      {par.relationship}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{par.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="truncate">{par.email || 'No email registered'}</span>
                  </div>
                </div>

                {/* Linked Children */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">
                    Linked Children ({linkedStudents.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedStudents.length > 0 ? (
                      linkedStudents.map((st) => (
                        <span
                          key={st.id}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                        >
                          {st.full_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs italic">None linked</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notification Preference Selector */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  Alert Preference
                </label>
                <select
                  value={par.notification_preference}
                  onChange={(e: any) => handleUpdatePreference(par.id, e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="email_and_sms">Email + SMS (Termii & Resend)</option>
                  <option value="sms_only">SMS Only (Termii)</option>
                  <option value="email_only">Email Only (Resend)</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Parent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Parent / Guardian</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 rounded-lg text-xs border border-rose-200 dark:border-rose-800">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 rounded-lg text-xs border border-blue-200 dark:border-blue-800">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateParent} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Ngozi Adeleke"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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
                  placeholder="0803 123 4567 or +234..."
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="ngozi@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Relationship</label>
                <select
                  value={formRelationship}
                  onChange={(e) => setFormRelationship(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sponsor">Sponsor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notification Preference
                </label>
                <select
                  value={formPreference}
                  onChange={(e: any) => setFormPreference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="email_and_sms">Email + SMS (Termii & Resend)</option>
                  <option value="sms_only">SMS Only (Termii)</option>
                  <option value="email_only">Email Only (Resend)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Add Parent Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
