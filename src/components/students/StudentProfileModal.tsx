import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  UserCheck,
  TrendingDown,
  BookOpen
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Student } from '../../types';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  if (!student) return null;

  const [activeTab, setActiveTab] = useState<'attendance' | 'grades' | 'assignments' | 'notes'>('attendance');

  const attendanceTrendData = [
    { week: 'Week 1', attendance: 95 },
    { week: 'Week 2', attendance: 92 },
    { week: 'Week 3', attendance: 88 },
    { week: 'Week 4', attendance: 92 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-['Poppins',sans-serif]">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200/80 my-8 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Profile Header */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white relative border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm hover:shadow transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-xl"
            />

            <div className="text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  {student.name}
                </h2>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                  Roll: {student.rollNo}
                </span>
                <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                  {student.className}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">{student.email}</p>

              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Message Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Pattern Mismatch Alert Banner */}
        {student.patternMismatchAlert && (
          <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-3 text-amber-900">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold tracking-wide uppercase text-amber-800">
                  Pattern Mismatch Detected
                </h4>
                <p className="text-xs font-medium text-amber-800/90 mt-0.5">
                  {student.patternMismatchAlert}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs">
                Schedule Check-in
              </button>
              <button className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-xs rounded-xl">
                Notify Mentor
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-6 flex items-center gap-2 border-b border-slate-100">
          {(['attendance', 'grades', 'assignments', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all capitalize ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Body Contents */}
        <div className="p-6 space-y-6">
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Present</span>
                  <span className="text-lg font-black text-slate-900">142 / 154</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Avg</span>
                  <span className="text-lg font-black text-indigo-600">{student.overallAttendance}%</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Consecutive Absences</span>
                  <span className="text-lg font-black text-rose-600">{student.consecutiveAbsences}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    {student.isDefaulter ? 'Defaulter' : 'Good Standing'}
                  </span>
                </div>
              </div>

              {/* Attendance by Subject breakdown */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-3">Attendance By Subject</h3>
                <div className="space-y-3">
                  {student.subjectsAttendance.map((sub) => (
                    <div key={sub.subjectId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{sub.subjectName} ({sub.teacherName})</span>
                        <span className="text-indigo-600">{sub.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Trend Line Chart */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-2">Attendance Trend (30 Days)</h3>
                <div className="h-44 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrendData}>
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[50, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Cumulative Grade</span>
                  <span className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                    {student.overallGrade} ({student.avgScore}% Average)
                  </span>
                </div>
                {student.attendanceTrend === 'down' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    <TrendingDown className="w-4 h-4" />
                    Declining
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Faculty Counseling Notes</h3>
              {student.notes && student.notes.length > 0 ? (
                student.notes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    • {note}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No faculty notes added yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
