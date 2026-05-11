import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DeliveryLayout from '../layouts/DeliveryLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';

// Delivery Pages
import Dashboard from '../pages/modules/delivery/Dashboard';
import ActiveOrders from '../pages/modules/delivery/ActiveOrders';
import OrderHistory from '../pages/modules/delivery/OrderHistory';
import MyProfile from '../pages/profile/MyProfile';

const DeliveryRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<DeliveryLayout onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/delivery/dashboard" replace />} />
          <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />

          {/* Delivery Module Routes */}
          <Route path="/delivery/dashboard" element={<Dashboard />} />
          <Route path="/delivery/orders" element={<ActiveOrders />} />
          <Route path="/delivery/history" element={<OrderHistory />} />

          <Route path="/profile" element={<MyProfile />} />
          <Route path="*" element={<Navigate to="/delivery/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
};

export default DeliveryRoutes;
