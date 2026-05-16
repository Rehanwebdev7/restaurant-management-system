import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/apiClient';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const getToken = () => localStorage.getItem('access_token');
  const getRole = () => localStorage.getItem('UserRole');

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    const role = getRole();
    if (!token || role !== 'kitchen') return;

    try {
      const res = await apiClient.get('/api/kitchen/notifications', {
        headers: { access_token: token }
      });
      if (res.data?.success) {
        const data = res.data.success.data;
        setNotifications(data?.notifications || []);
        setUnreadCount(data?.unreadCount || 0);
      }
    } catch {
      // silently ignore — network errors shouldn't break the UI
    }
  }, []);

  // Poll every 15 seconds for kitchen role
  useEffect(() => {
    const role = getRole();
    if (role !== 'kitchen') return;

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 15000);

    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    const token = getToken();
    if (!token) return;

    // Optimistically update UI
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await apiClient.put(`/api/kitchen/notifications/${id}/read`, {}, {
        headers: { access_token: token }
      });
    } catch {
      // revert on failure
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);

    try {
      await apiClient.put('/api/kitchen/notifications/read-all', {}, {
        headers: { access_token: token }
      });
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const clearNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setNotifications([]);
    setUnreadCount(0);

    try {
      await apiClient.delete('/api/kitchen/notifications/clear', {
        headers: { access_token: token }
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
