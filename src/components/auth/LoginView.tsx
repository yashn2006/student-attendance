import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login, verifyOtp, isOtpPending } = useAuth();
  const [facultyId, setFacultyId] = useState('FAC-2024');
  const [password, setPassword] = useState('••••••••');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(42);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpPending && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpPending, resendTimer]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(async () => {
      await login(facultyId, password);
      setIsLoading(false);
    }, 600);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter complete 6-digit security code');
      return;
    }
    setIsLoading(true);
    const success = await verifyOtp(code);
    setIsLoading(false);
    if (!success) {
      setErrorMessage('Invalid verification code. Try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 flex items-center justify-center p-4 md:p-8 font-['Poppins',sans-serif]">
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
        {/* Left Graphics Panel */}
        <div className="gradient-brand p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Glowing Rings */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                C
              </div>
              <span className="text-2xl font-black tracking-tight font-['Plus_Jakarta_Sans']">
                Campus OS
              </span>
            </div>
            <p className="mt-4 text-sm text-indigo-100 font-medium leading-relaxed max-w-sm">
              The definitive administrative environment for academic excellence. Elevate your faculty workflow.
            </p>
          </div>

          {/* Center Visual Art / Glass Card Illustration */}
          <div className="relative z-10 my-8 flex justify-center">
            <div className="relative w-64 h-64 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center shadow-2xl animate-pulse-subtle">
              <div className="w-48 h-48 bg-gradient-to-tr from-purple-500/40 to-indigo-400/30 rounded-3xl backdrop-blur-2xl border border-white/30 p-6 flex flex-col items-center justify-center text-center shadow-inner">
                <GraduationCap className="w-16 h-16 text-white drop-shadow-md mb-2" />
                <span className="font-bold text-sm tracking-wide">Faculty Portal</span>
                <span className="text-[10px] text-indigo-200 mt-1">Real-time • PWA • AI Analytics</span>
              </div>
              <div className="absolute -top-4 -right-2 bg-emerald-400/90 text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-slate-900" />
                2FA Protected
              </div>
            </div>
          </div>

          {/* Footer badge */}
          <div className="relative z-10 text-xs text-indigo-200/80 font-medium flex items-center justify-between">
            <span>Version 4.2 Pro</span>
            <span>Higher Ed Academic OS</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white/60">
          {!isOtpPending ? (
            /* STEP 1: Faculty ID & Password Form */
            <form onSubmit={handleLoginSubmit} className="space-y-6 max-w-sm mx-auto w-full">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  Sign In
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Enter your credentials to access your faculty dashboard.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Faculty ID
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      placeholder="e.g. FAC-2024"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Password
                    </label>
                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-xs text-indigo-600 hover:underline font-medium">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Need assistance?{' '}
                  <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                    Contact IT Support
                  </span>
                </p>
              </div>
            </form>
          ) : (
            /* STEP 2: 2FA Identity Verification OTP Sequence */
            <form onSubmit={handleOtpSubmit} className="space-y-6 max-w-sm mx-auto w-full text-center">
              <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-2">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  Verify Your Identity
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  We've sent a 6-digit security code to your registered academic email address. Please enter it below to continue.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              {/* 6 OTP Input Boxes */}
              <div className="flex items-center justify-center gap-2">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-black text-indigo-900 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-xs text-slate-500">
                Didn't receive the code?{' '}
                {resendTimer > 0 ? (
                  <span className="text-indigo-600 font-bold">Resend in 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResendTimer(45)}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Resend Code Now
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
