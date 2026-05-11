import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const DiningTables = () => {
  const { primaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);

  // Dropdowns data - no branches needed for branch module
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Status options
  const statusOptions = [
    { value: 1, label: 'Available' },
    { value: 2, label: 'Occupied' },
    { value: 3, label: 'Reserved' },
    { value: 4, label: 'Maintenance' }
  ];

  // Form state - no branchId needed for branch module
  const [formData, setFormData] = useState({
    sectionId: '',
    tableNumber: '',
    capacity: 4,
    status: 1,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // For edit mode - store selected names
  const [selectedSectionName, setSelectedSectionName] = useState('');

  useEffect(() => {
    fetchTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchTableData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchSections = async () => {
    setSectionsLoading(true);
    try {
      const result = await ApiGet('/api/branch/section/filter', {
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setSections(data.records || []);
      } else {
        toast.error('Failed to fetch sections');
      }
    } catch (err) {
      toast.error('Failed to fetch sections');
    } finally {
      setSectionsLoading(false);
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }

      const result = await ApiGet('/api/branch/dining_tables/filter', params);

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
      setError('Failed to fetch dining tables');
      toast.error('Failed to fetch dining tables');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = apiData.map(table => ({
      ID: table.id,
      'Table Number': table.tableNumber || '',
      Restaurant: table.restaurantId?.name || 'N/A',
      Branch: table.branchId?.name || 'N/A',
      Section: table.sectionId?.type || 'N/A',
      Capacity: table.capacity || 0,
      Status: getStatusLabel(table.status),
      Notes: table.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dining Tables');
    XLSX.writeFile(workbook, `dining_tables_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      1: 'Available',
      2: 'Occupied',
      3: 'Reserved',
      4: 'Maintenance'
    };
    return statusMap[status] || 'Unknown';
  };

  const resetForm = () => {
    setFormData({
      sectionId: '',
      tableNumber: '',
      capacity: 4,
      status: 1,
      notes: ''
    });
    setFormErrors({});
    setSelectedSectionName('');
  };

  const handleAdd = () => {
    resetForm();
    setSelectedTable(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (table) => {
    setSelectedTable(table);
    const sectionId = table.sectionId?.id;
    setFormData({
      sectionId: sectionId != null ? sectionId : '',
      tableNumber: table.tableNumber || '',
      capacity: table.capacity || 4,
      status: table.status || 1,
      notes: table.notes || ''
    });
    setSelectedSectionName(table.sectionId?.type || '');
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteClick = (table) => {
    setTableToDelete(table);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tableToDelete) return;

    setDeleteLoading(true);
    try {
      const payload = {
        id: tableToDelete.id,
        isDelete: true
      };

      const result = await ApiPut('/api/branch/dining_tables/update', payload);

      if (result.success) {
        toast.success('Dining table deleted successfully');
        setShowDeleteModal(false);
        setTableToDelete(null);
        fetchTableData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete dining table');
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.sectionId) {
      errors.sectionId = 'Section is required';
    }

    if (!formData.tableNumber) {
      errors.tableNumber = 'Table number is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
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
      const payload = {
        sectionId: { id: parseInt(formData.sectionId) },
        tableNumber: formData.tableNumber.toString(),
        capacity: parseInt(formData.capacity),
        status: parseInt(formData.status),
        notes: formData.notes.trim()
      };

      let result;

      if (modalMode === 'add') {
        result = await ApiPost('/api/branch/dining_tables/add', payload);
      } else {
        payload.id = selectedTable.id;
        result = await ApiPut('/api/branch/dining_tables/update', payload);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Dining table added successfully' : 'Dining table updated successfully');
        setShowModal(false);
        fetchTableData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save dining table');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      1: 'success',
      2: 'danger',
      3: 'warning',
      4: 'secondary'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{getStatusLabel(status)}</Badge>;
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-chair me-2"></i>
          Dining Tables
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
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={8} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Table
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
              <th>ID</th>
              <th>Table No.</th>
              <th>Section</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={7} />
            ) : error ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No dining tables found
                </td>
              </tr>
            ) : (
              paginatedData.map((table) => (
                <tr key={table.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(table)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(table)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{table.id}</strong></td>
                  <td><strong>{table.tableNumber}</strong></td>
                  <td>{table.sectionId?.type || 'N/A'}</td>
                  <td>{table.capacity || 0}</td>
                  <td>{getStatusBadge(table.status)}</td>
                  <td>{table.notes || '-'}</td>
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

      {/* Dining Table Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Dining Table' : 'Edit Dining Table'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={sections.map((section) => ({
                      value: section.id,
                      label: section.name || section.type
                    }))}
                    value={formData.sectionId !== '' && formData.sectionId != null ? {
                      value: Number(formData.sectionId),
                      label: sections.find(s => s.id === Number(formData.sectionId))?.name
                        || sections.find(s => s.id === Number(formData.sectionId))?.type
                        || selectedSectionName
                        || `Section ${formData.sectionId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, sectionId: selected ? selected.value : '' }));
                      setSelectedSectionName(selected ? selected.label : '');
                      if (formErrors.sectionId) {
                        setFormErrors(prev => ({ ...prev, sectionId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={sectionsLoading}
                    placeholder="Search & Select Section"
                    noOptionsMessage={() => "No sections found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.sectionId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.sectionId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.sectionId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.sectionId}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Table Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleFormChange}
                    placeholder="Enter table number"
                    isInvalid={!!formErrors.tableNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.tableNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    min="1"
                    isInvalid={!!formErrors.capacity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.capacity}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === formData.status)}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, status: selected ? selected.value : 1 }));
                    }}
                    isSearchable
                    placeholder="Select Status"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Enter notes (optional)"
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
                  {modalMode === 'add' ? 'Add Table' : 'Update Table'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-trash me-2 text-danger"></i>
            Delete Dining Table
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete table <strong>"{tableToDelete?.tableNumber}"</strong>?</p>
          <p className="text-muted mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DiningTables;
