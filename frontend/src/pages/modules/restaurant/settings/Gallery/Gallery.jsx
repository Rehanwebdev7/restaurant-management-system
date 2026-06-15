import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Badge, Spinner, Modal, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ApiGet, ApiPostFormData, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { server_api } from '../../../../../utils/constants';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';
import '../../../../../styles/tables.css';

const GALLERY_CATEGORIES = ['GENERAL', 'FOOD', 'INTERIOR', 'AMBIENCE', 'EVENT', 'TEAM', 'OTHER'];

const Gallery = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    platform: 'Web',
    displayOrder: 0,
    isActive: true,
  });

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;
    const baseUrl = server_api();
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  useEffect(() => {
    fetchGalleryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchGalleryData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage,
      };

      const result = await ApiGet('/api/restaurant/gallery/getAll', params);

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
      setError('Failed to fetch gallery images');
      toast.error('Failed to fetch gallery images');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'GENERAL',
      platform: 'Web',
      displayOrder: 0,
      isActive: true,
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAdd = () => {
    resetForm();
    setSelectedGallery(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (gallery) => {
    setSelectedGallery(gallery);
    setFormData({
      title: gallery.title || '',
      description: gallery.description || '',
      category: gallery.category || 'GENERAL',
      platform: gallery.platform || 'Web',
      displayOrder: gallery.displayOrder ?? 0,
      isActive: gallery.isActive !== undefined ? gallery.isActive : true,
    });
    setImagePreview(gallery.imageUrl || null);
    setImageFile(null);
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
    if (!validateForm()) return;

    setFormLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('platform', formData.platform);
      formDataToSend.append('displayOrder', String(formData.displayOrder ?? 0));
      formDataToSend.append('isActive', String(!!formData.isActive));

      if (modalMode === 'edit') {
        formDataToSend.append('galleryId', selectedGallery.id);
      }

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const endpoint = modalMode === 'add'
        ? '/api/restaurant/gallery/add_gallery'
        : '/api/restaurant/gallery/update_gallery';

      const result = await ApiPostFormData(endpoint, formDataToSend);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Gallery image added successfully' : 'Gallery image updated successfully');
        setShowModal(false);
        fetchGalleryData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save gallery image');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (gallery) => {
    if (!window.confirm(`Delete "${gallery.title || 'this gallery image'}"?`)) {
      return;
    }

    try {
      const result = await ApiDelete(`/api/restaurant/gallery/${gallery.id}`);
      if (result.success) {
        toast.success('Gallery image deleted successfully');
        fetchGalleryData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete gallery image');
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let number = startPage; number <= endPage; number += 1) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
          {number}
        </Pagination.Item>
      );
    }

    return <Pagination className="mb-0">{items}</Pagination>;
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1">Gallery</h3>
          <div className="text-muted">Manage restaurant photos for the customer website</div>
        </div>
        <Button onClick={handleAdd} style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}>
          <i className="bi bi-plus-lg me-2"></i>
          Add Gallery Image
        </Button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="table-responsive">
        <Table striped bordered hover className="align-middle bg-white">
          <thead>
            <tr>
              <th>Actions</th>
              <th>ID</th>
              <th>Image</th>
              <th>Title</th>
              <th>Category</th>
              <th>Platform</th>
              <th>Order</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <Spinner animation="border" />
                  <div className="mt-2">Loading gallery images...</div>
                </td>
              </tr>
            ) : apiData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5 text-muted">
                  No gallery images found
                </td>
              </tr>
            ) : (
              apiData.map((gallery) => (
                <tr key={gallery.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(gallery)} title="Edit">
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(gallery)} title="Delete">
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{gallery.id}</strong></td>
                  <td>
                    {gallery.imageUrl ? (
                      <Image
                        src={resolveImageUrl(gallery.imageUrl)}
                        alt={gallery.title || 'Gallery'}
                        width={72}
                        height={54}
                        rounded
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>
                    <div><strong>{gallery.title || 'N/A'}</strong></div>
                    <small className="text-muted">{gallery.description || ''}</small>
                  </td>
                  <td>{gallery.category || 'GENERAL'}</td>
                  <td>{gallery.platform || 'Web'}</td>
                  <td>{gallery.displayOrder ?? 0}</td>
                  <td>
                    <Badge bg={gallery.isActive ? 'success' : 'secondary'}>
                      {gallery.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="text-muted">
          Showing {apiData.length} of {totalRecords} records
        </div>
        {renderPagination()}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Gallery Image' : 'Edit Gallery Image'}
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
                    placeholder="Enter image title"
                    isInvalid={!!formErrors.title}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.title}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.category}
                  >
                    {GALLERY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{formErrors.category}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
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
                    <option value="iOS">iOS</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{formErrors.platform}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
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
              <Col md={3} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id="gallery-active-switch"
                  name="isActive"
                  label="Active"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  className="mb-3"
                />
              </Col>
            </Row>

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

            <Form.Group className="mb-3">
              <Form.Label>
                Gallery Image {modalMode === 'add' && <span className="text-danger">*</span>}
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                isInvalid={!!formErrors.image}
              />
              <Form.Control.Feedback type="invalid">{formErrors.image}</Form.Control.Feedback>
              {imagePreview && (
                <div className="mt-2">
                  <Image src={resolveImageUrl(imagePreview)} alt="Preview" style={{ maxWidth: '320px', maxHeight: '180px' }} rounded />
                </div>
              )}
            </Form.Group>
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
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {modalMode === 'add' ? 'Add Gallery Image' : 'Update Gallery Image'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ImageCropperModal
        show={showCropper}
        onHide={() => setShowCropper(false)}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={4 / 3}
        title="Crop Gallery Image"
        primaryColor={primaryColor}
      />
    </Container>
  );
};

export default Gallery;
