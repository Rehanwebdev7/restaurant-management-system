import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../contexts/DarkModeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler);

const Dashboard = () => {
  const { primaryColor } = useTheme();
  const { isDarkMode } = useDarkMode();

  const [dateRange, setDateRange] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    let name = '';
    if (stored) { try { name = JSON.parse(stored).name || ''; } catch { } }
    setUserName(name || localStorage.getItem('UserName') || 'Branch Manager');
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ApiGet('/api/branch/dashboard/summary', dateRange);
      const d = res?.success?.data?.data || res?.success?.data || null;
      setData(d && Object.keys(d).length > 0 ? d : fallback);
      setLastRefresh(new Date());
    } catch {
      setData(fallback);
    } finally {
      setLoading(false);
    }
  };

  const fallback = {
    branchName: 'Main Branch',
    totalOrders: 40,
    totalRevenue: 87500,
    averageOrderValue: 2187,
    walletBalance: 4250,
    pendingOutstanding: 1800,
    ordersByStatus: { PENDING: 12, WORKING: 8, COMPLETED: 16, CANCELLED: 4, UNKNOWN: 0 },
    revenueTrend: [
      { date: '2026-04-14', revenue: 8900, orders: 24 },
      { date: '2026-04-15', revenue: 11200, orders: 31 },
      { date: '2026-04-16', revenue: 9800, orders: 27 },
      { date: '2026-04-17', revenue: 13500, orders: 38 },
      { date: '2026-04-18', revenue: 10200, orders: 29 },
      { date: '2026-04-19', revenue: 14800, orders: 42 },
      { date: '2026-04-20', revenue: 12400, orders: 35 }
    ],
    topMenuItems: [
      { name: 'Crunchy Chicken Bucket', orderCount: 48, revenue: 14400 },
      { name: 'Chicken Biryani', orderCount: 35, revenue: 12250 },
      { name: 'Paneer Tikka', orderCount: 29, revenue: 8120 },
      { name: 'Garlic Naan', orderCount: 22, revenue: 1320 },
      { name: 'Dal Makhani', orderCount: 18, revenue: 3960 }
    ],
    recentOrders: [
      { orderId: '#ORD-2031', customerName: 'Rahul M', items: 'Chicken Biryani x2', status: 'COMPLETED', amount: 700, createdAt: '2026-04-20T18:30:00Z' },
      { orderId: '#ORD-2032', customerName: 'Priya S', items: 'Paneer Tikka, Naan x2', status: 'PENDING', amount: 485, createdAt: '2026-04-20T17:45:00Z' },
      { orderId: '#ORD-2033', customerName: 'Amit K', items: 'Crunchy Chicken Bucket', status: 'WORKING', amount: 299, createdAt: '2026-04-20T17:20:00Z' },
      { orderId: '#ORD-2034', customerName: 'Neha R', items: 'Dal Makhani, Roti x3', status: 'COMPLETED', amount: 320, createdAt: '2026-04-20T16:50:00Z' },
      { orderId: '#ORD-2035', customerName: 'Suresh V', items: 'Garlic Naan x4', status: 'CANCELLED', amount: 240, createdAt: '2026-04-20T16:10:00Z' }
    ]
  };

  const fmt = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const fmtTime = d => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const minAgo = () => { const m = Math.floor((Date.now() - lastRefresh) / 60000); return m < 1 ? 'just now' : `${m}m ago`; };

  const bg    = isDarkMode ? '#020617' : '#f1f5f9';
  const cBg   = isDarkMode ? '#0f172a' : '#ffffff';
  const cBord = `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`;
  const tp    = isDarkMode ? '#f1f5f9' : '#0f172a';
  const ts    = isDarkMode ? '#94a3b8' : '#64748b';
  const hBg   = isDarkMode ? '#1e293b' : '#f8fafc';
  const cGrid = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const cTick = isDarkMode ? '#64748b' : '#94a3b8';

  const d = data || fallback;
  const totalOrders  = d.totalOrders || 0;
  const totalRevenue = d.totalRevenue || 0;
  const avgOrder     = d.averageOrderValue || (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0);
  const statusColor  = { PENDING: '#f59e0b', WORKING: '#3b82f6', COMPLETED: '#10b981', CANCELLED: '#ef4444', UNKNOWN: '#6b7280' };

  const lineData = {
    labels: (d.revenueTrend || []).map(i => fmtDate(i.date)),
    datasets: [{
      label: 'Revenue',
      data: (d.revenueTrend || []).map(i => i.revenue),
      borderColor: primaryColor,
      backgroundColor: isDarkMode ? `${primaryColor}20` : `${primaryColor}12`,
      tension: 0.4, fill: true,
      pointBackgroundColor: primaryColor, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2
    }]
  };

  const donutLabels = Object.keys(d.ordersByStatus || {}).filter(k => (d.ordersByStatus[k] || 0) > 0);
  const donutData = {
    labels: donutLabels,
    datasets: [{
      data: donutLabels.map(k => d.ordersByStatus[k]),
      backgroundColor: donutLabels.map(k => statusColor[k] || '#6b7280'),
      borderColor: cBg, borderWidth: 3, hoverOffset: 6
    }]
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      y: { ticks: { color: cTick, font: { size: 11 }, callback: v => `$${(v / 1000).toFixed(0)}k` }, grid: { color: cGrid }, border: { display: false } },
      x: { ticks: { color: cTick, font: { size: 11 } }, grid: { display: false }, border: { display: false } }
    }
  };

  const donutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: ts, font: { size: 12 }, padding: 12, usePointStyle: true } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} orders` } }
    },
    cutout: '65%'
  };

  const KpiCard = ({ icon, label, value, sub, accent }) => (
    <div style={{ background: cBg, border: cBord, borderRadius: '12px', padding: '16px 20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: ts, marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: tp, lineHeight: 1.2 }}>{value}</div>
          {sub && <div style={{ fontSize: '12px', color: accent || '#10b981', marginTop: '6px', fontWeight: 500 }}>{sub}</div>}
        </div>
        <div style={{ width: '40px', height: '40px', background: `${accent || primaryColor}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner style={{ color: primaryColor }} />
    </div>
  );

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: '20px 24px' }}>
      <Container fluid className="p-0">

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: tp, margin: 0 }}>
              {d.branchName || 'Branch'} Dashboard
            </h1>
            <p style={{ color: ts, fontSize: '13px', margin: '4px 0 0' }}>
              Welcome back, {userName} · Updated {minAgo()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Form.Control type="date" size="sm" value={dateRange.fromDate}
              onChange={e => setDateRange(p => ({ ...p, fromDate: e.target.value }))}
              style={{ width: '140px' }} />
            <Form.Control type="date" size="sm" value={dateRange.toDate}
              onChange={e => setDateRange(p => ({ ...p, toDate: e.target.value }))}
              style={{ width: '140px' }} />
            <Button size="sm" onClick={fetchData} style={{ background: primaryColor, border: 'none', fontWeight: 600 }}>Apply</Button>
            <Button size="sm" variant="outline-secondary" onClick={fetchData}>🔄</Button>
          </div>
        </div>

        {/* KPI CARDS */}
        <Row className="g-3 mb-3">
          <Col xs={6} md={3}>
            <KpiCard icon="📦" label="Total Orders" value={totalOrders}
              sub={`${dateRange.fromDate} → ${dateRange.toDate}`} accent="#3b82f6" />
          </Col>
          <Col xs={6} md={3}>
            <KpiCard icon="💰" label="Total Revenue" value={fmt(totalRevenue)}
              sub="Branch sales" accent="#10b981" />
          </Col>
          <Col xs={6} md={3}>
            <KpiCard icon="📈" label="Avg Order Value" value={fmt(avgOrder)}
              sub="Revenue ÷ Orders" accent="#f59e0b" />
          </Col>
          <Col xs={6} md={3}>
            <KpiCard icon="💳" label="Wallet Balance" value={fmt(d.walletBalance || 0)}
              sub={`Outstanding: ${fmt(d.pendingOutstanding || 0)}`} accent="#8b5cf6" />
          </Col>
        </Row>

        {/* CHARTS */}
        <Row className="g-3 mb-3">
          <Col md={7}>
            <div style={{ background: cBg, border: cBord, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>Revenue Trend</span>
                <span style={{ fontSize: '11px', color: ts }}>Last 7 days</span>
              </div>
              <div style={{ height: '180px' }}>
                <Line data={lineData} options={lineOpts} />
              </div>
            </div>
          </Col>
          <Col md={5}>
            <div style={{ background: cBg, border: cBord, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>Orders by Status</span>
                <span style={{ fontSize: '11px', color: ts }}>This period</span>
              </div>
              <div style={{ height: '180px' }}>
                <Doughnut data={donutData} options={donutOpts} />
              </div>
            </div>
          </Col>
        </Row>

        {/* RECENT ORDERS + TOP ITEMS */}
        <Row className="g-3 mb-3">
          <Col md={8}>
            <div style={{ background: cBg, border: cBord, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: hBg, borderBottom: cBord }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>Recent Orders</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: hBg }}>
                      {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Time', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, color: ts, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(d.recentOrders || []).map((o, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${isDarkMode ? '#1e293b' : '#f1f5f9'}` }}>
                        <td style={{ padding: '10px 14px', color: primaryColor, fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{o.orderId}</td>
                        <td style={{ padding: '10px 14px', color: tp, fontSize: '13px', whiteSpace: 'nowrap' }}>{o.customerName}</td>
                        <td style={{ padding: '10px 14px', color: ts, fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.items}</td>
                        <td style={{ padding: '10px 14px', color: tp, fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{fmt(o.amount)}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: `${statusColor[o.status] || '#6b7280'}18`, color: statusColor[o.status] || '#6b7280', border: `1px solid ${statusColor[o.status] || '#6b7280'}40`, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: ts, fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtTime(o.createdAt)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <Link to="/branch/orders/list" style={{ background: `${primaryColor}18`, color: primaryColor, border: `1px solid ${primaryColor}40`, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>
                            {['PENDING', 'WORKING'].includes(o.status) ? 'Update' : 'View'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div style={{ background: cBg, border: cBord, borderRadius: '12px', overflow: 'hidden', height: '100%' }}>
              <div style={{ padding: '14px 16px', background: hBg, borderBottom: cBord }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>🏆 Top Selling Items</span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {(d.topMenuItems || []).slice(0, 5).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: i < 4 ? `1px solid ${isDarkMode ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                    <span style={{ fontSize: '18px', marginRight: '10px', width: '24px', textAlign: 'center' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: tp, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || item.menuItemName}</div>
                      <div style={{ color: ts, fontSize: '11px' }}>{item.orderCount || item.count || 0} orders · {fmt(item.revenue || 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {/* QUICK ACTIONS */}
        <Row className="g-3">
          <Col md={12}>
            <div style={{ background: cBg, border: cBord, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: hBg, borderBottom: cBord }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>Quick Actions</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { icon: '📋', label: 'All Orders', to: '/branch/orders/list' },
                  { icon: '🆕', label: 'New Orders', to: '/branch/orders/new' },
                  { icon: '⏳', label: 'Outstanding', to: '/branch/outstanding/delivery' },
                  { icon: '💳', label: 'Wallet', to: '/branch/wallet-topup/requests' },
                  { icon: '👥', label: 'User Management', to: '/branch/user-management/cashier' },
                  { icon: '⚙️', label: 'Bank Details', to: '/branch/settings/bank-details' }
                ].map((a, i) => (
                  <Link key={i} to={a.to} style={{ textDecoration: 'none', flex: '1 1 150px' }}>
                    <div style={{ background: isDarkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '20px' }}>{a.icon}</span>
                      <span style={{ fontWeight: 500, color: tp, fontSize: '14px' }}>{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default Dashboard;
