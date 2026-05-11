import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const Section = () => {
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
  const [selectedSection, setSelectedSection] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  // Dropdowns data
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Section type options
  const sectionTypeOptions = [
    { value: 'AC', label: 'AC' },
    { value: 'NON_AC', label: 'Non-AC' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'TAKEAWAY', label: 'Takeaway' },
    { value: 'OUTDOOR', label: 'Outdoor' }
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    restaurantId: '',
    branchId: '',
    type: '',
    taxPercentage: 0,
    serviceCharge: 0
  });
  const [formErrors, setFormErrors] = useState({});

  // For edit mode - store selected name
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('');

  useEffect(() => {
    fetchSectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    fetchRestaurants();
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchSectionData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const result = await ApiGet('/api/admin/users/filter', { role: 'branch', pageNumber: 0, pageSize: 1000 });
      if (result.success) setBranches(result.success.data.data.records || []);
    } catch (err) { } finally { setBranchesLoading(false); }
  };

  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);
    try {
      const result = await ApiGet('/api/admin/users/filter', {
        role: 'restaurant',
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setRestaurants(data.records || []);
      } else {
        toast.error('Failed to fetch restaurants');
      }
    } catch (err) {
      toast.error('Failed to fetch restaurants');
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const fetchSectionData = async () => {
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

      const result = await ApiGet('/api/admin/section/filter', params);

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
      setError('Failed to fetch sections');
      toast.error('Failed to fetch sections');
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
    const exportData = apiData.map(section => ({
      ID: section.id,
      Name: section.name || '',
      Restaurant: section.restaurantId?.name || 'N/A',
      Branch: section.branchId?.name || 'N/A',
      Type: section.type || 'N/A',
      'Tax %': section.taxPercentage || 0,
      'Service Charge %': section.serviceChargePercentage || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sections');
    XLSX.writeFile(workbook, `sections_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      restaurantId: '',
      branchId: '',
      type: '',
      taxPercentage: 0,
      serviceCharge: 0
    });
    setFormErrors({});
    setSelectedRestaurantName('');
  };

  const handleAdd = () => {
    resetForm();
    setSelectedSection(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (section) => {
    setSelectedSection(section);
    const restId = section.restaurantId?.id;
    setFormData({
      name: section.name || '',
      restaurantId: restId != null ? restId : '',
      branchId: section.branchId?.id || '',
      type: section.type || '',
      taxPercentage: section.taxPercentage || 0,
      serviceCharge: section.serviceChargePercentage || 0
    });
    setSelectedRestaurantName(section.restaurantId?.name || '');
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteClick = (section) => {
    setSectionToDelete(section);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sectionToDelete) return;

    setDeleteLoading(true);
    try {
      const payload = {
        id: sectionToDelete.id,
        isDelete: true
      };

      const result = await ApiPut('/api/admin/section/update', payload);

      if (result.success) {
        toast.success('Section deleted successfully');
        setShowDeleteModal(false);
        setSectionToDelete(null);
        fetchSectionData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete section');
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.restaurantId) {
      errors.restaurantId = 'Restaurant is required';
    }

    if (!formData.type) {
      errors.type = 'Type is required';
    }

    if (formData.taxPercentage < 0 || formData.taxPercentage > 100) {
      errors.taxPercentage = 'Tax percentage must be between 0 and 100';
    }

    if (formData.serviceCharge < 0 || formData.serviceCharge > 100) {
      errors.serviceCharge = 'Service charge must be between 0 and 100';
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
        name: formData.name.trim(),
        restaurantId: { id: parseInt(formData.restaurantId) },
        branchId: formData.branchId ? { id: parseInt(formData.branchId) } : null,
        type: formData.type,
        taxPercentage: parseFloat(formData.taxPercentage),
        serviceCharge: parseFloat(formData.serviceCharge)
      };

      let result;

      if (modalMode === 'add') {
        result = await ApiPost('/api/admin/section/add', payload);
      } else {
        payload.id = selectedSection.id;
        result = await ApiPut('/api/admin/section/update', payload);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Section added successfully' : 'Section updated successfully');
        setShowModal(false);
        fetchSectionData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save section');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredBranches = formData.restaurantId
    ? branches.filter(b => String(b.parentId?.id) === String(formData.restaurantId))
    : [];

  const getTypeBadge = (type) => {
    const typeColors = {
      'AC': 'primary',
      'NON_AC': 'secondary',
      'ONLINE': 'success',
      'TAKEAWAY': 'warning',
      'OUTDOOR': 'info'
    };
    return <Badge bg={typeColors[type] || 'secondary'}>{type || 'N/A'}</Badge>;
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-th-large me-2"></i>
          Sections
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
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={8} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Section
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
              <th>Name</th>
              <th>Restaurant</th>
              <th>Branch</th>
              <th>Type</th>
              <th>Tax %</th>
              <th>Service Charge %</th>
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
                  No sections found
                </td>
              </tr>
            ) : (
              paginatedData.map((section) => (
                <tr key={section.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(section)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(section)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{section.id}</strong></td>
                  <td>{section.name || 'N/A'}</td>
                  <td>{section.restaurantId?.name || 'N/A'}</td>
                  <td>{section.branchId?.name || 'N/A'}</td>
                  <td>{getTypeBadge(section.type)}</td>
                  <td>{section.taxPercentage || 0}%</td>
                  <td>{section.serviceChargePercentage || 0}%</td>
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

      {/* Section Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Section' : 'Edit Section'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={restaurants.map((restaurant) => ({
                      value: restaurant.id,
                      label: `${restaurant.name} (ID: ${restaurant.id})`
                    }))}
                    value={formData.restaurantId !== '' && formData.restaurantId != null ? {
                      value: Number(formData.restaurantId),
                      label: restaurants.find(r => r.id === Number(formData.restaurantId))?.name
                        ? `${restaurants.find(r => r.id === Number(formData.restaurantId))?.name} (ID: ${formData.restaurantId})`
                        : selectedRestaurantName
                          ? `${selectedRestaurantName} (ID: ${formData.restaurantId})`
                          : `ID: ${formData.restaurantId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, restaurantId: selected ? selected.value : '', branchId: '' }));
                      setSelectedRestaurantName(selected ? selected.label.split(' (ID:')[0] : '');
                      if (formErrors.restaurantId) setFormErrors(prev => ({ ...prev, restaurantId: '' }));
                    }}
                    isClearable
                    isSearchable
                    isLoading={restaurantsLoading}
                    placeholder="Search & Select Restaurant"
                    noOptionsMessage={() => "No restaurants found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.restaurantId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.restaurantId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.restaurantId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.restaurantId}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch</Form.Label>
                  <Select
                    options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
                    value={formData.branchId ? {
                      value: formData.branchId,
                      label: filteredBranches.find(b => b.id === parseInt(formData.branchId))?.name || branches.find(b => b.id === parseInt(formData.branchId))?.name || `ID: ${formData.branchId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, branchId: selected ? selected.value : '' }));
                    }}
                    isClearable
                    isSearchable
                    isLoading={branchesLoading}
                    isDisabled={!formData.restaurantId}
                    placeholder={formData.restaurantId ? "Select Branch" : "Select restaurant first"}
                    noOptionsMessage={() => formData.restaurantId ? "No branches for this restaurant" : "Select restaurant first"}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter section name"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={sectionTypeOptions}
                    value={formData.type ? sectionTypeOptions.find(opt => opt.value === formData.type) : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, type: selected ? selected.value : '' }));
                      if (formErrors.type) setFormErrors(prev => ({ ...prev, type: '' }));
                    }}
                    isClearable
                    isSearchable
                    placeholder="Select Type"
                    noOptionsMessage={() => "No types found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.type ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.type ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.type && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.type}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Percentage (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="taxPercentage"
                    value={formData.taxPercentage}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    step="0.01"
                    isInvalid={!!formErrors.taxPercentage}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.taxPercentage}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Service Charge (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="serviceCharge"
                    value={formData.serviceCharge}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    step="0.01"
                    isInvalid={!!formErrors.serviceCharge}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.serviceCharge}
                  </Form.Control.Feedback>
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
                  {modalMode === 'add' ? 'Add Section' : 'Update Section'}
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
            Delete Section
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the section <strong>"{sectionToDelete?.name}"</strong>?</p>
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

export default Section;
