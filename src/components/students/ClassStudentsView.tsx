import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import BulkImportStudentsModal from "./BulkImportStudentsModal";
import {
  Search,
  Download,
  CheckCircle2,
  Award,
  ShieldAlert,
  X,
  UserPlus,
  Trash2,
  Upload,
} from 'lucide-react';

import { SkeletonTable, SkeletonStatCard } from '../common/Skeleton';

interface RosterStudent {
  id: string;
  classId: string | null;
  rollNo: string;
  name: string;
  className: string | null;
  overallAttendance: number;
  isDefaulter: boolean;
  statusTag: 'Excellent' | 'Regular' | 'At Risk' | 'Critical Defaulter';
  contactEmail: string | null;
  lastPresentTime: string | null;
}

interface ClassOption {
  id: string;
  name: string;
  studentCount: number;
}

export const ClassStudentsView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Excellent' | 'Regular' | 'At Risk' | 'Critical Defaulter'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', enrollment_no: '', email: '', class_id: '' });
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [createError, setCreateError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ enrollment_no: string; temp_password: string } | null>(null);

  const [studentToRemove, setStudentToRemove] = useState<RosterStudent | null>(null);
  const [removeStatus, setRemoveStatus] = useState<'idle' | 'loading'>('idle');
  const [showImport, setShowImport] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchStudents = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/students-list`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    );
    const json = await res.json();
    if (json.status === 'ok') setStudents(json.students);
  };

  const fetchClasses = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/class-list`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    );
    const json = await res.json();
    if (json.status === 'ok') setClasses(json.classes);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchStudents(), fetchClasses()]);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkMarkPresent = () => {
    showToast(`Successfully marked ${selectedIds.length} students as PRESENT!`);
    setSelectedIds([]);
  };

  const handleBulkSendNotice = () => {
    showToast(`Dispatched official parent notices for ${selectedIds.length} selected students.`);
    setSelectedIds([]);
  };

  const handleBulkFlagReview = () => {
    showToast(`Flagged ${selectedIds.length} students for Academic Head Review.`);
    setSelectedIds([]);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query) ||
        (s.contactEmail ?? '').toLowerCase().includes(query) ||
        (s.className ?? '').toLowerCase().includes(query);

      const matchesStatus = selectedStatus === 'All' || s.statusTag === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, selectedStatus]);

  const totalCount = students.length;
  const excellentCount = students.filter((s) => s.statusTag === 'Excellent').length;
  const defaulterCount = students.filter((s) => s.isDefaulter).length;
  const atRiskCount = students.filter((s) => s.statusTag === 'At Risk').length;

  const handleExportCSV = () => {
    const headers = 'Student ID,Roll No,Name,Class,Attendance %,Is Defaulter,Status,Email,Last Present\n';
    const rows = filteredStudents
      .map(
        (s) =>
          `"${s.id}","${s.rollNo}","${s.name}","${s.className ?? ''}",${s.overallAttendance},${s.isDefaulter},"${s.statusTag}","${s.contactEmail ?? ''}","${s.lastPresentTime ?? ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Roster_${Date.now()}.csv`;
    a.click();
    showToast(`Exported ${filteredStudents.length} student records as CSV`);
  };

  const openCreateModal = () => {
    setCreateForm({ name: '', enrollment_no: '', email: '', class_id: classes[0]?.id ?? '' });
    setCreateStatus('idle');
    setCreateError('');
    setCreatedCredentials(null);
    setShowCreateModal(true);
  };

  const handleCreateStudent = async () => {
    if (!createForm.name.trim() || !createForm.enrollment_no.trim() || !createForm.class_id) {
      setCreateStatus('error');
      setCreateError('Name, enrollment number, and class are required.');
      return;
    }

    setCreateStatus('loading');
    setCreateError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCreateStatus('error');
      setCreateError('Not logged in.');
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrollment_no: createForm.enrollment_no.trim(),
        name: createForm.name.trim(),
        class_id: createForm.class_id,
        email: createForm.email.trim() || undefined,
      }),
    });
    const json = await res.json();

    if (json.status !== 'ok') {
      setCreateStatus('error');
      setCreateError(json.message ?? 'Failed to create student.');
      return;
    }

    setCreatedCredentials({ enrollment_no: json.enrollment_no, temp_password: json.temp_password });
    setCreateStatus('idle');
    await fetchStudents();
    await fetchClasses();
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;
    setRemoveStatus('loading');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setRemoveStatus('idle');
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-remove`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentToRemove.id,
        class_id: studentToRemove.classId,
      }),
    });
    const json = await res.json();

    setRemoveStatus('idle');

    if (json.status !== 'ok') {
      showToast(`Failed to remove ${studentToRemove.name}: ${json.message ?? 'unknown error'}`);
      setStudentToRemove(null);
      return;
    }

    showToast(`Removed ${studentToRemove.name} from ${studentToRemove.className ?? 'the class'}.`);
    setStudentToRemove(null);
    setSelectedIds((prev) => prev.filter((id) => id !== studentToRemove.id));
    await fetchStudents();
    await fetchClasses();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24 font-sans max-w-7xl mx-auto text-[#14201B]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <SkeletonTable rows={10} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 font-sans max-w-7xl mx-auto text-[#14201B]">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#14201B] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#DCEAE3] flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#12A176]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#14201B] text-white rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm border border-[#DCEAE3]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white font-semibold text-[10px]">
                Class Roster & Student Directory
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Student Directory</h2>
            <p className="text-xs text-white/70 font-medium mt-1 max-w-xl">
              Manage students across your classes, track live attendance percentages, and add or remove students.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-white text-[#14201B] hover:bg-[#E5F5EE] font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Student</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
  onClick={() => setShowImport(true)}
  className="px-4 py-2.5 rounded-xl bg-[#1B2A4A] hover:bg-[#14213A] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
>
  <Upload className="w-4 h-4" />
  <span>Import CSV</span>
</button>

            {showImport && (
  <BulkImportStudentsModal
    classes={classes}
    onImported={() => { fetchStudents(); fetchClasses(); setShowImport(false); }}
    onClose={() => setShowImport(false)}
  />
)}
  
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Total Roster</p>
            <p className="text-2xl font-bold text-white mt-0.5">{totalCount} <span className="text-xs font-normal text-white/50">Students</span></p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-[#E5F5EE] tracking-wider">Excellent (&ge;90%)</p>
            <p className="text-2xl font-bold text-[#12A176] mt-0.5">{excellentCount}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">At Risk</p>
            <p className="text-2xl font-bold text-amber-300 mt-0.5">{atRiskCount}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-[#DB5B4E] tracking-wider">Defaulters (&lt;75%)</p>
            <p className="text-2xl font-bold text-[#DB5B4E] mt-0.5">{defaulterCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#DCEAE3] shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#5C6B63] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, roll no, class, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-semibold text-[#14201B] focus:outline-none focus:border-[#12A176] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 bg-[#F8FDFB] p-1 rounded-xl border border-[#DCEAE3]">
            {(['All', 'Excellent', 'Regular', 'At Risk', 'Critical Defaulter'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedStatus === st ? 'bg-[#12A176] text-white shadow-xs' : 'text-[#5C6B63] hover:text-[#14201B]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#F8FDFB] p-1 rounded-xl border border-[#DCEAE3]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#14201B] text-white' : 'text-[#5C6B63]'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#14201B] text-white' : 'text-[#5C6B63]'
              }`}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-xs text-[#5C6B63] font-semibold">
        <span>Showing {filteredStudents.length} of {totalCount} Student Records</span>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#14201B] text-white px-6 py-3.5 rounded-2xl border border-[#DCEAE3] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pr-3 border-r border-white/20">
            <span className="w-6 h-6 rounded-full bg-[#12A176] text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-white">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleBulkMarkPresent} className="px-3.5 py-1.5 rounded-xl bg-[#12A176] text-white font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer">
              Mark Present
            </button>
            <button onClick={handleBulkSendNotice} className="px-3.5 py-1.5 rounded-xl bg-[#4E7FD6] text-white font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer">
              Dispatch Notice
            </button>
            <button onClick={handleBulkFlagReview} className="px-3.5 py-1.5 rounded-xl bg-[#DB5B4E] text-white font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer">
              Flag for Review
            </button>
          </div>

          <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-white/60 hover:text-white pl-2 cursor-pointer">
            Clear
          </button>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-[#DCEAE3] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-[#F8FDFB] border-b border-[#DCEAE3] text-[11px] font-bold uppercase tracking-wider text-[#5C6B63]">
                  <th className="py-3.5 px-3 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-[#DCEAE3] text-[#12A176] focus:ring-[#12A176] cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Student Name & Email</th>
                  <th className="py-3.5 px-4">Roll No / Class</th>
                  <th className="py-3.5 px-4">Overall Attendance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Present</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCEAE3] text-xs font-medium">
                {filteredStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <tr key={student.id} className={`transition-colors group ${isSelected ? 'bg-[#E5F5EE]' : 'hover:bg-[#F8FDFB]'}`}>
                      <td className="py-3.5 px-3 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(student.id)}
                          className="rounded border-[#DCEAE3] text-[#12A176] focus:ring-[#12A176] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#E5F5EE] text-[#12A176] font-bold text-xs flex items-center justify-center shrink-0 border border-[#DCEAE3]">
                            {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-[#14201B] text-sm group-hover:text-[#12A176] transition-colors">{student.name}</p>
                            <p className="text-[10px] text-[#5C6B63] font-mono">{student.contactEmail ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#14201B] text-white font-bold font-mono text-[11px]">{student.rollNo}</span>
                        <p className="text-[10px] text-[#5C6B63] font-semibold mt-1">{student.className ?? 'Unassigned'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-36">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className={student.isDefaulter ? 'text-[#DB5B4E]' : 'text-[#14201B]'}>{student.overallAttendance}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#DCEAE3] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                student.overallAttendance >= 90 ? 'bg-[#12A176]' : student.overallAttendance >= 75 ? 'bg-[#4E7FD6]' : 'bg-[#DB5B4E]'
                              }`}
                              style={{ width: `${student.overallAttendance}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            student.statusTag === 'Excellent'
                              ? 'bg-[#E5F5EE] text-[#12A176]'
                              : student.statusTag === 'Regular'
                              ? 'bg-[#E5F5EE] text-[#12A176]'
                              : student.statusTag === 'At Risk'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {student.statusTag === 'Excellent' && <Award className="w-3 h-3" />}
                          {student.statusTag === 'Critical Defaulter' && <ShieldAlert className="w-3 h-3" />}
                          <span>{student.statusTag}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-[#5C6B63]">
                          {student.lastPresentTime ? new Date(student.lastPresentTime).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setStudentToRemove(student)}
                          className="p-1.5 rounded-xl bg-[#F8FDFB] hover:bg-rose-50 text-rose-600 border border-[#DCEAE3] transition-all cursor-pointer"
                          title="Remove student from this class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-2xl p-5 border border-[#DCEAE3] shadow-sm hover:shadow-md transition-all space-y-4 relative group overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#E5F5EE] text-[#12A176] font-bold text-sm flex items-center justify-center shrink-0 border border-[#DCEAE3]">
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#14201B] text-sm group-hover:text-[#12A176] transition-colors">{student.name}</h4>
                    <p className="text-[10px] text-[#5C6B63] font-mono font-medium">Roll: {student.rollNo}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    student.statusTag === 'Excellent' || student.statusTag === 'Regular' ? 'bg-[#E5F5EE] text-[#12A176]' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {student.statusTag}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8FDFB] p-3 rounded-xl border border-[#DCEAE3]">
                <div>
                  <span className="text-[10px] font-bold text-[#5C6B63] block uppercase">Class</span>
                  <span className="font-semibold text-[#14201B]">{student.className ?? 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#5C6B63] block uppercase">Email</span>
                  <span className="font-semibold text-[#14201B] truncate block">{student.contactEmail ?? '—'}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-[#5C6B63]">Attendance Record</span>
                  <span className={student.isDefaulter ? 'text-[#DB5B4E]' : 'text-[#14201B]'}>{student.overallAttendance}%</span>
                </div>
                <div className="w-full h-2 bg-[#DCEAE3] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      student.overallAttendance >= 90 ? 'bg-[#12A176]' : student.overallAttendance >= 75 ? 'bg-[#4E7FD6]' : 'bg-[#DB5B4E]'
                    }`}
                    style={{ width: `${student.overallAttendance}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCEAE3] flex items-center justify-between gap-2">
                <button
                  onClick={() => setStudentToRemove(student)}
                  className="flex-1 py-2 rounded-xl bg-[#F8FDFB] hover:bg-rose-50 text-rose-600 font-semibold text-xs border border-[#DCEAE3] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#DCEAE3] shadow-xl space-y-4 relative"
            >
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-[#F8FDFB] hover:bg-[#E5F5EE] text-[#14201B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-[#DCEAE3]">
                <div className="p-2.5 rounded-xl bg-[#12A176]/10 text-[#12A176]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#14201B]">Create Student</h3>
                  <p className="text-xs text-[#5C6B63]">Creates a login and enrolls them in a class</p>
                </div>
              </div>

              {createdCredentials ? (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs space-y-2">
                    <p className="font-bold">Student created successfully.</p>
                    <p>Enrollment No: <span className="font-mono font-bold">{createdCredentials.enrollment_no}</span></p>
                    <p>Temp Password: <span className="font-mono font-bold">{createdCredentials.temp_password}</span></p>
                    <p className="text-[10px] text-emerald-700">Share this password with the student — it won't be shown again.</p>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="w-full py-2.5 rounded-xl bg-[#14201B] text-white font-bold text-xs">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#12A176]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] mb-1">Enrollment No</label>
                    <input
                      type="text"
                      value={createForm.enrollment_no}
                      onChange={(e) => setCreateForm((f) => ({ ...f, enrollment_no: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#12A176]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#12A176]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] mb-1">Class</label>
                    <select
                      value={createForm.class_id}
                      onChange={(e) => setCreateForm((f) => ({ ...f, class_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#12A176]"
                    >
                      <option value="">Select a class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.studentCount})</option>
                      ))}
                    </select>
                  </div>

                  {createStatus === 'error' && <p className="text-xs font-bold text-rose-600">{createError}</p>}

                  <button
                    onClick={handleCreateStudent}
                    disabled={createStatus === 'loading'}
                    className="w-full py-2.5 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white font-bold text-xs disabled:opacity-60"
                  >
                    {createStatus === 'loading' ? 'Creating...' : 'Create Student'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {studentToRemove && (
          <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#DCEAE3] shadow-xl space-y-4"
            >
              <h3 className="font-bold text-base text-[#14201B]">Remove student?</h3>
              <p className="text-xs text-[#5C6B63]">
                This removes <strong>{studentToRemove.name}</strong> from <strong>{studentToRemove.className ?? 'this class'}</strong>. Their attendance history and login are kept.
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setStudentToRemove(null)} className="flex-1 py-2.5 rounded-xl bg-[#F8FDFB] text-[#5C6B63] font-bold text-xs border border-[#DCEAE3]">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  disabled={removeStatus === 'loading'}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs disabled:opacity-60"
                >
                  {removeStatus === 'loading' ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};