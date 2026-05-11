import React, { useState, useEffect, useRef } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut, ApiDelete, ApiPostFormData } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import AddRestaurantModal from '../../../superadmin/restaurants/AddRestaurantModal';
import '../../../../../styles/tables.css';

const Restaurant = () => {
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedRestaurantForProfile, setSelectedRestaurantForProfile] = useState(null);
  const [profileFormData, setProfileFormData] = useState({
    restaurantId: '',
    restaurantName: '',
    gstNumber: '',
    address: '',
    cityId: '',
    stateId: '',
    pincode: '',
    country: 'India',
    latitude: '',
    longitude: '',
    timezone: 'Asia/Kolkata',
    currencyCode: 'INR',
    website: '',
    phone: '',
    alternatePhone: '',
    primarys: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    fontColour: '#000000',
    fontName: 'Roboto',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Dropdown data for profile
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Logo and Favicon upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoFileName, setLogoFileName] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconFileName, setFaviconFileName] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');
  const logoRef = useRef(null);
  const faviconRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    // password: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchRestaurantData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchRestaurantData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchRestaurantData = async (page = currentPage, pageSize = rowsPerPage, roleFilter = statusFilter, query = searchQuery) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        role: 'restaurant',
        pageNumber: page - 1,
        pageSize
      };

      if (query.trim()) {
        params.searchValue = query.trim();
      }

      if (roleFilter) {
        params.isActive = roleFilter === 'active';
      }

      const result = await ApiGet('/api/admin/users/filter', params);

      if (result.success) {
        const data = result.success.data.data;
        setApiData(data.records || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 0);
        return data.records || [];
      } else {
        setError(result.fail);
        toast.error(result.fail);
        return [];
      }
    } catch (err) {
      setError('Failed to fetch restaurants');
      toast.error('Failed to fetch restaurants');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const buildDefaultProfileFormData = (restaurant) => {
    const payload = {
      restaurantId: { id: restaurant.id },
      restaurantName: restaurant.name || '',
      phone: restaurant.mobile || '',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currencyCode: 'INR',
      isActive: true,
      primarys: '#3b82f6',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      fontColour: '#000000',
      fontName: 'Roboto'
    };

    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    return formData;
  };

  const createRestaurantProfile = async (restaurant) => {
    if (!restaurant?.id) return false;

    const result = await ApiPostFormData('/api/admin/users_profile/profileAdd', buildDefaultProfileFormData(restaurant));
    return Boolean(result.success);
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
    const exportData = apiData.map(restaurant => ({
      ID: restaurant.id,
      Name: restaurant.name || '',
      Mobile: restaurant.mobile || '',
      Email: restaurant.email || '',
      Role: restaurant.role || '',
      Status: restaurant.isActive ? 'Active' : 'Inactive',
      'Created At': restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Restaurants');
    XLSX.writeFile(workbook, `restaurants_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      // password: '',
      isActive: true
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      // password: '',
      isActive: user.isActive ?? true
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete restaurant "${user.name}"?`)) {
      try {
        const result = await ApiDelete(`/api/admin/users/${user.id}`);
        if (result.success) {
          toast.success('Restaurant deleted successfully');
          fetchRestaurantData();
        } else {
          toast.error(result.fail);
        }
      } catch (err) {
        toast.error('Failed to delete restaurant');
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
        role: 'restaurant',
        isActive: formData.isActive
      };
// if (formData.password.trim()) {//   payload.password = formData.password.trim();// }

      if (modalMode === 'add') {
        result = await ApiPost('/api/admin/users/add', payload);
        if (result.success) {
          setSearchQuery('');
          setStatusFilter('');
          setCurrentPage(1);

          const nextPageRestaurants = await fetchRestaurantData(1, rowsPerPage, '', '');
          const createdRestaurant = nextPageRestaurants.find((restaurant) => {
            const sameMobile = String(restaurant.mobile || '').trim() === formData.mobile.trim();
            const sameEmail = formData.email.trim() ? String(restaurant.email || '').trim().toLowerCase() === formData.email.trim().toLowerCase() : true;
            return sameMobile && sameEmail;
          });

          if (createdRestaurant?.id) {
            await createRestaurantProfile(createdRestaurant);
          }

          toast.success('Restaurant added successfully');
          setShowModal(false);
        } else {
          toast.error(result.fail);
        }
      } else {
        payload.id = selectedUser.id;
        result = await ApiPut('/api/admin/users/update', payload);
        if (result.success) {
          toast.success('Restaurant updated successfully');
          setShowModal(false);
          fetchRestaurantData();
        } else {
          toast.error(result.fail);
        }
      }
    } catch (err) {
      toast.error('Failed to save restaurant');
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

  // Fetch States
  const fetchStates = async () => {
    try {
      const result = await ApiGet('/api/admin/states/all');
      if (result.success) {
        setStates(result.success.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch states');
    }
  };

  // Fetch Cities by State
  const fetchCities = async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    try {
      const result = await ApiGet('/api/admin/cities/cityAll', { stateId: stateId });
      if (result.success) {
        setCities(result.success.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch cities');
    }
  };

  // Profile Modal Functions
  const handleProfile = async (restaurant) => {
    setSelectedRestaurantForProfile(restaurant);
    setShowProfileModal(true);
    setProfileLoading(true);

    // Fetch states for dropdown
    fetchStates();

    // Reset form data
    setProfileFormData({
      restaurantId: restaurant.id || '',
      restaurantName: restaurant.name || '',
      gstNumber: '',
      address: '',
      cityId: '',
      stateId: '',
      pincode: '',
      country: 'India',
      latitude: '',
      longitude: '',
      timezone: 'Asia/Kolkata',
      currencyCode: 'INR',
      website: '',
      phone: restaurant.mobile || '',
      alternatePhone: '',
      primarys: '#3b82f6',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      fontColour: '#000000',
      fontName: 'Roboto',
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    });

    // Reset logo and favicon
    setLogoFile(null);
    setLogoFileName('');
    setLogoPreview('');
    setFaviconFile(null);
    setFaviconFileName('');
    setFaviconPreview('');

    try {
      const result = await ApiGet(`/api/admin/users_profile/restaurantId`, { id: restaurant.id });

      if (result.success) {
        const profile = result.success.data.data;

        if (profile && profile.id) {
          // Fetch cities if state exists
          if (profile.stateId?.id) {
            await fetchCities(profile.stateId.id);
          }

          setProfileFormData({
            restaurantId: restaurant.id || '',
            restaurantName: profile.restaurantName || restaurant.name || '',
            gstNumber: profile.gstNumber || '',
            address: profile.address || '',
            cityId: profile.cityId?.id || '',
            stateId: profile.stateId?.id || '',
            pincode: profile.pincodeId?.pincode || profile.pincode || '',
            country: profile.country || 'India',
            latitude: profile.latitude || '',
            longitude: profile.longitude || '',
            timezone: profile.timezone || 'Asia/Kolkata',
            currencyCode: profile.currencyCode || 'INR',
            website: profile.website || '',
            phone: profile.phone || '',
            alternatePhone: profile.alternatePhone || '',
            primarys: profile.primarys || '#3b82f6',
            secondary: profile.secondary || '#10b981',
            tertiary: profile.tertiary || '#f59e0b',
            fontColour: profile.fontColour || '#000000',
            fontName: profile.fontName || 'Roboto',
            facebook: profile.socialMediaDetails?.facebook || '',
            instagram: profile.socialMediaDetails?.instagram || '',
            twitter: profile.socialMediaDetails?.twitter || '',
            youtube: profile.socialMediaDetails?.youtube || ''
          });

          // Set existing logo and favicon previews
          if (profile.logoUrl) {
            setLogoPreview(profile.logoUrl);
            setLogoFileName('Logo (Uploaded)');
          }
          if (profile.feviconUrl) {
            setFaviconPreview(profile.feviconUrl);
            setFaviconFileName('Favicon (Uploaded)');
          }
        }
      }
    } catch (err) {
      // Profile not found, keep default values
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

    // Handle dependent dropdowns
    if (name === 'stateId') {
      setProfileFormData(prev => ({ ...prev, cityId: '' }));
      setCities([]);
      if (value) {
        fetchCities(value);
      }
    }

  };

  // Handle logo file change
  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG and PNG files are allowed');
        return;
      }
      setLogoFile(file);
      setLogoFileName(file.name);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle favicon file change
  const handleFaviconChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size should not exceed 2MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/x-icon', 'image/ico'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG and ICO files are allowed');
        return;
      }
      setFaviconFile(file);
      setFaviconFileName(file.name);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  // Remove logo file
  const removeLogoFile = () => {
    setLogoFile(null);
    setLogoFileName('');
    setLogoPreview('');
    if (logoRef.current) {
      logoRef.current.value = '';
    }
  };

  // Remove favicon file
  const removeFaviconFile = () => {
    setFaviconFile(null);
    setFaviconFileName('');
    setFaviconPreview('');
    if (faviconRef.current) {
      faviconRef.current.value = '';
    }
  };

  const handleProfileSubmit = async () => {
    setProfileSubmitting(true);
    try {
      const restaurantId = profileFormData.restaurantId;

      const payload = {
        restaurantId: { id: restaurantId },
        restaurantName: profileFormData.restaurantName,
        gstNumber: profileFormData.gstNumber,
        address: profileFormData.address,
        cityId: profileFormData.cityId ? { id: parseInt(profileFormData.cityId) } : null,
        stateId: profileFormData.stateId ? { id: parseInt(profileFormData.stateId) } : null,
        pncode: profileFormData.pincode,
        country: profileFormData.country,
        latitude: profileFormData.latitude ? parseFloat(profileFormData.latitude) : null,
        longitude: profileFormData.longitude ? parseFloat(profileFormData.longitude) : null,
        timezone: profileFormData.timezone,
        currencyCode: profileFormData.currencyCode,
        website: profileFormData.website,
        phone: profileFormData.phone,
        alternatePhone: profileFormData.alternatePhone,
        primarys: profileFormData.primarys,
        secondary: profileFormData.secondary,
        tertiary: profileFormData.tertiary,
        fontColour: profileFormData.fontColour,
        fontName: profileFormData.fontName,
        socialMediaDetails: {
          facebook: profileFormData.facebook || '',
          instagram: profileFormData.instagram || '',
          twitter: profileFormData.twitter || '',
          youtube: profileFormData.youtube || ''
        }
      };

      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));

      // Append logo and favicon files if present
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (faviconFile) {
        formData.append('fevicon', faviconFile);
      }

      const result = await ApiPostFormData('/api/admin/users_profile/profileAdd', formData);

      if (result.success) {
        toast.success('Profile updated successfully');
        setShowProfileModal(false);
        fetchRestaurantData();
      } else {
        toast.error(result.fail || 'Failed to save profile');
      }
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setProfileSubmitting(false);
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-utensils me-2"></i>
          Restaurants
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
              placeholder="Search restaurants..."
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
            Add Restaurant
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
              <th>Status</th>
              <th>Created At</th>
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
                  No restaurants found
                </td>
              </tr>
            ) : (
              paginatedData.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td>
                    <div className="d-flex gap-1 justify-content-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleProfile(restaurant)}
                        disabled={loading}
                        title="Profile"
                      >
                        <i className="bi bi-person-circle"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(restaurant)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(restaurant)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{restaurant.id}</strong></td>
                  <td>{restaurant.name || 'N/A'}</td>
                  <td>{restaurant.mobile || 'N/A'}</td>
                  <td>{restaurant.email || 'N/A'}</td>
                  <td>{getStatusBadge(restaurant.isActive)}</td>
                  <td>{restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Restaurant Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Restaurant' : 'Edit Restaurant'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Enter restaurant name"
                isInvalid={!!formErrors.name}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.name}
              </Form.Control.Feedback>
            </Form.Group>

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

            {/* Password field commented out
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
            */}

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="isActive"
                name="isActive"
                label="Active Status"
                checked={formData.isActive}
                onChange={handleFormChange}
              />
            </Form.Group>
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
                  <Spinner size="sm" animation="border" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {modalMode === 'add' ? 'Add Restaurant' : 'Update Restaurant'}
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
        <Modal.Header closeButton onHide={() => setShowProfileModal(false)}>
          <Modal.Title>
            <i className="bi bi-person-circle me-2"></i>
            Profile - {selectedRestaurantForProfile?.name || 'Restaurant'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {profileLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <div className="mt-2">Loading profile...</div>
            </div>
          ) : (
            <div>
              {/* Basic Information */}
              <h6 className="text-muted mb-3 border-bottom pb-2">Basic Information</h6>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Restaurant Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="restaurantName"
                      value={profileFormData.restaurantName}
                      onChange={handleProfileFormChange}
                      placeholder="Enter restaurant name"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>GST Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="gstNumber"
                      value={profileFormData.gstNumber}
                      onChange={handleProfileFormChange}
                      placeholder="Enter GST number"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="url"
                      name="website"
                      value={profileFormData.website}
                      onChange={handleProfileFormChange}
                      placeholder="https://example.com"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Contact Information */}
              <h6 className="text-muted mb-3 border-bottom pb-2 mt-3">Contact Information</h6>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={profileFormData.phone}
                      onChange={handleProfileFormChange}
                      placeholder="Enter phone number"
                      maxLength={10}
                    />
                  </Form.Group>
                </Col>
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
              </Row>

              {/* Address Information */}
              <h6 className="text-muted mb-3 border-bottom pb-2 mt-3">Address Information</h6>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={profileFormData.address}
                      onChange={handleProfileFormChange}
                      placeholder="Enter address"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Select
                      name="stateId"
                      value={profileFormData.stateId}
                      onChange={handleProfileFormChange}
                    >
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state.id} value={state.id}>{state.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Select
                      name="cityId"
                      value={profileFormData.cityId}
                      onChange={handleProfileFormChange}
                      disabled={!profileFormData.stateId}
                    >
                      <option value="">Select City</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pincode</Form.Label>
                    <Form.Control
                      type="text"
                      name="pincode"
                      value={profileFormData.pincode}
                      onChange={handleProfileFormChange}
                      placeholder="Enter pincode"
                      maxLength={6}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      type="text"
                      name="country"
                      value={profileFormData.country}
                      onChange={handleProfileFormChange}
                      placeholder="Enter country"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Location & Settings */}
              <h6 className="text-muted mb-3 border-bottom pb-2 mt-3">Location & Settings</h6>
              <Row>
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
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      name="timezone"
                      value={profileFormData.timezone}
                      onChange={handleProfileFormChange}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency Code</Form.Label>
                    <Form.Select
                      name="currencyCode"
                      value={profileFormData.currencyCode}
                      onChange={handleProfileFormChange}
                    >
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="AED">AED - UAE Dirham</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Logo & Favicon */}
              <h6 className="text-muted mb-3 border-bottom pb-2 mt-3">Logo & Favicon</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Logo</Form.Label>
                    <input
                      type="file"
                      ref={logoRef}
                      onChange={handleLogoChange}
                      accept=".jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                    />
                    {logoPreview ? (
                      <div className="p-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                        <div className="text-center mb-2">
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <small className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                            {logoFileName}
                          </small>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0"
                            onClick={removeLogoFile}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline-secondary"
                        className="w-100"
                        onClick={() => logoRef.current?.click()}
                        style={{ borderStyle: 'dashed', padding: '20px' }}
                      >
                        <i className="bi bi-image me-2"></i>Upload Logo
                      </Button>
                    )}
                    <Form.Text className="text-muted">JPG, PNG (Max 5MB)</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Favicon</Form.Label>
                    <input
                      type="file"
                      ref={faviconRef}
                      onChange={handleFaviconChange}
                      accept=".jpg,.jpeg,.png,.ico"
                      style={{ display: 'none' }}
                    />
                    {faviconPreview ? (
                      <div className="p-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                        <div className="text-center mb-2">
                          <img
                            src={faviconPreview}
                            alt="Favicon Preview"
                            style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <small className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                            {faviconFileName}
                          </small>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0"
                            onClick={removeFaviconFile}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline-secondary"
                        className="w-100"
                        onClick={() => faviconRef.current?.click()}
                        style={{ borderStyle: 'dashed', padding: '20px' }}
                      >
                        <i className="bi bi-image me-2"></i>Upload Favicon
                      </Button>
                    )}
                    <Form.Text className="text-muted">JPG, PNG, ICO (Max 2MB)</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* Theme & Branding */}
              <h6 className="text-muted mb-3 border-bottom pb-2 mt-3">Theme & Branding</h6>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Primary Color</Form.Label>
                    <Form.Control
                      type="color"
                      name="primarys"
                      value={profileFormData.primarys}
                      onChange={handleProfileFormChange}
                      style={{ height: '40px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Secondary Color</Form.Label>
                    <Form.Control
                      type="color"
                      name="secondary"
                      value={profileFormData.secondary}
                      onChange={handleProfileFormChange}
                      style={{ height: '40px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tertiary Color</Form.Label>
                    <Form.Control
                      type="color"
                      name="tertiary"
                      value={profileFormData.tertiary}
                      onChange={handleProfileFormChange}
                      style={{ height: '40px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Font Text Color</Form.Label>
                    <Form.Control
                      type="color"
                      name="fontColour"
                      value={profileFormData.fontColour}
                      onChange={handleProfileFormChange}
                      style={{ height: '40px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Font Name</Form.Label>
                    <Form.Select
                      name="fontName"
                      value={profileFormData.fontName}
                      onChange={handleProfileFormChange}
                    >
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Arial">Arial</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Social Media Links */}
              <h6 className="text-muted mb-3 border-bottom pb-2 mt-3">Social Media Links</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><i className="bi bi-facebook me-2" style={{ color: '#1877F2' }}></i>Facebook</Form.Label>
                    <Form.Control
                      type="url"
                      name="facebook"
                      value={profileFormData.facebook}
                      onChange={handleProfileFormChange}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><i className="bi bi-instagram me-2" style={{ color: '#E4405F' }}></i>Instagram</Form.Label>
                    <Form.Control
                      type="url"
                      name="instagram"
                      value={profileFormData.instagram}
                      onChange={handleProfileFormChange}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><i className="bi bi-twitter-x me-2" style={{ color: '#000000' }}></i>Twitter</Form.Label>
                    <Form.Control
                      type="url"
                      name="twitter"
                      value={profileFormData.twitter}
                      onChange={handleProfileFormChange}
                      placeholder="https://twitter.com/yourpage"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><i className="bi bi-youtube me-2" style={{ color: '#FF0000' }}></i>YouTube</Form.Label>
                    <Form.Control
                      type="url"
                      name="youtube"
                      value={profileFormData.youtube}
                      onChange={handleProfileFormChange}
                      placeholder="https://youtube.com/@yourchannel"
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

      {/* Add Restaurant Modal */}
      <AddRestaurantModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); fetchRestaurantData(); }}
      />
    </Container>
  );
};

export default Restaurant;
