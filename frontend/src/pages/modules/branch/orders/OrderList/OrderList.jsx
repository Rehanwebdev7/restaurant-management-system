import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import { ApiGet, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { server_api } from '../../../../../utils/constants';
import EditOrderModal from './EditOrderModal';
import OrderDetailModal from './OrderDetailModal';
import '../../../../../styles/tables.css';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';

const OrderList = () => {
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
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Status options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'CREATED', label: 'Created' },
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
    'DINE_IN': { bg: 'primary', label: 'Dine In' },
    'ONLINE': { bg: 'success', label: 'Online' },
    'TAKEAWAY': { bg: 'warning', label: 'Takeaway' },
    'DELIVERY': { bg: 'info', label: 'Delivery' }
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

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

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

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

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

      const response = await ApiGet('/api/branch/orders/filter', params);

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

  // Clear all filters and refresh data
  const clearFilters = async () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateRange({ fromDate: '', toDate: '' });
    setCurrentPage(1);

    // Fetch orders without any filters
    setLoading(true);
    try {
      const params = {
        pageNumber: 0,
        pageSize: rowsPerPage
      };
      const response = await ApiGet('/api/branch/orders/filter', params);
      if (response.success) {
        const data = response.success.data?.data;
        setOrders(data?.records || []);
        setTotalRecords(data?.totalRecords || 0);
        setTotalPages(data?.totalPages || 0);
      }
    } catch (error) {
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
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
      const response = await ApiDelete(`/api/branch/orders/${selectedOrder.id}`);
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

  // Export to Excel via API
  const handleExportExcel = async () => {
    // Check if dates are set
    if (!dateRange.fromDate || !dateRange.toDate) {
      toast.warning('Please select both From Date and To Date to export Excel');
      return;
    }

    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${server_api()}/api/branch/orders/xl_export?fromDate=${dateRange.fromDate}&toDate=${dateRange.toDate}`,
        {
          method: 'GET',
          headers: {
            'access_token': token
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export Excel');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
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
      console.error('Export error:', error);
      toast.error('Failed to export Excel');
    } finally {
      setExportLoading(false);
    }
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

  return (
    <div className="order-list-page">
      <div className="user-table-container">
        {/* Header */}
        <Row className="mb-3 g-2 align-items-center">
          <Col xs={12}>
            <h4 className="mb-0" style={{ color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
              Orders Management
            </h4>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-3 g-2 align-items-center">
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
          <Col lg={3} md={5} sm={12} className="d-flex gap-1 align-items-center">
            <Button
              size="sm"
              variant="primary"
              onClick={handleDateFilter}
              title="Apply Filter"
              style={{ padding: '4px 10px' }}
            >
              <i className="bi bi-funnel me-1"></i>Filter
            </Button>
            {/* <Button
              size="sm"
              variant="outline-secondary"
              onClick={clearFilters}
              title="Clear Filters"
              style={{ padding: '4px 10px' }}
            >
              <i className="bi bi-x-circle me-1"></i>Clear
            </Button> */}
            <Button
              size="sm"
              variant="success"
              onClick={handleExportExcel}
              disabled={exportLoading}
              title={!dateRange.fromDate || !dateRange.toDate ? 'Select date range to export' : 'Export to Excel'}
              style={{ padding: '4px 10px' }}
            >
              {exportLoading ? (
                <>
                  <Spinner size="sm" animation="border" style={{ width: '1rem', height: '1rem' }} className="me-1" />
                  Exporting...
                </>
              ) : (
                <>
                  <i className="bi bi-file-earmark-excel me-1"></i>Excel
                </>
              )}
            </Button>
          </Col>
        </Row>

        {/* Table */}
        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px' }}>
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
                        <Button
                          size="sm"
                          variant="outline-info"
                          title="View Details"
                          onClick={() => handleViewOrder(order)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          title="Edit"
                          onClick={() => handleEditOrder(order)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          title="Delete"
                          onClick={() => handleDeleteClick(order)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
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
                      <Badge bg={orderTypeBadges[order.orderType]?.bg || 'secondary'}>
                        {orderTypeBadges[order.orderType]?.label || order.orderType}
                      </Badge>
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
                            <i className="bi bi-chevron-down" style={{ fontSize: '10px', color: '#666' }}></i>
                          </summary>
                          <div style={{ textAlign: 'left', marginTop: '8px', fontSize: '0.85rem', background: '#f8f9fa', padding: '8px', borderRadius: '6px' }}>
                            {order.orderItems.map((item, index) => (
                              <div key={item.id || index} style={{ padding: '4px 0', borderBottom: index < order.orderItems.length - 1 ? '1px dashed #ddd' : 'none' }}>
                                <span style={{ fontWeight: '500' }}>{item.menuItemName}</span>
                                <span style={{ color: '#666', marginLeft: '5px' }}>x{item.quantity}</span>
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
        <Row className="align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
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
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Form.Select>
              <span className="text-muted">entries</span>
            </div>
          </Col>
          <Col lg={4} md={4} sm={12} className="text-center mb-2 mb-md-0">
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Showing <strong style={{ color: '#667eea' }}>{totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong> to{' '}
              <strong style={{ color: '#667eea' }}>{Math.min(currentPage * rowsPerPage, totalRecords)}</strong> of{' '}
              <strong style={{ color: '#667eea' }}>{totalRecords}</strong> entries
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
