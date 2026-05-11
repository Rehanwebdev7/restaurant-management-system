import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Spinner, Modal, Badge } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const CustomerManagement = () => {
  const { primaryColor } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [codFilter, setCodFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [codTogglingId, setCodTogglingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    // password: '',
    dateOfBirth: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, searchQuery, statusFilter, codFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, codFilter]);

  const fetchCustomerData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage,
        search: searchQuery.trim() || undefined,
        status: statusFilter || undefined,
        cod: codFilter || undefined
      };

      const result = await ApiGet('/api/branch/customers/getAll', params);

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
      setError('Failed to fetch customers');
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(customer => ({
      ID: customer.id,
      'Name': customer.name || '',
      'Email': customer.email || '',
      'Mobile Number': customer.mobileNumber || '',
      'Date of Birth': customer.dateOfBirth || '',
      'Status': customer.isActive ? 'Active' : 'Inactive',
      'Created At': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobileNumber: '',
      // password: '',
      dateOfBirth: '',
      isActive: true
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setSelectedCustomer(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      mobileNumber: customer.mobileNumber || '',
      // password: '',
      dateOfBirth: customer.dateOfBirth || '',
      isActive: customer.isActive !== false
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = 'Invalid mobile number (10 digits starting with 6-9)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email format';
    }

    // if (modalMode === 'add' && !formData.password.trim()) {
    //   errors.password = 'Password is required';
    // }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const dataToSend = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        dateOfBirth: formData.dateOfBirth || null,
        isActive: formData.isActive
      };
// if (formData.password.trim()) {//   dataToSend.password = formData.password.trim();// }

      if (modalMode === 'edit') {
        dataToSend.id = selectedCustomer.id;
      }

      let result;
      if (modalMode === 'add') {
        result = await ApiPost('/api/branch/customers/add', dataToSend);
      } else {
        result = await ApiPut('/api/branch/customers/update', dataToSend);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Customer added successfully' : 'Customer updated successfully');
        setShowModal(false);
        fetchCustomerData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save customer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleCod = async (customer) => {
    setCodTogglingId(customer.id);
    try {
      const result = await ApiPut('/api/branch/customers/update', {
        id: customer.id,
        allowCod: !customer.allowCod
      });

      if (result.success) {
        toast.success(`COD ${!customer.allowCod ? 'enabled' : 'disabled'} for ${customer.name || customer.mobileNumber}`);
        fetchCustomerData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to update COD status');
    } finally {
      setCodTogglingId(null);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name || customer.mobileNumber}"?`)) {
      return;
    }

    try {
      const result = await ApiDelete(`/api/branch/customers/${customer.id}`);

      if (result.success) {
        toast.success('Customer deleted successfully');
        fetchCustomerData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-people me-2"></i>
          Customer Management
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col lg={8} md={12} className="mb-3 mb-lg-0">
          <Row className="g-2">
            <Col md={5}>
              <Form.Control
                type="text"
                placeholder="Search by name, email, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select value={codFilter} onChange={(e) => setCodFilter(e.target.value)}>
                <option value="">All COD</option>
                <option value="enabled">COD Enabled</option>
                <option value="disabled">COD Disabled</option>
              </Form.Select>
            </Col>
          </Row>
        </Col>
        <Col md={12} className="d-flex justify-content-end gap-2">
          {/* <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Customer
          </Button> */}
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
              <th className="text-center">Actions</th>
              <th className="text-center">COD</th>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile Number</th>
              <th>Email</th>
              <th>Date of Birth</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={9} />
            ) : error ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No customers found
                </td>
              </tr>
            ) : (
              paginatedData.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="d-flex gap-1 justify-content-center align-items-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="switch"
                      id={`cod-switch-${customer.id}`}
                      checked={!!customer.allowCod}
                      onChange={() => handleToggleCod(customer)}
                      disabled={codTogglingId === customer.id}
                      title={customer.allowCod ? 'COD Enabled' : 'COD Disabled'}
                      className="d-inline-block mb-0"
                    />
                  </td>
                  <td><strong>{customer.id}</strong></td>
                  <td>{customer.name || 'N/A'}</td>
                  <td>{customer.mobileNumber || 'N/A'}</td>
                  <td>{customer.email || 'N/A'}</td>
                  <td>{customer.dateOfBirth || 'N/A'}</td>
                  <td>
                    <Badge bg={customer.isActive ? 'success' : 'secondary'}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Customer Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Customer' : 'Edit Customer'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter customer name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleFormChange}
                    placeholder="Enter mobile number"
                    maxLength={10}
                    isInvalid={!!formErrors.mobileNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.mobileNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email address"
                    isInvalid={!!formErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              {/* Password field commented out
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Password {modalMode === 'add' && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : 'Enter password'}
                    isInvalid={!!formErrors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              */}
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="isActive"
                    name="isActive"
                    label={formData.isActive ? 'Active' : 'Inactive'}
                    checked={formData.isActive}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {modalMode === 'add' ? 'Add Customer' : 'Update Customer'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default CustomerManagement;
