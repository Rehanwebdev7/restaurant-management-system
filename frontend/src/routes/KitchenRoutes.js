import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import KitchenLayout from '../layouts/KitchenLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';

// Kitchen Pages
import Dashboard from '../pages/modules/kitchen/dashboard/Dashboard';
import KitchenDisplay from '../pages/modules/kitchen/display/KitchenDisplay';
import OrderHistory from '../pages/modules/kitchen/order-history/OrderHistory';
import Reports from '../pages/modules/kitchen/reports/Reports';
import MyProfile from '../pages/profile/MyProfile';

const KitchenRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<KitchenLayout onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/kitchen/dashboard" replace />} />
          <Route path="/kitchen" element={<Navigate to="/kitchen/dashboard" replace />} />

          {/* Kitchen Module Routes */}
          <Route path="/kitchen/dashboard" element={<Dashboard />} />
          <Route path="/kitchen/display" element={<KitchenDisplay />} />
          <Route path="/kitchen/order-history" element={<OrderHistory />} />
          <Route path="/kitchen/reports" element={<Reports />} />

          <Route path="/profile" element={<MyProfile />} />
          <Route path="*" element={<Navigate to="/kitchen/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
};

export default KitchenRoutes;
