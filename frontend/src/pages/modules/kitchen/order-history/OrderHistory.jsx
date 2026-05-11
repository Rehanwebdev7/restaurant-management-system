import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Form, Table, Pagination } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { server_api } from '../../../../utils/constants';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getContrastColor } from '../../../../services/themeService';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';

const OrderHistory = () => {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
    totalRecords: 0,
    totalPages: 0
  });

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

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
    orderNumber: ''
  });

  useEffect(() => {
    // Only call API if orderNumber is empty or has more than 3 characters
    if (filters.orderNumber.length === 0 || filters.orderNumber.length > 3) {
      fetchOrderHistory();
    }
  }, [pagination.page, filters.status, filters.orderNumber]);

  const fetchOrderHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: pagination.page - 1,
        pageSize: pagination.pageSize
      };

      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.orderNumber) params.searchValue = filters.orderNumber;

      const response = await ApiGet('/api/kitchen/orders/history', params);

      if (response.success) {
        const data = response.success?.data?.data || response.success?.data;
        setOrders(data?.records || []);
        setPagination(prev => ({
          ...prev,
          totalRecords: data?.totalRecords || 0,
          totalPages: data?.totalPages || 0
        }));
      } else {
        setError('Failed to load order history');
      }
    } catch (err) {
      setError('Failed to load order history');
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrderHistory();
  };

  const handleClear = () => {
    setFilters({
      status: '',
      fromDate: '',
      toDate: '',
      orderNumber: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchOrderHistory(), 0);
  };

  const handleExcelExport = async () => {
    // Check if dates are set
    if (!filters.fromDate || !filters.toDate) {
      toast.warning('Please select both From Date and To Date to export Excel');
      return;
    }

    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${server_api()}/api/kitchen/orders/xl_export?fromDate=${filters.fromDate}&toDate=${filters.toDate}`,
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'PENDING': { backgroundColor: '#f59e0b', color: 'white' },
      'CREATED': { backgroundColor: '#6b7280', color: 'white' },
      'ACCEPTED_ORDER': { backgroundColor: '#06b6d4', color: 'white' },
      'PREPARING_ORDER': { backgroundColor: '#ef4444', color: 'white' },
      'READY_FOR_ORDER': { backgroundColor: '#22c55e', color: 'white' },
      'COMPLETED': { backgroundColor: '#14b8a6', color: 'white' },
      'SERVED': { backgroundColor: '#8b5cf6', color: 'white' },
      'CANCELLED': { backgroundColor: '#94a3b8', color: 'white' },
      'REJECTED': { backgroundColor: '#dc2626', color: 'white' },
    };
    const style = statusStyles[status] || { backgroundColor: '#6b7280', color: 'white' };
    return (
      <span style={{
        ...style,
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <Container fluid className="py-3" style={{ backgroundColor: bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: tp }}>
          <i className="bi bi-clock-history me-2"></i>
          Order History
        </h3>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4" style={{ backgroundColor: cBg }}>
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">Order Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={filters.orderNumber}
                  onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
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
                  <option value="ACCEPTED_ORDER">Accepted Order</option>
                  <option value="PREPARING_ORDER">Preparing Order</option>
                  <option value="READY_FOR_ORDER">Ready For Order</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
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
            <Col lg={4} md={8}>
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
                  onClick={handleExcelExport}
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

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Orders Table */}
      <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg, borderColor: cBorder }}>
        <Card.Body className="p-0">
          {!loading && orders.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 d-block mb-3" style={{ opacity: 0.5, color: tp }}></i>
              <h5 style={{ color: tp }}>No Orders Found</h5>
              <p style={{ color: tp }} className="mb-0">No orders match your search criteria.</p>
            </div>
          ) : (
            <>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr style={{ backgroundColor: primaryColor }}>
                    <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Id</th>
                    <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Type</th>
                    <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Table No.</th>
                    <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date & Time</th>
                    <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Time Summary</th>
                    <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Ordered Items</th>
                    {/* <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Customer Name</th> */}
                    {/* <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Customer Mobile</th> */}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeletonLoader rows={pagination.pageSize} columns={9} />
                  ) : orders.map((order, index) => (
                    <tr key={order.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                        {getStatusBadge(order.status)}
                      </td>
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
                        <div style={{ fontSize: '14px', color: tp }}>{formatDateTime(order.createdAt)}</div>
                      </td>
                      <td className="py-3 align-middle" style={{ padding: '16px', textAlign: 'center' }}>
                        {(order.kitchenAcceptAt || order.kitchenReadyAt) ? (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ fontSize: '13px', fontWeight: '500', listStyle: 'none', color: primaryColor, textDecoration: 'underline' }}>
                              <i className="bi bi-clock-history me-1"></i>View
                            </summary>
                            <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '13px' }}>
                              {order.kitchenAcceptAt && (
                                <div style={{ marginBottom: '4px', color: '#06b6d4' }}>
                                  <i className="bi bi-check-circle me-1"></i>
                                  <strong>Accepted:</strong> {formatDateTime(order.kitchenAcceptAt)}
                                </div>
                              )}
                              {order.kitchenReadyAt && (
                                <div style={{ color: '#22c55e' }}>
                                  <i className="bi bi-bag-check me-1"></i>
                                  <strong>Ready:</strong> {formatDateTime(order.kitchenReadyAt)}
                                </div>
                              )}
                            </div>
                          </details>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
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
                          <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid #e2e8f0', textAlign: 'left' }}>
                            {(order.orderItems || []).map((item, idx) => (
                              <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', paddingBottom: '8px', borderBottom: idx < order.orderItems.length - 1 ? '1px dashed #e2e8f0' : 'none', color: tp }}>
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
                      setTimeout(() => fetchOrderHistory(), 0);
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
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderHistory;
