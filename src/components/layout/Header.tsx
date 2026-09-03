import React from 'react';
import { Bell, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  unreadNotifCount: number;
  onNavigateProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenCommandPalette,
  onOpenNotifications,
  unreadNotifCount,
  onNavigateProfile
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#F8FDFB]/90 backdrop-blur-xl border-b border-[#DCEAE3] px-3 md:px-8 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between gap-3 text-[#14201B] shadow-xs select-none">
      {/* Left Title & Scope Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* Mobile Small Campus Logo */}
          <div className="md:hidden w-7 h-7 rounded-lg bg-[#12A176] text-white font-black text-xs flex items-center justify-center shrink-0">
            C
          </div>

          <h1 className="text-sm md:text-2xl font-black text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans'] truncate">
            {title}
          </h1>

          {/* Active Account Role Tag */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#12A176]/12 text-[#12A176] shrink-0 border border-[#12A176]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12A176] animate-pulse" />
            <span>
              {user.isClassTeacher
                ? `Class Teacher (${user.classTeacherClassName || 'SYBSc IT'})`
                : `Subject Professor (${user.subjects?.[0]?.name || 'Networks'})`}
            </span>
          </div>
        </div>

        <p className="text-[11px] md:text-xs text-[#5C6B63] font-semibold truncate mt-0.5">
          {subtitle || `${user.department || 'Department'} • ${user.name}`}
        </p>
      </div>

      {/* Right Actions Bar */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Actions / Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="p-2 md:px-3.5 md:py-2 rounded-xl bg-white hover:bg-[#E5F5EE] border border-[#DCEAE3] text-xs text-[#14201B] font-bold transition-all cursor-pointer shadow-xs hover:border-[#12A176] tap-active flex items-center gap-1.5"
          title="Search & Quick Actions (Cmd+K)"
        >
          <Zap className="w-4 h-4 text-[#12A176]" />
          <span className="hidden md:inline">Search & Actions</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-[#F8FDFB] text-[10px] font-mono text-[#5C6B63] border border-[#DCEAE3]">
            Cmd+K
          </kbd>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="p-2 md:p-2.5 rounded-xl bg-white hover:bg-[#E5F5EE] border border-[#DCEAE3] text-[#14201B] transition-all relative cursor-pointer shadow-xs hover:border-[#12A176] tap-active"
          title="Push Notifications & Defaulter Alerts"
        >
          <Bell className="w-4 h-4 text-[#12A176]" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DB5B4E] text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
              {unreadNotifCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <button
          onClick={onNavigateProfile}
          className="flex items-center gap-2 pl-1 cursor-pointer tap-active"
          title="Profile & Settings"
        >
          <div className="hidden lg:flex flex-col items-end text-right">
            <span className="text-xs font-black text-[#14201B] leading-tight">{user.name}</span>
            <span className="text-[10px] font-extrabold text-[#12A176]">SYBSc IT Scope</span>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#12A176] text-white font-black text-xs flex items-center justify-center ring-2 ring-[#12A176]/30 shadow-xs shrink-0">
            MS
          </div>
        </button>
      </div>
    </header>
  );
};

