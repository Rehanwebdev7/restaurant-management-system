import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const OrderFormModal = ({
  show,
  handleClose,
  mode,
  orderData,
  onSave,
  title,
  fields = [],
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data based on fields configuration
  useEffect(() => {
    const initialData = {};
    fields.forEach(field => {
      if (mode === 'edit' && orderData) {
        initialData[field.name] = orderData[field.name] || field.defaultValue || '';
      } else {
        initialData[field.name] = field.defaultValue || '';
      }
    });
    setFormData(initialData);
    setErrors({});
  }, [mode, orderData, show, fields]);

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

  // Validation
  const validateForm = () => {
    const newErrors = {};

    fields.forEach(field => {
      if (field.required && !formData[field.name]?.toString().trim()) {
        newErrors[field.name] = `${field.label} is required`;
      } else if (field.validation) {
        const validationResult = field.validation(formData[field.name], formData);
        if (validationResult) {
          newErrors[field.name] = validationResult;
        }
      }
    });

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

    const dataToSave = { ...formData };

    // If editing, include the ID
    if (mode === 'edit' && orderData) {
      dataToSave.id = orderData.id;
    }

    try {
      await onSave(dataToSave);
      handleModalClose();
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = field.defaultValue || '';
    });
    setFormData(initialData);
    setErrors({});
    setIsSubmitting(false);
    handleClose();
  };

  // Render field based on type
  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      isInvalid: !!errors[field.name],
      disabled: isSubmitting || field.disabled,
      placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
    };

    let fieldInput;

    switch (field.type) {
      case 'select':
        fieldInput = (
          <Form.Select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        );
        break;

      case 'textarea':
        fieldInput = (
          <Form.Control
            as="textarea"
            rows={field.rows || 3}
            {...commonProps}
          />
        );
        break;

      case 'date':
        fieldInput = (
          <Form.Control
            type="date"
            max={field.max || undefined}
            min={field.min || undefined}
            {...commonProps}
          />
        );
        break;

      case 'number':
        fieldInput = (
          <Form.Control
            type="number"
            step={field.step || '1'}
            min={field.min || undefined}
            max={field.max || undefined}
            {...commonProps}
          />
        );
        break;

      case 'email':
        fieldInput = (
          <Form.Control
            type="email"
            {...commonProps}
          />
        );
        break;

      case 'tel':
        fieldInput = (
          <Form.Control
            type="tel"
            {...commonProps}
          />
        );
        break;

      default:
        fieldInput = (
          <Form.Control
            type="text"
            {...commonProps}
          />
        );
    }

    return (
      <Col md={field.colSize || 6} className="mb-3" key={field.name}>
        <Form.Group>
          <Form.Label>
            {field.label} {field.required && <span className="text-danger">*</span>}
          </Form.Label>
          {fieldInput}
          <Form.Control.Feedback type="invalid">
            {errors[field.name]}
          </Form.Control.Feedback>
          {field.helpText && (
            <Form.Text className="text-muted">
              {field.helpText}
            </Form.Text>
          )}
        </Form.Group>
      </Col>
    );
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`bi ${mode === 'add' ? 'bi-plus-circle' : 'bi-pencil-square'} me-2`}></i>
          {mode === 'add' ? `Add New ${title}` : `Edit ${title}`}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            {fields.map(field => renderField(field))}
          </Row>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="btn-outline-primary-custom"
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Order' : 'Update Order'}
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

export default OrderFormModal;
