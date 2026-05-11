import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Badge, Spinner, Modal, Image } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPostFormData, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';
import '../../../../../styles/tables.css';

const Slider = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedSlider, setSelectedSlider] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'Web'
  });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  useEffect(() => {
    fetchSliderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchSliderData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/restaurant/sliders/getAll', params);

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
      setError('Failed to fetch sliders');
      toast.error('Failed to fetch sliders');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(slider => ({
      ID: slider.id,
      Title: slider.title || '',
      Description: slider.description || '',
      Platform: slider.platform || '',
      'Image URL': slider.imageUrl || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sliders');
    XLSX.writeFile(workbook, `sliders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      platform: 'Web'
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAdd = () => {
    resetForm();
    setSelectedSlider(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (slider) => {
    setSelectedSlider(slider);
    setFormData({
      title: slider.title || '',
      description: slider.description || '',
      platform: slider.platform || 'Web'
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(slider.imageUrl || null);
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.platform) {
      errors.platform = 'Platform is required';
    }

    if (modalMode === 'add' && !imageFile) {
      errors.image = 'Image is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        setCropImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedFile, previewUrl) => {
    setImageFile(croppedFile);
    setImagePreview(previewUrl);
    if (formErrors.image) {
      setFormErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('platform', formData.platform);
      formDataToSend.append('description', formData.description.trim());

      if (modalMode === 'edit') {
        formDataToSend.append('sliderId', selectedSlider.id);
      }

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const endpoint = modalMode === 'add'
        ? '/api/restaurant/sliders/add_slider'
        : '/api/restaurant/sliders/update_slider';

      const result = await ApiPostFormData(endpoint, formDataToSend);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Slider added successfully' : 'Slider updated successfully');
        setShowModal(false);
        fetchSliderData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save slider');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (slider) => {
    if (!window.confirm(`Are you sure you want to delete "${slider.title}"?`)) {
      return;
    }

    try {
      const result = await ApiDelete('/api/restaurant/sliders/delete', { id: slider.id });

      if (result.success) {
        toast.success('Slider deleted successfully');
        fetchSliderData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete slider');
    }
  };

  const getPlatformBadge = (platform) => {
    switch (platform) {
      case 'Web':
        return <Badge bg="primary">Web</Badge>;
      case 'Android':
        return <Badge bg="success">Android</Badge>;
      case 'ios':
        return <Badge bg="info">iOS</Badge>;
      default:
        return <Badge bg="secondary">{platform}</Badge>;
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-images me-2"></i>
          Sliders
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryContrast }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Slider
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
              <th>Title</th>
              <th>Description</th>
              <th>Platform</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <div className="mt-2">Loading sliders...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No sliders found
                </td>
              </tr>
            ) : (
              paginatedData.map((slider) => (
                <tr key={slider.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(slider)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(slider)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{slider.id}</strong></td>
                  <td>
                    {slider.imageUrl ? (
                      <img
                        src={slider.imageUrl}
                        alt={slider.title}
                        width={80}
                        height={45}
                        className="rounded"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>{slider.title || 'N/A'}</td>
                  <td>{slider.description || 'N/A'}</td>
                  <td>{getPlatformBadge(slider.platform)}</td>
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

      {/* Slider Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Slider' : 'Edit Slider'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Enter slider title"
                    isInvalid={!!formErrors.title}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Platform <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="platform"
                    value={formData.platform}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.platform}
                  >
                    <option value="Web">Web</option>
                    <option value="Android">Android</option>
                    <option value="ios">iOS</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.platform}
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
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter description"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Slider Image {modalMode === 'add' && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    isInvalid={!!formErrors.image}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.image}
                  </Form.Control.Feedback>
                  {imagePreview && (
                    <div className="mt-2">
                      <Image src={imagePreview} alt="Preview" style={{ maxWidth: '300px', maxHeight: '150px' }} rounded />
                    </div>
                  )}
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
                  {modalMode === 'add' ? 'Add Slider' : 'Update Slider'}
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
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
        title="Crop Slider Image"
        primaryColor={primaryColor}
      />
    </Container>
  );
};

export default Slider;
