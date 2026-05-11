// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authServices from '../services/AuthServices';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null, loading: true });
  const [user, setUser] = useState({ role: '' });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = authServices.getToken();
        const userRole = localStorage.getItem('UserRole');

        const validRoles = ['admin', 'supadmin', 'restaurant', 'branch', 'kitchen', 'cashier', 'delivery'];
        if (token && userRole && validRoles.includes(userRole)) {
          // Valid token exists, set authenticated state
          setUser({ role: userRole });
          setAuthState({
            isAuthenticated: true,
            user: { name: localStorage.getItem('UserName') },
            loading: false
          });
        } else {
          // No token exists, ensure clean state and redirect
          authServices.logout();
          setAuthState({ isAuthenticated: false, user: null, loading: false });
          // Only redirect if not already on auth pages or customer pages
          const authPaths = ['/', '/admin', '/login', '/signup', '/forgot-password', '/verify-otp', '/reset-password'];
          const customerPaths = ['/menu', '/location', '/orders', '/profile', '/addresses', '/about', '/terms', '/privacy', '/refund', '/contact', '/payment-response', '/customer/payment-response'];
          const currentPath = window.location.pathname;
          const isAuthPage = authPaths.some(path => currentPath === path || currentPath.startsWith('/signup'));
          const isCustomerPage = customerPaths.some(path => currentPath === path || currentPath.startsWith('/payment-response') || currentPath.startsWith('/customer/payment-response'));

          console.log('🔒 Auth Check:');
          console.log('  - Current Path:', currentPath);
          console.log('  - Is Auth Page:', isAuthPage);
          console.log('  - Is Customer Page:', isCustomerPage);
          console.log('  - Token:', token ? 'EXISTS' : 'NULL');
          console.log('  - User Role:', userRole);

          if (!isAuthPage && !isCustomerPage) {
            console.log('⚠️ Redirecting to /admin (not auth or customer page)');
            navigate('/admin', { replace: true });
          } else {
            console.log('✅ Allowing access to:', currentPath);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({ isAuthenticated: false, user: null, loading: false });
      }
    };

    checkAuth();
  }, []);

  const login = (response) => {
    const { user, token } = response;
    localStorage.setItem('authToken', token);
    localStorage.setItem('UserRole', user.role);
    localStorage.setItem('UserName', user.name);
    localStorage.setItem('UserMobile', user.mobile);
    localStorage.setItem('user', JSON.stringify({
      role: user.role,
      name: user.name,
      mobile: user.mobile
    }));
    setUser({ role: user.role });
    setAuthState({ isAuthenticated: true, user: { name: user.name }, loading: false });
  };

  const logout = () => {
    authServices.logout();
    setUser({ role: '' });
    setAuthState({ isAuthenticated: false, user: null, loading: false });
    navigate('/admin', { replace: true });
  };

  const refreshToken = async () => {
    const result = await authServices.refreshToken();
    if (result.success) {
      return true;
    } else {
      logout();
      return false;
    }
  };

  // Impersonation support
  const SUPERADMIN_SESSION_KEY = 'SUPERADMIN_SESSION';

  const impersonateUser = (userData, token) => {
    // Save current superadmin session for later restoration
    const currentSession = {
      authToken: localStorage.getItem('authToken'),
      UserRole: localStorage.getItem('UserRole'),
      UserName: localStorage.getItem('UserName'),
      UserMobile: localStorage.getItem('UserMobile'),
      user: localStorage.getItem('user')
    };
    sessionStorage.setItem(SUPERADMIN_SESSION_KEY, JSON.stringify(currentSession));

    // Set the impersonated user's data in localStorage
    const role = userData.role_name || '';
    localStorage.setItem('authToken', token);
    localStorage.setItem('UserRole', role);
    localStorage.setItem('UserName', userData.full_name || '');
    localStorage.setItem('UserMobile', userData.mobile_number || '');
    localStorage.setItem('user', JSON.stringify({
      role: role,
      name: userData.full_name || '',
      mobile: userData.mobile_number || ''
    }));

    // Determine the correct dashboard path based on role
    const roleDashboards = {
      supadmin: '/superadmin/dashboard',
      admin: '/superadmin/dashboard',
      restaurant: '/restaurant/dashboard',
      branch: '/branch/dashboard',
      kitchen: '/kitchen/dashboard',
      cashier: '/cashier/dashboard',
    };
    const dashboardPath = roleDashboards[role] || '/';

    // Do NOT update React state before redirect — it causes re-renders that
    // can trigger API calls which fail and clear localStorage via the interceptor.
    // Just hard-navigate; checkAuth() on reload will read from localStorage.
    window.location.href = dashboardPath;
  };

  const returnToSuperAdmin = () => {
    const saved = sessionStorage.getItem(SUPERADMIN_SESSION_KEY);
    if (!saved) return;
    const session = JSON.parse(saved);
    localStorage.setItem('authToken', session.authToken);
    localStorage.setItem('UserRole', session.UserRole);
    localStorage.setItem('UserName', session.UserName);
    localStorage.setItem('UserMobile', session.UserMobile);
    if (session.user) localStorage.setItem('user', session.user);
    sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
    // Don't update React state before hard redirect — just navigate
    window.location.href = '/superadmin/user-directory';
  };

  const isImpersonating = !!sessionStorage.getItem(SUPERADMIN_SESSION_KEY);

  return (
    <AuthContext.Provider value={{ authState, login, logout, user, setUser, refreshToken, impersonateUser, returnToSuperAdmin, isImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
