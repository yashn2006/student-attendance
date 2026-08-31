import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  Calendar,
  GraduationCap,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Settings,
  QrCode,
  AlertTriangle,
  User,
  X,
  FileText,
  Command,
  Coffee
} from 'lucide-react';
import { mockStudents, mockTimetable } from '../../data/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenQuickAction: (actionType: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenQuickAction
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items based on query
  const searchItems = [
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Go to Master Dashboard',
      subtitle: 'Overview of attendance, timetable, and faculty metrics',
      icon: LayoutDashboard,
      action: () => {
        onNavigateTab('dashboard');
        onClose();
      }
    },
    {
      id: 'nav-session',
      category: 'Live Session',
      title: 'Launch Live QR & 5-Digit OTP Session',
      subtitle: 'Start, end, or restart live timetable session',
      icon: QrCode,
      action: () => {
        onNavigateTab('session');
        onClose();
      }
    },
    {
      id: 'nav-timetable',
      category: 'Navigation',
      title: 'Weekly Timetable Builder',
      subtitle: 'Manage lecture schedules and room allocations',
      icon: Calendar,
      action: () => {
        onNavigateTab('timetable');
        onClose();
      }
    },
    {
      id: 'nav-ai',
      category: 'AI Tools',
      title: 'Gemini AI Lecture PDF Analyzer',
      subtitle: 'Extract summaries, 5 quiz questions, and remediation strategies',
      icon: Sparkles,
      action: () => {
        onNavigateTab('ai_analyzer');
        onClose();
      }
    },
    {
      id: 'nav-gradebook',
      category: 'Navigation',
      title: 'Gradebook & Assignments',
      subtitle: 'Evaluate student submissions and grade trends',
      icon: GraduationCap,
      action: () => {
        onNavigateTab('gradebook');
        onClose();
      }
    },
    {
      id: 'nav-canteen-credits',
      category: 'Navigation',
      title: 'Canteen Credits',
      subtitle: 'View monthly meal allowance, deduct credits, and show digital receipt',
      icon: Coffee,
      action: () => {
        onNavigateTab('canteen_credits');
        onClose();
      }
    },
    {
      id: 'nav-resources',
      category: 'Navigation',
      title: 'Resource Library',
      subtitle: 'Upload lecture slides, notes, and lab manuals',
      icon: FolderKanban,
      action: () => {
        onNavigateTab('resources');
        onClose();
      }
    },
    {
      id: 'nav-chat',
      category: 'Navigation',
      title: 'Faculty & Student Chat',
      subtitle: 'Threaded department messaging and group channels',
      icon: MessageSquare,
      action: () => {
        onNavigateTab('chat');
        onClose();
      }
    },
    {
      id: 'act-announcement',
      category: 'Quick Actions',
      title: 'Post Class Announcement',
      subtitle: 'Broadcast urgent updates to student app',
      icon: FileText,
      action: () => {
        onOpenQuickAction('announcement');
        onClose();
      }
    },
    {
      id: 'act-defaulter',
      category: 'Quick Actions',
      title: 'Flag Defaulter Warning Alert',
      subtitle: 'Trigger push alert for low attendance students',
      icon: AlertTriangle,
      action: () => {
        onOpenQuickAction('defaulter_alert');
        onClose();
      }
    },
    ...mockStudents.map((student) => ({
      id: `student-${student.id}`,
      category: 'Students',
      title: `${student.name} (${student.rollNo})`,
      subtitle: `Attendance: ${student.overallAttendance}% • ${student.statusTag}`,
      icon: User,
      action: () => {
        onNavigateTab('dashboard');
        onClose();
      }
    })),
    ...mockTimetable.map((slot) => ({
      id: `slot-${slot.id}`,
      category: 'Live Session',
      title: `${slot.subjectName} (${slot.time})`,
      subtitle: `${slot.room} • ${slot.type} • Status: ${slot.sessionStatus || 'Not Started'}`,
      icon: Calendar,
      action: () => {
        onNavigateTab('session');
        onClose();
      }
    }))
  ];

  const filteredItems = searchItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDownInMenu = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md cursor-pointer"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#1A1025] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white cursor-default"
        >
          {/* Search Header Input */}
          <div className="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-black/30">
            <Search className="w-5 h-5 text-[#8B5CF6] absolute left-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDownInMenu}
              autoFocus
              placeholder="Search students, timetable sessions, AI analyzer, or quick actions... (Cmd+K)"
              className="w-full pl-8 pr-12 text-sm bg-transparent text-white placeholder-white/40 focus:outline-none font-medium"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-white/50 text-sm font-medium">
                No matching command or student record found.
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const IconComponent = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/40'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#8B5CF6] text-white'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{item.title}</div>
                        <div className="text-xs text-white/60 font-medium">{item.subtitle}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-[#A3E635] text-[#1A1025]' : 'bg-white/10 text-white/70'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono">↵</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono">esc</kbd> Dismiss
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#A3E635] font-black">
              <Command className="w-3.5 h-3.5" /> Campus OS
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
