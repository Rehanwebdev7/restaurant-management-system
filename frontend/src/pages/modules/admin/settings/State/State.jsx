import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const State = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedState, setSelectedState] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchStateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchStateData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/admin/states/getAll', params);

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
      setError('Failed to fetch states');
      toast.error('Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(state => ({
      ID: state.id,
      Name: state.name || '',
      Status: state.isActive ? 'Active' : 'Inactive',
      'Created At': state.createdAt ? new Date(state.createdAt).toLocaleString() : 'N/A',
      'Updated At': state.updatedAt ? new Date(state.updatedAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'States');
    XLSX.writeFile(workbook, `states_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      isActive: true
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setSelectedState(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (state) => {
    setSelectedState(state);
    setFormData({
      name: state.name || '',
      isActive: state.isActive ?? true
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'State Name is required';
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
        name: formData.name.trim(),
        isActive: formData.isActive
      };

      if (modalMode === 'edit') {
        payload.id = selectedState.id;
      }

      const endpoint = modalMode === 'add'
        ? '/api/admin/states/add'
        : '/api/admin/states/update';

      const result = await ApiPut(endpoint, payload);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'State added successfully' : 'State updated successfully');
        setShowModal(false);
        fetchStateData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save state');
    } finally {
      setFormLoading(false);
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
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-geo-alt me-2"></i>
          States
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryContrast }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add State
          </Button>
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={3} />
            ) : error ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No states found
                </td>
              </tr>
            ) : (
              paginatedData.map((state) => (
                <tr key={state.id}>
                  <td>
                    <div className="d-flex gap-1 justify-content-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(state)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                    </div>
                  </td>
                  <td>{state.name || 'N/A'}</td>
                  <td>{getStatusBadge(state.isActive)}</td>
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

      {/* State Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add State' : 'Edit State'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>State Name<span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter state name"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="isActive"
                    name="isActive"
                    label={formData.isActive ? 'Active' : 'Inactive'}
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="mt-2"
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
                  {modalMode === 'add' ? 'Add State' : 'Update State'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default State;
