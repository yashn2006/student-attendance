import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Cpu,
  Sparkles,
  CheckCircle2,
  Lock,
  QrCode,
  ArrowRight,
  UserCheck,
  Building2,
  BookOpen,
  Zap,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FacultyAccountRole } from '../../types';

export const LaunchBootScreen: React.FC = () => {
  const { login, completeBootSequence } = useAuth();

// Stages: 'launching' (1) -> 'loading' (2) -> 'splash' (3) -> 'auth' (4)
const [stage, setStage] = useState<'launching' | 'loading' | 'splash' | 'auth'>('launching');
const [loadProgress, setLoadProgress] = useState(0);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [authError, setAuthError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Launching Animation Timer -> advances to loading
  useEffect(() => {
    if (stage === 'launching') {
      const timer = setTimeout(() => {
        setStage('loading');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Step 2: Loading Progress Ring
  useEffect(() => {
    if (stage === 'loading') {
      const interval = setInterval(() => {
        setLoadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStage('splash'), 300);
            return 100;
          }
          return prev + 10;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const handleEnterAuth = () => {
    setStage('auth');
  };

 const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setAuthError(null);
  setIsSubmitting(true);
 const { error } = await login(email, password);
  setIsSubmitting(false);
  if (error) {
    setAuthError(error);
    return;
  }
  completeBootSequence();
};

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FDFB] text-[#14201B] flex flex-col items-center justify-center overflow-y-auto px-4 py-8 font-sans select-none pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Background Subtle Mint Blurs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E5F5EE] rounded-full blur-[100px] pointer-events-none opacity-80" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#12A176]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#DCEAE3_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* ================= STEP 1: LAUNCHING ANIMATION ================= */}
        {stage === 'launching' && (
          <motion.div
            key="stage-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center p-4 z-10 my-auto"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(18, 161, 118, 0.15)',
                  '0 0 40px rgba(18, 161, 118, 0.3)',
                  '0 0 20px rgba(18, 161, 118, 0.15)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 rounded-3xl bg-[#12A176] flex items-center justify-center p-0.5 mb-6 border border-[#DCEAE3] shadow-lg"
            >
              <div className="w-full h-full bg-[#E5F5EE] rounded-[22px] flex items-center justify-center">
                <Cpu className="w-12 h-12 text-[#12A176] animate-pulse" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-black tracking-tight text-[#14201B] font-['Plus_Jakarta_Sans']"
            >
              CAMPUS OS
            </motion.h1>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2.5 text-[#12A176] font-extrabold tracking-widest text-xs uppercase"
            >
              Faculty Intelligence Platform • v3.8 Mobile
            </motion.p>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStage('auth')}
                className="px-4 py-2 bg-white border border-[#DCEAE3] text-[#12A176] font-extrabold text-xs rounded-xl hover:bg-[#E5F5EE] transition-all cursor-pointer tap-active"
              >
                Skip to Auth
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('class_teacher')}
                className="px-4 py-2 bg-[#12A176] text-white font-black text-xs rounded-xl hover:bg-[#0E8561] transition-all cursor-pointer tap-active shadow-md"
              >
                Instant 1-Tap Login
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: LOADING ANIMATION ================= */}
        {stage === 'loading' && (
          <motion.div
            key="stage-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center p-4 z-10 max-w-sm w-full my-auto"
          >
            {/* Circular Progress Indicator */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#E5F5EE]"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#12A176]"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * loadProgress) / 100}
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-[#14201B]">
                  {loadProgress}%
                </span>
                <span className="text-[10px] text-[#12A176] uppercase tracking-widest font-extrabold mt-0.5">
                  Booting Engine
                </span>
              </div>
            </div>

            {/* Diagnostic Messages */}
            <div className="h-12 flex items-center justify-center text-xs text-[#5C6B63] font-mono px-2">
              {loadProgress < 40 && '• Loading Mobile PWA Service Worker & Cache...'}
              {loadProgress >= 40 && loadProgress < 80 && '• Syncing Live Timetable & 4s QR Engine...'}
              {loadProgress >= 80 && loadProgress < 100 && '• Initializing Gemini Curriculum AI...'}
              {loadProgress >= 100 && (
                <span className="text-[#12A176] flex items-center gap-1.5 font-black">
                  <CheckCircle2 className="w-4 h-4" /> System Ready
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 3: SPLASH SCREEN ================= */}
        {stage === 'splash' && (
          <motion.div
            key="stage-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center max-w-2xl w-full px-2 z-10 my-auto text-center"
          >
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12A176]/12 border border-[#12A176]/20 text-[#12A176] text-xs font-black mb-5">
              <Zap className="w-3.5 h-3.5 text-[#12A176]" />
              <span>Mobile-Native Higher Ed Platform</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#14201B] leading-tight font-['Plus_Jakarta_Sans']">
              Academic Operations <br className="hidden sm:inline" />
              <span className="text-[#12A176]">
                With 100% Mobile Precision
              </span>
            </h1>

            <p className="mt-3 text-[#5C6B63] max-w-lg text-xs sm:text-sm leading-relaxed font-medium">
              4-second auto-shuffling QR attendance, live student radar, and Gemini AI curriculum analyzer built natively for iOS & Android.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 w-full text-left">
              <div className="p-3.5 rounded-2xl bg-white border border-[#DCEAE3] shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#12A176] text-white flex items-center justify-center font-black mb-2.5">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-[#14201B]">4s Dynamic QR</h3>
                <p className="text-[11px] text-[#5C6B63] mt-0.5 leading-snug">
                  Shuffles QR & 5-digit OTP every 4s to stop proxy marks.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#DCEAE3] shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#12A176] text-white flex items-center justify-center font-black mb-2.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-[#14201B]">Gemini AI Engine</h3>
                <p className="text-[11px] text-[#5C6B63] mt-0.5 leading-snug">
                  Generates instant summaries, quizzes & lab tasks from PDFs.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#DCEAE3] shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#12A176] text-white flex items-center justify-center font-black mb-2.5">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-[#14201B]">Dual Scope Modes</h3>
                <p className="text-[11px] text-[#5C6B63] mt-0.5 leading-snug">
                  Class Teacher & Subject Professor full workspace support.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleEnterAuth}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#12A176] hover:bg-[#0E8561] text-white font-black text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all tap-active cursor-pointer"
              >
                <span>Continue to Auth Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('class_teacher')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-[#E5F5EE] border border-[#DCEAE3] text-[#14201B] font-extrabold text-xs flex items-center justify-center gap-2 transition-all tap-active cursor-pointer shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-[#12A176]" />
                <span>Quick 1-Tap Launch</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 4: AUTH PORTAL ================= */}
        {stage === 'auth' && (
          <motion.div
            key="stage-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full my-auto z-10"
          >
            <div className="p-5 sm:p-7 rounded-3xl bg-white border border-[#DCEAE3] shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-[#12A176]/12 border border-[#12A176]/30 flex items-center justify-center text-[#12A176] font-black">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#14201B] font-['Plus_Jakarta_Sans']">Faculty Auth Portal</h2>
                  <p className="text-xs text-[#5C6B63] font-semibold">Select account profile to launch session</p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
    <label className="text-[11px] font-black text-[#5C6B63] uppercase tracking-wider block mb-1">
      Email
    </label>
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-[#14201B] font-mono text-xs focus:outline-none focus:border-[#12A176] transition-colors"
      placeholder="teacher@test.com"
      required
    />
  </div>

  <div>
    <label className="text-[11px] font-black text-[#5C6B63] uppercase tracking-wider block mb-1">
      Password
    </label>
    <div className="relative">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-[#14201B] font-mono text-xs focus:outline-none focus:border-[#12A176] transition-colors pl-9"
        placeholder="Enter password"
        required
      />
      <Lock className="w-4 h-4 text-[#5C6B63] absolute left-3 top-1/2 -translate-y-1/2" />
    </div>
  </div>

  {authError && (
    <p className="text-xs font-bold text-red-500">{authError}</p>
  )}

  <button
    type="submit"
    disabled={isSubmitting}
    className="w-full py-3.5 rounded-2xl bg-[#12A176] hover:bg-[#0E8561] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 tap-active disabled:opacity-60"
  >
    <span>{isSubmitting ? 'Signing in...' : 'Authenticate & Launch Workspace'}</span>
    <ArrowRight className="w-4 h-4" />
  </button>
</form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
