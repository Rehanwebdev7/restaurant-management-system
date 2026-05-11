import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Modal, Card, ProgressBar } from 'react-bootstrap';
import '../../../../../styles/tables.css';

const CardDepositDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const depositData = location.state?.deposit;

  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(6);

  // Sample transaction data
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: '2024-01-15',
      time: '10:30 AM',
      description: 'Initial Payment - Month 1',
      status: 'completed',
      amount: 5000,
      mode: 'Cash',
      payment: 'Paid'
    },
    {
      id: 2,
      date: '2024-02-15',
      time: '11:45 AM',
      description: 'Monthly Payment - Month 2',
      status: 'completed',
      amount: 5000,
      mode: 'Online',
      payment: 'Paid'
    },
    {
      id: 3,
      date: '2024-03-15',
      time: '02:15 PM',
      description: 'Monthly Payment - Month 3',
      status: 'completed',
      amount: 5000,
      mode: 'Cheque',
      payment: 'Paid'
    },
    {
      id: 4,
      date: '2024-04-15',
      time: '09:20 AM',
      description: 'Monthly Payment - Month 4',
      status: 'completed',
      amount: 5000,
      mode: 'UPI',
      payment: 'Paid'
    },
    {
      id: 5,
      date: '2024-05-15',
      time: '03:30 PM',
      description: 'Monthly Payment - Month 5',
      status: 'completed',
      amount: 5000,
      mode: 'Cash',
      payment: 'Paid'
    },
    {
      id: 6,
      date: '2024-06-15',
      time: '---',
      description: 'Monthly Payment - Month 6',
      status: 'pending',
      amount: 5000,
      mode: '---',
      payment: 'Pending'
    },
    {
      id: 7,
      date: '2024-07-15',
      time: '---',
      description: 'Monthly Payment - Month 7',
      status: 'pending',
      amount: 5000,
      mode: '---',
      payment: 'Pending'
    },
    {
      id: 8,
      date: '2024-08-15',
      time: '---',
      description: 'Monthly Payment - Month 8',
      status: 'pending',
      amount: 5000,
      mode: '---',
      payment: 'Pending'
    }
  ]);

  // Calculate amounts from transactions
  const amounts = useMemo(() => {
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const paid = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const total = depositData?.totalAmount || (depositData?.monthlyAmount * depositData?.duration) || 60000;
    const remaining = total - paid;
    const progress = total > 0 ? ((paid / total) * 100).toFixed(1) : 0;

    return {
      paidAmount: paid,
      totalAmount: total,
      remainingAmount: remaining,
      progressPercentage: progress
    };
  }, [transactions, depositData]);

  const { paidAmount, totalAmount, remainingAmount, progressPercentage } = amounts;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    const newTransaction = {
      id: transactions.length + 1,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      description: `Payment - Month ${transactions.filter(t => t.status === 'completed').length + 1}`,
      status: 'completed',
      amount: parseFloat(paymentAmount),
      mode: paymentMode,
      payment: 'Paid'
    };

    setTransactions([...transactions, newTransaction]);
    setShowPaymentForm(false);
    setPaymentAmount('');
    setPaymentMode('Cash');
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.mode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredTransactions.slice(startIndex, startIndex + rowsPerPage);

  const renderPagination = () => {
    const items = [];
    for (let page = 1; page <= totalPages; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    return items;
  };

  if (!depositData) {
    return (
      <Container fluid className="mt-5 text-center">
        <div className="py-5">
          <i className="bi bi-exclamation-triangle fs-1 text-warning d-block mb-3"></i>
          <h4 className="text-muted mb-4">Deposit data not found. Please go back and try again.</h4>
          <Button variant="primary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>
            Go Back
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <div className="user-table-container">
        {/* Header */}
        <Row className="mb-3 g-2 align-items-center">
          <Col lg={4} md={4} sm={12} className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(-1)}
              style={{ padding: '0.4rem 0.8rem' }}
            >
              <i className="bi bi-arrow-left"></i>
            </Button>
            <div>
              <h4 className="mb-0" style={{ color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
                Card Deposit Details
              </h4>
              <small className="text-muted">
                {depositData.customerName} - {depositData.customerMobile}
              </small>
            </div>
          </Col>

          {/* Search */}
          <Col lg={4} md={4} sm={12}>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>

          <Col lg={4} md={4} sm={12} className="d-flex justify-content-end">
            <Button
              size="sm"
              onClick={() => setShowPaymentForm(true)}
              className="btn-outline-primary-custom"
              style={{ padding: '0.4rem 1rem 0.5rem 1rem', fontSize: '0.875rem' }}
            >
              <i className="bi bi-wallet2 me-1"></i> Add Payment
            </Button>
          </Col>
        </Row>

        {/* Summary Cards */}
        <Row className="mb-3 g-3">
          <Col lg={3} md={6} sm={12}>
            <Card style={{
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div style={{ fontSize: '2rem', marginRight: '1rem' }}>
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Paid Amount</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>${paidAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} sm={12}>
            <Card style={{
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            }}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div style={{ fontSize: '2rem', marginRight: '1rem' }}>
                    <i className="bi bi-clock-fill"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Remaining Amount</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>${remainingAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} sm={12}>
            <Card style={{
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}>
            </Card>
          </Col>
          <Col lg={3} md={6} sm={12}>
            <Card style={{
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            }}>
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px', padding: '0' }}>
          <Table bordered hover className="modern-table" style={{ background: '#f0f2f5' }}>
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Description</th>
                <th>Payment Details</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((transaction) => (
                  <tr key={transaction.id} style={{ background: '#f0f2f5' }}>
                    <td>
                      <strong>{new Date(transaction.date).toLocaleDateString('en-IN')}</strong>
                    </td>
                    <td>
                      <strong>{transaction.time}</strong>
                    </td>
                    <td>
                      <strong>{transaction.description}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{transaction.mode}</strong>
                        <br />
                        <small className="text-muted">
                        </small>
                      </div>
                    </td>
                    <td>
                      <strong>${transaction.amount.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className={`badge bg-${transaction.status === 'completed' ? 'success' : transaction.status === 'pending' ? 'warning' : 'danger'}`}>
                        {transaction.payment}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                    <span className="text-muted">No transactions found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        <Row className="align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
          <Col lg={6} md={6} sm={12} className="mb-2 mb-md-0">
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Showing <strong style={{ color: '#667eea' }}>{filteredTransactions.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
              <strong style={{ color: '#667eea' }}>{Math.min(startIndex + rowsPerPage, filteredTransactions.length)}</strong> of{' '}
              <strong style={{ color: '#667eea' }}>{filteredTransactions.length}</strong> entries
            </span>
          </Col>
          <Col lg={6} md={6} sm={12} className="d-flex justify-content-end">
            <Pagination className="mb-0">{renderPagination()}</Pagination>
          </Col>
        </Row>

        {/* Payment Form Modal */}
        <Modal show={showPaymentForm} onHide={() => setShowPaymentForm(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-wallet2 me-2"></i>
              Add Payment
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handlePaymentSubmit}>
            <Modal.Body>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Amount ($) *</Form.Label>
                    <Form.Control
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="1"
                      max={remainingAmount}
                      required
                    />
                    <Form.Text className="text-muted">
                      Remaining: ${remainingAmount.toLocaleString('en-IN')}
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Payment Mode *</Form.Label>
                    <Form.Select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {/* <Col md={12}>
                  <Form.Group>
                    <Form.Label>Collected By *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter collector name"
                      required
                    />
                  </Form.Group>
                </Col> */}
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPaymentForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="bi bi-check-circle me-2"></i>
                Submit Payment
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Container>
  );
};

export default CardDepositDetail;
