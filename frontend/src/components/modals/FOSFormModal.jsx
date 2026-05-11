import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import adminService from '../../services/AdminService';

const FOSFormModal = ({
  show,
  handleClose,
  mode,
  userData,
  onSave,
  userRole,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    email: '',
    role: 'fos',
    parent: '',
    distributor_id: '',
    customer_id: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [distributors, setDistributors] = useState([]);
  const [loadingDistributors, setLoadingDistributors] = useState(false);

  // Load distributors for dropdown
  useEffect(() => {
    if (show) {
      fetchDistributors();
    }
  }, [show]);

  // Load user data when editing
  useEffect(() => {
    if (mode === 'edit' && userData) {
      setFormData({
        name: userData.name || '',
        mobile: userData.mobile || '',
        password: '', // Don't pre-fill password for edit
        email: userData.email || '',
        role: userData.role || 'fos',
        parent: userData.parent || '',
        distributor_id: userData.parent || '', // Use parent as distributor_id for editing
        customer_id: userData.customer_id || '',
        status: userData.status || 'active',
      });
    } else if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        name: '',
        mobile: '',
        password: '',
        email: '',
        role: 'fos',
        parent: '',
        distributor_id: '',
        customer_id: '',
        status: 'active',
      });
    }
    setErrors({});
    setApiError('');
  }, [mode, userData, show]);

  const fetchDistributors = async () => {
    setLoadingDistributors(true);
    try {
      const result = await adminService.getUsers({ role: 'distributor', page: 1, page_size: 1000 });
      if (result.success) {
        setDistributors(result.data.results || []);
      } else {
        console.error('Failed to fetch distributors:', result.error);
      }
    } catch (err) {
      console.error('Error fetching distributors:', err);
    } finally {
      setLoadingDistributors(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update parent field when distributor is selected
    if (name === 'distributor_id' && value) {
      const selectedDistributor = distributors.find(d => d.id.toString() === value);
      if (selectedDistributor) {
        setFormData(prev => ({
          ...prev,
          parent: selectedDistributor.id
        }));
      }
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Mobile validation
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else {
      const mobileDigits = formData.mobile.replace(/[\s+]/g, '').replace(/^91/, '');
      if (!/^\d{10}$/.test(mobileDigits)) {
        newErrors.mobile = 'Mobile number must be 10 digits';
      }
    }

    // Password validation (only for add mode)
    if (mode === 'add' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Distributor validation
    if (!formData.distributor_id) {
      newErrors.distributor_id = 'Distributor is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Format mobile number (remove spaces and +91 prefix)
    const mobileDigits = formData.mobile.replace(/[\s+]/g, '').replace(/^91/, '');

    const dataToSave = {
      name: formData.name.trim(),
      mobile: mobileDigits,
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      parent: formData.parent,
      distributor_id: formData.distributor_id,
      customer_id: formData.customer_id.trim(),
      status: formData.status,
    };

    // Add password only for new users or when updating password
    if (mode === 'add' || (mode === 'edit' && formData.password)) {
      dataToSave.password = formData.password;
    }

    // If editing, include the ID
    if (mode === 'edit' && userData) {
      dataToSave.id = userData.id;
    }

    try {
      const result = await onSave(dataToSave);
      console.log('API Response:', result); // Debug log
      
      // Check if the save was successful
      if (result && result.success) {
        handleModalClose();
      } else if (result && !result.success) {
        // Handle API errors
        if (result.errors && typeof result.errors === 'object') {
          // Handle field-specific errors
          const fieldErrors = {};
          Object.keys(result.errors).forEach(field => {
            if (Array.isArray(result.errors[field]) && result.errors[field].length > 0) {
              fieldErrors[field] = result.errors[field][0];
            }
          });
          
          setErrors(fieldErrors); // Replace all errors instead of merging
          
          // Set general error message
          setApiError(result.message || 'Failed to save field officer');
        } else {
          // Set general error message
          setApiError(result.error || result.message || 'Failed to save field officer');
        }
      } else {
        // Handle case where result is undefined or null
        setApiError('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error saving field officer:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setFormData({
      name: '',
      mobile: '',
      password: '',
      email: '',
      role: 'fos',
      parent: '',
      distributor_id: '',
      customer_id: '',
      status: 'active',
    });
    setErrors({});
    setApiError('');
    setIsSubmitting(false);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`bi ${mode === 'add' ? 'bi-person-plus' : 'bi-pencil-square'} me-2`}></i>
          {mode === 'add' ? `Add New ${userRole}` : `Edit ${userRole}`}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {apiError && (
            <Alert variant="danger" dismissible onClose={() => setApiError('')}>
              <Alert.Heading>Error</Alert.Heading>
              <p>{apiError}</p>
            </Alert>
          )}
          <Row>
            {/* Name Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Full Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  isInvalid={!!errors.name}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Mobile Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Mobile Number <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  isInvalid={!!errors.mobile}
                  disabled={isSubmitting}
                  maxLength="10"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.mobile}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Password Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Password {mode === 'add' && <span className="text-danger">*</span>}
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === 'edit' ? 'Leave empty to keep current password' : 'Enter password'}
                  isInvalid={!!errors.password}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  {mode === 'edit' ? 'Only enter if you want to change password' : 'Minimum 8 characters'}
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Email Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address (optional)"
                  isInvalid={!!errors.email}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Customer ID Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Customer ID</Form.Label>
                <Form.Control
                  type="text"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  placeholder="Enter customer ID"
                  isInvalid={!!errors.customer_id}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.customer_id}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Distributor Dropdown */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Distributor <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="distributor_id"
                  value={formData.distributor_id}
                  onChange={handleChange}
                  isInvalid={!!errors.distributor_id}
                  disabled={isSubmitting || loadingDistributors}
                >
                  <option value="">
                    {loadingDistributors ? 'Loading distributors...' : 'Select Distributor'}
                  </option>
                  {distributors.map(distributor => (
                    <option key={distributor.id} value={distributor.id}>
                      {distributor.name} ({distributor.mobile})
                      {distributor.customer_id && ` - ${distributor.customer_id}`}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.distributor_id}
                </Form.Control.Feedback>
                {distributors.length === 0 && !loadingDistributors && (
                  <Form.Text className="text-muted">
                    No distributors available. Please add distributors first.
                  </Form.Text>
                )}
              </Form.Group>
            </Col>

            {/* Status Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="btn-outline-primary-custom"
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Field Officer' : 'Update Field Officer'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="btn-outline-danger-custom"
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default FOSFormModal;