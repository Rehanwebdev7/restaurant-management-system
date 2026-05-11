import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { ApiGet, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import EditOrderModal from './EditOrderModal';
import OrderDetailModal from './OrderDetailModal';
import { useDarkMode } from '../../../../../contexts/DarkModeContext';
import '../../../../../styles/tables.css';

const OrderList = () => {
  const { isDarkMode } = useDarkMode();
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return {
      fromDate: yesterday.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    };
  });
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [filteredBranches, setFilteredBranches] = useState([]);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PREPARING', label: 'Preparing' },
    { value: 'READY', label: 'Ready' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Order type badge colors
  const orderTypeBadges = {
    'DINE_IN': { color: '#818cf8', bg: isDarkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff', label: 'Dine In' },
    'ONLINE': { color: '#34d399', bg: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ecfdf5', label: 'Online' },
    'TAKEAWAY': { color: '#fbbf24', bg: isDarkMode ? 'rgba(245,158,11,0.15)' : '#fffbeb', label: 'Takeaway' },
    'DELIVERY': { color: '#60a5fa', bg: isDarkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff', label: 'Delivery' }
  };

  // Status badge colors
  const statusBadges = {
    'PENDING': { bg: 'warning', label: 'Pending' },
    'CONFIRMED': { bg: 'info', label: 'Confirmed' },
    'PREPARING': { bg: 'primary', label: 'Preparing' },
    'READY': { bg: 'success', label: 'Ready' },
    'OUT_FOR_DELIVERY': { bg: 'info', label: 'Out for Delivery' },
    'DELIVERED': { bg: 'success', label: 'Delivered' },
    'COMPLETED': { bg: 'success', label: 'Completed' },
    'CANCELLED': { bg: 'danger', label: 'Cancelled' }
  };

  // Payment status badge colors
  const paymentStatusBadges = {
    'PENDING': { bg: 'warning', label: 'Pending' },
    'PAID': { bg: 'success', label: 'Paid' },
    'FAILED': { bg: 'danger', label: 'Failed' },
    'REFUNDED': { bg: 'secondary', label: 'Refunded' }
  };

  // Fetch branches and restaurants on mount
  useEffect(() => {
    fetchBranches();
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter, selectedBranch, selectedRestaurant]);

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

  // Filter branches by selected restaurant
  useEffect(() => {
    if (selectedRestaurant) {
      const filtered = branches.filter(b => b.parentId?.id === selectedRestaurant.value);
      setFilteredBranches(filtered);
      setSelectedBranch(null);
    } else {
      setFilteredBranches(branches);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant]);

  // Fetch restaurants for filter dropdown
  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);
    try {
      const response = await ApiGet('/api/admin/users/filter', {
        role: 'restaurant',
        pageSize: 1000,
        pageNumber: 0
      });
      if (response.success) {
        setRestaurants(response.success.data?.data?.records || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  // Fetch branches for filter dropdown
  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const response = await ApiGet('/api/admin/users/filter', {
        role: 'branch',
        pageSize: 100,
        pageNumber: 0
      });
      if (response.success) {
        const branchData = response.success.data?.data?.records || [];
        setBranches(branchData);
        setFilteredBranches(branchData);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      if (selectedRestaurant) {
        params.restaurantId = selectedRestaurant.value;
      }
      if (selectedBranch) {
        params.branchId = selectedBranch.value;
      }
      if (dateRange.fromDate) {
        params.fromDate = dateRange.fromDate;
      }
      if (dateRange.toDate) {
        params.toDate = dateRange.toDate;
      }
      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await ApiGet('/api/admin/orders/filter', params);

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

  // Handle date filter
  const handleDateFilter = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateRange({ fromDate: '', toDate: '' });
    setSelectedRestaurant(null);
    setSelectedBranch(null);
    setCurrentPage(1);
  };

  // Handle view order
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Handle edit order
  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  // Handle delete order
  const handleDeleteClick = (order) => {
    setSelectedOrder(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;

    setDeleteLoading(true);
    try {
      const response = await ApiDelete(`/api/admin/orders/${selectedOrder.id}`);
      if (response.success) {
        toast.success('Order deleted successfully');
        fetchOrders();
        setShowDeleteConfirm(false);
        setSelectedOrder(null);
      } else {
        toast.error(response.fail || 'Failed to delete order');
      }
    } catch (error) {
      toast.error('Error deleting order');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle modal close
  const handleEditModalClose = (refresh = false) => {
    setShowEditModal(false);
    setSelectedOrder(null);
    if (refresh) {
      fetchOrders();
    }
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Order Type': order.orderType,
      'Customer Name': order.customerName,
      'Customer Phone': order.customerPhone,
      'Customer Email': order.customerEmail || '-',
      'Table Number': order.tableNumber || '-',
      'Status': order.status,
      'Payment Status': order.paymentStatus,
      'Payment Method': order.paymentMethod || '-',
      'Subtotal': order.subtotal,
      'Tax': order.taxAmount,
      'Discount': order.discountAmount,
      'Delivery Fee': order.deliveryFee,
      'Total': order.totalAmount,
      'Items': order.orderItems?.length || 0,
      'Created At': order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination
  const renderPagination = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    items.push(
      <Pagination.First
        key="first"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
      />
    );

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
      />
    );

    items.push(
      <Pagination.Last
        key="last"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages || totalPages === 0}
      />
    );

    return items;
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
      borderColor: state.isFocused
        ? 'var(--theme-primary)'
        : isDarkMode
          ? 'rgba(255, 255, 255, 0.12)'
          : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : 'none',
      borderRadius: '8px',
      '&:hover': {
        borderColor: 'var(--theme-primary)'
      }
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? '#1f2437' : '#ffffff',
      color: isDarkMode ? '#e2e8f0' : '#1e293b',
      zIndex: 20
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? '#e2e8f0' : '#1e293b'
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? '#e2e8f0' : '#1e293b'
    }),
    placeholder: (base) => ({
      ...base,
      color: isDarkMode ? '#94a3b8' : '#64748b'
    }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused
        ? (isDarkMode ? 'rgba(102, 126, 234, 0.18)' : '#eef2ff')
        : state.isSelected
          ? 'var(--theme-primary)'
          : (isDarkMode ? '#1f2437' : '#ffffff'),
      color: state.isSelected ? '#ffffff' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
      '&:active': {
        background: state.isSelected ? 'var(--theme-primary)' : 'rgba(102, 126, 234, 0.24)'
      }
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  };

  return (
    <div className="order-list-page">
      <div className="user-table-container">
        {/* Header */}
        <Row className="mb-3 g-2 align-items-center">
          <Col lg={3} md={4} sm={12}>
            <h4 className="mb-0" style={{ color: isDarkMode ? '#f8fafc' : '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
              Orders Management
            </h4>
          </Col>
          <Col lg={9} md={8} sm={12} className="d-flex justify-content-end gap-2 flex-wrap">
            {/* <Button
              size="sm"
              variant="outline-secondary"
              onClick={clearFilters}
              title="Clear Filters"
            >
              <i className="bi bi-x-circle me-1"></i> Clear
            </Button> */}
            {/* <Button
              size="sm"
              variant="success"
              onClick={handleExportExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i> Excel
            </Button> */}
          </Col>
        </Row>

        {/* Restaurant + Branch Filter Row */}
        <Row className="mb-2 g-2">
          <Col md={3} sm={6}>
            <Select
              options={restaurants.map(r => ({ value: r.id, label: r.name }))}
              value={selectedRestaurant}
              onChange={(selected) => {
                setSelectedRestaurant(selected);
                setSelectedBranch(null);
                setCurrentPage(1);
              }}
              isClearable
              isSearchable
              isLoading={restaurantsLoading}
              placeholder="All Restaurants"
              className="react-select-container"
              classNamePrefix="react-select"
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Col>
          <Col md={3} sm={6}>
            <Select
              options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
              value={selectedBranch}
              onChange={(selected) => {
                setSelectedBranch(selected);
                setCurrentPage(1);
              }}
              isClearable
              isLoading={branchesLoading}
              isDisabled={!selectedRestaurant}
              placeholder={selectedRestaurant ? "All Branches" : "Select Restaurant first"}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-3 g-2">
          <Col lg={2} md={3} sm={6}>
            <Form.Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={2} md={3} sm={6}>
            <Form.Control
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              placeholder="From Date"
            />
          </Col>
          <Col lg={2} md={3} sm={6}>
            <Form.Control
              type="date"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              placeholder="To Date"
            />
          </Col>
          <Col lg={1} md={2} sm={6}>
            <Button
              variant="primary"
              onClick={handleDateFilter}
              className="w-100"
              style={{ minHeight: '38px' }}
            >
              <i className="bi bi-funnel me-1"></i> Filter
            </Button>
          </Col>
          <Col lg={3} md={4} sm={6}>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Col>
        </Row>

        {/* Table */}
        <div
          className="table-responsive"
          style={{
            background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#f0f2f5',
            borderRadius: '12px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
          }}
        >
          <Table bordered hover className="modern-table mb-0">
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>
                <th style={{ width: '100px' }}>Actions</th>
                <th>Order #</th>
                <th>Coupon Code</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader rows={rowsPerPage} columns={10} />
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          title="View Details"
                          onClick={() => handleViewOrder(order)}
                          style={{
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid #0dcaf033',
                            borderRadius: '6px',
                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#0dcaf011',
                            color: '#0dcaf0',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          title="Edit"
                          onClick={() => handleEditOrder(order)}
                          style={{
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid #0d6efd33',
                            borderRadius: '6px',
                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#0d6efd11',
                            color: '#0d6efd',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDeleteClick(order)}
                          style={{
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid #dc393333',
                            borderRadius: '6px',
                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#dc393311',
                            color: '#dc3933',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      {order.tableNumber && (
                        <div className="text-muted small">Table: {order.tableNumber}</div>
                      )}
                    </td>
                    <td>
                      {order.couponCode ? (
                        <Badge bg="success">{order.couponCode}</Badge>
                      ) : (
                        <span className="text-muted small">-</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: orderTypeBadges[order.orderType]?.bg || (isDarkMode ? 'rgba(100,116,139,0.15)' : '#f1f5f9'),
                        color: orderTypeBadges[order.orderType]?.color || '#64748b'
                      }}>
                        {orderTypeBadges[order.orderType]?.label || order.orderType}
                      </span>
                    </td>
                    <td>
                      <div>{order.customerName || '-'}</div>
                      <div className="text-muted small">{order.customerPhone || '-'}</div>
                    </td>
                    <td className="text-center">
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Badge bg="secondary">{order.orderItems.length}</Badge>
                            <i
                              className="bi bi-chevron-down"
                              style={{ fontSize: '10px', color: isDarkMode ? '#94a3b8' : '#666' }}
                            ></i>
                          </summary>
                          <div
                            style={{
                              textAlign: 'left',
                              marginTop: '8px',
                              fontSize: '0.85rem',
                              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8f9fa',
                              color: isDarkMode ? '#e2e8f0' : '#1e293b',
                              padding: '8px',
                              borderRadius: '6px',
                              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
                            }}
                          >
                            {order.orderItems.map((item, index) => (
                              <div
                                key={item.id || index}
                                style={{
                                  padding: '4px 0',
                                  borderBottom: index < order.orderItems.length - 1
                                    ? `1px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.10)' : '#ddd'}`
                                    : 'none'
                                }}
                              >
                                <span style={{ fontWeight: '500' }}>{item.menuItemName}</span>
                                <span style={{ color: isDarkMode ? '#94a3b8' : '#666', marginLeft: '5px' }}>x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <Badge bg="secondary">0</Badge>
                      )}
                    </td>
                    <td>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                      <div className="text-muted small">
                        Sub: {formatCurrency(order.subtotal)}
                      </div>
                    </td>
                    <td>
                      <Badge bg={statusBadges[order.status]?.bg || 'secondary'}>
                        {statusBadges[order.status]?.label || order.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={paymentStatusBadges[order.paymentStatus]?.bg || 'secondary'}>
                        {paymentStatusBadges[order.paymentStatus]?.label || order.paymentStatus}
                      </Badge>
                      {order.paymentMethod && (
                        <div className="text-muted small">{order.paymentMethod}</div>
                      )}
                    </td>
                    <td>
                      <div className="small">{formatDate(order.createdAt)}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                    <span className="text-muted">No orders found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        <Row
          className="align-items-center mt-4 pt-3"
          style={{ borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f0f0f0' }}
        >
          <Col lg={4} md={4} sm={12} className="mb-2 mb-md-0">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted">Show</span>
              <Form.Select
                size="sm"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: '80px' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
              <span className="text-muted">entries</span>
            </div>
          </Col>
          <Col lg={4} md={4} sm={12} className="text-center mb-2 mb-md-0">
            <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
              Showing <strong style={{ color: 'var(--theme-primary)' }}>{totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong> to{' '}
              <strong style={{ color: 'var(--theme-primary)' }}>{Math.min(currentPage * rowsPerPage, totalRecords)}</strong> of{' '}
              <strong style={{ color: 'var(--theme-primary)' }}>{totalRecords}</strong> entries
            </span>
          </Col>
          <Col lg={4} md={4} sm={12} className="d-flex justify-content-end">
            <Pagination className="mb-0">{renderPagination()}</Pagination>
          </Col>
        </Row>

        {/* Edit Modal */}
        <EditOrderModal
          show={showEditModal}
          onClose={handleEditModalClose}
          order={selectedOrder}
        />

        {/* Detail Modal with Print */}
        <OrderDetailModal
          show={showDetailModal}
          onClose={handleDetailModalClose}
          order={selectedOrder}
        />

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete order <strong>{selectedOrder?.orderNumber}</strong>?
            <br />
            <span className="text-danger small">This action cannot be undone.</span>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default OrderList;
