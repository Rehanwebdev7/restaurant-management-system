import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';

const UserFormModal = ({
  show,
  handleClose,
  mode,
  userData,
  onSave,
  userRole,
  showLimitField = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    shop_name: '',
    mobile: '',
    password: '',
    email: '',
    postal_code: '',
    role: 'retailer',
    parent: 1,
    region: '',
    district: '',
    city: '',
    gst_number: '',
    customer_id: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const regions = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];
  
  const districts = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
    'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
    'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'South Delhi'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Jorhat', 'Silchar', 'Tezpur'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Kullu', 'Mandi', 'Solan'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital', 'Rishikesh', 'Roorkee'],
    'Goa': ['Panaji', 'Margao', 'Vasco', 'Mapusa', 'Ponda'],
    'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching'],
    'Nagaland': ['Dimapur', 'Kohima', 'Mokokchung', 'Tuensang', 'Wokha'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'],
    'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
    'Ladakh': ['Leh', 'Kargil', 'Diskit', 'Padum', 'Sankoo']
  };
  
  const cities = {
    // Mumbai District
    'Mumbai': ['Andheri', 'Bandra', 'Borivali', 'Dadar', 'Kurla', 'Malad', 'Kandivali', 'Goregaon'],
    // Delhi Districts
    'Central Delhi': ['Connaught Place', 'Karol Bagh', 'Paharganj', 'Daryaganj'],
    'East Delhi': ['Laxmi Nagar', 'Preet Vihar', 'Mayur Vihar', 'Gandhi Nagar'],
    'New Delhi': ['Chanakyapuri', 'Sarojini Nagar', 'Lajpat Nagar', 'RK Puram'],
    'North Delhi': ['Civil Lines', 'Model Town', 'Rohini', 'Pitampura'],
    'South Delhi': ['Greater Kailash', 'Saket', 'Vasant Kunj', 'Defence Colony'],
    // Bangalore
    'Bangalore': ['Koramangala', 'Whitefield', 'Electronic City', 'Indiranagar', 'Jayanagar', 'Marathahalli', 'BTM Layout', 'HSR Layout'],
    // Chennai
    'Chennai': ['T Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Mylapore', 'Alwarpet', 'Nungambakkam'],
    // Hyderabad
    'Hyderabad': ['Gachibowli', 'Hitech City', 'Secunderabad', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally'],
    // Kolkata
    'Kolkata': ['Salt Lake', 'Park Street', 'Ballygunge', 'New Town', 'Gariahat', 'Jadavpur', 'Behala'],
    // Gurgaon
    'Gurgaon': ['Sector 14', 'Sector 29', 'Cyber City', 'DLF Phase 1', 'Sohna Road', 'Golf Course Road', 'Udyog Vihar'],
    // Pune
    'Pune': ['Hadapsar', 'Wakad', 'Kothrud', 'Hinjewadi', 'Baner', 'Aundh', 'Kalyani Nagar'],
    // Ahmedabad
    'Ahmedabad': ['Satellite', 'Vastrapur', 'Bopal', 'Maninagar', 'Navrangpura', 'SG Highway', 'Bodakdev'],
    // Other major cities
    'Surat': ['Adajan', 'Athwa', 'Rander', 'Vesu', 'City Light', 'Katargam', 'Varachha'],
    'Lucknow': ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Aminabad'],
    'Jaipur': ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Raja Park', 'Mansarovar'],
    'Bhopal': ['New Market', 'MP Nagar', 'Arera Colony', '10 Number Market', 'Kolar Road'],
    'Indore': ['Vijay Nagar', 'Palasia', 'Rajwada', 'Sapna Sangeeta', 'Old Palasia'],
    'Patna': ['Boring Road', 'Kankarbagh', 'Rajendra Nagar', 'Patliputra', 'Ashok Rajpath'],
    'Kanpur': ['Swaroop Nagar', 'Kakadeo', 'Civil Lines', 'Mall Road', 'Kidwai Nagar'],
    'Nagpur': ['Sitabuldi', 'Dharampeth', 'Sadar', 'Ramdaspeth', 'Civil Lines'],
    'Visakhapatnam': ['Dwaraka Nagar', 'Gajuwaka', 'MVP Colony', 'Maddilapalem', 'Beach Road'],
    'Bhubaneswar': ['Khandagiri', 'Jaydev Vihar', 'Sahid Nagar', 'Patia', 'Chandrasekharpur'],
    'Coimbatore': ['RS Puram', 'Gandhipuram', 'Saibaba Colony', 'Peelamedu', 'Race Course'],
    'Kochi': ['Ernakulam', 'Fort Kochi', 'Kakkanad', 'Marine Drive', 'Palarivattom'],
    'Guwahati': ['Fancy Bazar', 'Paltan Bazar', 'Zoo Road', 'GS Road', 'Beltola']
  };

  // Load user data when editing
  useEffect(() => {
    if (mode === 'edit' && userData) {
      setFormData({
        name: userData.name || '',
        shop_name: userData.shop_name || '',
        mobile: userData.mobile || '',
        password: '', // Don't pre-fill password for edit
        email: userData.email || '',
        postal_code: userData.postal_code || '',
        role: userData.role || 'retailer',
        parent: userData.parent || 1,
        region: userData.region || '',
        district: userData.district || '',
        city: userData.city || '',
        gst_number: userData.gst_number || '',
        customer_id: userData.customer_id || '',
        status: userData.status || 'active',
      });
    } else if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        name: '',
        shop_name: '',
        mobile: '',
        password: '',
        email: '',
        postal_code: '',
        role: 'retailer',
        parent: 1,
        region: '',
        district: '',
        city: '',
        gst_number: '',
        customer_id: '',
        status: 'active',
      });
    }
    setErrors({});
    setApiError('');
  }, [mode, userData, show]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let updatedData = { [name]: value };
    
    // Clear dependent fields when parent fields change
    if (name === 'region') {
      updatedData.district = '';
      updatedData.city = '';
    } else if (name === 'district') {
      updatedData.city = '';
    }
    
    setFormData(prev => ({
      ...prev,
      ...updatedData
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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

    // Shop name validation
    if (!formData.shop_name.trim()) {
      newErrors.shop_name = 'Shop name is required';
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

    // Region validation
    if (!formData.region) {
      newErrors.region = 'State is required';
    }

    // District validation
    if (!formData.district) {
      newErrors.district = 'District is required';
    }

    // City validation
    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    // EIN validation (optional but format check if provided)
    if (formData.gst_number && formData.gst_number.replace(/\D/g, '').length > 0 && formData.gst_number.replace(/\D/g, '').length !== 9) {
      newErrors.gst_number = 'EIN must be 9 digits (XX-XXXXXXX)';
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
      shop_name: formData.shop_name.trim(),
      mobile: mobileDigits,
      email: formData.email.trim().toLowerCase(),
      postal_code: formData.postal_code.trim(),
      role: formData.role,
      parent: formData.parent,
      region: formData.region,
      district: formData.district,
      city: formData.city,
      gst_number: formData.gst_number.trim(),
      customer_id: formData.customer_id.trim(),
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
          setErrors(prevErrors => ({ ...prevErrors, ...fieldErrors }));
          
          // Set general error message
          setApiError(result.message || 'Failed to save user');
        } else {
          // Set general error message
          setApiError(result.error || result.message || 'Failed to save user');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setFormData({
      name: '',
      shop_name: '',
      mobile: '',
      password: '',
      email: '',
      postal_code: '',
      role: 'retailer',
      parent: 1,
      region: '',
      district: '',
      city: '',
      gst_number: '',
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

            {/* Shop Name Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Shop/Business Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  placeholder="Enter shop or business name"
                  isInvalid={!!errors.shop_name}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.shop_name}
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
                <Form.Text className="text-muted">
                  Enter 10-digit mobile number (without +91)
                </Form.Text>
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

            {/* Postal Code Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>Postal Code</Form.Label>
                <Form.Control
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="Enter postal code"
                  isInvalid={!!errors.postal_code}
                  disabled={isSubmitting}
                  maxLength="6"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.postal_code}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Region Field */}
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  State <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  isInvalid={!!errors.region}
                  disabled={isSubmitting}
                >
                  <option value="">Select State</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.region}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* District Field */}
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  District <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  isInvalid={!!errors.district}
                  disabled={isSubmitting || !formData.region}
                >
                  <option value="">Select District</option>
                  {formData.region && districts[formData.region]?.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.district}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* City Field */}
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  City <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  isInvalid={!!errors.city}
                  disabled={isSubmitting || !formData.district}
                >
                  <option value="">Select City</option>
                  {formData.district && cities[formData.district]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.city}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* EIN / Tax ID Field */}
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>EIN / Tax ID</Form.Label>
                <Form.Control
                  type="text"
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleChange}
                  placeholder="12-3456789 (optional)"
                  isInvalid={!!errors.gst_number}
                  disabled={isSubmitting}
                  maxLength="11"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.gst_number}
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
          </Row>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="btn-outline-primary-custom"
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add User' : 'Update User'}
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

export default UserFormModal;

