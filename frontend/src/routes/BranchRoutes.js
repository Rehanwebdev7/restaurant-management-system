import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BranchLayout from '../layouts/BranchLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';
import Dashboard from '../pages/modules/branch/dashboard/Dashboard';
import KitchenManagement from '../pages/modules/branch/user-management/KitchenManagement/KitchenManagement';
import DeliveryManagement from '../pages/modules/branch/user-management/DeliveryManagement/DeliveryManagement';
import CashierManagement from '../pages/modules/branch/user-management/CashierManagement/CashierManagement';
import CustomerManagement from '../pages/modules/branch/user-management/CustomerManagement/CustomerManagement';
import MenuTree from '../pages/modules/branch/menu-management/MenuTree/MenuTree';
import MenuCategory from '../pages/modules/branch/menu-management/MenuCategory/MenuCategory';
import MenuSubcategory from '../pages/modules/branch/menu-management/MenuSubcategory/MenuSubcategory';
import Section from '../pages/modules/branch/menu-management/Section/Section';
import DiningTables from '../pages/modules/branch/menu-management/DiningTables/DiningTables';
import MenuItems from '../pages/modules/branch/menu-management/MenuItems/MenuItems';
import Addons from '../pages/modules/branch/menu-management/Addons/Addons';
import DeliveryZones from '../pages/modules/branch/menu-management/DeliveryZones/DeliveryZones';
import RestaurantHours from '../pages/modules/branch/menu-management/RestaurantHours/RestaurantHours';

// Order Management Components
import OrderList from '../pages/modules/branch/orders/OrderList/OrderList';

// Settings Components
import BankDetail from '../pages/modules/branch/settings/BankDetail/BankDetail';

// Outstanding Components
import OutstandingDelivery from '../pages/modules/branch/outstanding/Delivery/OutstandingDelivery';
import OutstandingHistory from '../pages/modules/branch/outstanding/OutstandingHistory/OutstandingHistory';

// Wallet Topup
import WalletTopupRequest from '../pages/modules/branch/wallet-topup-request/WalletTopupRequest';
import TopupHistory from '../pages/modules/branch/wallet-topup-request/TopupHistory';
import NewOrders from '../pages/modules/branch/orders/NewOrders/NewOrders';
import Preparing from '../pages/modules/branch/orders/Preparing/Preparing';
import Onway from '../pages/modules/branch/orders/Onway/Onway';
import Delivered from '../pages/modules/branch/orders/Delivered/Delivered';
import CancelledOrders from '../pages/modules/branch/orders/CancelledOrders/CancelledOrders';
import MyProfile from '../pages/profile/MyProfile';

const BranchRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<BranchLayout onLogout={logout} />}>
        <Route path="/" element={<Navigate to="/branch/dashboard" replace />} />
        <Route path="/branch" element={<Navigate to="/branch/dashboard" replace />} />

        {/* Branch Module Routes */}
        <Route path="/branch/dashboard" element={<Dashboard />} />
        <Route path="/branch/user-management/kitchen" element={<KitchenManagement />} />
        <Route path="/branch/user-management/delivery" element={<DeliveryManagement />} />
        <Route path="/branch/user-management/cashier" element={<CashierManagement />} />
        <Route path="/branch/user-management/customers" element={<CustomerManagement />} />
        <Route path="/branch/menu-management/menu-tree" element={<MenuTree />} />
        <Route path="/branch/menu-management/categories" element={<MenuCategory />} />
        <Route path="/branch/menu-management/subcategories" element={<MenuSubcategory />} />
        <Route path="/branch/menu-management/sections" element={<Section />} />
        <Route path="/branch/menu-management/dining-tables" element={<DiningTables />} />
        <Route path="/branch/menu-management/items" element={<MenuItems />} />
        <Route path="/branch/menu-management/addons" element={<Addons />} />
        <Route path="/branch/menu-management/delivery-zones" element={<DeliveryZones />} />
        <Route path="/branch/menu-management/restaurant-hours" element={<RestaurantHours />} />

        {/* Order Management Routes */}
        <Route path="/branch/orders/list" element={<OrderList />} />
        <Route path="/branch/orders/new" element={<NewOrders />} />
        <Route path="/branch/orders/preparing" element={<Preparing />} />
        <Route path="/branch/orders/onway" element={<Onway />} />
        <Route path="/branch/orders/delivered" element={<Delivered />} />
        <Route path="/branch/orders/cancelled" element={<CancelledOrders />} />

        {/* Outstanding Routes */}
        <Route path="/branch/outstanding/delivery" element={<OutstandingDelivery />} />
        <Route path="/branch/outstanding/history" element={<OutstandingHistory />} />

        {/* Settings Routes */}
        <Route path="/branch/settings/bank-details" element={<BankDetail />} />

        {/* Wallet Topup */}
        <Route path="/branch/wallet-topup/requests" element={<WalletTopupRequest />} />
        <Route path="/branch/wallet-topup/history" element={<TopupHistory />} />

        <Route path="/profile" element={<MyProfile />} />
        <Route path="*" element={<Navigate to="/branch/dashboard" replace />} />
      </Route>
    </Routes>
    </AuthGuard>
  );
};

export default BranchRoutes;
