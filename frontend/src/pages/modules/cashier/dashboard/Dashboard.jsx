import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import { useTheme } from '../../../../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement, Filler);

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { primaryColor } = useTheme();

  const bg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const cBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tp = isDarkMode ? '#e2e8f0' : '#1e293b';
  const ts = isDarkMode ? '#cbd5e1' : '#64748b';
  const hBg = isDarkMode ? '#475569' : '#f1f5f9';

  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ fromDate: today, toDate: today });
  const [data, setData] = useState({
    cashierName: 'Cashier User',
    branchName: 'RMS Central - Main Branch',
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    ordersByStatus: { PENDING: 0, WORKING: 0, COMPLETED: 0, CANCELLED: 0 },
    ordersByType: { DINING: 0, TAKEAWAY: 0, DELIVERY: 0 },
    ordersByPayment: { Cash: 0, Online: 0, Card: 0 },
    revenueTrend: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/cashier/dashboard/summary', {
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate
      });
      if (result.success?.data?.data) {
        setData(result.success.data.data);
      }
    } catch (err) {
      // Use fallback data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value || 0);

  const KpiCard = ({ label, value, color, icon }) => (
    <div style={{
      background: cBg,
      border: `1px solid ${cBorder}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }}>
      <div>
        <div style={{ fontSize: '12px', color: ts, marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: tp }}>{value}</div>
      </div>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '8px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px'
      }}>
        {icon}
      </div>
    </div>
  );

  const filteredRevenueTrend = data.revenueTrend || [];
  const revenueTrendLabels = filteredRevenueTrend.map(d => d.hour || d.time || '');
  const revenueTrendValues = filteredRevenueTrend.map(d => d.revenue || 0);

  const typeLabels = ['Dining', 'Takeaway', 'Delivery'];
  const typeValues = [
    data.ordersByType?.DINING || 0,
    data.ordersByType?.TAKEAWAY || 0,
    data.ordersByType?.DELIVERY || 0
  ];

  const paymentLabels = Object.keys(data.ordersByPayment || {}).filter(k => data.ordersByPayment[k] > 0);
  const paymentValues = Object.values(data.ordersByPayment || {}).filter(v => v > 0);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, labels: { color: ts, boxWidth: 12 } },
      tooltip: { backgroundColor: hBg, borderColor: cBorder, borderWidth: 1, titleColor: tp, bodyColor: tp }
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: ts }, grid: { color: cBorder }, border: { color: cBorder } },
      x: { ticks: { color: ts }, grid: { color: cBorder }, border: { color: cBorder } }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, labels: { color: ts, boxWidth: 12 } },
      tooltip: { backgroundColor: hBg, borderColor: cBorder, borderWidth: 1, titleColor: tp, bodyColor: tp }
    }
  };

  const statusColors = {
    PENDING: '#ef4444',
    WORKING: '#f59e0b',
    COMPLETED: '#10b981',
    CANCELLED: '#6366f1'
  };

  const typeColors = ['#3b82f6', '#f59e0b', '#ef4444'];
  const paymentColors = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: tp, margin: '0 0 8px 0' }}>
              💳 Cashier Dashboard
            </h1>
            <p style={{ color: ts, margin: 0, fontSize: '14px' }}>
              {data.cashierName} • {data.branchName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(p => ({ ...p, fromDate: e.target.value }))}
              style={{
                padding: '8px 12px',
                border: `1px solid ${cBorder}`,
                borderRadius: '8px',
                background: cBg,
                color: tp,
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(p => ({ ...p, toDate: e.target.value }))}
              style={{
                padding: '8px 12px',
                border: `1px solid ${cBorder}`,
                borderRadius: '8px',
                background: cBg,
                color: tp,
                fontSize: '14px'
              }}
            />
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: primaryColor,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: ts }}>Loading...</div>
        ) : (
          <>
            {/* KPI Cards - Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <KpiCard label="Today's Orders" value={data.totalOrders} color="#3b82f6" icon="📦" />
              <KpiCard label="Today's Revenue" value={formatCurrency(data.totalRevenue)} color="#10b981" icon="💵" />
              <KpiCard label="Pending Orders" value={data.pendingOrders} color="#f59e0b" icon="⏳" />
              <KpiCard label="Avg Order Value" value={formatCurrency(data.averageOrderValue)} color="#8b5cf6" icon="📊" />
            </div>

            {/* Charts - Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                background: cBg,
                border: `1px solid ${cBorder}`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: tp, marginBottom: '16px' }}>📈 Hourly Revenue Trend</h3>
                {filteredRevenueTrend.length > 0 ? (
                  <Line
                    data={{
                      labels: revenueTrendLabels,
                      datasets: [{
                        label: 'Revenue',
                        data: revenueTrendValues,
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}20`,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: primaryColor,
                        pointRadius: 4
                      }]
                    }}
                    options={lineChartOptions}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: ts, padding: '40px' }}>No data available</div>
                )}
              </div>

              <div style={{
                background: cBg,
                border: `1px solid ${cBorder}`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: tp, marginBottom: '16px' }}>🍽️ Orders by Type</h3>
                {typeValues.some(v => v > 0) ? (
                  <Doughnut
                    data={{
                      labels: typeLabels,
                      datasets: [{
                        data: typeValues,
                        backgroundColor: typeColors
                      }]
                    }}
                    options={doughnutChartOptions}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: ts, padding: '40px' }}>No data available</div>
                )}
              </div>
            </div>

            {/* Payment Summary - Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                background: cBg,
                border: `1px solid ${cBorder}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: ts, marginBottom: '8px' }}>Cash</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                  {formatCurrency(data.ordersByPayment?.Cash || 0)}
                </div>
              </div>
              <div style={{
                background: cBg,
                border: `1px solid ${cBorder}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: ts, marginBottom: '8px' }}>Card</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                  {formatCurrency(data.ordersByPayment?.Card || 0)}
                </div>
              </div>
              <div style={{
                background: cBg,
                border: `1px solid ${cBorder}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: ts, marginBottom: '8px' }}>Online</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                  {formatCurrency(data.ordersByPayment?.Online || 0)}
                </div>
              </div>
            </div>

            {/* My Orders Table - Row 4 */}
            <div style={{
              background: cBg,
              border: `1px solid ${cBorder}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: tp, marginBottom: '16px' }}>🛒 Orders Created by Me</h3>
              {(data.recentOrders || []).length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${cBorder}` }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: ts, fontSize: '12px', fontWeight: '600' }}>Order ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: ts, fontSize: '12px', fontWeight: '600' }}>Customer</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: ts, fontSize: '12px', fontWeight: '600' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: ts, fontSize: '12px', fontWeight: '600' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: ts, fontSize: '12px', fontWeight: '600' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: ts, fontSize: '12px', fontWeight: '600' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${cBorder}` }}>
                          <td style={{ padding: '12px', color: tp, fontSize: '13px' }}>{order.orderId}</td>
                          <td style={{ padding: '12px', color: tp, fontSize: '13px' }}>{order.customerName}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: '#3b82f620',
                              color: '#3b82f6',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {order.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: tp, fontSize: '13px', fontWeight: '600' }}>{formatCurrency(order.amount)}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: order.status === 'PENDING' ? '#ef444420' : '#10b98120',
                              color: order.status === 'PENDING' ? '#ef4444' : '#10b981',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: ts, fontSize: '13px' }}>
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: ts }}>No orders yet</div>
              )}
            </div>

            {/* Quick Actions - Row 5 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {[
                { icon: '🚗', label: 'New Delivery', to: '/cashier/delivery' },
                { icon: '📦', label: 'New Takeaway', to: '/cashier/takeaway' },
                { icon: '🪑', label: 'Dine-In Tables', to: '/cashier/dining-tables' },
                { icon: '📋', label: 'All Orders', to: '/cashier/operations/orders' },
                { icon: '⏳', label: 'Outstanding', to: '/cashier/outstanding/delivery' },
                { icon: '💳', label: 'Wallet', to: '/cashier/wallet-topup/requests' }
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.to)}
                  style={{
                    background: cBg,
                    border: `1px solid ${cBorder}`,
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    color: tp
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = primaryColor;
                    e.target.style.background = `${primaryColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = cBorder;
                    e.target.style.background = cBg;
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{action.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{action.label}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
