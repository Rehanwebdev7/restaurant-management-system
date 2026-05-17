import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useTheme } from '../../../../contexts/ThemeContext';

const Reports = () => {
  const { primaryColor } = useTheme();
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/cashier/dashboard/summary', {
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate
      });
      if (result.success) {
        const data = result.success.data?.data || {};
        setReportData({
          totalSales: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          avgOrderValue: data.averageOrderValue || 0,
          customersServed: 0,
          paymentMethods: {
            cash: data.ordersByPayment?.Cash || 0,
            card: data.ordersByPayment?.Card || 0,
            upi: data.ordersByPayment?.Online || 0
          },
          orderTypes: {
            dineIn: data.ordersByType?.DINING || data.ordersByType?.dineIn || 0,
            takeaway: data.ordersByType?.TAKEAWAY || data.ordersByType?.takeaway || 0,
            delivery: data.ordersByType?.DELIVERY || data.ordersByType?.delivery || 0
          },
          topItems: []
        });
      }
    } catch (err) {
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const handleExport = () => {
    toast.info('Export feature coming soon!');
  };

  return (
    <Container fluid className="py-4">
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <Card.Header className="bg-white border-0 py-3">
          <Row className="align-items-center g-2">
            <Col md={3}>
              <h5 className="mb-0 fw-bold" style={{ color: primaryColor }}>
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                Reports
              </h5>
            </Col>
            <Col md={2}>
              <Form.Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={dateRange.fromDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={dateRange.toDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              />
            </Col>
            <Col md={3} className="text-end">
              <Button variant="outline-danger" onClick={handleExport}>
                <i className="bi bi-download me-2"></i>Export
              </Button>
            </Col>
          </Row>
        </Card.Header>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="text-center">
                  <i className="bi bi-currency-dollar fs-1 text-success"></i>
                  <div className="text-muted small mt-2">Total Sales</div>
                  <div className="fs-3 fw-bold">{formatCurrency(reportData?.totalSales || 0)}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="text-center">
                  <i className="bi bi-bag-check fs-1" style={{ color: primaryColor }}></i>
                  <div className="text-muted small mt-2">Total Orders</div>
                  <div className="fs-3 fw-bold">{reportData?.totalOrders || 0}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="text-center">
                  <i className="bi bi-graph-up-arrow fs-1 text-primary"></i>
                  <div className="text-muted small mt-2">Avg Order Value</div>
                  <div className="fs-3 fw-bold">{formatCurrency(reportData?.avgOrderValue || 0)}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="text-center">
                  <i className="bi bi-people fs-1 text-info"></i>
                  <div className="text-muted small mt-2">Customers Served</div>
                  <div className="fs-3 fw-bold">{reportData?.customersServed || 0}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white border-0 py-3">
                  <h6 className="mb-0 fw-bold">Payment Methods Breakdown</h6>
                </Card.Header>
                <Card.Body>
                  <Table borderless className="mb-0">
                    <tbody>
                      <tr>
                        <td><Badge bg="success"><i className="bi bi-cash-coin me-1"></i>Cash</Badge></td>
                        <td className="text-end fw-bold">{formatCurrency(reportData?.paymentMethods?.cash || 0)}</td>
                      </tr>
                      <tr>
                        <td><Badge bg="primary"><i className="bi bi-credit-card me-1"></i>Card</Badge></td>
                        <td className="text-end fw-bold">{formatCurrency(reportData?.paymentMethods?.card || 0)}</td>
                      </tr>
                      <tr>
                        <td><Badge bg="info"><i className="bi bi-phone me-1"></i>UPI</Badge></td>
                        <td className="text-end fw-bold">{formatCurrency(reportData?.paymentMethods?.upi || 0)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white border-0 py-3">
                  <h6 className="mb-0 fw-bold">Order Types Breakdown</h6>
                </Card.Header>
                <Card.Body>
                  <Table borderless className="mb-0">
                    <tbody>
                      <tr>
                        <td><Badge bg="secondary">Dine-In</Badge></td>
                        <td className="text-end fw-bold">{reportData?.orderTypes?.dineIn || 0} orders</td>
                      </tr>
                      <tr>
                        <td><Badge bg="secondary">Takeaway</Badge></td>
                        <td className="text-end fw-bold">{reportData?.orderTypes?.takeaway || 0} orders</td>
                      </tr>
                      <tr>
                        <td><Badge bg="secondary">Delivery</Badge></td>
                        <td className="text-end fw-bold">{reportData?.orderTypes?.delivery || 0} orders</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white border-0 py-3">
                  <h6 className="mb-0 fw-bold">Top Selling Items</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Quantity Sold</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.topItems?.length > 0 ? (
                        reportData.topItems.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td className="fw-semibold">{item.name}</td>
                            <td><Badge bg="primary">{item.quantity}</Badge></td>
                            <td className="fw-bold text-success">{formatCurrency(item.revenue)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-muted">
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
        </>
      )}
    </Container>
  );
};

export default Reports;
