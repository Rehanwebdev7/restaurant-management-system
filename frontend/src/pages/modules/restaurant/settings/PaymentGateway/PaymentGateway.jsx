import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const PaymentGateway = () => {
  const { primaryColor } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    vendorname: '',
    title: '',
    paymentMethod: 'PG',
    onOf: 'ON',
    status: true,
    mode: 'TEST',
    key_id: '',
    key_secret: '',
    currency: 'USD',
    webhook_secret: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    fetchPaymentGatewayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchPaymentGatewayData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/restaurant/payment_gateway/getAll', params);

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
      setError('Failed to fetch payment gateways');
      toast.error('Failed to fetch payment gateways');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(gateway => ({
      ID: gateway.id,
      'Vendor Name': gateway.vendorname || '',
      Title: gateway.title || '',
      'Payment Method': gateway.paymentMethod || '',
      'On/Off': gateway.onOf || '',
      Status: gateway.status ? 'Active' : 'Inactive',
      Mode: gateway.credentials?.mode || '',
      Currency: gateway.credentials?.currency || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Gateways');
    XLSX.writeFile(workbook, `payment_gateways_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      vendorname: '',
      title: '',
      paymentMethod: 'PG',
      onOf: 'ON',
      status: true,
      mode: 'TEST',
      key_id: '',
      key_secret: '',
      currency: 'USD',
      webhook_secret: ''
    });
    setFormErrors({});
    setShowKeySecret(false);
    setShowWebhookSecret(false);
  };

  const handleAdd = () => {
    resetForm();
    setSelectedGateway(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (gateway) => {
    setSelectedGateway(gateway);
    setFormData({
      vendorname: gateway.vendorname || '',
      title: gateway.title || '',
      paymentMethod: gateway.paymentMethod || 'PG',
      onOf: gateway.onOf || 'ON',
      status: gateway.status ?? true,
      mode: gateway.credentials?.mode || 'TEST',
      key_id: gateway.credentials?.key_id || '',
      key_secret: gateway.credentials?.key_secret || '',
      currency: gateway.credentials?.currency || 'INR',
      webhook_secret: gateway.credentials?.webhook_secret || ''
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (gateway) => {
    if (!window.confirm(`Are you sure you want to delete "${gateway.title || gateway.vendorname}"?`)) {
      return;
    }

    try {
      const result = await ApiDelete(`/api/restaurant/payment_gateway/${gateway.id}`);

      if (result.success) {
        toast.success('Payment Gateway deleted successfully');
        fetchPaymentGatewayData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete payment gateway');
    }
  };

  const handleStatusToggle = async (gateway) => {
    setTogglingId(gateway.id);
    try {
      const payload = {
        id: gateway.id,
        vendorname: gateway.vendorname,
        title: gateway.title,
        paymentMethod: gateway.paymentMethod,
        onOf: gateway.onOf,
        status: !gateway.status,
        credentials: gateway.credentials
      };

      const result = await ApiPut('/api/restaurant/payment_gateway/update', payload);

      if (result.success) {
        toast.success(`Payment Gateway ${!gateway.status ? 'enabled' : 'disabled'} successfully`);
        fetchPaymentGatewayData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to update payment gateway status');
    } finally {
      setTogglingId(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.vendorname.trim()) {
      errors.vendorname = 'Vendor Name is required';
    }

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = 'Payment Method is required';
    }

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
      const payload = {
        vendorname: formData.vendorname.trim(),
        title: formData.title.trim(),
        paymentMethod: formData.paymentMethod,
        onOf: formData.onOf,
        status: formData.status,
        credentials: {
          mode: formData.mode,
          key_id: formData.key_id.trim(),
          key_secret: formData.key_secret.trim(),
          currency: formData.currency,
          webhook_secret: formData.webhook_secret.trim()
        }
      };

      if (modalMode === 'edit') {
        payload.id = selectedGateway.id;
      }

      let result;
      if (modalMode === 'add') {
        result = await ApiPost('/api/restaurant/payment_gateway/add', payload);
      } else {
        result = await ApiPut('/api/restaurant/payment_gateway/update', payload);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Payment Gateway added successfully' : 'Payment Gateway updated successfully');
        setShowModal(false);
        fetchPaymentGatewayData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save payment gateway');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status) {
      return <Badge bg="success">Active</Badge>;
    } else {
      return <Badge bg="danger">Inactive</Badge>;
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-credit-card me-2"></i>
          Payment Gateway
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Payment Gateway
          </Button>
          <Button variant="success" onClick={exportToExcel} style={{ height: '42px', width: '42px', padding: 0 }} title="Export Excel">
            <i className="bi bi-file-earmark-excel"></i>
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
              <th>Vendor Name</th>
              <th>Title</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Enable/Disable</th>
              <th>Mode</th>
              <th>Currency</th>
              <th>Credentials</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={10} />
            ) : error ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No payment gateways found. Click "Add Payment Gateway" to create one.
                </td>
              </tr>
            ) : (
              paginatedData.map((gateway) => (
                <tr key={gateway.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(gateway)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(gateway)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{gateway.id}</strong></td>
                  <td>{gateway.vendorname || 'N/A'}</td>
                  <td>{gateway.title || 'N/A'}</td>
                  <td>{gateway.paymentMethod || 'N/A'}</td>
                  <td>{getStatusBadge(gateway.status)}</td>
                  <td>
                    <Form.Check
                      type="switch"
                      id={`status-switch-${gateway.id}`}
                      checked={gateway.status}
                      onChange={() => handleStatusToggle(gateway)}
                      disabled={togglingId === gateway.id}
                      label={togglingId === gateway.id ? <Spinner animation="border" size="sm" /> : (gateway.status ? 'ON' : 'OFF')}
                    />
                  </td>
                  <td><Badge bg="info">{gateway.credentials?.mode || 'N/A'}</Badge></td>
                  <td>{gateway.credentials?.currency || 'N/A'}</td>
                  <td>
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#0d6efd' }}>View Details</summary>
                      <div style={{ fontSize: '12px', marginTop: '5px', wordBreak: 'break-all' }}>
                        <div><strong>Key ID:</strong> {gateway.credentials?.key_id || 'N/A'}</div>
                        <div><strong>Key Secret:</strong> {gateway.credentials?.key_secret ? '****' : 'N/A'}</div>
                        <div><strong>Webhook Secret:</strong> {gateway.credentials?.webhook_secret ? '****' : 'N/A'}</div>
                      </div>
                    </details>
                  </td>
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

      {/* Payment Gateway Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Payment Gateway' : 'Edit Payment Gateway'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendor Name<span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="vendorname"
                    value={formData.vendorname}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.vendorname}
                  >
                    <option value="">Select Vendor</option>
                    <option value="ccavenue">CCAvenue</option>
                    <option value="concerto">Concerto</option>
                    <option value="phonepe">PhonePe</option>
                    <option value="tezgateway">TezGateway</option>
                    <option value="cod">COD</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.vendorname}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title<span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g., Online Payment, Cash On Delivery"
                    isInvalid={!!formErrors.title}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method<span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.paymentMethod}
                  >
                    <option value="PG">PG (Payment Gateway)</option>
                    <option value="COD">COD (Cash On Delivery)</option>
                    <option value="WALLET">WALLET</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.paymentMethod}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="status"
                    name="status"
                    label={formData.status ? 'Active' : 'Inactive'}
                    checked={formData.status}
                    onChange={handleFormChange}
                    className="mt-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <h6 className="mb-3"><i className="bi bi-key me-2"></i>Credentials</h6>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mode</Form.Label>
                  <Form.Select
                    name="mode"
                    value={formData.mode}
                    onChange={handleFormChange}
                  >
                    <option value="TEST">TEST</option>
                    <option value="LIVE">LIVE</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select
                    name="currency"
                    value={formData.currency}
                    onChange={handleFormChange}
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Key ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="key_id"
                    value={formData.key_id}
                    onChange={handleFormChange}
                    placeholder="Enter Key ID"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Key Secret</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showKeySecret ? "text" : "password"}
                      name="key_secret"
                      value={formData.key_secret}
                      onChange={handleFormChange}
                      placeholder="Enter Key Secret"
                    />
                    <Button
                      variant="link"
                      className="position-absolute top-50 end-0 translate-middle-y"
                      style={{ zIndex: 10, padding: '0 10px' }}
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      type="button"
                    >
                      <i className={`bi bi-eye${showKeySecret ? '-slash' : ''}`}></i>
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Webhook Secret</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showWebhookSecret ? "text" : "password"}
                      name="webhook_secret"
                      value={formData.webhook_secret}
                      onChange={handleFormChange}
                      placeholder="Enter Webhook Secret"
                    />
                    <Button
                      variant="link"
                      className="position-absolute top-50 end-0 translate-middle-y"
                      style={{ zIndex: 10, padding: '0 10px' }}
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      type="button"
                    >
                      <i className={`bi bi-eye${showWebhookSecret ? '-slash' : ''}`}></i>
                    </Button>
                  </div>
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
                  {modalMode === 'add' ? 'Add Payment Gateway' : 'Update Payment Gateway'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default PaymentGateway;
