import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Form, Table, Modal } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import CollectPaymentModal from '../../../../components/modals/CollectPaymentModal';
import { toast } from 'react-toastify';
import { server_api } from '../../../../utils/constants';
import '../../../../styles/tables.css';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../contexts/DarkModeContext';

const Orders = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
    totalRecords: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    searchValue: ''
  });

  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [collectOrder, setCollectOrder] = useState(null);

  const handlePaymentCollected = (updatedOrder) => {
    setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)));
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: pagination.page - 1,
        pageSize: pagination.pageSize
      };

      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.searchValue) params.searchValue = filters.searchValue;

      const response = await ApiGet('/api/cashier/orders/history', params);

      if (response.success) {
        const data = response.success?.data?.data || response.success?.data || {};
        setOrders(data?.records || []);
        setPagination(prev => ({
          ...prev,
          totalRecords: data?.totalRecords || 0,
          totalPages: data?.totalPages || 0
        }));
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handleClear = () => {
    setFilters({
      status: '',
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      searchValue: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchOrders(), 0);
  };

  // Export to Excel via API
  const handleExportExcel = async () => {
    // Check if dates are set
    if (!filters.fromDate || !filters.toDate) {
      toast.warning('Please select both From Date and To Date to export Excel');
      return;
    }

    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${server_api()}/api/cashier/orders/xl_export?fromDate=${filters.fromDate}&toDate=${filters.toDate}`,
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
      link.download = `Orders_${filters.fromDate}_to_${filters.toDate}.xlsx`;
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

  const capitalizeWords = (str) => {
    if (!str) return null;
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'PENDING': 'warning',
      'CREATED': 'secondary',
      'ACCEPTED': 'info',
      'ACCEPTED_ORDER': 'info',
      'PREPARING': 'primary',
      'PREPARING_ORDER': 'primary',
      'READY': 'success',
      'READY_FOR_ORDER': 'success',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
    };
    return <Badge bg={statusColors[status] || 'secondary'} style={{ whiteSpace: 'nowrap', fontSize: '11px', padding: '5px 8px' }}>{status?.replace(/_/g, ' ') || 'N/A'}</Badge>;
  };

  const getOrderTypeBadge = (type) => {
    const typeColors = {
      'DINING': 'primary',
      'DINE_IN': 'primary',
      'ONLINE': 'success',
      'TAKEAWAY': 'info',
      'DELIVERY': 'warning'
    };
    return <Badge bg={typeColors[type] || 'secondary'}>{type?.replace(/_/g, ' ') || 'N/A'}</Badge>;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, pageSize: Number(newSize), page: 1 }));
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  return (
    <Container fluid className="py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold" style={{ color: primaryColor }}>
          <i className="bi bi-receipt me-2"></i>
          Orders
        </h2>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  size="sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED_ORDER">Accepted</option>
                  <option value="PREPARING_ORDER">Preparing</option>
                  <option value="READY_FOR_ORDER">Ready</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={3} md={6}>
              <Form.Group>
                <Form.Label className="small text-muted">Search Order</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search order..."
                  value={filters.searchValue}
                  onChange={(e) => handleFilterChange('searchValue', e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6}>
              <div className="d-flex gap-2">
                <Button variant="primary" size="sm" onClick={handleSearch} style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}>
                  <i className="bi bi-search me-1"></i> Search
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleClear}>
                  <i className="bi bi-x-circle me-1"></i> Clear
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={exportLoading}
                  title={!filters.fromDate || !filters.toDate ? 'Select date range to export' : 'Export to Excel'}
                >
                  {exportLoading ? (
                    <>
                      <Spinner size="sm" animation="border" style={{ width: '1rem', height: '1rem' }} className="me-1" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-excel me-1"></i> Excel
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Orders Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <>
            <Table responsive hover className="mb-0">
              <thead>
                <tr style={{ backgroundColor: primaryColor }}>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Id</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Customer Name</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Mobile</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Ordered Items</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Summary</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Total</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Type</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Status</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Date</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader rows={pagination.pageSize} columns={10} />
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <i className="bi bi-receipt fs-1 text-muted d-block mb-3" style={{ opacity: 0.5 }}></i>
                      <h5 className="text-muted">No orders found</h5>
                    </td>
                  </tr>
                ) : orders.map((order, index) => (
                    <tr key={order.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '14px' }}>
                      <td className="fw-bold align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{order.orderNumber || `#${order.id}`}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{capitalizeWords(order.customerId?.name || order.customerName) || 'Walk-in'}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{order.customerId?.mobileNumber || order.customerPhone || '-'}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ listStyle: 'none' }}>
                            <span style={{ color: primaryColor, display: 'inline-flex', alignItems: 'center', textDecoration: 'underline' }}>
                              <i className="bi bi-eye me-1"></i>
                              View ({Number(order.orderItemsCount) || 0} items)
                            </span>
                          </summary>
                          <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid #e2e8f0', textAlign: 'left' }}>
                            {(order.orderItems || []).map((item, idx) => (
                              <div key={idx} style={{ marginBottom: '8px', fontSize: '12px' }}>
                                <div>
                                  <span className="fw-semibold">{item.menuItemName || item.name}</span> x {item.quantity} - {formatCurrency(item.price)}
                                </div>
                                {(item.addonItems || item.addons || item.orderItemAddons || []).length > 0 && (
                                  <div style={{ paddingLeft: '12px', marginTop: '4px', color: '#6b7280' }}>
                                    {(item.addonItems || item.addons || item.orderItemAddons || []).map((addon, addonIdx) => {
                                      const addonQty = parseInt(addon.quantity) || 1;
                                      const addonTotal = addon.price || 0;
                                      const addonUnitPrice = addonQty > 0 ? addonTotal / addonQty : 0;
                                      return (
                                        <div key={addonIdx} style={{ fontSize: '11px' }}>
                                          + {addon.addonName || addon.name} x {addonQty} - {formatCurrency(addonUnitPrice)}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ listStyle: 'none' }}>
                            <span style={{ color: primaryColor, display: 'inline-flex', alignItems: 'center', textDecoration: 'underline' }}>
                              <i className="bi bi-receipt me-1"></i>
                              View
                            </span>
                          </summary>
                          <div style={{ marginTop: '8px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'left', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#666' }}>Subtotal:</span>
                              <span style={{ fontWeight: '500' }}>{formatCurrency(order.subtotal || 0)}</span>
                            </div>
                            {order.deliveryFee > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Delivery:</span>
                                <span style={{ fontWeight: '500' }}>{formatCurrency(order.deliveryFee)}</span>
                              </div>
                            )}
                            {order.discountAmount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Discount:</span>
                                <span style={{ fontWeight: '500', color: '#dc3545' }}>-{formatCurrency(order.discountAmount)}</span>
                              </div>
                            )}
                            {order.taxAmount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Tax:</span>
                                <span style={{ fontWeight: '500' }}>{formatCurrency(order.taxAmount)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '5px', marginTop: '4px' }}>
                              <span style={{ color: '#333', fontWeight: '600' }}>Total:</span>
                              <span style={{ fontWeight: '700', color: primaryColor }}>{formatCurrency(order.totalAmount || 0)}</span>
                            </div>
                          </div>
                        </details>
                      </td>
                      <td className="align-middle fw-bold" style={{ padding: '12px 16px', textAlign: 'center', color: primaryColor }}>
                        {formatCurrency(order.totalAmount || order.total)}
                      </td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{getOrderTypeBadge(order.orderType)}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{getStatusBadge(order.status)}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{formatDateTime(order.createdAt)}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button variant="outline-danger" size="sm" onClick={() => viewOrderDetails(order)} title="View details">
                            <i className="bi bi-eye"></i>
                          </Button>
                          {order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => setCollectOrder(order)}
                              title="Collect payment"
                            >
                              <i className="bi bi-cash-coin"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Show</span>
                <Form.Select
                  size="sm"
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
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
              <small className="text-muted">
                Showing {pagination.totalRecords > 0 ? ((pagination.page - 1) * pagination.pageSize) + 1 : 0} to {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords} orders
              </small>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>
                  <i className="bi bi-chevron-left"></i> Previous
                </Button>
                <span className="align-self-center px-2">Page {pagination.page} of {pagination.totalPages || 1}</span>
                <Button variant="outline-secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}>
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>
          </>
        </Card.Body>
      </Card>

      {/* Order Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="md" centered>
        <Modal.Header closeButton style={{ backgroundColor: primaryColor, color: primaryContrast }}>
          <Modal.Title style={{ fontSize: '18px' }}>
            Order Details - {selectedOrder?.orderNumber || `#${selectedOrder?.id}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body id="printable-order" style={{ background: isDarkMode ? 'rgba(15,15,30,0.5)' : 'transparent' }}>
          {selectedOrder && (
            <>
              {/* Order Info */}
              <div className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{ borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee' }}>
                <div>
                  <div className="text-muted small">Order Date</div>
                  <div className="fw-semibold">{formatDateTime(selectedOrder.createdAt)}</div>
                </div>
                <div className="d-flex gap-2">
                  {getOrderTypeBadge(selectedOrder.orderType)}
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-3 pb-3" style={{ borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee' }}>
                <div className="fw-bold mb-2" style={{ color: primaryColor }}>Customer Details</div>
                <Row>
                  <Col sm={6} className="mb-2">
                    <small className="text-muted">Name</small>
                    <div>{capitalizeWords(selectedOrder.customerId?.name || selectedOrder.customerName) || 'Walk-in'}</div>
                  </Col>
                  <Col sm={6} className="mb-2">
                    <small className="text-muted">Phone</small>
                    <div>{selectedOrder.customerId?.mobileNumber || selectedOrder.customerPhone || 'N/A'}</div>
                  </Col>
                  {(selectedOrder.customerId?.email || selectedOrder.customerEmail) && (
                    <Col sm={12}>
                      <small className="text-muted">Email</small>
                      <div>{selectedOrder.customerId?.email || selectedOrder.customerEmail}</div>
                    </Col>
                  )}
                </Row>
                {selectedOrder.deliveryAddress && (
                  <div className="mt-2">
                    <small className="text-muted">Delivery Address</small>
                    <div>{selectedOrder.deliveryAddress}</div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-3">
                <div className="fw-bold mb-2" style={{ color: primaryColor }}>Order Items</div>
                <Table size="sm" bordered variant={isDarkMode ? 'dark' : undefined}>
                  <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8f9fa' }}>
                    <tr>
                      <th>Item</th>
                      <th className="text-center" style={{ width: '60px' }}>Qty</th>
                      <th className="text-end" style={{ width: '80px' }}>Price</th>
                      <th className="text-end" style={{ width: '90px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.orderItems || []).map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr>
                          <td>{item.menuItemName || item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">{formatCurrency(item.price)}</td>
                          <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                        {(item.addonItems || item.addons || item.orderItemAddons || []).map((addon, addonIdx) => {
                          const addonQty = parseInt(addon.quantity) || 1;
                          const addonTotal = addon.price || 0;
                          const addonUnitPrice = addonQty > 0 ? addonTotal / addonQty : 0;
                          return (
                            <tr key={`${idx}-addon-${addonIdx}`} style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fafafa' }}>
                              <td style={{ paddingLeft: '20px', color: isDarkMode ? '#94a3b8' : '#666', fontSize: '13px' }}>+ {addon.addonName || addon.name}</td>
                              <td className="text-center" style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '13px' }}>{addonQty}</td>
                              <td className="text-end" style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '13px' }}>{formatCurrency(addonUnitPrice)}</td>
                              <td className="text-end" style={{ color: isDarkMode ? '#94a3b8' : '#666', fontSize: '13px' }}>{formatCurrency(addonTotal)}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8f9fa' }}>
                      <td colSpan="3" className="text-end" style={{ color: isDarkMode ? '#94a3b8' : '#666' }}>Subtotal</td>
                      <td className="text-end fw-semibold">{formatCurrency(selectedOrder.subtotal || 0)}</td>
                    </tr>
                    {selectedOrder.deliveryFee > 0 && (
                      <tr style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8f9fa' }}>
                        <td colSpan="3" className="text-end" style={{ color: isDarkMode ? '#94a3b8' : '#666' }}>Delivery Fee</td>
                        <td className="text-end fw-semibold">{formatCurrency(selectedOrder.deliveryFee)}</td>
                      </tr>
                    )}
                    {selectedOrder.discountAmount > 0 && (
                      <tr style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8f9fa' }}>
                        <td colSpan="3" className="text-end" style={{ color: isDarkMode ? '#94a3b8' : '#666' }}>Discount</td>
                        <td className="text-end fw-semibold" style={{ color: '#dc3545' }}>-{formatCurrency(selectedOrder.discountAmount)}</td>
                      </tr>
                    )}
                    {selectedOrder.taxAmount > 0 && (
                      <tr style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8f9fa' }}>
                        <td colSpan="3" className="text-end" style={{ color: isDarkMode ? '#94a3b8' : '#666' }}>Tax</td>
                        <td className="text-end fw-semibold">{formatCurrency(selectedOrder.taxAmount)}</td>
                      </tr>
                    )}
                    <tr style={{ backgroundColor: primaryColor, color: primaryContrast }}>
                      <td colSpan="3" className="fw-bold">Grand Total</td>
                      <td className="text-end fw-bold">{formatCurrency(selectedOrder.totalAmount || selectedOrder.total)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: isDarkMode ? 'rgba(15,15,30,0.5)' : 'transparent', borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : undefined }}>
          <Button
            style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
            onClick={() => {
              const order = selectedOrder;
              const printWindow = window.open('', '', 'height=600,width=400');

              // Helper function to pad strings for alignment
              const padRight = (str, len) => {
                str = String(str || '');
                if (str.length > len) return str.substring(0, len);
                return str + ' '.repeat(len - str.length);
              };
              const padLeft = (str, len) => {
                str = String(str || '');
                if (str.length > len) return str.substring(0, len);
                return ' '.repeat(len - str.length) + str;
              };
              const centerText = (str, len) => {
                str = String(str || '');
                if (str.length >= len) return str;
                const padding = Math.floor((len - str.length) / 2);
                return ' '.repeat(padding) + str;
              };

              const LINE_WIDTH = 32; // Characters per line for 58mm thermal paper
              const divider = '-'.repeat(LINE_WIDTH);
              const doubleDivider = '='.repeat(LINE_WIDTH);

              // Build items text - Format: Name(16) + Qty(4) + Rate(6) + Amt(6) = 32
              let itemsText = '';
              (order.orderItems || []).forEach((item) => {
                const itemName = (item.menuItemName || item.name || '').substring(0, 16);
                const qty = item.quantity || 1;
                const price = item.price || 0;
                const total = price * qty;
                itemsText += padRight(itemName, 16) + padLeft(qty, 4) + padLeft(price, 6) + padLeft(total, 6) + '\n';

                // Addons
                (item.addonItems || item.addons || item.orderItemAddons || []).forEach((addon) => {
                  const addonQty = parseInt(addon.quantity) || 1;
                  const addonTotal = addon.price || 0;
                  const addonUnitPrice = addonQty > 0 ? Math.round(addonTotal / addonQty) : 0;
                  const addonName = ' +' + (addon.addonName || addon.name || '').substring(0, 14);
                  itemsText += padRight(addonName, 16) + padLeft(addonQty, 4) + padLeft(addonUnitPrice, 6) + padLeft(addonTotal, 6) + '\n';
                });
              });

              // Build totals text
              let totalsText = '';
              totalsText += padRight('Subtotal:', 20) + padLeft(order?.subtotal || 0, 12) + '\n';
              if (order?.deliveryFee > 0) {
                totalsText += padRight('Delivery:', 20) + padLeft(order?.deliveryFee, 12) + '\n';
              }
              if (order?.discountAmount > 0) {
                totalsText += padRight('Discount:', 20) + padLeft('-' + order?.discountAmount, 12) + '\n';
              }
              if (order?.taxAmount > 0) {
                totalsText += padRight('Tax:', 20) + padLeft(order?.taxAmount, 12) + '\n';
              }

              const customerName = capitalizeWords(order?.customerId?.name || order?.customerName) || 'Walk-in';
              const customerPhone = order?.customerId?.mobileNumber || order?.customerPhone || 'N/A';
              const orderType = order?.orderType?.replace('_', ' ') || 'N/A';
              const orderStatus = order?.status?.replace(/_/g, ' ') || 'N/A';

              const receiptText = `${centerText('ORDER RECEIPT', LINE_WIDTH)}
${centerText(order?.orderNumber || 'Order #' + order?.id, LINE_WIDTH)}
${centerText(orderType + ' | ' + orderStatus, LINE_WIDTH)}

Date: ${formatDateTime(order?.createdAt)}
Customer: ${customerName}
Phone: ${customerPhone}
${divider}
${padRight('ITEM', 16)}${padLeft('QTY', 4)}${padLeft('RATE', 6)}${padLeft('AMT', 6)}
${itemsText}${divider}
${totalsText}${padRight('GRAND TOTAL', 20)}${padLeft('Rs.' + (order?.totalAmount || order?.total || 0), 12)}
${divider}
${centerText('Thank you!', LINE_WIDTH)}
`;

              const receiptHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Order - ${order?.orderNumber || order?.id}</title>
                  <style>
                    @page {
                      margin: 0;
                      size: 58mm auto;
                    }
                    body {
                      font-family: 'Courier New', Courier, monospace;
                      font-size: 12px;
                      margin: 0;
                      padding: 5mm;
                      width: 58mm;
                      line-height: 1.3;
                    }
                    pre {
                      font-family: 'Courier New', Courier, monospace;
                      font-size: 12px;
                      margin: 0;
                      white-space: pre-wrap;
                      word-wrap: break-word;
                    }
                  </style>
                </head>
                <body>
                  <pre>${receiptText}</pre>
                </body>
                </html>
              `;

              printWindow.document.write(receiptHtml);
              printWindow.document.close();
              setTimeout(() => { printWindow.print(); }, 300);
            }}
          >
            <i className="bi bi-printer me-1"></i> Print
          </Button>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Collection Modal */}
      <CollectPaymentModal
        show={!!collectOrder}
        order={collectOrder}
        onClose={() => setCollectOrder(null)}
        onCollected={handlePaymentCollected}
        endpoint="/api/cashier/orders/update"
      />
    </Container>
  );
};

export default Orders;
