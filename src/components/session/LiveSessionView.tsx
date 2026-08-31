import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  CheckCircle2,
  Play,
  Square,
  UserCheck,
  ShieldCheck,
  Zap,
  Radio,
  AlertCircle
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import { SkeletonDashboardView } from '../common/Skeleton';
import ComingSoon from '../common/ComingSoon';

export const LiveSessionView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const { teacherId, classes } = useAuth();
  const { activeSession, attendanceRecords, startSession, endSession } = useSession();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'code_mode' | 'manual_rollcall'>('code_mode');
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Local 1s ticking clock, purely for countdown display —
  // the real code/expiry values still come from server polling in SessionContext.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Default the dropdown to the first real class once classes load
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const sessionActive = activeSession?.status === 'active';



  const handleStartSession = async () => {
    if (!teacherId) {
      setStartError('teacherId not loaded yet — reload the page and try again.');
      return;
    }
    if (!selectedClass) {
      setStartError('Pick a class first.');
      return;
    }

    setIsStarting(true);
    setStartError(null);
    const { error } = await startSession(selectedClass.id, teacherId, selectedClass.name);
    setIsStarting(false);

    if (error) {
      setStartError(error);
    }
  };

  const handleEndSession = async () => {
    if (!teacherId) return;
    await endSession(teacherId);
  };

  

  const codeSecondsLeft = activeSession
    ? Math.max(0, Math.round((new Date(activeSession.codeExpiresAt).getTime() - now) / 1000))
    : 0;

  const windowSecondsLeft = activeSession
    ? Math.max(0, Math.round((new Date(activeSession.windowEnd).getTime() - now) / 1000))
    : 0;

  const totalClassStudents = selectedClass?.studentCount ?? 0;
  const markedCount = attendanceRecords.length;
  const progressPercent = totalClassStudents > 0 ? Math.round((markedCount / totalClassStudents) * 100) : 0;

  if (isLoading) {
    return <SkeletonDashboardView />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#14201B] pb-24">
      {/* CLASS SELECTOR */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm">
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F5EE] text-[#12A176] text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5 text-[#12A176]" /> Live Session Launcher
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-[#14201B] tracking-tight">Select a Class</h2>
          <p className="text-xs text-[#5C6B63] font-medium mt-0.5">
            Choose the class you're teaching right now, then start the session to generate a live rotating code.
          </p>
        </div>

        {classes.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-xs text-[#5C6B63] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#E0A23B]" />
            No classes loaded yet. If this doesn't populate shortly, check that `class-list` is returning data.
          </div>
        ) : (
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={sessionActive}
            className="w-full md:w-96 px-4 py-3 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-sm font-bold text-[#14201B] focus:outline-none focus:border-[#12A176] disabled:opacity-60"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.studentCount} students)
              </option>
            ))}
          </select>
        )}

        {startError && (
          <div className="mt-3 p-3 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 text-xs font-bold text-[#DB5B4E] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {startError}
          </div>
        )}
      </div>

      {/* LIVE SESSION CONTROL BAR */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-[#14201B] text-white shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-white">
              {selectedClass ? selectedClass.name : 'No class selected'}
            </h3>
            {sessionActive && (
              <p className="text-xs text-white/70 mt-0.5">
                Session window closes in {Math.floor(windowSecondsLeft / 60)}m {windowSecondsLeft % 60}s
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                disabled={isStarting || !selectedClass}
                className="px-6 py-3 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isStarting ? 'Starting…' : 'Start Session'}</span>
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="px-5 py-3 rounded-xl bg-[#DB5B4E] hover:opacity-90 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>End Session</span>
              </button>
            )}
          </div>
        </div>

        {sessionActive && (
          <div className="flex items-center gap-2 p-1.5 bg-[#F8FDFB] rounded-xl border border-[#DCEAE3] w-fit">
            <button
              onClick={() => setActiveTab('code_mode')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'code_mode' ? 'bg-[#14201B] text-white shadow-xs' : 'text-[#5C6B63] hover:text-[#14201B]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1.5 text-[#12A176]" /> Live Code & QR
            </button>
            <button
              onClick={() => setActiveTab('manual_rollcall')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'manual_rollcall' ? 'bg-[#14201B] text-white shadow-xs' : 'text-[#5C6B63] hover:text-[#14201B]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 inline mr-1.5 text-[#4E7FD6]" /> Manual Roll Call (local only)
            </button>
          </div>
        )}

        {!sessionActive ? (
          <div className="py-16 text-center rounded-2xl bg-[#F8FDFB] border border-[#DCEAE3] flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E5F5EE] border border-[#12A176]/30 flex items-center justify-center text-[#12A176]">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#14201B]">Session Standing By</h3>
              <p className="text-xs text-[#5C6B63] max-w-md mx-auto mt-1 font-medium">
                Click <strong>"Start Session"</strong> to generate a live rotating 6-digit code students can type in to check in.
              </p>
            </div>
          </div>
        ) : activeTab === 'code_mode' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-8 rounded-2xl bg-[#14201B] text-white flex flex-col items-center justify-between text-center relative overflow-hidden border border-[#DCEAE3] shadow-md">
              <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-6">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F5EE]/20 border border-[#12A176] text-[#E5F5EE] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#12A176] animate-ping" />
                  <span>Live code — refreshes in {codeSecondsLeft}s</span>
                </div>
              </div>

              <div className="p-6 bg-white rounded-2xl border-4 border-[#12A176]/60 shadow-xl relative">
                <QRCodeSVG
  value={JSON.stringify({ type: 'attendance_session', code: activeSession?.currentCode || '' })}
  size={230}
  level="H"
  includeMargin={true}
  fgColor="#14201B"
/>
                <div className="absolute -top-3 -right-3 w-11 h-11 rounded-full bg-[#12A176] text-white font-mono font-bold text-sm flex items-center justify-center shadow-lg ring-4 ring-[#14201B]">
                  {codeSecondsLeft}s
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest block">
                  6-Digit Code (students type this in)
                </span>
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-black/30 border border-white/10 shadow-inner">
                  {(activeSession?.currentCode || '------').split('').map((digit, idx) => (
                    <span
                      key={idx}
                      className="w-10 h-12 rounded-xl bg-[#1f3029] border border-[#12A176]/40 text-[#E5F5EE] font-mono text-2xl font-bold flex items-center justify-center shadow-xs"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-white/60">Live Check-In Progress</span>
                  <span className="text-white font-bold">
                    {markedCount} / {totalClassStudents || '?'} Verified ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-[#12A176] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#F8FDFB] border border-[#DCEAE3] flex flex-col h-[540px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCEAE3]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#12A176] animate-pulse" />
                  <h4 className="font-bold text-sm text-[#14201B]">Attendance Feed</h4>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#E5F5EE] text-[#12A176] text-[10px] font-bold tracking-wide">
                  Polling every 5s
                </span>
              </div>

              <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 pr-1">
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-white border border-[#DCEAE3] shadow-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-[#14201B]">{String(rec.student_id)}</h5>
                        <p className="text-[10px] text-[#5C6B63] font-mono">
                          {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-[#12A176] shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#DCEAE3] rounded-xl bg-white/70">
                    <div className="w-10 h-10 rounded-full bg-[#E5F5EE] flex items-center justify-center text-[#12A176] mb-2.5">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <h5 className="text-xs font-bold text-[#14201B]">Awaiting Check-Ins…</h5>
                    <p className="text-[11px] text-[#5C6B63] max-w-xs mt-1 leading-relaxed">
                      When students check in with the code, they'll appear here within 5 seconds.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-[#DCEAE3]">
                <div className="text-center text-[10px] text-[#5C6B63] flex items-center justify-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#12A176]" />
                  <span>Showing raw student_id — full profile join is a later step</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ComingSoon
     feature="Manual Roll Call"
     note="Needs the student roster wired up first — that's next after the QR/code flow ships."
         />
        )}
      </div>
    </div>
  );
};