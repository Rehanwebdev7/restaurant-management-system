import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';
import apiClient from '../../../api/apiClient';

const OrdersPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#b48a1d';

  const [orders, setOrders] = useState([]);
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('customerThemeMode') || 'dark';
  });
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [deliveryTimes, setDeliveryTimes] = useState({});
  const [, setTick] = useState(0);

  const branchMinutes = parseInt(localStorage.getItem('CustomerBranchMinutes')) || 0;
  const PAGE_SIZE = 5;

  // Tick every second for countdown
  useEffect(() => {
    const hasActive = Object.values(deliveryTimes).some(dt => dt.endTime > Date.now());
    if (!hasActive) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [deliveryTimes]);

  const getCountdown = (orderId) => {
    const dt = deliveryTimes[orderId];
    if (!dt) return null;
    const remaining = Math.max(0, Math.floor((dt.endTime - Date.now()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return { mins, secs, remaining, text: `${mins} min ${secs < 10 ? '0' : ''}${secs} sec` };
  };

  const fetchDeliveryTime = async (order) => {
    if (deliveryTimes[order.id] !== undefined) return;
    if (order.orderType !== 'DELIVERY') return;

    const deliveryId = order.deliveryId?.id || order.deliveryId;
    const branchId = order.branchId?.id || order.branchId;
    const addressId = order.customerDeliveryAddressesId?.id;

    if (!branchId || !addressId) return;

    try {
      const response = await apiClient.get(
        `/api/customer/orders/track?deliveryId=${deliveryId || ''}&branchId=${branchId}&addressId=${addressId}`
      );
      if (response.data?.Status === 'SUCCESS' && response.data?.data?.duration_minutes != null) {
        const minutes = response.data.data.duration_minutes;
        setDeliveryTimes(prev => ({
          ...prev,
          [order.id]: { minutes, endTime: Date.now() + minutes * 60 * 1000 }
        }));
      }
    } catch (error) {
      console.error('Error fetching delivery time:', error);
    }
  };

  const fetchAllDeliveryTimes = (ordersList) => {
    ordersList.forEach(order => fetchDeliveryTime(order));
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const fetchOrders = async (page = 0, append = false) => {
    try {
      if (append) {
        setLoadMoreLoading(true);
      } else {
        setLoading(true);
      }
      const response = await apiClient.get(`/api/customer/orders/filter?pageSize=${PAGE_SIZE}&pageNumber=${page}`);
      if (response.data?.Status === 'SUCCESS' && response.data?.data?.records) {
        const newRecords = response.data.data.records;
        if (append) {
          setOrders(prev => [...prev, ...newRecords]);
        } else {
          setOrders(newRecords);
        }
        setCurrentPage(page);
        setTotalPages(response.data.data.totalPages);
        fetchAllDeliveryTimes(newRecords);
      } else if (!append) {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!append) setOrders([]);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (currentPage + 1 < totalPages) {
      fetchOrders(currentPage + 1, true);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const customerData = localStorage.getItem('customerData');
    if (!customerData) {
      navigate('/login');
      return;
    }

    fetchOrders(0);
  }, [navigate]);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return '#22c55e';
      case 'PENDING': return '#f59e0b';
      case 'ACCEPTED_ORDER': return '#3b82f6';
      case 'PREPARING_ORDER': return '#8b5cf6';
      case 'READY_FOR_ORDER': return '#06b6d4';
      case 'CANCELLED':
      case 'REJECTED': return '#ef4444';
      default: return '#666';
    }
  };

  // Order tracking steps
  const getOrderSteps = (orderType) => {
    if (orderType === 'DINE_IN') {
      return [
        { key: 'PENDING', label: 'Order Placed', icon: 'bi-receipt', color: '#f59e0b' },
        { key: 'ACCEPTED_ORDER', label: 'Accepted', icon: 'bi-check-circle', color: '#3b82f6' },
        { key: 'PREPARING_ORDER', label: 'Preparing', icon: 'bi-fire', color: '#8b5cf6' },
        { key: 'READY_FOR_ORDER', label: 'Ready', icon: 'bi-bag-check', color: '#06b6d4' },
        { key: 'DELIVERED', label: 'Served', icon: 'bi-check2-all', color: '#22c55e' }
      ];
    }
    return [
      { key: 'PENDING', label: 'Order Placed', icon: 'bi-receipt', color: '#f59e0b' },
      { key: 'ACCEPTED_ORDER', label: 'Accepted', icon: 'bi-check-circle', color: '#3b82f6' },
      { key: 'PREPARING_ORDER', label: 'Preparing', icon: 'bi-fire', color: '#8b5cf6' },
      { key: 'READY_FOR_ORDER', label: 'Ready', icon: 'bi-bag-check', color: '#06b6d4' },
      { key: 'DELIVERED', label: 'Delivered', icon: 'bi-check2-all', color: '#22c55e' }
    ];
  };

  const getStepIndex = (status, orderType) => {
    const steps = getOrderSteps(orderType);
    const statusUpper = status?.toUpperCase();

    const index = steps.findIndex(s => s.key === statusUpper);
    return index >= 0 ? index : 0;
  };

  const isOrderCancelled = (status) => {
    const s = status?.toUpperCase();
    return s === 'CANCELLED' || s === 'REJECTED';
  };

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    setCancelLoading(true);
    try {
      const response = await apiClient.put('/api/customer/orders/update', {
        id: selectedOrder.id,
        status: 'CANCELLED'
      });

      if (response.data?.Status === 'SUCCESS') {
        // Update order in local state
        setOrders(prev => prev.map(order =>
          order.id === selectedOrder.id ? { ...order, status: 'CANCELLED' } : order
        ));
        setShowCancelModal(false);
        setSelectedOrder(null);
      } else {
        alert('Failed to cancel order. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const isDark = themeMode === 'dark';
  const bgColor = isDark ? '#05070c' : '#f5f2eb';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f4efe6' : '#1c1917';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 0, 0, 0.06)';
  const accentGold = '#b48a1d';
  const headerBg = isDark 
    ? 'linear-gradient(135deg, #0f172a 0%, #05070c 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f5f2eb 100%)';
  const headerTextColor = isDark ? '#f4efe6' : '#1c1917';

  return (
    <div className="orders-page">
      <style>{`
        .orders-page {
          min-height: 100vh;
          background: ${bgColor};
          color: ${textColor};
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: all 0.3s ease;
        }

        .orders-header {
          background: ${headerBg};
          border-bottom: 1px solid ${borderCol};
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .back-btn {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border: 1px solid ${borderCol};
          color: ${headerTextColor};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: ${accentGold};
          color: #05070c;
          border-color: ${accentGold};
          transform: translateX(-2px);
        }

        .header-title {
          color: ${headerTextColor};
          font-size: 20px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .orders-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-card {
          background: ${cardBg};
          border: 1px solid ${borderCol};
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border-left: 5px solid ${borderCol};
        }

        .order-card:hover {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
          border-left-color: ${accentGold};
        }

        /* Status-based border colors */
        .order-card:has(.order-status) {
          border-left-color: #ff9800;
        }

        .order-card-top {
          padding: 18px 20px;
          cursor: pointer;
          user-select: none;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .order-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex: 1;
          min-width: 0;
        }

        .order-id {
          font-size: 13px;
          color: #888;
          white-space: nowrap;
        }

        .order-id span {
          font-weight: 700;
          color: #1a1a2e;
          font-size: 14px;
        }

        .header-divider {
          width: 1px;
          height: 16px;
          background: #ddd;
        }

        .order-date {
          font-size: 12px;
          color: #aaa;
          white-space: nowrap;
        }

        .order-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          background: #e3f2fd;
          color: #1976d2;
          letter-spacing: 0.3px;
        }

        .order-type-badge i {
          font-size: 13px;
        }

        .time-badges-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .est-time-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #fff3e0;
          color: #e65100;
        }

        .delivery-time-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #e8f5e9;
          color: #2e7d32;
          font-variant-numeric: tabular-nums;
        }

        .time-badge-label {
          font-weight: 500;
          opacity: 0.8;
          font-size: 10px;
        }

        .time-badge-value {
          font-weight: 600;
          font-size: 11px;
          border-left: 1.5px solid currentColor;
          padding-left: 6px;
          margin-left: 3px;
        }

        .delivery-time-done {
          background: #fff3e0;
          color: #e65100;
          animation: blink 1s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .order-status {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          white-space: nowrap;
          flex-shrink: 0;
          background: #fff3cd;
          color: #997404;
        }

        /* Status color variants */
        .order-status.PENDING {
          background: #fff3cd;
          color: #997404;
        }

        .order-status.PREPARING {
          background: #cfe2ff;
          color: #084298;
        }

        .order-status.READY,
        .order-status.DELIVERED {
          background: #d1e7dd;
          color: #0f5132;
        }

        .order-status.CANCELLED {
          background: #f8d7da;
          color: #842029;
        }

        .order-items-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0 0;
          border-top: 1px dashed #eee;
          margin-top: 12px;
        }

        .items-summary {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .items-summary .item-line {
          font-size: 13px;
          color: #444;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .items-summary .item-line .item-qty {
          background: ${primaryColor}15;
          color: ${primaryColor};
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .order-total-preview {
          text-align: right;
        }

        .order-total-preview .total-amount {
          font-size: 22px;
          font-weight: 800;
          color: ${primaryColor};
          letter-spacing: -0.5px;
        }

        .order-total-preview .payment-badge {
          font-size: 11px;
          font-weight: 600;
          margin-top: 2px;
        }

        .expand-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          color: #bbb;
          font-size: 12px;
          gap: 4px;
          border-top: 1px solid #f5f5f5;
          transition: all 0.3s;
          cursor: pointer;
        }

        .expand-indicator:hover {
          background: #fafafa;
          color: #888;
        }

        .expand-indicator i {
          transition: transform 0.3s ease;
        }

        .expand-indicator.expanded i {
          transform: rotate(180deg);
        }

        /* Expandable Details Section */
        .order-details-panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease, opacity 0.3s ease;
          opacity: 0;
          background: #fafbfc;
        }

        .order-details-panel.open {
          max-height: 2000px;
          opacity: 1;
        }

        .order-details-inner {
          padding: 0 20px 20px;
        }

        .detail-section {
          padding: 16px 0;
          border-bottom: 1px solid #eee;
        }

        .detail-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .detail-section-title {
          font-size: 12px;
          font-weight: 700;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-section-title i {
          font-size: 14px;
          color: ${primaryColor};
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
        }

        .detail-label {
          font-size: 13px;
          color: #777;
        }

        .detail-value {
          font-size: 13px;
          color: #333;
          font-weight: 600;
        }

        .detail-row.total-row {
          padding: 10px 0 0;
          margin-top: 6px;
          border-top: 1px dashed #ddd;
        }

        .detail-row.total-row .detail-label {
          font-size: 14px;
          font-weight: 700;
          color: #333;
        }

        .detail-row.total-row .detail-value {
          font-size: 16px;
          font-weight: 800;
          color: ${primaryColor};
        }

        .customer-info-card {
          background: white;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .customer-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #555;
        }

        .customer-info-row i {
          color: ${primaryColor};
          font-size: 15px;
          width: 20px;
          text-align: center;
        }

        .customer-info-row span {
          font-weight: 500;
        }

        .address-card {
          background: white;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
        }

        .address-card i {
          color: ${primaryColor};
          font-size: 18px;
          margin-top: 2px;
        }

        .address-card .address-content {
          flex: 1;
        }

        .address-card .address-type {
          font-size: 11px;
          font-weight: 700;
          color: ${primaryColor};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }

        .address-card .address-text {
          font-size: 13px;
          color: #555;
          line-height: 1.4;
        }

        .order-items-detail {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .order-item-detail {
          background: white;
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-item-detail-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .item-qty-badge {
          background: ${primaryColor};
          color: white;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .item-detail-name {
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .item-addons-list {
          font-size: 11px;
          color: #999;
          margin-top: 2px;
        }

        .item-detail-price {
          font-size: 14px;
          font-weight: 700;
          color: #333;
        }

        .order-actions-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 12px;
        }

        .order-items {
          margin-bottom: 15px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }

        .order-item-name {
          color: #333;
        }

        .order-item-qty {
          color: #666;
        }

        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .order-total {
          font-size: 18px;
          font-weight: 700;
          color: ${primaryColor};
        }

        .order-action-btn {
          background: ${primaryColor}10;
          border: none;
          color: ${primaryColor};
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .order-action-btn:hover {
          background: ${primaryColor}20;
        }

        .empty-orders {
          text-align: center;
          padding: 60px 20px;
          background: ${cardBg};
          border: 1px solid ${borderCol};
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .empty-orders-icon {
          width: 100px;
          height: 100px;
          background: rgba(180, 138, 29, 0.12);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .empty-orders-icon i {
          font-size: 48px;
          color: ${accentGold};
        }

        .empty-orders h3 {
          font-size: 20px;
          color: ${textColor};
          margin-bottom: 8px;
          font-weight: 700;
        }

        .empty-orders p {
          color: ${textMuted};
          margin-bottom: 24px;
        }

        .browse-btn {
          background: ${accentGold};
          color: #05070c;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .browse-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(180, 138, 29, 0.25);
          background: #fff;
          color: #05070c;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f0f0f0;
          border-top-color: ${primaryColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .cancel-order-btn {
          background: #ef444415;
          border: none;
          color: #ef4444;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-order-btn:hover {
          background: #ef444425;
        }

        .cancel-order-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        .modal-icon {
          width: 60px;
          height: 60px;
          background: #ef444415;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .modal-icon i {
          font-size: 28px;
          color: #ef4444;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .modal-message {
          font-size: 14px;
          color: #666;
          margin-bottom: 24px;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .modal-btn-cancel {
          background: #f0f0f0;
          color: #666;
        }

        .modal-btn-cancel:hover {
          background: #e0e0e0;
        }

        .modal-btn-confirm {
          background: #ef4444;
          color: white;
        }

        .modal-btn-confirm:hover {
          background: #dc2626;
        }

        .modal-btn-confirm:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Order Tracking Styles */
        .order-tracking {
          padding: 20px 0;
          margin: 15px 0;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
        }

        .tracking-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
        }

        .tracking-steps::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 25px;
          right: 25px;
          height: 3px;
          background: #e0e0e0;
          z-index: 1;
        }

        .tracking-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          flex: 1;
        }

        .step-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }

        .step-icon i {
          font-size: 16px;
          color: #999;
        }

        .step-label {
          font-size: 11px;
          color: #999;
          text-align: center;
          max-width: 70px;
        }

        .tracking-step.completed .step-icon {
          background: ${primaryColor};
        }

        .tracking-step.completed .step-icon i {
          color: white;
        }

        .tracking-step.completed .step-label {
          color: ${primaryColor};
          font-weight: 600;
        }

        .tracking-step.active .step-icon {
          background: ${primaryColor};
          box-shadow: 0 0 0 4px ${primaryColor}30;
          animation: pulse 2s infinite;
        }

        .tracking-step.active .step-icon i {
          color: white;
        }

        .tracking-step.active .step-label {
          color: ${primaryColor};
          font-weight: 600;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px ${primaryColor}30;
          }
          50% {
            box-shadow: 0 0 0 8px ${primaryColor}20;
          }
        }

        .tracking-progress-line {
          position: absolute;
          top: 20px;
          left: 25px;
          height: 3px;
          background: ${primaryColor};
          z-index: 1;
          transition: width 0.5s ease;
        }

        /* Cancelled/Rejected Order Tracking */
        .order-tracking.cancelled .step-icon {
          background: #f0f0f0;
        }

        .order-tracking.cancelled .step-icon i {
          color: #ccc;
        }

        .order-tracking.cancelled .step-label {
          color: #ccc;
        }

        .cancelled-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: #ef444415;
          border-radius: 10px;
          margin: 15px 0;
        }

        .cancelled-badge i {
          font-size: 20px;
          color: #ef4444;
        }

        .cancelled-badge span {
          color: #ef4444;
          font-weight: 600;
          font-size: 14px;
        }

        @media (max-width: 600px) {
          .orders-page {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .orders-header {
            padding: 15px 12px;
            width: 100%;
            margin: 0;
          }
          .orders-content {
            max-width: 100% !important;
            width: 100% !important;
            padding: 12px !important;
            margin: 0 !important;
          }
          .tracking-steps::before {
            left: 15px;
            right: 15px;
          }
          .tracking-progress-line {
            left: 15px;
          }
          .step-icon {
            width: 32px;
            height: 32px;
          }
          .step-icon i {
            font-size: 14px;
          }
          .step-label {
            font-size: 9px;
            max-width: 55px;
          }
          .tracking-steps::before {
            top: 16px;
          }
          .tracking-progress-line {
            top: 16px;
          }
        }

        @media (max-width: 480px) {
          .orders-page {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .orders-header {
            padding: 15px 12px;
            width: 100%;
            margin: 0;
          }
          .orders-content {
            max-width: 100% !important;
            width: 100% !important;
            padding: 12px !important;
            margin: 0 !important;
          }
          .order-card-top {
            padding: 14px 16px;
          }
          .order-header {
            flex-wrap: wrap;
            gap: 8px;
          }
          .order-header-left {
            gap: 6px;
          }
          .order-details-inner {
            padding: 0 16px 16px;
          }
          .step-icon {
            width: 28px;
            height: 28px;
          }
          .step-icon i {
            font-size: 12px;
          }
          .step-label {
            font-size: 8px;
            max-width: 50px;
          }
          .tracking-steps::before {
            top: 14px;
            left: 12px;
            right: 12px;
          }
          .tracking-progress-line {
            top: 14px;
            left: 12px;
          }
          .order-tracking {
            padding: 15px 0;
            margin: 10px 0;
          }
        }

        .load-more-btn {
          background: ${primaryColor};
          color: white;
          border: none;
          padding: 12px 40px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .load-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px ${primaryColor}40;
        }

        .load-more-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .load-more-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
      `}</style>

      <div className="orders-header">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <span className="header-title">My Orders</span>
      </div>

      <div className="orders-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="orders-list">
            {orders.map(order => {
              const isExpanded = expandedOrderId === order.id;
              const totalItems = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

              return (
                <div key={order.id} className="order-card">
                  {/* Collapsed Card Top */}
                  <div className="order-card-top" onClick={() => toggleOrderDetails(order.id)}>
                    <div className="order-header">
                      <div className="order-header-left">
                        <div className="order-id">Order: <span>#{order.orderNumber}</span></div>
                        <div className="header-divider"></div>
                        <div className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span className="order-type-badge">
                          <i className={`bi ${order.orderType === 'DELIVERY' ? 'bi-bicycle' : order.orderType === 'TAKEAWAY' ? 'bi-bag' : 'bi-shop'}`}></i>
                          {order.orderType}
                        </span>
                        <span
                          className="order-status"
                          style={{
                            background: `${getStatusColor(order.status)}15`,
                            color: getStatusColor(order.status)
                          }}
                        >
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    {(((parseInt(order.estimatedTime) || 0) + branchMinutes) > 0 || deliveryTimes[order.id] != null) && order.status?.toUpperCase() !== 'DELIVERED' && !isOrderCancelled(order.status) && (
                      <div className="time-badges-row">
                        {((parseInt(order.estimatedTime) || 0) + branchMinutes) > 0 && (
                          <span className="est-time-badge">
                            <i className="bi bi-clock"></i>
                            <span className="time-badge-label">Estimated Time</span>
                            <span className="time-badge-value">{(parseInt(order.estimatedTime) || 0) + branchMinutes} min</span>
                          </span>
                        )}
                        {deliveryTimes[order.id] != null && (() => {
                          const countdown = getCountdown(order.id);
                          if (!countdown) return null;
                          return (
                            <span className={`delivery-time-badge ${countdown.remaining === 0 ? 'delivery-time-done' : ''}`}>
                              <i className="bi bi-truck"></i>
                              {countdown.remaining > 0
                                ? <>
                                    <span className="time-badge-label">Delivery Time</span>
                                    <span className="time-badge-value">{countdown.text}</span>
                                  </>
                                : 'Arriving Soon!'}
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    {/* Items Preview + Total */}
                    <div className="order-items-preview" style={!order.orderItems?.length ? { justifyContent: 'flex-end' } : {}}>
                      {order.orderItems?.length > 0 && (
                        <div className="items-summary">
                          {order.orderItems.slice(0, 2).map((item, index) => (
                            <div key={index} className="item-line">
                              <span className="item-qty">x{item.quantity}</span>
                              {item.menuItemName}
                            </div>
                          ))}
                          {order.orderItems.length > 2 && (
                            <div className="item-line" style={{ color: '#999', fontSize: '12px' }}>
                              +{order.orderItems.length - 2} more item{order.orderItems.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="order-total-preview">
                        <div className="total-amount">${order.totalAmount}</div>
                        <div className="payment-badge" style={{ color: order.paymentStatus === 'PAID' ? '#22c55e' : '#f59e0b' }}>
                          {order.paymentStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Toggle */}
                  <div
                    className={`expand-indicator ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleOrderDetails(order.id)}
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                    <i className="bi bi-chevron-down"></i>
                  </div>

                  {/* Expandable Details Panel */}
                  <div className={`order-details-panel ${isExpanded ? 'open' : ''}`}>
                    <div className="order-details-inner">

                      {/* Order Tracking */}
                      {isOrderCancelled(order.status) ? (
                        <div className="cancelled-badge">
                          <i className="bi bi-x-circle-fill"></i>
                          <span>Order {order.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}</span>
                        </div>
                      ) : (
                        <div className="order-tracking">
                          <div className="tracking-steps">
                            <div
                              className="tracking-progress-line"
                              style={{
                                width: `calc(${(getStepIndex(order.status, order.orderType) / (getOrderSteps(order.orderType).length - 1)) * 100}% - 25px)`
                              }}
                            ></div>
                            {getOrderSteps(order.orderType).map((step, index) => {
                              const currentIndex = getStepIndex(order.status, order.orderType);
                              const isCompleted = index < currentIndex;
                              const isActive = index === currentIndex;

                              return (
                                <div
                                  key={step.key}
                                  className={`tracking-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                >
                                  <div className="step-icon">
                                    <i className={`bi ${step.icon}`}></i>
                                  </div>
                                  <span className="step-label">{step.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Customer Info */}
                      <div className="detail-section">
                        <div className="detail-section-title">
                          <i className="bi bi-person-circle"></i>
                          Customer Details
                        </div>
                        <div className="customer-info-card">
                          {(order.customerName || order.customerId?.name) && (
                            <div className="customer-info-row">
                              <i className="bi bi-person"></i>
                              <span>{order.customerName || order.customerId?.name}</span>
                            </div>
                          )}
                          {(order.customerPhone || order.customerId?.mobileNumber) && (
                            <div className="customer-info-row">
                              <i className="bi bi-telephone"></i>
                              <span>{order.customerPhone || order.customerId?.mobileNumber}</span>
                            </div>
                          )}
                          {(order.customerEmail || order.customerId?.email) && (
                            <div className="customer-info-row">
                              <i className="bi bi-envelope"></i>
                              <span>{order.customerEmail || order.customerId?.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.customerDeliveryAddressesId && (
                        <div className="detail-section">
                          <div className="detail-section-title">
                            <i className="bi bi-geo-alt"></i>
                            Delivery Address
                          </div>
                          <div className="address-card">
                            <i className="bi bi-pin-map-fill"></i>
                            <div className="address-content">
                              <div className="address-type">{order.customerDeliveryAddressesId.addressType}</div>
                              <div className="address-text">
                                {order.customerDeliveryAddressesId.addressLine1}
                                {order.customerDeliveryAddressesId.addressLine2 && `, ${order.customerDeliveryAddressesId.addressLine2}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Order Items Detail */}
                      <div className="detail-section">
                        <div className="detail-section-title">
                          <i className="bi bi-bag-check"></i>
                          Items Ordered ({totalItems})
                        </div>
                        <div className="order-items-detail">
                          {order.orderItems?.map((item, index) => (
                            <div key={index} className="order-item-detail">
                              <div className="order-item-detail-left">
                                <div className="item-qty-badge">{item.quantity}</div>
                                <div>
                                  <div className="item-detail-name">{item.menuItemName}</div>
                                  {item.addonItems?.length > 0 && (
                                    <div className="item-addons-list">
                                      + {item.addonItems.map(a => a.name).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="item-detail-price">${item.itemTotal}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="detail-section">
                        <div className="detail-section-title">
                          <i className="bi bi-receipt-cutoff"></i>
                          Bill Summary
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Subtotal</span>
                          <span className="detail-value">${parseFloat(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {order.taxAmount > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">GST</span>
                            <span className="detail-value">${parseFloat(order.taxAmount).toFixed(2)}</span>
                          </div>
                        )}
                        {order.serChargeAmount > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Service Charge</span>
                            <span className="detail-value">${parseFloat(order.serChargeAmount).toFixed(2)}</span>
                          </div>
                        )}
                        {order.discountAmount > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Discount</span>
                            <span className="detail-value" style={{ color: '#22c55e' }}>-${parseFloat(order.discountAmount).toFixed(2)}</span>
                          </div>
                        )}
                        {order.couponCode && (
                          <div className="detail-row">
                            <span className="detail-label">Coupon Code</span>
                            <span className="detail-value" style={{ color: '#22c55e', fontWeight: '700' }}>{order.couponCode}</span>
                          </div>
                        )}
                        {order.deliveryFee > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Delivery Fee</span>
                            <span className="detail-value">${parseFloat(order.deliveryFee).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="detail-row total-row">
                          <span className="detail-label">Total Amount</span>
                          <span className="detail-value">${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Cancel Button */}
                      {order.status?.toLowerCase() === 'pending' && (
                        <div className="order-actions-row">
                          <button
                            className="cancel-order-btn"
                            onClick={(e) => { e.stopPropagation(); handleCancelClick(order); }}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {currentPage + 1 < totalPages && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadMoreLoading}
                >
                  {loadMoreLoading ? (
                    <>
                      <span className="load-more-spinner"></span>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-orders">
            <div className="empty-orders-icon">
              <i className="bi bi-bag-x"></i>
            </div>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Start exploring our menu!</p>
            <button className="browse-btn" onClick={() => navigate('/menu')}>
              Browse Menu
            </button>
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3 className="modal-title">Cancel Order?</h3>
            <p className="modal-message">
              Are you sure you want to cancel order #{selectedOrder?.orderNumber}? This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
              >
                No, Keep It
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleCancelOrder}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
