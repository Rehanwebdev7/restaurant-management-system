import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RestaurantLayout from '../layouts/RestaurantLayout';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../contexts/AuthGuard';
import Dashboard from '../pages/modules/restaurant/dashboard/Dashboard';
import FOS from '../pages/modules/restaurant/user-management/FOS/FOS';
import Retailers from '../pages/modules/restaurant/user-management/Retailers/Retailers';
import Restaurant from '../pages/modules/restaurant/user-management/Restaurant/Restaurant';
import BranchManagement from '../pages/modules/restaurant/user-management/BranchManagement/BranchManagement';
import BranchTree from '../pages/modules/restaurant/user-management/BranchTree/BranchTree';
import KitchenManagement from '../pages/modules/restaurant/user-management/KitchenManagement/KitchenManagement';
import DeliveryManagement from '../pages/modules/restaurant/user-management/DeliveryManagement/DeliveryManagement';
import CashierManagement from '../pages/modules/restaurant/user-management/CashierManagement/CashierManagement';
import CustomerManagement from '../pages/modules/restaurant/user-management/CustomerManagement/CustomerManagement';
import MenuTree from '../pages/modules/restaurant/menu-management/MenuTree/MenuTree';
import MenuCategory from '../pages/modules/restaurant/menu-management/MenuCategory/MenuCategory';
import MenuSubcategory from '../pages/modules/restaurant/menu-management/MenuSubcategory/MenuSubcategory';
import Section from '../pages/modules/restaurant/menu-management/Section/Section';
import DiningTables from '../pages/modules/restaurant/menu-management/DiningTables/DiningTables';
import MenuItems from '../pages/modules/restaurant/menu-management/MenuItems/MenuItems';
import MenuItemsBulkUpdate from '../pages/modules/restaurant/menu-management/MenuItems/MenuItemsBulkUpdate';
import Addons from '../pages/modules/restaurant/menu-management/Addons/Addons';
import DeliveryZones from '../pages/modules/restaurant/menu-management/DeliveryZones/DeliveryZones';
import RestaurantHours from '../pages/modules/restaurant/menu-management/RestaurantHours/RestaurantHours';

// Order Management Components
import OrderList from '../pages/modules/restaurant/orders/OrderList/OrderList';
import NewOrders from '../pages/modules/restaurant/orders/NewOrders/NewOrders';
import Preparing from '../pages/modules/restaurant/orders/Preparing/Preparing';
import Onway from '../pages/modules/restaurant/orders/Onway/Onway';
import Delivered from '../pages/modules/restaurant/orders/Delivered/Delivered';
import CancelledOrders from '../pages/modules/restaurant/orders/CancelledOrders/CancelledOrders';

// Settings Components
import Slider from '../pages/modules/restaurant/settings/Slider/Slider';
import Coupons from '../pages/modules/restaurant/settings/Coupons/Coupons';
import BankDetail from '../pages/modules/restaurant/settings/BankDetail/BankDetail';
import MarqueeMessages from '../pages/modules/restaurant/settings/MarqueeMessages/MarqueeMessages';
import BusinessSettings from '../pages/modules/admin/settings/BusinessSettings/BusinessSettings';
import PaymentGateway from '../pages/modules/restaurant/settings/PaymentGateway/PaymentGateway';

// Outstanding Components
import OutstandingDelivery from '../pages/modules/restaurant/outstanding/Delivery/OutstandingDelivery';
import OutstandingHistory from '../pages/modules/restaurant/outstanding/OutstandingHistory/OutstandingHistory';

// Wallet Topup
import WalletTopupRequest from '../pages/modules/restaurant/wallet-topup-request/WalletTopupRequest';
import TopupHistory from '../pages/modules/restaurant/wallet-topup-request/TopupHistory';

// Withdrawals
import WithdrawalRequests from '../pages/modules/restaurant/withdrawals/WithdrawalRequests';

// Reports
import Reports from '../pages/modules/restaurant/reports/Reports';
import MyProfile from '../pages/profile/MyProfile';

