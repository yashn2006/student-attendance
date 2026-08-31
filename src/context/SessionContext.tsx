import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

interface ActiveSession {
  sessionId: string;
  classId: string;
  className: string;
  windowStart: string;
  windowEnd: string;
  currentCode: string;
  codeExpiresAt: string;
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
  startSession: (classId: string, teacherId: string, className: string) => Promise<{ error: string | null }>;
  endSession: (teacherId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordRow[]>([]);
  const codePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolls = () => {
    if (codePollRef.current) clearInterval(codePollRef.current);
    if (historyPollRef.current) clearInterval(historyPollRef.current);
    codePollRef.current = null;
    historyPollRef.current = null;
  };

  useEffect(() => clearPolls, []); // cleanup on unmount

  const startPolling = (sessionId: string) => {
    clearPolls();

    codePollRef.current = setInterval(async () => {
      const { data, error } = await supabase.functions.invoke(
        `session-current-code?sessionId=${sessionId}`,
        { method: 'GET' }
      );
      if (error) {
        console.error('[SessionContext] session-current-code failed:', error);
        return;
      }
      setActiveSession((prev) => {
        if (!prev || prev.sessionId !== sessionId) return prev;
        return {
          ...prev,
          currentCode: data.currentCode,
          codeExpiresAt: data.codeExpiresAt,
          status: data.sessionStatus,
        };
      });
      if (data.sessionStatus === 'closed') {
        clearPolls();
      }
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
  };

  const startSession = async (classId: string, teacherId: string, className: string) => {
    const { data, error } = await supabase.functions.invoke('session-start', {
      body: { classId, teacherId },
    });

    if (error || !data?.sessionId) {
      return { error: error?.message || 'Failed to start session' };
    }

    setActiveSession({
      sessionId: data.sessionId,
      classId,
      className,
      windowStart: data.windowStart,
      windowEnd: data.windowEnd,
      currentCode: data.currentCode,
      codeExpiresAt: data.codeExpiresAt,
      status: 'active',
    });
    setAttendanceRecords([]);
    startPolling(data.sessionId);

    return { error: null };
  };

  const endSession = async (teacherId: string) => {
    if (!activeSession) return;

    const { error } = await supabase.functions.invoke('session-close', {
      body: { sessionId: activeSession.sessionId, teacherId },
    });

    if (error) {
      console.error('[SessionContext] session-close failed:', error);
    }

    clearPolls();
    setActiveSession((prev) => (prev ? { ...prev, status: 'closed' } : null));

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <SessionContext.Provider value={{ activeSession, attendanceRecords, startSession, endSession }}>
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