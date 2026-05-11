import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../contexts/DarkModeContext';

const Dashboard = () => {
  const { primaryColor } = useTheme();
  const { isDarkMode } = useDarkMode();
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  const [summaryData, setSummaryData] = useState({
    summary: {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      period: { fromDate: '', toDate: '' }
    },
    orderByStatus: {
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      UNKNOWN: 0,
      WORKING: 0
    },
    revenueTrend: [],
    topRestaurants: [],
    topMenuItems: []
  });

  const [loading, setLoading] = useState({ summary: false });
  const [error, setError] = useState({ summary: '' });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState({});
  const animationRef = useRef({});

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  // Animate numbers on data change
  useEffect(() => {
    const targets = {
      totalOrders: summaryData.summary.totalOrders,
      totalRevenue: summaryData.summary.totalRevenue,
      avgOrderValue: summaryData.summary.averageOrderValue
    };

    Object.entries(targets).forEach(([key, target]) => {
      if (animationRef.current[key]) cancelAnimationFrame(animationRef.current[key]);
      const start = animatedValues[key] || 0;
      const duration = 800;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;

        setAnimatedValues(prev => ({ ...prev, [key]: current }));
        if (progress < 1) {
          animationRef.current[key] = requestAnimationFrame(animate);
        }
      };
      animationRef.current[key] = requestAnimationFrame(animate);
    });

    return () => Object.values(animationRef.current).forEach(cancelAnimationFrame);
  }, [summaryData.summary]);

  const fetchDashboardSummary = async () => {
    setLoading(prev => ({ ...prev, summary: true }));
    setError(prev => ({ ...prev, summary: '' }));

    try {
      const result = await ApiGet('/api/admin/dashboard/summary', {
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate
      });

      if (result.success) {
        setSummaryData(result.success.data.data);
        setLastRefresh(new Date());
      } else {
        setError(prev => ({ ...prev, summary: result.fail }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, summary: 'Failed to fetch dashboard data' }));
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    fetchDashboardSummary();
  };

  const handleRefresh = () => {
    fetchDashboardSummary();
    toast.success('Dashboard refreshed');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return Math.round(value || 0).toLocaleString('en-IN');
  };

  const totalOrders = Object.values(summaryData.orderByStatus).reduce((a, b) => a + b, 0);

  const statusConfig = {
    PENDING: {
      color: isDarkMode ? '#fbbf24' : '#f59e0b',
      bg: isDarkMode ? 'rgba(251, 191, 36, 0.15)' : '#fef3c7',
      icon: 'bi-clock-fill',
      label: 'Pending'
    },
    COMPLETED: {
      color: isDarkMode ? '#34d399' : '#10b981',
      bg: isDarkMode ? 'rgba(52, 211, 153, 0.15)' : '#d1fae5',
      icon: 'bi-check-circle-fill',
      label: 'Completed'
    },
    CANCELLED: {
      color: isDarkMode ? '#f87171' : '#ef4444',
      bg: isDarkMode ? 'rgba(248, 113, 113, 0.15)' : '#fee2e2',
      icon: 'bi-x-circle-fill',
      label: 'Cancelled'
    },
    WORKING: {
      color: isDarkMode ? '#60a5fa' : '#3b82f6',
      bg: isDarkMode ? 'rgba(96, 165, 250, 0.15)' : '#dbeafe',
      icon: 'bi-arrow-repeat',
      label: 'Working'
    },
    UNKNOWN: {
      color: isDarkMode ? '#94a3b8' : '#6b7280',
      bg: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : '#f3f4f6',
      icon: 'bi-question-circle-fill',
      label: 'Unknown'
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: formatNumber(animatedValues.totalOrders || 0),
      icon: 'bi-bag-check-fill',
      color: primaryColor || '#6366f1',
      gradient: `linear-gradient(135deg, ${primaryColor || '#6366f1'}, ${primaryColor || '#6366f1'}dd)`,
      subtitle: `${dateRange.fromDate} - ${dateRange.toDate}`
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(animatedValues.totalRevenue || 0),
      icon: 'bi-currency-dollar',
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      subtitle: 'Net sales amount'
    },
    {
      title: 'Avg. Order Value',
      value: formatCurrency(animatedValues.avgOrderValue || 0),
      icon: 'bi-graph-up-arrow',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
      subtitle: 'Per order average'
    }
  ];

  // Mini bar chart for revenue trend
  const maxRevenue = summaryData.revenueTrend.length > 0
    ? Math.max(...summaryData.revenueTrend.map(d => d.revenue || 0))
    : 0;

  return (
    <div className="adm-dash">
      {/* Header */}
      <div className="adm-dash-header">
        <div className="adm-dash-header-left">
          <h1 className="adm-dash-title">Dashboard</h1>
          <p className="adm-dash-subtitle">
            Overview of your business performance
          </p>
        </div>
        <div className="adm-dash-header-right">
          <span className="adm-dash-timestamp">
            <i className="bi bi-clock"></i>
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            className="adm-dash-refresh-btn"
            onClick={handleRefresh}
            disabled={loading.summary}
            style={{ '--accent': primaryColor }}
          >
            <i className={`bi bi-arrow-clockwise ${loading.summary ? 'spin' : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="adm-dash-filter">
        <div className="adm-dash-filter-group">
          <div className="adm-dash-filter-field">
            <label>From</label>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => handleDateChange('fromDate', e.target.value)}
            />
          </div>
          <div className="adm-dash-filter-field">
            <label>To</label>
            <input
              type="date"
              value={dateRange.toDate}
              onChange={(e) => handleDateChange('toDate', e.target.value)}
            />
          </div>
          <button
            className="adm-dash-apply-btn"
            onClick={handleApplyFilter}
            disabled={loading.summary}
            style={{ background: primaryColor }}
          >
            {loading.summary ? (
              <Spinner animation="border" size="sm" style={{ width: 14, height: 14 }} />
            ) : (
              <i className="bi bi-funnel-fill"></i>
            )}
            Apply
          </button>
        </div>
      </div>

      {error.summary && (
        <div className="adm-dash-error">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error.summary}
        </div>
      )}

      {/* Stat Cards */}
      <div className="adm-dash-stats">
        {statCards.map((card, index) => (
          <div className="adm-dash-stat-card" key={index}>
            <div className="adm-dash-stat-icon" style={{ background: card.gradient }}>
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="adm-dash-stat-content">
              <span className="adm-dash-stat-label">{card.title}</span>
              {loading.summary ? (
                <div className="adm-dash-stat-skeleton"></div>
              ) : (
                <span className="adm-dash-stat-value">{card.value}</span>
              )}
              <span className="adm-dash-stat-sub">{card.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Cards */}
      <div className="adm-dash-section">
        <div className="adm-dash-section-header">
          <h2 className="adm-dash-section-title">
            <i className="bi bi-pie-chart-fill"></i>
            Orders by Status
          </h2>
          {totalOrders > 0 && (
            <span className="adm-dash-section-badge">{totalOrders} total</span>
          )}
        </div>
        <div className="adm-dash-status-grid">
          {Object.entries(summaryData.orderByStatus).map(([status, count]) => {
            const config = statusConfig[status] || statusConfig.UNKNOWN;
            const percent = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : 0;
            return (
              <div className="adm-dash-status-card" key={status}>
                <div className="adm-dash-status-icon-wrap" style={{ background: config.bg }}>
                  <i className={`bi ${config.icon}`} style={{ color: config.color }}></i>
                </div>
                <div className="adm-dash-status-info">
                  <span className="adm-dash-status-count" style={{ color: config.color }}>
                    {loading.summary ? '-' : count}
                  </span>
                  <span className="adm-dash-status-label">{config.label}</span>
                </div>
                {totalOrders > 0 && !loading.summary && (
                  <div className="adm-dash-status-bar-wrap">
                    <div
                      className="adm-dash-status-bar"
                      style={{ width: `${percent}%`, background: config.color }}
                    ></div>
                  </div>
                )}
                {totalOrders > 0 && !loading.summary && (
                  <span className="adm-dash-status-percent">{percent}%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Trend + Top Items */}
      <div className="adm-dash-grid-2">
        {/* Revenue Trend */}
        <div className="adm-dash-card adm-dash-card-wide">
          <div className="adm-dash-card-header">
            <h2 className="adm-dash-card-title">
              <i className="bi bi-bar-chart-line-fill"></i>
              Revenue Trend
            </h2>
          </div>
          <div className="adm-dash-card-body">
            {loading.summary ? (
              <div className="adm-dash-loading">
                <Spinner animation="border" size="sm" />
              </div>
            ) : summaryData.revenueTrend && summaryData.revenueTrend.length > 0 ? (
              <div className="adm-dash-chart-area">
                {/* Mini Bar Chart */}
                <div className="adm-dash-bars">
                  {summaryData.revenueTrend.slice(-14).map((item, index) => {
                    const height = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                    return (
                      <div className="adm-dash-bar-col" key={index}>
                        <div className="adm-dash-bar-tooltip">
                          <strong>{formatCurrency(item.revenue)}</strong>
                          <span>{item.orders || 0} orders</span>
                        </div>
                        <div
                          className="adm-dash-bar"
                          style={{
                            height: `${Math.max(height, 4)}%`,
                            background: `linear-gradient(to top, ${primaryColor}cc, ${primaryColor})`,
                            animationDelay: `${index * 50}ms`
                          }}
                        ></div>
                        <span className="adm-dash-bar-label">
                          {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Revenue Table */}
                <div className="adm-dash-trend-table">
                  <div className="adm-dash-trend-thead">
                    <span>Date</span>
                    <span>Orders</span>
                    <span>Revenue</span>
                  </div>
                  {summaryData.revenueTrend.slice(-7).map((item, index) => (
                    <div className="adm-dash-trend-row" key={index}>
                      <span>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="adm-dash-trend-orders">{item.orders || 0}</span>
                      <span className="adm-dash-trend-revenue">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="adm-dash-empty">
                <i className="bi bi-bar-chart-line"></i>
                <p>No revenue data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Menu Items */}
        <div className="adm-dash-card">
          <div className="adm-dash-card-header">
            <h2 className="adm-dash-card-title">
              <i className="bi bi-trophy-fill"></i>
              Top Menu Items
            </h2>
          </div>
          <div className="adm-dash-card-body">
            {loading.summary ? (
              <div className="adm-dash-loading">
                <Spinner animation="border" size="sm" />
              </div>
            ) : summaryData.topMenuItems && summaryData.topMenuItems.length > 0 ? (
              <div className="adm-dash-top-list">
                {summaryData.topMenuItems.map((item, index) => (
                  <div className="adm-dash-top-item" key={index}>
                    <div className={`adm-dash-top-rank ${index < 3 ? 'top-3' : ''}`}>
                      {index < 3 ? (
                        <i className="bi bi-trophy-fill"></i>
                      ) : (
                        <span>#{index + 1}</span>
                      )}
                    </div>
                    <div className="adm-dash-top-info">
                      <span className="adm-dash-top-name">{item.name || item.menuItemName || 'Unknown'}</span>
                      <span className="adm-dash-top-orders">{item.orderCount || item.count || 0} orders</span>
                    </div>
                    <span className="adm-dash-top-revenue">
                      {formatCurrency(item.revenue || item.totalRevenue || 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="adm-dash-empty">
                <i className="bi bi-award"></i>
                <p>No top items data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Restaurants */}
      <div className="adm-dash-section" style={{ marginTop: '1.5rem' }}>
        <div className="adm-dash-card">
          <div className="adm-dash-card-header">
            <h2 className="adm-dash-card-title">
              <i className="bi bi-shop"></i>
              Top Restaurants
            </h2>
          </div>
          <div className="adm-dash-card-body">
            {loading.summary ? (
              <div className="adm-dash-loading">
                <Spinner animation="border" size="sm" />
              </div>
            ) : summaryData.topRestaurants && summaryData.topRestaurants.length > 0 ? (
              <div className="adm-dash-restaurant-grid">
                {summaryData.topRestaurants.map((restaurant, index) => (
                  <div className="adm-dash-restaurant-card" key={index}>
                    <div className={`adm-dash-restaurant-rank ${index < 3 ? 'gold' : ''}`}>
                      {index + 1}
                    </div>
                    <div className="adm-dash-restaurant-info">
                      <span className="adm-dash-restaurant-name">
                        {restaurant.name || restaurant.restaurantName || 'Unknown'}
                      </span>
                      <div className="adm-dash-restaurant-meta">
                        <span>
                          <i className="bi bi-bag"></i>
                          {restaurant.orderCount || restaurant.orders || 0} orders
                        </span>
                        <span className="adm-dash-restaurant-rev">
                          {formatCurrency(restaurant.revenue || restaurant.totalRevenue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="adm-dash-empty">
                <i className="bi bi-shop-window"></i>
                <p>No restaurant data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
