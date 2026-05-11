import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal, Image } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPostFormData } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { server_api } from '../../../../../utils/constants';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const MenuCategory = () => {
  const { primaryColor } = useTheme();

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;
    const baseUrl = server_api();
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Dropdowns data
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    isActive: true,
    restaurantId: '',
    branchId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Image cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  // For edit mode - store selected names
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('');
  const [selectedBranchName, setSelectedBranchName] = useState('');

  useEffect(() => {
    fetchCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchRestaurants();
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter branches based on selected restaurant
  useEffect(() => {
    if (formData.restaurantId) {
      const filtered = branches.filter(branch =>
        branch.parentId?.id === parseInt(formData.restaurantId)
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches(branches);
    }
  }, [formData.restaurantId, branches]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchCategoryData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const result = await ApiGet('/api/admin/users/filter', {
        role: 'branch',
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setBranches(data.records || []);
        setFilteredBranches(data.records || []);
      } else {
        toast.error('Failed to fetch branches');
      }
    } catch (err) {
      toast.error('Failed to fetch branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchCategoryData = async () => {
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

      const result = await ApiGet('/api/admin/menu_category/filter', params);

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
      setError('Failed to fetch categories');
      toast.error('Failed to fetch categories');
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
    const exportData = apiData.map(category => ({
      ID: category.id,
      Name: category.name || '',
      Description: category.description || '',
      Restaurant: category.restaurantId?.name || 'N/A',
      Branch: category.branchId?.name || 'N/A',
      Priority: category.priority || 0,
      Status: category.isActive ? 'Active' : 'Inactive',
      'Created At': category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Categories');
    XLSX.writeFile(workbook, `menu_categories_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 1,
      isActive: true,
      restaurantId: '',
      branchId: ''
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setSelectedRestaurantName('');
    setSelectedBranchName('');
  };

  const handleAdd = () => {
    resetForm();
    setSelectedCategory(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    const restId = category.restaurantId?.id;
    const branchId = category.branchId?.id;
    setFormData({
      name: category.name || '',
      description: category.description || '',
      priority: category.priority || 1,
      isActive: category.isActive ?? true,
      restaurantId: restId != null ? restId : '',
      branchId: branchId != null ? branchId : ''
    });
    setSelectedRestaurantName(category.restaurantId?.name || '');
    setSelectedBranchName(category.branchId?.name || '');
    setFormErrors({});
    setImageFile(null);
    setImagePreview(category.iconUrl || null);
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.restaurantId) {
      errors.restaurantId = 'Restaurant is required';
    }

    if (!formData.branchId) {
      errors.branchId = 'Branch is required';
    }

    if (formData.priority < 0) {
      errors.priority = 'Priority must be 0 or greater';
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
    // Reset the input so the same file can be selected again
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
        priority: parseInt(formData.priority),
        isActive: formData.isActive,
        restaurantId: { id: parseInt(formData.restaurantId) },
        branchId: { id: parseInt(formData.branchId) }
      };

      if (modalMode === 'edit') {
        payload.id = selectedCategory.id;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('payload', JSON.stringify(payload));

      if (imageFile) {
        formDataToSend.append('photo', imageFile);
      }

      const endpoint = modalMode === 'add'
        ? '/api/admin/menu_category/add_Category'
        : '/api/admin/menu_category/update_Category';

      const result = await ApiPostFormData(endpoint, formDataToSend);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Category added successfully' : 'Category updated successfully');
        setShowModal(false);
        fetchCategoryData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save category');
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
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-list me-2"></i>
          Menu Categories
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
              placeholder="Search categories..."
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
            Add Category
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
              <th>Restaurant</th>
              <th>Branch</th>
              <th>Priority</th>
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
                  No categories found
                </td>
              </tr>
            ) : (
              paginatedData.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{category.id}</strong></td>
                  <td>
                    {category.iconUrl ? (
                      <img
                        src={resolveImageUrl(category.iconUrl)}
                        alt={category.name}
                        width={40}
                        height={40}
                        className="rounded"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-muted">No image</span>'; }}
                      />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>{category.name || 'N/A'}</td>
                  <td>{category.restaurantId?.name || 'N/A'}</td>
                  <td>{category.branchId?.name || 'N/A'}</td>
                  <td>{category.priority || 0}</td>
                  <td>{getStatusBadge(category.isActive)}</td>
                  <td>{category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Category Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Category' : 'Edit Category'}
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
                      label: restaurant.name
                    }))}
                    value={formData.restaurantId !== '' && formData.restaurantId != null ? {
                      value: Number(formData.restaurantId),
                      label: restaurants.find(r => r.id === Number(formData.restaurantId))?.name
                        || selectedRestaurantName
                        || ''
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({
                        ...prev,
                        restaurantId: selected ? selected.value : '',
                        branchId: '' // Reset branch when restaurant changes
                      }));
                      setSelectedRestaurantName(selected ? selected.label : '');
                      setSelectedBranchName('');
                      if (formErrors.restaurantId) {
                        setFormErrors(prev => ({ ...prev, restaurantId: '' }));
                      }
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
                  <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={filteredBranches.map((branch) => ({
                      value: branch.id,
                      label: branch.name
                    }))}
                    value={formData.branchId !== '' && formData.branchId != null ? {
                      value: Number(formData.branchId),
                      label: filteredBranches.find(b => b.id === Number(formData.branchId))?.name
                        || selectedBranchName
                        || ''
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, branchId: selected ? selected.value : '' }));
                      setSelectedBranchName(selected ? selected.label : '');
                      if (formErrors.branchId) {
                        setFormErrors(prev => ({ ...prev, branchId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={branchesLoading}
                    isDisabled={!formData.restaurantId}
                    placeholder={formData.restaurantId ? "Search & Select Branch" : "Select Restaurant first"}
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
                    placeholder="Enter category name"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Control
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    min="0"
                    isInvalid={!!formErrors.priority}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.priority}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <Image src={resolveImageUrl(imagePreview)} alt="Preview" width={100} height={100} rounded />
                    </div>
                  )}
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
              <Col md={12}>
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
                  {modalMode === 'add' ? 'Add Category' : 'Update Category'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        show={showCropper}
        onHide={() => setShowCropper(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title="Crop Category Image"
        primaryColor={primaryColor}
      />
    </Container>
  );
};

export default MenuCategory;
