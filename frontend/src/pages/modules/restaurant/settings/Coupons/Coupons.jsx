import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Badge, Spinner, Modal, Image } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPostFormData, ApiPutFormData, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const Coupons = () => {
  const { primaryColor, primaryContrast } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    couponName: '',
    couponCode: '',
    discountAmount: '',
    isPercent: true,
    validity: '',
    displayOnScreen: true,
    description: '',
    title: '',
    global: false,
    firstOrder: false,
    branchId: '',
    menuItems: [],
    usageLimit: '',
    quantity: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [menuItemSearch, setMenuItemSearch] = useState('');
  const [branchList, setBranchList] = useState([]);

  useEffect(() => {
    fetchCouponsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchCouponsData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/restaurant/coupon/filter', params);

      if (result.success) {
        const data = result.success.data.data || result.success.data;
        setApiData(Array.isArray(data.records) ? data.records : Array.isArray(data) ? data : []);
        setTotalRecords(data.totalRecords || data.length || 0);
        setTotalPages(data.totalPages || Math.ceil((data.totalRecords || data.length || 0) / rowsPerPage) || 1);
      } else {
        setError(result.fail);
        toast.error(result.fail);
      }
    } catch (err) {
      setError('Failed to fetch coupons');
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(coupon => ({
      ID: coupon.id,
      'Coupon Name': coupon.couponName || '',
      'Coupon Code': coupon.couponCode || '',
      'Discount Amount': coupon.discountAmount || '',
      'Type': coupon.isPercent ? 'Percentage' : 'Flat',
      Title: coupon.title || '',
      Validity: coupon.validity || '',
      'Display on Screen': coupon.displayOnScreen ? 'Yes' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Coupons');
    XLSX.writeFile(workbook, `coupons_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      couponName: '',
      couponCode: '',
      discountAmount: '',
      isPercent: true,
      validity: '',
      displayOnScreen: true,
      description: '',
      title: '',
      global: false,
      firstOrder: false,
      branchId: '',
      menuItems: [],
      usageLimit: '',
      quantity: ''
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setMenuItemSearch('');
  };

  const handleAdd = () => {
    resetForm();
    setSelectedCoupon(null);
    setModalMode('add');
    setShowModal(true);
    setMenuItems([]);
    fetchBranches();
  };

  const fetchMenuItems = async (branchId) => {
    try {
      if (!branchId) {
        console.log('No branch selected, clearing menu items');
        setMenuItems([]);
        return;
      }

      console.log('Fetching menu items for branchId:', branchId);

      const result = await ApiGet('/api/restaurant/menu_items/by-branch', { branchId });

      console.log('Menu Items API Result:', result);

      if (result.success) {
        const data = result.success.data;
        console.log('Menu Items Data:', data);

        // Handle response structure
        const items = Array.isArray(data) ? data : (data?.data || []);

        console.log('Processed Menu Items:', items);
        setMenuItems(items);
      } else {
        console.error('Failed to fetch menu items:', result.fail);
        setMenuItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch menu items - Error:', err);
      setMenuItems([]);
    }
  };

  const fetchBranches = async () => {
    try {
      console.log('Fetching branches...');

      const result = await ApiGet('/api/restaurant/users/getBy_restId', { role: 'branch' });

      console.log('Branches API Result:', result);

      if (result.success) {
        const data = result.success.data;
        console.log('Branches Data:', data);

        // Handle response structure
        const branches = Array.isArray(data) ? data : (data?.data || []);

        console.log('Processed Branches:', branches);
        setBranchList(branches);
      } else {
        console.error('Failed to fetch branches:', result.fail);
        setBranchList([]);
      }
    } catch (err) {
      console.error('Failed to fetch branches - Error:', err);
      setBranchList([]);
    }
  };

  const handleEdit = (coupon) => {
    const branchId = coupon.branchId?.id || '';

    // Extract menu item IDs from couponMappingId
    const selectedItemIds = coupon.couponMappingId && coupon.couponMappingId.length > 0
      ? coupon.couponMappingId.map(mapping => mapping.menuItemId?.id).filter(id => id)
      : coupon.menuItems || [];

    setSelectedCoupon(coupon);
    setFormData({
      couponName: coupon.couponName || '',
      couponCode: coupon.couponCode || '',
      discountAmount: coupon.discountAmount || '',
      isPercent: coupon.isPercent !== false,
      validity: coupon.validity || '',
      displayOnScreen: coupon.displayOnScreen !== false,
      description: coupon.description || '',
      title: coupon.title || '',
      global: coupon.global || false,
      firstOrder: coupon.firstOrder || false,
      branchId: branchId,
      menuItems: selectedItemIds,
      usageLimit: coupon.usageLimit || '',
      quantity: coupon.quantity || ''
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(coupon.logo || coupon.logoUrl || null);
    setModalMode('edit');
    setShowModal(true);
    fetchMenuItems(branchId);
    fetchBranches();
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.couponName.trim()) {
      errors.couponName = 'Coupon Name is required';
    }

    if (!formData.couponCode.trim()) {
      errors.couponCode = 'Coupon Code is required';
    }

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.discountAmount) {
      errors.discountAmount = 'Discount Amount is required';
    }

    if (!formData.branchId) {
      errors.branchId = 'Branch is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle mutual exclusivity between global, firstOrder, and menuItems
    if (type === 'checkbox') {
      if (name === 'global' && checked) {
        // If global is selected, unselect firstOrder and clear menuItems
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          firstOrder: false,
          menuItems: []
        }));
      } else if (name === 'firstOrder' && checked) {
        // If firstOrder is selected, unselect global and clear menuItems
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          global: false,
          menuItems: []
        }));
      } else {
        // For other checkboxes, just update normally
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      // For non-checkbox inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Fetch menu items when branch is selected
      if (name === 'branchId' && value) {
        fetchMenuItems(value);
      }
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMenuItemChange = (e) => {
    const { value, checked } = e.target;
    const itemId = parseInt(value);

    setFormData(prev => {
      let newMenuItems = checked
        ? [...prev.menuItems, itemId]
        : prev.menuItems.filter(id => id !== itemId);

      // If menu items are being selected, uncheck global and firstOrder
      if (newMenuItems.length > 0) {
        return {
          ...prev,
          menuItems: newMenuItems,
          global: false,
          firstOrder: false
        };
      } else {
        // If all menu items are deselected, just update menuItems
        return {
          ...prev,
          menuItems: newMenuItems
        };
      }
    });
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
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const formDataToSend = new FormData();

      const payload = {
        couponName: formData.couponName.trim(),
        couponCode: formData.couponCode.trim(),
        discountAmount: parseInt(formData.discountAmount),
        isPercent: formData.isPercent,
        validity: formData.validity,
        displayOnScreen: formData.displayOnScreen,
        description: formData.description.trim(),
        title: formData.title.trim(),
        global: formData.global,
        firstOrder: formData.firstOrder,
        branchId: {
          id: parseInt(formData.branchId)
        },
        menuItems: formData.menuItems,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null
      };

      if (modalMode === 'edit' && selectedCoupon) {
        payload.id = selectedCoupon.id;
      }

      formDataToSend.append('payload', JSON.stringify(payload));

      if (imageFile) {
        formDataToSend.append('logo', imageFile);
      }

      const endpoint = modalMode === 'add'
        ? '/api/restaurant/coupon/addCoupons'
        : '/api/restaurant/coupon/updateCoupon';

      let result;
      if (modalMode === 'add') {
        result = await ApiPostFormData(endpoint, formDataToSend);
      } else {
        result = await ApiPutFormData(endpoint, formDataToSend);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Coupon added successfully' : 'Coupon updated successfully');
        setShowModal(false);
        fetchCouponsData();
      } else {
        toast.error(result.fail || 'Failed to save coupon');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to save coupon');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete "${coupon.couponName}"?`)) {
      return;
    }

    try {
      const result = await ApiDelete('/api/restaurant/coupon/deleteCoupon', { id: coupon.id });

      if (result.success) {
        toast.success('Coupon deleted successfully');
        fetchCouponsData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const getTypeBadge = (isPercent) => {
    if (isPercent) {
      return <Badge bg="danger">Percentage</Badge>;
    } else {
      return <Badge bg="success">Flat</Badge>;
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-ticket-perforated me-2"></i>
          Coupons
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryContrast }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Coupon
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
              <th>Logo</th>
              <th>Code</th>
              <th>Name</th>
              <th>Title</th>
              <th>Discount</th>
              <th>Type</th>
              <th>Items</th>
              <th>Validity</th>
              <th>Display</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={11} />
            ) : error ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No coupons found
                </td>
              </tr>
            ) : (
              paginatedData.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(coupon)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(coupon)}
                        disabled={loading}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{coupon.id}</strong></td>
                  <td>
                    {coupon.logo || coupon.logoUrl ? (
                      <img
                        src={coupon.logo || coupon.logoUrl}
                        alt={coupon.couponCode}
                        width={50}
                        height={50}
                        className="rounded"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-muted">No logo</span>
                    )}
                  </td>
                  <td><Badge bg="info">{coupon.couponCode}</Badge></td>
                  <td>{coupon.couponName || 'N/A'}</td>
                  <td>{coupon.title || 'N/A'}</td>
                  <td>{coupon.discountAmount || 'N/A'}</td>
                  <td>{getTypeBadge(coupon.isPercent)}</td>
                  <td>
                    {coupon.couponMappingId && coupon.couponMappingId.length > 0 ? (
                      <details style={{ cursor: 'pointer' }}>
                        <summary style={{ listStyle: 'none', padding: '6px 10px', backgroundColor: '#343a40', color: 'white', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500', outline: 'none' }}>
                          {coupon.couponMappingId.length} ITEM{coupon.couponMappingId.length !== 1 ? 'S' : ''}
                        </summary>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                          {coupon.couponMappingId.map((mapping, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Badge bg="info" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                {mapping.menuItemId?.name || `Item ${mapping.menuItemId?.id}`}
                              </Badge>
                              {mapping.menuItemId?.price && (
                                <span style={{ color: '#dc3545', fontWeight: '600', fontSize: '0.8rem' }}>
                                  ${mapping.menuItemId.price}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : coupon.firstOrder ? (
                      <span style={{ color: '#666', fontWeight: '500', fontSize: '0.9rem' }}>FIRST ORDER</span>
                    ) : (
                      <span style={{ color: '#666', fontWeight: '500', fontSize: '0.9rem' }}>GLOBAL</span>
                    )}
                  </td>
                  <td>{coupon.validity || 'N/A'}</td>
                  <td>{coupon.displayOnScreen ? <Badge bg="success">Yes</Badge> : <Badge bg="danger">No</Badge>}</td>
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

      {/* Coupon Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Coupon' : 'Edit Coupon'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Coupon Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="couponName"
                    value={formData.couponName}
                    onChange={handleFormChange}
                    placeholder="Enter coupon name"
                    isInvalid={!!formErrors.couponName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.couponName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Coupon Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleFormChange}
                    placeholder="Enter coupon code"
                    isInvalid={!!formErrors.couponCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.couponCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Enter title (e.g., Special Deal)"
                    isInvalid={!!formErrors.title}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Amount <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="discountAmount"
                    value={formData.discountAmount}
                    onChange={handleFormChange}
                    placeholder="Enter amount"
                    isInvalid={!!formErrors.discountAmount}
                    onWheel={(e) => e.target.blur()}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.discountAmount}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <Form.Check
                    type="checkbox"
                    name="isPercent"
                    id="isPercent"
                    label="Is Percentage"
                    checked={formData.isPercent}
                    onChange={handleFormChange}
                    style={{ marginTop: '8px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Validity</Form.Label>
                  <Form.Control
                    type="date"
                    name="validity"
                    value={formData.validity}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.validity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.validity}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.branchId}
                  >
                    <option value="">Select Branch</option>
                    {branchList.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.branchId}
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
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter description (e.g., 20% off on pizzas)"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usage Limit</Form.Label>
                  <Form.Control
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleFormChange}
                    placeholder="Enter usage limit"
                    onWheel={(e) => e.target.blur()}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    placeholder="Enter quantity"
                    onWheel={(e) => e.target.blur()}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mt-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Logo Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <Image src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px' }} rounded />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <div className="d-flex align-items-center gap-2" style={{ marginTop: '8px' }}>
                    <Form.Check
                      type="switch"
                      name="displayOnScreen"
                      id="displayOnScreen"
                      label="Show On Display"
                      checked={formData.displayOnScreen}
                      onChange={handleFormChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mt-3">
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  name="global"
                  id="global"
                  label="Global Coupon"
                  checked={formData.global}
                  onChange={handleFormChange}
                  disabled={formData.menuItems.length > 0}
                  title={formData.menuItems.length > 0 ? "Disable menu items to use this option" : ""}
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  name="firstOrder"
                  id="firstOrder"
                  label="First Order Only"
                  checked={formData.firstOrder}
                  onChange={handleFormChange}
                  disabled={formData.menuItems.length > 0}
                  title={formData.menuItems.length > 0 ? "Disable menu items to use this option" : ""}
                />
              </Col>
            </Row>

            <Row className="mt-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Menu Items
                    {(formData.global || formData.firstOrder) && (
                      <span className="text-muted ms-2" style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>
                        (Disabled - Disable "Global Coupon" or "First Order Only" to use)
                      </span>
                    )}
                  </Form.Label>
                  <Form.Text className="d-block mb-2 text-muted">Search and select items this coupon applies to</Form.Text>

                  {/* Search Input */}
                  {!(formData.global || formData.firstOrder) && (
                    <Form.Control
                      type="text"
                      placeholder="Search menu items..."
                      value={menuItemSearch}
                      onChange={(e) => setMenuItemSearch(e.target.value)}
                      className="mb-3"
                    />
                  )}

                  {/* Menu Items Dropdown */}
                  {!(formData.global || formData.firstOrder) && (
                  <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '10px' }}>
                    {menuItems.length > 0 ? (
                      menuItems
                        .filter(item =>
                          (item.name || item.itemName || `Item ${item.id}`).toLowerCase().includes(menuItemSearch.toLowerCase())
                        )
                        .length > 0 ? (
                        menuItems
                          .filter(item =>
                            (item.name || item.itemName || `Item ${item.id}`).toLowerCase().includes(menuItemSearch.toLowerCase())
                          )
                          .map((item) => (
                            <Form.Check
                              key={item.id}
                              type="checkbox"
                              id={`menuItem${item.id}`}
                              label={item.name || item.itemName || `Item ${item.id}`}
                              value={item.id}
                              checked={formData.menuItems.includes(item.id)}
                              onChange={handleMenuItemChange}
                              className="mb-2"
                              disabled={formData.global || formData.firstOrder}
                            />
                          ))
                      ) : (
                        <div className="text-muted text-center py-3">
                          <small>No items match your search</small>
                        </div>
                      )
                    ) : (
                      <div className="text-muted text-center py-3">
                        <small>No menu items available</small>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Selected Menu Items */}
                  {formData.menuItems.length > 0 && (
                    <div className="mt-3 p-2" style={{ backgroundColor: '#f8f9fa', borderLeft: '3px solid #dc3545', borderRadius: '4px' }}>
                      <Form.Text className="d-block mb-1 text-muted">
                        <strong style={{ fontSize: '0.9rem' }}>Selected Items ({formData.menuItems.length})</strong>
                      </Form.Text>
                      <div style={{ fontSize: '0.9rem', color: '#333' }}>
                        {formData.menuItems.map((itemId, index) => {
                          const selectedItem = menuItems.find(item => item.id === itemId);
                          const itemName = selectedItem?.name || selectedItem?.itemName || `Item ${itemId}`;
                          return (
                            <div key={itemId} style={{ paddingLeft: '10px' }}>
                              • {itemName}
                            </div>
                          );
                        })}
                      </div>
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
                  {modalMode === 'add' ? 'Add Coupon' : 'Update Coupon'}
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
        aspectRatio={1}
        title="Crop Logo Image"
        primaryColor={primaryColor}
      />
    </Container>
  );
};

export default Coupons;
