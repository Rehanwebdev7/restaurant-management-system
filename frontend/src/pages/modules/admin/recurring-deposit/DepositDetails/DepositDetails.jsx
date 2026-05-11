import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Modal } from 'react-bootstrap';
import '../../../../../styles/tables.css';

const DepositDetails = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(6);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    depositId: '',
    paymentDate: '',
    amount: '',
    paymentMode: 'Cash',
    collectedBy: '',
    remarks: ''
  });

  // Sample data
  const [details] = useState([
    {
      id: 1,
      depositId: 'DEP001',
      paymentDate: '2024-01-15',
      customerName: 'Rajesh Kumar',
      customerMobile: '9876543210',
      customerEmail: 'rajesh@example.com',
      amount: 5000,
      paymentMode: 'Cash',
      collectedBy: 'Admin User',
      status: 'completed',
      transactionId: 'TXN001'
    },
    {
      id: 2,
      depositId: 'DEP002',
      paymentDate: '2024-02-15',
      customerName: 'Rajesh Kumar',
      customerMobile: '9876543210',
      customerEmail: 'rajesh@example.com',
      amount: 5000,
      paymentMode: 'Online',
      collectedBy: 'Admin User',
      status: 'completed',
      transactionId: 'TXN002'
    },
    {
      id: 3,
      depositId: 'DEP003',
      paymentDate: '2024-01-20',
      customerName: 'Priya Sharma',
      customerMobile: '9123456789',
      customerEmail: 'priya@example.com',
      amount: 10000,
      paymentMode: 'UPI',
      collectedBy: 'Branch Manager',
      status: 'completed',
      transactionId: 'TXN003'
    },
    {
      id: 4,
      depositId: 'DEP004',
      paymentDate: '2024-06-15',
      customerName: 'Rajesh Kumar',
      customerMobile: '9876543210',
      customerEmail: 'rajesh@example.com',
      amount: 5000,
      paymentMode: 'Pending',
      collectedBy: '---',
      status: 'pending',
      transactionId: '---'
    },
    {
      id: 5,
      depositId: 'DEP005',
      paymentDate: '2024-03-15',
      customerName: 'Amit Patel',
      customerMobile: '9988776655',
      customerEmail: 'amit@example.com',
      amount: 3000,
      paymentMode: 'Cheque',
      collectedBy: 'Admin User',
      status: 'completed',
      transactionId: 'TXN005'
    }
  ]);

  // Filter data
  const filteredData = useMemo(() => {
    return details.filter(detail => {
      const matchesSearch =
        detail.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        detail.customerMobile.includes(searchQuery) ||
        detail.depositId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        detail.transactionId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || detail.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [details, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(false);
    setFormData({
      customerName: '',
      depositId: '',
      paymentDate: '',
      amount: '',
      paymentMode: 'Cash',
      collectedBy: '',
      remarks: ''
    });
  };

  const handleActionClick = (detail) => {
    navigate(`/admin/recurring-deposit/deposit-details/${detail.id}`, {
      state: { detail }
    });
  };

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

  return (
    <Container fluid>
      <div className="user-table-container">
        {/* Header */}
        <Row className="mb-3 g-2 align-items-center">
          <Col lg={3} md={4} sm={12}>
            <h4 className="mb-0" style={{ color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
              Deposit Details
            </h4>
          </Col>
          <Col lg={9} md={8} sm={12} className="d-flex justify-content-end gap-2">
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </Form.Select>
            <InputGroup style={{ maxWidth: '250px' }}>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="btn-outline-primary-custom"
              style={{ padding: '0.4rem 1rem 0.5rem 1rem', fontSize: '0.875rem' }}
            >
              <i className="bi bi-plus me-1"></i> Add Payment
            </Button>
          </Col>
        </Row>

        {/* Table */}
        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px', padding: '0' }}>
          <Table bordered hover className="modern-table" style={{ background: '#f0f2f5' }}>
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>
                <th>Action</th>
                <th>Deposit ID</th>
                <th>Payment Date</th>
                <th>Customer Details</th>
                <th>Payment Info</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((detail) => (
                  <tr key={detail.id} style={{ background: '#f0f2f5' }}>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => handleActionClick(detail)}
                        className="btn-outline-primary-custom"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                    </td>
                    <td>
                      <strong>{detail.depositId}</strong>
                      <br />
                      <small className="text-muted">{detail.transactionId}</small>
                    </td>
                    <td>{new Date(detail.paymentDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div>
                        <strong>{detail.customerName}</strong>
                        <br />
                        <small className="text-muted">
                          <i className="bi bi-telephone me-1"></i>{detail.customerMobile}
                        </small>
                        <br />
                        <small className="text-muted">
                          <i className="bi bi-envelope me-1"></i>{detail.customerEmail}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{detail.paymentMode}</strong>
                        <br />
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>{detail.collectedBy}
                        </small>
                      </div>
                    </td>
                    <td>
                      <strong>${detail.amount.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className={`badge bg-${detail.status === 'completed' ? 'success' : detail.status === 'pending' ? 'warning' : 'danger'}`}>
                        {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                    <span className="text-muted">No deposit details found</span>
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
              Showing <strong style={{ color: '#667eea' }}>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
              <strong style={{ color: '#667eea' }}>{Math.min(startIndex + rowsPerPage, filteredData.length)}</strong> of{' '}
              <strong style={{ color: '#667eea' }}>{filteredData.length}</strong> entries
            </span>
          </Col>
          <Col lg={6} md={6} sm={12} className="d-flex justify-content-end">
            <Pagination className="mb-0">{renderPagination()}</Pagination>
          </Col>
        </Row>

        {/* Add Payment Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Payment Details</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Deposit ID *</Form.Label>
                    <Form.Control
                      type="text"
                      name="depositId"
                      value={formData.depositId}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Payment Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Customer Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Amount ($) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Payment Mode *</Form.Label>
                    <Form.Select
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Collected By *</Form.Label>
                    <Form.Control
                      type="text"
                      name="collectedBy"
                      value={formData.collectedBy}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Remarks</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="bi bi-check-circle me-2"></i>
                Add Payment
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Container>
  );
};

export default DepositDetails;
