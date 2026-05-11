import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal, Image } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPostFormData } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const MenuSubcategory = () => {
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
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState(null);

  // Dropdowns data
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    branchId: '',
    menuCategoryId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Image cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  // For edit mode - store selected names
  const [selectedBranchName, setSelectedBranchName] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  useEffect(() => {
    fetchSubcategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchBranches();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter categories based on selected branch
  useEffect(() => {
    if (formData.branchId) {
      const filtered = categories.filter(category =>
        category.branchId?.id === parseInt(formData.branchId)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [formData.branchId, categories]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchSubcategoryData();
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
      const result = await ApiGet('/api/restaurant/users/filter', {
        role: 'branch',
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setBranches(data.records || []);
      } else {
        toast.error('Failed to fetch branches');
      }
    } catch (err) {
      toast.error('Failed to fetch branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const result = await ApiGet('/api/restaurant/menu_category/filter', {
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setCategories(data.records || []);
        setFilteredCategories(data.records || []);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchSubcategoryData = async () => {
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

      if (statusFilter) {
        params.isActive = statusFilter === 'active';
      }

      const result = await ApiGet('/api/restaurant/menu_subcategory/filter', params);

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
      setError('Failed to fetch subcategories');
      toast.error('Failed to fetch subcategories');
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
    const exportData = apiData.map(subcategory => ({
      ID: subcategory.id,
      Name: subcategory.name || '',
      Description: subcategory.description || '',
      Category: subcategory.menuCategoryId?.name || 'N/A',
      Restaurant: subcategory.restaurantId?.name || 'N/A',
      Branch: subcategory.branchId?.name || 'N/A',
      Status: subcategory.isActive ? 'Active' : 'Inactive',
      'Created At': subcategory.createdAt ? new Date(subcategory.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Subcategories');
    XLSX.writeFile(workbook, `menu_subcategories_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      branchId: '',
      menuCategoryId: ''
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setSelectedBranchName('');
    setSelectedCategoryName('');
  };

  const handleAdd = () => {
    resetForm();
    setSelectedSubcategory(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (subcategory) => {
    setSelectedSubcategory(subcategory);
    const branchId = subcategory.branchId?.id;
    const categoryId = subcategory.menuCategoryId?.id;
    setFormData({
      name: subcategory.name || '',
      description: subcategory.description || '',
      isActive: subcategory.isActive ?? true,
      branchId: branchId != null ? branchId : '',
      menuCategoryId: categoryId != null ? categoryId : ''
    });
    setSelectedBranchName(subcategory.branchId?.name || '');
    setSelectedCategoryName(subcategory.menuCategoryId?.name || '');
    setFormErrors({});
    setImageFile(null);
    setImagePreview(subcategory.iconUrl || null);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteClick = (subcategory) => {
    setSubcategoryToDelete(subcategory);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subcategoryToDelete) return;

    setDeleteLoading(true);
    try {
      const payload = {
        id: subcategoryToDelete.id,
        isDelete: true
      };

      const formDataToSend = new FormData();
      formDataToSend.append('payload', JSON.stringify(payload));

      const result = await ApiPostFormData('/api/restaurant/menu_subcategory/update_Subcategory', formDataToSend);

      if (result.success) {
        toast.success('Subcategory deleted successfully');
        setShowDeleteModal(false);
        setSubcategoryToDelete(null);
        fetchSubcategoryData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete subcategory');
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.branchId) {
      errors.branchId = 'Branch is required';
    }

    if (!formData.menuCategoryId) {
      errors.menuCategoryId = 'Category is required';
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile, previewUrl) => {
    setImageFile(croppedFile);
    setImagePreview(previewUrl);
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
        description: formData.description.trim(),
        isActive: formData.isActive,
        branchId: { id: parseInt(formData.branchId) },
        menuCategoryId: { id: parseInt(formData.menuCategoryId) }
      };

      if (modalMode === 'edit') {
        payload.id = selectedSubcategory.id;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('payload', JSON.stringify(payload));

      if (imageFile) {
        formDataToSend.append('photo', imageFile);
      }

      const endpoint = modalMode === 'add'
        ? '/api/restaurant/menu_subcategory/add_Subcategory'
        : '/api/restaurant/menu_subcategory/update_Subcategory';

      const result = await ApiPostFormData(endpoint, formDataToSend);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Subcategory added successfully' : 'Subcategory updated successfully');
        setShowModal(false);
        fetchSubcategoryData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save subcategory');
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
          <i className="fas fa-layer-group me-2"></i>
          Menu Subcategories
        </h4>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={4}>
          <InputGroup style={{ height: '42px' }}>
            <InputGroup.Text style={{ height: '42px' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search subcategories..."
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
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Subcategory
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
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              {/* <th>Restaurant</th> */}
              <th>Branch</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={8} />
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
                  No subcategories found
                </td>
              </tr>
            ) : (
              paginatedData.map((subcategory) => (
                <tr key={subcategory.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(subcategory)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(subcategory)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{subcategory.id}</strong></td>
                  <td>
                    {subcategory.iconUrl ? (
                      <img
                        src={subcategory.iconUrl}
                        alt={subcategory.name}
                        width={40}
                        height={40}
                        className="rounded"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>{subcategory.name || 'N/A'}</td>
                  <td>{subcategory.menuCategoryId?.name || 'N/A'}</td>
                  {/* <td>{subcategory.restaurantId?.name || 'N/A'}</td> */}
                  <td>{subcategory.branchId?.name || 'N/A'}</td>
                  <td>{getStatusBadge(subcategory.isActive)}</td>
                  <td>{subcategory.createdAt ? new Date(subcategory.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Subcategory Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Subcategory' : 'Edit Subcategory'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={branches.map((branch) => ({
                      value: branch.id,
                      label: branch.name
                    }))}
                    value={formData.branchId !== '' && formData.branchId != null ? {
                      value: Number(formData.branchId),
                      label: branches.find(b => b.id === Number(formData.branchId))?.name
                        || selectedBranchName
                        || `Branch ${formData.branchId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({
                        ...prev,
                        branchId: selected ? selected.value : '',
                        menuCategoryId: ''
                      }));
                      setSelectedBranchName(selected ? selected.label : '');
                      setSelectedCategoryName('');
                      if (formErrors.branchId) {
                        setFormErrors(prev => ({ ...prev, branchId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={branchesLoading}
                    placeholder="Search & Select Branch"
                    noOptionsMessage={() => "No branches found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.branchId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.branchId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.branchId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.branchId}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={filteredCategories.map((category) => ({
                      value: category.id,
                      label: category.name
                    }))}
                    value={formData.menuCategoryId !== '' && formData.menuCategoryId != null ? {
                      value: Number(formData.menuCategoryId),
                      label: filteredCategories.find(c => c.id === Number(formData.menuCategoryId))?.name
                        || selectedCategoryName
                        || `Category ${formData.menuCategoryId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, menuCategoryId: selected ? selected.value : '' }));
                      setSelectedCategoryName(selected ? selected.label : '');
                      if (formErrors.menuCategoryId) {
                        setFormErrors(prev => ({ ...prev, menuCategoryId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={categoriesLoading}
                    isDisabled={!formData.branchId}
                    placeholder={formData.branchId ? "Search & Select Category" : "Select Branch first"}
                    noOptionsMessage={() => "No categories found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.menuCategoryId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.menuCategoryId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.menuCategoryId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.menuCategoryId}
                    </div>
                  )}
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
                    placeholder="Enter subcategory name"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    id="isActive"
                    name="isActive"
                    label="Active"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="mt-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subcategory Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <Image src={imagePreview} alt="Preview" width={100} height={100} rounded />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter description"
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
                  {modalMode === 'add' ? 'Add Subcategory' : 'Update Subcategory'}
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
            Delete Subcategory
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the subcategory <strong>"{subcategoryToDelete?.name}"</strong>?</p>
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

      {/* Image Cropper Modal */}
      <ImageCropperModal
        show={showCropper}
        onHide={() => setShowCropper(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title="Crop Subcategory Image"
        primaryColor={primaryColor}
      />
    </Container>
  );
};

export default MenuSubcategory;
