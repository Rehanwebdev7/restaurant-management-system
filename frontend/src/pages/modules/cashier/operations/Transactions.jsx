import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Spinner, Form, Row, Col, Button } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import { useTheme } from '../../../../contexts/ThemeContext';

const Transactions = () => {
  const { primaryColor } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    cashAmount: 0,
    cardAmount: 0,
    upiAmount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [paymentFilter, dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/cashier/transactions', {
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate
      });
      if (result.success) {
        const data = result.success.data.data || [];
        setTransactions(data);
        calculateSummary(data);
      }
    } catch (err) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const summary = data.reduce((acc, txn) => {
      acc.totalTransactions++;
      acc.totalAmount += txn.amount || 0;
      if (txn.paymentMethod === 'CASH') acc.cashAmount += txn.amount || 0;
      if (txn.paymentMethod === 'CARD') acc.cardAmount += txn.amount || 0;
      if (txn.paymentMethod === 'UPI') acc.upiAmount += txn.amount || 0;
      return acc;
    }, { totalTransactions: 0, totalAmount: 0, cashAmount: 0, cardAmount: 0, upiAmount: 0 });
    setSummary(summary);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentBadge = (method) => {
    const config = {
      'CASH': { bg: 'success', icon: 'bi-cash' },
      'CARD': { bg: 'primary', icon: 'bi-credit-card' },
      'UPI': { bg: 'info', icon: 'bi-phone' }
    };
    const { bg, icon } = config[method] || { bg: 'secondary', icon: 'bi-wallet' };
    return (
      <Badge bg={bg}>
        <i className={`bi ${icon} me-1`}></i>
        {method}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(txn =>
    txn.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="py-4">
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="text-center">
              <div className="text-muted small">Total Transactions</div>
              <div className="fs-3 fw-bold" style={{ color: primaryColor }}>{summary.totalTransactions}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="text-center">
              <div className="text-muted small">Total Amount</div>
              <div className="fs-4 fw-bold text-success">{formatCurrency(summary.totalAmount)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="text-center">
              <div className="text-muted small"><i className="bi bi-cash me-1"></i>Cash</div>
              <div className="fs-5 fw-bold">{formatCurrency(summary.cashAmount)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="text-center">
              <div className="text-muted small"><i className="bi bi-credit-card me-1"></i>Card</div>
              <div className="fs-5 fw-bold">{formatCurrency(summary.cardAmount)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="text-center">
              <div className="text-muted small"><i className="bi bi-phone me-1"></i>UPI</div>
              <div className="fs-5 fw-bold">{formatCurrency(summary.upiAmount)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <Card.Header className="bg-white border-0 py-3">
          <Row className="align-items-center g-2">
            <Col md={3}>
              <h5 className="mb-0 fw-bold" style={{ color: primaryColor }}>
                <i className="bi bi-credit-card-2-back me-2"></i>
                Transactions
              </h5>
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
            <Col md={2}>
              <Form.Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Control
                type="search"
                placeholder="Search transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Transaction ID</th>
                  <th>Order #</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonLoader rows={5} columns={6} />
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id}>
                      <td className="fw-semibold">{txn.transactionId || `TXN-${txn.id}`}</td>
                      <td>{txn.orderNumber || `#${txn.orderId}`}</td>
                      <td className="fw-bold text-success">{formatCurrency(txn.amount)}</td>
                      <td>{getPaymentBadge(txn.paymentMethod)}</td>
                      <td>
                        <Badge bg={txn.status === 'SUCCESS' ? 'success' : txn.status === 'FAILED' ? 'danger' : 'warning'}>
                          {txn.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="small">{formatDateTime(txn.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <i className="bi bi-credit-card fs-1 d-block mb-2"></i>
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Transactions;
