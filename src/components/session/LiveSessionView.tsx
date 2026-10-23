import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  CheckCircle2,
  Play,
  Square,
  UserCheck,
  Users,
  Zap,
  Radio,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SkeletonDashboardView } from '../common/Skeleton';

let classListCache: { teacherId: string; classes: any[] } | null = null;

interface RosterStudent {
  id: string;
  name: string | null;
  enrollment_no: string | null;
}

interface OverrideRow {
  id: string;
  student_id: string;
  created_at: string;
  reason?: string | null;
  reason_note?: string | null;
  teacher_id?: string | null;
}

interface FeedRecordRow {
  id: string;
  session_id?: string;
  student_id: string;
  code_entered?: string | null;
  status?: string | null;
  reject_reason?: string | null;
  webauthn_verified?: boolean | null;
  device_fingerprint?: string | null;
  created_at: string;
}

const OVERRIDE_REASONS = [
  { value: 'late', label: 'Late' },
  { value: 'device_issue', label: 'Device issue' },
  { value: 'no_passkey', label: 'No passkey' },
  { value: 'other', label: 'Other' },
];

async function functionErrorMessage(error: unknown): Promise<string> {
  const err = error as { message?: string; context?: unknown } | null;
  const context = err?.context as
    | { json?: () => Promise<unknown>; text?: () => Promise<string> }
    | undefined;

  if (context) {
    try {
      if (typeof context.json === 'function') {
        const body = (await context.json()) as {
          message?: string;
          error?: string;
          reason?: string;
        } | null;
        if (body?.message || body?.error || body?.reason) {
          return body.message || body.error || body.reason || 'Failed to mark attendance';
        }
      }
    } catch {
      // fall through to the generic message
    }
  }

  return err?.message || 'Failed to mark attendance';
}

