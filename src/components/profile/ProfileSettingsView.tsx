import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  ShieldCheck,
  Smartphone,
  Bell,
  Lock,
  LogOut,
  Wifi,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Download,
  Moon,
  Sun,
  Fingerprint,
  QrCode,
  Laptop,
  Trash2,
  Zap,
  Volume2,
  Sparkles,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';

export const ProfileSettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline, queuedActions, clearQueue } = useOffline();
  const { theme: selectedTheme, setTheme } = useTheme();

  // Settings State
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [defaulterThreshold, setDefaulterThreshold] = useState(75);
  const [qrShuffleSpeed, setQrShuffleSpeed] = useState(4);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Active Sessions
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess_1', device: 'iPhone 15 Pro', location: 'Mumbai, IN (Current)', ip: '103.22.14.90', isCurrent: true },
    { id: 'sess_2', device: 'MacBook Pro 16"', location: 'Mumbai, IN', ip: '103.22.14.92', isCurrent: false },
    { id: 'sess_3', device: 'iPad Air M2', location: 'Navi Mumbai, IN', ip: '103.22.15.11', isCurrent: false }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleRemoveSession = (id: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== id));
    showToast('Device session revoked successfully');
  };

  return (
    <div className="space-y-6 pb-28 font-['Plus_Jakarta_Sans',sans-serif] max-w-4xl mx-auto select-none">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 right-4 z-50 p-4 bg-[#1A1025] text-white font-extrabold text-xs rounded-2xl shadow-2xl border border-[#8B5CF6]/40 flex items-center gap-2.5 glow-purple"
          >
            <CheckCircle2 className="w-5 h-5 text-[#A3E635]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Profile Banner Card */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-[#E8E3D9] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-[#1A1025] text-[#A3E635] font-black text-2xl flex items-center justify-center ring-4 ring-[#8B5CF6]/30 shadow-xl shrink-0 glow-purple">
            MS
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-[#1A1025] tracking-tight">
                {user?.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#A3E635] text-[#1A1025] font-extrabold text-[10px]">
                {user?.isClassTeacher ? 'Class Teacher' : 'Subject Professor'}
              </span>
            </div>

            <p className="text-xs text-[#6B6478] font-bold mt-1">
              {user?.title || 'Faculty'} • {user?.department || 'Information Technology'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="text-[10px] font-extrabold bg-[#8B5CF6]/15 text-[#8B5CF6] px-2.5 py-1 rounded-xl border border-[#8B5CF6]/30">
                Faculty ID: {user?.facultyId}
              </span>
              <span className="text-[10px] font-extrabold bg-[#1A1025] text-white px-2.5 py-1 rounded-xl">
                Class Scope: {user?.classTeacherClassName || 'SYBSc IT'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full sm:w-auto px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer tap-active relative z-10"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Role Scoping & Account Permissions */}
        <div className="glass-card rounded-3xl p-6 border border-[#E8E3D9] space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E3D9]">
            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#1A1025]">Role & Scope Controls</h3>
              <p className="text-xs text-[#6B6478]">Switch faculty view between Teacher & Professor</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#1A1025] block">Assigned Account Role</span>
                <span className="text-[11px] text-[#6B6478] font-medium">
                  {user?.isClassTeacher ? 'Class Teacher (SYBSc IT Class In-Charge)' : 'Subject Professor'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9]">
              <span className="font-extrabold text-[#1A1025] block mb-2">Assigned Courses & Subjects</span>
              <ul className="space-y-2 text-[#6B6478] font-semibold">
                {user?.subjects.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8E3D9]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                      <span className="font-bold text-[#1A1025]">{sub.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-[#FBF9F4] px-2 py-0.5 rounded border border-[#E8E3D9]">
                      {sub.code}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Card 2: Appearance & iOS UI Preferences */}
        <div className="glass-card rounded-3xl p-6 border border-[#E8E3D9] space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E3D9]">
            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#1A1025]">Appearance & UI Theme</h3>
              <p className="text-xs text-[#6B6478]">Visual styles, ambient glows & touch feedback</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-extrabold text-[#1A1025] mb-2">App Color Scheme</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('cream');
                    showToast('Set theme: Minimal Cream');
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer tap-active ${
                    selectedTheme === 'cream'
                      ? 'bg-[#1A1025] text-white border-[#1A1025] font-extrabold shadow-sm'
                      : 'bg-[#FBF9F4] text-[#6B6478] border-[#E8E3D9] font-bold'
                  }`}
                >
                  <Sun className="w-4 h-4 mx-auto mb-1 text-[#A3E635]" />
                  <span>Minimal Cream</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    showToast('Set theme: Ocean Sapphire Dark');
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer tap-active ${
                    selectedTheme === 'dark'
                      ? 'bg-[#03045E] text-[#CAF0F8] border-[#00B4D8] font-extrabold shadow-sm'
                      : 'bg-[#FBF9F4] text-[#6B6478] border-[#E8E3D9] font-bold'
                  }`}
                >
                  <Moon className="w-4 h-4 mx-auto mb-1 text-[#00B4D8]" />
                  <span>Ocean Sapphire</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    showToast('Set theme: iOS System Auto');
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer tap-active ${
                    selectedTheme === 'system'
                      ? 'bg-[#1A1025] text-white border-[#1A1025] font-extrabold shadow-sm'
                      : 'bg-[#FBF9F4] text-[#6B6478] border-[#E8E3D9] font-bold'
                  }`}
                >
                  <Zap className="w-4 h-4 mx-auto mb-1 text-[#A3E635]" />
                  <span>System Auto</span>
                </button>
              </div>
            </div>

            {/* Ambient Glows Toggle */}
            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#1A1025] block">Cyber Violet Ambient Glow</span>
                <span className="text-[11px] text-[#6B6478]">Soft halo lighting on cards & live indicators</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAmbientGlow(!ambientGlow);
                  showToast(ambientGlow ? 'Disabled ambient glow' : 'Enabled ambient glow');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  ambientGlow ? 'bg-[#8B5CF6]' : 'bg-[#E8E3D9]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    ambientGlow ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Haptic Feedback Toggle */}
            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#1A1025] block">Haptic Touch Vibrations</span>
                <span className="text-[11px] text-[#6B6478]">Tactile spring feedback on mobile buttons</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHapticFeedback(!hapticFeedback);
                  showToast(hapticFeedback ? 'Disabled haptic feedback' : 'Enabled haptic feedback');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  hapticFeedback ? 'bg-[#8B5CF6]' : 'bg-[#E8E3D9]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    hapticFeedback ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Academic Rules & QR Session Preferences */}
        <div className="glass-card rounded-3xl p-6 border border-[#E8E3D9] space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E3D9]">
            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#1A1025]">Academic & QR Rules</h3>
              <p className="text-xs text-[#6B6478]">Defaulter thresholds & dynamic shuffle rates</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Defaulter Threshold Slider */}
            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#1A1025]">Defaulter Warning Limit</span>
                <span className="font-black font-mono text-[#8B5CF6] text-sm">{defaulterThreshold}%</span>
              </div>
              <p className="text-[10px] text-[#6B6478]">Students below this attendance percentage will be flagged red in Excel sheets and parent alerts.</p>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={defaulterThreshold}
                onChange={(e) => {
                  setDefaulterThreshold(Number(e.target.value));
                  showToast(`Updated defaulter threshold to ${e.target.value}%`);
                }}
                className="w-full accent-[#8B5CF6] cursor-pointer"
              />
            </div>

            {/* QR Shuffle Speed */}
            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] space-y-2">
              <span className="font-extrabold text-[#1A1025] block">Live QR Code Shuffle Interval</span>
              <div className="grid grid-cols-3 gap-2">
                {[4, 8, 12].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => {
                      setQrShuffleSpeed(speed);
                      showToast(`Set QR shuffle speed to ${speed} seconds`);
                    }}
                    className={`py-2 rounded-xl border text-center font-extrabold transition-all cursor-pointer tap-active ${
                      qrShuffleSpeed === speed
                        ? 'bg-[#1A1025] text-[#A3E635] border-[#1A1025]'
                        : 'bg-white text-[#6B6478] border-[#E8E3D9]'
                    }`}
                  >
                    {speed} Seconds
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: PWA Offline & Database Queue */}
        <div className="glass-card rounded-3xl p-6 border border-[#E8E3D9] space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E3D9]">
            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#1A1025]">PWA App & Offline Sync</h3>
              <p className="text-xs text-[#6B6478]">Standalone mobile installation & offline queue</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isOnline ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                )}
                <span className="font-extrabold text-[#1A1025]">
                  Status: {isOnline ? 'Online (Supabase Connected)' : 'Offline (Local Cache Active)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#1A1025] block">Queued Offline Actions</span>
                <span className="text-[11px] text-[#6B6478]">{queuedActions.length} pending action(s)</span>
              </div>

              {queuedActions.length > 0 && (
                <button
                  onClick={() => {
                    clearQueue();
                    showToast('Cleared offline queue');
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white font-extrabold text-[10px] rounded-xl hover:bg-rose-700"
                >
                  Clear Queue
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setPwaInstalled(true);
                showToast('Campus OS app saved to iOS/Android Home Screen!');
              }}
              className="w-full py-3 bg-[#1A1025] text-white hover:bg-[#251738] font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all tap-active cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#A3E635]" />
              <span>{pwaInstalled ? 'PWA Installed on Device' : 'Install Standalone App to Home Screen'}</span>
            </button>
          </div>
        </div>

        {/* Card 5: Security, Biometrics & Active Logged-In Devices */}
        <div className="glass-card rounded-3xl p-6 border border-[#E8E3D9] space-y-4 md:col-span-2 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8E3D9]">
            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#1A1025]">Security, Biometrics & Devices</h3>
              <p className="text-xs text-[#6B6478]">Face ID unlock, 2FA status, and logged-in sessions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Biometrics Toggle */}
            <div className="p-4 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center font-bold shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold block text-sm text-[#1A1025]">Face ID / Biometric Lock</span>
                  <span className="text-[11px] text-[#6B6478]">Require biometric auth to view gradebook</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBiometricsEnabled(!biometricsEnabled);
                  showToast(biometricsEnabled ? 'Disabled biometric unlock' : 'Enabled Face ID / Touch ID unlock');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  biometricsEnabled ? 'bg-[#8B5CF6]' : 'bg-[#E8E3D9]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    biometricsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2FA Badge */}
            <div className="p-4 bg-[#A3E635]/15 rounded-2xl border border-[#A3E635]/40 flex items-center justify-between text-[#1A1025]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#A3E635] text-[#1A1025] flex items-center justify-center font-bold shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black block text-sm">Two-Factor Auth (2FA)</span>
                  <span className="text-[11px] font-semibold text-[#6B6478]">Enforced via Official University OTP</span>
                </div>
              </div>

              <span className="bg-[#1A1025] text-[#A3E635] text-[10px] font-black px-2.5 py-1 rounded-full">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Active Logged In Devices */}
          <div className="pt-2 space-y-2">
            <h4 className="text-xs font-extrabold text-[#1A1025] uppercase tracking-wider">
              Active Connected Devices ({activeSessions.length})
            </h4>

            <div className="space-y-2">
              {activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-[#FBF9F4] rounded-2xl border border-[#E8E3D9] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E3D9] flex items-center justify-center text-[#1A1025]">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1A1025]">{s.device}</span>
                        {s.isCurrent && (
                          <span className="text-[9px] font-black bg-[#A3E635] text-[#1A1025] px-2 py-0.5 rounded-full">
                            This Device
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#6B6478]">
                        {s.location} • IP: {s.ip}
                      </span>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(s.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Revoke session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
