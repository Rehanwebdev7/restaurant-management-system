import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import superadminService from '../../../../services/superadminService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const primaryColor = '#3B82F6';

const StatCard = ({ icon, title, value, iconColor = primaryColor, isCurrency = false }) => (
  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
    <Card.Body>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="fs-6 mb-2 text-muted">{title}</div>
          <div className="fs-3 fw-bold" style={{ color: iconColor }}>
            {isCurrency ? `$${Number(value || 0).toLocaleString('en-IN')}` : (value?.toLocaleString() || 0)}
          </div>
        </div>
        <div className="p-3 rounded-circle" style={{ backgroundColor: `${iconColor}15` }}>
          <i className={`${icon} fs-4`} style={{ color: iconColor }}></i>
        </div>
      </div>
    </Card.Body>
  </Card>
);

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [toDate, setToDate] = useState(new Date());

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0]
      };

      const [summaryRes, perfRes, chartRes] = await Promise.all([
        superadminService.reports.getSummary(params),
        superadminService.reports.getRestaurantPerformance(params),
        superadminService.reports.getRevenueByRestaurant(params)
      ]);

      if (summaryRes.success) setSummary(summaryRes.success.data.data);
      if (perfRes.success) setPerformance(perfRes.success.data.data.records || []);
      if (chartRes.success) setChartData(chartRes.success.data.data);
    } catch (error) {
      toast.error('Error loading reports');
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleExport = () => {
    if (performance.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(performance.map(p => ({
      'Restaurant': p.name,
      'Orders': p.orders,
      'Revenue': p.revenue,
      'Avg Order Value': p.avgOrderValue,
      'Top Item': p.topItem
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Restaurant Performance');
    XLSX.writeFile(wb, `Restaurant-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Report exported as Excel');
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{ color: primaryColor, fontWeight: '700' }}>
          <i className="bi bi-bar-chart me-2"></i>Platform Reports
        </h2>
        <Button variant="primary" size="sm" onClick={handleExport} style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
          <i className="bi bi-download me-1"></i>Export to Excel
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">From Date</Form.Label>
                <DatePicker
                  selected={fromDate}
                  onChange={(date) => setFromDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small text-muted">To Date</Form.Label>
                <DatePicker
                  selected={toDate}
                  onChange={(date) => setToDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button variant="primary" onClick={fetchReports} className="w-100" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      {!loading && summary && (
        <Row className="g-3 mb-4">
          <Col xl={4} md={6}><StatCard icon="bi bi-currency-dollar" title="Total Revenue" value={summary.totalRevenue} isCurrency /></Col>
          <Col xl={4} md={6}><StatCard icon="bi bi-bag-check" title="Total Orders" value={summary.totalOrders} iconColor="#0891b2" /></Col>
          <Col xl={4} md={6}><StatCard icon="bi bi-calculator" title="Avg Order Value" value={summary.avgOrderValue} isCurrency iconColor="#059669" /></Col>
        </Row>
      )}

      {/* Revenue Chart */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <Card.Body>
          <h5 className="mb-3" style={{ color: primaryColor, fontWeight: '600' }}>
            <i className="bi bi-graph-up me-2"></i>Revenue by Restaurant
          </h5>
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : chartData ? (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: true, position: 'top' } },
                scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${v.toLocaleString()}` } } }
              }}
            />
          ) : (
            <div className="text-center py-5 text-muted">No chart data</div>
          )}
        </Card.Body>
      </Card>

      {/* Restaurant Performance Table */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Body>
          <h5 className="mb-3" style={{ color: primaryColor, fontWeight: '600' }}>
            <i className="bi bi-table me-2"></i>Restaurant Performance
          </h5>
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : performance.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <Table hover responsive className="mb-0">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th>Restaurant</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Avg Order Value</th>
                    <th>Top Item</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((item, i) => (
                    <tr key={i}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.orders}</td>
                      <td><strong>${Number(item.revenue).toLocaleString('en-IN')}</strong></td>
                      <td>${item.avgOrderValue}</td>
                      <td><Badge bg="light" text="dark">{item.topItem}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No data available
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Reports;
