import React, { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Check,
  AlertTriangle,
  ShieldAlert,
  Flag,
  RefreshCw,
  Users,
  BookOpen,
  Clock,
  UserX,
  Loader2,
  AlertCircle,
  Inbox,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTable } from '../common/Skeleton';

const PRESENT_THRESHOLD = 75;

type TabKey = 'sheet' | 'rejected' | 'flags' | 'manual';

interface TeacherPair {
  classId: string;
  className: string;
  classSection: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
}

interface SessionRow {
  id: string;
  class_id: string;
  subject_id: string | null;
  window_start: string;
  window_end: string;
  status: string | null;
}

interface StudentRow {
  id: string;
  name: string | null;
  email: string | null;
  enrollment_no: string | null;
}

interface AttendanceRecordRow {
  id: string;
  session_id: string;
  student_id: string | null;
  code_entered: string | null;
  status: string | null;
  reject_reason: string | null;
  webauthn_verified: boolean | null;
  device_fingerprint: string | null;
  created_at: string | null;
}

interface AttendanceOverrideRow {
  id: string;
  session_id: string;
  student_id: string;
  teacher_id: string | null;
  reason: string | null;
  reason_note: string | null;
  created_at: string | null;
}

interface AttendanceFlagRow {
  id: string;
  attendance_id: string | null;
  session_id: string;
  reason: string | null;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  device_fingerprint: string | null;
  flagged_student_id: string | null;
  conflicting_student_id: string | null;
}

interface SheetData {
  sessions: SessionRow[];
  enrolledStudentIds: string[];
  students: StudentRow[];
  records: AttendanceRecordRow[];
  overrides: AttendanceOverrideRow[];
  flags: AttendanceFlagRow[];
}

interface ManualMarkSessionRow {
  id: string;
  subject_id: string | null;
  window_start: string;
}

interface ManualMarkRow {
  id: string;
  createdAt: string | null;
  sessionStart: string | null;
  subjectName: string;
  subjectCode: string | null;
  studentName: string;
  enrollmentNo: string;
  reason: string;
  note: string;
  teacherName: string;
}

const EMPTY_DATA: SheetData = {
  sessions: [],
  enrolledStudentIds: [],
  students: [],
  records: [],
  overrides: [],
  flags: [],
};

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

