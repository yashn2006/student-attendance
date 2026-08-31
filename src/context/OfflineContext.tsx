import React, { createContext, useContext, useState, useEffect } from 'react';
import { OfflineAction } from '../types';

interface OfflineContextType {
  isOnline: boolean;
  queuedActions: OfflineAction[];
  queueAction: (actionType: OfflineAction['actionType'], payload: any) => void;
  syncQueue: () => void;
  clearQueue: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<OfflineAction[]>(() => {
    const saved = localStorage.getItem('campus_os_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('campus_os_offline_queue', JSON.stringify(queuedActions));
  }, [queuedActions]);

  const queueAction = (actionType: OfflineAction['actionType'], payload: any) => {
    const newAction: OfflineAction = {
      id: 'act_' + Date.now(),
      actionType,
      payload,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'queued'
    };
    setQueuedActions((prev) => [...prev, newAction]);
  };

  const syncQueue = () => {
    if (queuedActions.length === 0) return;
    // Mark as synced
    setQueuedActions([]);
  };

  const clearQueue = () => {
    setQueuedActions([]);
  };

  return (
    <OfflineContext.Provider value={{ isOnline, queuedActions, queueAction, syncQueue, clearQueue }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
