import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  timestamp: number;
  read?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onUndo?: () => void;
  progress?: number; // 0-100 for progress notifications
  groupId?: string; // For grouping similar notifications
}

interface NotificationContextValue {
  notifications: Notification[];
  history: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  updateProgress: (id: string, progress: number) => void;
  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const MAX_NOTIFICATIONS = 3; // Max visible notifications
const MAX_HISTORY = 50; // Max notifications in history
const DEFAULT_DURATION = 5000; // 5 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [history, setHistory] = useLocalStorage<Notification[]>('notification_history', []);

  // Count unread notifications
  const unreadCount = history.filter(n => !n.read).length;

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      const newNotification: Notification = {
        id,
        timestamp,
        duration: notification.persistent ? undefined : (notification.duration ?? DEFAULT_DURATION),
        read: false,
        ...notification,
      };

      // Check if we should group this notification
      if (notification.groupId) {
        setNotifications(prev => {
          const existingGroup = prev.find(n => n.groupId === notification.groupId);
          if (existingGroup) {
            // Update existing grouped notification
            return prev.map(n =>
              n.groupId === notification.groupId
                ? { ...n, timestamp, message: notification.message || n.message }
                : n
            );
          }
          // Add new notification
          return [...prev.slice(-MAX_NOTIFICATIONS + 1), newNotification];
        });
      } else {
        // Regular notification
        setNotifications(prev => [...prev.slice(-MAX_NOTIFICATIONS + 1), newNotification]);
      }

      // Add to history
      setHistory(prev => [newNotification, ...prev.slice(0, MAX_HISTORY - 1)]);

      // Auto-remove after duration if not persistent
      if (newNotification.duration) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }

      return id;
    },
    [setHistory]
  );

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark as read
  const markAsRead = useCallback(
    (id: string) => {
      setHistory(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [setHistory]
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setHistory(prev => prev.map(n => ({ ...n, read: true })));
  }, [setHistory]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  // Update progress
  const updateProgress = useCallback((id: string, progress: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, progress } : n))
    );
    setHistory(prev =>
      prev.map(n => (n.id === id ? { ...n, progress } : n))
    );
  }, [setHistory]);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({ type: 'success', title, message, ...options });
    },
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({
        type: 'error',
        title,
        message,
        duration: 7000, // Errors stay longer
        ...options,
      });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({ type: 'warning', title, message, ...options });
    },
    [addNotification]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({ type: 'info', title, message, ...options });
    },
    [addNotification]
  );

  const value: NotificationContextValue = {
    notifications,
    history,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearHistory,
    updateProgress,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
