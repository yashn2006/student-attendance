import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navigation } from './components/layout/Navigation';
import { Header } from './components/layout/Header';
import { LaunchBootScreen } from './components/auth/LaunchBootScreen';
import { DashboardView } from './components/dashboard/DashboardView';
import { LiveSessionView } from './components/session/LiveSessionView';
import { AttendanceSheetView } from './components/attendance/AttendanceSheetView';
import { TimetableBuilderView } from './components/timetable/TimetableBuilderView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LectureAIAnalyzerView } from './components/ai/LectureAIAnalyzerView';
import { ClassStudentsView } from './components/students/ClassStudentsView';
import { GradebookView } from './components/gradebook/GradebookView';
import { CanteenCreditsHome } from './canteen-credits/CanteenCreditsHome';
import { ResourceLibraryView } from './components/resources/ResourceLibraryView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { FacultyChatView } from './components/chat/FacultyChatView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { CommandPalette } from './components/command/CommandPalette';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { QuickActionModals } from './components/common/QuickActionModals';
import { SystemNotification } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isBootComplete } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeQuickModal, setActiveQuickModal] = useState<'announcement' | 'attendance' | 'leave' | null>(null);

  // Push notifications state
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif_1',
      title: 'Attendance Synced to Excel Matrix',
      message: '98% attendance auto-transferred for Data Structures (Aug 04).',
      timestamp: '10 mins ago',
      type: 'success',
      read: false,
      actionLabel: 'View Attendance Sheet'
    },
    {
      id: 'notif_2',
      title: 'Urgent Defaulter Warning',
      message: 'Aarav Sharma missed 3 consecutive lectures (<75% attendance).',
      timestamp: '1 hour ago',
      type: 'urgent',
      read: false,
      actionLabel: 'Issue Parent Alert'
    },
    {
      id: 'notif_3',
      title: 'Gemini AI Curriculum Insight',
      message: 'Low topic mastery detected in Concurrency Control (35% average).',
      timestamp: '2 hours ago',
      type: 'warning',
      read: true,
      actionLabel: 'Analyze Notes'
    }
  ]);

  if (!isBootComplete || !isAuthenticated) {
    return <LaunchBootScreen />;
  }

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleTriggerTestAlert = async () => {
    try {
      const res = await fetch('/api/notifications/trigger-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Push Alert: Attendance Warning',
          message: 'Automated push alert triggered by faculty system check.',
          type: 'warning'
        })
      });
      const data = await res.json();
      if (data.success && data.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      }
    } catch (_err) {
      setNotifications((prev) => [
        {
          id: 'notif_' + Date.now(),
          title: 'Simulated Push Alert',
          message: 'Urgent intervention flag for low attendance.',
          timestamp: 'Just now',
          type: 'warning',
          read: false
        },
        ...prev
      ]);
    }
  };

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Faculty Operations Command', subtitle: 'Real-time student engagement & class snapshot' };
      case 'students':
        return { title: 'Class Roster (150 Students)', subtitle: 'Complete student directory for SYBSc IT' };
      case 'session':
        return { title: 'Live Session & Encrypted QR', subtitle: '4-second QR code shuffling, 5-digit OTP & rapid manual roll call' };
      case 'attendance_sheet':
        return { title: 'Master Monthly Attendance Sheet', subtitle: 'Interactive Excel-like matrix, 1-click cell editing, defaulter waivers & CSV export' };
      case 'timetable':
        return { title: 'Weekly Timetable Schedule', subtitle: 'Interactive lecture slot booking & room allocation' };
      case 'ai_analyzer':
        return { title: 'Gemini AI PDF Lecture Analyzer', subtitle: 'Server-side Gemini 3.6 Flash curriculum intelligence' };
      case 'gradebook':
        return { title: 'Gradebook & Assignments', subtitle: 'Inline evaluation & submission tracking' };
      case 'canteen_credits':
        return { title: 'Canteen Credits', subtitle: 'Your monthly meal allowance, digitized' };
      case 'resources':
        return { title: 'Course Resource Library', subtitle: 'Document uploads, lab manuals & video lectures' };
      case 'chat':
        return { title: 'Faculty & Student Channels', subtitle: 'Threaded messaging and departmental broadcasts' };
      case 'analytics':
        return { title: 'AI Student Analytics', subtitle: 'Topic mastery heatmaps & predictive care' };
      case 'profile':
        return { title: 'Profile & Role Management', subtitle: 'Class Teacher vs Professor account controls' };
      default:
        return { title: 'Campus OS', subtitle: 'Faculty Intelligence Platform' };
    }
  };

  const headerMeta = getHeaderMeta();
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-[100dvh] w-full max-w-full overflow-hidden bg-[#FBF9F4] text-[#1A1025] flex flex-col md:flex-row font-sans antialiased selection:bg-[#8B5CF6]/30 selection:text-[#1A1025] mobile-viewport-shell">
      {/* Sidebar / Bottom Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCommandPalette={() => setIsCommandOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotifCount={unreadNotifCount}
      />

      {/* Main App Content View Shell */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full overflow-y-auto overflow-x-hidden">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onOpenCommandPalette={() => setIsCommandOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotifCount={unreadNotifCount}
          onNavigateProfile={() => setCurrentTab('profile')}
        />

        <main className="flex-1 p-3.5 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentTab === 'dashboard' && (
                <DashboardView
                  onNavigateTab={setCurrentTab}
                  onOpenActionModal={(modalType) => setActiveQuickModal(modalType)}
                />
              )}

              {currentTab === 'students' && <ClassStudentsView />}

              {currentTab === 'session' && <LiveSessionView />}

              {currentTab === 'attendance_sheet' && <AttendanceSheetView />}

              {currentTab === 'timetable' && <TimetableBuilderView />}

              {currentTab === 'admin' && <AdminDashboard />}

              {currentTab === 'ai_analyzer' && <LectureAIAnalyzerView />}

              {currentTab === 'gradebook' && <GradebookView />}

              {currentTab === 'canteen_credits' && <CanteenCreditsHome />}

              {currentTab === 'resources' && <ResourceLibraryView />}

              {currentTab === 'chat' && <FacultyChatView />}

              {currentTab === 'analytics' && <AnalyticsView />}

              {currentTab === 'profile' && <ProfileSettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigateTab={setCurrentTab}
        onOpenQuickAction={(actionType) => {
          if (actionType === 'announcement') setActiveQuickModal('announcement');
          else if (actionType === 'defaulter_alert') setActiveQuickModal('attendance');
        }}
      />

      {/* Global Push Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onTriggerTestAlert={handleTriggerTestAlert}
      />

      {/* Quick Action Global Modals */}
      <QuickActionModals
        activeModal={activeQuickModal}
        onClose={() => setActiveQuickModal(null)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <SessionProvider>
            <MainAppContent />
          </SessionProvider>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
