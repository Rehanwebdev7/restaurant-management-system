import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const OutstandingDelivery = () => {
  const { primaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Clear Outstanding Modal state
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearFormData, setClearFormData] = useState({
    amount: '',
    remarks: ''
  });
  const [clearFormErrors, setClearFormErrors] = useState({});

  useEffect(() => {
    fetchDeliveryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchDeliveryData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchDeliveryData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        role: 'delivery',
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage,
        hasOutstanding: true
      };

      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }

      if (statusFilter) {
        params.isActive = statusFilter === 'active';
      }

      const result = await ApiGet('/api/branch/users/filter', params);

      if (result.success) {
        const data = result.success.data.data;
        setApiData(data.records || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setError(result.fail);
        toast.error(result.fail);
      }
    } catch (err) {
      setError('Failed to fetch delivery staff');
      toast.error('Failed to fetch delivery staff');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = apiData.map(delivery => ({
      Name: delivery.name || '',
      Mobile: delivery.mobile || '',
      Email: delivery.email || '',
      'Outstanding Balance': delivery.outstandingBalance ?? 0,
      'Balance': delivery.balance ?? 0,
      Status: delivery.isActive ? 'Active' : 'Inactive',
      'Created At': delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Outstanding Delivery');
    XLSX.writeFile(workbook, `outstanding_delivery_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleClearOutstanding = (delivery) => {
    setSelectedDelivery(delivery);
    setClearFormData({
      amount: delivery.outstandingBalance || '',
      remarks: ''
    });
    setClearFormErrors({});
    setShowClearModal(true);
  };

  const validateClearForm = () => {
    const errors = {};

    if (!clearFormData.amount || clearFormData.amount <= 0) {
      errors.amount = 'Amount is required and must be greater than 0';
    }

    setClearFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClearFormChange = (e) => {
    const { name, value } = e.target;
    setClearFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (clearFormErrors[name]) {
      setClearFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClearSubmit = async (e) => {
    e.preventDefault();

    if (!validateClearForm()) {
      return;
    }

    setClearLoading(true);

    try {
      const payload = {
        userId: selectedDelivery.id,
        amount: parseFloat(clearFormData.amount),
        remark: clearFormData.remarks.trim() || null
      };

      const result = await ApiPost('/api/branch/outstanding/deduct', payload);

      if (result.success) {
        toast.success('Outstanding cleared successfully');
        setShowClearModal(false);
        fetchDeliveryData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to clear outstanding');
    } finally {
      setClearLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <Badge bg="success">Active</Badge>;
    } else {
      return <Badge bg="danger">Inactive</Badge>;
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-wallet2 me-2"></i>
          Outstanding - Delivery
        </h2>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={4}>
          <InputGroup style={{ height: '42px' }}>
            <InputGroup.Text style={{ height: '42px' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search delivery staff..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={2}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            style={{ height: '42px' }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
        </Col>
        <Col md={6} className="d-flex justify-content-end gap-2">
          {/* <Button variant="success" onClick={exportToExcel} style={{ height: '42px', width: '42px', padding: 0 }} title="Export Excel">
            <i className="bi bi-file-earmark-excel"></i>
          </Button> */}
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Outstanding Balance</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={8} />
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No delivery staff found
                </td>
              </tr>
            ) : (
              paginatedData.map((delivery) => (
                <tr key={delivery.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleClearOutstanding(delivery)}
                        disabled={loading}
                        title="Clear Outstanding"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: primaryColor,
                          color: primaryColor,
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = primaryColor;
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = primaryColor;
                        }}
                      >
                        <i className="bi bi-cash-stack me-1"></i>
                        Clear Outstanding
                      </Button>
                    </div>
                  </td>
                  <td>{delivery.name || 'N/A'}</td>
                  <td>{delivery.mobile || 'N/A'}</td>
                  <td>{delivery.email || 'N/A'}</td>
                  <td>
                    <Badge bg={delivery.outstandingBalance > 0 ? 'danger' : 'success'}>
                      ${delivery.outstandingBalance ?? 0}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg="info">
                      ${delivery.balance ?? 0}
                    </Badge>
                  </td>
                  <td>{getStatusBadge(delivery.isActive)}</td>
                  <td>{delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : 'N/A'}</td>
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
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
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
          Showing {totalRecords === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalRecords)} of {totalRecords} entries
        </div>
        <Pagination>
          <Pagination.First
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || totalPages === 0}
          />
          <Pagination.Prev
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || totalPages === 0}
          />
          {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, index) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (currentPage <= 3) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = currentPage - 2 + index;
            }
            return (
              <Pagination.Item
                key={pageNum}
                active={pageNum === currentPage}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Pagination.Item>
            );
          })}
          <Pagination.Next
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          />
          <Pagination.Last
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          />
        </Pagination>
      </div>

      {/* Clear Outstanding Modal */}
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-cash-stack me-2"></i>
            Clear Outstanding
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleClearSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Amount <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                name="amount"
                value={clearFormData.amount}
                onChange={handleClearFormChange}
                placeholder="Enter amount to clear"
                isInvalid={!!clearFormErrors.amount}
                min="0"
                step="0.01"
              />
              <Form.Control.Feedback type="invalid">
                {clearFormErrors.amount}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="remarks"
                value={clearFormData.remarks}
                onChange={handleClearFormChange}
                placeholder="Enter remarks (optional)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              disabled={clearLoading}
            >
              {clearLoading ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Clear Outstanding
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default OutstandingDelivery;
