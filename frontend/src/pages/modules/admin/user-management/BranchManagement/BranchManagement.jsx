import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../../../../../ApiServices/ApiServices';
import apiClient from '../../../../../api/apiClient';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const BranchManagement = () => {
  const { primaryColor } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Restaurant dropdown data
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    // password: '',
    isActive: true,
    restaurantId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Delivery Zones Modal State
  const [showDZModal, setShowDZModal] = useState(false);
  const [dzLoading, setDzLoading] = useState(false);
  const [dzSaving, setDzSaving] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [dzHasChanges, setDzHasChanges] = useState(false);
  const [selectedBranchForDZ, setSelectedBranchForDZ] = useState(null);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState([]);
  const [selectedBranchForProfile, setSelectedBranchForProfile] = useState(null);
  const [profileFormData, setProfileFormData] = useState({
    branchId: '',
    address: '',
    phone: '',
    alternatePhone: '',
    latitude: '',
    longitude: '',
    isActive: true
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSearching, setLocationSearching] = useState(false);

  useEffect(() => {
    fetchBranchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchBranchData();
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

  const fetchBranchData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        role: 'branch',
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }

      if (statusFilter) {
        params.isActive = statusFilter === 'active';
      }

      const result = await ApiGet('/api/admin/users/filter', params);

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
      setError('Failed to fetch branches');
      toast.error('Failed to fetch branches');
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
    const exportData = apiData.map(branch => ({
      ID: branch.id,
      Name: branch.name || '',
      Mobile: branch.mobile || '',
      Email: branch.email || '',
      Restaurant: branch.parentId?.name || 'N/A',
      Latitude: branch.latitude || '',
      Longitude: branch.longitude || '',
      Role: branch.role || '',
      Status: branch.isActive ? 'Active' : 'Inactive',
      'Created At': branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Branches');
    XLSX.writeFile(workbook, `branches_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      // password: '',
      isActive: true,
      restaurantId: ''
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setSelectedUser(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      // password: '',
      isActive: user.isActive ?? true,
      restaurantId: user.parentId?.id ? Number(user.parentId.id) : ''
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete branch "${user.name}"?`)) {
      try {
        const result = await ApiDelete(`/api/admin/users/${user.id}`);
        if (result.success) {
          toast.success('Branch deleted successfully');
          fetchBranchData();
        } else {
          toast.error(result.fail);
        }
      } catch (err) {
        toast.error('Failed to delete branch');
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      errors.mobile = 'Mobile number must be 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // if (modalMode === 'add' && !formData.password.trim()) {
    //   errors.password = 'Password is required';
    // }

    if (!formData.restaurantId) {
      errors.restaurantId = 'Restaurant is required';
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

    // Clear error when user starts typing
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
      let result;
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        mobile: formData.mobile.trim(),
        role: 'branch',
        isActive: formData.isActive,
        parentId: {
          id: parseInt(formData.restaurantId)
        }
      };
// if (formData.password.trim()) {//   payload.password = formData.password.trim();// }

      if (modalMode === 'add') {
        result = await ApiPost('/api/admin/users/add', payload);
        if (result.success) {
          toast.success('Branch added successfully');
          setShowModal(false);
          fetchBranchData();
        } else {
          toast.error(result.fail);
        }
      } else {
        payload.id = selectedUser.id;
        result = await ApiPut('/api/admin/users/update', payload);
        if (result.success) {
          toast.success('Branch updated successfully');
          setShowModal(false);
          fetchBranchData();
        } else {
          toast.error(result.fail);
        }
      }
    } catch (err) {
      toast.error('Failed to save branch');
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

  const handleBulkUpdateMenu = (branch) => {
    navigate(`/superadmin/user-management/items-bulk-update?branchId=${branch.id}&branchName=${encodeURIComponent(branch.name || 'Branch')}`);
  };

  const handleDeliveryZones = async (branch) => {
    setSelectedBranchForDZ(branch);
    setShowDZModal(true);
    setDzLoading(true);
    setDzHasChanges(false);

    try {
      const result = await ApiGet('/api/admin/delivery_zones/filter', {
        branchId: branch.id,
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        const zones = (data.records || []).map(zone => ({
          ...zone,
          _modified: false,
          _isNew: false
        }));
        setDeliveryZones(zones);
      } else {
        setDeliveryZones([]);
        toast.error(result.fail);
      }
    } catch (err) {
      setDeliveryZones([]);
      toast.error('Failed to fetch delivery zones');
    } finally {
      setDzLoading(false);
    }
  };

  const handleDZChange = (index, field, value) => {
    setDeliveryZones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, _modified: true };
      return updated;
    });
    setDzHasChanges(true);
  };

  const addNewDZ = () => {
    setDeliveryZones(prev => [...prev, {
      zoneName: '',
      description: '',
      radiusKmFrom: 0,
      radiusKmTo: 5,
      deliveryCharge: 0,
      isActive: true,
      _modified: true,
      _isNew: true
    }]);
    setDzHasChanges(true);
  };

  const removeDZ = (index) => {
    const zone = deliveryZones[index];
    if (zone._isNew) {
      setDeliveryZones(prev => prev.filter((_, i) => i !== index));
    } else {
      handleDZChange(index, 'isActive', false);
    }
    setDzHasChanges(true);
  };

  const handleSaveDZ = async () => {
    const errors = [];
    deliveryZones.forEach((zone, index) => {
      const radiusFrom = parseFloat(zone.radiusKmFrom) || 0;
      const radiusTo = parseFloat(zone.radiusKmTo) || 0;

      if (!zone.zoneName?.trim()) errors.push(`Zone ${index + 1}: Zone name is required`);
      if (radiusFrom > radiusTo) errors.push(`Zone ${index + 1}: Radius From cannot be greater than Radius To`);
    });
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    const modifiedZones = deliveryZones.filter(zone => zone._modified);
    if (modifiedZones.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setDzSaving(true);
    try {
      const payload = modifiedZones.map(zone => ({
        ...(zone.id && { id: zone.id }),
        branchId: { id: parseInt(selectedBranchForDZ.id) },
        zoneName: zone.zoneName?.trim(),
        description: zone.description?.trim() || '',
        radiusKmFrom: parseFloat(zone.radiusKmFrom) || 0,
        radiusKmTo: parseFloat(zone.radiusKmTo) || 0,
        deliveryCharge: parseFloat(zone.deliveryCharge) || 0,
        isActive: zone.isActive
      }));

      const result = await ApiPost('/api/admin/delivery_zones/bulkUpdate', payload);
      if (result.success) {
        toast.success(`${modifiedZones.length} zone(s) saved successfully`);
        handleDeliveryZones(selectedBranchForDZ);
      } else {
        toast.error(result.fail || 'Failed to save zones');
      }
    } catch (err) {
      toast.error('Failed to save delivery zones');
    } finally {
      setDzSaving(false);
    }
  };

  const blockWheelChange = (e) => {
    e.currentTarget.blur();
  };

  const handleRestaurantHours = (branch) => {
    navigate(`/superadmin/user-management/restaurant-hours?branchId=${branch.id}&branchName=${encodeURIComponent(branch.name || 'Branch')}&restaurantId=${branch.parentId?.id || ''}`);
  };

  // Profile Modal Functions
  const handleProfile = async (branch) => {
    setSelectedBranchForProfile(branch);
    setShowProfileModal(true);
    setProfileLoading(true);
    setLocationQuery('');
    setLocationSuggestions([]);

    setProfileFormData({
      branchId: branch.id || '',
      address: '',
      phone: branch.mobile || '',
      alternatePhone: '',
      latitude: '',
      longitude: '',
      isActive: true,
      // Branch edit fields
      name: branch.name || '',
      email: branch.email || '',
      mobile: branch.mobile || '',
      password: '',
      branchIsActive: branch.isActive ?? true,
      restaurantId: branch.parentId?.id ? Number(branch.parentId.id) : ''
    });

    try {
      const result = await ApiGet(`/api/admin/users_profile/branchId`, { id: branch.id });

      if (result.success) {
        const data = result.success.data.data || [];
        setProfileData(data);
        if (data.length > 0) {
          const profile = data[0];
          setProfileFormData(prev => ({
            ...prev,
            address: profile.address || '',
            phone: profile.phone || prev.phone,
            alternatePhone: profile.alternatePhone || '',
            latitude: profile.latitude || '',
            longitude: profile.longitude || '',
            isActive: profile.isActive ?? true
          }));
        }
      } else {
        setProfileData([]);
      }
    } catch (err) {
      setProfileData([]);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Location search functions
  useEffect(() => {
    if (!locationQuery.trim()) {
      setLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const response = await apiClient.get(`/api/public/customer/search?q=${encodeURIComponent(locationQuery.trim())}`);
        const data = response.data || [];
        setLocationSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        setLocationSuggestions([]);
      } finally {
        setLocationSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleSelectLocation = async (placeId, title) => {
    setLocationQuery('');
    setLocationSuggestions([]);
    try {
      const response = await apiClient.get(`/api/public/customer/details?placeId=${placeId}`);
      const { lat, lng, address } = response.data || {};
      setProfileFormData(prev => ({
        ...prev,
        latitude: lat ? String(lat) : prev.latitude,
        longitude: lng ? String(lng) : prev.longitude,
        address: address || title || prev.address
      }));
    } catch (err) {
      toast.error('Failed to get location details');
    }
  };

  const handleProfileSubmit = async () => {
    // Validate branch fields
    if (!profileFormData.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!profileFormData.mobile?.trim()) {
      toast.error('Mobile number is required');
      return;
    }
    if (profileFormData.mobile?.trim() && !/^\d{10}$/.test(profileFormData.mobile.trim())) {
      toast.error('Mobile number must be 10 digits');
      return;
    }
    if (!profileFormData.restaurantId) {
      toast.error('Restaurant is required');
      return;
    }

    setProfileSubmitting(true);
    try {
      // 1. Update branch info
      const branchPayload = {
        id: profileFormData.branchId,
        name: profileFormData.name.trim(),
        email: profileFormData.email?.trim() || null,
        mobile: profileFormData.mobile.trim(),
        role: 'branch',
        isActive: profileFormData.branchIsActive,
        parentId: {
          id: parseInt(profileFormData.restaurantId)
        }
      };
      if (profileFormData.password?.trim()) {
        branchPayload.password = profileFormData.password.trim();
      }

      const branchResult = await ApiPut('/api/admin/users/update', branchPayload);
      if (!branchResult.success) {
        toast.error(branchResult.fail || 'Failed to update branch');
        setProfileSubmitting(false);
        return;
      }

      // 2. Update profile info
      const profilePayload = {
        branchId: {
          id: profileFormData.branchId
        },
        address: profileFormData.address,
        phone: profileFormData.mobile,
        alternatePhone: profileFormData.alternatePhone,
        latitude: profileFormData.latitude ? parseFloat(profileFormData.latitude) : null,
        longitude: profileFormData.longitude ? parseFloat(profileFormData.longitude) : null,
        isActive: profileFormData.isActive
      };

      const result = await ApiPost('/api/admin/users_profile/add-update', profilePayload);

      if (result.success) {
        toast.success('Branch & Profile updated successfully');
        setShowProfileModal(false);
        fetchBranchData();
      } else {
        toast.error(result.fail || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Failed to update');
    } finally {
      setProfileSubmitting(false);
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-code-branch me-2"></i>
          Branches
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
              placeholder="Search branches..."
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
            Add Branch
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
              <th>Mobile</th>
              <th>Email</th>
              <th>Restaurant</th>
              <th>Status</th>
              <th>Created At</th>
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
                  No branches found
                </td>
              </tr>
            ) : (
              paginatedData.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className="d-flex gap-1 justify-content-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleProfile(branch)}
                        disabled={loading}
                        title="Profile"
                      >
                        <i className="bi bi-person-circle"></i>
                      </Button>
                      {/* <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(branch)}
                        disabled={loading}
                        title="Edit Branch"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button> */}
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleBulkUpdateMenu(branch)}
                        disabled={loading}
                        title="Bulk Update Menu Items"
                      >
                        <i className="bi bi-list-check"></i>
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleDeliveryZones(branch)}
                        disabled={loading}
                        title="Delivery Zones"
                      >
                        <i className="bi bi-geo-alt"></i>
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleRestaurantHours(branch)}
                        disabled={loading}
                        title="Restaurant Hours"
                      >
                        <i className="bi bi-clock"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(branch)}
                        disabled={loading}
                        title="Delete Branch"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{branch.id}</strong></td>
                  <td>{branch.name || 'N/A'}</td>
                  <td>{branch.mobile || 'N/A'}</td>
                  <td>{branch.email || 'N/A'}</td>
                  <td>{branch.parentId?.name || 'N/A'}</td>
                  <td>{getStatusBadge(branch.isActive)}</td>
                  <td>{branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Branch Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Branch' : 'Edit Branch'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit} autoComplete="off">
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={restaurants.map((restaurant) => ({
                      value: restaurant.id,
                      label: `${restaurant.name}`
                    }))}
                    value={formData.restaurantId ? (() => {
                      const found = restaurants.find(r => Number(r.id) === Number(formData.restaurantId));
                      return found
                        ? { value: found.id, label: `${found.name} (ID: ${found.id})` }
                        : { value: formData.restaurantId, label: `ID: ${formData.restaurantId}` };
                    })() : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, restaurantId: selected ? Number(selected.value) : '' }));
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
                      control: (base, state) => ({
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
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter branch name"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleFormChange}
                    placeholder="Enter mobile number"
                    maxLength={10}
                    isInvalid={!!formErrors.mobile}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.mobile}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
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
            </Row>

            <Row>
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
                    placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : 'Enter password'}
                    isInvalid={!!formErrors.password}
                    autoComplete="new-password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                  {modalMode === 'edit' && (
                    <Form.Text className="text-muted">
                      Leave blank to keep current password
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              */}
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
                  {modalMode === 'add' ? 'Add Branch' : 'Update Branch'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered dialogClassName="modal-dialog-profile-wide">
        <style>{`
          .modal-dialog-profile-wide {
            max-width: 70vw !important;
            width: 70vw !important;
          }
          @media (max-width: 768px) {
            .modal-dialog-profile-wide {
              max-width: 90vw !important;
              width: 90vw !important;
            }
          }
        `}</style>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-circle me-2"></i>
            Profile - {selectedBranchForProfile?.name || 'Branch'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {profileLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <div className="mt-2">Loading profile...</div>
            </div>
          ) : (
            <div>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Restaurant <span className="text-danger">*</span></Form.Label>
                        <Select
                          options={restaurants.map((restaurant) => ({
                            value: restaurant.id,
                            label: `${restaurant.name}`
                          }))}
                          value={profileFormData.restaurantId ? (() => {
                            const found = restaurants.find(r => Number(r.id) === Number(profileFormData.restaurantId));
                            return found
                              ? { value: found.id, label: found.name }
                              : { value: profileFormData.restaurantId, label: `ID: ${profileFormData.restaurantId}` };
                          })() : null}
                          onChange={(selected) => {
                            setProfileFormData(prev => ({ ...prev, restaurantId: selected ? Number(selected.value) : '' }));
                          }}
                          isClearable
                          isSearchable
                          isLoading={restaurantsLoading}
                          placeholder="Search & Select Restaurant"
                          noOptionsMessage={() => "No restaurants found"}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={profileFormData.name}
                          onChange={handleProfileFormChange}
                          placeholder="Enter branch name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mobile <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="mobile"
                          value={profileFormData.mobile}
                          onChange={handleProfileFormChange}
                          placeholder="Enter mobile number"
                          maxLength={10}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={profileFormData.email}
                          onChange={handleProfileFormChange}
                          placeholder="Enter email address"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={profileFormData.password}
                          onChange={handleProfileFormChange}
                          placeholder="Leave blank to keep current"
                          autoComplete="new-password"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Check
                          type="switch"
                          id="branchIsActive"
                          name="branchIsActive"
                          label="Active"
                          checked={profileFormData.branchIsActive}
                          onChange={(e) => setProfileFormData(prev => ({ ...prev, branchIsActive: e.target.checked }))}
                          className="mt-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-3" />

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Alternate Phone</Form.Label>
                        <Form.Control
                          type="text"
                          name="alternatePhone"
                          value={profileFormData.alternatePhone}
                          onChange={handleProfileFormChange}
                          placeholder="Enter alternate phone"
                          maxLength={10}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3" style={{ position: 'relative' }}>
                        <Form.Label><i className="bi bi-geo-alt text-danger me-1"></i>Search Location</Form.Label>
                        <InputGroup>
                          <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                          <Form.Control
                            type="text"
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                            placeholder="Search location to auto-fill Lat/Lng..."
                            autoComplete="off"
                          />
                          {locationQuery && (
                            <Button variant="outline-secondary" size="sm" onClick={() => { setLocationQuery(''); setLocationSuggestions([]); }}>
                              <i className="bi bi-x-lg"></i>
                            </Button>
                          )}
                        </InputGroup>
                        {locationSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute', zIndex: 1050, width: '100%', maxHeight: '200px', overflowY: 'auto',
                            backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}>
                            <div style={{ padding: '6px 12px', fontSize: '0.7rem', color: '#999', fontWeight: 600, textTransform: 'uppercase' }}>Suggestions</div>
                            {locationSuggestions.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleSelectLocation(item.place_id, item.entity_title)}
                                style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '1px solid #f0f0f0', fontSize: '0.85rem' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                              >
                                <i className="bi bi-geo-alt text-danger me-2"></i>
                                <strong>{item.entity_title}</strong>
                                {item.entity_subtitle && <div style={{ fontSize: '0.75rem', color: '#888', marginLeft: '20px' }}>{item.entity_subtitle}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                        {locationSearching && <small className="text-muted mt-1">Searching...</small>}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Latitude</Form.Label>
                        <Form.Control
                          type="text"
                          name="latitude"
                          value={profileFormData.latitude}
                          onChange={handleProfileFormChange}
                          placeholder="Enter latitude"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Longitude</Form.Label>
                        <Form.Control
                          type="text"
                          name="longitude"
                          value={profileFormData.longitude}
                          onChange={handleProfileFormChange}
                          placeholder="Enter longitude"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="address"
                          value={profileFormData.address}
                          onChange={handleProfileFormChange}
                          placeholder="Enter address"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Close
          </Button>
          <Button
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            onClick={handleProfileSubmit}
            disabled={profileSubmitting}
          >
            {profileSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Submit
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delivery Zones Modal */}
      <Modal show={showDZModal} onHide={() => setShowDZModal(false)} centered dialogClassName="modal-dialog-dz-wide">
        <style>{`
          .modal-dialog-dz-wide {
            max-width: 75vw !important;
            width: 75vw !important;
          }
          @media (max-width: 768px) {
            .modal-dialog-dz-wide {
              max-width: 95vw !important;
              width: 95vw !important;
            }
          }
        `}</style>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-geo-alt me-2"></i>
            Delivery Zones - {selectedBranchForDZ?.name || 'Branch'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {dzLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <div className="mt-2">Loading delivery zones...</div>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  Total: {deliveryZones.length} | Active: {deliveryZones.filter(z => z.isActive).length}
                </small>
                <Button variant="outline-success" size="sm" onClick={addNewDZ} disabled={dzSaving}>
                  <i className="bi bi-plus-lg me-1"></i> Add Zone
                </Button>
              </div>
              {dzHasChanges && (
                <Badge bg="warning" className="mb-2 py-2 px-3">
                  <i className="bi bi-exclamation-triangle me-1"></i> Unsaved changes
                </Badge>
              )}
              <div className="table-responsive">
                <Table striped bordered hover size="sm" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Zone Name</th>
                      <th>Description</th>
                      <th style={{ width: '100px' }}>From (KM)</th>
                      <th style={{ width: '100px' }}>To (KM)</th>
                      <th style={{ width: '110px' }}>Delivery Charge</th>
                      <th style={{ width: '70px' }}>Active</th>
                      <th style={{ width: '60px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryZones.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-3 text-muted">
                          No delivery zones found. Click "Add Zone" to create one.
                        </td>
                      </tr>
                    ) : (
                      deliveryZones.map((zone, index) => (
                        <tr
                          key={zone.id || `new-${index}`}
                          style={{
                            backgroundColor: zone._modified ? '#fff3cd' : 'inherit',
                            opacity: zone.isActive === false ? 0.6 : 1
                          }}
                        >
                          <td>
                            <strong>{index + 1}</strong>
                            {zone._isNew && <Badge bg="success" className="ms-1" style={{ fontSize: '0.6rem' }}>New</Badge>}
                          </td>
                          <td>
                            <Form.Control type="text" size="sm" value={zone.zoneName || ''} onChange={(e) => handleDZChange(index, 'zoneName', e.target.value)} placeholder="Zone name" disabled={!zone.isActive} />
                          </td>
                          <td>
                            <Form.Control type="text" size="sm" value={zone.description || ''} onChange={(e) => handleDZChange(index, 'description', e.target.value)} placeholder="Description" disabled={!zone.isActive} />
                          </td>
                          <td>
                            <Form.Control type="number" size="sm" step="0.1" min="0" value={zone.radiusKmFrom ?? 0} onWheel={blockWheelChange} onChange={(e) => handleDZChange(index, 'radiusKmFrom', e.target.value)} disabled={!zone.isActive} />
                          </td>
                          <td>
                            <Form.Control type="number" size="sm" step="0.1" min="0" value={zone.radiusKmTo ?? 0} onWheel={blockWheelChange} onChange={(e) => handleDZChange(index, 'radiusKmTo', e.target.value)} disabled={!zone.isActive} />
                          </td>
                          <td>
                            <Form.Control type="number" size="sm" step="0.01" min="0" value={zone.deliveryCharge ?? 0} onWheel={blockWheelChange} onChange={(e) => handleDZChange(index, 'deliveryCharge', e.target.value)} disabled={!zone.isActive} />
                          </td>
                          <td className="text-center">
                            <Form.Check type="switch" checked={zone.isActive ?? true} onChange={(e) => handleDZChange(index, 'isActive', e.target.checked)} />
                          </td>
                          <td className="text-center">
                            <Button variant="outline-danger" size="sm" onClick={() => removeDZ(index)} title={zone._isNew ? 'Remove' : 'Deactivate'}>
                              <i className={`bi bi-${zone._isNew ? 'x-lg' : 'trash'}`}></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDZModal(false)}>Close</Button>
          <Button
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            onClick={handleSaveDZ}
            disabled={dzSaving || !dzHasChanges}
          >
            {dzSaving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-all me-2"></i>
                Save All Changes
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BranchManagement;
