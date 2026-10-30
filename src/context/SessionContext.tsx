import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ActiveSession {
  sessionId: string;
  teacherId: string;
  classId: string;
  className: string;
  windowStart: string;
  windowEnd: string;
  currentCode: string;
  codeExpiresAt: string;
  serverOffsetMs?: number;
  status: 'active' | 'closed';
}

interface AttendanceRecordRow {
  id: string;
  student_id: string;
  device_fingerprint?: string;
  created_at: string;
  [key: string]: unknown;
}

interface SessionContextType {
  activeSession: ActiveSession | null;
  attendanceRecords: AttendanceRecordRow[];
  startSession: (classId: string, teacherId: string, className: string, subjectId?: string | null) => Promise<{ error: string | null }>;
  endSession: (teacherId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const SESSION_STORAGE_PREFIX = 'campus_os_active_session';
const SESSION_OWNER_STORAGE_KEY = `${SESSION_STORAGE_PREFIX}:owner`;

const sessionStorageKey = (teacherId: string) => `${SESSION_STORAGE_PREFIX}:${teacherId}`;

const clearStorageKeys = (storage: Storage) => {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(SESSION_STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
};

const clearAllStoredSessionState = () => {
  try {
    clearStorageKeys(localStorage);
    clearStorageKeys(sessionStorage);
  } catch {
    // ignore storage access errors
  }
};

const removeStoredSession = (teacherId: string) => {
  try {
    localStorage.removeItem(sessionStorageKey(teacherId));
    sessionStorage.removeItem(sessionStorageKey(teacherId));
  } catch {
    // ignore storage access errors
  }
};

const saveStoredSession = (session: ActiveSession) => {
  try {
    localStorage.setItem(sessionStorageKey(session.teacherId), JSON.stringify(session));
  } catch {
    // ignore storage access errors
  }
};

const readStoredSession = (teacherId: string): ActiveSession | null => {
  try {
    const raw =
      localStorage.getItem(sessionStorageKey(teacherId)) ??
      sessionStorage.getItem(sessionStorageKey(teacherId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ActiveSession> | null;
    if (
      !parsed ||
      parsed.teacherId !== teacherId ||
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.classId !== 'string'
    ) {
      removeStoredSession(teacherId);
      return null;
    }

    return parsed as ActiveSession;
  } catch {
    removeStoredSession(teacherId);
    return null;
  }
};

const hasStoredSessionForOtherTeacher = (teacherId: string): boolean => {
  try {
    for (const storage of [localStorage, sessionStorage]) {
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (!key || !key.startsWith(`${SESSION_STORAGE_PREFIX}:`)) continue;
        if (key === SESSION_OWNER_STORAGE_KEY) continue;
        if (key.slice(SESSION_STORAGE_PREFIX.length + 1) !== teacherId) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
};

const functionErrorStatus = (error: unknown): number | null => {
  const context = (error as { context?: unknown } | null)?.context;
  if (context && typeof context === 'object') {
    const status = (context as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return null;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const teacherId = user?.id ?? null;

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordRow[]>([]);
  const codePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoreRequestRef = useRef(0);

  const clearPolls = useCallback(() => {
    if (codePollRef.current) clearInterval(codePollRef.current);
    if (codeRetryRef.current) clearTimeout(codeRetryRef.current);
    if (historyPollRef.current) clearInterval(historyPollRef.current);
    codePollRef.current = null;
    codeRetryRef.current = null;
    historyPollRef.current = null;
  }, []);

  useEffect(() => clearPolls, [clearPolls]);

  const refreshCode = useCallback(async (sessionId: string, ownerId: string): Promise<void> => {
    if (codeRetryRef.current) {
      clearTimeout(codeRetryRef.current);
      codeRetryRef.current = null;
    }
    const { data, error } = await supabase.functions.invoke(
      `session-current-code?sessionId=${sessionId}`,
      { method: 'GET' }
    );
    if (error) {
      const status = functionErrorStatus(error);
      if (status === 403 || status === 404) {
        clearPolls();
        removeStoredSession(ownerId);
        setActiveSession((prev) =>
          prev && prev.sessionId === sessionId ? null : prev
        );
        setAttendanceRecords([]);
        return;
      }
      console.error('[SessionContext] session-current-code failed:', error);
      return;
    }
    const serverNowMs = typeof data?.serverNow === 'string' ? Date.parse(data.serverNow) : NaN;
    const serverOffsetMs = Number.isFinite(serverNowMs) ? serverNowMs - Date.now() : 0;
    setActiveSession((prev) => {
      if (!prev || prev.sessionId !== sessionId || prev.teacherId !== ownerId) return prev;
      return {
        ...prev,
        currentCode: data.currentCode,
        codeExpiresAt: data.codeExpiresAt,
        serverOffsetMs,
        status: data.sessionStatus,
      };
    });
    if (data.sessionStatus === 'closed') {
      removeStoredSession(ownerId);
      clearPolls();
      return;
    }
    const returnedExpiresMs = typeof data.codeExpiresAt === 'string' ? Date.parse(data.codeExpiresAt) : NaN;
    if (
      Number.isFinite(returnedExpiresMs) &&
      Number.isFinite(serverNowMs) &&
      returnedExpiresMs <= serverNowMs
    ) {
      codeRetryRef.current = setTimeout(() => {
        codeRetryRef.current = null;
        void refreshCode(sessionId, ownerId);
      }, 300);
    }
  }, [clearPolls]);

  const startPolling = useCallback((sessionId: string, ownerId: string) => {
    clearPolls();

    codePollRef.current = setInterval(() => {
      void refreshCode(sessionId, ownerId);
    }, 5000);

    historyPollRef.current = setInterval(async () => {
      const { data, error } = await supabase.functions.invoke(
        `attendance-history?session_id=${sessionId}`,
        { method: 'GET' }
      );
      if (error) {
        console.error('[SessionContext] attendance-history failed:', error);
        return;
      }
      if (data?.records) setAttendanceRecords(data.records);
    }, 5000);
  }, [clearPolls, refreshCode]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;
    const expiresMs = Date.parse(activeSession.codeExpiresAt);
    if (!Number.isFinite(expiresMs)) return;
    const offset = activeSession.serverOffsetMs ?? 0;
    const delay = Math.max(0, expiresMs - (Date.now() + offset)) + 100;
    const timer = setTimeout(() => {
      void refreshCode(activeSession.sessionId, activeSession.teacherId);
    }, delay);
    return () => clearTimeout(timer);
  }, [
    activeSession?.sessionId,
    activeSession?.codeExpiresAt,
    activeSession?.serverOffsetMs,
    activeSession?.status,
    activeSession?.teacherId,
    refreshCode,
  ]);

  useEffect(() => {
    if (authLoading) return;

    if (!teacherId) {
      clearAllStoredSessionState();
      restoreRequestRef.current += 1;
      clearPolls();
      setActiveSession(null);
      setAttendanceRecords([]);
      return;
    }

    let storedOwner: string | null = null;
    try {
      storedOwner = localStorage.getItem(SESSION_OWNER_STORAGE_KEY);
    } catch {
      storedOwner = null;
    }

    if (
      (storedOwner && storedOwner !== teacherId) ||
      hasStoredSessionForOtherTeacher(teacherId)
    ) {
      clearAllStoredSessionState();
    }

    try {
      localStorage.setItem(SESSION_OWNER_STORAGE_KEY, teacherId);
    } catch {
      // ignore storage access errors
    }

    setActiveSession((prev) => (prev && prev.teacherId !== teacherId ? null : prev));

    const savedSession = readStoredSession(teacherId);
    const requestId = restoreRequestRef.current + 1;
    restoreRequestRef.current = requestId;

    const restoreActiveSession = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, class_id, window_start, window_end, current_code, code_expires_at, status')
        .eq('teacher_id', teacherId)
        .eq('status', 'active')
        .gt('window_end', new Date().toISOString())
        .order('window_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestId !== restoreRequestRef.current) return;

      if (error) {
        console.error('[SessionContext] active session restore failed:', error.message);
        removeStoredSession(teacherId);
        clearPolls();
        setActiveSession(null);
        setAttendanceRecords([]);
        return;
      }

      if (!data) {
        removeStoredSession(teacherId);
        clearPolls();
        setActiveSession(null);
        setAttendanceRecords([]);
        return;
      }

      const { data: classRow } = await supabase
        .from('classes')
        .select('name, section')
        .eq('id', data.class_id)
        .maybeSingle();

      if (requestId !== restoreRequestRef.current) return;

      const savedMatches = savedSession?.sessionId === data.id;
      const sectionLabel = classRow?.section
        ? classRow.section === 'ALL'
          ? ' · All divisions'
          : ` ${classRow.section}`
        : '';
      const className = classRow?.name
        ? `${classRow.name}${sectionLabel}`
        : savedMatches
          ? savedSession!.className
          : '';

      setActiveSession({
        sessionId: data.id,
        teacherId,
        classId: data.class_id,
        className,
        windowStart: data.window_start,
        windowEnd: data.window_end,
        currentCode: savedMatches ? savedSession!.currentCode : (data.current_code ?? ''),
        codeExpiresAt: savedMatches
          ? savedSession!.codeExpiresAt
          : (data.code_expires_at ?? new Date().toISOString()),
        serverOffsetMs: 0,
        status: 'active',
      });
      setAttendanceRecords([]);
      startPolling(data.id, teacherId);
    };

    restoreActiveSession();
  }, [teacherId, authLoading, clearPolls, startPolling]);

  useEffect(() => {
    if (!teacherId) return;

    if (
      activeSession &&
      activeSession.teacherId === teacherId &&
      activeSession.status === 'active'
    ) {
      saveStoredSession(activeSession);
    } else {
      removeStoredSession(teacherId);
    }
  }, [activeSession, teacherId]);

  const startSession = async (classId: string, teacherId: string, className: string, subjectId?: string | null) => {
    const requestBody = { classId, teacherId, subjectId };
    console.log('[SessionContext] Calling session-start with:', requestBody);
    
    const { data, error } = await supabase.functions.invoke('session-start', {
      body: requestBody,
    });

    console.log('[SessionContext] session-start response:', { data, error });

    if (error) {
      console.error('[SessionContext] session-start failed:', error);
      if (error instanceof Error && 'context' in error) {
        console.error('[SessionContext] session-start error context:', (error as any).context);
      }
    }

    if (error || !data?.sessionId) {
      return { error: error?.message || 'Failed to start session' };
    }

    const serverNowMs = typeof data.serverNow === 'string' ? Date.parse(data.serverNow) : NaN;

    setActiveSession({
      sessionId: data.sessionId,
      teacherId,
      classId,
      className,
      windowStart: data.windowStart,
      windowEnd: data.windowEnd,
      currentCode: data.currentCode,
      codeExpiresAt: data.codeExpiresAt,
      serverOffsetMs: Number.isFinite(serverNowMs) ? serverNowMs - Date.now() : 0,
      status: 'active',
    });
    setAttendanceRecords([]);
    startPolling(data.sessionId, teacherId);

    return { error: null };
  };

  const endSession = async (teacherId: string) => {
    const session = activeSession;
    if (!session || session.teacherId !== teacherId) return;

    const { error } = await supabase.functions.invoke('session-close', {
      body: { sessionId: session.sessionId, teacherId },
    });

    if (error) {
      const status = functionErrorStatus(error);
      if (status === 403 || status === 404) {
        clearPolls();
        removeStoredSession(session.teacherId);
        setActiveSession((prev) =>
          prev && prev.sessionId === session.sessionId ? null : prev
        );
        setAttendanceRecords([]);
        return;
      }
      console.error('[SessionContext] session-close failed:', error);
    }

    clearPolls();
    removeStoredSession(session.teacherId);
    setActiveSession((prev) =>
      prev && prev.sessionId === session.sessionId ? { ...prev, status: 'closed' } : prev
    );

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  const scopedActiveSession =
    activeSession && teacherId && activeSession.teacherId === teacherId
      ? activeSession
      : null;

  return (
    <SessionContext.Provider value={{ activeSession: scopedActiveSession, attendanceRecords, startSession, endSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
