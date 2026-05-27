import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Modal, Spinner, Button } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ApiGet, ApiPost, ApiPut } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import PayPalButton from '../../../../components/PayPalButton';
import StripeButton from '../../../../components/StripeButton';

const TableOrder = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const tableInfo = location.state?.tableInfo || { tableNumber: `Table ${tableId}` };
  const { primaryColor } = useTheme();
  const { isDarkMode } = useDarkMode();

  const [categories, setCategories] = useState([{ id: 'all', name: 'All Items' }]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [payPalOrderId, setPayPalOrderId] = useState(null);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [gatewayOrderId, setGatewayOrderId] = useState(null);

  const [existingOrderId, setExistingOrderId] = useState(null);
  const [existingOrderNumber, setExistingOrderNumber] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    fetchMenuData();
    loadExistingOrder();
    // Suppress PayPal cross-origin "Script error" from React dev overlay
    const handler = (e) => { if (e.message === 'Script error.') e.stopImmediatePropagation(); };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  const loadExistingOrder = async () => {
    setOrderLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Step 1: Find active booking for this table today
      const bookingRes = await ApiGet('/api/cashier/table_booking/byBookingdate', { bookingDate: today });
      if (!bookingRes.success) return;

      const bookings = bookingRes.success.data?.data || [];
      const activeBooking = bookings.find((b) => {
        const bTableId = b?.tableId?.id || b?.tableId;
        const bStatus = (b?.status || '').toUpperCase();
        return String(bTableId) === String(tableId) && !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(bStatus);
      });
      if (!activeBooking?.id) return;

      // Always remember this booking ID — needed to create new orders even when previous order is terminal
      setActiveBookingId(activeBooking.id);

      // Step 2: Get orders for this booking directly (includes items in response)
      const ordersRes = await ApiGet('/api/cashier/orders/byTableBookingId', { tableBookingId: activeBooking.id });
      if (!ordersRes.success) return;

      const orderList = ordersRes.success.data?.data || [];
      if (!Array.isArray(orderList) || orderList.length === 0) return;

      // Most recent order (ascending by id, so take last)
      const latestOrder = orderList[orderList.length - 1];
      if (!latestOrder?.id) return;

      // Skip terminal-status orders — don't load them as existing (treat as fresh start)
      const TERMINAL = ['SERVED', 'COMPLETED', 'PAID', 'CANCELLED'];
      if (TERMINAL.includes((latestOrder.status || '').toUpperCase())) return;

      setExistingOrderId(latestOrder.id);
      setExistingOrderNumber(latestOrder.orderNumber);
      if (latestOrder.paymentMethod) setPaymentMethod(latestOrder.paymentMethod);

      if (Array.isArray(latestOrder.orderItems) && latestOrder.orderItems.length > 0) {
        const loadedCart = latestOrder.orderItems.filter(item => item.status !== 'CANCELLED').map((item) => ({
          id: item.menuItemId,
          cartItemId: `existing-${item.id}`,
          name: item.menuItemName,
          price: parseFloat(item.price || 0),
          totalPrice: parseFloat(item.price || 0),
          quantity: item.quantity || 1,
          addons: [],
          addonsTotal: parseFloat(item.addonsTotal || 0),
          isExisting: true,
        }));
        setCart(loadedCart);
        setShowMobileCart(true);
      }
    } catch (err) {
      console.error('loadExistingOrder error:', err);
    } finally {
      setOrderLoading(false);
    }
  };

  const fetchMenuData = async () => {
    setMenuLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        ApiGet('/api/cashier/menu_category/all'),
        ApiGet('/api/cashier/menu_items/filter', { pageNumber: 0, pageSize: 1000, isActive: true })
      ]);

      if (catRes.success) {
        const cats = catRes.success.data?.data || [];
        setCategories([{ id: 'all', name: 'All Items' }, ...cats]);
      }

      if (itemRes.success) {
        const data = itemRes.success.data?.data || {};
        setMenuItems(data.records || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch menu data:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  // Mobile cart panel state
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Addon states
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedItemForAddon, setSelectedItemForAddon] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [itemAddons, setItemAddons] = useState([]);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // Format currency
  const formatCurrency = (amount) => `$${amount?.toFixed(2) || '0.00'}`;

  // Fetch addon items from API
  const fetchAddonItems = async (addonId) => {
    if (!addonId) {
      setItemAddons([]);
      return;
    }
    setAddonsLoading(true);
    try {
      const result = await ApiGet(`/api/cashier/addons_items/addonId?addonId=${addonId}`);
      if (result.success) {
        const addons = result.success.data?.data || result.success.data || [];
        setItemAddons(Array.isArray(addons) ? addons : []);
      } else {
        setItemAddons([]);
      }
    } catch (err) {
      console.error('Failed to fetch addon items:', err);
      setItemAddons([]);
    } finally {
      setAddonsLoading(false);
    }
  };

  // Open addon modal
  const openAddonModal = async (item, e) => {
    e.stopPropagation();
    setSelectedItemForAddon(item);
    setSelectedAddons([]);
    setItemAddons([]);
    setShowAddonModal(true);

    if (item?.addonsId?.id) {
      await fetchAddonItems(item.addonsId.id);
    }
  };

  // Update addon quantity
  const updateAddonQuantity = (addonId, delta, e) => {
    e.stopPropagation();
    setSelectedAddons(selectedAddons.map(addon => {
      if (addon.id === addonId) {
        const newQty = Math.max(1, addon.quantity + delta);
        return { ...addon, quantity: newQty };
      }
      return addon;
    }));
  };

  // Add item with addons to cart
  const addItemWithAddons = () => {
    if (!selectedItemForAddon) return;

    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + ((addon.price || 0) * (addon.quantity || 1)), 0);
    const cartItemId = `${selectedItemForAddon.id}-${Date.now()}`;

    const cartItem = {
      ...selectedItemForAddon,
      cartItemId,
      addons: selectedAddons,
      addonsTotal,
      totalPrice: selectedItemForAddon.price + addonsTotal,
      quantity: 1
    };

    setCart([...cart, cartItem]);
    toast.success(`${selectedItemForAddon.name} added with addons!`, { autoClose: 1000 });
    setShowAddonModal(false);
    setSelectedItemForAddon(null);
    setSelectedAddons([]);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || (item.menuCategoryId?.id ?? item.menuCategoryId) === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add to cart
  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id);
    if (existingItem) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Update quantity — block changes on kitchen-accepted (isExisting) items
  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item => {
      const itemKey = item.cartItemId || item.id;
      if (itemKey === cartItemId) {
        if (item.isExisting) return item; // Kitchen item — qty locked
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Remove from cart
  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  const handleCancelItem = async (item) => {
    const cartItemId = item.cartItemId || '';
    const orderItemId = cartItemId.startsWith('existing-')
      ? parseInt(cartItemId.replace('existing-', ''))
      : null;
    if (!orderItemId) return;
    if (!window.confirm(`Cancel "${item.name}"? This will also cancel it in the kitchen.`)) return;
    try {
      const res = await ApiPut('/api/cashier/orders/cancel-item', { orderItemId });
      if (!res.success) throw new Error(res.fail || 'Cancel failed');
      setCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId));
      toast.success(`${item.name} cancelled`);
    } catch (err) {
      toast.error(err.message || 'Cancel failed');
    }
  };

  // Calculate totals (use totalPrice for items with addons)
  const subtotal = cart.reduce((sum, item) => sum + ((item.totalPrice || item.price) * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  // Total items count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const ensureTableBooking = async () => {
    const today = new Date().toISOString().split('T')[0];
    const existingBookings = await ApiGet('/api/cashier/table_booking/byBookingdate', { bookingDate: today });
    if (existingBookings.success) {
      const bookings = existingBookings.success.data?.data || [];
      const activeBooking = bookings.find((booking) => {
        const bookingTableId = booking?.tableId?.id || booking?.tableId;
        const bookingStatus = (booking?.status || '').toUpperCase();
        return String(bookingTableId) === String(tableId)
          && !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(bookingStatus);
      });
      if (activeBooking?.id) {
        return activeBooking.id;
      }
    }

    const bookingPayload = {
      tableId: { id: Number(tableId) },
      status: 'CONFIRMED'
    };
    const bookingResponse = await ApiPost('/api/cashier/table_booking/add', bookingPayload);
    if (!bookingResponse.success) {
      throw new Error(bookingResponse.fail || 'Failed to reserve table');
    }

    const bookingId = bookingResponse.success.data?.data || bookingResponse.success.data;
    if (!bookingId) {
      throw new Error('Table booking ID not returned');
    }
    return bookingId;
  };

  const buildDiningPayload = (bookingId) => ({
    tableBookingId: { id: Number(bookingId) },
    orderType: 'DINING',
    paymentMethod,
    items: cart.filter(item => !item.isExisting).map((item) => ({
      menu_item_id: String(item.id),
      quantity: item.quantity,
      price: item.price,
      special_instructions: '',
      addonItems: item.addons && item.addons.length > 0
        ? item.addons.map((addon) => ({
            addonItemId: addon.id,
            quantity: String(addon.quantity || 1)
          }))
        : []
    }))
  });

  const submitOrder = async (collectPayment = false) => {
    if (cart.length === 0 || processingOrder) return;

    setProcessingOrder(true);
    try {
      let orderId = existingOrderId;

      if (existingOrderId) {
        // Only send NEW items to kitchen — existing items already in DB, don't resend
        const newItems = cart.filter(item => !item.isExisting);
        const rawItems = newItems.map((item) => ({
          menu_item_id: String(item.id),
          quantity: item.quantity,
          price: item.totalPrice || item.price,
          special_instructions: '',
          addonItems: item.addons && item.addons.length > 0
            ? item.addons.map((addon) => ({ addons_item_id: String(addon.id || addon.addons_item_id) }))
            : [],
        }));

        const updatePayload = {
          id: existingOrderId,
          paymentMethod,
          ...(rawItems.length > 0 ? { rawItems } : {}),
        };

        const updateRes = await ApiPut('/api/cashier/orders/update', updatePayload);
        if (!updateRes.success) throw new Error(updateRes.fail || 'Failed to update order');

        // Prevent duplicate appends on next save — mark all items as now existing in DB
        setCart(prev => prev.map(item => ({ ...item, isExisting: true })));

      } else {
        // Use known booking from loadExistingOrder, else fall back to ensureTableBooking
        const bookingId = activeBookingId || await ensureTableBooking();
        const orderResponse = await ApiPost('/api/cashier/orders/adds', buildDiningPayload(bookingId));
        if (!orderResponse.success) throw new Error(orderResponse.fail || 'Failed to place dining order');

        const createdOrder = orderResponse.success.data?.data || orderResponse.success.data || {};
        orderId = createdOrder?.id;
        if (!orderId) throw new Error('Order created but order ID missing');

        // Track new order so subsequent saves update it (not create duplicates)
        setExistingOrderId(orderId);
        setExistingOrderNumber(createdOrder?.orderNumber || null);
        setActiveBookingId(bookingId);
        setCart(prev => prev.map(item => ({ ...item, isExisting: true })));
      }

      if (collectPayment) {
        if (paymentMethod === 'PG') {
          // Show gateway selection modal (PayPal or Stripe)
          setGatewayOrderId(orderId);
          setShowGatewayModal(true);
          setProcessingOrder(false);
          return;
        } else {
          // Handle CASH, UPI, CARD immediately
          const paymentUpdate = await ApiPut('/api/cashier/orders/update', {
            id: orderId,
            paymentStatus: 'SUCCESS',
            status: 'COMPLETED',
            paymentMethod,
          });
          if (!paymentUpdate.success) throw new Error(paymentUpdate.fail || 'Failed to collect payment');
          // Mark dining table as Paid (status 4); backend scheduler releases to Available after 5 min
          await ApiPut('/api/cashier/dining_tables/update', { id: parseInt(tableId), status: 4 });
          toast.success('Order paid successfully!');
          setCart([]);
          setExistingOrderId(null);
          setExistingOrderNumber(null);
          setActiveBookingId(null);
          setShowMobileCart(false);
          navigate('/cashier/dining-tables');
        }
      } else {
        toast.success('Order saved successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process order');
      setProcessingOrder(false);
    } finally {
      if (!showPayPalModal) {
        setProcessingOrder(false);
      }
    }
  };

  const clearOrderState = () => {
    setCart([]);
    setExistingOrderId(null);
    setExistingOrderNumber(null);
    setActiveBookingId(null);
    setShowMobileCart(false);
    setProcessingOrder(false);
  };

  const handlePayPalSuccess = (result) => {
    toast.success('Payment completed successfully!');
    setShowPayPalModal(false);
    setPayPalOrderId(null);
    clearOrderState();
    navigate('/cashier/operations/orders');
  };

  const handlePayPalError = (error) => {
    toast.error('PayPal payment failed: ' + (error?.message || 'Unknown error'));
    setProcessingOrder(false);
  };

  const handlePayPalCancel = () => {
    setShowPayPalModal(false);
    setPayPalOrderId(null);
    setProcessingOrder(false);
  };

  const handleStripeSuccess = (result) => {
    toast.success('Card payment successful!');
    setShowStripeModal(false);
    setGatewayOrderId(null);
    clearOrderState();
    navigate('/cashier/operations/orders');
  };

  const handleStripeError = (error) => {
    toast.error('Card payment failed: ' + (error?.message || 'Unknown error'));
    setProcessingOrder(false);
  };

  const handleStripeCancel = () => {
    setShowStripeModal(false);
    setGatewayOrderId(null);
    setProcessingOrder(false);
  };

  const handleGatewayClose = () => {
    setShowGatewayModal(false);
    setGatewayOrderId(null);
    setProcessingOrder(false);
  };

  return (
    <Container fluid style={{ padding: 0, height: '100vh', display: 'flex', flexDirection: 'column', background: isDarkMode ? 'transparent' : '#f5f5f5', position: 'relative' }}>
      {/* Styles for bottom slide-up billing */}
      <style>{`
        .desktop-billing-col {
          display: none !important;
        }
        .menu-items-col {
          width: 100% !important;
          flex: 0 0 100% !important;
          max-width: 100% !important;
          padding-bottom: 70px !important;
        }
        .dark-modal .modal-content {
          background: rgba(15,15,30,0.95);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .dark-modal .modal-body {
          background: rgba(15,15,30,0.8);
        }
        .dark-modal .btn-close {
          filter: invert(1) grayscale(100%);
        }
      `}</style>

      {/* Main Content */}
      <Row style={{ flex: 1, margin: 0, overflow: 'hidden' }}>
        {/* Left Side - Menu Items */}
        <Col md={7} className="menu-items-col" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Search Bar with Back Button and Table Name */}
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Left - Back Button */}
            <button
              onClick={() => navigate('/cashier/dining-tables')}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isDarkMode ? '#94a3b8' : '#666',
                fontSize: '13px',
                padding: '8px 14px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="bi bi-arrow-left" style={{ fontSize: '14px' }}></i>
              Back
            </button>

            {/* Center - Table Name + Order Badge */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{ color: isDarkMode ? '#e2e8f0' : '#1f2937', fontWeight: '700', fontSize: '16px', whiteSpace: 'nowrap' }}>
                {tableInfo.tableNumber}
              </div>
              {orderLoading && (
                <span style={{ fontSize: '10px', color: isDarkMode ? '#94a3b8' : '#6b7280' }}>Loading order...</span>
              )}
              {existingOrderNumber && !orderLoading && (
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap'
                }}>
                  #{existingOrderNumber} · Running
                </span>
              )}
            </div>

            {/* Right - Search Input */}
            <div style={{
              position: 'relative',
              background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff',
              borderRadius: '8px',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e7eb',
              width: '250px',
              marginLeft: 'auto'
            }}>
              <i className="bi bi-search" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDarkMode ? '#64748b' : '#999',
                fontSize: '14px'
              }}></i>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'transparent',
                  color: isDarkMode ? '#e2e8f0' : '#333'
                }}
              />
            </div>
          </div>

          {/* Categories */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedCategory === cat.id ? primaryColor : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff'),
                  color: selectedCategory === cat.id ? '#fff' : (isDarkMode ? '#94a3b8' : '#333'),
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: menuLoading ? 'flex' : 'grid',
            gridTemplateColumns: menuLoading ? undefined : 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
            alignContent: 'start',
            justifyContent: menuLoading ? 'center' : undefined,
            alignItems: menuLoading ? 'center' : undefined
          }}>
            {menuLoading ? (
              <Spinner animation="border" style={{ color: primaryColor }} />
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', width: '100%', color: '#999', padding: '40px 20px' }}>
                <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                <p style={{ margin: 0 }}>No items found</p>
              </div>
            ) : filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                  borderRadius: '12px',
                  padding: '14px',
                  boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s',
                  border: isDarkMode ? '2px solid rgba(255,255,255,0.08)' : '2px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = primaryColor;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* Clickable area for adding to cart */}
                <div
                  onClick={() => addToCart(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Veg/Non-veg indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '14px',
                    height: '14px',
                    border: `2px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: item.isVeg ? '#22c55e' : '#ef4444'
                    }}></div>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isDarkMode ? '#e2e8f0' : '#1f2937',
                    marginBottom: '8px',
                    lineHeight: '1.3',
                    paddingRight: '20px'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: primaryColor
                  }}>
                    ${item.price}
                  </div>
                </div>

                {/* Addons Button */}
                <button
                  onClick={(e) => openAddonModal(item, e)}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '6px 10px',
                    border: `1px solid ${primaryColor}`,
                    borderRadius: '6px',
                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff',
                    color: primaryColor,
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = primaryColor;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff';
                    e.currentTarget.style.color = primaryColor;
                  }}
                >
                  <i className="bi bi-plus-circle" style={{ fontSize: '12px' }}></i>
                  Addons
                </button>
              </div>
            ))}
          </div>
        </Col>

        {/* Right Side - Billing */}
        <Col md={5} className="desktop-billing-col" style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          background: isDarkMode ? 'rgba(15,15,30,0.5)' : '#fff',
          borderLeft: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
          overflow: 'hidden',
          height: 'fit-content',
          maxHeight: '100%'
        }}>
          {/* Cart Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: isDarkMode ? '2px solid rgba(255,255,255,0.08)' : '2px solid #f3f4f6',
            flexShrink: 0
          }}>
            <h5 style={{ margin: 0, fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#1f2937', fontSize: '14px' }}>
              <i className="bi bi-receipt me-2" style={{ color: primaryColor }}></i>
              Order Details
            </h5>
            <span style={{
              background: primaryColor,
              color: '#fff',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {cart.length} Items
            </span>
          </div>

          {/* Cart Items */}
          <div style={{ overflowY: 'auto', marginBottom: '8px', maxHeight: 'calc(100vh - 300px)' }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px 15px',
                color: isDarkMode ? '#64748b' : '#9ca3af'
              }}>
                <i className="bi bi-cart3" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}></i>
                <p style={{ margin: 0, fontSize: '12px' }}>No items added yet</p>
              </div>
            ) : (
              cart.map(item => {
                const itemKey = item.cartItemId || item.id;
                const itemPrice = item.totalPrice || item.price;
                return (
                <div
                  key={itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 14px',
                    marginBottom: '8px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                    borderRadius: '10px',
                    gap: '12px'
                  }}
                >
                  {/* Item Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isDarkMode ? '#e2e8f0' : '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        border: `2px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                        borderRadius: '2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: item.isVeg ? '#22c55e' : '#ef4444'
                        }}></span>
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    </div>
                    {/* Show addons if any */}
                    {item.addons && item.addons.length > 0 && (
                      <div style={{ fontSize: '10px', color: isDarkMode ? '#64748b' : '#9ca3af', marginTop: '2px' }}>
                        + {item.addons.map(a => `${a.name}${a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#6b7280', marginTop: '4px' }}>
                      ${itemPrice} x {item.quantity}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => updateQuantity(itemKey, -1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: isDarkMode ? '#94a3b8' : '#6b7280'
                      }}
                    >
                      -
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemKey, 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: primaryColor,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Item Total */}
                  <div style={{
                    fontWeight: '700',
                    fontSize: '14px',
                    color: isDarkMode ? '#e2e8f0' : '#1f2937',
                    minWidth: '55px',
                    textAlign: 'right',
                    flexShrink: 0
                  }}>
                    ${itemPrice * item.quantity}
                  </div>

                  {/* Remove Button */}
                  {item.isExisting ? (
                    <button
                      onClick={() => handleCancelItem(item)}
                      title="Item cancel karo"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      onClick={() => removeFromCart(itemKey)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px',
                        fontSize: '16px',
                        flexShrink: 0
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              );})
            )}
          </div>

          {/* Billing Summary */}
          <div style={{
            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f9fafb',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '10px',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '12px',
              color: isDarkMode ? '#94a3b8' : '#6b7280'
            }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '12px',
              color: isDarkMode ? '#94a3b8' : '#6b7280'
            }}>
              <span>GST (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: isDarkMode ? '1px dashed rgba(255,255,255,0.12)' : '1px dashed #e5e7eb',
              fontSize: '14px',
              fontWeight: '700',
              color: isDarkMode ? '#e2e8f0' : '#1f2937'
            }}>
              <span>Total</span>
              <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
            {['CASH', 'UPI', 'CARD', 'PG'].map((method) => {
              const active = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  disabled={processingOrder}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: '8px 4px',
                    border: active ? `2px solid ${primaryColor}` : (isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e7eb'),
                    borderRadius: '8px',
                    background: active ? `${primaryColor}15` : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff'),
                    color: active ? primaryColor : (isDarkMode ? '#94a3b8' : '#475569'),
                    fontWeight: active ? '700' : '500',
                    fontSize: '10px',
                    cursor: processingOrder ? 'not-allowed' : 'pointer'
                  }}
                >
                  {method}
                </button>
              );
            })}
          </div>

          {/* Action Buttons - 4 in one row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            flexShrink: 0
          }}>
            <button
              type="button"
              disabled={cart.length === 0 || processingOrder}
              onClick={() => submitOrder(false)}
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#92400e',
                fontWeight: '600',
                fontSize: '11px',
                cursor: cart.length === 0 || processingOrder ? 'not-allowed' : 'pointer',
                opacity: cart.length === 0 || processingOrder ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-file-earmark-text" style={{ fontSize: '12px' }}></i>
              KOT
            </button>
            <button
              type="button"
              disabled={processingOrder}
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '11px',
                cursor: processingOrder ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-printer" style={{ fontSize: '12px' }}></i>
              Print
            </button>
            <button
              type="button"
              disabled={cart.length === 0 || processingOrder}
              onClick={() => submitOrder(false)}
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#166534',
                fontWeight: '600',
                fontSize: '11px',
                cursor: cart.length === 0 || processingOrder ? 'not-allowed' : 'pointer',
                opacity: cart.length === 0 || processingOrder ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-save" style={{ fontSize: '12px' }}></i>
              Save
            </button>
            <button
              type="button"
              disabled={cart.length === 0 || processingOrder}
              onClick={() => submitOrder(true)}
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: cart.length === 0 ? '#e5e7eb' : primaryColor,
                color: cart.length === 0 ? '#9ca3af' : '#fff',
                fontWeight: '600',
                fontSize: '11px',
                cursor: cart.length === 0 || processingOrder ? 'not-allowed' : 'pointer',
                opacity: processingOrder ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className={`bi ${processingOrder ? 'bi-hourglass-split' : 'bi-credit-card'}`} style={{ fontSize: '12px' }}></i>
              {processingOrder ? 'Processing' : 'Pay'}
            </button>
          </div>
        </Col>
      </Row>

      {/* Cart Bar - Fixed at Bottom */}
      <style>{`
        .table-order-bottom-bar {
          position: fixed;
          bottom: 15px;
          left: 270px;
          right: 15px;
          z-index: 1000;
          background: ${primaryColor};
          color: #fff;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
          border-radius: 12px;
        }
        @media (max-width: 768px) {
          .table-order-bottom-bar {
            left: 10px;
            right: 10px;
            bottom: 10px;
            padding: 10px 15px;
            border-radius: 10px;
          }
        }
      `}</style>
      <div
        className="table-order-bottom-bar"
        onClick={() => setShowMobileCart(true)}
      >
        {/* Left - Items Count */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: '700',
          fontSize: '14px'
        }}>
          {totalItems} Items
        </div>

        {/* Center - Total */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontWeight: '700',
          fontSize: '18px'
        }}>
          ${total.toFixed(2)}
        </div>

        {/* Right - View Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>View Cart</span>
          <i className="bi bi-chevron-up" style={{ fontSize: '18px' }}></i>
        </div>
      </div>

      {/* Mobile Cart Overlay */}
      {showMobileCart && (
        <div
          className="mobile-cart-overlay"
          onClick={() => setShowMobileCart(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1001
          }}
        />
      )}

      {/* Mobile Cart Panel - Slides Up */}
      <style>{`
        .table-order-cart-panel {
          position: fixed;
          top: 70px;
          bottom: 10px;
          left: 270px;
          right: 10px;
          z-index: 1050;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 992px) {
          .table-order-cart-panel {
            left: 10px;
            top: 60px;
          }
        }
        @media (max-width: 768px) {
          .table-order-cart-panel {
            left: 5px;
            right: 5px;
            top: 55px;
            bottom: 5px;
          }
        }
      `}</style>
      <div
        className="table-order-cart-panel"
        style={{
          transform: showMobileCart ? 'translateY(0)' : 'translateY(calc(100% + 100px))',
          pointerEvents: showMobileCart ? 'auto' : 'none'
        }}
      >
        <div
          style={{
            height: '100%',
            overflow: 'hidden',
            background: isDarkMode ? 'rgba(15,15,30,0.98)' : '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Panel Header */}
          <div
            onClick={() => setShowMobileCart(false)}
            style={{
              padding: '12px 15px',
              background: primaryColor,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              borderRadius: '12px 12px 0 0',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', flexWrap: 'wrap' }}>
              <i className="bi bi-cart3" style={{ fontSize: '16px' }}></i>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Current Order</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                {totalItems} Items
              </span>
            </div>
            <i className="bi bi-chevron-down" style={{ color: '#fff', fontSize: '16px' }}></i>
          </div>

          {/* Panel Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: isDarkMode ? '#64748b' : '#9ca3af' }}>
              <i className="bi bi-cart3" style={{ fontSize: '40px', marginBottom: '12px', display: 'block' }}></i>
              <p style={{ margin: 0, fontSize: '14px' }}>No items added yet</p>
            </div>
          ) : (
            cart.map(item => {
              const itemKey = item.cartItemId || item.id;
              const itemPrice = item.totalPrice || item.price;
              return (
                <div
                  key={itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                    borderRadius: '10px',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isDarkMode ? '#e2e8f0' : '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        border: `2px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                        borderRadius: '2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: item.isVeg ? '#22c55e' : '#ef4444'
                        }}></span>
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    </div>
                    {item.addons && item.addons.length > 0 && (
                      <div style={{ fontSize: '10px', color: isDarkMode ? '#64748b' : '#9ca3af', marginTop: '2px' }}>
                        + {item.addons.map(a => `${a.name}${a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#6b7280', marginTop: '4px' }}>
                      ${itemPrice} x {item.quantity}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => updateQuantity(itemKey, -1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: isDarkMode ? '#94a3b8' : '#6b7280'
                      }}
                    >-</button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemKey, 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: primaryColor,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff'
                      }}
                    >+</button>
                  </div>

                  <div style={{
                    fontWeight: '700',
                    fontSize: '14px',
                    color: isDarkMode ? '#e2e8f0' : '#1f2937',
                    minWidth: '55px',
                    textAlign: 'right'
                  }}>
                    ${itemPrice * item.quantity}
                  </div>

                  {item.isExisting ? (
                    <button
                      onClick={() => handleCancelItem(item)}
                      title="Item cancel karo"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px',
                        fontSize: '14px'
                      }}
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      onClick={() => removeFromCart(itemKey)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px',
                        fontSize: '16px'
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

          {/* Panel Billing Summary */}
          <div style={{ padding: '15px 20px', borderTop: isDarkMode ? '2px solid rgba(255,255,255,0.08)' : '2px solid #eee', background: isDarkMode ? 'rgba(10,10,25,0.6)' : '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0 }}>
          <div style={{
            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f9fafb',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '13px',
              color: isDarkMode ? '#94a3b8' : '#6b7280'
            }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '13px',
              color: isDarkMode ? '#94a3b8' : '#6b7280'
            }}>
              <span>GST (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: isDarkMode ? '1px dashed rgba(255,255,255,0.12)' : '1px dashed #e5e7eb',
              fontSize: '16px',
              fontWeight: '700',
              color: isDarkMode ? '#e2e8f0' : '#1f2937'
            }}>
              <span>Total</span>
              <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {['CASH', 'UPI', 'CARD', 'PG'].map((method) => {
              const active = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  disabled={processingOrder}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: '8px 4px',
                    border: active ? `2px solid ${primaryColor}` : (isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e7eb'),
                    borderRadius: '8px',
                    background: active ? `${primaryColor}15` : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff'),
                    color: active ? primaryColor : (isDarkMode ? '#94a3b8' : '#475569'),
                    fontWeight: active ? '700' : '500',
                    fontSize: '11px',
                    cursor: processingOrder ? 'not-allowed' : 'pointer'
                  }}
                >
                  {method}
                </button>
              );
            })}
          </div>

          {/* Panel Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            <button
              type="button"
              disabled={cart.length === 0 || processingOrder}
              onClick={() => submitOrder(false)}
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#92400e',
                fontWeight: '600',
                fontSize: '12px',
                cursor: cart.length === 0 || processingOrder ? 'not-allowed' : 'pointer',
                opacity: cart.length === 0 || processingOrder ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className="bi bi-file-earmark-text" style={{ fontSize: '14px' }}></i>
              KOT
            </button>
            <button
              type="button"
              disabled={processingOrder}
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '12px',
                cursor: processingOrder ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className="bi bi-printer" style={{ fontSize: '14px' }}></i>
              Print
            </button>
            <button
              type="button"
              disabled={cart.length === 0 || processingOrder}
              onClick={() => submitOrder(false)}
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#166534',
                fontWeight: '600',
                fontSize: '12px',
                cursor: cart.length === 0 || processingOrder ? 'not-allowed' : 'pointer',
                opacity: cart.length === 0 || processingOrder ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className="bi bi-save" style={{ fontSize: '14px' }}></i>
              Save
            </button>
            <button
              type="button"
              disabled={cart.length === 0 || processingOrder}
              onClick={() => submitOrder(true)}
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: cart.length === 0 ? '#e5e7eb' : primaryColor,
                color: cart.length === 0 ? '#9ca3af' : '#fff',
                fontWeight: '600',
                fontSize: '12px',
                cursor: cart.length === 0 || processingOrder ? 'not-allowed' : 'pointer',
                opacity: processingOrder ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className={`bi ${processingOrder ? 'bi-hourglass-split' : 'bi-credit-card'}`} style={{ fontSize: '14px' }}></i>
              {processingOrder ? 'Processing' : 'Pay'}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Addon Modal */}
      <Modal show={showAddonModal} onHide={() => setShowAddonModal(false)} centered dialogClassName={isDarkMode ? 'dark-modal' : ''}>
        <Modal.Header closeButton style={{ borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', background: isDarkMode ? 'rgba(15,15,30,0.5)' : 'transparent' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#333' }}>
            <i className="bi bi-plus-circle me-2" style={{ color: primaryColor }}></i>
            Select Addons
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px', background: isDarkMode ? 'rgba(15,15,30,0.8)' : 'transparent' }}>
          {/* Item Header */}
          {selectedItemForAddon && (
            <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)', borderRadius: '10px', padding: '15px', marginBottom: '20px', border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: `2px solid ${selectedItemForAddon.isVeg ? '#28a745' : '#dc3545'}`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: selectedItemForAddon.isVeg ? '#28a745' : '#dc3545'
                  }}></div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: isDarkMode ? '#e2e8f0' : '#333' }}>{selectedItemForAddon.name}</div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: primaryColor }}>{formatCurrency(selectedItemForAddon.price)}</div>
            </div>
          )}

          <div style={{ fontSize: '14px', fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#333', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-grid-3x3-gap" style={{ color: primaryColor }}></i>
            Available Addons
          </div>

          {addonsLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: isDarkMode ? '#64748b' : '#999' }}>
              <Spinner animation="border" size="sm" style={{ color: primaryColor }} />
              <p style={{ margin: '10px 0 0', fontSize: '13px' }}>Loading addons...</p>
            </div>
          ) : !selectedItemForAddon?.addonsId ? (
            <div style={{ textAlign: 'center', padding: '30px', color: isDarkMode ? '#64748b' : '#999', background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8f9fa', borderRadius: '10px' }}>
              <i className="bi bi-x-circle" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px', color: isDarkMode ? '#404854' : '#ddd' }}></i>
              <p style={{ margin: 0, fontWeight: '500' }}>No addons for this item</p>
            </div>
          ) : itemAddons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: isDarkMode ? '#64748b' : '#999', background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8f9fa', borderRadius: '10px' }}>
              <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px', color: isDarkMode ? '#404854' : '#ddd' }}></i>
              <p style={{ margin: 0, fontWeight: '500' }}>No addons available</p>
            </div>
          ) : (
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {itemAddons.map(addon => {
                const selectedAddon = selectedAddons.find(a => a.id === addon.id);
                const isSelected = !!selectedAddon;
                const quantity = selectedAddon?.quantity || 0;
                return (
                  <div
                    key={addon.id}
                    style={{
                      padding: '6px 10px',
                      marginBottom: '5px',
                      borderRadius: '6px',
                      border: isSelected ? `2px solid ${primaryColor}` : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e0e0e0'),
                      background: isSelected ? (isDarkMode ? `${primaryColor}15` : '#fff8f8') : (isDarkMode ? 'rgba(255,255,255,0.04)' : '#fafafa'),
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 2px 6px rgba(215,68,64,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1, fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#333', fontSize: '13px' }}>
                      {addon.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (quantity <= 1) {
                            setSelectedAddons(prev => prev.filter(a => a.id !== addon.id));
                          } else {
                            updateAddonQuantity(addon.id, -1, e);
                          }
                        }}
                        disabled={quantity === 0}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #ddd',
                          background: quantity === 0 ? (isDarkMode ? 'rgba(255,255,255,0.04)' : '#f0f0f0') : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff'),
                          borderRadius: '4px',
                          cursor: quantity === 0 ? 'not-allowed' : 'pointer',
                          fontWeight: '700',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: quantity === 0 ? (isDarkMode ? '#475569' : '#ccc') : (isDarkMode ? '#e2e8f0' : '#333')
                        }}
                      >−</button>
                      <span style={{
                        fontWeight: '700',
                        minWidth: '20px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: quantity > 0 ? primaryColor : (isDarkMode ? '#64748b' : '#999')
                      }}>
                        {quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSelected) {
                            setSelectedAddons(prev => [...prev, { ...addon, quantity: 1 }]);
                          } else {
                            updateAddonQuantity(addon.id, 1, e);
                          }
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: `1px solid ${primaryColor}`,
                          background: primaryColor,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff'
                        }}
                      >+</button>
                    </div>

                    <div style={{
                      fontWeight: '700',
                      color: primaryColor,
                      fontSize: '13px',
                      background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      minWidth: '60px',
                      textAlign: 'right'
                    }}>
                      {formatCurrency(addon.price)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total with addons */}
          {selectedAddons.length > 0 && selectedItemForAddon && (
            <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8f9fa', borderRadius: '8px', padding: '12px', marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#666' }}>
                <span>Item Price:</span>
                <span>{formatCurrency(selectedItemForAddon.price)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#666' }}>
                <span>Addons ({selectedAddons.reduce((sum, a) => sum + (a.quantity || 1), 0)}):</span>
                <span>+{formatCurrency(selectedAddons.reduce((sum, a) => sum + (a.price * (a.quantity || 1)), 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: isDarkMode ? '1px dashed rgba(255,255,255,0.12)' : '1px dashed #ddd', fontWeight: '600', color: isDarkMode ? '#e2e8f0' : 'inherit' }}>
                <span>Total:</span>
                <span style={{ color: primaryColor }}>{formatCurrency(selectedItemForAddon.price + selectedAddons.reduce((sum, a) => sum + (a.price * (a.quantity || 1)), 0))}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', padding: '15px 20px', background: isDarkMode ? 'rgba(15,15,30,0.5)' : 'transparent' }}>
          <Button variant={isDarkMode ? 'dark' : 'light'} onClick={() => setShowAddonModal(false)} style={{ borderRadius: '8px', fontWeight: '500' }}>
            Cancel
          </Button>
          <Button
            onClick={addItemWithAddons}
            style={{ background: primaryColor, border: 'none', borderRadius: '8px', fontWeight: '500', padding: '8px 20px' }}
          >
            <i className="bi bi-cart-plus me-2"></i>
            Add to Cart
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Gateway Selection Modal */}
      <Modal
        show={showGatewayModal}
        onHide={handleGatewayClose}
        centered
        size="sm"
        className={isDarkMode ? 'dark-modal' : ''}
      >
        <Modal.Header
          closeButton
          style={{
            background: isDarkMode ? 'rgba(15,15,30,0.8)' : '#fff',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee'
          }}
        >
          <Modal.Title style={{ color: isDarkMode ? '#e2e8f0' : '#1f2937', fontWeight: '700' }}>
            Choose Payment Method
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: isDarkMode ? 'rgba(15,15,30,0.95)' : '#f9fafb',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              variant="warning"
              style={{ fontWeight: '600', padding: '12px', borderRadius: '8px' }}
              onClick={() => {
                setShowGatewayModal(false);
                setPayPalOrderId(gatewayOrderId);
                setShowPayPalModal(true);
              }}
            >
              <i className="bi bi-paypal me-2"></i>
              Pay with PayPal
            </Button>
            <Button
              variant="primary"
              style={{ fontWeight: '600', padding: '12px', borderRadius: '8px' }}
              onClick={() => {
                setShowGatewayModal(false);
                setShowStripeModal(true);
              }}
            >
              <i className="bi bi-credit-card me-2"></i>
              Pay with Card (Stripe)
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* PayPal Payment Modal */}
      <Modal
        show={showPayPalModal}
        onHide={handlePayPalCancel}
        centered
        size="sm"
        className={isDarkMode ? 'dark-modal' : ''}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header
          closeButton
          style={{
            background: isDarkMode ? 'rgba(15,15,30,0.8)' : '#fff',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee'
          }}
        >
          <Modal.Title style={{ color: isDarkMode ? '#e2e8f0' : '#1f2937', fontWeight: '700' }}>
            Pay with PayPal
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: isDarkMode ? 'rgba(15,15,30,0.95)' : '#f9fafb',
            padding: '20px'
          }}
        >
          {payPalOrderId ? (
            <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PayPalButton
                orderId={payPalOrderId}
                amount={total}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={handlePayPalCancel}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
              <Spinner animation="border" role="status" size="sm" className="mb-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>Loading PayPal...</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Stripe Card Payment Modal */}
      <Modal
        show={showStripeModal}
        onHide={handleStripeCancel}
        centered
        size="sm"
        className={isDarkMode ? 'dark-modal' : ''}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header
          closeButton
          style={{
            background: isDarkMode ? 'rgba(15,15,30,0.8)' : '#fff',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee'
          }}
        >
          <Modal.Title style={{ color: isDarkMode ? '#e2e8f0' : '#1f2937', fontWeight: '700' }}>
            <i className="bi bi-credit-card me-2"></i>
            Pay with Card
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: isDarkMode ? 'rgba(15,15,30,0.95)' : '#f9fafb',
            padding: '20px'
          }}
        >
          {gatewayOrderId ? (
            <StripeButton
              orderId={gatewayOrderId}
              amount={total}
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
              onCancel={handleStripeCancel}
              apiPrefix="cashier"
            />
          ) : (
            <div style={{ textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
              <Spinner animation="border" role="status" size="sm" className="mb-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>Loading...</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TableOrder;
