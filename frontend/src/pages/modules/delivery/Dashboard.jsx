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
    todayDeliveries: 0, activeOrders: 0, walletBalance: 0, outstandingBalance: 0
  });
  const userName = localStorage.getItem('UserName') || 'Delivery Boy';

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [activeRes, deliveredRes, walletRes] = await Promise.all([
        ApiGet('/api/delivery/orders/filter', { status: 'READY_FOR_ORDER,OUT_FOR_DELIVERY', pageNumber: 1, pageSize: 100 }),
        ApiGet('/api/delivery/orders/filter', { status: 'DELIVERED', pageNumber: 1, pageSize: 100 }),
        ApiGet('/api/delivery/users/out_wallet', {})
      ]);

      const activeOrders = activeRes.success?.data?.data?.records || [];
      const deliveredOrders = deliveredRes.success?.data?.data?.records || [];
      const today = new Date().toISOString().split('T')[0];
      const deliveredToday = deliveredOrders.filter(o => o?.createdAt && String(o.createdAt).slice(0, 10) === today);
      const wallet = walletRes.success?.data?.data || {};

      setStats({
        todayDeliveries: deliveredToday.length,
        activeOrders: activeOrders.length,
        walletBalance: wallet.walletBalance || 0,
        outstandingBalance: wallet.outstandingBalance || 0
      });
    } catch {
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, prefix = '' }) => (
    <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: cBg }}>
      <Card.Body className="d-flex align-items-center">
        <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
          <i className={`${icon} fs-4`} style={{ color }}></i>
        </div>
        <div>
          <div className="text-muted small">{title}</div>
          <div className="fs-4 fw-bold" style={{ color }}>{prefix}{value}</div>
        </div>
      </Card.Body>
    </Card>
  );

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
          <h2 className="mb-0 fw-bold" style={{ color: tp }}><i className="bi bi-speedometer2 me-2"></i>Dashboard</h2>
          <p className="text-muted small mt-1">Welcome back, {userName}</p>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={fetchDashboard}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </Button>
      </div>

      <Row className="g-3 mb-4">
        <Col lg={3} md={6}><StatCard title="Today's Deliveries" value={stats.todayDeliveries} icon="bi bi-check-circle" color="#10b981" /></Col>
        <Col lg={3} md={6}><StatCard title="Active Orders" value={stats.activeOrders} icon="bi bi-clock" color="#f59e0b" /></Col>
        <Col lg={3} md={6}><StatCard title="Wallet Balance" value={Number(stats.walletBalance).toFixed(2)} icon="bi bi-wallet2" color="#3b82f6" prefix="$" /></Col>
        <Col lg={3} md={6}><StatCard title="Outstanding" value={Number(stats.outstandingBalance).toFixed(2)} icon="bi bi-exclamation-circle" color={stats.outstandingBalance > 0 ? '#ef4444' : '#6b7280'} prefix="$" /></Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
            <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
              <h5 className="mb-0 fw-bold" style={{ color: tp }}>Quick Actions</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column gap-2">
              <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={() => navigate('/delivery/orders')}>
                <i className="bi bi-box2-heart me-2"></i>Active Orders ({stats.activeOrders})
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/delivery/history')}>
                <i className="bi bi-clock-history me-2"></i>Order History
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/delivery/wallet')}>
                <i className="bi bi-wallet2 me-2"></i>Wallet & Earnings
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/delivery/bank-accounts')}>
                <i className="bi bi-bank me-2"></i>Bank Accounts
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
              {[
                { label: 'Completed Deliveries', value: stats.todayDeliveries },
                { label: 'Pending Orders', value: stats.activeOrders },
                { label: 'Wallet Balance', value: `$${Number(stats.walletBalance).toFixed(2)}` },
                { label: 'Outstanding to Clear', value: `$${Number(stats.outstandingBalance).toFixed(2)}`, color: stats.outstandingBalance > 0 ? '#ef4444' : undefined }
              ].map(({ label, value, color }) => (
                <div key={label} className="mb-3 pb-3" style={{ borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                  <small className="text-muted d-block">{label}</small>
                  <span className="fs-5 fw-bold" style={{ color: color || tp }}>{value}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