function sessionLabel(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

const OVERRIDE_REASON_LABELS: Record<string, string> = {
  late: 'Late',
  device_issue: 'Device issue',
  no_passkey: 'No passkey',
  other: 'Other',
};

function formatOverrideReason(reason: string | null): string {
  if (!reason) return '—';
  return OVERRIDE_REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: unknown[][]): void {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'attendance';
}

async function fetchAllRows<T>(
  factory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await factory(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function isPermissionError(value: unknown): boolean {
  const err = value as { code?: string; status?: number; message?: string } | null;
  const message = String(err?.message ?? '').toLowerCase();
  return (
    err?.code === '42501' ||
    err?.code === 'PGRST301' ||
    err?.status === 403 ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  );
}

function errorMessage(value: unknown): string {
  const err = value as { message?: string; details?: string; hint?: string } | null;
  return err?.message || err?.details || err?.hint || 'Unknown error';
}

function isFlagResolved(flag: AttendanceFlagRow): boolean {
  return (
    Boolean(flag.resolved_at) ||
    Boolean(flag.resolved_by) ||
    Boolean(flag.resolution && flag.resolution.trim())
  );
}

export const AttendanceSheetView: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const teacherId = user?.id ?? '';

  const today = useMemo(() => new Date(), []);
  const [dateFrom, setDateFrom] = useState(() =>
    toInputDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [dateTo, setDateTo] = useState(() => toInputDate(today));

  const [pairs, setPairs] = useState<TeacherPair[]>([]);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [pairsError, setPairsError] = useState<unknown>(null);
  const [pairsRetry, setPairsRetry] = useState(0);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [data, setData] = useState<SheetData>(EMPTY_DATA);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<unknown>(null);
  const [manualMarks, setManualMarks] = useState<ManualMarkRow[]>([]);
  const [manualMarksLoading, setManualMarksLoading] = useState(false);
  const [manualMarksError, setManualMarksError] = useState<unknown>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>('sheet');

  useEffect(() => {
    if (!teacherId) {
      setPairs([]);
      setPairsLoading(false);
      return;
    }

    let cancelled = false;
    setPairsLoading(true);
    setPairsError(null);

    (async () => {
      const { data: rows, error } = await supabase
        .from('class_subject_teachers')
        .select('class_id, subject_id, classes(id, name, section), subjects(id, name, code)')
        .eq('teacher_id', teacherId);

      if (cancelled) return;

      if (error) {
        setPairsError(error);
        setPairs([]);
        setPairsLoading(false);
        return;
      }

      const result: TeacherPair[] = [];
      const seen = new Set<string>();

      for (const row of (rows ?? []) as any[]) {
        const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes;
        const subj = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
        if (!row.class_id || !row.subject_id || !cls || !subj) continue;

        const key = `${row.class_id}:${row.subject_id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
          classId: row.class_id,
          className: cls.name ?? 'Untitled class',
          classSection: cls.section ?? null,
          subjectId: row.subject_id,
          subjectName: subj.name ?? 'Untitled subject',
          subjectCode: subj.code ?? null,
        });
      }

      result.sort(
        (a, b) =>
          a.className.localeCompare(b.className) ||
          (a.classSection ?? '').localeCompare(b.classSection ?? '') ||
          a.subjectName.localeCompare(b.subjectName)
      );

      setPairs(result);
      setPairsLoading(false);

      if (result.length > 0) {
        setSelectedClassId((current) =>
          result.some((p) => p.classId === current) ? current : result[0].classId
        );
        setSelectedSubjectId((current) =>
          result.some((p) => p.subjectId === current) ? current : result[0].subjectId
        );
      } else {
        setSelectedClassId('');
        setSelectedSubjectId('');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId, pairsRetry]);

  const classOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; section: string | null }>();
    for (const pair of pairs) {
      if (!map.has(pair.classId)) {
        map.set(pair.classId, {
          id: pair.classId,
          name: pair.className,
          section: pair.classSection,
        });
      }
    }
    return Array.from(map.values());
  }, [pairs]);

  const subjectOptions = useMemo(
    () => pairs.filter((pair) => pair.classId === selectedClassId),
    [pairs, selectedClassId]
  );

  useEffect(() => {
    if (subjectOptions.length === 0) {
      setSelectedSubjectId('');
      return;
    }
    if (!subjectOptions.some((pair) => pair.subjectId === selectedSubjectId)) {
      setSelectedSubjectId(subjectOptions[0].subjectId);
    }
  }, [subjectOptions, selectedSubjectId]);

  useEffect(() => {
    if (!teacherId || !selectedClassId || !selectedSubjectId || !dateFrom || !dateTo) {
      setData(EMPTY_DATA);
      setDataLoading(false);
      return;
    }

    if (dateFrom > dateTo) {
      setData(EMPTY_DATA);
      setDataError(new Error('Start date must be on or before the end date.'));
      setDataLoading(false);
      return;
    }

    let cancelled = false;
    setDataLoading(true);
    setDataError(null);

    (async () => {
      try {
        const rangeStart = new Date(`${dateFrom}T00:00:00`).toISOString();
        const rangeEnd = new Date(`${dateTo}T23:59:59.999`).toISOString();

        const [sessionResult, enrollmentResult] = await Promise.all([
          supabase
            .from('sessions')
            .select('id, class_id, subject_id, window_start, window_end, status')
            .eq('class_id', selectedClassId)
            .eq('subject_id', selectedSubjectId)
            .eq('teacher_id', teacherId)
            .gte('window_start', rangeStart)
            .lte('window_start', rangeEnd)
            .order('window_start', { ascending: true }),
          fetchAllRows<{ student_id: string }>((from, to) =>
            supabase
              .from('class_enrollments')
              .select('student_id')
              .eq('class_id', selectedClassId)
              .order('student_id', { ascending: true })
              .range(from, to)
          ),
        ]);

        if (sessionResult.error) throw sessionResult.error;

        const sessions = (sessionResult.data ?? []) as SessionRow[];
        const sessionIds = sessions.map((session) => session.id);
        const enrolledStudentIds = (enrollmentResult ?? [])
          .map((row) => row.student_id)
          .filter(Boolean);

        let records: AttendanceRecordRow[] = [];
        let overrides: AttendanceOverrideRow[] = [];
        let flags: AttendanceFlagRow[] = [];

        if (sessionIds.length > 0) {
          [records, overrides, flags] = await Promise.all([
            fetchAllRows<AttendanceRecordRow>((from, to) =>
              supabase
                .from('attendance_records')
                .select(
                  'id, session_id, student_id, code_entered, status, reject_reason, webauthn_verified, device_fingerprint, created_at'
                )
                .in('session_id', sessionIds)
                .order('created_at', { ascending: true })
                .range(from, to)
            ),
            fetchAllRows<AttendanceOverrideRow>((from, to) =>
              supabase
                .from('attendance_overrides')
                .select('id, session_id, student_id, teacher_id, reason, reason_note, created_at')
                .in('session_id', sessionIds)
                .order('created_at', { ascending: true })
                .range(from, to)
            ),
            fetchAllRows<AttendanceFlagRow>((from, to) =>
              supabase
                .from('attendance_flags')
                .select(
                  'id, attendance_id, session_id, reason, resolution, resolved_by, resolved_at, device_fingerprint, flagged_student_id, conflicting_student_id'
                )
                .in('session_id', sessionIds)
                .order('created_at', { ascending: true })
                .range(from, to)
            ),
          ]);
        }

        const studentIds = new Set<string>(enrolledStudentIds);
        records.forEach((row) => row.student_id && studentIds.add(row.student_id));
        overrides.forEach((row) => row.student_id && studentIds.add(row.student_id));
        flags.forEach((row) => {
          if (row.flagged_student_id) studentIds.add(row.flagged_student_id);
          if (row.conflicting_student_id) studentIds.add(row.conflicting_student_id);
        });

        let students: StudentRow[] = [];
        if (studentIds.size > 0) {
          students = await fetchAllRows<StudentRow>((from, to) =>
            supabase
              .from('students')
              .select('id, name, email, enrollment_no')
              .in('id', Array.from(studentIds))
              .order('id', { ascending: true })
              .range(from, to)
          );
        }

        if (cancelled) return;

        setData({
          sessions,
          enrolledStudentIds,
          students,
          records,
          overrides,
          flags,
        });
      } catch (err) {
        if (!cancelled) {
          setData(EMPTY_DATA);
          setDataError(err);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId, selectedClassId, selectedSubjectId, dateFrom, dateTo, refreshKey]);

  const selectedPair = useMemo(
    () =>
      pairs.find(
        (pair) => pair.classId === selectedClassId && pair.subjectId === selectedSubjectId
      ) ?? null,
    [pairs, selectedClassId, selectedSubjectId]
  );

  useEffect(() => {
    if (!teacherId || !selectedClassId || !dateFrom || !dateTo) {
      setManualMarks([]);
      setManualMarksError(null);
      setManualMarksLoading(false);
      return;
    }

    if (dateFrom > dateTo) {
      setManualMarks([]);
      setManualMarksError(new Error('Start date must be on or before the end date.'));
      setManualMarksLoading(false);
      return;
    }

    let cancelled = false;
    setManualMarksLoading(true);
    setManualMarksError(null);

    (async () => {
      try {
        const rangeStart = new Date(`${dateFrom}T00:00:00`).toISOString();
        const rangeEnd = new Date(`${dateTo}T23:59:59.999`).toISOString();

        const { data: sessionRows, error: sessionError } = await supabase
          .from('sessions')
          .select('id, subject_id, window_start')
          .eq('class_id', selectedClassId)
          .gte('window_start', rangeStart)
          .lte('window_start', rangeEnd);

        if (sessionError) throw sessionError;

        const sessions = (sessionRows ?? []) as ManualMarkSessionRow[];
        if (sessions.length === 0) {
          if (!cancelled) setManualMarks([]);
          return;
        }

        const sessionIds = sessions.map((session) => session.id);
        const overrides = await fetchAllRows<AttendanceOverrideRow>((from, to) =>
          supabase
            .from('attendance_overrides')
            .select('id, session_id, student_id, teacher_id, reason, reason_note, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
            .range(from, to)
        );

        const studentIds = Array.from(
          new Set(overrides.map((row) => row.student_id).filter(Boolean))
        );
        const teacherIds = Array.from(
          new Set(overrides.map((row) => row.teacher_id).filter(Boolean))
        ) as string[];
        const subjectIds = Array.from(
          new Set(sessions.map((row) => row.subject_id).filter(Boolean))
        ) as string[];

        const students =
          studentIds.length > 0
            ? await fetchAllRows<StudentRow>((from, to) =>
                supabase
                  .from('students')
                  .select('id, name, email, enrollment_no')
                  .in('id', studentIds)
                  .range(from, to)
              )
            : [];

        let teachers: { id: string; name: string | null }[] = [];
        if (teacherIds.length > 0) {
          const { data, error } = await supabase
            .from('teachers')
            .select('id, name')
            .in('id', teacherIds);
          if (error) {
            console.error('[AttendanceSheetView] teacher lookup failed:', error);
          } else {
            teachers = (data ?? []) as { id: string; name: string | null }[];
          }
        }

        let subjects: { id: string; name: string | null; code: string | null }[] = [];
        if (subjectIds.length > 0) {
          const { data, error } = await supabase
            .from('subjects')
            .select('id, name, code')
            .in('id', subjectIds);
          if (error) {
            console.error('[AttendanceSheetView] subject lookup failed:', error);
          } else {
            subjects = (data ?? []) as {
              id: string;
              name: string | null;
              code: string | null;
            }[];
          }
        }

        if (cancelled) return;

        const sessionById = new Map(sessions.map((session) => [session.id, session]));
        const studentById = new Map(students.map((student) => [student.id, student]));
        const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
        const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

        const rows: ManualMarkRow[] = overrides.map((override) => {
          const session = sessionById.get(override.session_id);
          const student = studentById.get(override.student_id);
          const subject = session?.subject_id ? subjectById.get(session.subject_id) : null;
          const teacherName =
            (override.teacher_id ? teacherById.get(override.teacher_id)?.name : null) ||
            (override.teacher_id === teacherId ? user?.name : null) ||
            null;

          return {
            id: override.id,
            createdAt: override.created_at,
            sessionStart: session?.window_start ?? null,
            subjectName: subject?.name?.trim() || '—',
            subjectCode: subject?.code?.trim() || null,
            studentName: student?.name?.trim() || 'Unknown student',
            enrollmentNo: student?.enrollment_no?.trim() || '—',
            reason: formatOverrideReason(override.reason),
            note: override.reason_note?.trim() || '—',
            teacherName: teacherName?.trim() || '—',
          };
        });

        rows.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        setManualMarks(rows);
      } catch (err) {
        if (!cancelled) {
          setManualMarks([]);
          setManualMarksError(err);
        }
      } finally {
        if (!cancelled) setManualMarksLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId, user?.name, selectedClassId, dateFrom, dateTo, refreshKey]);

  const studentById = useMemo(() => {
    const map = new Map<string, StudentRow>();
    for (const student of data.students) map.set(student.id, student);
    return map;
  }, [data.students]);

  const enrolledStudents = useMemo(() => {
    const rows = data.enrolledStudentIds
      .map((id) => studentById.get(id))
      .filter((student): student is StudentRow => Boolean(student));
    rows.sort(
      (a, b) =>
        (a.enrollment_no ?? '').localeCompare(b.enrollment_no ?? '', undefined, {
          numeric: true,
        }) || (a.name ?? '').localeCompare(b.name ?? '')
    );
    return rows;
  }, [data.enrolledStudentIds, studentById]);

  const verifiedSet = useMemo(() => {
    const set = new Set<string>();
    for (const record of data.records) {
      if (record.status === 'verified' && record.student_id) {
        set.add(`${record.session_id}:${record.student_id}`);
      }
    }
    return set;
  }, [data.records]);

  const overrideSet = useMemo(() => {
    const set = new Set<string>();
    for (const override of data.overrides) {
      if (override.student_id) set.add(`${override.session_id}:${override.student_id}`);
    }
    return set;
  }, [data.overrides]);

  const unresolvedFlagSet = useMemo(() => {
    const set = new Set<string>();
    for (const flag of data.flags) {
      if (isFlagResolved(flag)) continue;
      if (flag.flagged_student_id) {
        set.add(`${flag.session_id}:${flag.flagged_student_id}`);
      }
      if (flag.conflicting_student_id) {
        set.add(`${flag.session_id}:${flag.conflicting_student_id}`);
      }
    }
    return set;
  }, [data.flags]);

  const rejectedRecords = useMemo(
    () =>
      data.records
        .filter((record) => record.status !== 'verified')
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        }),
    [data.records]
  );

  const sortedFlags = useMemo(
    () =>
      [...data.flags].sort((a, b) => {
        const aResolved = isFlagResolved(a);
        const bResolved = isFlagResolved(b);
        if (aResolved !== bResolved) return aResolved ? 1 : -1;
        const aTime = a.resolved_at ? new Date(a.resolved_at).getTime() : 0;
        const bTime = b.resolved_at ? new Date(b.resolved_at).getTime() : 0;
        return bTime - aTime;
      }),
    [data.flags]
  );

  const sessionColumnLabels = useMemo(
    () => data.sessions.map((session) => sessionLabel(session.window_start)),
    [data.sessions]
  );

  const studentName = (id: string | null | undefined): string => {
    if (!id) return '—';
    return studentById.get(id)?.name?.trim() || 'Unknown student';
  };

  const studentEnrollment = (id: string | null | undefined): string => {
    if (!id) return '—';
    return studentById.get(id)?.enrollment_no?.trim() || '—';
  };

  const handleExport = () => {
    const className = selectedPair
      ? `${selectedPair.className}${selectedPair.classSection ? `_${selectedPair.classSection}` : ''}`
      : 'class';
    const subjectName = selectedPair?.subjectName ?? 'subject';
    const base = safeFilenamePart(`${className}_${subjectName}_${dateFrom}_${dateTo}`);

    if (activeTab === 'sheet') {
      const rows: unknown[][] = [
        [
          'Enrollment No',
          'Student Name',
          ...sessionColumnLabels,
          'Attendance %',
        ],
        ...enrolledStudents.map((student) => {
          let presentCount = 0;
          const cells = data.sessions.map((session) => {
            const key = `${session.id}:${student.id}`;
            const isPresent = verifiedSet.has(key) || overrideSet.has(key);
            if (isPresent) presentCount += 1;
            const manual = overrideSet.has(key);
            return isPresent ? (manual ? 'Present (manual)' : 'Present') : 'Absent';
          });
          const percentage =
            data.sessions.length > 0
              ? `${Math.round((presentCount / data.sessions.length) * 100)}%`
              : '—';
          return [
            student.enrollment_no ?? '',
            student.name ?? '',
            ...cells,
            percentage,
          ];
        }),
      ];
      downloadCsv(`attendance_sheet_${base}.csv`, rows);
      return;
    }

    if (activeTab === 'rejected') {
      const rows: unknown[][] = [
        ['Enrollment No', 'Student Name', 'Session', 'Time', 'Reject Reason', 'WebAuthn Verified'],
        ...rejectedRecords.map((record) => [
          studentEnrollment(record.student_id),
          studentName(record.student_id),
          (() => {
            const session = data.sessions.find((s) => s.id === record.session_id);
            return session ? sessionLabel(session.window_start) : '—';
          })(),
          formatDateTime(record.created_at),
          record.reject_reason ?? '',
          record.webauthn_verified ? 'Yes' : 'No',
        ]),
      ];
      downloadCsv(`rejected_attempts_${base}.csv`, rows);
      return;
    }

    if (activeTab === 'manual') {
      const rows: unknown[][] = [
        ['Date', 'Subject', 'Enrollment No', 'Student Name', 'Reason', 'Note', 'Marked By'],
        ...manualMarks.map((mark) => [
          formatDate(mark.sessionStart),
          mark.subjectCode ? `${mark.subjectName} (${mark.subjectCode})` : mark.subjectName,
          mark.enrollmentNo,
          mark.studentName,
          mark.reason,
          mark.note,
          mark.teacherName,
        ]),
      ];
      downloadCsv(`manual_marks_${base}.csv`, rows);
      return;
    }

    const rows: unknown[][] = [
      [
        'Flagged Student',
        'Flagged Enrollment No',
        'Conflicting Student',
        'Conflicting Enrollment No',
        'Session',
        'Reason',
        'Resolution Status',
      ],
      ...sortedFlags.map((flag) => {
        const session = data.sessions.find((s) => s.id === flag.session_id);
        return [
          studentName(flag.flagged_student_id),
          studentEnrollment(flag.flagged_student_id),
          studentName(flag.conflicting_student_id),
          studentEnrollment(flag.conflicting_student_id),
          session ? sessionLabel(session.window_start) : '—',
          flag.reason ?? '',
          isFlagResolved(flag) ? flag.resolution || 'Resolved' : 'Unresolved',
        ];
      }),
    ];
    downloadCsv(`attendance_flags_${base}.csv`, rows);
  };

  const handleRefresh = () => setRefreshKey((key) => key + 1);

  if (authLoading || pairsLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#14201B] pb-28">
        <SkeletonTable rows={8} />
      </div>
    );
  }

  const renderError = (error: unknown, onRetry?: () => void) => (
    <div className="p-5 rounded-2xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#DB5B4E] shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#DB5B4E]">
            {isPermissionError(error)
              ? 'Database permission denied'
              : 'Could not load attendance data'}
          </h3>
          <p className="text-xs text-[#5C6B63] mt-1 break-words">{errorMessage(error)}</p>
          {isPermissionError(error) && (
            <p className="text-xs text-[#5C6B63] mt-2">
              A SELECT grant or RLS policy is missing for your teacher account. No service-role
              bypass is used. Ask an administrator to apply the attendance-sheet SQL grants and
              policies for the authenticated role.
            </p>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3.5 py-2 rounded-xl bg-white border border-[#DCEAE3] text-xs font-semibold text-[#14201B] hover:bg-[#F8FDFB] flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );

  const emptyState = (title: string, description: string) => (
    <div className="py-16 px-6 text-center rounded-2xl bg-[#F8FDFB] border border-dashed border-[#DCEAE3] flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-[#E5F5EE] flex items-center justify-center text-[#12A176] mb-3">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-[#14201B]">{title}</h3>
      <p className="text-xs text-[#5C6B63] font-medium mt-1 max-w-md">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#14201B] pb-28">
      <div className="p-6 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#E5F5EE] flex items-center justify-center text-[#12A176]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#14201B] tracking-tight">Attendance Sheet</h2>
            <p className="text-xs text-[#5C6B63] font-medium mt-0.5">
              Verified check-ins and manual overrides per session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={!selectedPair || dataLoading}
            className="px-3.5 py-2 rounded-xl bg-[#F8FDFB] text-[#14201B] border border-[#DCEAE3] hover:bg-[#E5F5EE] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#12A176] ${dataLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExport}
            disabled={dataLoading}
            className="px-4 py-2 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {pairsError ? (
        renderError(pairsError, () => setPairsRetry((value) => value + 1))
      ) : pairs.length === 0 ? (
        emptyState(
          'No class/subject assignments',
          'You are not assigned to any class and subject yet. An administrator must add rows to class_subject_teachers for your teacher account.'
        )
      ) : (
        <>
          <div className="p-5 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">
                  Class
                </label>
                <div className="flex items-center gap-2 bg-[#F8FDFB] px-3 rounded-xl border border-[#DCEAE3] focus-within:border-[#12A176]">
                  <Users className="w-4 h-4 text-[#12A176] shrink-0" />
                  <select
                    value={selectedClassId}
                    onChange={(event) => {
                      setSelectedClassId(event.target.value);
                      setSelectedSubjectId('');
                    }}
                    className="w-full bg-transparent py-2.5 text-xs font-semibold text-[#14201B] focus:outline-none cursor-pointer"
                  >
                    {classOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                        {option.section ? ` — ${option.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">
                  Subject
                </label>
                <div className="flex items-center gap-2 bg-[#F8FDFB] px-3 rounded-xl border border-[#DCEAE3] focus-within:border-[#12A176]">
                  <BookOpen className="w-4 h-4 text-[#12A176] shrink-0" />
                  <select
                    value={selectedSubjectId}
                    onChange={(event) => setSelectedSubjectId(event.target.value)}
                    className="w-full bg-transparent py-2.5 text-xs font-semibold text-[#14201B] focus:outline-none cursor-pointer"
                  >
                    {subjectOptions.map((option) => (
                      <option key={option.subjectId} value={option.subjectId}>
                        {option.subjectName}
                        {option.subjectCode ? ` (${option.subjectCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">
                  From
                </label>
                <div className="flex items-center gap-2 bg-[#F8FDFB] px-3 rounded-xl border border-[#DCEAE3] focus-within:border-[#12A176]">
                  <Calendar className="w-4 h-4 text-[#12A176] shrink-0" />
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="w-full bg-transparent py-2.5 text-xs font-semibold text-[#14201B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#5C6B63] mb-1.5 ml-1">
                  To
                </label>
                <div className="flex items-center gap-2 bg-[#F8FDFB] px-3 rounded-xl border border-[#DCEAE3] focus-within:border-[#12A176]">
                  <Calendar className="w-4 h-4 text-[#12A176] shrink-0" />
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="w-full bg-transparent py-2.5 text-xs font-semibold text-[#14201B] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DCEAE3] text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-[#E5F5EE] text-[#12A176] font-bold">
                {data.sessions.length} session{data.sessions.length === 1 ? '' : 's'} in range
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F8FDFB] border border-[#DCEAE3] text-[#5C6B63] font-semibold">
                {enrolledStudents.length} enrolled student{enrolledStudents.length === 1 ? '' : 's'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#DB5B4E]/10 border border-[#DB5B4E]/20 text-[#DB5B4E] font-bold">
                {rejectedRecords.length} rejected attempt{rejectedRecords.length === 1 ? '' : 's'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#E0A23B]/10 border border-[#E0A23B]/25 text-[#B77A16] font-bold">
                {sortedFlags.filter((flag) => !isFlagResolved(flag)).length} unresolved flag
                {sortedFlags.filter((flag) => !isFlagResolved(flag)).length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {dataError ? (
            renderError(dataError, handleRefresh)
          ) : dataLoading ? (
            <SkeletonTable rows={8} />
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm">
              <div className="flex items-center gap-1.5 p-1.5 bg-[#F8FDFB] rounded-xl border border-[#DCEAE3] w-fit mb-4 flex-wrap">
                <button
                  onClick={() => setActiveTab('sheet')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'sheet'
                      ? 'bg-[#14201B] text-white shadow-sm'
                      : 'text-[#5C6B63] hover:text-[#14201B]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5" /> Attendance
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'rejected'
                      ? 'bg-[#14201B] text-white shadow-sm'
                      : 'text-[#5C6B63] hover:text-[#14201B]'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 inline mr-1.5" /> Rejected attempts ({rejectedRecords.length})
                </button>
                <button
                  onClick={() => setActiveTab('flags')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'flags'
                      ? 'bg-[#14201B] text-white shadow-sm'
                      : 'text-[#5C6B63] hover:text-[#14201B]'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 inline mr-1.5" /> Flags ({sortedFlags.length})
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'manual'
                      ? 'bg-[#14201B] text-white shadow-sm'
                      : 'text-[#5C6B63] hover:text-[#14201B]'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" /> Manual marks (
                  {manualMarks.length})
                </button>
              </div>

              {activeTab === 'sheet' && (
                <>
                  <div className="flex items-center gap-3 flex-wrap pb-4 mb-3 border-b border-[#DCEAE3] text-[11px]">
                    <span className="font-bold text-[#14201B]">Legend:</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#E5F5EE] text-[#12A176] font-bold border border-[#12A176]/30">
                      <Check className="w-3 h-3" /> Present
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DB5B4E]/10 text-[#DB5B4E] font-bold border border-[#DB5B4E]/20">
                      Absent
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#4E7FD6]/10 text-[#4E7FD6] font-bold border border-[#4E7FD6]/20">
                      M = manual override
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#E0A23B]/10 text-[#B77A16] font-bold border border-[#E0A23B]/25">
                      <Flag className="w-3 h-3" /> Unresolved proxy flag
                    </span>
                  </div>

                  {data.sessions.length === 0 ? (
                    emptyState(
                      'No sessions in this range',
                      'No sessions match the selected class, subject and date range. Adjust the filters or start a session from Live Session.'
                    )
                  ) : enrolledStudents.length === 0 ? (
                    emptyState(
                      'No students enrolled',
                      'This class has no class_enrollments rows yet.'
                    )
                  ) : (
                    <div className="overflow-x-auto max-w-full rounded-xl border border-[#DCEAE3] max-h-[620px]">
                      <table className="w-full text-left border-collapse font-sans min-w-[760px]">
                        <thead>
                          <tr className="bg-[#14201B] text-white text-[10px] font-semibold uppercase tracking-wider">
                            <th className="p-3 sticky left-0 z-20 bg-[#14201B] min-w-[110px] border-r border-white/10">
                              Enrollment
                            </th>
                            <th className="p-3 sticky left-[110px] z-20 bg-[#14201B] min-w-[180px] border-r border-white/10">
                              Student
                            </th>
                            {data.sessions.map((session, index) => (
                              <th
                                key={session.id}
                                className="p-2.5 min-w-[92px] text-center border-r border-white/10"
                                title={`${sessionLabel(session.window_start)} — ${session.status ?? 'unknown'}`}
                              >
                                <div className="text-[9px] opacity-70 font-mono uppercase">
                                  {new Date(session.window_start).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                  })}
                                </div>
                                <div className="font-bold text-xs">
                                  {formatDate(session.window_start)}
                                </div>
                                <div className="text-[9px] opacity-70 font-mono">
                                  {formatTime(session.window_start)}
                                </div>
                                <div className="sr-only">Session {index + 1}</div>
                              </th>
                            ))}
                            <th className="p-3 min-w-[110px] text-center border-l border-white/10">
                              Attendance %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCEAE3] text-xs">
                          {enrolledStudents.map((student, index) => {
                            let presentCount = 0;
                            const cells = data.sessions.map((session) => {
                              const key = `${session.id}:${student.id}`;
                              const isPresent = verifiedSet.has(key) || overrideSet.has(key);
                              if (isPresent) presentCount += 1;
                              return {
                                key,
                                present: isPresent,
                                manual: overrideSet.has(key),
                                flagged: unresolvedFlagSet.has(key),
                              };
                            });
                            const percentage =
                              data.sessions.length > 0
                                ? Math.round((presentCount / data.sessions.length) * 100)
                                : null;

                            return (
                              <tr
                                key={student.id}
                                className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FDFB]'}
                              >
                                <td className="p-3 sticky left-0 z-10 bg-inherit font-mono font-semibold text-[#14201B] border-r border-[#DCEAE3] whitespace-nowrap">
                                  {student.enrollment_no?.trim() || '—'}
                                </td>
                                <td className="p-3 sticky left-[110px] z-10 bg-inherit border-r border-[#DCEAE3]">
                                  <span className="font-semibold text-[#14201B] block leading-tight">
                                    {student.name?.trim() || 'Unknown student'}
                                  </span>
                                  {student.email && (
                                    <span className="text-[10px] text-[#5C6B63] font-medium">
                                      {student.email}
                                    </span>
                                  )}
                                </td>
                                {cells.map((cell) => (
                                  <td
                                    key={cell.key}
                                    className="p-1.5 text-center border-r border-[#DCEAE3]"
                                  >
                                    {cell.present ? (
                                      <span className="relative inline-flex flex-col items-center justify-center min-w-[58px] px-1.5 py-1 rounded-lg bg-[#E5F5EE] text-[#12A176] border border-[#12A176]/25 font-bold text-[10px]">
                                        <span className="inline-flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Present
                                        </span>
                                        <span className="flex items-center gap-1 mt-0.5">
                                          {cell.manual && (
                                            <span
                                              className="px-1 rounded bg-[#4E7FD6]/15 text-[#4E7FD6] text-[8px] font-black uppercase"
                                              title="Present via teacher override"
                                            >
                                              Manual
                                            </span>
                                          )}
                                          {cell.flagged && (
                                            <Flag
                                              className="w-3 h-3 text-[#B77A16]"
                                              aria-label="Unresolved proxy attendance flag"
                                            />
                                          )}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="relative inline-flex flex-col items-center justify-center min-w-[58px] px-1.5 py-1 rounded-lg bg-[#DB5B4E]/10 text-[#DB5B4E] border border-[#DB5B4E]/20 font-bold text-[10px]">
                                        Absent
                                        {cell.flagged && (
                                          <Flag
                                            className="w-3 h-3 text-[#B77A16] mt-0.5"
                                            aria-label="Unresolved proxy attendance flag"
                                          />
                                        )}
                                      </span>
                                    )}
                                  </td>
                                ))}
                                <td className="p-3 text-center border-l border-[#DCEAE3]">
                                  {percentage === null ? (
                                    <span className="text-[#5C6B63] font-mono">—</span>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <span
                                        className={`inline-block px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                                          percentage < PRESENT_THRESHOLD
                                            ? 'bg-[#DB5B4E] text-white'
                                            : 'bg-[#E5F5EE] text-[#12A176] border border-[#12A176]/30'
                                        }`}
                                      >
                                        {percentage}%
                                      </span>
                                      <span className="text-[9px] text-[#5C6B63] font-mono">
                                        {presentCount} / {data.sessions.length}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'rejected' && (
                <>
                  {rejectedRecords.length === 0 ? (
                    emptyState(
                      'No rejected attempts',
                      'Every attendance attempt in this range has a verified status.'
                    )
                  ) : (
                    <div className="overflow-x-auto max-w-full rounded-xl border border-[#DCEAE3]">
                      <table className="w-full text-left border-collapse font-sans min-w-[860px]">
                        <thead>
                          <tr className="bg-[#14201B] text-white text-[10px] font-semibold uppercase tracking-wider">
                            <th className="p-3 min-w-[110px] border-r border-white/10">Enrollment</th>
                            <th className="p-3 min-w-[170px] border-r border-white/10">Student</th>
                            <th className="p-3 min-w-[160px] border-r border-white/10">Session</th>
                            <th className="p-3 min-w-[150px] border-r border-white/10">Time</th>
                            <th className="p-3 min-w-[190px] border-r border-white/10">Reject Reason</th>
                            <th className="p-3 min-w-[120px] text-center">WebAuthn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCEAE3] text-xs">
                          {rejectedRecords.map((record, index) => {
                            const session = data.sessions.find(
                              (item) => item.id === record.session_id
                            );
                            return (
                              <tr
                                key={record.id}
                                className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FDFB]'}
                              >
                                <td className="p-3 font-mono font-semibold text-[#14201B] border-r border-[#DCEAE3] whitespace-nowrap">
                                  {studentEnrollment(record.student_id)}
                                </td>
                                <td className="p-3 font-semibold text-[#14201B] border-r border-[#DCEAE3]">
                                  {studentName(record.student_id)}
                                </td>
                                <td className="p-3 text-[#5C6B63] border-r border-[#DCEAE3]">
                                  {session ? sessionLabel(session.window_start) : '—'}
                                </td>
                                <td className="p-3 text-[#5C6B63] font-mono border-r border-[#DCEAE3]">
                                  {formatDateTime(record.created_at)}
                                </td>
                                <td className="p-3 border-r border-[#DCEAE3]">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#DB5B4E]/10 text-[#DB5B4E] font-semibold text-[10px]">
                                    <AlertTriangle className="w-3 h-3" />
                                    {record.reject_reason || 'No reason recorded'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[10px] ${
                                      record.webauthn_verified
                                        ? 'bg-[#E5F5EE] text-[#12A176]'
                                        : 'bg-[#E0A23B]/10 text-[#B77A16]'
                                    }`}
                                  >
                                    {record.webauthn_verified ? (
                                      <ShieldAlert className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {record.webauthn_verified ? 'Verified' : 'Not verified'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'flags' && (
                <>
                  {sortedFlags.length === 0 ? (
                    emptyState(
                      'No attendance flags',
                      'No proxy or device-conflict flags were raised for this class, subject and date range.'
                    )
                  ) : (
                    <div className="overflow-x-auto max-w-full rounded-xl border border-[#DCEAE3]">
                      <table className="w-full text-left border-collapse font-sans min-w-[900px]">
                        <thead>
                          <tr className="bg-[#14201B] text-white text-[10px] font-semibold uppercase tracking-wider">
                            <th className="p-3 min-w-[180px] border-r border-white/10">Flagged Student</th>
                            <th className="p-3 min-w-[180px] border-r border-white/10">Conflicting Student</th>
                            <th className="p-3 min-w-[160px] border-r border-white/10">Session</th>
                            <th className="p-3 min-w-[220px] border-r border-white/10">Reason</th>
                            <th className="p-3 min-w-[140px] text-center">Resolution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCEAE3] text-xs">
                          {sortedFlags.map((flag, index) => {
                            const session = data.sessions.find(
                              (item) => item.id === flag.session_id
                            );
                            const resolved = isFlagResolved(flag);
                            return (
                              <tr
                                key={flag.id}
                                className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FDFB]'}
                              >
                                <td className="p-3 border-r border-[#DCEAE3]">
                                  <span className="font-semibold text-[#14201B] block">
                                    {studentName(flag.flagged_student_id)}
                                  </span>
                                  <span className="text-[10px] text-[#5C6B63] font-mono">
                                    {studentEnrollment(flag.flagged_student_id)}
                                  </span>
                                </td>
                                <td className="p-3 border-r border-[#DCEAE3]">
                                  <span className="font-semibold text-[#14201B] block">
                                    {studentName(flag.conflicting_student_id)}
                                  </span>
                                  <span className="text-[10px] text-[#5C6B63] font-mono">
                                    {studentEnrollment(flag.conflicting_student_id)}
                                  </span>
                                </td>
                                <td className="p-3 text-[#5C6B63] border-r border-[#DCEAE3]">
                                  {session ? sessionLabel(session.window_start) : '—'}
                                </td>
                                <td className="p-3 border-r border-[#DCEAE3]">
                                  <span className="inline-flex items-center gap-1.5 text-[#B77A16] font-semibold">
                                    <Flag className="w-3.5 h-3.5" />
                                    {flag.reason || 'No reason recorded'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                      resolved
                                        ? 'bg-[#E5F5EE] text-[#12A176] border border-[#12A176]/25'
                                        : 'bg-[#DB5B4E] text-white'
                                    }`}
                                  >
                                    {resolved ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <AlertTriangle className="w-3 h-3" />
                                    )}
                                    {resolved ? flag.resolution || 'Resolved' : 'Unresolved'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'manual' && (
                <>
                  {manualMarksError ? (
                    renderError(manualMarksError, handleRefresh)
                  ) : manualMarksLoading ? (
                    <SkeletonTable rows={5} />
                  ) : manualMarks.length === 0 ? (
                    emptyState(
                      'No manual marks',
                      'No attendance overrides were recorded for this class and date range.'
                    )
                  ) : (
                    <div className="overflow-x-auto max-w-full rounded-xl border border-[#DCEAE3]">
                      <table className="w-full text-left border-collapse font-sans min-w-[940px]">
                        <thead>
                          <tr className="bg-[#14201B] text-white text-[10px] font-semibold uppercase tracking-wider">
                            <th className="p-3 min-w-[120px] border-r border-white/10">Date</th>
                            <th className="p-3 min-w-[160px] border-r border-white/10">Subject</th>
                            <th className="p-3 min-w-[110px] border-r border-white/10">Enrollment</th>
                            <th className="p-3 min-w-[170px] border-r border-white/10">Student</th>
                            <th className="p-3 min-w-[130px] border-r border-white/10">Reason</th>
                            <th className="p-3 min-w-[200px] border-r border-white/10">Note</th>
                            <th className="p-3 min-w-[150px]">Marked by</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCEAE3] text-xs">
                          {manualMarks.map((mark, index) => (
                            <tr
                              key={mark.id}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FDFB]'}
                            >
                              <td className="p-3 font-mono text-[#5C6B63] border-r border-[#DCEAE3] whitespace-nowrap">
                                {formatDate(mark.sessionStart)}
                              </td>
                              <td className="p-3 border-r border-[#DCEAE3]">
                                <span className="font-semibold text-[#14201B] block">
                                  {mark.subjectName}
                                </span>
                                {mark.subjectCode && (
                                  <span className="text-[10px] text-[#5C6B63] font-mono">
                                    {mark.subjectCode}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-semibold text-[#14201B] border-r border-[#DCEAE3] whitespace-nowrap">
                                {mark.enrollmentNo}
                              </td>
                              <td className="p-3 font-semibold text-[#14201B] border-r border-[#DCEAE3]">
                                {mark.studentName}
                              </td>
                              <td className="p-3 border-r border-[#DCEAE3]">
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#4E7FD6]/10 text-[#4E7FD6] font-semibold text-[10px]">
                                  {mark.reason}
                                </span>
                              </td>
                              <td className="p-3 text-[#5C6B63] border-r border-[#DCEAE3] break-words">
                                {mark.note}
                              </td>
                              <td className="p-3 text-[#14201B] font-semibold">
                                {mark.teacherName}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
