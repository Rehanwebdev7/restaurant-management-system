import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal, Image, Card } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPostFormData, ApiPost } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const MenuItems = () => {
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Dropdowns data - no branches needed for branch module
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [addons, setAddons] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // Dietary type options (true = Veg, false = Non-Veg)
  const dietaryTypeOptions = [
    { value: true, label: 'Veg' },
    { value: false, label: 'Non Veg' }
  ];

  // Form state - no branchId needed for branch module
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    costPrice: '',
    dietaryType: true,
    isAvailable: true,
    availableOnline: true,
    preparationMinutes: 15,
    deliveryMinutes: 30,
    isRecommended: false,
    spiceLevel: 'MEDIUM',
    priority: 1,
    isActive: true,
    menuCategoryId: '',
    menuSubcategoryId: '',
    addonsId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Image cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  // For edit mode - store selected names
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState('');

  // Add Addon Modal state
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [addonFormLoading, setAddonFormLoading] = useState(false);
  const [addonFormData, setAddonFormData] = useState({
    name: '',
    description: '',
    minAddon: 0,
    maxAddon: 1,
    isMultiple: false,
    showOnline: true,
    showInCaptain: true,
    isActive: 1
  });
  const [addonFormErrors, setAddonFormErrors] = useState({});
  const [addonItems, setAddonItems] = useState([]);

  // Attribute options for addon items
  const attributeOptions = [
    { value: 'TOPPING', label: 'Topping' },
    { value: 'EXTRA', label: 'Extra' },
    { value: 'SIZE', label: 'Size' },
    { value: 'FLAVOR', label: 'Flavor' },
    { value: 'SAUCE', label: 'Sauce' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    fetchMenuItemsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchAddons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (formData.menuCategoryId) {
      const filtered = subcategories.filter(sub =>
        sub.menuCategoryId?.id === parseInt(formData.menuCategoryId)
      );
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories(subcategories);
    }
  }, [formData.menuCategoryId, subcategories]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchMenuItemsData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const result = await ApiGet('/api/branch/menu_category/filter', {
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setCategories(data.records || []);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchSubcategories = async () => {
    setSubcategoriesLoading(true);
    try {
      const result = await ApiGet('/api/branch/menu_subcategory/filter', {
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setSubcategories(data.records || []);
        setFilteredSubcategories(data.records || []);
      } else {
        toast.error('Failed to fetch subcategories');
      }
    } catch (err) {
      toast.error('Failed to fetch subcategories');
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const fetchAddons = async () => {
    setAddonsLoading(true);
    try {
      const result = await ApiGet('/api/branch/addons/filter', {
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setAddons(data.records || []);
      }
    } catch (err) {
      // Addons might not be available, ignore error
    } finally {
      setAddonsLoading(false);
    }
  };

  const fetchMenuItemsData = async () => {
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

      if (categoryFilter) {
        params.categoryId = categoryFilter;
      }

      const result = await ApiGet('/api/branch/menu_items/filter', params);

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
      setError('Failed to fetch menu items');
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (selected) => {
    setCategoryFilter(selected ? selected.value : '');
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = apiData.map(item => ({
      ID: item.id,
      Name: item.name || '',
      Description: item.description || '',
      Price: item.price || 0,
      MRP: item.mrp || 0,
      'Cost Price': item.costPrice || 0,
      'Prep Time (mins)': item.preparationMinutes || 0,
      Restaurant: item.restaurantId?.name || 'N/A',
      Branch: item.branchId?.name || 'N/A',
      Category: item.menuCategoryId?.name || 'N/A',
      Subcategory: item.menuSubcategoryId?.name || 'N/A',
      'Dietary Type': item.dietaryType === true ? 'Veg' : item.dietaryType === false ? 'Non Veg' : 'N/A',
      Available: item.isAvailable ? 'Yes' : 'No',
      'Available Online': item.availableOnline ? 'Yes' : 'No',
      Recommended: item.isRecommended ? 'Yes' : 'No',
      Status: item.isActive ? 'Active' : 'Inactive',
      'Created At': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Items');
    XLSX.writeFile(workbook, `menu_items_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      mrp: '',
      costPrice: '',
      dietaryType: true,
      isAvailable: true,
      availableOnline: true,
      preparationMinutes: 15,
      deliveryMinutes: 30,
      isRecommended: false,
      spiceLevel: 'MEDIUM',
      priority: 1,
      isActive: true,
      menuCategoryId: '',
      menuSubcategoryId: '',
      addonsId: ''
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setSelectedCategoryName('');
    setSelectedSubcategoryName('');
  };

  const handleAdd = () => {
    resetForm();
    setSelectedItem(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    const catId = item.menuCategoryId?.id;
    const subCatId = item.menuSubcategoryId?.id;
    const addonId = item.addonsId?.id;

    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      mrp: item.mrp || '',
      costPrice: item.costPrice || '',
      dietaryType: item.dietaryType ?? true,
      isAvailable: item.isAvailable ?? true,
      availableOnline: item.availableOnline ?? true,
      preparationMinutes: item.preparationMinutes || 15,
      deliveryMinutes: item.deliveryMinutes || 30,
      isRecommended: item.isRecommended ?? false,
      spiceLevel: item.spiceLevel || 'MEDIUM',
      priority: item.priority || 1,
      isActive: item.isActive ?? true,
      menuCategoryId: catId != null ? catId : '',
      menuSubcategoryId: subCatId != null ? subCatId : '',
      addonsId: addonId != null ? addonId : ''
    });
    setSelectedCategoryName(item.menuCategoryId?.name || '');
    setSelectedSubcategoryName(item.menuSubcategoryId?.name || '');
    setFormErrors({});
    setImageFile(null);
    setImagePreview(item.imageUrl || null);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    try {
      const payload = {
        id: itemToDelete.id,
        isDeleted: true
      };

      const formDataToSend = new FormData();
      formDataToSend.append('payload', JSON.stringify(payload));

      const result = await ApiPostFormData('/api/branch/menu_items/update_Menu', formDataToSend);

      if (result.success) {
        toast.success('Menu item deleted successfully');
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchMenuItemsData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete menu item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.menuCategoryId) {
      errors.menuCategoryId = 'Category is required';
    }

    if (!formData.menuSubcategoryId) {
      errors.menuSubcategoryId = 'Subcategory is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Valid price is required';
    }

    if (!formData.mrp || parseFloat(formData.mrp) <= 0) {
      errors.mrp = 'Valid MRP is required';
    }

    if (parseFloat(formData.price) > parseFloat(formData.mrp)) {
      errors.price = 'Price cannot be greater than MRP';
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

  // Addon Modal Handlers
  const resetAddonForm = () => {
    setAddonFormData({
      name: '',
      description: '',
      minAddon: 0,
      maxAddon: 1,
      isMultiple: false,
      showOnline: true,
      showInCaptain: true,
      isActive: 1
    });
    setAddonFormErrors({});
    setAddonItems([]);
  };

  const handleOpenAddonModal = () => {
    resetAddonForm();
    setShowAddonModal(true);
  };

  const handleAddonFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddonFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (addonFormErrors[name]) {
      setAddonFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

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

    if (addonFormErrors[`addonItem_${index}_${field}`]) {
      setAddonFormErrors(prev => ({ ...prev, [`addonItem_${index}_${field}`]: '' }));
    }
  };

  const validateAddonForm = () => {
    const errors = {};

    if (!addonFormData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (addonFormData.minAddon < 0) {
      errors.minAddon = 'Min addon must be 0 or greater';
    }

    if (addonFormData.maxAddon < 1) {
      errors.maxAddon = 'Max addon must be at least 1';
    }

    if (addonFormData.minAddon > addonFormData.maxAddon) {
      errors.minAddon = 'Min addon cannot be greater than max addon';
    }

    if (addonItems.length === 0) {
      errors.addonItems = 'At least one addon item is required';
    }

    addonItems.forEach((item, index) => {
      if (!item.name.trim()) {
        errors[`addonItem_${index}_name`] = 'Item name is required';
      }
      if (item.price < 0) {
        errors[`addonItem_${index}_price`] = 'Price must be 0 or greater';
      }
    });

    setAddonFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddonModalSubmit = async (e) => {
    e.preventDefault();

    if (!validateAddonForm()) {
      return;
    }

    setAddonFormLoading(true);

    try {
      const payload = {
        name: addonFormData.name.trim(),
        description: addonFormData.description.trim(),
        minAddon: parseInt(addonFormData.minAddon),
        maxAddon: parseInt(addonFormData.maxAddon),
        isMultiple: addonFormData.isMultiple,
        showOnline: addonFormData.showOnline,
        showInCaptain: addonFormData.showInCaptain,
        isActive: addonFormData.isActive ? 1 : 0,
        addonItems: addonItems.map(item => ({
          name: item.name.trim(),
          price: parseFloat(item.price) || 0,
          attribute: item.attribute,
          isActive: item.isActive
        }))
      };

      const result = await ApiPost('/api/branch/addons/add_addonItem', payload);

      if (result.success) {
        toast.success('Addon added successfully');
        setShowAddonModal(false);

        // Refresh addons list
        await fetchAddons();

        // Auto-select the newly created addon
        const newAddonId = result.success.data?.data?.id;
        if (newAddonId) {
          setFormData(prev => ({ ...prev, addonsId: newAddonId }));
        }
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save addon');
    } finally {
      setAddonFormLoading(false);
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
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        dietaryType: formData.dietaryType,
        isAvailable: formData.isAvailable,
        availableOnline: formData.availableOnline,
        preparationMinutes: parseInt(formData.preparationMinutes),
        deliveryMinutes: parseInt(formData.deliveryMinutes),
        isRecommended: formData.isRecommended,
        spiceLevel: formData.spiceLevel,
        priority: parseInt(formData.priority),
        isActive: formData.isActive,
        menuCategoryId: { id: parseInt(formData.menuCategoryId) },
        menuSubcategoryId: { id: parseInt(formData.menuSubcategoryId) }
      };

      if (formData.addonsId) {
        payload.addonsId = { id: parseInt(formData.addonsId) };
      }

      if (modalMode === 'edit') {
        payload.id = selectedItem.id;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('payload', JSON.stringify(payload));

      if (imageFile) {
        formDataToSend.append('photo', imageFile);
      }

      const endpoint = modalMode === 'add'
        ? '/api/branch/menu_items/add_Menu'
        : '/api/branch/menu_items/update_Menu';

      const result = await ApiPostFormData(endpoint, formDataToSend);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Menu item added successfully' : 'Menu item updated successfully');
        setShowModal(false);
        fetchMenuItemsData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save menu item');
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

  const getDietaryBadge = (dietaryType) => {
    if (dietaryType === true) {
      return <Badge bg="success">Veg</Badge>;
    } else if (dietaryType === false) {
      return <Badge bg="danger">Non Veg</Badge>;
    }
    return <Badge bg="secondary">N/A</Badge>;
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-utensils me-2"></i>
          Menu Items
        </h2>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={3}>
          <InputGroup style={{ height: '42px' }}>
            <InputGroup.Text style={{ height: '42px' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search menu items..."
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
        <Col md={3}>
          <Select
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name
            }))}
            value={categoryFilter ? {
              value: categoryFilter,
              label: categories.find(c => c.id === parseInt(categoryFilter))?.name || ''
            } : null}
            onChange={handleCategoryFilterChange}
            isClearable
            isSearchable
            placeholder="Filter by Category"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              control: (base) => ({
                ...base,
                height: '42px',
                minHeight: '42px'
              }),
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999
              })
            }}
          />
        </Col>
        <Col md={4} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Item
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
              <th>Description</th>
              <th>Category</th>
              <th>Addon</th>
              <th>Price</th>
              <th>MRP</th>
              <th>Our Cost</th>
              <th>Prep Time</th>
              <th>Dietary</th>
              <th>Available</th>
              <th>Online</th>
              <th>Recommended</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={16} />
            ) : error ? (
              <tr>
                <td colSpan="16" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="16" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No menu items found
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(item)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{item.id}</strong></td>
                  <td>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
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
                  <td>
                    <div>
                      <strong>{item.name || 'N/A'}</strong>
                    </div>
                    <small className="text-muted">{item.menuSubcategoryId?.name || ''}</small>
                  </td>
                  <td>
                    {item.description ? (
                      <details>
                        <summary style={{ cursor: 'pointer' }}>View</summary>
                        {item.description}
                      </details>
                    ) : 'N/A'}
                  </td>
                  <td>{item.menuCategoryId?.name || 'N/A'}</td>
                  <td>{item.addonsId?.name || 'N/A'}</td>
                  <td><strong>${item.price || 0}</strong></td>
                  <td><span className="text-muted text-decoration-line-through">${item.mrp || 0}</span></td>
                  <td>${item.costPrice || 0}</td>
                  <td>{item.preparationMinutes ? `${item.preparationMinutes} min` : '-'}</td>
                  <td>{getDietaryBadge(item.dietaryType)}</td>
                  <td>
                    {item.isAvailable ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill text-danger"></i>
                    )}
                  </td>
                  <td>
                    {item.availableOnline ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill text-danger"></i>
                    )}
                  </td>
                  <td>
                    {item.isRecommended ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill text-danger"></i>
                    )}
                  </td>
                  <td>{getStatusBadge(item.isActive)}</td>
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

      {/* Menu Item Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            {/* Category & Subcategory Row */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name
                    }))}
                    value={formData.menuCategoryId !== '' && formData.menuCategoryId != null ? {
                      value: Number(formData.menuCategoryId),
                      label: categories.find(c => c.id === Number(formData.menuCategoryId))?.name
                        || selectedCategoryName
                        || `Category ${formData.menuCategoryId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({
                        ...prev,
                        menuCategoryId: selected ? selected.value : '',
                        menuSubcategoryId: ''
                      }));
                      setSelectedCategoryName(selected ? selected.label : '');
                      setSelectedSubcategoryName('');
                      if (formErrors.menuCategoryId) {
                        setFormErrors(prev => ({ ...prev, menuCategoryId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={categoriesLoading}
                    placeholder="Search & Select Category"
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subcategory <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={filteredSubcategories.map((sub) => ({
                      value: sub.id,
                      label: sub.name
                    }))}
                    value={formData.menuSubcategoryId !== '' && formData.menuSubcategoryId != null ? {
                      value: Number(formData.menuSubcategoryId),
                      label: filteredSubcategories.find(s => s.id === Number(formData.menuSubcategoryId))?.name
                        || selectedSubcategoryName
                        || `Subcategory ${formData.menuSubcategoryId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, menuSubcategoryId: selected ? selected.value : '' }));
                      setSelectedSubcategoryName(selected ? selected.label : '');
                      if (formErrors.menuSubcategoryId) {
                        setFormErrors(prev => ({ ...prev, menuSubcategoryId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={subcategoriesLoading}
                    isDisabled={!formData.menuCategoryId}
                    placeholder={formData.menuCategoryId ? "Search & Select Subcategory" : "Select Category first"}
                    noOptionsMessage={() => "No subcategories found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.menuSubcategoryId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.menuSubcategoryId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.menuSubcategoryId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.menuSubcategoryId}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* Subcategory & Addon Row */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter item name"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <Form.Label className="mb-0">Addons (Optional)</Form.Label>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={handleOpenAddonModal}
                      title="Add New Addon"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </Button>
                  </div>
                  <Select
                    options={addons.map((addon) => ({
                      value: addon.id,
                      label: addon.name || `Addon ${addon.id}`
                    }))}
                    value={formData.addonsId ? {
                      value: Number(formData.addonsId),
                      label: addons.find(a => a.id === Number(formData.addonsId))?.name || `Addon ${formData.addonsId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, addonsId: selected ? selected.value : '' }));
                    }}
                    isClearable
                    isSearchable
                    isLoading={addonsLoading}
                    placeholder="Select Addons"
                    noOptionsMessage={() => "No addons found"}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Price Row */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="Enter price"
                    isInvalid={!!formErrors.price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>MRP <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleFormChange}
                    placeholder="Enter MRP"
                    isInvalid={!!formErrors.mrp}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.mrp}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Our Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleFormChange}
                    placeholder="Enter cost price"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Dietary Type Row */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dietary Type</Form.Label>
                  <Select
                    options={dietaryTypeOptions}
                    value={dietaryTypeOptions.find(opt => opt.value === formData.dietaryType)}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, dietaryType: selected ? selected.value : true }));
                    }}
                    isSearchable
                    placeholder="Select Dietary Type"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prep Time (mins)</Form.Label>
                  <Form.Control
                    type="number"
                    name="preparationMinutes"
                    value={formData.preparationMinutes}
                    onChange={handleFormChange}
                    placeholder="Enter prep time"
                    min="0"
                    onWheel={(e) => e.target.blur()}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Image & Toggles Row */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Image</Form.Label>
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
                  <Form.Label>Settings</Form.Label>
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    <Form.Check
                      type="switch"
                      id="isActive"
                      name="isActive"
                      label="Active"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                    />
                    <Form.Check
                      type="switch"
                      id="isAvailable"
                      name="isAvailable"
                      label="Available"
                      checked={formData.isAvailable}
                      onChange={handleFormChange}
                    />
                    <Form.Check
                      type="switch"
                      id="availableOnline"
                      name="availableOnline"
                      label="Online"
                      checked={formData.availableOnline}
                      onChange={handleFormChange}
                    />
                    <Form.Check
                      type="switch"
                      id="isRecommended"
                      name="isRecommended"
                      label="Recommended"
                      checked={formData.isRecommended}
                      onChange={handleFormChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Description Row */}
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
                    placeholder="Enter item description"
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
                  {modalMode === 'add' ? 'Add Item' : 'Update Item'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Addon Modal */}
      <Modal
        show={showAddonModal}
        onHide={() => setShowAddonModal(false)}
        centered
        dialogClassName="modal-dialog-addon-wide"
        contentClassName="modal-content-addon-wide"
      >
        <style>
          {`
            .modal-dialog-addon-wide {
              max-width: 70vw !important;
              width: 70vw !important;
            }
            @media (max-width: 768px) {
              .modal-dialog-addon-wide {
                max-width: 90vw !important;
                width: 90vw !important;
              }
            }
          `}
        </style>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-plus me-2"></i>
            Add Addon
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddonModalSubmit}>
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
                        value={addonFormData.name}
                        onChange={handleAddonFormChange}
                        placeholder="Enter addon name"
                        isInvalid={!!addonFormErrors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {addonFormErrors.name}
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
                        value={addonFormData.description}
                        onChange={handleAddonFormChange}
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
                        value={addonFormData.minAddon}
                        onChange={handleAddonFormChange}
                        min="0"
                        isInvalid={!!addonFormErrors.minAddon}
                      />
                      <Form.Control.Feedback type="invalid">
                        {addonFormErrors.minAddon}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Selection</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxAddon"
                        value={addonFormData.maxAddon}
                        onChange={handleAddonFormChange}
                        min="1"
                        isInvalid={!!addonFormErrors.maxAddon}
                      />
                      <Form.Control.Feedback type="invalid">
                        {addonFormErrors.maxAddon}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Options</Form.Label>
                      <div className="d-flex flex-wrap gap-3 mt-2">
                        <Form.Check
                          type="switch"
                          id="addonIsMultiple"
                          name="isMultiple"
                          label="Allow Multiple"
                          checked={addonFormData.isMultiple}
                          onChange={handleAddonFormChange}
                        />
                        <Form.Check
                          type="switch"
                          id="addonShowOnline"
                          name="showOnline"
                          label="Show Online"
                          checked={addonFormData.showOnline}
                          onChange={handleAddonFormChange}
                        />
                        <Form.Check
                          type="switch"
                          id="addonShowInCaptain"
                          name="showInCaptain"
                          label="Show In Captain"
                          checked={addonFormData.showInCaptain}
                          onChange={handleAddonFormChange}
                        />
                        <Form.Check
                          type="switch"
                          id="addonIsActive"
                          name="isActive"
                          label="Active"
                          checked={addonFormData.isActive === 1}
                          onChange={(e) => setAddonFormData(prev => ({ ...prev, isActive: e.target.checked ? 1 : 0 }))}
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
                {addonFormErrors.addonItems && (
                  <div className="alert alert-danger py-2" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {addonFormErrors.addonItems}
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
                              isInvalid={!!addonFormErrors[`addonItem_${index}_name`]}
                            />
                            {addonFormErrors[`addonItem_${index}_name`] && (
                              <div className="text-danger" style={{ fontSize: '0.75em' }}>
                                {addonFormErrors[`addonItem_${index}_name`]}
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
                              isInvalid={!!addonFormErrors[`addonItem_${index}_price`]}
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
            <Button variant="secondary" onClick={() => setShowAddonModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              disabled={addonFormLoading}
            >
              {addonFormLoading ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Add Addon
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
            Delete Menu Item
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>"{itemToDelete?.name}"</strong>?</p>
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
        aspectRatio={16/9}
        title="Crop Menu Item Image"
        primaryColor={primaryColor}
      />
    </Container>
  );
};

export default MenuItems;
