import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  FileText,
  Plus,
  X,
  ExternalLink
} from 'lucide-react';
// import {
//   dbGetAssignments,
//   dbCreateAssignment,
//   dbGetAssignmentSubmissions,
//   dbUpdateSubmissionGrade,
//   SupabaseAssignment,
//   SupabaseAssignmentSubmission
// } from '../../lib/supabase';
import { SkeletonTable, SkeletonStatCard } from '../common/Skeleton';

export const GradebookView: React.FC = () => {
  const [assignments, setAssignments] = useState<SupabaseAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<SupabaseAssignmentSubmission[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State for New Assignment Creation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Data Structures & Algorithms (IT401)');
  const [newDueDate, setNewDueDate] = useState<string>('2026-08-20');
  const [newDueTime, setNewDueTime] = useState<string>('11:59 PM');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');

  // Load Assignments from Supabase / DB Engine
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await dbGetAssignments();
      setAssignments(data);
      if (data.length > 0) {
        setSelectedAssignmentId(data[0].id);
      }
      setTimeout(() => setIsLoading(false), 400);
    }
    loadData();
  }, []);

  // Load Submissions whenever selected assignment changes
  useEffect(() => {
    if (!selectedAssignmentId) return;
    async function loadSubs() {
      const subs = await dbGetAssignmentSubmissions(selectedAssignmentId);
      setSubmissions(subs);
      setHasUnsavedChanges(false);
    }
    loadSubs();
  }, [selectedAssignmentId]);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];

  const handleScoreChange = (id: string, newScore: number) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, marks_awarded: Math.min(100, Math.max(0, newScore)), status: 'graded' } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleFeedbackChange = (id: string, newFeedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, teacher_feedback: newFeedback } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    for (const sub of submissions) {
      if (sub.marks_awarded !== undefined) {
        await dbUpdateSubmissionGrade(sub.id, sub.marks_awarded, sub.teacher_feedback || '');
      }
    }
    setHasUnsavedChanges(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleDiscardChanges = async () => {
    if (selectedAssignmentId) {
      const subs = await dbGetAssignmentSubmissions(selectedAssignmentId);
      setSubmissions(subs);
    }
    setHasUnsavedChanges(false);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await dbCreateAssignment({
      teacher_id: 't_alex_taylor_uuid',
      title: newTitle,
      subject: newSubject,
      due_date: newDueDate,
      due_time: newDueTime,
      priority: newPriority
    });

    setAssignments((prev) => [created, ...prev]);
    setSelectedAssignmentId(created.id);
    setIsCreateModalOpen(false);
    setNewTitle('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 font-sans text-[#14201B]">
      {/* Top Header & Save Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCEAE3] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-[#14201B] tracking-tight">
              Assignment Manager & Submission Portal
            </h2>
            <span className="text-xs font-bold bg-[#E5F5EE] text-[#12A176] px-3 py-1 rounded-full border border-[#DCEAE3]">
              Live Sync Active
            </span>
          </div>
          <p className="text-xs text-[#5C6B63] font-medium mt-0.5">
            Create coursework assignments, set due dates, review student file uploads, and issue faculty feedback.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-[#14201B] hover:bg-[#1f3029] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#DCEAE3]"
          >
            <Plus className="w-4 h-4 text-[#12A176]" />
            <span>Create New Assignment</span>
          </button>

          {hasUnsavedChanges && (
            <span className="text-xs font-bold text-[#E0A23B] bg-[#E0A23B]/10 px-3 py-1.5 rounded-xl border border-[#E0A23B]/30 animate-pulse">
              Unsaved Changes
            </span>
          )}

          <button
            onClick={handleDiscardChanges}
            disabled={!hasUnsavedChanges}
            className="px-3 py-2 bg-[#F8FDFB] hover:bg-[#E5F5EE] disabled:opacity-50 text-[#5C6B63] font-bold text-xs rounded-xl border border-[#DCEAE3] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#5C6B63]" />
            <span>Discard</span>
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className="px-4 py-2 bg-[#12A176] hover:bg-[#0E8360] disabled:bg-[#5C6B63]/30 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-white" />
            <span>Save to Database</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-4 bg-[#12A176] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Grades and faculty feedback successfully committed to assignment_submissions table!</span>
          </div>
        </div>
      )}

      {/* Assignment Select Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {assignments.map((assign) => (
          <div
            key={assign.id}
            onClick={() => setSelectedAssignmentId(assign.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedAssignmentId === assign.id
                ? 'bg-[#14201B] text-white shadow-sm border-[#14201B]'
                : 'bg-white hover:bg-[#F8FDFB] border-[#DCEAE3] text-[#14201B]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className={selectedAssignmentId === assign.id ? 'text-[#E5F5EE]' : 'text-[#5C6B63]'}>
                {assign.subject}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  assign.priority === 'high'
                    ? 'bg-[#DB5B4E]/20 text-rose-300 border border-[#DB5B4E]/30'
                    : 'bg-[#E5F5EE] text-[#12A176] border border-[#DCEAE3]'
                }`}
              >
                {assign.priority}
              </span>
            </div>
            <h4 className="font-bold text-sm tracking-tight">{assign.title}</h4>
            <p className={`text-[11px] mt-2 font-medium flex items-center justify-between ${selectedAssignmentId === assign.id ? 'text-white/70' : 'text-[#5C6B63]'}`}>
              <span>Due: {assign.due_date} • {assign.due_time}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Student Submissions Grade Table */}
      {selectedAssignment && (
        <div className="bg-white rounded-2xl border border-[#DCEAE3] p-6 overflow-x-auto shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCEAE3] mb-4">
            <div>
              <h3 className="font-bold text-base text-[#14201B]">{selectedAssignment.title}</h3>
              <p className="text-xs text-[#5C6B63]">{selectedAssignment.subject} • Due Date: {selectedAssignment.due_date} ({selectedAssignment.due_time})</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#F8FDFB] border-b border-[#DCEAE3] text-[11px] font-bold text-[#5C6B63] uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-4 text-center">Submission File</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Score (/100)</th>
                <th className="py-3.5 px-4">Faculty Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCEAE3] text-xs font-semibold text-[#14201B]">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#F8FDFB] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E5F5EE] text-[#12A176] font-bold text-xs flex items-center justify-center border border-[#DCEAE3]">
                        {sub.student_avatar || sub.student_name?.slice(0, 2) || 'ST'}
                      </div>
                      <div>
                        <span className="font-bold text-[#14201B] block">{sub.student_name || 'Aanushiya Sitaraman'}</span>
                        <span className="text-[10px] text-[#5C6B63]">Roll: {sub.student_id_number || 'T.24.01'}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-[#5C6B63] text-xs font-medium">
                    {new Date(sub.submitted_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {sub.submission_file_url ? (
                      <a
                        href={sub.submission_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#F8FDFB] text-[#4E7FD6] hover:bg-[#E5F5EE] font-bold rounded-lg border border-[#DCEAE3] text-[11px]"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#4E7FD6]" />
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3 text-[#4E7FD6] ml-0.5" />
                      </a>
                    ) : (
                      <span className="text-[#5C6B63] text-[11px]">No attachment</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        sub.status === 'graded'
                          ? 'bg-[#E5F5EE] text-[#12A176] border border-[#DCEAE3]'
                          : 'bg-[#E0A23B]/10 text-[#E0A23B] border border-[#E0A23B]/30'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={sub.marks_awarded !== undefined ? sub.marks_awarded : ''}
                      placeholder="—"
                      onChange={(e) => handleScoreChange(sub.id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 text-center font-bold text-[#14201B] bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl focus:bg-white focus:border-[#12A176] focus:outline-none"
                    />
                  </td>

                  <td className="py-4 px-4">
                    <input
                      type="text"
                      value={sub.teacher_feedback || ''}
                      placeholder="Add feedback comment..."
                      onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs text-[#14201B] bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl focus:bg-white focus:border-[#12A176] focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE NEW ASSIGNMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-xl border border-[#DCEAE3] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCEAE3] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E5F5EE] text-[#12A176] flex items-center justify-center font-bold border border-[#DCEAE3]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#14201B]">Create Assignment</h3>
                  <p className="text-xs text-[#5C6B63] font-medium">Add new coursework to assignments database</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-[#5C6B63] hover:text-[#14201B] hover:bg-[#F8FDFB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#14201B] mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red-Black Tree Rotation Lab Exercise"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-bold text-[#14201B] focus:outline-none focus:border-[#12A176]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14201B] mb-1">Course / Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-bold text-[#14201B] focus:outline-none focus:border-[#12A176]"
                >
                  <option value="Data Structures & Algorithms (IT401)">Data Structures & Algorithms (IT401)</option>
                  <option value="Operating Systems (IT402)">Operating Systems (IT402)</option>
                  <option value="Advanced Database Systems (IT403)">Advanced Database Systems (IT403)</option>
                  <option value="Computer Networks (IT404)">Computer Networks (IT404)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#14201B] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-bold text-[#14201B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14201B] mb-1">Due Time</label>
                  <input
                    type="text"
                    required
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-bold text-[#14201B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14201B] mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full px-3.5 py-2.5 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-bold text-[#14201B] focus:outline-none"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#F8FDFB] hover:bg-[#E5F5EE] border border-[#DCEAE3] text-[#14201B] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#12A176] hover:bg-[#0E8360] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

