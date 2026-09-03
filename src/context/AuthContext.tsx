import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, FacultyAccountRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isBootComplete: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  completeBootSequence: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBootComplete, setIsBootComplete] = useState<boolean>(() => {
    return localStorage.getItem('campus_os_boot') === 'true';
  });

  const fetchTeacher = async (session: Session) => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('supabase_user', session.user.id)
      .single();

    if (error || !data) {
      console.error('Error fetching teacher:', error);
      setUser(null);
      return;
    }

    setUser({
      id: data.id,
      supabase_user: data.supabase_user,
      name: data.name,
      email: data.email,
      is_admin: data.is_admin,
      // Legacy fields to prevent crashes
      subjects: [],
      accountType: 'normal_professor',
      department: '',
      classTeacherClassName: '',
      isClassTeacher: false,
      avatar: data.name.slice(0, 2).toUpperCase(),
      title: 'Faculty'
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchTeacher(session);
      else setUser(null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchTeacher(session);
      else setUser(null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
        login,
        logout,
        completeBootSequence,
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
