import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import { useTheme } from '../../../../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const MOCK_DATA = {
  newOrders: 8,
  preparing: 5,
  ready: 3,
  totalOrders: 24,
  avgPrepTime: 18,
  chefName: 'Kitchen User',
  branchName: 'Main Branch',
  fromDate: '2024-01-01',
  toDate: new Date().toISOString().split('T')[0],
  ordersByStatus: {
    PENDING: 3,
    PREPARING_ORDER: 5,
    READY_FOR_ORDER: 3,
    COMPLETED: 13,
    CANCELLED: 0
  },
  hourlyTrend: [
    { hour: '9AM', orders: 2 },
    { hour: '10AM', orders: 5 },
    { hour: '11AM', orders: 8 },
    { hour: '12PM', orders: 12 },
    { hour: '1PM', orders: 9 },
    { hour: '2PM', orders: 6 },
    { hour: '3PM', orders: 4 }
  ],
  recentOrders: [
    { orderId: 'ORD-001', type: 'DINING', itemsCount: 3, status: 'PENDING', createdAt: '2 min ago' },
    { orderId: 'ORD-002', type: 'TAKEAWAY', itemsCount: 1, status: 'PREPARING', createdAt: '8 min ago' },
    { orderId: 'ORD-003', type: 'DELIVERY', itemsCount: 5, status: 'READY', createdAt: '15 min ago' },
    { orderId: 'ORD-004', type: 'DINING', itemsCount: 2, status: 'COMPLETED', createdAt: '22 min ago' },
    { orderId: 'ORD-005', type: 'TAKEAWAY', itemsCount: 4, status: 'CANCELLED', createdAt: '30 min ago' }
  ]
};

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
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/kitchen/dashboard/summary', {
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate
      });

      if (result.success?.data?.data) {
        const raw = result.success.data.data;

        const ordersByStatus = raw.ordersByStatus || {};
        const newOrders =
          (ordersByStatus.PENDING || 0) +
          (ordersByStatus.ACCEPTED || 0) +
          (ordersByStatus.ACCEPTED_ORDER || 0);
        const preparing = raw.preparingOrders || ordersByStatus.PREPARING_ORDER || 0;
        const ready =
          raw.readyOrders ||
          (ordersByStatus.READY_FOR_ORDER || 0) +
          (ordersByStatus.READYFORORDER || 0);

        setData({
          ...MOCK_DATA,
          ...raw,
          newOrders,
          preparing,
          ready,
          totalOrders: raw.totalOrders || 0,
          ordersByStatus: raw.ordersByStatus || MOCK_DATA.ordersByStatus,
          hourlyTrend: raw.hourlyTrend || MOCK_DATA.hourlyTrend,
          recentOrders: raw.recentOrders || MOCK_DATA.recentOrders
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const KpiCard = ({ label, value, color, icon }) => (
    <div
      style={{
        background: cBg,
        border: `1px solid ${cBorder}`,
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}
    >
      <div>
        <div style={{ fontSize: '12px', color: ts, marginBottom: '8px' }}>
          {label}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: tp }}>
          {value}
        </div>
      </div>
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px'
        }}
      >
        {icon}
      </div>
    </div>
  );

  const badgeStyle = (status) => {
    const map = {
      PENDING: { bg: '#f59e0b20', color: '#f59e0b' },
      PREPARING: { bg: '#3b82f620', color: '#3b82f6' },
      PREPARING_ORDER: { bg: '#3b82f620', color: '#3b82f6' },
      READY: { bg: '#10b98120', color: '#10b981' },
      READY_FOR_ORDER: { bg: '#10b98120', color: '#10b981' },
      COMPLETED: { bg: '#14b8a620', color: '#14b8a6' },
      CANCELLED: { bg: '#ef444420', color: '#ef4444' }
    };
    const s = map[status] || { bg: '#64748b20', color: '#64748b' };
    return {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      background: s.bg,
      color: s.color
    };
  };

  const hourlyTrend = data.hourlyTrend || [];
  const lineLabels = hourlyTrend.map((d) => d.hour || d.time || '');
  const lineValues = hourlyTrend.map((d) => d.orders || d.count || 0);

  const statusKeys = [
    'PENDING',
    'PREPARING_ORDER',
    'READY_FOR_ORDER',
    'COMPLETED',
    'CANCELLED'
  ];
  const statusLabels = [
    'Pending',
    'Preparing',
    'Ready',
    'Completed',
    'Cancelled'
  ];
  const statusValues = statusKeys.map((k) => data.ordersByStatus?.[k] || 0);
  const statusColors = ['#f59e0b', '#3b82f6', '#10b981', '#14b8a6', '#ef4444'];

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: { color: ts, boxWidth: 12 }
      },
      tooltip: {
        backgroundColor: hBg,
        borderColor: cBorder,
        borderWidth: 1,
        titleColor: tp,
        bodyColor: tp
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: ts },
        grid: { color: cBorder },
        border: { color: cBorder }
      },
      x: {
        ticks: { color: ts },
        grid: { color: cBorder },
        border: { color: cBorder }
      }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: { color: ts, boxWidth: 12 }
      },
      tooltip: {
        backgroundColor: hBg,
        borderColor: cBorder,
        borderWidth: 1,
        titleColor: tp,
        bodyColor: tp
      }
    }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: tp,
                margin: '0 0 8px 0'
              }}
            >
              🍳 Kitchen Dashboard
            </h1>
            <p style={{ color: ts, margin: 0, fontSize: '14px' }}>
              {data.chefName || 'Kitchen User'} • {data.branchName || 'Branch'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) =>
                setDateRange((p) => ({ ...p, fromDate: e.target.value }))
              }
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
              onChange={(e) =>
                setDateRange((p) => ({ ...p, toDate: e.target.value }))
              }
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
                background: primaryColor || '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading && Object.keys(data).length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: ts
            }}
          >
            Loading...
          </div>
        ) : (
          <>
            {/* Row 1: KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}
            >
              <KpiCard
                label="NEW ORDERS"
                value={data.newOrders}
                color="#f59e0b"
                icon="🍳"
              />
              <KpiCard
                label="PREPARING"
                value={data.preparing}
                color="#3b82f6"
                icon="⏰"
              />
              <KpiCard
                label="READY"
                value={data.ready}
                color="#10b981"
                icon="✅"
              />
              <KpiCard
                label="TOTAL ORDERS"
                value={data.totalOrders}
                color="#8b5cf6"
                icon="📦"
              />
            </div>

            {/* Row 2: Charts */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '16px',
                marginBottom: '24px'
              }}
            >
              {/* Line Chart */}
              <div
                style={{
                  background: cBg,
                  border: `1px solid ${cBorder}`,
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: tp,
                    marginBottom: '16px',
                    margin: '0 0 16px 0'
                  }}
                >
                  📈 Hourly Order Trend
                </h3>
                {lineValues.some((v) => v > 0) ? (
                  <Line
                    data={{
                      labels: lineLabels,
                      datasets: [
                        {
                          label: 'Orders',
                          data: lineValues,
                          borderColor: primaryColor || '#3b82f6',
                          backgroundColor: `${primaryColor || '#3b82f6'}20`,
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointBackgroundColor: primaryColor || '#3b82f6',
                          pointRadius: 4
                        }
                      ]
                    }}
                    options={lineChartOptions}
                  />
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      color: ts,
                      padding: '40px'
                    }}
                  >
                    No trend data available
                  </div>
                )}
              </div>

              {/* Doughnut Chart */}
              <div
                style={{
                  background: cBg,
                  border: `1px solid ${cBorder}`,
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: tp,
                    marginBottom: '16px',
                    margin: '0 0 16px 0'
                  }}
                >
                  🍽️ Order Status Breakdown
                </h3>
                {statusValues.some((v) => v > 0) ? (
                  <Doughnut
                    data={{
                      labels: statusLabels,
                      datasets: [
                        {
                          data: statusValues,
                          backgroundColor: statusColors
                        }
                      ]
                    }}
                    options={doughnutChartOptions}
                  />
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      color: ts,
                      padding: '40px'
                    }}
                  >
                    No status data available
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Performance Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}
            >
              {[
                {
                  label: '⚡ Avg Prep Time',
                  value: `${data.avgPrepTime || '—'} min`,
                  color: '#f59e0b'
                },
                {
                  label: '✅ Completed',
                  value: data.ordersByStatus?.COMPLETED || 0,
                  color: '#10b981'
                },
                {
                  label: '❌ Cancelled',
                  value: data.ordersByStatus?.CANCELLED || 0,
                  color: '#ef4444'
                }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: cBg,
                    border: `1px solid ${cBorder}`,
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: ts,
                      marginBottom: '8px'
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: stat.color
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Row 4: Info Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}
            >
              {/* Branch Name */}
              <div
                style={{
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}
                  >
                    🏢
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.8)',
                        textTransform: 'uppercase'
                      }}
                    >
                      Branch Name
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#fff'
                      }}
                    >
                      {data.branchName || 'Main Branch'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chef Name */}
              <div
                style={{
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}
                  >
                    👨‍🍳
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.8)',
                        textTransform: 'uppercase'
                      }}
                    >
                      Chef
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#fff'
                      }}
                    >
                      {data.chefName || 'Kitchen User'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div
                style={{
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}
                  >
                    📅
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.8)',
                        textTransform: 'uppercase'
                      }}
                    >
                      Date Range
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#fff'
                      }}
                    >
                      {data.fromDate} — {data.toDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Recent Orders Table */}
            <div
              style={{
                background: cBg,
                border: `1px solid ${cBorder}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: tp,
                  marginBottom: '16px',
                  margin: '0 0 16px 0'
                }}
              >
                🛒 Recent Orders
              </h3>
              {(data.recentOrders || []).length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse'
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: `1px solid ${cBorder}`
                        }}
                      >
                        {['Order #', 'Type', 'Items', 'Status', 'Created At'].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                padding: '12px',
                                textAlign: 'left',
                                color: ts,
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: `1px solid ${cBorder}`
                          }}
                        >
                          <td
                            style={{
                              padding: '12px',
                              color: tp,
                              fontSize: '13px'
                            }}
                          >
                            {order.orderId}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#3b82f620',
                                color: '#3b82f6',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {order.type}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              color: tp,
                              fontSize: '13px'
                            }}
                          >
                            {order.itemsCount}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={badgeStyle(order.status)}>
                              {order.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              color: ts,
                              fontSize: '13px'
                            }}
                          >
                            {order.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: ts
                  }}
                >
                  No recent orders
                </div>
              )}
            </div>

            {/* Row 6: Quick Actions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}
            >
              {[
                {
                  icon: '🖥️',
                  label: 'Kitchen Display',
                  to: '/kitchen/display'
                },
                {
                  icon: '📋',
                  label: 'Order History',
                  to: '/kitchen/order-history'
                },
                {
                  icon: '📊',
                  label: 'Reports',
                  to: '/kitchen/reports'
                }
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
                    e.currentTarget.style.borderColor =
                      primaryColor || '#3b82f6';
                    e.currentTarget.style.background = `${
                      primaryColor || '#3b82f6'
                    }10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = cBorder;
                    e.currentTarget.style.background = cBg;
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                    {action.icon}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>
                    {action.label}
                  </div>
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
