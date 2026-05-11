import React, { useState, useEffect, useCallback } from 'react';
import { Form, InputGroup, Button, Row, Col, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Select from 'react-select';
import { ApiGet, ApiPut } from '../../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import { server_api } from '../../../../../utils/constants';
import { useDarkMode } from '../../../../../contexts/DarkModeContext';
import EditOrderModal from './EditOrderModal';
import OrderDetailModal from './OrderDetailModal';
import CollectPaymentModal from '../../../../../components/modals/CollectPaymentModal';
import '../../../../../styles/tables.css';

const OrderList = () => {
  const { isDarkMode } = useDarkMode();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const pad = (n) => String(n).padStart(2, '0');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return {
      fromDate: fmt(yesterday),
      toDate: fmt(today)
    };
  });
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [collectOrder, setCollectOrder] = useState(null); // order pending collection confirmation

  // Status configuration
  const statusConfig = {
    'PENDING': { label: 'Pending', color: '#f59e0b', bg: '#fef3c7', icon: 'bi-clock' },
    'CONFIRMED': { label: 'Confirmed', color: '#3b82f6', bg: '#dbeafe', icon: 'bi-check-circle' },
    'PREPARING': { label: 'Preparing', color: '#8b5cf6', bg: '#ede9fe', icon: 'bi-fire' },
    'READY': { label: 'Ready', color: '#10b981', bg: '#d1fae5', icon: 'bi-bag-check' },
    'SERVED': { label: 'Served at Table', color: '#0d9488', bg: '#ccfbf1', icon: 'bi-cup-hot' },
    'OUT_FOR_DELIVERY': { label: 'Out for Delivery', color: '#06b6d4', bg: '#cffafe', icon: 'bi-truck' },
    'DELIVERED': { label: 'Delivered', color: '#059669', bg: '#a7f3d0', icon: 'bi-house-check' },
    'CANCELLED': { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', icon: 'bi-x-circle' }
  };

  const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  const orderTypeConfig = {
    'DINE_IN': { label: 'Dine In', color: '#818cf8', bg: isDarkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff', icon: 'bi-shop' },
    'ONLINE': { label: 'Online', color: '#34d399', bg: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ecfdf5', icon: 'bi-globe' },
    'TAKEAWAY': { label: 'Takeaway', color: '#fbbf24', bg: isDarkMode ? 'rgba(245,158,11,0.15)' : '#fffbeb', icon: 'bi-bag' },
    'DELIVERY': { label: 'Delivery', color: '#60a5fa', bg: isDarkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff', icon: 'bi-bicycle' }
  };

  const paymentConfig = {
    'PENDING': { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
    'PAID': { label: 'Paid', color: '#059669', bg: '#d1fae5' },
    'SUCCESS': { label: 'Paid', color: '#059669', bg: '#d1fae5' },
    'COMPLETED': { label: 'Paid', color: '#059669', bg: '#d1fae5' },
    'FAILED': { label: 'Failed', color: '#ef4444', bg: '#fee2e2' },
    'REFUNDED': { label: 'Refunded', color: '#6b7280', bg: '#f3f4f6' }
  };

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter, selectedBranch]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchOrders();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const response = await ApiGet('/api/restaurant/users/filter', {
        role: 'branch',
        pageSize: 100,
        pageNumber: 0
      });
      if (response.success) {
        const branchData = response.success.data?.data?.records || [];
        setBranches(branchData.map(b => ({ value: b.id, label: b.name })));
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };
      if (selectedBranch) params.branchId = selectedBranch.value;
      if (dateRange.fromDate) params.fromDate = dateRange.fromDate;
      if (dateRange.toDate) params.toDate = dateRange.toDate;
      if (searchQuery.trim()) params.searchValue = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await ApiGet('/api/restaurant/orders/filter', params);
      if (response.success) {
        const data = response.success.data?.data;
        setOrders(data?.records || []);
        setTotalRecords(data?.totalRecords || 0);
        setTotalPages(data?.totalPages || 0);
      } else {
        toast.error(response.fail || 'Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      toast.error('Error fetching orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  // Status change handler
  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === order.status) return;

    setStatusUpdating(order.id);
    try {
      const payload = {
        id: order.id,
        status: newStatus
      };
      const response = await ApiPut('/api/restaurant/orders/update', payload);
      if (response.success) {
        toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`);
        setOrders(prev => prev.map(o =>
          o.id === order.id ? { ...o, status: newStatus } : o
        ));
      } else {
        toast.error(response.fail || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating order status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handlePaymentCollected = (updatedOrder) => {
    setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)));
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleEditModalClose = (refresh = false) => {
    setShowEditModal(false);
    setSelectedOrder(null);
    if (refresh) fetchOrders();
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const handleExportExcel = async () => {
    if (!dateRange.fromDate || !dateRange.toDate) {
      toast.warning('Please select both From Date and To Date to export');
      return;
    }
    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${server_api()}/api/restaurant/orders/xl_export?fromDate=${dateRange.fromDate}&toDate=${dateRange.toDate}`,
        { method: 'GET', headers: { 'access_token': token } }
      );
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Orders_${dateRange.fromDate}_to_${dateRange.toDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported successfully');
    } catch (error) {
      toast.error('Failed to export Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Get next valid statuses for an order
  const getAvailableStatuses = (currentStatus) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    const available = [];
    // Can go forward by 1 step, or cancel from any non-completed state
    statusFlow.forEach((status, index) => {
      available.push(status);
    });
    if (currentStatus !== 'CANCELLED') {
      available.push('CANCELLED');
    }
    return available;
  };

  // Pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          style={paginationBtnStyle(currentPage === 1)}
        >
          <i className="bi bi-chevron-double-left"></i>
        </button>
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={paginationBtnStyle(currentPage === 1)}
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{
              ...paginationBtnStyle(false),
              ...(page === currentPage ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderColor: '#667eea',
                fontWeight: 600
              } : {})
            }}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={paginationBtnStyle(currentPage === totalPages)}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          style={paginationBtnStyle(currentPage === totalPages)}
        >
          <i className="bi bi-chevron-double-right"></i>
        </button>
      </div>
    );
  };

  const paginationBtnStyle = (disabled) => ({
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: disabled ? '#f8fafc' : '#fff',
    color: disabled ? '#cbd5e1' : '#475569',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.15s ease'
  });

  // Status select styles for react-select
  const statusSelectStyles = (currentStatus) => ({
    control: (base, state) => ({
      ...base,
      minHeight: '32px',
      height: '32px',
      fontSize: '0.78rem',
      fontWeight: 600,
      borderRadius: '8px',
      border: `1.5px solid ${statusConfig[currentStatus]?.color || '#cbd5e1'}`,
      background: statusConfig[currentStatus]?.bg || '#f8fafc',
      boxShadow: state.isFocused ? `0 0 0 2px ${statusConfig[currentStatus]?.color}33` : 'none',
      cursor: 'pointer',
      '&:hover': { borderColor: statusConfig[currentStatus]?.color }
    }),
    singleValue: (base) => ({
      ...base,
      color: statusConfig[currentStatus]?.color || '#475569',
      fontWeight: 600,
      fontSize: '0.78rem'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '2px 6px',
      color: statusConfig[currentStatus]?.color || '#94a3b8'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: (base) => ({
      ...base,
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      border: '1px solid #e2e8f0',
      zIndex: 50
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.8rem',
      fontWeight: 500,
      padding: '8px 12px',
      cursor: 'pointer',
      background: state.isSelected
        ? statusConfig[state.data.value]?.bg || '#f1f5f9'
        : state.isFocused ? '#f8fafc' : '#fff',
      color: state.isSelected
        ? statusConfig[state.data.value]?.color || '#1e293b'
        : '#475569',
      '&:active': { background: '#f1f5f9' }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px'
    })
  });

  const actionBtnStyle = (color) => ({
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1.5px solid ${color}33`,
    borderRadius: '9px',
    background: isDarkMode ? 'rgba(255,255,255,0.06)' : `${color}11`,
    color: color,
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.15s ease'
  });

  return (
    <div style={{ padding: '0' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h4 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em'
          }}>
            <i className="bi bi-receipt-cutoff me-2" style={{ color: '#667eea' }}></i>
            Orders Management
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Track, manage and update order statuses
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleExportExcel}
          disabled={exportLoading}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {exportLoading ? (
            <><Spinner size="sm" animation="border" style={{ width: '14px', height: '14px' }} /> Exporting...</>
          ) : (
            <><i className="bi bi-file-earmark-excel"></i> Export Excel</>
          )}
        </Button>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '16px',
        border: '1px solid #edf2f7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ minWidth: '170px', flex: '1 1 170px', maxWidth: '220px' }}>
            <Select
              options={branches}
              value={selectedBranch}
              onChange={setSelectedBranch}
              isClearable
              isLoading={branchesLoading}
              placeholder="All Branches"
              styles={{
                control: (base) => ({ ...base, minHeight: '38px', borderRadius: '10px', fontSize: '0.85rem', borderColor: '#e2e8f0' }),
                placeholder: (base) => ({ ...base, fontSize: '0.82rem', color: '#94a3b8' })
              }}
            />
          </div>
          <div style={{ minWidth: '150px', flex: '0 1 160px' }}>
            <Form.Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ borderRadius: '10px', fontSize: '0.85rem', height: '38px', borderColor: '#e2e8f0' }}
            >
              <option value="">All Status</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </Form.Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto' }}>
            <Form.Control
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              style={{ borderRadius: '10px', fontSize: '0.85rem', height: '38px', borderColor: '#e2e8f0', maxWidth: '160px' }}
            />
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>to</span>
            <Form.Control
              type="date"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              style={{ borderRadius: '10px', fontSize: '0.85rem', height: '38px', borderColor: '#e2e8f0', maxWidth: '160px' }}
            />
            <Button
              onClick={handleDateFilter}
              style={{
                borderRadius: '10px',
                height: '38px',
                padding: '0 16px',
                fontWeight: 600,
                fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="bi bi-funnel me-1"></i> Filter
            </Button>
          </div>
          <div style={{ flex: '1 1 200px', maxWidth: '280px' }}>
            <InputGroup>
              <InputGroup.Text style={{ borderRadius: '10px 0 0 10px', background: '#f8fafc', borderColor: '#e2e8f0' }}>
                <i className="bi bi-search" style={{ fontSize: '0.85rem', color: '#94a3b8' }}></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search order #, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: '0 10px 10px 0', fontSize: '0.85rem', height: '38px', borderColor: '#e2e8f0' }}
              />
            </InputGroup>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        border: '1px solid #edf2f7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div className="table-responsive" style={{ borderRadius: '14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                color: '#f1f5f9'
              }}>
                <th style={{ ...thStyle, textAlign: 'center', minWidth: '170px' }}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Payment</th>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Type</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Items</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                <th style={thStyle}>Date</th>
                <th style={{ ...thStyle, textAlign: 'center', width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader rows={rowsPerPage} columns={9} />
              ) : orders.length > 0 ? (
                orders.map((order, idx) => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'all 0.15s ease',
                      animation: `fadeIn 0.2s ease ${idx * 0.03}s both`,
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fafbff';
                      e.currentTarget.style.borderLeft = '3px solid #667eea';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc';
                      e.currentTarget.style.borderLeft = '3px solid transparent';
                    }}
                  >
                    {/* Status - Inline Change */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {statusUpdating === order.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Spinner size="sm" animation="border" style={{ width: '16px', height: '16px', color: '#667eea' }} />
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Updating...</span>
                        </div>
                      ) : (
                        <Select
                          value={{ value: order.status, label: statusConfig[order.status]?.label || order.status }}
                          options={getAvailableStatuses(order.status).map(s => ({
                            value: s,
                            label: statusConfig[s]?.label || s
                          }))}
                          onChange={(selected) => handleStatusChange(order, selected.value)}
                          styles={statusSelectStyles(order.status)}
                          isSearchable={false}
                          menuPortalTarget={document.body}
                          menuPlacement="auto"
                          formatOptionLabel={(option) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className={statusConfig[option.value]?.icon || 'bi-circle'}
                                style={{ color: statusConfig[option.value]?.color, fontSize: '0.75rem' }}></i>
                              <span>{option.label}</span>
                              {option.value === order.status && (
                                <i className="bi bi-check2" style={{ marginLeft: 'auto', color: statusConfig[option.value]?.color }}></i>
                              )}
                            </div>
                          )}
                        />
                      )}
                    </td>

                    {/* Payment */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: paymentConfig[order.paymentStatus]?.bg || '#f1f5f9',
                        color: paymentConfig[order.paymentStatus]?.color || '#64748b'
                      }}>
                        {paymentConfig[order.paymentStatus]?.label || order.paymentStatus}
                      </span>
                      {order.paymentMethod && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                          {order.paymentMethod}
                        </div>
                      )}
                      {order.paymentStatus === 'PENDING' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setCollectOrder(order); }}
                          style={{
                            marginTop: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            border: '1px solid #059669',
                            background: '#ecfdf5',
                            color: '#059669',
                            cursor: 'pointer',
                          }}
                        >
                          💰 Collect
                        </button>
                      )}
                    </td>

                    {/* Order # */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>
                        {order.orderNumber}
                      </div>
                      {order.tableNumber && order.orderType !== 'TAKEAWAY' && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          <i className="bi bi-grid-3x3 me-1"></i>Table {order.tableNumber}
                        </div>
                      )}
                      {order.orderType === 'TAKEAWAY' && (
                        <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <i className="bi bi-geo-alt me-1"></i>
                          {order.tableNumber ? (
                            <span>Counter {order.tableNumber}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="Set counter"
                              style={{ width: '80px', fontSize: '0.7rem', padding: '1px 4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  try {
                                    const response = await ApiPut('/api/restaurant/orders/update', { id: order.id, tableNumber: e.target.value.trim() });
                                    if (response.success) {
                                      toast.success('Pickup counter assigned');
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, tableNumber: e.target.value.trim() } : o));
                                    }
                                  } catch { toast.error('Failed to assign counter'); }
                                }
                              }}
                            />
                          )}
                        </div>
                      )}
                      {order.couponCode && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '3px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#ecfdf5',
                          color: '#059669'
                        }}>
                          <i className="bi bi-tag me-1"></i>{order.couponCode}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>
                        {order.customerName || '-'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        <i className="bi bi-telephone me-1"></i>{order.customerPhone || '-'}
                      </div>
                    </td>

                    {/* Type */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: orderTypeConfig[order.orderType]?.bg || (isDarkMode ? 'rgba(100,116,139,0.15)' : '#f1f5f9'),
                        color: orderTypeConfig[order.orderType]?.color || '#64748b'
                      }}>
                        <i className={orderTypeConfig[order.orderType]?.icon || 'bi bi-box'}></i>
                        {orderTypeConfig[order.orderType]?.label || order.orderType}
                      </span>
                    </td>

                    {/* Items */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <OverlayTrigger
                          placement="left"
                          overlay={
                            <Tooltip id={`items-tip-${order.id}`}>
                              <div style={{ textAlign: 'left', maxWidth: '250px' }}>
                                {order.orderItems.map((item, i) => (
                                  <div key={i} style={{ padding: '3px 0', borderBottom: i < order.orderItems.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                                    <span style={{ fontWeight: 500 }}>{item.menuItemName}</span>
                                    <span style={{ opacity: 0.7, marginLeft: '6px' }}>x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </Tooltip>
                          }
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'help'
                          }}>
                            {order.orderItems.length}
                          </span>
                        </OverlayTrigger>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>0</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Sub: {formatCurrency(order.subtotal)}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                        {formatDate(order.createdAt)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {formatTime(order.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                          <button
                            onClick={() => handleViewOrder(order)}
                            style={actionBtnStyle('#3b82f6')}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip>Edit Order</Tooltip>}>
                          <button
                            onClick={() => handleEditOrder(order)}
                            style={actionBtnStyle('#8b5cf6')}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </OverlayTrigger>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ color: '#cbd5e1' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}></i>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>No orders found</div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px' }}>
                        Try adjusting your filters or date range
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer - Pagination */}
        {totalRecords > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
              <span>Show</span>
              <Form.Select
                size="sm"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ width: '70px', borderRadius: '8px', fontSize: '0.82rem', borderColor: '#e2e8f0' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
              <span>
                of <strong style={{ color: '#667eea' }}>{totalRecords}</strong> orders
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing <strong style={{ color: '#334155' }}>{totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong>
              {' '}-{' '}
              <strong style={{ color: '#334155' }}>{Math.min(currentPage * rowsPerPage, totalRecords)}</strong>
            </div>

            {renderPagination()}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditOrderModal show={showEditModal} onClose={handleEditModalClose} order={selectedOrder} />
      <OrderDetailModal show={showDetailModal} onClose={handleDetailModalClose} order={selectedOrder} />

      {/* Payment Collection Modal */}
      <CollectPaymentModal
        show={!!collectOrder}
        order={collectOrder}
        onClose={() => setCollectOrder(null)}
        onCollected={handlePaymentCollected}
      />
    </div>
  );
};

// Shared styles
const thStyle = {
  padding: '12px 16px',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
  borderBottom: 'none'
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.85rem',
  verticalAlign: 'middle'
};

export default OrderList;