const RestaurantRoutes = () => {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <Routes>
        <Route element={<RestaurantLayout onLogout={logout} />}>
        <Route path="/" element={<Navigate to="/restaurant/dashboard" replace />} />
        <Route path="/restaurant" element={<Navigate to="/restaurant/dashboard" replace />} />

        {/* Restaurant Module Routes */}
        <Route path="/restaurant/dashboard" element={<Dashboard />} />
        <Route path="/restaurant/user-management/fos" element={<FOS />} />
        <Route path="/restaurant/user-management/retailers" element={<Retailers />} />
        <Route path="/restaurant/user-management/restaurants" element={<Restaurant />} />
        <Route path="/restaurant/user-management/branches" element={<BranchManagement />} />
        <Route path="/restaurant/user-management/branch-tree" element={<BranchTree />} />
        <Route path="/restaurant/user-management/kitchen" element={<KitchenManagement />} />
        <Route path="/restaurant/user-management/delivery" element={<DeliveryManagement />} />
        <Route path="/restaurant/user-management/cashier" element={<CashierManagement />} />
        <Route path="/restaurant/user-management/customers" element={<CustomerManagement />} />
        <Route path="/restaurant/menu-management/menu-tree" element={<MenuTree />} />
        <Route path="/restaurant/menu-management/categories" element={<MenuCategory />} />
        <Route path="/restaurant/menu-management/subcategories" element={<MenuSubcategory />} />
        <Route path="/restaurant/menu-management/sections" element={<Section />} />
        <Route path="/restaurant/menu-management/dining-tables" element={<DiningTables />} />
        <Route path="/restaurant/menu-management/items" element={<MenuItems />} />
        <Route path="/restaurant/user-management/items-bulk-update" element={<MenuItemsBulkUpdate />} />
        <Route path="/restaurant/menu-management/items-bulk-update" element={<MenuItemsBulkUpdate />} />
        <Route path="/restaurant/menu-management/addons" element={<Addons />} />
        <Route path="/restaurant/user-management/delivery-zones" element={<DeliveryZones />} />
        <Route path="/restaurant/user-management/restaurant-hours" element={<RestaurantHours />} />

        {/* Outstanding Routes */}
        <Route path="/restaurant/outstanding/delivery" element={<OutstandingDelivery />} />
        <Route path="/restaurant/outstanding/history" element={<OutstandingHistory />} />

        {/* Wallet Topup */}
        <Route path="/restaurant/wallet-topup/requests" element={<WalletTopupRequest />} />
        <Route path="/restaurant/wallet-topup/history" element={<TopupHistory />} />

        {/* Withdrawals */}
        <Route path="/restaurant/withdrawals/requests" element={<WithdrawalRequests />} />

        {/* Reports */}
        <Route path="/restaurant/reports" element={<Reports />} />

        {/* Order Management Routes */}
        <Route path="/restaurant/orders/list" element={<OrderList />} />
        <Route path="/restaurant/orders/new" element={<NewOrders />} />
        <Route path="/restaurant/orders/preparing" element={<Preparing />} />
        <Route path="/restaurant/orders/onway" element={<Onway />} />
        <Route path="/restaurant/orders/delivered" element={<Delivered />} />
        <Route path="/restaurant/orders/cancelled" element={<CancelledOrders />} />

        {/* Settings Routes */}
        <Route path="/restaurant/settings/business-settings" element={<BusinessSettings />} />
        <Route path="/restaurant/settings/slider" element={<Slider />} />
        <Route path="/restaurant/settings/coupons" element={<Coupons />} />
        <Route path="/restaurant/settings/bank-details" element={<BankDetail />} />
        <Route path="/restaurant/settings/marquee-messages" element={<MarqueeMessages />} />
        <Route path="/restaurant/settings/payment-gateway" element={<PaymentGateway />} />

        <Route path="/profile" element={<MyProfile />} />
        <Route path="*" element={<Navigate to="/restaurant/dashboard" replace />} />
      </Route>
    </Routes>
    </AuthGuard>
  );
};

export default RestaurantRoutes;
