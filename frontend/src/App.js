//App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { OrderAlertProvider } from './contexts/OrderAlertContext';
import OrderAlertOverlay from './components/OrderAlertOverlay';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminRoutes from './routes/AdminRoutes';
import RestaurantRoutes from './routes/RestaurantRoutes';
import BranchRoutes from './routes/BranchRoutes';
import KitchenRoutes from './routes/KitchenRoutes';
import CashierRoutes from './routes/CashierRoutes';
import DeliveryRoutes from './routes/DeliveryRoutes';
import LoginRoutes from './routes/LoginRoutes';

function RoleBasedRoutes() {
  const { user, authState } = useAuth();

  console.log('\n🎯 RoleBasedRoutes - Rendering');
  console.log('  - authState:', authState);
  console.log('  - user:', user);
  console.log('  - Current Path:', window.location.pathname);

  // Show loading spinner while checking auth status
  if (authState.loading) {
    console.log('⏳ Auth loading...');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  // If not authenticated, show login routes (includes all customer pages)
  if (!authState.isAuthenticated) {
    console.log('🚪 Not authenticated - Showing LoginRoutes (Customer + Auth pages)');
    return (
      <Routes>
        <Route path="/*" element={<LoginRoutes />} />
      </Routes>
    );
  }

  // If authenticated but no role, show LoginRoutes instead of redirecting
  // This allows customer pages to work even without admin authentication
  if (!user?.role) {
    console.log('⚠️ Authenticated but no role - Showing LoginRoutes');
    return (
      <Routes>
        <Route path="/*" element={<LoginRoutes />} />
      </Routes>
    );
  }

  // Role-based routing for authenticated admin/panel users
  console.log('✅ Authenticated with role:', user.role);
  return (
    <Routes>
      {(user.role === "supadmin" || user.role === "admin") && <Route path="/*" element={<AdminRoutes />} />}
      {user.role === "restaurant" && <Route path="/*" element={<RestaurantRoutes />} />}
      {user.role === "branch" && <Route path="/*" element={<BranchRoutes />} />}
      {user.role === "kitchen" && <Route path="/*" element={<KitchenRoutes />} />}
      {user.role === "cashier" && <Route path="/*" element={<CashierRoutes />} />}
      {user.role === "delivery" && <Route path="/*" element={<DeliveryRoutes />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={3000} />
      <DarkModeProvider>
        <ThemeProvider>
          <Router>
            <AuthProvider>
              <NotificationProvider>
                <OrderAlertProvider>
                  <RoleBasedRoutes />
                  <OrderAlertOverlay />
                </OrderAlertProvider>
              </NotificationProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </DarkModeProvider>
    </div>
  );
}

export default App;
