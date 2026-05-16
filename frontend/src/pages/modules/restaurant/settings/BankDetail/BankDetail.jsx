import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Spinner, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiDelete, ApiGet, ApiPost, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import '../../../../../styles/tables.css';

const BankDetail = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedBankDetail, setSelectedBankDetail] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delivery users state
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [deliveryUsersLoading, setDeliveryUsersLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    accountNumber: '',
    ifscCode: '',
    name: '',
    upi: '',
    status: 'ACTIVE'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchBankDetailData();
    fetchDeliveryUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchDeliveryUsers = async () => {
    setDeliveryUsersLoading(true);
    try {
      const result = await ApiGet('/api/restaurant/users/getBy_restId', { role: 'delivery' });
      if (result.success) {
        setDeliveryUsers(result.success.data.data || []);
      } else {
        console.error('Failed to fetch delivery users:', result.fail);
      }
    } catch (err) {
      console.error('Failed to fetch delivery users:', err);
    } finally {
      setDeliveryUsersLoading(false);
    }
  };

  const fetchBankDetailData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/restaurant/bank_details/getAll', params);

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
      setError('Failed to fetch bank details');
      toast.error('Failed to fetch bank details');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(bank => ({
      ID: bank.id,
      'Delivery User': bank.userId?.name || '',
      'Account Holder Name': bank.name || '',
      'Account Number': bank.accountNumber || '',
      'IFSC Code': bank.ifscCode || '',
      'UPI ID': bank.upi || '',
      'Status': bank.status || '',
      'Created At': bank.createdAt ? new Date(bank.createdAt).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BankDetails');
    XLSX.writeFile(workbook, `bank_details_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      accountNumber: '',
      ifscCode: '',
      name: '',
      upi: '',
      status: 'ACTIVE'
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setSelectedBankDetail(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (bankDetail) => {
    setSelectedBankDetail(bankDetail);
    setFormData({
      userId: bankDetail.userId?.id || '',
      accountNumber: bankDetail.accountNumber || '',
      ifscCode: bankDetail.ifscCode || '',
      name: bankDetail.name || '',
      upi: bankDetail.upi || '',
      status: bankDetail.status || 'ACTIVE'
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.accountNumber.trim()) {
      errors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(formData.accountNumber.trim())) {
      errors.accountNumber = 'Account number should be 9-18 digits';
    }

    if (!formData.ifscCode.trim()) {
      errors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim().toUpperCase())) {
      errors.ifscCode = 'Invalid IFSC code format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        name: formData.name.trim(),
        upi: formData.upi.trim(),
        status: formData.status
      };

      // Add userId if selected
      if (formData.userId) {
        dataToSend.userId = { id: parseInt(formData.userId) };
      }

      if (modalMode === 'edit') {
        dataToSend.id = selectedBankDetail.id;
      }

      let result;
      if (modalMode === 'add') {
        result = await ApiPost('/api/restaurant/bank_details/add', dataToSend);
      } else {
        result = await ApiPut('/api/restaurant/bank_details/update', dataToSend);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Bank detail added successfully' : 'Bank detail updated successfully');
        setShowModal(false);
        fetchBankDetailData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save bank detail');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (bankDetail) => {
    if (!window.confirm(`Are you sure you want to delete this bank detail?`)) {
      return;
    }

    try {
      const result = await ApiDelete(`/api/restaurant/bank_details/${bankDetail.id}`);

      if (result.success) {
        toast.success('Bank detail deleted successfully');
        fetchBankDetailData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete bank detail');
    }
  };

  return (
    <Container fluid className="py-2">
      <Row className="mb-4 align-items-center">
        <Col>
          <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
            <i className="bi bi-bank me-2"></i>
            Delivery User Bank Details
          </h4>
        </Col>
        <Col className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryContrast }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Bank Detail
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>Actions</th>
              <th>ID</th>
              <th>Delivery User</th>
              <th>Account Holder Name</th>
              <th>Account Number</th>
              <th>IFSC Code</th>
              <th>UPI ID</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <div className="mt-2">Loading bank details...</div>
                </td>
              </tr>
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
                  No bank details found
                </td>
              </tr>
            ) : (
              paginatedData.map((bank) => (
                <tr key={bank.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(bank)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(bank)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{bank.id}</strong></td>
                  <td>
                    {bank.userId ? (
                      <span className="badge bg-info">{bank.userId.name}</span>
                    ) : 'N/A'}
                  </td>
                  <td>{bank.name || 'N/A'}</td>
                  <td>{bank.accountNumber || 'N/A'}</td>
                  <td>{bank.ifscCode || 'N/A'}</td>
                  <td>{bank.upi || 'N/A'}</td>
                  <td>
                    {bank.status ? (
                      <span className={`badge ${bank.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                        {bank.status}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td>{bank.createdAt ? new Date(bank.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Bank Detail Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Bank Detail' : 'Edit Bank Detail'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Delivery User</Form.Label>
                  <Form.Select
                    name="userId"
                    value={formData.userId}
                    onChange={handleFormChange}
                    disabled={deliveryUsersLoading}
                  >
                    <option value="">Select Delivery User</option>
                    {deliveryUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.mobile})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Account Holder Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter account holder name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Account Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleFormChange}
                    placeholder="Enter account number"
                    isInvalid={!!formErrors.accountNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.accountNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>IFSC Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleFormChange}
                    placeholder="Enter IFSC code (e.g., HDFC0001234)"
                    isInvalid={!!formErrors.ifscCode}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.ifscCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>UPI ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="upi"
                    value={formData.upi}
                    onChange={handleFormChange}
                    placeholder="Enter UPI ID (e.g., name@upi)"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Form.Select>
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
              style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
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
                  {modalMode === 'add' ? 'Add Bank Detail' : 'Update Bank Detail'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default BankDetail;
