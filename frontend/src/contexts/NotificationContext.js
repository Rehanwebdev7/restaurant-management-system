import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onForegroundMessage } from '../firebase/firebase';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    // Load saved notifications from localStorage
    try {
      const saved = localStorage.getItem('fcm_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('fcm_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen for foreground Firebase messages
  useEffect(() => {
    const userRole = localStorage.getItem('UserRole');
    const alertRoles = ['kitchen', 'restaurant'];
    if (!alertRoles.includes(userRole)) return;

    const unsubscribe = onForegroundMessage((payload) => {
      const newNotification = {
        id: Date.now().toString(),
        title: payload.notification?.title || payload.data?.title || 'New Notification',
        message: payload.notification?.body || payload.data?.body || '',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        unread: true,
        data: payload.data || {}
      };

      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, unread: false }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
