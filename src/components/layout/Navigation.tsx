import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  QrCode,
  Users,
  Calendar,
  GraduationCap,
  FolderKanban,
  BarChart3,
  MessageSquare,
  User,
  Sparkles,
  Command,
  Bell,
  FileSpreadsheet,
  Zap,
  Plus,
  Grid,
  X,
  ChevronRight,
  ShieldCheck,
  Coffee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  description?: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Class snapshot & analytics' },
  { id: 'students', label: 'Student Directory', icon: Users, badge: '150', description: 'Complete roster for SYBSc IT' },
  { id: 'session', label: 'Live Session & QR', icon: QrCode, description: '4s dynamic QR & 5-digit OTP' },
  { id: 'attendance_sheet', label: 'Attendance Sheet', icon: FileSpreadsheet, badge: 'Excel', description: 'Monthly matrix & CSV export' },
  { id: 'timetable', label: 'Timetable', icon: Calendar, description: 'Weekly schedule & slot booking' },
  { id: 'ai_analyzer', label: 'AI PDF Analyzer', icon: Sparkles, badge: 'Gemini', description: 'Curriculum & PDF intelligence' },
  { id: 'gradebook', label: 'Gradebook', icon: GraduationCap, description: 'Assignments & grade evaluation' },
  { id: 'canteen_credits', label: 'Canteen Credits', icon: Coffee, badge: 'Allowance', description: 'Monthly meal allowance & digital receipts' },
  { id: 'resources', label: 'Resources', icon: FolderKanban, description: 'Lab manuals & lecture materials' },
  { id: 'chat', label: 'Faculty Chat', icon: MessageSquare, description: 'Channels & broadcast messages' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Mastery heatmaps & defaulter flags' },
  { id: 'profile', label: 'Profile & Settings', icon: User, description: 'Account roles, biometrics & PWA' }
];

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  unreadNotifCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenCommandPalette,
  onOpenNotifications,
  unreadNotifCount
}) => {
  const { user, switchAccountRole } = useAuth();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    setIsMoreSheetOpen(false);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 h-screen shrink-0 bg-[#E5F5EE] border-r border-[#DCEAE3] p-5 z-30 justify-between select-none text-[#14201B] relative overflow-hidden shadow-xs">
        <div className="space-y-6 relative z-10">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
              <div className="w-10 h-10 rounded-2xl bg-[#12A176] flex items-center justify-center text-white font-black text-xl shadow-sm">
                C
              </div>
              <div>
                <span className="text-xl font-black text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans']">
                  Campus <span className="text-[#12A176]">OS</span>
                </span>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#12A176]">
                  Faculty Platform
                </span>
              </div>
            </div>
          </div>

          {/* User Account Profile Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCEAE3] shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[#12A176] text-white font-black text-sm flex items-center justify-center ring-2 ring-[#12A176]/30 shadow-xs shrink-0">
                MS
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-[#14201B] truncate">{user.name}</h4>
                <p className="text-xs text-[#5C6B63] font-semibold truncate">{user.title}</p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#DCEAE3] flex items-center justify-between text-xs relative z-10">
              <span className="text-[10px] font-extrabold uppercase text-[#5C6B63]">Account Role</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#12A176]/12 text-[#12A176] font-extrabold text-[10px]">
                {user.accountType === 'class_teacher' ? 'Class Teacher' : 'Subject Professor'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer tap-active ${
                    isActive
                      ? 'bg-white text-[#12A176] shadow-xs border border-[#DCEAE3]'
                      : 'text-[#5C6B63] hover:text-[#14201B] hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#12A176]' : 'text-[#5C6B63]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        isActive
                          ? 'bg-[#12A176] text-white'
                          : 'bg-[#12A176]/12 text-[#12A176]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-[#DCEAE3] space-y-2 relative z-10">
          {/* Quick Cmd+K Button */}
          <button
            onClick={onOpenCommandPalette}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-white/80 border border-[#DCEAE3] text-[#14201B] text-xs font-bold flex items-center justify-between transition-colors cursor-pointer tap-active shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-[#12A176]" /> Command Palette
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#F8FDFB] text-[10px] font-mono text-[#5C6B63] border border-[#DCEAE3]">
              Cmd+K
            </kbd>
          </button>

          {/* Account Role Switcher Toggle */}
          <button
            onClick={() => switchAccountRole(user.accountType === 'class_teacher' ? 'normal_professor' : 'class_teacher')}
            className="w-full py-2.5 px-3 rounded-xl bg-[#12A176]/12 hover:bg-[#12A176]/20 border border-[#12A176]/30 text-[#12A176] text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer tap-active"
          >
            <span>Switch Role</span>
            <span className="text-[10px] font-mono uppercase bg-[#12A176] px-2 py-0.5 rounded text-white font-black">
              {user.accountType === 'class_teacher' ? '→ Professor' : '→ Class Teacher'}
            </span>
          </button>
        </div>
      </aside>

      {/* MOBILE NATIVE BOTTOM TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#E5F5EE]/95 backdrop-blur-xl text-[#14201B] border-t border-[#DCEAE3] z-40 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] flex items-center justify-between select-none shadow-lg">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer tap-active ${
            currentTab === 'dashboard' ? 'text-[#12A176] font-extrabold scale-105' : 'text-[#5C6B63]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">Home</span>
        </button>

        {/* Tab 2: Live QR */}
        <button
          onClick={() => handleTabClick('session')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer tap-active ${
            currentTab === 'session' ? 'text-[#12A176] font-extrabold scale-105' : 'text-[#5C6B63]'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">Live QR</span>
        </button>

        {/* Center Floating Action / More Button */}
        <div className="relative -mt-6">
          <button
            onClick={() => setIsMoreSheetOpen(true)}
            className="w-13 h-13 rounded-full bg-[#12A176] text-white flex items-center justify-center shadow-md cursor-pointer border-4 border-[#E5F5EE] shrink-0 active:scale-90 transition-transform"
            title="Quick Actions & All Modules"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Attendance Sheet */}
        <button
          onClick={() => handleTabClick('attendance_sheet')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer tap-active ${
            currentTab === 'attendance_sheet' ? 'text-[#12A176] font-extrabold scale-105' : 'text-[#5C6B63]'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">Excel</span>
        </button>

        {/* Tab 4: More / All Sections */}
        <button
          onClick={() => setIsMoreSheetOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer tap-active ${
            ['timetable', 'ai_analyzer', 'gradebook', 'canteen_credits', 'resources', 'chat', 'analytics', 'profile', 'students'].includes(currentTab)
              ? 'text-[#12A176] font-extrabold scale-105'
              : 'text-[#5C6B63]'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">More</span>
        </button>
      </nav>

      {/* INSANE SOFT-CURVED MORE MENU SHEET */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col justify-end"
            onClick={() => setIsMoreSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%', scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-t-[2rem] border-t border-slate-200 dark:border-slate-800 p-0 overflow-hidden max-h-[90vh] shadow-2xl flex flex-col relative max-w-2xl mx-auto w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* TOP HEADER CARD */}
              <div className="bg-slate-900 dark:bg-slate-950 p-5 pb-6 text-white border-b border-slate-800 relative overflow-hidden">
                {/* Pull Handle */}
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 cursor-pointer hover:bg-slate-600 transition-colors" />

                {/* Header Title + Close */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight text-white font-['Plus_Jakarta_Sans']">
                        Campus OS Hub
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">12 active modules & rapid shortcuts</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMoreSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar inside Drawer */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search modules, files, students..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  <Command className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                {/* Date Pills Carousel */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Recent Slots</span>
                    <span className="text-[10px] text-slate-400 font-bold">Aug 2026</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { day: '15', label: 'AUG', active: true },
                      { day: '14', label: 'AUG', active: false },
                      { day: '13', label: 'AUG', active: false },
                      { day: '12', label: 'AUG', active: false },
                      { day: '11', label: 'AUG', active: false },
                      { day: '10', label: 'AUG', active: false },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTabClick('timetable')}
                        className={`shrink-0 w-12 py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          item.active
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 scale-105'
                            : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        <span className="text-xs font-black">{item.day}</span>
                        <span className="text-[9px] font-extrabold opacity-80">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MODULE GRID CONTAINER */}
              <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-t-2xl -mt-3 relative z-10 space-y-4 overflow-y-auto max-h-[55vh]">
                
                {/* Module Category Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      All Campus Modules
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Tap to open</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`group p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer relative overflow-hidden active:scale-95 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500'
                              : 'bg-white dark:bg-slate-800 hover:bg-emerald-50/60 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/70 shadow-xs'
                          }`}
                        >
                          {/* Soft Icon Container */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            <Icon className="w-5 h-5 stroke-[2]" />
                          </div>

                          <span className={`text-xs font-black line-clamp-1 ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                            {item.label.split(' ')[0]}
                          </span>
                          
                          <span className={`text-[9px] font-semibold line-clamp-1 mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.badge ? item.badge : (item.description ? item.description.split(' ')[0] : 'module')}
                          </span>

                          {item.badge && !isActive && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Utility Actions Bar */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      onOpenCommandPalette();
                      setIsMoreSheetOpen(false);
                    }}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 text-left hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Command className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block text-slate-900 dark:text-slate-100">Command Palette</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Press Cmd + K</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchAccountRole(user.accountType === 'class_teacher' ? 'normal_professor' : 'class_teacher');
                      setIsMoreSheetOpen(false);
                    }}
                    className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-3 text-left hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block text-emerald-700 dark:text-emerald-400">Switch Role</span>
                      <span className="text-[10px] text-emerald-600/80 dark:text-emerald-300/80">
                        {user.accountType === 'class_teacher' ? '→ Professor' : '→ Class Teacher'}
                      </span>
                    </div>
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

