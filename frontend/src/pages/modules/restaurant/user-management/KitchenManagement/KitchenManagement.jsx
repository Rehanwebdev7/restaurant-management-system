import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import { useTheme } from '../../../../../contexts/ThemeContext';
import '../../../../../styles/tables.css';

const KitchenManagement = () => {
  const { primaryColor, primaryContrast } = useTheme();
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

  // Branch dropdown data
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // For edit mode - store selected branch name
  const [selectedBranchName, setSelectedBranchName] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    // password: '',
    isActive: true,
    branchId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchKitchenData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchKitchenData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const result = await ApiGet('/api/restaurant/users/filter', {
        role: 'branch',
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setBranches(data.records || []);
      } else {
        toast.error('Failed to fetch branches');
      }
    } catch (err) {
      toast.error('Failed to fetch branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchKitchenData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        role: 'kitchen',
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }

      if (statusFilter) {
        params.isActive = statusFilter === 'active';
      }

      const result = await ApiGet('/api/restaurant/users/filter', params);

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
      setError('Failed to fetch kitchen staff');
      toast.error('Failed to fetch kitchen staff');
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
    const exportData = apiData.map(kitchen => ({
      ID: kitchen.id,
      Name: kitchen.name || '',
      Mobile: kitchen.mobile || '',
      Email: kitchen.email || '',
      Branch: kitchen.branchId?.name || 'N/A',
      Role: kitchen.role || '',
      Status: kitchen.isActive ? 'Active' : 'Inactive',
      'Created At': kitchen.createdAt ? new Date(kitchen.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kitchen');
    XLSX.writeFile(workbook, `kitchen_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      // password: '',
      isActive: true,
      branchId: ''
    });
    setFormErrors({});
    setSelectedBranchName('');
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
      branchId: user.branchId?.id || ''
    });
    setSelectedBranchName(user.branchId?.name || '');
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete kitchen staff "${user.name}"?`)) {
      try {
        const result = await ApiDelete(`/api/restaurant/users/${user.id}`);
        if (result.success) {
          toast.success('Kitchen staff deleted successfully');
          fetchKitchenData();
        } else {
          toast.error(result.fail);
        }
      } catch (err) {
        toast.error('Failed to delete kitchen staff');
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

    if (!formData.branchId) {
      errors.branchId = 'Branch is required';
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
        role: 'kitchen',
        isActive: formData.isActive,
        branchId: {
          id: parseInt(formData.branchId)
        }
      };
// if (formData.password.trim()) {//   payload.password = formData.password.trim();// }

      if (modalMode === 'add') {
        result = await ApiPost('/api/restaurant/users/add', payload);
        if (result.success) {
          toast.success('Kitchen staff added successfully');
          setShowModal(false);
          fetchKitchenData();
        } else {
          toast.error(result.fail);
        }
      } else {
        payload.id = selectedUser.id;
        result = await ApiPut('/api/restaurant/users/update', payload);
        if (result.success) {
          toast.success('Kitchen staff updated successfully');
          setShowModal(false);
          fetchKitchenData();
        } else {
          toast.error(result.fail);
        }
      }
    } catch (err) {
      toast.error('Failed to save kitchen staff');
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

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-utensils me-2"></i>
          Kitchen Staff
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
              placeholder="Search kitchen staff..."
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
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryContrast }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Kitchen Staff
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
              <th>Branch</th>
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
                  No kitchen staff found
                </td>
              </tr>
            ) : (
              paginatedData.map((kitchen) => (
                <tr key={kitchen.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(kitchen)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(kitchen)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{kitchen.id}</strong></td>
                  <td>{kitchen.name || 'N/A'}</td>
                  <td>{kitchen.mobile || 'N/A'}</td>
                  <td>{kitchen.email || 'N/A'}</td>
                  <td>{kitchen.branchId?.name || 'N/A'}</td>
                  <td>{getStatusBadge(kitchen.isActive)}</td>
                  <td>{kitchen.createdAt ? new Date(kitchen.createdAt).toLocaleDateString() : 'N/A'}</td>
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

      {/* Kitchen Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Kitchen Staff' : 'Edit Kitchen Staff'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={branches.map((branch) => ({
                      value: branch.id,
                      label: branch.name
                    }))}
                    value={formData.branchId ? {
                      value: formData.branchId,
                      label: branches.find(b => b.id === parseInt(formData.branchId))?.name || selectedBranchName || `Branch ${formData.branchId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, branchId: selected ? selected.value : '' }));
                      setSelectedBranchName(selected ? selected.label : '');
                      if (formErrors.branchId) {
                        setFormErrors(prev => ({ ...prev, branchId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={branchesLoading}
                    placeholder="Search & Select Branch"
                    noOptionsMessage={() => "No branches found"}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: formErrors.branchId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.branchId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.branchId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.branchId}
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
                    placeholder="Enter name"
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
                  {modalMode === 'add' ? 'Add Kitchen Staff' : 'Update Kitchen Staff'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default KitchenManagement;
