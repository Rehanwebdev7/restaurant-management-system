import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ApiGet, ApiPut } from '../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getContrastColor } from '../../../services/themeService';

const ActiveOrders = () => {
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const cBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tp = isDarkMode ? '#e2e8f0' : '#1e293b';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ApiGet('/api/delivery/orders');
      if (response.success) {
        setOrders(response.success.data?.records || response.success.records || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePickUp = async (order) => {
    setActionLoading(order.id);
    try {
      const response = await ApiPut('/api/delivery/orders/update', {
        id: order.id,
        status: 'OUT_FOR_DELIVERY'
      });
      if (response.success) {
        toast.success(`Order ${order.orderNumber} picked up`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
        toast.error(response.fail || 'Failed to pick up order');
      }
    } catch (error) {
      toast.error('Error picking up order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (order) => {
    setActionLoading(order.id);
    try {
      const response = await ApiPut('/api/delivery/orders/update', {
        id: order.id,
        status: 'DELIVERED'
      });
      if (response.success) {
        toast.success(`Order ${order.orderNumber} delivered`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
        toast.error(response.fail || 'Failed to mark as delivered');
      }
    } catch (error) {
      toast.error('Error delivering order');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'READY_FOR_ORDER') return '#f59e0b';
    if (status === 'OUT_FOR_DELIVERY') return '#3b82f6';
    return '#10b981';
  };

  const getStatusLabel = (status) => {
    if (status === 'READY_FOR_ORDER') return 'Ready for Pickup';
    if (status === 'OUT_FOR_DELIVERY') return 'Out for Delivery';
    return 'Delivered';
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
          <i className="bi bi-box2-heart me-2"></i>
          Active Orders
        </h2>
        <p className="text-muted small">Total: {orders.length} orders</p>
      </div>

      {orders.length === 0 ? (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          No active orders at the moment. You can check back soon!
        </Alert>
      ) : (
        <Row className="g-3">
          {orders.map((order) => (
            <Col lg={6} key={order.id}>
              <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg, borderLeft: `4px solid ${getStatusColor(order.status)}` }}>
                <Card.Header className="border-0 d-flex justify-content-between align-items-center" style={{ backgroundColor: cBg }}>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ color: tp }}>{order.orderNumber}</h6>
                    <Badge style={{ backgroundColor: getStatusColor(order.status), color: '#fff' }}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <span className="fs-6 fw-bold" style={{ color: primaryColor }}>${order.totalAmount}</span>
                </Card.Header>
                <Card.Body style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
                  {/* Customer Info */}
                  <div className="mb-3">
                    <small className="text-muted d-block">Customer</small>
                    <span className="fw-bold" style={{ color: tp }}>{order.customerName}</span>
                    <a href={`tel:${order.customerPhone}`} className="d-block text-decoration-none mt-1">
                      <i className="bi bi-telephone me-1"></i>
                      {order.customerPhone}
                    </a>
                  </div>

                  {/* Address */}
                  <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${cBorder}` }}>
                    <small className="text-muted d-block">Delivery Address</small>
                    <span style={{ color: tp }}>{order.deliveryAddress}</span>
                  </div>

                  {/* Items */}
                  <div className="mb-3">
                    <small className="text-muted d-block mb-2">Items</small>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between small mb-1">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="text-muted">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-4">
                    {order.status === 'READY_FOR_ORDER' && (
                      <Button
                        className="flex-grow-1"
                        style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
                        disabled={actionLoading === order.id}
                        onClick={() => handlePickUp(order)}
                      >
                        {actionLoading === order.id ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-1" />
                            Picking up...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-1"></i>
                            Pick Up
                          </>
                        )}
                      </Button>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <Button
                        className="flex-grow-1"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }}
                        disabled={actionLoading === order.id}
                        onClick={() => handleDeliver(order)}
                      >
                        {actionLoading === order.id ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-1" />
                            Marking...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-all me-1"></i>
                            Mark Delivered
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ActiveOrders;
