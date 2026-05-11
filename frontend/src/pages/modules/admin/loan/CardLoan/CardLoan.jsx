import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Modal } from 'react-bootstrap';
import '../../../../../styles/tables.css';

const CardLoan = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(6);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    monthlyAmount: '',
    duration: '',
    startDate: '',
    status: 'active'
  });

  // Sample data
  const [loans] = useState([
    {
      id: 1,
      startDate: '2024-01-15',
      customerName: 'Rajesh Kumar',
      customerMobile: '9876543210',
      customerEmail: 'rajesh@example.com',
      status: 'active',
      monthlyAmount: 5000,
      duration: 12,
      totalAmount: 60000
    },
    {
      id: 2,
      startDate: '2024-02-01',
      customerName: 'Priya Sharma',
      customerMobile: '9123456789',
      customerEmail: 'priya@example.com',
      status: 'active',
      monthlyAmount: 10000,
      duration: 24,
      totalAmount: 240000
    },
    {
      id: 3,
      startDate: '2023-12-10',
      customerName: 'Amit Patel',
      customerMobile: '9988776655',
      customerEmail: 'amit@example.com',
      status: 'completed',
      monthlyAmount: 3000,
      duration: 12,
      totalAmount: 36000
    }
  ]);

  // Filter data
  const filteredData = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch =
        loan.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.customerMobile.includes(searchQuery) ||
        loan.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchQuery, statusFilter]);

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
      customerMobile: '',
      customerEmail: '',
      monthlyAmount: '',
      duration: '',
      startDate: '',
      status: 'active'
    });
  };

  const handleActionClick = (loan) => {
    navigate(`/admin/loan/card-loan/${loan.id}`, {
      state: { loan }
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
              Loan
            </h4>
          </Col>
          <Col lg={9} md={8} sm={12} className="d-flex justify-content-end gap-2">
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
              <i className="bi bi-plus me-1"></i> Add Loan
            </Button>
          </Col>
        </Row>

        {/* Table */}
        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px', padding: '0' }}>
          <Table bordered hover className="modern-table" style={{ background: '#f0f2f5' }}>
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>
                <th>Action</th>
                <th>Start Date</th>
                <th>Customer Name</th>
                <th>Customer Mobile</th>
                <th>Customer Email</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((loan) => (
                  <tr key={loan.id} style={{ background: '#f0f2f5' }}>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => handleActionClick(loan)}
                        className="btn-outline-primary-custom"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                    </td>
                    <td>{new Date(loan.startDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <strong>{loan.customerName}</strong>
                    </td>
                    <td>
                      {loan.customerMobile}
                    </td>
                    <td>
                      {loan.customerEmail}
                    </td>
                    <td>
                      <span className={`badge bg-${loan.status === 'active' ? 'success' : loan.status === 'completed' ? 'primary' : 'danger'}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>${loan.monthlyAmount.toLocaleString('en-IN')}/month</strong>
                        <br />
                        <small className="text-muted">Total: ${loan.totalAmount.toLocaleString('en-IN')}</small>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                    <span className="text-muted">No loans found</span>
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

        {/* Add Card Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add New Loan</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row className="g-3">
                <Col md={6}>
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
                    <Form.Label>Mobile Number *</Form.Label>
                    <Form.Control
                      type="tel"
                      name="customerMobile"
                      value={formData.customerMobile}
                      onChange={handleInputChange}
                      pattern="[0-9]{10}"
                      maxLength="10"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Monthly Amount ($) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="monthlyAmount"
                      value={formData.monthlyAmount}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Duration (Months) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="1"
                      max="120"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Start Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {formData.monthlyAmount && formData.duration && (
                  <Col md={12}>
                    <div className="alert alert-info mb-0">
                      <strong>Total Amount: </strong>
                      ${(parseFloat(formData.monthlyAmount) * parseInt(formData.duration || 0)).toLocaleString('en-IN')}
                    </div>
                  </Col>
                )}
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="bi bi-check-circle me-2"></i>
                Add Loan
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Container>
  );
};

export default CardLoan;
