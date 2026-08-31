import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Check,
  Zap,
  Clock,
  Send
} from 'lucide-react';
import { SystemNotification } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onTriggerTestAlert: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onTriggerTestAlert
}) => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'warning' | 'info'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Push Alerts & Defaulters</h3>
                  <p className="text-xs text-slate-400">Automated faculty push notifications</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Test Trigger */}
            <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['all', 'urgent', 'warning', 'info'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      filter === tab
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                onClick={onMarkAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                  No notifications in this filter.
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  let icon = Zap;
                  let badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                  if (n.type === 'urgent') {
                    icon = AlertTriangle;
                    badgeBg = 'bg-red-500/20 text-red-300 border-red-500/30';
                  } else if (n.type === 'warning') {
                    icon = AlertTriangle;
                    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  } else if (n.type === 'success') {
                    icon = TrendingUp;
                    badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  }

                  const IconComp = icon;

                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onMarkRead(n.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        !n.read
                          ? 'bg-slate-800/80 border-indigo-500/40 shadow-md'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg border flex items-center justify-center ${badgeBg}`}
                          >
                            <IconComp className="w-4 h-4" />
                          </span>
                          <h4
                            className={`text-sm font-bold ${
                              !n.read ? 'text-white' : 'text-slate-300'
                            }`}
                          >
                            {n.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {n.timestamp}
                        </span>
                      </div>

                      <p className="text-xs mt-2 text-slate-300 leading-relaxed">
                        {n.message}
                      </p>

                      {n.actionLabel && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-indigo-400 hover:underline">
                            {n.actionLabel} →
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Simulation Trigger */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400">Push Engine Active</span>
              <button
                onClick={onTriggerTestAlert}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Simulate Push Alert
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
