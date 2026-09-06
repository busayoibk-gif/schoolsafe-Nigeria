import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Users,
  Settings,
  AlertCircle,
  CheckCircle2,
  Lock,
  Edit2,
  X,
} from 'lucide-react';
import { store } from '../../services/store';
import { formatClassStream } from '../../utils/nigerian';

export const ClassesView: React.FC = () => {
  const classes = store.classes;
  const streams = store.streams;
  const currentProfile = store.currentProfile;

  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(20);
  const [capacityMessage, setCapacityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenEdit = (streamId: string, currentCap: number) => {
    if (currentProfile.role !== 'admin') return;
    setEditingStreamId(streamId);
    setNewCapacity(currentCap);
    setCapacityMessage(null);
  };

  const handleSaveCapacity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStreamId) return;

    const result = store.updateStreamCapacity(editingStreamId, newCapacity);
    if (!result.success) {
      setCapacityMessage({ type: 'error', text: result.error || 'Failed to update capacity' });
      return;
    }

    setCapacityMessage({ type: 'success', text: 'Stream capacity updated successfully!' });
    setTimeout(() => {
      setEditingStreamId(null);
      setCapacityMessage(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Classes, Streams & Capacity Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standard Nigerian school structure: Creche (single stream) through Primary 5 with Wisdom & Knowledge streams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentProfile.role === 'admin' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-800 dark:text-blue-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Capacity Management Permitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Staff: Read-Only Capacity View
            </span>
          )}
        </div>
      </div>

      {/* Overview Notice */}
      <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-3">
        <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 dark:text-blue-200">
          <strong className="block mb-0.5 text-blue-950 dark:text-blue-100">Enforced Maximum Capacity:</strong>
          Every stream from Reception 1 through Primary 5 has a default maximum capacity of <strong>20 students</strong>. The system automatically enforces capacity during enrollment and prevents staff from oversubscribing any stream.
        </div>
      </div>

      {/* Classes and Streams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const classStreams = streams.filter((s) => s.class_id === cls.id);
          const totalEnrolledInClass = classStreams.reduce((acc, st) => {
            return acc + store.getStreamStats(st.id).currentStudents;
          }, 0);
          const totalCapacityInClass = classStreams.reduce((acc, st) => acc + st.capacity, 0);

          return (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Class Header */}
              <div className="p-4 bg-slate-50/60 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cls.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {cls.order_index <= 2 ? 'Early Years (Creche)' : 'Primary & Reception Streamed'}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {totalEnrolledInClass} / {totalCapacityInClass} Students
                </span>
              </div>

              {/* Streams within class */}
              <div className="p-4 space-y-3.5 flex-1">
                {classStreams.map((st) => {
                  const stats = store.getStreamStats(st.id);
                  const percent = Math.min(100, Math.round((stats.currentStudents / stats.capacity) * 100));

                  return (
                    <div
                      key={st.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        stats.isFull
                          ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                          : stats.availableSpaces <= 3
                          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {st.name ? `Stream: ${st.name}` : 'Main Stream'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {stats.isFull ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                              Class Full
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300">
                              {stats.availableSpaces} spaces left
                            </span>
                          )}

                          {currentProfile.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(st.id, st.capacity)}
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Capacity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {stats.currentStudents} / {stats.capacity} Enrolled
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{percent}% Filled</span>
                      </div>

                      {/* Capacity Bar */}
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
          );
        })}
      </div>

      {/* Edit Stream Capacity Modal (School Administrator only) */}
      {editingStreamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Adjust Stream Capacity</h3>
              </div>
              <button
                onClick={() => setEditingStreamId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {capacityMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  capacityMessage.type === 'success'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {capacityMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveCapacity} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Student Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-600"
                  required
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Standard Nigerian school default is 20 students per stream.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStreamId(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Update Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
