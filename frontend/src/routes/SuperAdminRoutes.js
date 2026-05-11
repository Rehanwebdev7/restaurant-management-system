import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';

import Dashboard from '../pages/modules/superadmin/dashboard/Dashboard';
import UserApprovals from '../pages/modules/superadmin/user-approvals/UserApprovals';
import UserDirectory from '../pages/modules/superadmin/user-directory/UserDirectory';
import SubscriptionPlans from '../pages/modules/superadmin/subscription-plans/SubscriptionPlans';
import Subscriptions from '../pages/modules/superadmin/subscriptions/Subscriptions';
import Coupons from '../pages/modules/superadmin/coupons/Coupons';
import Settings from '../pages/modules/superadmin/settings/Settings';
import Restaurants from '../pages/modules/superadmin/restaurants/Restaurants';
import Reports from '../pages/modules/superadmin/reports/Reports';
import Notifications from '../pages/modules/superadmin/notifications/Notifications';

const SuperAdminRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<SuperAdminLayout onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/superadmin/dashboard" element={<Dashboard />} />
          <Route path="/superadmin/restaurants" element={<Restaurants />} />
          <Route path="/superadmin/user-approvals" element={<UserApprovals />} />
          <Route path="/superadmin/user-directory" element={<UserDirectory />} />
          <Route path="/superadmin/subscription-plans" element={<SubscriptionPlans />} />
          <Route path="/superadmin/subscriptions" element={<Subscriptions />} />
          <Route path="/superadmin/coupons" element={<Coupons />} />
          <Route path="/superadmin/reports" element={<Reports />} />
          <Route path="/superadmin/notifications" element={<Notifications />} />
          <Route path="/superadmin/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
};

export default SuperAdminRoutes;
