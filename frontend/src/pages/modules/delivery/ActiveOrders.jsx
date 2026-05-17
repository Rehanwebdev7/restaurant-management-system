import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Modal, Form } from 'react-bootstrap';
import { ApiGet, ApiPost, ApiPut } from '../../../ApiServices/ApiServices';
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

  // OTP Modal state
  const [otpModal, setOtpModal] = useState({ show: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState(''); // dev only — remove in prod

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ApiGet('/api/delivery/orders/filter', {
        status: 'READY_FOR_ORDER,OUT_FOR_DELIVERY',
        pageNumber: 1,
        pageSize: 100
      });
      if (response.success) {
        setOrders(response.success.data?.data?.records || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePickUp = async (order) => {
    setActionLoading(order.id);
    try {
      const response = await ApiPut('/api/delivery/orders/update', { id: order.id, status: 'OUT_FOR_DELIVERY' });
      if (response.success) {
        toast.success(`Order ${order.orderNumber} picked up`);
        fetchOrders();
      } else {
        toast.error(response.fail || 'Failed to pick up order');
      }
    } catch {
      toast.error('Error picking up order');
    } finally {
      setActionLoading(null);
    }
  };

  const openDeliverModal = (order) => {
    setOtpModal({ show: true, order });
    setPaymentMethod('cash');
    setOtpSent(false);
    setOtpCode('');
    setDebugOtp('');
  };

  const handleSendOtp = async () => {
    setOtpLoading(true);
    try {
      const response = await ApiPost('/api/delivery/orders/send-otp', { orderId: otpModal.order.id });
      if (response.success) {
        setOtpSent(true);
        const otp = response.success.data?.data?.otp;
        if (otp) setDebugOtp(otp); // dev display
        toast.success('OTP generated. Share with customer.');
      } else {
        toast.error(response.fail || 'Failed to send OTP');
      }
    } catch {
      toast.error('Error sending OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyAndDeliver = async () => {
    if (!otpCode || otpCode.length !== 4) {
      toast.error('Enter 4-digit OTP');
      return;
    }
    setVerifyLoading(true);
    try {
      const response = await ApiPost('/api/delivery/orders/verify-otp', {
        orderId: otpModal.order.id,
        otpCode,
        paymentMethod
      });
      if (response.success) {
        toast.success(`Order ${otpModal.order.orderNumber} delivered successfully!`);
        setOtpModal({ show: false, order: null });
        fetchOrders();
      } else {
        toast.error(response.fail || 'OTP verification failed');
      }
    } catch {
      toast.error('Error verifying OTP');
    } finally {
      setVerifyLoading(false);
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
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4" style={{ backgroundColor: bg, minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: tp }}>
            <i className="bi bi-box2-heart me-2"></i>Active Orders
          </h2>
          <p className="text-muted small">Total: {orders.length} orders</p>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={fetchOrders}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <Alert variant="info"><i className="bi bi-info-circle me-2"></i>No active orders at the moment.</Alert>
      ) : (
        <Row className="g-3">
          {orders.map((order) => (
            <Col lg={6} key={order.id}>
              <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg, borderLeft: `4px solid ${getStatusColor(order.deliveryStatus || order.status)}` }}>
                <Card.Header className="border-0 d-flex justify-content-between align-items-center" style={{ backgroundColor: cBg }}>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ color: tp }}>{order.orderNumber}</h6>
                    <Badge style={{ backgroundColor: getStatusColor(order.deliveryStatus || order.status), color: '#fff' }}>
                      {getStatusLabel(order.deliveryStatus || order.status)}
                    </Badge>
                  </div>
                  <span className="fs-6 fw-bold" style={{ color: primaryColor }}>₹{order.totalAmount}</span>
                </Card.Header>
                <Card.Body style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
                  <div className="mb-3 d-flex justify-content-between">
                    <div>
                      <small className="text-muted d-block">Customer</small>
                      <span className="fw-bold" style={{ color: tp }}>{order.customerName}</span>
                      <a href={`tel:${order.customerPhone}`} className="d-block text-decoration-none mt-1 small">
                        <i className="bi bi-telephone me-1"></i>{order.customerPhone}
                      </a>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="text-end">
                        <small className="text-muted d-block">Delivery Fee</small>
                        <span className="fw-bold text-success">₹{order.deliveryFee}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${cBorder}` }}>
                    <small className="text-muted d-block">Special Instructions</small>
                    <span style={{ color: tp }}>{order.specialInstructions || '—'}</span>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    {(order.deliveryStatus === 'READY_FOR_ORDER' || order.status === 'READY_FOR_ORDER') && (
                      <Button
                        className="flex-grow-1"
                        style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
                        disabled={actionLoading === order.id}
                        onClick={() => handlePickUp(order)}
                      >
                        {actionLoading === order.id ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-bag-check me-1"></i>}
                        Pick Up
                      </Button>
                    )}
                    {(order.deliveryStatus === 'OUT_FOR_DELIVERY' || order.status === 'OUT_FOR_DELIVERY') && (
                      <Button
                        className="flex-grow-1"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }}
                        disabled={actionLoading === order.id}
                        onClick={() => openDeliverModal(order)}
                      >
                        <i className="bi bi-check-all me-1"></i>Mark Delivered
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* OTP Delivery Modal */}
      <Modal show={otpModal.show} onHide={() => setOtpModal({ show: false, order: null })} centered>
        <Modal.Header closeButton style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: tp, borderColor: cBorder }}>
          <Modal.Title style={{ color: tp }}>
            <i className="bi bi-shield-check me-2 text-success"></i>
            Complete Delivery — {otpModal.order?.orderNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff' }}>
          {/* Payment Method */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold" style={{ color: tp }}>Payment Method</Form.Label>
            <div className="d-flex gap-2">
              {['cash', 'upi', 'online'].map(m => (
                <Button
                  key={m}
                  size="sm"
                  onClick={() => setPaymentMethod(m)}
                  style={paymentMethod === m
                    ? { backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }
                    : { backgroundColor: 'transparent', borderColor: cBorder, color: tp }
                  }
                >
                  {m === 'cash' && <i className="bi bi-cash me-1"></i>}
                  {m === 'upi' && <i className="bi bi-phone me-1"></i>}
                  {m === 'online' && <i className="bi bi-credit-card me-1"></i>}
                  {m.toUpperCase()}
                </Button>
              ))}
            </div>
            {(paymentMethod === 'cash' || paymentMethod === 'upi') && (
              <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.85rem' }}>
                <i className="bi bi-info-circle me-1"></i>
                ₹{otpModal.order?.totalAmount} will be added to your outstanding balance
              </div>
            )}
          </Form.Group>

          {/* OTP Section */}
          {!otpSent ? (
            <div className="text-center py-3">
              <div className="mb-3" style={{ color: tp }}>
                <i className="bi bi-phone-fill fs-2 d-block mb-2" style={{ color: primaryColor }}></i>
                <p className="mb-0">Click below to generate OTP for customer <strong>{otpModal.order?.customerPhone}</strong></p>
              </div>
              <Button
                style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
                onClick={handleSendOtp}
                disabled={otpLoading}
              >
                {otpLoading ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-shield-lock me-1"></i>}
                Generate OTP
              </Button>
            </div>
          ) : (
            <div>
              {debugOtp && (
                <div className="mb-3 p-3 rounded text-center" style={{ backgroundColor: '#dcfce7', border: '2px dashed #16a34a' }}>
                  <small className="text-muted d-block mb-1">OTP (dev mode — share with customer)</small>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.5rem', color: '#16a34a' }}>{debugOtp}</span>
                </div>
              )}
              <Form.Group>
                <Form.Label className="fw-bold" style={{ color: tp }}>Enter OTP from Customer</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={4}
                  placeholder="Enter 4-digit OTP"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem',
                    backgroundColor: isDarkMode ? '#0f172a' : '#fff',
                    color: tp, borderColor: cBorder
                  }}
                />
              </Form.Group>
              <Button
                variant="link"
                className="p-0 mt-2 small"
                onClick={() => { setOtpSent(false); setOtpCode(''); setDebugOtp(''); }}
              >
                Resend OTP
              </Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: cBorder }}>
          <Button variant="outline-secondary" onClick={() => setOtpModal({ show: false, order: null })}>Cancel</Button>
          {otpSent && (
            <Button
              style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }}
              onClick={handleVerifyAndDeliver}
              disabled={verifyLoading || otpCode.length !== 4}
            >
              {verifyLoading ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-check-circle me-1"></i>}
              Verify & Complete Delivery
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ActiveOrders;
