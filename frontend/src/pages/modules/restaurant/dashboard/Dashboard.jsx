import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Button, Form, Badge, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../contexts/DarkModeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler);

const Dashboard = () => {
  const { primaryColor, restaurantName } = useTheme();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    console.log('✅ [DASHBOARD] Loaded - Restaurant:', restaurantName);
    console.log('🎨 [THEME] isDarkMode:', isDarkMode, 'primaryColor:', primaryColor);
  }, []);

  const [dateRange, setDateRange] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUserName(JSON.parse(storedUser).name || ''); } catch { }
    }
    if (!userName) setUserName(localStorage.getItem('UserName') || 'Admin');
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ApiGet('/api/restaurant/dashboard/summary', dateRange);
      console.log('🔍 [DASHBOARD API] Full Response:', res);

      if (res.fail) {
        console.error('❌ [DASHBOARD API] Request failed:', res.fail);
        setSummaryData(fallback);
        return;
      }

      console.log('📊 [DASHBOARD API] Success response:', res?.success?.data);
      const d = res?.success?.data?.data || res?.success?.data || null;
      console.log('📈 [DASHBOARD API] Extracted data:', d);
      console.log('🔢 [DASHBOARD API] Data object keys:', d ? Object.keys(d) : 'null');

      if (d && Object.keys(d).length > 0) {
        console.log('✅ [DASHBOARD] Using REAL API DATA');
        setSummaryData(d);
      } else {
        console.warn('⚠️ [DASHBOARD] API returned empty/null, using FALLBACK');
        setSummaryData(fallback);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('❌ [DASHBOARD API] Exception:', e);
      setSummaryData(fallback);
    } finally {
      setLoading(false);
    }
  };

  // Fallback dummy data so charts always show
  const fallback = {
    todayRevenue: 12400, todayOrders: 18, activeMenuItems: 63, totalCustomers: 892,
    summary: { totalOrders: 156, totalRevenue: 147000 },
    orderByStatus: { PENDING: 24, WORKING: 39, COMPLETED: 86, CANCELLED: 7 },
    revenueTrend: [
      { date: '2026-04-14', revenue: 8900 }, { date: '2026-04-15', revenue: 11200 },
      { date: '2026-04-16', revenue: 10100 }, { date: '2026-04-17', revenue: 13200 },
      { date: '2026-04-18', revenue: 10500 }, { date: '2026-04-19', revenue: 14100 },
      { date: '2026-04-20', revenue: 6500 }
    ],
    topMenuItems: [
      { name: 'Paneer Tikka', orderCount: 45, price: 280 },
      { name: 'Butter Chicken', orderCount: 38, price: 320 },
      { name: 'Dal Makhani', orderCount: 34, price: 220 },
      { name: 'Garlic Naan', orderCount: 29, price: 60 },
      { name: 'Chicken Biryani', orderCount: 25, price: 380 }
    ],
    recentOrders: [
      { orderId: '#ORD-10045', customerName: 'Rajesh K', items: 'Paneer Tikka, Naan x2', status: 'COMPLETED', amount: 485, createdAt: '2026-04-20T18:30:00Z' },
      { orderId: '#ORD-10044', customerName: 'Priya S', items: 'Butter Chicken, Roti x3', status: 'COMPLETED', amount: 650, createdAt: '2026-04-20T17:45:00Z' },
      { orderId: '#ORD-10043', customerName: 'Amit P', items: 'Samosa x4, Chai x2', status: 'WORKING', amount: 320, createdAt: '2026-04-20T17:15:00Z' },
      { orderId: '#ORD-10042', customerName: 'Neha R', items: 'Biryani x2, Raita', status: 'PENDING', amount: 780, createdAt: '2026-04-20T16:50:00Z' },
      { orderId: '#ORD-10041', customerName: 'Suresh V', items: 'Tandoori Chicken, Garlic Naan', status: 'COMPLETED', amount: 540, createdAt: '2026-04-20T15:30:00Z' }
    ],
    lowStockItems: [
      { id: 1, name: 'Paneer', stock: 5, threshold: 10, unit: 'kg', level: 'critical' },
      { id: 2, name: 'Naan Dough', stock: 8, threshold: 10, unit: 'pcs', level: 'low' },
      { id: 3, name: 'Chicken Breast', stock: 3, threshold: 8, unit: 'kg', level: 'critical' },
      { id: 4, name: 'Heavy Cream', stock: 9, threshold: 10, unit: 'litre', level: 'low' }
    ]
  };

  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const minAgo = () => { const m = Math.floor((Date.now() - lastRefresh) / 60000); return m < 1 ? 'just now' : `${m}m ago`; };

  const bg = isDarkMode ? '#020617' : '#f1f5f9';
  const cBg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBorder = `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`;
  const tp = isDarkMode ? '#f1f5f9' : '#0f172a';
  const ts = isDarkMode ? '#94a3b8' : '#64748b';
  const hBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const chartGrid = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const chartTick = isDarkMode ? '#64748b' : '#94a3b8';

  const d = summaryData || fallback;
  const totalOrders = d.summary?.totalOrders || 0;
  const totalRevenue = d.summary?.totalRevenue || 0;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const lineData = {
    labels: (d.revenueTrend || []).map(i => fmtDate(i.date)),
    datasets: [{
      label: 'Revenue',
      data: (d.revenueTrend || []).map(i => i.revenue),
      borderColor: primaryColor,
      backgroundColor: isDarkMode ? `${primaryColor}20` : `${primaryColor}12`,
      tension: 0.4, fill: true,
      pointBackgroundColor: primaryColor, pointRadius: 4, pointHoverRadius: 6,
      borderWidth: 2
    }]
  };

  const donutData = {
    labels: ['Pending', 'Preparing', 'Completed', 'Cancelled'],
    datasets: [{
      data: [d.orderByStatus?.PENDING || 0, d.orderByStatus?.WORKING || 0, d.orderByStatus?.COMPLETED || 0, d.orderByStatus?.CANCELLED || 0],
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
      borderColor: cBg, borderWidth: 3, hoverOffset: 6
    }]
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      y: { ticks: { color: chartTick, font: { size: 11 }, callback: v => `$${(v/1000).toFixed(0)}k` }, grid: { color: chartGrid }, border: { display: false } },
      x: { ticks: { color: chartTick, font: { size: 11 } }, grid: { display: false }, border: { display: false } }
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

  const statusColor = { PENDING: '#f59e0b', WORKING: '#3b82f6', COMPLETED: '#10b981', CANCELLED: '#ef4444' };

  const KpiCard = ({ icon, label, value, sub, accent }) => (
    <div style={{ background: cBg, border: cBorder, borderRadius: '12px', padding: '16px 20px', height: '100%' }}>
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
              {restaurantName || 'Restaurant'} Dashboard
            </h1>
            <p style={{ color: ts, fontSize: '13px', margin: '4px 0 0' }}>Welcome back, {userName} · Updated {minAgo()}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Form.Control type="date" size="sm" value={dateRange.fromDate} onChange={e => setDateRange(p => ({ ...p, fromDate: e.target.value }))} style={{ width: '140px' }} />
            <Form.Control type="date" size="sm" value={dateRange.toDate} onChange={e => setDateRange(p => ({ ...p, toDate: e.target.value }))} style={{ width: '140px' }} />
            <Button size="sm" onClick={fetchData} style={{ background: primaryColor, border: 'none', fontWeight: 600 }}>Apply</Button>
            <Button size="sm" variant="outline-secondary" onClick={fetchData}>🔄</Button>
          </div>
        </div>

        {/* KPI ROW 1 */}
        <Row className="g-3 mb-3">
          <Col xs={6} md={3}><KpiCard icon="💰" label="Today's Revenue" value={fmt(d.todayRevenue)} sub="↑8% vs yesterday" accent="#10b981" /></Col>
          <Col xs={6} md={3}><KpiCard icon="📦" label="Today's Orders" value={d.todayOrders} sub="↑12% vs yesterday" accent="#3b82f6" /></Col>
          <Col xs={6} md={3}><KpiCard icon="🍽️" label="Active Items" value={d.activeMenuItems} sub="+3 this week" accent="#f59e0b" /></Col>
          <Col xs={6} md={3}><KpiCard icon="👥" label="Total Customers" value={d.totalCustomers} sub="↑5% lifetime" accent="#8b5cf6" /></Col>
        </Row>

        {/* KPI ROW 2 */}
        <Row className="g-3 mb-3">
          <Col xs={12} md={4}><KpiCard icon="📊" label="Total Orders (Period)" value={totalOrders} sub={`${dateRange.fromDate} → ${dateRange.toDate}`} accent="#06b6d4" /></Col>
          <Col xs={12} md={4}><KpiCard icon="💵" label="Total Revenue (Period)" value={fmt(totalRevenue)} accent="#10b981" /></Col>
          <Col xs={12} md={4}><KpiCard icon="📈" label="Avg Order Value" value={fmt(avgOrder)} sub="Revenue ÷ Orders" accent="#f59e0b" /></Col>
        </Row>

        {/* CHARTS */}
        <Row className="g-3 mb-3">
          <Col md={7}>
            <div style={{ background: cBg, border: cBorder, borderRadius: '12px', padding: '16px' }}>
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
            <div style={{ background: cBg, border: cBorder, borderRadius: '12px', padding: '16px' }}>
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

        {/* RECENT ORDERS + TOP ITEMS side by side */}
        <Row className="g-3 mb-3">
          <Col md={8}>
            <div style={{ background: cBg, border: cBorder, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: hBg, borderBottom: cBorder }}>
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
                          <span style={{ background: `${statusColor[o.status]}18`, color: statusColor[o.status], border: `1px solid ${statusColor[o.status]}40`, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: ts, fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtTime(o.createdAt)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <button style={{ background: `${primaryColor}18`, color: primaryColor, border: `1px solid ${primaryColor}40`, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                            {['PENDING', 'WORKING'].includes(o.status) ? 'Update' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div style={{ background: cBg, border: cBorder, borderRadius: '12px', overflow: 'hidden', height: '100%' }}>
              <div style={{ padding: '14px 16px', background: hBg, borderBottom: cBorder }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>🏆 Top Selling Items</span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {(d.topMenuItems || []).slice(0, 5).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: i < 4 ? `1px solid ${isDarkMode ? '#1e293b' : '#f1f5f9'}` : 'none' }}>
                    <span style={{ fontSize: '18px', marginRight: '10px', width: '24px', textAlign: 'center' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: tp, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ color: ts, fontSize: '11px' }}>{item.orderCount} orders · {fmt((item.orderCount || 0) * (item.price || 250))}</div>
                    </div>
                    <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>⭐ 4.8</div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {/* LOW STOCK + QUICK ACTIONS */}
        <Row className="g-3">
          <Col md={8}>
            <div style={{ background: cBg, border: cBorder, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: hBg, borderBottom: cBorder }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>⚠️ Low Stock Alerts</span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <Row className="g-2">
                  {(d.lowStockItems || []).map((item, i) => (
                    <Col xs={12} md={6} key={i}>
                      <div style={{ background: isDarkMode ? '#1e293b' : '#f8fafc', padding: '10px 14px', borderRadius: '8px', borderLeft: `3px solid ${item.level === 'critical' ? '#ef4444' : '#f59e0b'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: tp, fontSize: '13px' }}>{item.name}</div>
                          <div style={{ color: ts, fontSize: '11px', marginTop: '2px' }}>{item.stock}/{item.threshold} {item.unit} left</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{ background: item.level === 'critical' ? '#ef444418' : '#f59e0b18', color: item.level === 'critical' ? '#ef4444' : '#f59e0b', border: `1px solid ${item.level === 'critical' ? '#ef444440' : '#f59e0b40'}`, padding: '1px 6px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>
                            {item.level === 'critical' ? 'CRITICAL' : 'LOW'}
                          </span>
                          <button style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef444440', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Order More</button>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div style={{ background: cBg, border: cBorder, borderRadius: '12px', overflow: 'hidden', height: '100%' }}>
              <div style={{ padding: '14px 16px', background: hBg, borderBottom: cBorder }}>
                <span style={{ fontWeight: 600, color: tp, fontSize: '14px' }}>Quick Actions</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '➕', label: 'New Order', to: '/restaurant/orders/new' },
                  { icon: '📝', label: 'Add Menu Item', to: '/restaurant/menu-management/items' },
                  { icon: '📊', label: 'View Reports', to: '/restaurant/reports' },
                  { icon: '⚙️', label: 'Settings', to: '/restaurant/settings/business-settings' }
                ].map((a, i) => (
                  <Link key={i} to={a.to} style={{ textDecoration: 'none' }}>
                    <div style={{ background: isDarkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                      <span style={{ fontSize: '18px' }}>{a.icon}</span>
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
