import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';
import Dashboard from '../pages/modules/superadmin/dashboard/Dashboard';
import UserApprovals from '../pages/modules/superadmin/user-approvals/UserApprovals';
import UserDirectory from '../pages/modules/superadmin/user-directory/UserDirectory';
import FOS from '../pages/modules/admin/user-management/FOS/FOS';
import Retailers from '../pages/modules/admin/user-management/Retailers/Retailers';
import Restaurant from '../pages/modules/admin/user-management/Restaurant/Restaurant';
import BranchManagement from '../pages/modules/admin/user-management/BranchManagement/BranchManagement';
import KitchenManagement from '../pages/modules/admin/user-management/KitchenManagement/KitchenManagement';
import DeliveryManagement from '../pages/modules/admin/user-management/DeliveryManagement/DeliveryManagement';
import CashierManagement from '../pages/modules/admin/user-management/CashierManagement/CashierManagement';
import MenuCategory from '../pages/modules/admin/menu-management/MenuCategory/MenuCategory';
import MenuSubcategory from '../pages/modules/admin/menu-management/MenuSubcategory/MenuSubcategory';
import Section from '../pages/modules/admin/menu-management/Section/Section';
import DiningTables from '../pages/modules/admin/menu-management/DiningTables/DiningTables';
import MenuItems from '../pages/modules/admin/menu-management/MenuItems/MenuItems';
import MenuItemsBulkUpdate from '../pages/modules/admin/menu-management/MenuItems/MenuItemsBulkUpdate';
import Addons from '../pages/modules/admin/menu-management/Addons/Addons';
import DeliveryZones from '../pages/modules/admin/menu-management/DeliveryZones/DeliveryZones';
import RestaurantHours from '../pages/modules/admin/menu-management/RestaurantHours/RestaurantHours';

// Order Management Components
import OrderList from '../pages/modules/admin/orders/OrderList/OrderList';
import NewOrders from '../pages/modules/admin/orders/NewOrders/NewOrders';
import Preparing from '../pages/modules/admin/orders/Preparing/Preparing';
import Onway from '../pages/modules/admin/orders/Onway/Onway';
import Delivered from '../pages/modules/admin/orders/Delivered/Delivered';
import CancelledOrders from '../pages/modules/admin/orders/CancelledOrders/CancelledOrders';

// Settings Components
import GlobalSetting from '../pages/modules/admin/settings/GlobalSetting/GlobalSetting';
import AppVersion from '../pages/modules/admin/settings/AppVersion/AppVersion';
import DeviceToken from '../pages/modules/admin/settings/DeviceToken/DeviceToken';
import PaymentGateway from '../pages/modules/admin/settings/PaymentGateway/PaymentGateway';
import State from '../pages/modules/admin/settings/State/State';
import City from '../pages/modules/admin/settings/City/City';
import ApiLogs from '../pages/modules/admin/settings/ApiLogs/ApiLogs';
import BusinessSettings from '../pages/modules/admin/settings/BusinessSettings/BusinessSettings';

// SuperAdmin Components (merged)
import SubscriptionPlans from '../pages/modules/superadmin/subscription-plans/SubscriptionPlans';
import Subscriptions from '../pages/modules/superadmin/subscriptions/Subscriptions';
import Coupons from '../pages/modules/superadmin/coupons/Coupons';
import SuperAdminSettings from '../pages/modules/superadmin/settings/Settings';
import Restaurants from '../pages/modules/superadmin/restaurants/Restaurants';
import Reports from '../pages/modules/superadmin/reports/Reports';
import Notifications from '../pages/modules/superadmin/notifications/Notifications';
import MyProfile from '../pages/profile/MyProfile';

const AdminRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<AdminLayout onLogout={logout} />}>
        <Route path="/" element={<Navigate to="/superadmin/dashboard" replace />} />
        <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/superadmin/dashboard" element={<Dashboard />} />

        {/* SuperAdmin specific routes (merged) */}
        <Route path="/superadmin/restaurants" element={<Restaurants />} />
        <Route path="/superadmin/user-approvals" element={<UserApprovals />} />
        <Route path="/superadmin/user-directory" element={<UserDirectory />} />
        <Route path="/superadmin/subscription-plans" element={<SubscriptionPlans />} />
        <Route path="/superadmin/subscriptions" element={<Subscriptions />} />
        <Route path="/superadmin/coupons" element={<Coupons />} />
        <Route path="/superadmin/reports" element={<Reports />} />
        <Route path="/superadmin/notifications" element={<Notifications />} />
        <Route path="/superadmin/sa-settings" element={<SuperAdminSettings />} />
        <Route path="/superadmin/settings" element={<SuperAdminSettings />} />

        {/* User Management */}
        <Route path="/superadmin/user-management/fos" element={<FOS />} />
        <Route path="/superadmin/user-management/retailers" element={<Retailers />} />
        <Route path="/superadmin/user-management/restaurants" element={<Restaurant />} />
        <Route path="/superadmin/user-management/branches" element={<BranchManagement />} />
        <Route path="/superadmin/user-management/kitchen" element={<KitchenManagement />} />
        <Route path="/superadmin/user-management/delivery" element={<DeliveryManagement />} />
        <Route path="/superadmin/user-management/cashier" element={<CashierManagement />} />

        {/* Menu Management */}
        <Route path="/superadmin/menu-management/categories" element={<MenuCategory />} />
        <Route path="/superadmin/menu-management/subcategories" element={<MenuSubcategory />} />
        <Route path="/superadmin/menu-management/sections" element={<Section />} />
        <Route path="/superadmin/menu-management/dining-tables" element={<DiningTables />} />
        <Route path="/superadmin/menu-management/items" element={<MenuItems />} />
        <Route path="/superadmin/user-management/items-bulk-update" element={<MenuItemsBulkUpdate />} />
        <Route path="/superadmin/menu-management/items-bulk-update" element={<MenuItemsBulkUpdate />} />
        <Route path="/superadmin/menu-management/addons" element={<Addons />} />
        <Route path="/superadmin/user-management/delivery-zones" element={<DeliveryZones />} />
        <Route path="/superadmin/user-management/restaurant-hours" element={<RestaurantHours />} />

        {/* Order Management Routes */}
        <Route path="/superadmin/orders/list" element={<OrderList />} />
        <Route path="/superadmin/orders/new" element={<NewOrders />} />
        <Route path="/superadmin/orders/preparing" element={<Preparing />} />
        <Route path="/superadmin/orders/onway" element={<Onway />} />
        <Route path="/superadmin/orders/delivered" element={<Delivered />} />
        <Route path="/superadmin/orders/cancelled" element={<CancelledOrders />} />

        {/* Settings Routes */}
        <Route path="/superadmin/settings/global-setting" element={<GlobalSetting />} />
        <Route path="/superadmin/settings/app-version" element={<AppVersion />} />
        <Route path="/superadmin/settings/device-token" element={<DeviceToken />} />
        <Route path="/superadmin/settings/payment-gateway" element={<PaymentGateway />} />
        <Route path="/superadmin/settings/api-logs" element={<ApiLogs />} />
        <Route path="/superadmin/settings/state" element={<State />} />
        <Route path="/superadmin/settings/city" element={<City />} />
        <Route path="/superadmin/settings/business-settings" element={<BusinessSettings />} />

        <Route path="/profile" element={<MyProfile />} />
        <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
      </Route>
    </Routes>
    </AuthGuard>
  );
};

export default AdminRoutes;
