import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table } from 'react-bootstrap';
import { ApiGet } from '../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getContrastColor } from '../../../services/themeService';

const OrderHistory = () => {
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const tp = isDarkMode ? '#e2e8f0' : '#1e293b';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const response = await ApiGet('/api/delivery/orders/history');
      if (response.success) {
        setOrders(response.success.data?.records || response.success.records || []);
      } else {
        toast.error('Failed to load order history');
      }
    } catch (error) {
      toast.error('Error loading order history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-5" style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4" style={{ backgroundColor: bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="mb-1 fw-bold" style={{ color: tp }}>
          <i className="bi bi-clock-history me-2"></i>
          Order History
        </h2>
        <p className="text-muted small">Total delivered: {orders.length} orders</p>
      </div>

      {orders.length === 0 ? (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          No delivered orders yet.
        </Alert>
      ) : (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
          <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
            <h5 className="mb-0 fw-bold" style={{ color: tp }}>Delivered Orders</h5>
          </Card.Header>
          <Card.Body style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <Table className="mb-0" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
                <thead>
                  <tr style={{ backgroundColor: primaryColor }}>
                    <th style={{ color: primaryContrast, border: 'none', padding: '12px 16px' }}>Order #</th>
                    <th style={{ color: primaryContrast, border: 'none', padding: '12px 16px' }}>Customer</th>
                    <th style={{ color: primaryContrast, border: 'none', padding: '12px 16px' }}>Phone</th>
                    <th style={{ color: primaryContrast, border: 'none', padding: '12px 16px' }}>Amount</th>
                    <th style={{ color: primaryContrast, border: 'none', padding: '12px 16px' }}>Delivered At</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                      <td style={{ padding: '12px 16px', color: primaryColor, fontWeight: 'bold' }}>
                        {order.orderNumber}
                      </td>
                      <td style={{ padding: '12px 16px', color: tp }}>
                        {order.customerName}
                      </td>
                      <td style={{ padding: '12px 16px', color: tp }}>
                        {order.customerPhone}
                      </td>
                      <td style={{ padding: '12px 16px', color: tp, fontWeight: 'bold' }}>
                        ${order.totalAmount}
                      </td>
                      <td style={{ padding: '12px 16px', color: tp }}>
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Summary Card */}
      {orders.length > 0 && (
        <Card className="border-0 shadow-sm mt-4" style={{ backgroundColor: cBg }}>
          <Card.Body>
            <Row>
              <Col md={4}>
                <div>
                  <small className="text-muted d-block">Total Orders Delivered</small>
                  <span className="fs-4 fw-bold" style={{ color: primaryColor }}>{orders.length}</span>
                </div>
              </Col>
              <Col md={4}>
                <div>
                  <small className="text-muted d-block">Total Earnings</small>
                  <span className="fs-4 fw-bold" style={{ color: '#10b981' }}>${orders.reduce((sum, o) => sum + o.totalAmount, 0)}</span>
                </div>
              </Col>
              <Col md={4}>
                <div>
                  <small className="text-muted d-block">Average Per Order</small>
                  <span className="fs-4 fw-bold" style={{ color: '#f59e0b' }}>${Math.round(orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length) || 0}</span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OrderHistory;
