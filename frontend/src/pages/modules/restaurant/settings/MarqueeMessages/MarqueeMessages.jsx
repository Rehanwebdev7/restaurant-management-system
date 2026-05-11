import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Badge, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import '../../../../../styles/tables.css';

const MarqueeMessages = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const defaultForm = {
    message: '',
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    speed: 30,
    fontWeight: '500',
    isActive: true,
    scheduleStart: '',
    scheduleEnd: '',
    displayOrder: 0
  };

  const [formData, setFormData] = useState({ ...defaultForm });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await ApiGet('/api/admin/business_setting/marquee-messages');
      if (result.success) {
        const data = result.success.data.data;
        setApiData(Array.isArray(data) ? data : []);
      } else {
        setError(result.fail);
        toast.error(result.fail);
      }
    } catch (err) {
      setError('Failed to fetch marquee messages');
      toast.error('Failed to fetch marquee messages');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...defaultForm });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setSelectedMessage(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (msg) => {
    setSelectedMessage(msg);
    setFormData({
      message: msg.message || '',
      bgColor: msg.bgColor || '#1a1a2e',
      textColor: msg.textColor || '#ffffff',
      speed: msg.speed || 30,
      fontWeight: msg.fontWeight || '500',
      isActive: msg.isActive !== false,
      scheduleStart: msg.scheduleStart ? msg.scheduleStart.slice(0, 16) : '',
      scheduleEnd: msg.scheduleEnd ? msg.scheduleEnd.slice(0, 16) : '',
      displayOrder: msg.displayOrder || 0
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.message.trim()) errors.message = 'Message is required';
    if (formData.message.length > 500) errors.message = 'Message must be 500 characters or less';
    if (formData.speed < 1 || formData.speed > 120) errors.speed = 'Speed must be between 1 and 120';
    if (formData.scheduleStart && formData.scheduleEnd && formData.scheduleStart >= formData.scheduleEnd) {
      errors.scheduleEnd = 'End time must be after start time';
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

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);

    try {
      const payload = {
        message: formData.message.trim(),
        bgColor: formData.bgColor,
        textColor: formData.textColor,
        speed: Number(formData.speed),
        fontWeight: formData.fontWeight,
        isActive: formData.isActive,
        scheduleStart: formData.scheduleStart || null,
        scheduleEnd: formData.scheduleEnd || null,
        displayOrder: Number(formData.displayOrder)
      };

      let result;
      if (modalMode === 'edit') {
        payload.id = selectedMessage.id;
        result = await ApiPut('/api/admin/business_setting/marquee-message/update', payload);
      } else {
        result = await ApiPost('/api/admin/business_setting/marquee-message/add', payload);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Marquee message added' : 'Marquee message updated');
        setShowModal(false);
        fetchData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save marquee message');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm(`Delete marquee message "${msg.message.substring(0, 50)}..."?`)) return;
    try {
      const result = await ApiDelete(`/api/admin/business_setting/marquee-message/delete/${msg.id}`);
      if (result.success) {
        toast.success('Marquee message deleted');
        fetchData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete marquee message');
    }
  };

  const fontWeightOptions = [
    { value: '300', label: 'Light (300)' },
    { value: '400', label: 'Normal (400)' },
    { value: '500', label: 'Medium (500)' },
    { value: '600', label: 'Semi-Bold (600)' },
    { value: '700', label: 'Bold (700)' },
    { value: '800', label: 'Extra-Bold (800)' }
  ];

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-megaphone me-2"></i>
          Marquee Messages
        </h4>
      </div>

      {/* Live Preview */}
      {apiData.filter(m => m.isActive).length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <small className="text-muted fw-semibold"><i className="bi bi-eye me-1"></i>Live Preview</small>
          </div>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6' }}>
            {apiData.filter(m => m.isActive).map((msg) => (
              <div
                key={msg.id}
                style={{
                  width: '100%',
                  overflow: 'hidden',
                  background: msg.bgColor || '#1a1a2e',
                  padding: '7px 0',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '200%',
                    animation: `marqueeSlide_${msg.id} ${msg.speed || 30}s linear infinite`,
                  }}
                >
                  <span style={{
                    display: 'flex', alignItems: 'center',
                    width: '50%', flexShrink: 0,
                    color: msg.textColor || '#ffffff',
                    fontSize: '13px', fontWeight: msg.fontWeight || 500, letterSpacing: '0.3px',
                    whiteSpace: 'nowrap', justifyContent: 'center',
                  }}>
                    {msg.message}
                  </span>
                  <span style={{
                    display: 'flex', alignItems: 'center',
                    width: '50%', flexShrink: 0,
                    color: msg.textColor || '#ffffff',
                    fontSize: '13px', fontWeight: msg.fontWeight || 500, letterSpacing: '0.3px',
                    whiteSpace: 'nowrap', justifyContent: 'center',
                  }}>
                    {msg.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            ${apiData.filter(m => m.isActive).map(msg => `
              @keyframes marqueeSlide_${msg.id} {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `).join('')}
          `}</style>
        </div>
      )}

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryContrast }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Message
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Order</th>
              <th>Message</th>
              <th>Colors</th>
              <th>Speed</th>
              <th>Status</th>
              <th>Schedule</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <div className="mt-2">Loading marquee messages...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : apiData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  <i className="bi bi-megaphone me-2"></i>
                  No marquee messages found. Click "Add Message" to create one.
                </td>
              </tr>
            ) : (
              apiData.map((msg) => (
                <tr key={msg.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(msg)} title="Edit">
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(msg)} title="Delete">
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{msg.displayOrder}</strong></td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.message}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-1 align-items-center">
                      <span style={{
                        display: 'inline-block', width: 20, height: 20, borderRadius: 4,
                        background: msg.bgColor || '#1a1a2e', border: '1px solid #ccc'
                      }} title={`BG: ${msg.bgColor}`}></span>
                      <span style={{
                        display: 'inline-block', width: 20, height: 20, borderRadius: 4,
                        background: msg.textColor || '#ffffff', border: '1px solid #ccc'
                      }} title={`Text: ${msg.textColor}`}></span>
                    </div>
                  </td>
                  <td>{msg.speed}s</td>
                  <td>
                    <Badge bg={msg.isActive ? 'success' : 'secondary'}>
                      {msg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ fontSize: '11px' }}>
                    {msg.scheduleStart || msg.scheduleEnd ? (
                      <>
                        {msg.scheduleStart && <div>From: {new Date(msg.scheduleStart).toLocaleString()}</div>}
                        {msg.scheduleEnd && <div>To: {new Date(msg.scheduleEnd).toLocaleString()}</div>}
                      </>
                    ) : (
                      <span className="text-muted">Always</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Marquee Message' : 'Edit Marquee Message'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            {/* Message */}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Message <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    placeholder="Enter scrolling marquee text..."
                    isInvalid={!!formErrors.message}
                    maxLength={500}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.message}</Form.Control.Feedback>
                  <Form.Text className="text-muted">{formData.message.length}/500 characters</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Colors */}
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Background Color</Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="color"
                      name="bgColor"
                      value={formData.bgColor}
                      onChange={handleFormChange}
                      style={{ width: 50, height: 38, padding: 2, cursor: 'pointer' }}
                    />
                    <Form.Control
                      type="text"
                      value={formData.bgColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, bgColor: e.target.value }))}
                      style={{ width: 100, fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Text Color</Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="color"
                      name="textColor"
                      value={formData.textColor}
                      onChange={handleFormChange}
                      style={{ width: 50, height: 38, padding: 2, cursor: 'pointer' }}
                    />
                    <Form.Control
                      type="text"
                      value={formData.textColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                      style={{ width: 100, fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Speed ({formData.speed}s)</Form.Label>
                  <Form.Range
                    name="speed"
                    min={5}
                    max={120}
                    value={formData.speed}
                    onChange={handleFormChange}
                  />
                  <Form.Text className="text-muted">Higher = slower scroll</Form.Text>
                  {formErrors.speed && <div className="text-danger" style={{ fontSize: 12 }}>{formErrors.speed}</div>}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Font Weight</Form.Label>
                  <Form.Select name="fontWeight" value={formData.fontWeight} onChange={handleFormChange}>
                    {fontWeightOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Schedule & Order */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule Start</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="scheduleStart"
                    value={formData.scheduleStart}
                    onChange={handleFormChange}
                  />
                  <Form.Text className="text-muted">Leave empty for immediate</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule End</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="scheduleEnd"
                    value={formData.scheduleEnd}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.scheduleEnd}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.scheduleEnd}</Form.Control.Feedback>
                  <Form.Text className="text-muted">Leave empty for no expiry</Form.Text>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleFormChange}
                    min={0}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Active</Form.Label>
                  <div className="mt-1">
                    <Form.Check
                      type="switch"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      label={formData.isActive ? 'Yes' : 'No'}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Modal Live Preview */}
            <div className="mt-2">
              <Form.Label className="text-muted fw-semibold"><i className="bi bi-eye me-1"></i>Preview</Form.Label>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #dee2e6' }}>
                <div style={{
                  width: '100%',
                  overflow: 'hidden',
                  background: formData.bgColor,
                  padding: '7px 0',
                  position: 'relative',
                }}>
                  <div style={{
                    display: 'flex',
                    width: '200%',
                    animation: 'marqueePreview linear infinite',
                    animationDuration: `${formData.speed}s`,
                  }}>
                    <span style={{
                      display: 'flex', alignItems: 'center',
                      width: '50%', flexShrink: 0,
                      color: formData.textColor,
                      fontSize: '13px', fontWeight: formData.fontWeight, letterSpacing: '0.3px',
                      whiteSpace: 'nowrap', justifyContent: 'center',
                    }}>
                      {formData.message || 'Type a message to preview...'}
                    </span>
                    <span style={{
                      display: 'flex', alignItems: 'center',
                      width: '50%', flexShrink: 0,
                      color: formData.textColor,
                      fontSize: '13px', fontWeight: formData.fontWeight, letterSpacing: '0.3px',
                      whiteSpace: 'nowrap', justifyContent: 'center',
                    }}>
                      {formData.message || 'Type a message to preview...'}
                    </span>
                  </div>
                </div>
              </div>
              <style>{`
                @keyframes marqueePreview {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
              `}</style>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
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
                  {modalMode === 'add' ? 'Add Message' : 'Update Message'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MarqueeMessages;
