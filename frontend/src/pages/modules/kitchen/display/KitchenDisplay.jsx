import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Badge, Button, Spinner, Alert, Table, Form, Pagination } from 'react-bootstrap';
import { ApiGet, ApiPut } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getContrastColor } from '../../../../services/themeService';

const KitchenDisplay = () => {
  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [fromDate, setFromDate] = useState(getCurrentDate());
  const [toDate, setToDate] = useState(getCurrentDate());
  const autoRefreshInterval = useRef(null);
  const soundIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
    totalRecords: 0,
    totalPages: 0
  });
  const [statusCounts, setStatusCounts] = useState({});

  // Get theme colors
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg      = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg     = isDarkMode ? '#1e293b' : '#f8fafc';
  const cBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tp      = isDarkMode ? '#e2e8f0' : '#1e293b';
  const ts      = isDarkMode ? '#cbd5e1' : '#64748b';
  const hBg     = isDarkMode ? '#475569' : '#f1f5f9';

  // Play notification beep using Web Audio API
  const playNotificationBeep = useCallback(() => {
    // Sound disabled for testing
    return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Loud notification tone
      const t = ctx.currentTime;

      // Compressor to boost overall loudness
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-20, t);
      compressor.knee.setValueAtTime(0, t);
      compressor.ratio.setValueAtTime(20, t);
      compressor.attack.setValueAtTime(0, t);
      compressor.release.setValueAtTime(0.01, t);
      compressor.connect(ctx.destination);

      // Note 1: Ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(compressor);
      osc1.type = 'square';
      osc1.frequency.value = 587.33; // D5
      gain1.gain.setValueAtTime(1, t);
      gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc1.start(t);
      osc1.stop(t + 0.3);

      // Note 1 harmonic layer
      const osc1b = ctx.createOscillator();
      const gain1b = ctx.createGain();
      osc1b.connect(gain1b);
      gain1b.connect(compressor);
      osc1b.type = 'triangle';
      osc1b.frequency.value = 587.33 * 2;
      gain1b.gain.setValueAtTime(0.5, t);
      gain1b.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc1b.start(t);
      osc1b.stop(t + 0.25);

      // Note 2: Higher ding
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(compressor);
      osc2.type = 'square';
      osc2.frequency.value = 880; // A5
      gain2.gain.setValueAtTime(1, t + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc2.start(t + 0.15);
      osc2.stop(t + 0.5);

      // Note 2 harmonic layer
      const osc2b = ctx.createOscillator();
      const gain2b = ctx.createGain();
      osc2b.connect(gain2b);
      gain2b.connect(compressor);
      osc2b.type = 'triangle';
      osc2b.frequency.value = 880 * 2;
      gain2b.gain.setValueAtTime(0.5, t + 0.15);
      gain2b.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      osc2b.start(t + 0.15);
      osc2b.stop(t + 0.45);

      // Note 3: Highest ding
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(compressor);
      osc3.type = 'square';
      osc3.frequency.value = 1174.66; // D6
      gain3.gain.setValueAtTime(1, t + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.01, t + 0.75);
      osc3.start(t + 0.3);
      osc3.stop(t + 0.75);

      // Note 3 harmonic layer
      const osc3b = ctx.createOscillator();
      const gain3b = ctx.createGain();
      osc3b.connect(gain3b);
      gain3b.connect(compressor);
      osc3b.type = 'triangle';
      osc3b.frequency.value = 1174.66 * 2;
      gain3b.gain.setValueAtTime(0.5, t + 0.3);
      gain3b.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
      osc3b.start(t + 0.3);
      osc3b.stop(t + 0.7);
    } catch (err) {
      console.warn('Could not play notification sound:', err);
    }
  }, []);

  // Stop notification sound loop
  const stopNotificationSound = useCallback(() => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  }, []);

  // Start notification sound loop
  const startNotificationSound = useCallback(() => {
    stopNotificationSound();
    playNotificationBeep(); // Play immediately
    soundIntervalRef.current = setInterval(() => {
      playNotificationBeep();
    }, 1000); // Repeat every 1 second
  }, [playNotificationBeep, stopNotificationSound]);

  // Manage sound based on PENDING count from statusCounts
  useEffect(() => {
    // Notification sound disabled for testing
    stopNotificationSound();
    return () => stopNotificationSound();
  }, [stopNotificationSound]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      stopNotificationSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Dynamic styles for buttons with hover effects
  const buttonStyles = `
    .btn-accept-action {
      background-color: transparent !important;
      border-color: ${primaryColor} !important;
      color: white !important;
    }
    .btn-accept-action:hover {
      background-color: ${primaryColor} !important;
      border-color: ${primaryColor} !important;
      color: white !important;
    }
    .btn-ready-action {
      background-color: transparent !important;
      border-color: ${tp} !important;
      color: ${tp} !important;
    }
    .btn-ready-action:hover {
      background-color: ${tp} !important;
      border-color: ${tp} !important;
      color: white !important;
    }
    .btn-reject-action {
      background-color: transparent !important;
      border-color: #dc3545 !important;
      color: #dc3545 !important;
    }
    .btn-reject-action:hover {
      background-color: #dc3545 !important;
      border-color: #dc3545 !important;
      color: white !important;
    }
  `;

  // Status mapping for API
  const statusMapping = {
    all: '',
    pending: 'PENDING',
    accepted: 'ACCEPTED_ORDER',
    preparing: 'PREPARING_ORDER',
    ready: 'READY_FOR_ORDER',
    served: 'SERVED'
  };

  // Fetch orders for current active tab status
  const fetchOrders = useCallback(async (status, showLoader = false, search = '', page = pagination.page, pageSize = pagination.pageSize, startDate = fromDate, endDate = toDate) => {
    if (showLoader) setLoading(true);
    setRefreshing(true);
    setError('');

    try {
      let response;

      // Use /api/kitchen/orders/filter only for 'pending' (New Orders) tab
      // Use /api/kitchen/orders/history for all other tabs
      if (status === 'pending') {
        response = await ApiGet('/api/kitchen/orders/filter', {
          searchValue: search,
          status: statusMapping[status] || '',
          pageNumber: page - 1,
          pageSize: pageSize,
          fromDate: startDate,
          toDate: endDate
        });
      } else {
        // For accepted, preparing, ready, all tabs - use history API
        const params = {
          pageNumber: page - 1,
          pageSize: pageSize
        };

        if (statusMapping[status]) params.status = statusMapping[status];
        if (startDate) params.fromDate = startDate;
        if (endDate) params.toDate = endDate;
        if (search) params.searchValue = search;

        response = await ApiGet('/api/kitchen/orders/history', params);
      }

      if (response.success) {
        const data = response.success.data?.data || response.success.data || {};
        const records = data?.records || [];
        setOrders(Array.isArray(records) ? records : []);
        setPagination(prev => ({
          ...prev,
          totalRecords: data?.totalRecords || 0,
          totalPages: data?.totalPages || 0
        }));
      } else {
        console.error(`Failed to fetch orders:`, response.fail);
        setOrders([]);
      }
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch order status counts
  const fetchStatusCounts = useCallback(async () => {
    try {
      const response = await ApiGet('/api/kitchen/orders/order-status-count');
      if (response.success) {
        const data = response.success.data?.data || {};
        setStatusCounts(data);
      }
    } catch (err) {
      console.error('Error fetching status counts:', err);
    }
  }, []);

  // Initial load and auto-refresh setup
  useEffect(() => {
    fetchOrders(activeTab, true, searchValue, pagination.page, pagination.pageSize, fromDate, toDate);
    fetchStatusCounts();

    // Auto-refresh every 15 seconds
    autoRefreshInterval.current = setInterval(() => {
      fetchOrders(activeTab, false, searchValue, pagination.page, pagination.pageSize, fromDate, toDate);
      fetchStatusCounts();
    }, 15000);

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [activeTab, pagination.page, pagination.pageSize]);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders(tabId, true, searchValue, 1, pagination.pageSize, fromDate, toDate);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleRefresh = () => {
    fetchOrders(activeTab, false, searchValue, pagination.page, pagination.pageSize, fromDate, toDate);
  };

  // Handle search input change (no API call)
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleAcceptOrder = async (order) => {
    try {
      const response = await ApiPut('/api/kitchen/orders/update', {
        id: order.id,
        status: 'ACCEPTED_ORDER'
      });

      if (response.success) {
        toast.success(`Order ${order.orderNumber} accepted`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        fetchStatusCounts();
      } else {
        toast.error(response.fail || 'Failed to update order');
      }
    } catch (err) {
      toast.error('Error updating order');
    }
  };

  const handleRejectOrder = async (order) => {
    const confirmed = window.confirm(`Are you sure you want to reject order ${order.orderNumber}?`);
    if (!confirmed) return;

    try {
      const response = await ApiPut('/api/kitchen/orders/update', {
        id: order.id,
        status: 'CANCELLED'
      });

      if (response.success) {
        toast.success(`Order ${order.orderNumber} rejected`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        fetchStatusCounts();
      } else {
        toast.error(response.fail || 'Failed to reject order');
      }
    } catch (err) {
      toast.error('Error rejecting order');
    }
  };

  const handleStartPreparing = async (order) => {
    try {
      const response = await ApiPut('/api/kitchen/orders/update', {
        id: order.id,
        status: 'PREPARING_ORDER'
      });

      if (response.success) {
        toast.success(`Order ${order.orderNumber} moved to Preparing`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        fetchStatusCounts();
      } else {
        toast.error(response.fail || 'Failed to update order');
      }
    } catch (err) {
      toast.error('Error updating order');
    }
  };

  const handleMarkReady = async (order) => {
    try {
      const response = await ApiPut('/api/kitchen/orders/update', {
        id: order.id,
        status: 'READY_FOR_ORDER'
      });

      if (response.success) {
        toast.success(`Order ${order.orderNumber} marked as Ready`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        fetchStatusCounts();
      } else {
        toast.error(response.fail || 'Failed to update order');
      }
    } catch (err) {
      toast.error('Error updating order');
    }
  };

  const handleMarkServed = async (order) => {
    try {
      const response = await ApiPut('/api/kitchen/orders/update', {
        id: order.id,
        status: 'SERVED'
      });

      if (response.success) {
        toast.success(`Order ${order.orderNumber} served at table`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        fetchStatusCounts();
      } else {
        toast.error(response.fail || 'Failed to update order');
      }
    } catch (err) {
      toast.error('Error updating order');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  const getTimeDiff = (dateString) => {
    if (!dateString) return '';
    const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  // Map tab ids to API response count keys
  const countKeyMapping = {
    pending: 'PENDING',
    accepted: 'ACCEPTED_ORDER',
    preparing: 'PREPARING_ORDER',
    ready: 'READY_FOR_ORDER',
    served: 'SERVED',
    all: null
  };

  const TabButton = ({ id, label, isActive }) => {
    const countKey = countKeyMapping[id];
    const count = countKey ? (statusCounts[countKey] ?? 0) : null;

    return (
      <button
        onClick={() => handleTabChange(id)}
        style={{
          padding: '10px 16px',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '13px',
          cursor: 'pointer',
          backgroundColor: isActive ? primaryColor : '#f1f5f9',
          color: isActive ? 'white' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {label}
        {count !== null && count > 0 && (
          <span style={{
            backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : primaryColor,
            color: isActive ? 'white' : 'white',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '12px',
            minWidth: '22px',
            textAlign: 'center',
            lineHeight: '16px'
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <Container fluid className="py-3" style={{ backgroundColor: bg, minHeight: '100vh' }}>
      <style>{buttonStyles}</style>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: tp }}>
          <i className="bi bi-display me-2"></i>
          Kitchen Display
        </h3>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1">
            <label style={{ fontSize: '13px', color: tp, whiteSpace: 'nowrap' }}>From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${cBorder}`,
                fontSize: '13px',
                outline: 'none',
                color: tp
              }}
            />
          </div>
          <div className="d-flex align-items-center gap-1">
            <label style={{ fontSize: '13px', color: tp, whiteSpace: 'nowrap' }}>To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${cBorder}`,
                fontSize: '13px',
                outline: 'none',
                color: tp
              }}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              fetchOrders(activeTab, true, searchValue, 1, pagination.pageSize, fromDate, toDate);
            }}
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
              color: primaryContrast,
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            <i className="bi bi-search me-1"></i>
            Search
          </Button>
          <small className="text-muted ms-2">Auto-refresh: 15s</small>
          <Button
            variant="primary"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
          >
            {refreshing ? (
              <Spinner animation="border" size="sm" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            ) : (
              <i className="bi bi-arrow-clockwise"></i>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Tab Buttons */}
      <div className="mb-4 d-flex flex-wrap gap-2 align-items-center">
        <TabButton id="pending" label="New Orders" isActive={activeTab === 'pending'} />
        <TabButton id="accepted" label="Accepted Orders" isActive={activeTab === 'accepted'} />
        <TabButton id="preparing" label="Preparing Orders" isActive={activeTab === 'preparing'} />
        <TabButton id="ready" label="Ready Orders" isActive={activeTab === 'ready'} />
        <TabButton id="all" label="All Orders" isActive={activeTab === 'all'} />
        <input
          type="text"
          placeholder="Search orders..."
          value={searchValue}
          onChange={handleSearchChange}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: `1px solid ${cBorder}`,
            fontSize: '13px',
            outline: 'none',
            width: '150px',
            marginLeft: '10px'
          }}
        />
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2 text-muted">Loading orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
          <Card.Body className="text-center py-5">
            <i className="bi bi-inbox fs-1 d-block mb-3" style={{ opacity: 0.5, color: tp }}></i>
            <h5 style={{ color: tp }}>
              {activeTab === 'all' && 'No Orders Found'}
              {activeTab === 'pending' && 'No New Orders'}
              {activeTab === 'accepted' && 'No Accepted Orders'}
              {activeTab === 'preparing' && 'No Preparing Orders'}
              {activeTab === 'ready' && 'No Ready Orders'}
            </h5>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg, borderColor: cBorder }}>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead>
                <tr style={{ backgroundColor: primaryColor }}>
                  {activeTab !== 'ready' && activeTab !== 'all' && <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>}
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Id</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Type</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Table No.</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date & Time</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Ordered Items</th>
                  {/* <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Customer Name</th> */}
                  {/* <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Customer Mobile</th> */}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id} style={{ backgroundColor: index % 2 === 0 ? cBg : bg, borderBottom: `1px solid ${cBorder}` }}>
                    {activeTab !== 'ready' && activeTab !== 'all' && (
                      <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            size="sm"
                            className="btn-accept-action"
                            onClick={() => {
                              if (activeTab === 'pending') handleAcceptOrder(order);
                              else if (activeTab === 'accepted') handleStartPreparing(order);
                              else if (activeTab === 'preparing') handleMarkReady(order);
                              else if (activeTab === 'ready') handleMarkServed(order);
                            }}
                            style={{ fontWeight: '500', padding: '6px 16px' }}
                          >
                            {activeTab === 'pending' && 'Accept'}
                            {activeTab === 'accepted' && 'Start'}
                            {activeTab === 'preparing' && 'Ready'}
                            {activeTab === 'ready' && 'Served'}
                          </Button>
                          {activeTab === 'pending' && (
                            <Button
                              size="sm"
                              className="btn-reject-action"
                              onClick={() => handleRejectOrder(order)}
                              style={{ fontWeight: '500', padding: '6px 16px' }}
                            >
                              Reject
                            </Button>
                          )}
                          {activeTab === 'pending' && (
                            <Button
                              size="sm"
                              className="btn-ready-action"
                              onClick={() => handleMarkReady(order)}
                              style={{ fontWeight: '500', padding: '6px 16px' }}
                            >
                              Ready
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: tp }}>{order.orderNumber}</div>
                    </td>
                    <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                      <Badge bg={order.orderType === 'DINE_IN' ? 'primary' : order.orderType === 'ONLINE' ? 'success' : 'info'}>
                        {order.orderType?.replace('_', ' ') || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                      {order.tableNumber ? (
                        <Badge bg="dark">{order.tableNumber}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: tp }}>{formatTime(order.createdAt)}</div>
                    </td>
                    <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                      <details style={{ cursor: 'pointer' }}>
                        <summary style={{ fontSize: '14px', fontWeight: '500', listStyle: 'none' }}>
                          <span style={{
                            fontSize: '13px',
                            color: primaryColor,
                            display: 'inline-flex',
                            alignItems: 'center',
                            textDecoration: 'underline'
                          }}>
                            <i className="bi bi-eye me-1"></i>
                            View ({(order.orderItems || []).length} items)
                          </span>
                        </summary>
                        <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: `2px solid ${cBorder}`, textAlign: 'left' }}>
                          {(order.orderItems || []).map((item, idx) => (
                            <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', paddingBottom: '8px', borderBottom: idx < order.orderItems.length - 1 ? `1px dashed ${cBorder}` : 'none', color: tp }}>
                              <div className="fw-bold">{item.quantity}x {item.menuItemName || item.name || 'Item'}</div>
                              {item.specialInstructions && (
                                <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                                  <i className="bi bi-info-circle me-1"></i>
                                  {item.specialInstructions}
                                </div>
                              )}
                              {item.addonItems && item.addonItems.length > 0 && (
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                  <strong>Addons:</strong>
                                  {item.addonItems.map((addon, addonIdx) => (
                                    <div key={addonIdx} style={{ paddingLeft: '8px' }}>
                                      + {addon.name} (x{addon.quantity})
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                    {/* <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: tp }}>{order.customerName || 'N/A'}</div>
                    </td>
                    <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: tp }}>{order.customerPhone || 'N/A'}</div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <div>
                <Form.Select
                  value={pagination.pageSize}
                  onChange={(e) => {
                    setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }));
                  }}
                  style={{ width: 'auto' }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </Form.Select>
              </div>
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1 || pagination.totalPages === 0}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || pagination.totalPages === 0}
                />
                {pagination.totalPages > 0 && [...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = index + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + index;
                  } else {
                    pageNum = pagination.page - 2 + index;
                  }
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === pagination.page}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                />
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default KitchenDisplay;
