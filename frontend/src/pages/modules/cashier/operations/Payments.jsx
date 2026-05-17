import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Form, Table } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import '../../../../styles/tables.css';
import { useTheme } from '../../../../contexts/ThemeContext';

const Payments = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
    totalRecords: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    paymentMethod: '',
    paymentStatus: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    searchValue: ''
  });

  // Summary
  const [summary, setSummary] = useState({
    total: 0,
    cash: 0,
    card: 0,
    upi: 0,
    count: 0
  });

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: pagination.page - 1,
        pageSize: pagination.pageSize
      };

      // Pass null if empty, otherwise pass the value
      params.paymentMethod = filters.paymentMethod || null;
      params.paymentStatus = filters.paymentStatus || null;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.searchValue) params.searchValue = filters.searchValue;

      const response = await ApiGet('/api/cashier/orders/history', params);

      if (response.success) {
        const data = response.success?.data?.data || response.success?.data || {};
        const records = data?.records || data || [];
        setPayments(Array.isArray(records) ? records : []);
        setPagination(prev => ({
          ...prev,
          totalRecords: data?.totalRecords || records.length || 0,
          totalPages: data?.totalPages || Math.ceil((records.length || 0) / pagination.pageSize) || 0
        }));
        calculateSummary(Array.isArray(records) ? records : []);
      }
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const sum = data.reduce((acc, p) => {
      const amount = Number(p.totalAmount ?? p.amount ?? 0);
      acc.total += amount;
      acc.count++;
      if (p.paymentMethod === 'CASH') acc.cash += amount;
      if (p.paymentMethod === 'CARD') acc.card += amount;
      if (p.paymentMethod === 'UPI' || p.paymentMethod === 'PG') acc.upi += amount;
      return acc;
    }, { total: 0, cash: 0, card: 0, upi: 0, count: 0 });
    setSummary(sum);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPayments();
  };

  const handleClear = () => {
    setFilters({
      paymentMethod: '',
      paymentStatus: '',
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      searchValue: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchPayments(), 0);
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

  const getMethodBadge = (method) => {
    const config = {
      'CASH': { bg: 'success', icon: 'bi-cash-coin' },
      'CARD': { bg: 'primary', icon: 'bi-credit-card' },
      'UPI': { bg: 'info', icon: 'bi-phone' },
      'PG': { bg: 'warning', icon: 'bi-link-45deg' }
    };
    const { bg, icon } = config[method] || { bg: 'secondary', icon: 'bi-wallet2' };
    return <Badge bg={bg}><i className={`bi ${icon} me-1`}></i>{method || 'N/A'}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'SUCCESS': 'success',
      'COMPLETED': 'success',
      'PENDING': 'warning',
      'FAILED': 'danger',
      'REFUNDED': 'info'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status || 'N/A'}</Badge>;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, pageSize: Number(newSize), page: 1 }));
  };

  return (
    <Container fluid className="py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold" style={{ color: primaryColor }}>
          <i className="bi bi-wallet2 me-2"></i>
          Payments
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
                <Form.Label className="small text-muted">Payment Method</Form.Label>
                <Form.Select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  size="sm"
                >
                  <option value="">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="PG">Pay Link</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">Payment Status</Form.Label>
                <Form.Select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  size="sm"
                >
                  <option value="">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={2} md={6}>
              <Form.Group>
                <Form.Label className="small text-muted">Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search payment..."
                  value={filters.searchValue}
                  onChange={(e) => handleFilterChange('searchValue', e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col lg={2} md={6}>
              <div className="d-flex gap-2">
                <Button variant="primary" size="sm" onClick={handleSearch} style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}>
                  <i className="bi bi-search me-1"></i> Search
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleClear}>
                  <i className="bi bi-x-circle me-1"></i> Clear
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Payments Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <>
            <Table responsive hover className="mb-0">
              <thead>
                <tr style={{ backgroundColor: primaryColor }}>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Payment ID</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Order Id</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Customer Name</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Mobile Number</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Summary</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Amount</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Payment Method</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Payment Status</th>
                  <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader rows={pagination.pageSize} columns={9} />
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <i className="bi bi-wallet2 fs-1 text-muted d-block mb-3" style={{ opacity: 0.5 }}></i>
                      <h5 className="text-muted">No payments found</h5>
                    </td>
                  </tr>
                ) : payments.map((payment, index) => (
                    <tr key={payment.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '14px' }}>
                      <td className="fw-bold align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{payment.transactionId || `PAY-${payment.id}`}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{payment.orderNumber || payment.orderId || '-'}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{capitalizeWords(payment.customerId?.name || payment.customerName) || 'Walk-in'}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{payment.customerId?.mobileNumber || payment.customerPhone || '-'}</td>
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
                              <span style={{ fontWeight: '500' }}>{formatCurrency(payment.subtotal || 0)}</span>
                            </div>
                            {payment.deliveryFee > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Delivery:</span>
                                <span style={{ fontWeight: '500' }}>{formatCurrency(payment.deliveryFee)}</span>
                              </div>
                            )}
                            {payment.discountAmount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Discount:</span>
                                <span style={{ fontWeight: '500', color: '#dc3545' }}>-{formatCurrency(payment.discountAmount)}</span>
                              </div>
                            )}
                            {payment.taxAmount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Tax:</span>
                                <span style={{ fontWeight: '500' }}>{formatCurrency(payment.taxAmount)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '5px', marginTop: '4px' }}>
                              <span style={{ color: '#333', fontWeight: '600' }}>Total:</span>
                              <span style={{ fontWeight: '700', color: primaryColor }}>{formatCurrency(payment.totalAmount || 0)}</span>
                            </div>
                          </div>
                        </details>
                      </td>
                      <td className="align-middle fw-bold" style={{ padding: '12px 16px', textAlign: 'center', color: '#28a745' }}>{formatCurrency(payment.totalAmount || payment.amount)}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{getMethodBadge(payment.paymentMethod)}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{getStatusBadge(payment.paymentStatus)}</td>
                      <td className="align-middle" style={{ padding: '12px 16px', textAlign: 'center' }}>{formatDateTime(payment.createdAt)}</td>
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
                  Showing {pagination.totalRecords > 0 ? ((pagination.page - 1) * pagination.pageSize) + 1 : 0} to {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords} payments
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
    </Container>
  );
};

export default Payments;
