import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { ApiGet, ApiPut, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { EditOrderModal, OrderDetailModal } from '../OrderList';
import '../../../../../styles/tables.css';

const Preparing = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { fromDate: yesterday.toISOString().split('T')[0], toDate: today.toISOString().split('T')[0] };
  });
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [filteredBranches, setFilteredBranches] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState('');

  const orderTypeBadges = {
    'DINE_IN': { bg: 'primary', label: 'Dine In' },
    'ONLINE': { bg: 'success', label: 'Online' },
    'TAKEAWAY': { bg: 'warning', label: 'Takeaway' },
    'DELIVERY': { bg: 'info', label: 'Delivery' }
  };

  const paymentStatusBadges = {
    'PENDING': { bg: 'warning', label: 'Pending' },
    'PAID': { bg: 'success', label: 'Paid' },
    'FAILED': { bg: 'danger', label: 'Failed' },
    'REFUNDED': { bg: 'secondary', label: 'Refunded' }
  };

  useEffect(() => {
    fetchBranches();
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, selectedBranch, selectedRestaurant]);

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

  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);
    try {
      const response = await ApiGet('/api/admin/users/filter', { role: 'restaurant', pageSize: 1000, pageNumber: 0 });
      if (response.success) {
        setRestaurants(response.success.data?.data?.records || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setRestaurantsLoading(false);
    }
  };

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage,
        status: 'PREPARING'
      };

      if (selectedRestaurant) params.restaurantId = selectedRestaurant.value;
      if (selectedBranch) params.branchId = selectedBranch.value;
      if (dateRange.fromDate) params.fromDate = dateRange.fromDate;
      if (dateRange.toDate) params.toDate = dateRange.toDate;
      if (searchQuery.trim()) params.searchValue = searchQuery.trim();

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

  const handleDateFilter = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ fromDate: '', toDate: '' });
    setSelectedBranch(null);
    setCurrentPage(1);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

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

  const handleStatusChange = (order, status) => {
    setSelectedOrder(order);
    setNextStatus(status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedOrder || !nextStatus) return;
    setStatusUpdateLoading(true);
    try {
      const response = await ApiPut('/api/admin/orders/orderUpdate', {
        id: selectedOrder.id,
        status: nextStatus
      });

      if (response.success) {
        toast.success(`Order moved to ${nextStatus.replace('_', ' ')}`);
        fetchOrders();
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNextStatus('');
      } else {
        toast.error(response.fail || 'Failed to update order status');
      }
    } catch (error) {
      toast.error('Error updating order status');
    } finally {
      setStatusUpdateLoading(false);
    }
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

  const handleExportExcel = () => {
    const exportData = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Order Type': order.orderType,
      'Customer Name': order.customerName,
      'Customer Phone': order.customerPhone,
      'Table Number': order.tableNumber || '-',
      'Payment Status': order.paymentStatus,
      'Total': order.totalAmount,
      'Items': order.orderItems?.length || 0,
      'Created At': order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Preparing Orders');
    XLSX.writeFile(workbook, `PREPARING_ORDERs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderPagination = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    items.push(
      <Pagination.Prev key="prev" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
    );

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
          {page}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next key="next" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} />
    );

    return items;
  };

  return (
    <div className="preparing-orders-page">
      <div className="user-table-container">
        <Row className="mb-3 g-2 align-items-center">
          <Col lg={3} md={4} sm={12}>
            <h4 className="mb-0" style={{ color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
              <Badge bg="primary" className="me-2">{totalRecords}</Badge>
              Preparing Orders
            </h4>
          </Col>
          <Col lg={9} md={8} sm={12} className="d-flex justify-content-end gap-2 flex-wrap">
            {/* <Button size="sm" variant="outline-secondary" onClick={clearFilters}>
              <i className="bi bi-x-circle me-1"></i> Clear
            </Button> */}
            {/* <Button size="sm" variant="success" onClick={handleExportExcel}>
              <i className="bi bi-file-earmark-excel me-1"></i> Excel
            </Button> */}
          </Col>
        </Row>

        <Row className="mb-2 g-2">
          <Col md={3} sm={6}>
            <Select
              options={restaurants.map(r => ({ value: r.id, label: r.name }))}
              value={selectedRestaurant}
              onChange={(selected) => { setSelectedRestaurant(selected); setSelectedBranch(null); setCurrentPage(1); }}
              isClearable isSearchable isLoading={restaurantsLoading}
              placeholder="All Restaurants"
              menuPortalTarget={document.body} menuPosition="fixed"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </Col>
          <Col md={3} sm={6}>
            <Select
              options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
              value={selectedBranch}
              onChange={(selected) => { setSelectedBranch(selected); setCurrentPage(1); }}
              isClearable isLoading={branchesLoading}
              isDisabled={!selectedRestaurant}
              placeholder={selectedRestaurant ? "All Branches" : "Select Restaurant first"}
              menuPortalTarget={document.body} menuPosition="fixed"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </Col>
        </Row>

        <Row className="mb-3 g-2">
          <Col lg={2} md={3} sm={6}>
            <Form.Control
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
            />
          </Col>
          <Col lg={2} md={3} sm={6}>
            <Form.Control
              type="date"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
            />
          </Col>
          <Col lg={1} md={2} sm={6}>
            <Button variant="primary" onClick={handleDateFilter} className="w-100">
              Search
            </Button>
          </Col>
          <Col lg={4} md={6} sm={12}>
            <InputGroup>
              <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              <Form.Control type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </InputGroup>
          </Col>
        </Row>

        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px' }}>
          <Table bordered hover className="modern-table mb-0">
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>
                <th style={{ width: '160px' }}>Actions</th>
                <th>Order #</th>
                <th>Coupon Code</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
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
                      <div className="d-flex gap-1 justify-content-center" style={{ whiteSpace: 'nowrap' }}>
                        {/* <Button size="sm" variant="outline-success" title="Mark Ready" onClick={() => handleStatusChange(order, 'READY')}>
                          <i className="bi bi-check-circle"></i>
                        </Button> */}
                        <Button size="sm" variant="outline-info" title="View" onClick={() => handleViewOrder(order)}>
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button size="sm" variant="outline-primary" title="Edit" onClick={() => handleEditOrder(order)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button size="sm" variant="outline-danger" title="Delete" onClick={() => handleDeleteClick(order)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      {order.tableNumber && <div className="text-muted small">Table: {order.tableNumber}</div>}
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
                    <td><strong>{formatCurrency(order.totalAmount)}</strong></td>
                    <td>
                      <Badge bg={paymentStatusBadges[order.paymentStatus]?.bg || 'secondary'}>
                        {paymentStatusBadges[order.paymentStatus]?.label || order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="small">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="text-center py-4">
                  <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                  <span className="text-muted">No orders in preparation</span>
                </td></tr>
              )}
            </tbody>
          </Table>
        </div>

        <Row className="align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
          <Col lg={3} md={4} sm={12} className="mb-2 mb-md-0">
            <Form.Select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: 'auto' }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </Form.Select>
          </Col>
          <Col lg={5} md={4} sm={12} className="mb-2 mb-md-0 text-center">
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

        <EditOrderModal show={showEditModal} onClose={handleEditModalClose} order={selectedOrder} />
        <OrderDetailModal show={showDetailModal} onClose={handleDetailModalClose} order={selectedOrder} />

        <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
          <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
          <Modal.Body>
            Are you sure you want to delete order <strong>{selectedOrder?.orderNumber}</strong>?
            <br /><span className="text-danger small">This action cannot be undone.</span>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Update Order Status</Modal.Title></Modal.Header>
          <Modal.Body>
            Mark order <strong>{selectedOrder?.orderNumber}</strong> as <Badge bg="success">Ready</Badge>?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button variant="success" onClick={confirmStatusUpdate} disabled={statusUpdateLoading}>
              {statusUpdateLoading ? <Spinner size="sm" /> : 'Mark Ready'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default Preparing;
