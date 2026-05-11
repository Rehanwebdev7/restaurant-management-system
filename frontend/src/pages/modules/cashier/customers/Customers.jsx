import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Badge, Spinner, Modal, Row, Col, Pagination } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import '../../../../styles/tables.css';
import { useTheme } from '../../../../contexts/ThemeContext';

const Customers = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const fetchCustomers = async (search = searchTerm) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: pagination.page - 1,
        pageSize: pagination.limit
      };
      if (search.trim()) {
        params.searchValue = search;
      }
      const result = await ApiGet('/api/cashier/customers/search', params);
      console.log('API Result:', result);
      if (result.success) {
        // Try different response structures
        const responseData = result.success.data?.data || result.success.data || result.success || {};
        console.log('Response Data:', responseData);
        const records = responseData?.records || [];
        console.log('Records:', records);
        setCustomers(records);
        setPagination(prev => ({
          ...prev,
          total: responseData?.totalRecords || 0,
          totalPages: responseData?.totalPages || 1
        }));
      }
    } catch (err) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handleClear = () => {
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers('');
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalPages = pagination.totalPages || Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-people me-2"></i>
          Customers
        </h2>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <Form onSubmit={handleSearch}>
            <InputGroup style={{ height: '42px' }}>
              <Form.Control
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ height: '42px' }}
              />
              {searchTerm && (
                <Button variant="outline-secondary" type="button" onClick={handleClear} style={{ height: '42px' }}>
                  <i className="bi bi-x-lg"></i>
                </Button>
              )}
              <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', color: primaryContrast }} type="submit">
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Form>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Date of Birth</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={pagination.limit} columns={5} />
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  <i className="bi bi-people me-2"></i>
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name || 'N/A'}</td>
                  <td>{customer.mobileNumber || 'N/A'}</td>
                  <td>{customer.email || 'N/A'}</td>
                  <td>{customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'N/A'}</td>
                  <td>{customer.createdAt ? formatDate(customer.createdAt) : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          <Form.Select
            value={pagination.limit}
            onChange={(e) => {
              setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }));
            }}
            style={{ width: 'auto' }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </Form.Select>
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Showing {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
        <Pagination>
          <Pagination.First
            onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
            disabled={pagination.page === 1 || totalPages === 0}
          />
          <Pagination.Prev
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
            disabled={pagination.page === 1 || totalPages === 0}
          />
          {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, index) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (pagination.page <= 3) {
              pageNum = index + 1;
            } else if (pagination.page >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = pagination.page - 2 + index;
            }
            return (
              <Pagination.Item
                key={pageNum}
                active={pageNum === pagination.page}
                onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
              >
                {pageNum}
              </Pagination.Item>
            );
          })}
          <Pagination.Next
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
            disabled={pagination.page === totalPages || totalPages === 0}
          />
          <Pagination.Last
            onClick={() => setPagination(prev => ({ ...prev, page: totalPages }))}
            disabled={pagination.page === totalPages || totalPages === 0}
          />
        </Pagination>
      </div>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Customer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <label className="text-muted small">Name</label>
                  <div className="fw-semibold">{selectedCustomer.name || 'N/A'}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small">Phone</label>
                  <div className="fw-semibold">{selectedCustomer.mobileNumber || 'N/A'}</div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small">Email</label>
                  <div className="fw-semibold">{selectedCustomer.email || 'N/A'}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <label className="text-muted small">Date of Birth</label>
                  <div className="fw-semibold">
                    {selectedCustomer.dateOfBirth ? formatDate(selectedCustomer.dateOfBirth) : 'N/A'}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small">Status</label>
                  <div>
                    <Badge bg={selectedCustomer.isActive ? 'success' : 'secondary'}>
                      {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted small">Created At</label>
                  <div className="fw-semibold">
                    {selectedCustomer.createdAt ? formatDate(selectedCustomer.createdAt) : 'N/A'}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Customers;
