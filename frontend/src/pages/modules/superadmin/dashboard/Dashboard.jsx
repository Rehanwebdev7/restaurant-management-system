import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Badge, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Line, Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  ArcElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import superadminService from '../../../../services/superadminService';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  ArcElement,
  Title, Tooltip, Legend, Filler
);

const PRIMARY = '#3B82F6';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, title, value, sub, iconColor = PRIMARY, loading, isCurrency }) => (
  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
    <Card.Body className="p-3">
      {loading ? (
        <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
      ) : (
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted mb-1" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
            <div className="fw-bold" style={{ fontSize: '26px', color: iconColor, lineHeight: 1.2 }}>
              {isCurrency ? `$${Number(value || 0).toLocaleString('en-IN')}` : Number(value || 0).toLocaleString()}
            </div>
            {sub && <div className="text-muted mt-1" style={{ fontSize: '11px' }}>{sub}</div>}
          </div>
          <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: `${iconColor}18`, flexShrink: 0 }}>
            <i className={`${icon} fs-5`} style={{ color: iconColor }}></i>
          </div>
        </div>
      )}
    </Card.Body>
  </Card>
);

// ─── Section Title ─────────────────────────────────────────────────────────────
const SectionTitle = ({ icon, title }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    <i className={`${icon} fs-5`} style={{ color: PRIMARY }}></i>
    <h6 className="mb-0 fw-bold" style={{ color: PRIMARY }}>{title}</h6>
  </div>
);

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const result = await superadminService.getDashboardData();
    if (result.success) {
      const raw = result.success.data.data;
      // Map backend field names to what this component uses
      const mapped = {
        total_orders: raw?.summary?.totalOrders ?? 0,
        total_revenue: raw?.summary?.totalRevenue ?? 0,
        today_revenue: raw?.summary?.totalRevenue ?? 0,
        pending_orders: raw?.orderByStatus?.PENDING ?? 0,
        total_restaurants: raw?.totalRestaurants ?? 0,
        active_restaurants: raw?.totalRestaurants ?? 0,
        active_subscriptions: 0,
        expiring_soon: 0,
        pending_verifications: raw?.pendingApprovals ?? 0,
        total_customers: raw?.totalCustomers ?? 0,
        monthly_revenue: (raw?.revenueTrend || []).map(r => ({ month: r.date, revenue: r.revenue })),
        order_trend: (raw?.dailyOrderTrend || []).map(r => ({ day: r.date, orders: r.orderCount ?? 0 })),
        order_status_distribution: {
          pending: raw?.orderByStatus?.PENDING ?? 0,
          preparing: 0,
          completed: raw?.orderByStatus?.COMPLETED ?? 0,
          cancelled: raw?.orderByStatus?.CANCELLED ?? 0,
        },
        restaurant_performance: (raw?.topRestaurants || []).map(r => ({
          id: r.restaurantId,
          name: r.restaurantName,
          orders: r.totalOrders,
          revenue: r.totalRevenue,
          plan: 'Basic',
          subscription_status: 'ACTIVE',
          status: 'active',
        })),
        restaurant_order_summary: (raw?.topRestaurants || []).map(r => ({
          id: r.restaurantId,
          total_orders: r.totalOrders,
          pending: r.pendingOrders,
          completed: r.completedOrders,
          cancelled: r.cancelledOrders,
        })),
        pending_verifications_list: raw?.pendingApprovalsList ?? [],
        expiring_subscriptions_list: [],
      };
      setData(mapped);
    } else {
      toast.error(result.fail || 'Failed to load dashboard');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Chart Configs ───────────────────────────────────────────────────────────

  const revenueLineChart = {
    labels: (data?.monthly_revenue || []).map(m => m.month),
    datasets: [{
      label: 'Revenue ($)',
      data: (data?.monthly_revenue || []).map(m => Number(m.revenue)),
      borderColor: PRIMARY,
      backgroundColor: `${PRIMARY}18`,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: PRIMARY,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  };

  const orderTrendChart = {
    labels: (data?.order_trend || []).map(d => d.day),
    datasets: [{
      label: 'Orders',
      data: (data?.order_trend || []).map(d => d.orders),
      borderColor: '#10b981',
      backgroundColor: '#10b98118',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  };

  const statusDist = data?.order_status_distribution || {};
  const doughnutChart = {
    labels: ['Pending', 'Preparing', 'Completed', 'Cancelled'],
    datasets: [{
      data: [statusDist.pending || 0, statusDist.preparing || 0, statusDist.completed || 0, statusDist.cancelled || 0],
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }]
  };

  const chartLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
      x: { grid: { display: false } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} orders`
        }
      }
    },
    cutout: '68%'
  };

  const subBadge = (s) => {
    if (s === 'ACTIVE') return <Badge bg="success" style={{ fontSize: '10px' }}>Active</Badge>;
    if (s === 'EXPIRING_SOON') return <Badge bg="warning" text="dark" style={{ fontSize: '10px' }}>Expiring</Badge>;
    return <Badge bg="danger" style={{ fontSize: '10px' }}>Expired</Badge>;
  };

  return (
    <Container fluid className="py-4 px-3 px-lg-4">

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0 fw-bold">Platform Overview</h4>
          <small className="text-muted">All restaurants combined — high-level summary</small>
        </div>
        <Button variant="outline-primary" size="sm" onClick={() => { fetchData(); toast.success('Refreshed!'); }}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </Button>
      </div>

      {/* ── Row 1: Restaurant Stats ── */}
      <Row className="g-3 mb-3">
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-shop" title="Total Restaurants" value={data?.total_restaurants} iconColor={PRIMARY} loading={loading} sub={`${data?.active_restaurants || 0} active`} />
        </Col>
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-credit-card-2-front" title="Active Subscriptions" value={data?.active_subscriptions} iconColor="#059669" loading={loading} sub={`${data?.expiring_soon || 0} expiring soon`} />
        </Col>
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-hourglass-split" title="Pending Approvals" value={data?.pending_verifications} iconColor="#f97316" loading={loading} sub="Awaiting review" />
        </Col>
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-people" title="Total Customers" value={data?.total_customers} iconColor="#7c3aed" loading={loading} sub="Platform-wide" />
        </Col>
      </Row>

      {/* ── Row 2: Order Stats (Combined, no customer details) ── */}
      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-bag-check" title="Total Orders" value={data?.total_orders} iconColor="#0891b2" loading={loading} sub="All restaurants" />
        </Col>
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-clock-history" title="Pending Orders" value={data?.pending_orders} iconColor="#f59e0b" loading={loading} sub="Across platform" />
        </Col>
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-currency-dollar" title="Total Revenue" value={data?.total_revenue} iconColor="#059669" loading={loading} isCurrency sub="Platform total" />
        </Col>
        <Col xl={3} md={6}>
          <StatCard icon="bi bi-calendar-day" title="Today's Revenue" value={data?.today_revenue} iconColor="#3b82f6" loading={loading} isCurrency sub="Live" />
        </Col>
      </Row>

      {/* ── Row 3: Revenue Trend + Order Status Distribution ── */}
      <Row className="g-3 mb-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <SectionTitle icon="bi bi-graph-up" title="Monthly Revenue Trend (All Restaurants)" />
              <div style={{ height: 220 }}>
                {loading ? <div className="d-flex justify-content-center align-items-center h-100"><Spinner animation="border" /></div>
                  : <Line data={revenueLineChart} options={{ ...chartLineOptions, scales: { y: { beginAtZero: true, ticks: { callback: v => `$${(v/1000).toFixed(0)}k` }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }} />}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <SectionTitle icon="bi bi-pie-chart" title="Order Status Distribution" />
              <div style={{ height: 220 }}>
                {loading ? <div className="d-flex justify-content-center align-items-center h-100"><Spinner animation="border" /></div>
                  : <Doughnut data={doughnutChart} options={doughnutOptions} />}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Row 4: Order Trend + Pending Approvals (full width, side by side) ── */}
      <Row className="g-3 mb-3">
        {/* 7-Day Order Trend — bigger card */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <SectionTitle icon="bi bi-activity" title="7-Day Order Trend" />
              <div style={{ height: 180 }}>
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center h-100"><Spinner animation="border" /></div>
                ) : (
                  <Line data={orderTrendChart} options={{ ...chartLineOptions, plugins: { legend: { display: false } } }} />
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        {/* Pending Approvals — bigger card with more entries */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', borderLeft: `4px solid #f97316` }}>
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-hourglass-split fs-5" style={{ color: '#f97316' }}></i>
                <h6 className="mb-0 fw-bold" style={{ color: '#f97316' }}>Pending Approvals</h6>
                {!loading && (data?.pending_verifications || 0) > 0 && (
                  <span className="badge rounded-pill ms-auto" style={{ background: '#f97316', fontSize: '11px' }}>
                    {data.pending_verifications} pending
                  </span>
                )}
              </div>
              {loading ? (
                <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
              ) : (data?.pending_verifications_list || []).length === 0 ? (
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>No pending approvals.</p>
              ) : (
                <div>
                  {(data?.pending_verifications_list || []).map((item, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: '13px' }}>{item.name}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{item.email || 'restaurant'}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted" style={{ fontSize: '12px' }}>{item.applied_days_ago}d ago</div>
                        <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px' }}>Pending</span>
                      </div>
                    </div>
                  ))}
                  <Link to="/superadmin/user-approvals" className="d-block mt-3 text-decoration-none fw-semibold" style={{ fontSize: '13px', color: '#f97316' }}>
                    Review All Approvals →
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Row 5: Restaurant Performance Table (Summary only, no customer info) ── */}
      <Row className="g-3">
        <Col xs={12}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <SectionTitle icon="bi bi-table" title="Restaurant Performance Summary" />
                <Link to="/superadmin/restaurants" className="text-decoration-none" style={{ fontSize: '13px', color: PRIMARY }}>
                  View All →
                </Link>
              </div>
              {loading ? (
                <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table hover responsive className="mb-0" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: PRIMARY, color: '#fff' }}>
                        {['Restaurant','Total Orders','Pending','Completed','Cancelled','Revenue','Plan','Subscription','Status'].map((h, i) => (
                          <th key={h} className={`py-2 fw-semibold ${i === 0 ? 'ps-3' : 'text-center'}`} style={{ color: '#fff', fontSize: '12px', letterSpacing: '0.3px', border: 'none', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.restaurant_performance || []).map((r, i) => {
                        const summary = (data?.restaurant_order_summary || []).find(s => s.id === r.id) || {};
                        return (
                          <tr key={i}>
                            <td className="py-2 ps-3 fw-semibold">{r.name}</td>
                            <td className="py-2 text-center">{summary.total_orders ?? r.orders}</td>
                            <td className="py-2 text-center">
                              <span className="fw-semibold" style={{ color: '#f59e0b' }}>{summary.pending ?? '—'}</span>
                            </td>
                            <td className="py-2 text-center">
                              <span className="fw-semibold" style={{ color: '#10b981' }}>{summary.completed ?? '—'}</span>
                            </td>
                            <td className="py-2 text-center">
                              <span className="fw-semibold" style={{ color: '#ef4444' }}>{summary.cancelled ?? '—'}</span>
                            </td>
                            <td className="py-2 text-center fw-bold" style={{ color: '#059669' }}>
                              ${Number(r.revenue).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 text-center">
                              <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>{r.plan}</Badge>
                            </td>
                            <td className="py-2 text-center">{subBadge(r.subscription_status)}</td>
                            <td className="py-2 text-center">
                              <Badge
                                bg={r.status === 'active' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}
                                text={r.status === 'pending' ? 'dark' : undefined}
                                style={{ fontSize: '11px' }}
                              >
                                {r.status === 'active' ? 'Active' : r.status === 'pending' ? 'Pending' : 'Suspended'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Expiring Subscriptions Alert ── */}
      {!loading && (data?.expiring_subscriptions_list || []).length > 0 && (
        <Row className="g-3 mt-1">
          <Col xs={12}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', borderLeft: `4px solid #ef4444` }}>
              <Card.Body className="py-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-exclamation-circle-fill text-danger"></i>
                  <span className="fw-semibold" style={{ fontSize: '13px' }}>Subscriptions Expiring Soon</span>
                </div>
                <div className="d-flex flex-wrap gap-3">
                  {(data?.expiring_subscriptions_list || []).map((item, i) => (
                    <div key={i} className="px-3 py-2 rounded-3" style={{ background: '#fef2f2', fontSize: '12px' }}>
                      <span className="fw-semibold">{item.name}</span>
                      <span className="text-danger ms-2">— {item.expires_in_days}d left</span>
                    </div>
                  ))}
                  <Link to="/superadmin/subscriptions" className="ms-auto align-self-center text-decoration-none" style={{ fontSize: '12px', color: '#ef4444' }}>
                    Manage Subscriptions →
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

    </Container>
  );
};

export default Dashboard;
