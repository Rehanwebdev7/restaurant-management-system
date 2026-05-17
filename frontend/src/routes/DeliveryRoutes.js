import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DeliveryLayout from '../layouts/DeliveryLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';

import Dashboard from '../pages/modules/delivery/Dashboard';
import ActiveOrders from '../pages/modules/delivery/ActiveOrders';
import OrderHistory from '../pages/modules/delivery/OrderHistory';
import Wallet from '../pages/modules/delivery/Wallet';
import BankAccounts from '../pages/modules/delivery/BankAccounts';
import WithdrawalRequest from '../pages/modules/delivery/WithdrawalRequest';
import MyProfile from '../pages/profile/MyProfile';

const DeliveryRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<DeliveryLayout onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/delivery/dashboard" replace />} />
          <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
          <Route path="/delivery/dashboard" element={<Dashboard />} />
          <Route path="/delivery/orders" element={<ActiveOrders />} />
          <Route path="/delivery/history" element={<OrderHistory />} />
          <Route path="/delivery/wallet" element={<Wallet />} />
          <Route path="/delivery/bank-accounts" element={<BankAccounts />} />
          <Route path="/delivery/withdraw" element={<WithdrawalRequest />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="*" element={<Navigate to="/delivery/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
};

export default DeliveryRoutes;
