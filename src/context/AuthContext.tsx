import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, FacultyAccountRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isBootComplete: boolean;
  loading: boolean;
  teacherId: string | null;                                              // ← add
  classes: { id: string; name: string; studentCount: number }[];         // ← add
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  switchAccountRole: (role: FacultyAccountRole) => void;
  completeBootSequence: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileFromSession(session: Session): UserProfile {
  const email = session.user.email || 'unknown@campus.edu';
  const namePart = email.split('@')[0];
  return {
    id: session.user.id,
    name: namePart,
    title: 'Faculty',
    email,
    avatar: namePart.slice(0, 2).toUpperCase(),
    department: '',
    facultyId: session.user.id,
    accountType: 'class_teacher',
    isClassTeacher: true,
    subjects: []
    
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string; studentCount: number }[]>([]);
  const [isBootComplete, setIsBootComplete] = useState<boolean>(() => {
    return localStorage.getItem('campus_os_boot') === 'true';
  });

    useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? profileFromSession(session) : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? profileFromSession(session) : null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setTeacherId(null);
      setClasses([]);
      return;
    }

    supabase.functions.invoke('class-list').then(({ data, error }) => {
      if (error) {
        console.error('[AuthContext] class-list failed:', error);
        return;
      }
      if (data?.teacherId) setTeacherId(data.teacherId);
      if (data?.classes) setClasses(data.classes);
    });
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem('campus_os_boot', isBootComplete ? 'true' : 'false');
  }, [isBootComplete]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const switchAccountRole = (role: FacultyAccountRole) => {
    setUser((prev) => (prev ? { ...prev, accountType: role, isClassTeacher: role === 'class_teacher' } : prev));
  };

  const completeBootSequence = () => {
    setIsBootComplete(true);
  };

  return (
    <AuthContext.Provider
  value={{
    user,
    isAuthenticated: !!user,
    isBootComplete,
    loading,
    teacherId,     // ← add
    classes,       // ← add
    login,
    logout,
    switchAccountRole,
    completeBootSequence
  }}

    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};