export const LiveSessionView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const { user, loading } = useAuth();
  const { activeSession, attendanceRecords, startSession, endSession } = useSession();

  const cachedClasses =
    classListCache && user && classListCache.teacherId === user.id
      ? classListCache.classes
      : null;

  const [classes, setClasses] = useState<any[]>(cachedClasses ?? []);
  const [classesLoading, setClassesLoading] = useState(!cachedClasses);
  const [classesError, setClassesError] = useState<string | null>(null);

  const teacherId = user?.id || '';

  useEffect(() => {
    let cancelled = false;

    const fetchClasses = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        setClasses([]);
        setClassesLoading(false);
        return;
      }

      const cache = classListCache;
      if (cache && cache.teacherId === session.user.id) {
        setClasses(cache.classes);
        setClassesLoading(false);
        setClassesError(null);
        return;
      }

      setClassesLoading(true);
      setClassesError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/class-list`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data || data.status !== 'ok' || !Array.isArray(data.classes)) {
          throw new Error(
            data?.message || data?.error || response.statusText || `class-list failed (${response.status})`
          );
        }

        if (cancelled) return;

        classListCache = { teacherId: session.user.id, classes: data.classes };
        setClasses(data.classes);
      } catch (err) {
        if (cancelled) return;
        setClasses([]);
        setClassesError(err instanceof Error ? err.message : 'Failed to load classes.');
      } finally {
        if (!cancelled) setClassesLoading(false);
      }
    };

    fetchClasses();

    return () => {
      cancelled = true;
    };
  }, []);


  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'code_mode' | 'manual_rollcall'>('code_mode');
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Manual roll call
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [overrideRows, setOverrideRows] = useState<OverrideRow[]>([]);
  const [feedRecords, setFeedRecords] = useState<FeedRecordRow[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedStudents, setFeedStudents] = useState<Record<string, RosterStudent>>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [isMarking, setIsMarking] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);
  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);

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
    () => (Array.isArray(classes) ? classes.find((c) => c.id === selectedClassId) : null),
    [classes, selectedClassId]
  );

  const selectedSubject = useMemo(
    () => (selectedClass?.subjects ? selectedClass.subjects.find((s: any) => s.id === selectedSubjectId) : null),
    [selectedClass, selectedSubjectId]
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
    const { error } = await startSession(selectedClass.id, teacherId, selectedClass.name, selectedSubjectId || null);
    setIsStarting(false);

    if (error) {
      setStartError(error);
    }
  };

  const handleEndSession = async () => {
    if (!teacherId) return;
    await endSession(teacherId);
  };

  const verifiedStudentIds = useMemo(() => {
    const set = new Set<string>();
    for (const record of attendanceRecords) {
      const status = String((record as { status?: unknown }).status ?? '');
      if (status === 'verified' || status === 'present') set.add(record.student_id);
    }
    return set;
  }, [attendanceRecords]);

  useEffect(() => {
    if (!sessionActive || !activeSession?.sessionId || !activeSession.classId) {
      setRoster([]);
      setOverrideRows([]);
      setFeedRecords([]);
      setFeedError(null);
      return;
    }

    let cancelled = false;

    const loadRoster = async () => {
      setRosterLoading(true);
      setRosterError(null);

      const enrollmentResult = await supabase
        .from('class_enrollments')
        .select('student_id, students(id, name, enrollment_no)')
        .eq('class_id', activeSession.classId);

      if (cancelled) return;

      if (enrollmentResult.error) {
        setRosterError(enrollmentResult.error.message);
        setRoster([]);
      } else {
        const rows: RosterStudent[] = [];
        for (const row of (enrollmentResult.data ?? []) as any[]) {
          const student = Array.isArray(row.students) ? row.students[0] : row.students;
          if (!student?.id) continue;
          rows.push({
            id: student.id,
            name: student.name ?? null,
            enrollment_no: student.enrollment_no ?? null,
          });
        }
        rows.sort(
          (a, b) =>
            (a.enrollment_no ?? '').localeCompare(b.enrollment_no ?? '', undefined, {
              numeric: true,
            }) || (a.name ?? '').localeCompare(b.name ?? '')
        );
        setRoster(rows);
      }

      setRosterLoading(false);
    };

    loadRoster();

    return () => {
      cancelled = true;
    };
  }, [sessionActive, activeSession?.sessionId, activeSession?.classId, rosterRefreshKey]);

  useEffect(() => {
    if (!sessionActive || !activeSession?.sessionId) {
      setOverrideRows([]);
      setFeedRecords([]);
      setFeedError(null);
      return;
    }

    let cancelled = false;

    const loadFeed = async () => {
      const [recordsResult, overridesResult] = await Promise.all([
        supabase
          .from('attendance_records')
          .select(
            'id, session_id, student_id, code_entered, status, reject_reason, webauthn_verified, device_fingerprint, created_at'
          )
          .eq('session_id', activeSession.sessionId),
        supabase
          .from('attendance_overrides')
          .select('id, student_id, created_at, reason, reason_note, teacher_id')
          .eq('session_id', activeSession.sessionId),
      ]);

      if (cancelled) return;

      const errors: string[] = [];

      if (recordsResult.error) {
        console.error('[LiveSessionView] attendance record lookup failed:', recordsResult.error);
        errors.push(recordsResult.error.message);
      } else {
        setFeedRecords((recordsResult.data ?? []) as FeedRecordRow[]);
      }

      if (overridesResult.error) {
        const overrideError = overridesResult.error;
        console.error('[LiveSessionView] override lookup failed:', overrideError);
        errors.push(overrideError.message);
        setRosterError((current) => current ?? overrideError.message);
      } else {
        setOverrideRows((overridesResult.data ?? []) as OverrideRow[]);
      }

      setFeedError(errors.length > 0 ? errors.join(' · ') : null);
    };

    loadFeed();
    const interval = setInterval(loadFeed, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionActive, activeSession?.sessionId, rosterRefreshKey]);

  useEffect(() => {
    const ids = new Set<string>();
    for (const record of feedRecords) ids.add(record.student_id);
    for (const override of overrideRows) ids.add(override.student_id);
    if (ids.size === 0) {
      setFeedStudents({});
      return;
    }

    let cancelled = false;

    const loadStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, enrollment_no')
        .in('id', Array.from(ids));

      if (cancelled) return;
      if (error) {
        console.error('[LiveSessionView] student lookup failed:', error);
        setFeedError(error.message);
        return;
      }

      const map: Record<string, RosterStudent> = {};
      for (const student of (data ?? []) as RosterStudent[]) {
        map[student.id] = student;
      }
      setFeedStudents(map);
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [feedRecords, overrideRows]);

  const overriddenStudentIds = useMemo(
    () => new Set(overrideRows.map((row) => row.student_id)),
    [overrideRows]
  );

  const studentById = useMemo(() => {
    const map = new Map<string, RosterStudent>();
    for (const student of roster) map.set(student.id, student);
    for (const student of Object.values(feedStudents) as RosterStudent[]) {
      map.set(student.id, student);
    }
    return map;
  }, [roster, feedStudents]);

  const feedEntries = useMemo(() => {
    const entries = new Map<
      string,
      { key: string; studentId: string; createdAt: string; manual: boolean }
    >();

    for (const record of feedRecords) {
      entries.set(record.student_id, {
        key: `record:${record.id}`,
        studentId: record.student_id,
        createdAt: record.created_at,
        manual: false,
      });
    }

    for (const row of overrideRows) {
      entries.set(row.student_id, {
        key: `override:${row.id}`,
        studentId: row.student_id,
        createdAt: row.created_at,
        manual: true,
      });
    }

    return Array.from(entries.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [feedRecords, overrideRows]);

  const presentStudentIds = useMemo(() => {
    const set = new Set<string>(verifiedStudentIds);
    for (const row of overrideRows) set.add(row.student_id);
    return set;
  }, [verifiedStudentIds, overrideRows]);

  useEffect(() => {
    setSelectedStudentIds([]);
    setOverrideReason('');
    setOverrideNote('');
    setOverrideError(null);
    setOverrideSuccess(null);
  }, [activeTab, activeSession?.sessionId]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
    setOverrideError(null);
    setOverrideSuccess(null);
  };

  const noteInvalid = overrideReason === 'other' && overrideNote.trim().length < 3;

  const handleMarkPresent = async () => {
    if (!activeSession) return;
    if (selectedStudentIds.length === 0) {
      setOverrideError('Select at least one student.');
      return;
    }
    if (!overrideReason) {
      setOverrideError('A reason is required.');
      return;
    }
    if (noteInvalid) {
      setOverrideError('A note of at least 3 characters is required when the reason is Other.');
      return;
    }

    setIsMarking(true);
    setOverrideError(null);
    setOverrideSuccess(null);

    try {
      const { data, error } = await supabase.functions.invoke('attendance-override', {
        body: {
          sessionId: activeSession.sessionId,
          studentIds: selectedStudentIds,
          reason: overrideReason,
          note: overrideNote.trim(),
        },
      });

      if (error) {
        setOverrideError(await functionErrorMessage(error));
        return;
      }

      if (data?.status === 'error') {
        setOverrideError(data.message || 'Failed to mark attendance');
        return;
      }

      const added = Number(data?.added ?? data?.addedCount ?? data?.counts?.added ?? 0);
      const skipped = Number(data?.skipped ?? data?.skippedCount ?? data?.counts?.skipped ?? 0);

      setOverrideSuccess(`Manual marks saved: ${added} added, ${skipped} skipped.`);
      setSelectedStudentIds([]);
      setOverrideReason('');
      setOverrideNote('');
      setRosterRefreshKey((key) => key + 1);
    } catch (err) {
      setOverrideError(err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setIsMarking(false);
    }
  };

  const codeSecondsLeft = activeSession
    ? Math.max(0, Math.round((new Date(activeSession.codeExpiresAt).getTime() - now) / 1000))
    : 0;

  const windowSecondsLeft = activeSession
    ? Math.max(0, Math.round((new Date(activeSession.windowEnd).getTime() - now) / 1000))
    : 0;

  const totalClassStudents = selectedClass?.studentCount ?? 0;
  const markedCount = presentStudentIds.size;
  const progressPercent = totalClassStudents > 0 ? Math.round((markedCount / totalClassStudents) * 100) : 0;

  if (loading || isLoading) {
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
            Rotating 6-digit live code & QR for attendance
          </p>
        </div>

        {classesLoading ? (
          <div className="p-4 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-xs text-[#5C6B63] font-medium flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#12A176] animate-spin" />
            Loading classes…
          </div>
        ) : classesError ? (
          <div className="p-4 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 text-xs font-bold text-[#DB5B4E] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words">{classesError}</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-xs text-[#5C6B63] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#E0A23B]" />
            No classes found.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId('');
                }}
                disabled={sessionActive}
                className="w-full px-4 py-3 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-sm font-bold text-[#14201B] focus:outline-none focus:border-[#12A176] disabled:opacity-60"
              >
                {Array.isArray(classes) && classes.map((c) => {
                  const sectionLabel = c.section === 'ALL' ? '· All divisions' : (c.section || '');
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {sectionLabel} ({c.studentCount} students)
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedClass?.subjects && selectedClass.subjects.length > 0 && (
              <div className="flex-1 max-w-md">
                <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={sessionActive}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-sm font-bold text-[#14201B] focus:outline-none focus:border-[#12A176] disabled:opacity-60"
                >
                  {selectedClass.isClassTeacher && (
                    <option value="">No specific subject</option>
                  )}
                  {!selectedClass.isClassTeacher && (
                    <option value="" disabled>Select a subject</option>
                  )}
                  {selectedClass.subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
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
              {selectedClass ? `${selectedClass.name} ${selectedClass.section === 'ALL' ? '· All divisions' : (selectedClass.section || '')}` : 'No class selected'}
              {sessionActive && selectedSubject && ` · ${selectedSubject.name}`}
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
                disabled={isStarting || !selectedClass || (!selectedClass.isClassTeacher && !selectedSubjectId)}
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
              <UserCheck className="w-3.5 h-3.5 inline mr-1.5 text-[#4E7FD6]" /> Manual Roll Call
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
                {feedError && (
                  <div className="p-3 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 text-xs font-bold text-[#DB5B4E] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="break-words">{feedError}</span>
                  </div>
                )}
                {feedEntries.length > 0 ? (
                  feedEntries.map((entry) => {
                    const student = studentById.get(entry.studentId);
                    return (
                      <div
                        key={entry.key}
                        className="p-3 rounded-xl bg-white border border-[#DCEAE3] shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-[#14201B] truncate">
                              {student?.name?.trim() || 'Unknown student'}
                            </h5>
                            {entry.manual && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#4E7FD6]/15 text-[#4E7FD6] text-[8px] font-black uppercase">
                                manual
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#5C6B63] font-mono">
                            {student?.enrollment_no?.trim() || '—'}
                          </p>
                          <p className="text-[10px] text-[#5C6B63] font-mono">
                            {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[#12A176] shrink-0" />
                      </div>
                    );
                  })
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
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">
                  Reason <span className="text-[#DB5B4E]">*</span>
                </label>
                <select
                  value={overrideReason}
                  onChange={(event) => {
                    setOverrideReason(event.target.value);
                    setOverrideError(null);
                    setOverrideSuccess(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-sm font-bold text-[#14201B] focus:outline-none focus:border-[#12A176]"
                >
                  <option value="">Select a reason</option>
                  {OVERRIDE_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">
                  Note {overrideReason === 'other' && <span className="text-[#DB5B4E]">*</span>}
                </label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(event) => {
                    setOverrideNote(event.target.value);
                    setOverrideError(null);
                    setOverrideSuccess(null);
                  }}
                  placeholder={overrideReason === 'other' ? 'Required — at least 3 characters' : 'Optional note'}
                  className="w-full px-4 py-3 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-sm font-semibold text-[#14201B] focus:outline-none focus:border-[#12A176]"
                />
                {noteInvalid && (
                  <p className="text-[11px] text-[#DB5B4E] font-bold mt-1 ml-1">
                    A note of at least 3 characters is required when the reason is Other.
                  </p>
                )}
              </div>
            </div>

            {rosterError && (
              <div className="p-3 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 text-xs font-bold text-[#DB5B4E] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">{rosterError}</span>
              </div>
            )}

            {overrideError && (
              <div className="p-3 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 text-xs font-bold text-[#DB5B4E] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">{overrideError}</span>
              </div>
            )}

            {overrideSuccess && (
              <div className="p-3 rounded-xl bg-[#E5F5EE] border border-[#12A176]/30 text-xs font-bold text-[#12A176] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{overrideSuccess}</span>
              </div>
            )}

            <div className="rounded-2xl border border-[#DCEAE3] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#F8FDFB] border-b border-[#DCEAE3]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#12A176]" />
                  <h4 className="text-sm font-bold text-[#14201B]">Class roster</h4>
                </div>
                <span className="text-[10px] font-bold text-[#5C6B63]">
                  {selectedStudentIds.length} selected · {roster.length} students
                </span>
              </div>

              {rosterLoading ? (
                <div className="p-8 text-center text-xs text-[#5C6B63] font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#12A176]" /> Loading roster…
                </div>
              ) : roster.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5C6B63] font-semibold">
                  No students are enrolled in this class.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto divide-y divide-[#DCEAE3]">
                  {roster.map((student) => {
                    const alreadyPresent =
                      verifiedStudentIds.has(student.id) || overriddenStudentIds.has(student.id);

                    return (
                      <label
                        key={student.id}
                        className={`flex items-center justify-between gap-3 px-4 py-3 ${
                          alreadyPresent ? 'bg-[#E5F5EE]/40' : 'bg-white hover:bg-[#F8FDFB]'
                        } ${alreadyPresent ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={alreadyPresent || selectedStudentIds.includes(student.id)}
                            disabled={alreadyPresent}
                            onChange={() => toggleStudent(student.id)}
                            className="w-4 h-4 rounded border-[#DCEAE3] text-[#12A176] focus:ring-[#12A176] disabled:opacity-60"
                          />
                          <div className="min-w-0">
                            <span className="block text-sm font-bold text-[#14201B] truncate">
                              {student.name?.trim() || 'Unknown student'}
                            </span>
                            <span className="block text-[11px] text-[#5C6B63] font-mono">
                              {student.enrollment_no?.trim() || '—'}
                            </span>
                          </div>
                        </div>

                        {alreadyPresent && (
                          <span className="shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#E5F5EE] text-[#12A176] border border-[#12A176]/30">
                            Already present
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleMarkPresent}
                disabled={
                  isMarking ||
                  selectedStudentIds.length === 0 ||
                  !overrideReason ||
                  noteInvalid
                }
                className="px-6 py-3 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isMarking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                <span>{isMarking ? 'Marking…' : 'Mark present'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};