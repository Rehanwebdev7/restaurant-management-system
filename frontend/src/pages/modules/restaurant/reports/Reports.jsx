import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../contexts/ThemeContext';
import '../../../styles/reports.css';

const Reports = () => {
  const { primaryColor } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [fromDate, setFromDate] = useState('2026-04-14');
  const [toDate, setToDate] = useState('2026-04-20');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await ApiGet('/api/restaurant/reports/summary', {
        fromDate,
        toDate
      });
      if (response.success) {
        setData(response.success.data.data || response.success.data);
      } else {
        console.error('Error fetching report data:', response.fail);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchReportData();
  };

  const handleDownload = () => {
    const csvContent = generateCSV();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `reports_${new Date().getTime()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCSV = () => {
    if (!data) return '';
    let csv = 'Report Summary\n\n';
    csv += `Total Revenue,${data.totalRevenue}\n`;
    csv += `Total Orders,${data.totalOrders}\n`;
    csv += `Avg Order Value,${data.avgOrderValue}\n`;
    csv += `Total Customers,${data.totalCustomers}\n`;
    csv += `Cancellation Rate,${data.cancellationRate}%\n\n`;
    csv += 'Revenue Trend\n';
    csv += 'Date,Revenue,Orders\n';
    data.revenueTrend?.forEach(item => {
      csv += `${item.date},${item.revenue},${item.orders}\n`;
    });
    return csv;
  };

  if (loading && !data) {
    return <div className="text-center py-5">Loading reports...</div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h2" style={{ color: primaryColor, fontWeight: 600 }}>
          Reports & Analytics
        </h1>
        <p className="text-muted">View your restaurant performance metrics and trends</p>
      </div>

      {/* Date Filter */}
      <Card className="mb-4 filter-card">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-500">From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-500">To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={handleApplyFilter}
                disabled={loading}
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              >
                Apply Filter
              </Button>
              <Button
                variant="outline-secondary"
                onClick={handleDownload}
                disabled={!data || loading}
              >
                Download
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* KPI Cards */}
      {data && (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body>
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value" style={{ color: primaryColor }}>
                    ${data.totalRevenue?.toLocaleString?.() || 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body>
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value" style={{ color: primaryColor }}>
                    {data.totalOrders || 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body>
                  <div className="stat-label">Avg Order Value</div>
                  <div className="stat-value" style={{ color: primaryColor }}>
                    ${data.avgOrderValue?.toLocaleString?.() || 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body>
                  <div className="stat-label">Cancellation Rate</div>
                  <div className="stat-value" style={{ color: primaryColor }}>
                    {data.cancellationRate || 0}%
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Revenue Trend Table */}
          <Card className="mb-4">
            <Card.Header style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Card.Title className="mb-0" style={{ color: primaryColor }}>
                Revenue Trend (Last 7 Days)
              </Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.revenueTrend?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>{item.orders}</td>
                        <td>${item.revenue?.toLocaleString?.()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>

          {/* Two Column Section */}
          <Row className="g-3 mb-4">
            {/* Top Menu Items */}
            <Col md={6}>
              <Card>
                <Card.Header style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <Card.Title className="mb-0" style={{ color: primaryColor }}>
                    Top 5 Menu Items
                  </Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Item Name</th>
                          <th>Orders</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topItems?.map((item, idx) => (
                          <tr key={idx}>
                            <td>#{idx + 1}</td>
                            <td>{item.name}</td>
                            <td>{item.orders}</td>
                            <td>${item.revenue?.toLocaleString?.()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Orders by Status */}
            <Col md={6}>
              <Card>
                <Card.Header style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <Card.Title className="mb-0" style={{ color: primaryColor }}>
                    Orders by Status
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="status-blocks">
                    <div className="status-block completed">
                      <div className="status-count">{data.ordersByStatus?.COMPLETED || 0}</div>
                      <div className="status-label">Completed</div>
                    </div>
                    <div className="status-block preparing">
                      <div className="status-count">{data.ordersByStatus?.PREPARING || 0}</div>
                      <div className="status-label">Preparing</div>
                    </div>
                    <div className="status-block pending">
                      <div className="status-count">{data.ordersByStatus?.PENDING || 0}</div>
                      <div className="status-label">Pending</div>
                    </div>
                    <div className="status-block cancelled">
                      <div className="status-count">{data.ordersByStatus?.CANCELLED || 0}</div>
                      <div className="status-label">Cancelled</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Orders by Type */}
          <Card>
            <Card.Header style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Card.Title className="mb-0" style={{ color: primaryColor }}>
                Orders by Type
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="order-type-block online">
                    <div className="type-label">Online Orders</div>
                    <div className="type-value">
                      {data.ordersByType?.online || 0}
                      <span className="type-percent">
                        ({data.ordersByType ? Math.round((data.ordersByType.online / (data.ordersByType.online + data.ordersByType.dineIn)) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="order-type-block dine">
                    <div className="type-label">Dine-In Orders</div>
                    <div className="type-value">
                      {data.ordersByType?.dineIn || 0}
                      <span className="type-percent">
                        ({data.ordersByType ? Math.round((data.ordersByType.dineIn / (data.ordersByType.online + data.ordersByType.dineIn)) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;
