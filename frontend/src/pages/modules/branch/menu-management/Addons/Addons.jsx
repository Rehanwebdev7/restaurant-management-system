import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal, Card } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const Addons = () => {
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
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewAddonItems, setViewAddonItems] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewAddonName, setViewAddonName] = useState('');

  // Attribute options for addon items
  const attributeOptions = [
    { value: 'TOPPING', label: 'Topping' },
    { value: 'EXTRA', label: 'Extra' },
    { value: 'SIZE', label: 'Size' },
    { value: 'FLAVOR', label: 'Flavor' },
    { value: 'SAUCE', label: 'Sauce' },
    { value: 'OTHER', label: 'Other' }
  ];

  // Form state - no branchId needed for branch module
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minAddon: 0,
    maxAddon: 1,
    isMultiple: false,
    showOnline: true,
    showInCaptain: true,
    isActive: 1
  });
  const [formErrors, setFormErrors] = useState({});

  // Addon items state
  const [addonItems, setAddonItems] = useState([]);

  useEffect(() => {
    fetchAddonsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchAddonsData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchAddonsData = async () => {
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

      const result = await ApiGet('/api/branch/addons/filter', params);

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
      setError('Failed to fetch addons');
      toast.error('Failed to fetch addons');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddonItems = async (addonsId) => {
    try {
      const result = await ApiGet('/api/branch/addons_items/addonsId', { id: addonsId });

      if (result.success) {
        const items = result.success.data.data || [];
        setAddonItems(items.map(item => ({
          id: item.id,
          name: item.name || '',
          price: item.price || 0,
          attribute: item.attribute || 'TOPPING',
          isActive: item.isActive ?? true
        })));
      }
    } catch (err) {
      toast.error('Failed to fetch addon items');
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
    const exportData = apiData.map(addon => ({
      ID: addon.id,
      Name: addon.name || '',
      Description: addon.description || '',
      Restaurant: addon.restaurantId?.name || 'N/A',
      'Min Addon': addon.minAddon || 0,
      'Max Addon': addon.maxAddon || 0,
      'Is Multiple': addon.isMultiple ? 'Yes' : 'No',
      'Show Online': addon.showOnline ? 'Yes' : 'No',
      'Show In Captain': addon.showInCaptain ? 'Yes' : 'No',
      Status: addon.isActive === 1 ? 'Active' : 'Inactive',
      'Created At': addon.createdAt ? new Date(addon.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Addons');
    XLSX.writeFile(workbook, `addons_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      minAddon: 0,
      maxAddon: 1,
      isMultiple: false,
      showOnline: true,
      showInCaptain: true,
      isActive: 1
    });
    setFormErrors({});
    setAddonItems([]);
  };

  const handleAdd = () => {
    resetForm();
    setSelectedAddon(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = async (addon) => {
    setSelectedAddon(addon);
    setFormData({
      name: addon.name || '',
      description: addon.description || '',
      minAddon: addon.minAddon || 0,
      maxAddon: addon.maxAddon || 1,
      isMultiple: addon.isMultiple ?? false,
      showOnline: addon.showOnline ?? true,
      showInCaptain: addon.showInCaptain ?? true,
      isActive: (addon.isActive === true || addon.isActive === 1) ? 1 : 0
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);

    // Fetch addon items for this addon
    await fetchAddonItems(addon.id);
  };

  const handleView = async (addon) => {
    setViewAddonName(addon.name);
    setShowViewModal(true);
    setViewLoading(true);
    setViewAddonItems([]);

    try {
      const result = await ApiGet('/api/branch/addons_items/addonsId', { id: addon.id });

      if (result.success) {
        const items = result.success.data.data || [];
        setViewAddonItems(items);
      } else {
        toast.error(result.fail || 'Failed to fetch addon items');
      }
    } catch (err) {
      toast.error('Failed to fetch addon items');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDeleteClick = (addon) => {
    setAddonToDelete(addon);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addonToDelete) return;

    setDeleteLoading(true);
    try {
      const payload = {
        id: addonToDelete.id,
        isDeleted: true,
        restaurantId: { id: addonToDelete.restaurantId?.id }
      };

      const result = await ApiPut('/api/branch/addons/update_addonItem', payload);

      if (result.success) {
        toast.success('Addon deleted successfully');
        setShowDeleteModal(false);
        setAddonToDelete(null);
        fetchAddonsData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete addon');
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (formData.minAddon < 0) {
      errors.minAddon = 'Min addon must be 0 or greater';
    }

    if (formData.maxAddon < 1) {
      errors.maxAddon = 'Max addon must be at least 1';
    }

    if (formData.minAddon > formData.maxAddon) {
      errors.minAddon = 'Min addon cannot be greater than max addon';
    }

    if (addonItems.length === 0) {
      errors.addonItems = 'At least one addon item is required';
    }

    // Check minimum selection requirement
    const minRequired = parseInt(formData.minAddon) || 0;
    if (addonItems.length < minRequired) {
      errors.addonItems = `Minimum ${minRequired} addon items required (Min Selection)`;
    }

    // Validate addon items
    addonItems.forEach((item, index) => {
      if (!item.name.trim()) {
        errors[`addonItem_${index}_name`] = 'Item name is required';
      }
      if (item.price < 0) {
        errors[`addonItem_${index}_price`] = 'Price must be 0 or greater';
      }
    });

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

  // Addon items handlers
  const addAddonItem = () => {
    setAddonItems(prev => [...prev, {
      name: '',
      price: 0,
      attribute: 'TOPPING',
      isActive: true
    }]);
  };

  const removeAddonItem = (index) => {
    setAddonItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateAddonItem = (index, field, value) => {
    setAddonItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear error
    if (formErrors[`addonItem_${index}_${field}`]) {
      setFormErrors(prev => ({ ...prev, [`addonItem_${index}_${field}`]: '' }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      let payload;
      let result;

      if (modalMode === 'add') {
        // Add payload - no branchId needed for branch module
        payload = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          minAddon: parseInt(formData.minAddon),
          maxAddon: parseInt(formData.maxAddon),
          isMultiple: formData.isMultiple,
          showOnline: formData.showOnline,
          showInCaptain: formData.showInCaptain,
          isActive: formData.isActive ? 1 : 0,
          addonItems: addonItems.map(item => ({
            name: item.name.trim(),
            price: parseFloat(item.price) || 0,
            attribute: item.attribute,
            isActive: item.isActive
          }))
        };

        result = await ApiPost('/api/branch/addons/add_addonItem', payload);
      } else {
        // Update payload - no branchId needed for branch module
        payload = {
          id: selectedAddon.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          minAddon: parseInt(formData.minAddon),
          maxAddon: parseInt(formData.maxAddon),
          isMultiple: formData.isMultiple,
          showOnline: formData.showOnline,
          showInCaptain: formData.showInCaptain,
          isActive: formData.isActive ? 1 : 0,
          addonItems: addonItems.map(item => ({
            name: item.name.trim(),
            price: parseFloat(item.price) || 0,
            attribute: item.attribute,
            isActive: item.isActive
          }))
        };

        result = await ApiPut('/api/branch/addons/update_addonItem', payload);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Addon added successfully' : 'Addon updated successfully');
        setShowModal(false);
        fetchAddonsData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save addon');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive === 1 || isActive === true) {
      return <Badge bg="success">Active</Badge>;
    } else {
      return <Badge bg="danger">Inactive</Badge>;
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-plus-circle me-2"></i>
          Addons
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
              placeholder="Search addons..."
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
            Add Addon
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
              <th>Min/Max</th>
              <th>Multiple</th>
              <th>Online</th>
              <th>Captain</th>
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
                  No addons found
                </td>
              </tr>
            ) : (
              paginatedData.map((addon) => (
                <tr key={addon.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleView(addon)}
                        disabled={loading}
                        title="View Addon Items"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(addon)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(addon)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{addon.id}</strong></td>
                  <td>
                    <div>
                      <strong>{addon.name || 'N/A'}</strong>
                    </div>
                    {addon.description && (
                      <small className="text-muted">{addon.description.substring(0, 50)}{addon.description.length > 50 ? '...' : ''}</small>
                    )}
                  </td>
                  <td>
                    <Badge bg="info">{addon.minAddon || 0} - {addon.maxAddon || 0}</Badge>
                  </td>
                  <td>
                    {addon.isMultiple ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill text-danger"></i>
                    )}
                  </td>
                  <td>
                    {addon.showOnline ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill text-danger"></i>
                    )}
                  </td>
                  <td>
                    {addon.showInCaptain ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill text-danger"></i>
                    )}
                  </td>
                  <td>{getStatusBadge(addon.isActive)}</td>
                  <td>{addon.createdAt ? new Date(addon.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Addon Form Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        dialogClassName="modal-dialog-wide"
        contentClassName="modal-content-wide"
      >
        <style>
          {`
            .modal-dialog-wide {
              max-width: 70vw !important;
              width: 70vw !important;
            }
            @media (max-width: 768px) {
              .modal-dialog-wide {
                max-width: 90vw !important;
                width: 90vw !important;
              }
            }
          `}
        </style>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Addon' : 'Edit Addon'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            {/* Basic Info */}
            <Card className="mb-3">
              <Card.Header className="bg-light">
                <strong><i className="bi bi-info-circle me-2"></i>Basic Information</strong>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Addon Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Enter addon name"
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
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        placeholder="Enter addon description"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Min Selection</Form.Label>
                      <Form.Control
                        type="number"
                        name="minAddon"
                        value={formData.minAddon}
                        onChange={handleFormChange}
                        min="0"
                        isInvalid={!!formErrors.minAddon}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.minAddon}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Selection</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxAddon"
                        value={formData.maxAddon}
                        onChange={handleFormChange}
                        min="1"
                        isInvalid={!!formErrors.maxAddon}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.maxAddon}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Options</Form.Label>
                      <div className="d-flex flex-wrap gap-3 mt-2">
                        <Form.Check
                          type="switch"
                          id="showOnline"
                          name="showOnline"
                          label="Show Online"
                          checked={formData.showOnline}
                          onChange={handleFormChange}
                        />
                        <Form.Check
                          type="switch"
                          id="showInCaptain"
                          name="showInCaptain"
                          label="Show In Captain"
                          checked={formData.showInCaptain}
                          onChange={handleFormChange}
                        />
                        <Form.Check
                          type="switch"
                          id="isActive"
                          name="isActive"
                          label="Active"
                          checked={formData.isActive === 1}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked ? 1 : 0 }))}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Addon Items */}
            <Card>
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <strong><i className="bi bi-list-ul me-2"></i>Addon Items <span className="text-danger">*</span></strong>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={addAddonItem}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Add Item
                </Button>
              </Card.Header>
              <Card.Body>
                {formErrors.addonItems && (
                  <div className="alert alert-danger py-2" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {formErrors.addonItems}
                  </div>
                )}

                {addonItems.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No addon items added. Click "Add Item" to add one.
                  </div>
                ) : (
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Item Name <span className="text-danger">*</span></th>
                        <th style={{ width: '20%' }}>Price</th>
                        <th style={{ width: '20%' }}>Attribute</th>
                        <th style={{ width: '10%' }}>Active</th>
                        <th style={{ width: '10%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addonItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Form.Control
                              type="text"
                              size="sm"
                              value={item.name}
                              onChange={(e) => updateAddonItem(index, 'name', e.target.value)}
                              placeholder="Item name"
                              isInvalid={!!formErrors[`addonItem_${index}_name`]}
                            />
                            {formErrors[`addonItem_${index}_name`] && (
                              <div className="text-danger" style={{ fontSize: '0.75em' }}>
                                {formErrors[`addonItem_${index}_name`]}
                              </div>
                            )}
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              size="sm"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateAddonItem(index, 'price', e.target.value)}
                              min="0"
                              isInvalid={!!formErrors[`addonItem_${index}_price`]}
                            />
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={item.attribute}
                              onChange={(e) => updateAddonItem(index, 'attribute', e.target.value)}
                            >
                              {attributeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </Form.Select>
                          </td>
                          <td className="text-center">
                            <Form.Check
                              type="switch"
                              checked={item.isActive}
                              onChange={(e) => updateAddonItem(index, 'isActive', e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeAddonItem(index)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
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
                  {modalMode === 'add' ? 'Add Addon' : 'Update Addon'}
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
            Delete Addon
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>"{addonToDelete?.name}"</strong>?</p>
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

      {/* View Addon Items Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-eye me-2" style={{ color: primaryColor }}></i>
            Addon Items - {viewAddonName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <div className="mt-2">Loading addon items...</div>
            </div>
          ) : viewAddonItems.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No addon items found for this addon.
            </div>
          ) : (
            <Table bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Attribute</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {viewAddonItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{index + 1}</td>
                    <td><strong>{item.name || 'N/A'}</strong></td>
                    <td>
                      <Badge bg="success">$ {item.price || 0}</Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">{item.attribute || 'N/A'}</Badge>
                    </td>
                    <td>
                      {item.isActive ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="danger">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Addons;
