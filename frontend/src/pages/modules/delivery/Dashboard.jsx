import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ApiGet } from '../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getContrastColor } from '../../../services/themeService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const tp = isDarkMode ? '#e2e8f0' : '#1e293b';
  const ts = isDarkMode ? '#cbd5e1' : '#64748b';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    activeOrders: 0,
    totalEarnings: 0,
    deliveryBoy: { name: '', id: 0 }
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await ApiGet('/api/delivery/dashboard');
      if (response.success) {
        setStats(response.success.data || response.success);
      } else {
        toast.error('Failed to load dashboard');
      }
    } catch (error) {
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: cBg }}>
      <Card.Body className="d-flex align-items-center">
        <div style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '1rem'
        }}>
          <i className={`${icon} fs-4`} style={{ color }}></i>
        </div>
        <div>
          <div className="text-muted small">{title}</div>
          <div className="fs-4 fw-bold" style={{ color }}>{value}</div>
        </div>
      </Card.Body>
    </Card>
  );

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold" style={{ color: tp }}>
            <i className="bi bi-box2-heart me-2"></i>
            Delivery Dashboard
          </h2>
          <p className="text-muted small mt-1">Welcome back, {stats.deliveryBoy?.name || 'Delivery Boy'}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <Row className="g-3 mb-4">
        <Col lg={3} md={6}>
          <StatCard
            title="Today's Deliveries"
            value={stats.todayDeliveries || 0}
            icon="bi bi-check-circle"
            color="#10b981"
          />
        </Col>
        <Col lg={3} md={6}>
          <StatCard
            title="Active Orders"
            value={stats.activeOrders || 0}
            icon="bi bi-clock"
            color="#f59e0b"
          />
        </Col>
        <Col lg={3} md={6}>
          <StatCard
            title="Today's Earnings"
            value={`$${stats.totalEarnings || 0}`}
            icon="bi bi-currency-dollar"
            color="#3b82f6"
          />
        </Col>
        <Col lg={3} md={6}>
          <StatCard
            title="Delivery Status"
            value="Active"
            icon="bi bi-geo-alt"
            color="#8b5cf6"
          />
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
            <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
              <h5 className="mb-0 fw-bold" style={{ color: tp }}>Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Button
                className="w-100 mb-3"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
                onClick={() => navigate('/delivery/orders')}
              >
                <i className="bi bi-box2-heart me-2"></i>
                View Active Orders ({stats.activeOrders || 0})
              </Button>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => navigate('/delivery/history')}
              >
                <i className="bi bi-clock-history me-2"></i>
                View Delivery History
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
            <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
              <h5 className="mb-0 fw-bold" style={{ color: tp }}>Today's Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                <small className="text-muted d-block">Completed Deliveries</small>
                <span className="fs-5 fw-bold" style={{ color: tp }}>{stats.todayDeliveries || 0}</span>
              </div>
              <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                <small className="text-muted d-block">Pending Orders</small>
                <span className="fs-5 fw-bold" style={{ color: tp }}>{stats.activeOrders || 0}</span>
              </div>
              <div>
                <small className="text-muted d-block">Earning Rate</small>
                <span className="fs-5 fw-bold" style={{ color: primaryColor }}>$50 per delivery</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
