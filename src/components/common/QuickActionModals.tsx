import React, { useState } from 'react';
import { Megaphone, UserCheck, Briefcase, X, CheckCircle2, Send } from 'lucide-react';

interface QuickActionModalsProps {
  activeModal: 'announcement' | 'attendance' | 'leave' | null;
  onClose: () => void;
}

export const QuickActionModals: React.FC<QuickActionModalsProps> = ({ activeModal, onClose }) => {
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementTarget, setAnnouncementTarget] = useState('SYBSc IT');

  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveDates, setLeaveDates] = useState('Aug 14 - Aug 15');
  const [leaveReason, setLeaveReason] = useState('Attending IEEE International Research Conference');

  if (!activeModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Action completed & synced!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-purple-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-purple-950">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-purple-200 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2">
            {activeModal === 'announcement' && <Megaphone className="w-5 h-5 text-purple-600" />}
            {activeModal === 'attendance' && <UserCheck className="w-5 h-5 text-emerald-600" />}
            {activeModal === 'leave' && <Briefcase className="w-5 h-5 text-amber-600" />}
            <h3 className="font-extrabold text-base text-purple-950 capitalize">
              {activeModal === 'announcement'
                ? 'Post Class Notice'
                : activeModal === 'attendance'
                ? 'Quick Attendance Dispatch'
                : 'Faculty Leave / Substitute Application'}
            </h3>
          </div>
          <button onClick={onClose} className="text-purple-400 hover:text-purple-900 font-bold cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-purple-950 text-lg">{successMsg}</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-purple-900">
            {activeModal === 'announcement' && (
              <>
                <div>
                  <label className="block mb-1 text-purple-900 font-bold">Target Class Group</label>
                  <select
                    value={announcementTarget}
                    onChange={(e) => setAnnouncementTarget(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 font-semibold text-purple-950 focus:outline-none"
                  >
                    <option value="SYBSc IT">SYBSc IT (All Divisions)</option>
                    <option value="Data Structures">Data Structures & Algorithms</option>
                    <option value="Dept IT">Dept IT Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-purple-900 font-bold">Notice Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid-term Syllabus & Practical Exam Slot"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 font-semibold text-purple-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-purple-900 font-bold">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write detailed notice body..."
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 rounded-xl p-3 font-semibold text-purple-950 focus:outline-none"
                  />
                </div>
              </>
            )}

            {activeModal === 'attendance' && (
              <>
                <div>
                  <label className="block mb-1 text-purple-900 font-bold">Select Active Slot</label>
                  <select className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 font-semibold text-purple-950 focus:outline-none">
                    <option>09:00 AM - Operating Systems (Room 402)</option>
                    <option>11:00 AM - Data Structures (Lab 4)</option>
                  </select>
                </div>
                <p className="text-[11px] text-purple-600 font-medium">
                  Quick mode automatically populates all students as Present and posts directly to the Master Attendance Sheet.
                </p>
              </>
            )}

            {activeModal === 'leave' && (
              <>
                <div>
                  <label className="block mb-1 text-purple-900 font-bold">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 font-semibold text-purple-950 focus:outline-none"
                  >
                    <option>Casual Leave</option>
                    <option>Duty Leave (Conference/Research)</option>
                    <option>Medical Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-purple-900 font-bold">Dates</label>
                  <input
                    type="text"
                    required
                    value={leaveDates}
                    onChange={(e) => setLeaveDates(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 font-semibold text-purple-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-purple-900 font-bold">Reason & Nominated Substitute</label>
                  <textarea
                    rows={3}
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 rounded-xl p-3 font-semibold text-purple-950 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Action</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
