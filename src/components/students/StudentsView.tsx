import React, { useState } from 'react';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Flag,
  FileSpreadsheet,
  Mail,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';

import { Student } from '../../types';
import { StudentProfileModal } from './StudentProfileModal';

export const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [defaultersOnly, setDefaultersOnly] = useState(false);
  const [crossSubjectView, setCrossSubjectView] = useState(true);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNoticeSent, setExportNoticeSent] = useState(false);

  useEffect(() => {
  const fetchStudents = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/students-list`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    );
    const json = await res.json();
    if (json.status === 'ok') {
      setStudents(json.students);
    }
  };
  fetchStudents();
}, []);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchesDefaulter = defaultersOnly ? s.isDefaulter : true;
    return matchesSearch && matchesDefaulter;
  });

  const handleSendDefaulterNotices = () => {
    setExportNoticeSent(true);
    setTimeout(() => {
      setExportNoticeSent(false);
      setShowExportModal(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24 font-['Poppins',sans-serif]">
      {/* Top Header Bar & Global Action Exporter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-5 rounded-3xl border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Attendance Overview
            </h2>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
              60 Enrolled Students
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            SYBSc IT • Semester 4 • Real-time Cross-Subject Sync
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Cross-Subject View Switcher Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
            <span>Cross-subject view</span>
            <button
              onClick={() => setCrossSubjectView(!crossSubjectView)}
              className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                crossSubjectView ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-5 h-5 bg-white rounded-full shadow-md" />
            </button>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Generate Defaulter List</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Subject dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Subject
          </label>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subjects</option>
            <option value="ds">Data Structures</option>
            <option value="os">Operating Systems</option>
            <option value="dbms">Database Systems</option>
          </select>
        </div>

        {/* Date Range dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Date Range
          </label>
          <select className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>This Month</option>
            <option>Semester IV Cumulative</option>
            <option>Last 14 Days</option>
          </select>
        </div>

        {/* Class / Batch dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Class / Batch
          </label>
          <select className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>SYBSc IT (All)</option>
            <option>SYBSc IT - Div A</option>
            <option>SYBSc IT - Div B</option>
          </select>
        </div>

        {/* Search Input Box */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name or Roll No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Defaulter Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDefaultersOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !defaultersOnly ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All Students
          </button>
          <button
            onClick={() => setDefaultersOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              defaultersOnly ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 border border-rose-200/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Defaulters Only (&lt;75%)</span>
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredStudents.length} entries
        </span>
      </div>

      {/* VIEW PATH 1: DESKTOP DATA-TABLE (Hidden below 768px - md:block) */}
      <div className="hidden md:block glass-card rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6">Roll No</th>
              <th className="py-4 px-6">Student Name</th>
              <th className="py-4 px-6 text-center">Total %</th>
              <th className="py-4 px-6 text-center">Trend</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="py-4 px-6 font-mono font-bold text-slate-600">{student.rollNo}</td>

                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                        {student.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{student.email}</span>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-6 text-center">
                  <span
                    className={`font-black text-sm ${
                      student.overallAttendance < 75 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {student.overallAttendance}%
                  </span>
                </td>

                <td className="py-4 px-6 text-center">
                  <div className="inline-flex items-center justify-center">
                    {student.attendanceTrend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    {student.attendanceTrend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
                    {student.attendanceTrend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                  </div>
                </td>

                <td className="py-4 px-6 text-center">
                  {student.isDefaulter ? (
                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                      <Flag className="w-3 h-3 text-rose-600 fill-current" />
                      Defaulter Flag
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>

                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => setSelectedStudentForModal(student)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="View Student Profile Deep Dive"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {filteredStudents.length} of 60 entries</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg">1</button>
            <button className="px-3 py-1 hover:bg-slate-200 text-slate-700 rounded-lg">2</button>
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW PATH 2: MOBILE STACKED CARDS LIST (Visible below 768px - md:hidden) */}
      <div className="md:hidden space-y-3">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            onClick={() => setSelectedStudentForModal(student)}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{student.name}</h4>
                  <span className="text-xs font-mono text-slate-400">Roll: {student.rollNo}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black block ${student.overallAttendance < 75 ? 'text-rose-600' : 'text-indigo-600'}`}>
                  {student.overallAttendance}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Total Avg</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-500">
                <span>Trend:</span>
                {student.attendanceTrend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                {student.attendanceTrend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                {student.attendanceTrend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
              </div>

              {student.isDefaulter && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flag className="w-3 h-3 fill-current text-rose-600" />
                  Defaulter Flag
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Student Profile Modal Deep Dive */}
      <StudentProfileModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
      />

      {/* Generate Defaulter List Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-base text-slate-900">Defaulter List Exporter</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export officially formatted Defaulter Reports (&lt;75% Attendance) for SYBSc IT, including student contact details, consecutive absences, and guardian emails.
            </p>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between text-rose-900">
              <div>
                <span className="text-xs font-extrabold block">12 Defaulters Flagged</span>
                <span className="text-[10px] text-rose-700">Threshold: &lt;75.0% Attendance</span>
              </div>
              <span className="text-xs font-black bg-rose-600 text-white px-3 py-1 rounded-xl">PDF / CSV</span>
            </div>

            {exportNoticeSent ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Defaulter list generated & email notices dispatched!</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleSendDefaulterNotices}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Download CSV & Send Guardian Notices</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
