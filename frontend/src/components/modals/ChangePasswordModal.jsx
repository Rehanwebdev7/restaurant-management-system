import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import authServices from '../../services/AuthServices';
import { showToast } from '../../utils/toast';

const ChangePasswordModal = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Old password validation
    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword === formData.oldPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    setSuccessMessage('');
    setErrors({});

    try {
      const response = await authServices.changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      if (response.success) {
        setSuccessMessage(response.message || 'Password changed successfully');
        showToast.success(response.message || 'Password changed successfully');
        
        // Close modal after a short delay
        setTimeout(() => {
          onHide();
        }, 2000);
      } else {
        // Handle validation errors
        if (response.errors) {
          const newErrors = {};
          
          // Map API error fields to form fields
          if (response.errors.old_password) {
            newErrors.oldPassword = response.errors.old_password.join(', ');
          }
          if (response.errors.new_password) {
            newErrors.newPassword = response.errors.new_password.join(', ');
          }
          if (response.errors.confirm_password) {
            newErrors.confirmPassword = response.errors.confirm_password.join(', ');
          }
          
          setErrors(newErrors);
        } else {
          setErrors({
            submit: response.message || 'Failed to change password. Please try again.'
          });
        }
      }
    } catch (error) {
      const message =
        error?.message ||
        error?.Message ||
        error?.data?.message ||
        'Failed to change password. Please try again.';

      setErrors({
        submit: message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  const onHide = () => {
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setSuccessMessage('');
    setShowPasswords({
      old: false,
      new: false,
      confirm: false
    });
    handleClose();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-lock-fill me-2"></i>
          Change Password
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {successMessage && (
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
          </div>
        )}
        
        {errors.submit && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errors.submit}
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Current Password */}
          <Form.Group className="mb-3">
            <Form.Label>Current Password <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <Form.Control
                type={showPasswords.old ? "text" : "password"}
                name="oldPassword"
                placeholder="Enter current password"
                value={formData.oldPassword}
                onChange={handleChange}
                isInvalid={!!errors.oldPassword}
                disabled={isSubmitting}
              />
              <Button 
                variant="outline-secondary" 
                onClick={() => togglePasswordVisibility('old')}
                disabled={isSubmitting}
              >
                <i className={`bi bi-eye${showPasswords.old ? '-slash' : ''}`}></i>
              </Button>
              <Form.Control.Feedback type="invalid">
                {errors.oldPassword}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          {/* New Password */}
          <Form.Group className="mb-3">
            <Form.Label>New Password <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <Form.Control
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                isInvalid={!!errors.newPassword}
                disabled={isSubmitting}
              />
              <Button 
                variant="outline-secondary" 
                onClick={() => togglePasswordVisibility('new')}
                disabled={isSubmitting}
              >
                <i className={`bi bi-eye${showPasswords.new ? '-slash' : ''}`}></i>
              </Button>
              <Form.Control.Feedback type="invalid">
                {errors.newPassword}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          {/* Confirm Password */}
          <Form.Group className="mb-3">
            <Form.Label>Confirm New Password <span className="text-danger">*</span></Form.Label>
            <InputGroup>
              <Form.Control
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
                disabled={isSubmitting}
              />
              <Button 
                variant="outline-secondary" 
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={isSubmitting}
              >
                <i className={`bi bi-eye${showPasswords.confirm ? '-slash' : ''}`}></i>
              </Button>
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Changing...
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChangePasswordModal;

