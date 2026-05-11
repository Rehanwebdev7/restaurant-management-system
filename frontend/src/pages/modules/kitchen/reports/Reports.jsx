import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, Table } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getContrastColor } from '../../../../services/themeService';

const Reports = () => {
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg      = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg     = isDarkMode ? '#1e293b' : '#f8fafc';
  const cBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tp      = isDarkMode ? '#e2e8f0' : '#1e293b';
  const ts      = isDarkMode ? '#cbd5e1' : '#64748b';
  const hBg     = isDarkMode ? '#475569' : '#f1f5f9';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState({
    summary: { totalOrders: 57, completedOrders: 38, avgPrepTime: 18, peakHour: '12 PM - 1 PM' },
    ordersByStatus: [
      { status: 'PENDING', count: 5 }, { status: 'ACCEPTED_ORDER', count: 4 },
      { status: 'PREPARING_ORDER', count: 7 }, { status: 'READY_FOR_ORDER', count: 3 },
      { status: 'COMPLETED', count: 38 }, { status: 'CANCELLED', count: 2 }
    ],
    topItems: [
      { name: 'Chicken Biryani', quantity: 45 }, { name: 'Butter Chicken', quantity: 38 },
      { name: 'Dal Makhani', quantity: 32 }, { name: 'Veg Thali', quantity: 28 },
      { name: 'Paneer Tikka', quantity: 24 }, { name: 'Mutton Biryani', quantity: 19 }
    ],
    hourlyBreakdown: [
      { hour: '9 AM', orders: 3, avgPrepTime: 15 }, { hour: '10 AM', orders: 7, avgPrepTime: 17 },
      { hour: '11 AM', orders: 9, avgPrepTime: 18 }, { hour: '12 PM', orders: 14, avgPrepTime: 22 },
      { hour: '1 PM', orders: 11, avgPrepTime: 20 }, { hour: '2 PM', orders: 8, avgPrepTime: 16 },
      { hour: '3 PM', orders: 5, avgPrepTime: 14 }, { hour: '4 PM', orders: 4, avgPrepTime: 13 }
    ]
  });

  // Date filters
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        reportType,
        fromDate: filters.fromDate,
        toDate: filters.toDate
      };

      const response = await ApiGet('/api/kitchen/reports', params);

      if (response.success) {
        setReportData(response.success?.data?.data || generateMockData());
      } else {
        // Use mock data for now
        setReportData(generateMockData());
      }
    } catch (err) {
      // Use mock data if API fails
      setReportData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    return {
      summary: {
        totalOrders: 57,
        completedOrders: 38,
        avgPrepTime: 18,
        peakHour: '12 PM - 1 PM'
      },
      ordersByStatus: [
        { status: 'PENDING', count: 5 },
        { status: 'ACCEPTED_ORDER', count: 4 },
        { status: 'PREPARING_ORDER', count: 7 },
        { status: 'READY_FOR_ORDER', count: 3 },
        { status: 'COMPLETED', count: 38 },
        { status: 'CANCELLED', count: 2 }
      ],
      topItems: [
        { name: 'Chicken Biryani', quantity: 45 },
        { name: 'Butter Chicken', quantity: 38 },
        { name: 'Dal Makhani', quantity: 32 },
        { name: 'Veg Thali', quantity: 28 },
        { name: 'Paneer Tikka', quantity: 24 },
        { name: 'Mutton Biryani', quantity: 19 }
      ],
      hourlyBreakdown: [
        { hour: '9 AM', orders: 3, avgPrepTime: 15 },
        { hour: '10 AM', orders: 7, avgPrepTime: 17 },
        { hour: '11 AM', orders: 9, avgPrepTime: 18 },
        { hour: '12 PM', orders: 14, avgPrepTime: 22 },
        { hour: '1 PM', orders: 11, avgPrepTime: 20 },
        { hour: '2 PM', orders: 8, avgPrepTime: 16 },
        { hour: '3 PM', orders: 5, avgPrepTime: 14 },
        { hour: '4 PM', orders: 4, avgPrepTime: 13 }
      ]
    };
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    fetchReportData();
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: cBg }}>
      <Card.Body className="d-flex align-items-center">
        <div className="me-3" style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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

  return (
    <Container fluid className="py-3" style={{ backgroundColor: bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: tp }}>
          <i className="bi bi-graph-up me-2"></i>
          Kitchen Reports
        </h3>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4" style={{ backgroundColor: cBg }}>
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">Report Type</Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  size="sm"
                >
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col lg={2} md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col lg={6} md={12}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateReport}
                disabled={loading}
                style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : (
                  <i className="bi bi-file-earmark-bar-graph me-1"></i>
                )}
                Generate Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Report Content */}
      {(loading || reportData) ? (
        <>
          {/* Summary Stats */}
          <Row className="g-3 mb-4">
            <Col lg={3} md={6}>
              <StatCard
                title="Total Orders"
                value={loading ? '-' : (reportData?.summary?.totalOrders || 0)}
                icon="bi bi-cart3"
                color="#3b82f6"
              />
            </Col>
            <Col lg={3} md={6}>
              <StatCard
                title="Completed"
                value={loading ? '-' : (reportData?.summary?.completedOrders || 0)}
                icon="bi bi-check-circle"
                color="#10b981"
              />
            </Col>
            <Col lg={3} md={6}>
              <StatCard
                title="Avg Prep Time"
                value={loading ? '-' : `${reportData?.summary?.avgPrepTime || 0} min`}
                icon="bi bi-clock"
                color="#f59e0b"
              />
            </Col>
            <Col lg={3} md={6}>
              <StatCard
                title="Peak Hour"
                value={loading ? '-' : (reportData?.summary?.peakHour || '-')}
                icon="bi bi-graph-up-arrow"
                color="#8b5cf6"
              />
            </Col>
          </Row>

          <Row className="g-3">
            {/* Orders by Status */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: cBg }}>
                <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
                  <h5 className="mb-0 fw-bold" style={{ color: tp }}>Orders by Status</h5>
                </Card.Header>
                <Card.Body>
                  <Table hover className="mb-0">
                    <thead>
                      <tr style={{ backgroundColor: primaryColor }}>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px' }}>Status</th>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px', textAlign: 'right' }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeletonLoader rows={5} columns={2} />
                      ) : reportData?.ordersByStatus?.length > 0 ? (
                        reportData.ordersByStatus.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.status}</td>
                            <td className="text-end fw-bold">{item.count}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="text-center text-muted py-4">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Top Menu Items */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: cBg }}>
                <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
                  <h5 className="mb-0 fw-bold" style={{ color: tp }}>Top Menu Items</h5>
                </Card.Header>
                <Card.Body>
                  <Table hover className="mb-0">
                    <thead>
                      <tr style={{ backgroundColor: primaryColor }}>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px' }}>#</th>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px' }}>Item Name</th>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px', textAlign: 'right' }}>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeletonLoader rows={5} columns={3} />
                      ) : reportData?.topItems?.length > 0 ? (
                        reportData.topItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{item.name}</td>
                            <td className="text-end fw-bold">{item.quantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Hourly Breakdown */}
          <Row className="g-3 mt-3">
            <Col lg={12}>
              <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
                <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
                  <h5 className="mb-0 fw-bold" style={{ color: tp }}>Hourly Order Breakdown</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr style={{ backgroundColor: primaryColor }}>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px' }}>Hour</th>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px', textAlign: 'right' }}>Orders</th>
                        <th style={{ backgroundColor: primaryColor, color: primaryContrast, border: 'none', padding: '10px 16px', textAlign: 'right' }}>Avg Prep Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <TableSkeletonLoader rows={5} columns={3} />
                      ) : reportData?.hourlyBreakdown?.length > 0 ? (
                        reportData.hourlyBreakdown.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.hour}</td>
                            <td className="text-end">{item.orders}</td>
                            <td className="text-end">{item.avgPrepTime} min</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">
                            No hourly data available for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
          <Card.Body className="text-center py-5">
            <i className="bi bi-bar-chart fs-1 text-muted d-block mb-3" style={{ opacity: 0.5 }}></i>
            <h5 className="text-muted">No Report Data</h5>
            <p className="text-muted mb-0">Select a date range and click Generate Report to view data.</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Reports;
