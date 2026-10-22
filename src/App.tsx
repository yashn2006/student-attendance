import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navigation } from './components/layout/Navigation';
import { Header } from './components/layout/Header';
import { LaunchBootScreen } from './components/auth/LaunchBootScreen';
import { LiveSessionView } from './components/session/LiveSessionView';
import { AttendanceSheetView } from './components/attendance/AttendanceSheetView';
import { TimetableBuilderView } from './components/timetable/TimetableBuilderView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ClassStudentsView } from './components/students/ClassStudentsView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { CommandPalette } from './components/command/CommandPalette';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { QuickActionModals } from './components/common/QuickActionModals';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SystemNotification } from './types';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isBootComplete } = useAuth();
  const [currentTab, setCurrentTab] = useState('session');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeQuickModal, setActiveQuickModal] = useState<'announcement' | 'attendance' | 'leave' | null>(null);

  // Push notifications state
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    if (isAuthenticated) setCurrentTab('session');
  }, [isAuthenticated]);

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
      case 'session':
        return { title: 'Live Session & QR', subtitle: 'Live attendance code, QR check-in and session control' };
      case 'attendance_sheet':
        return { title: 'Attendance Sheet', subtitle: 'Verified check-ins and manual overrides per session' };
      case 'students':
        return { title: 'Student Directory', subtitle: 'Students enrolled in your classes' };
      case 'timetable':
        return { title: 'Timetable', subtitle: 'Weekly schedule and slot booking' };
      case 'admin':
        return { title: 'Admin', subtitle: 'Classes, subjects, teachers and assignments' };
      case 'profile':
        return { title: 'Profile & Settings', subtitle: 'Account and application settings' };
      default:
        return { title: 'Campus OS', subtitle: `${user?.name ?? ''} • ${user?.is_admin ? 'Admin' : 'Faculty'}`.trim() };
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
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {currentTab === 'session' && <LiveSessionView />}

                {currentTab === 'attendance_sheet' && <AttendanceSheetView />}

                {currentTab === 'students' && <ClassStudentsView />}

                {currentTab === 'timetable' && <TimetableBuilderView />}

                {currentTab === 'admin' && <AdminDashboard />}

                {currentTab === 'profile' && <ProfileSettingsView />}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
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
