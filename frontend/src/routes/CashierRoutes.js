import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CashierLayout from '../layouts/CashierLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';

// Cashier Module Pages
import Dashboard from '../pages/modules/cashier/dashboard/Dashboard';
import Delivery from '../pages/modules/cashier/delivery/Delivery';
import Takeaway from '../pages/modules/cashier/takeaway/Takeaway';
import Customers from '../pages/modules/cashier/customers/Customers';

// Menu View Pages
import MenuCategories from '../pages/modules/cashier/menu-view/MenuCategories';
import Subcategories from '../pages/modules/cashier/menu-view/Subcategories';
import Addons from '../pages/modules/cashier/menu-view/Addons';
import DiningTables from '../pages/modules/cashier/menu-view/DiningTables';
import TableOrder from '../pages/modules/cashier/menu-view/TableOrder';
import Sections from '../pages/modules/cashier/menu-view/Sections';

// Operations Pages
import Orders from '../pages/modules/cashier/operations/Orders';
import Payments from '../pages/modules/cashier/operations/Payments';
import Reports from '../pages/modules/cashier/operations/Reports';

// Outstanding Pages
import OutstandingDelivery from '../pages/modules/cashier/outstanding/Delivery/OutstandingDelivery';
import OutstandingHistory from '../pages/modules/cashier/outstanding/OutstandingHistory/OutstandingHistory';

// Wallet Topup
import WalletTopupRequest from '../pages/modules/cashier/wallet-topup-request/WalletTopupRequest';
import TopupHistory from '../pages/modules/cashier/wallet-topup-request/TopupHistory';
import MyProfile from '../pages/profile/MyProfile';

const CashierRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<CashierLayout onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/cashier/dashboard" replace />} />
          <Route path="/cashier" element={<Navigate to="/cashier/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="/cashier/dashboard" element={<Dashboard />} />

          {/* POS */}
          <Route path="/cashier/delivery" element={<Delivery />} />
          <Route path="/cashier/takeaway" element={<Takeaway />} />

          {/* Customers */}
          <Route path="/cashier/customers" element={<Customers />} />

          {/* Menu View (Read Only) */}
          <Route path="/cashier/menu-view/categories" element={<MenuCategories />} />
          <Route path="/cashier/menu-view/subcategories" element={<Subcategories />} />
          <Route path="/cashier/menu-view/addons" element={<Addons />} />
          <Route path="/cashier/dining-tables" element={<DiningTables />} />
          <Route path="/cashier/table-order/:tableId" element={<TableOrder />} />
          <Route path="/cashier/menu-view/sections" element={<Sections />} />

          {/* Operations */}
          <Route path="/cashier/operations/orders" element={<Orders />} />
          <Route path="/cashier/operations/payments" element={<Payments />} />
          <Route path="/cashier/operations/reports" element={<Reports />} />

          {/* Outstanding */}
          <Route path="/cashier/outstanding/delivery" element={<OutstandingDelivery />} />
          <Route path="/cashier/outstanding/history" element={<OutstandingHistory />} />

          {/* Wallet Topup */}
          <Route path="/cashier/wallet-topup/requests" element={<WalletTopupRequest />} />
          <Route path="/cashier/wallet-topup/history" element={<TopupHistory />} />

          <Route path="/profile" element={<MyProfile />} />
          <Route path="*" element={<Navigate to="/cashier/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
};

export default CashierRoutes;
