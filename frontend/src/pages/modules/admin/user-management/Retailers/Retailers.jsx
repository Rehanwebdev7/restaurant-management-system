import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import UserFormModal from '../../../../../components/modals/UserFormModal';
import { toast } from 'react-toastify';
import adminService from '../../../../../services/AdminService';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const Retailers = () => {
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

  const userRole = 'Retailer';

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    // Skip initial mount to prevent duplicate API call
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchUserData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        role: 'retailer',
        page: currentPage,
        page_size: rowsPerPage
      };

      // Add search parameter
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add status filter
      if (statusFilter) {
        params.status = statusFilter;
      }

      const result = await adminService.getUsers(params);
      
      if (result.success) {
        setApiData(result.data.results);
        setTotalRecords(result.data.count);
        setTotalPages(result.data.totalPages);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      setError('Failed to fetch retailers');
      toast.error('Failed to fetch retailers');
    } finally {
      setLoading(false);
    }
  };

  // Data is already filtered and paginated from API
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
    const exportData = apiData.map(retailer => ({
      ID: retailer.id,
      'Customer ID': retailer.customer_id || '',
      Name: retailer.name || '',
      'Shop Name': retailer.shop_name || '',
      Mobile: retailer.mobile,
      Email: retailer.email || '',
      'Parent ID': retailer.parent || '',
      'Parent Name': retailer.parent_name || '',
      'Parent Shop Name': retailer.parent_shop_name || '',
      'Parent Mobile': retailer.parent_mobile || '',
      Region: retailer.region || '',
      District: retailer.district || '',
      City: retailer.city || '',
      'Postal Code': retailer.postal_code || '',
      'GST Number': retailer.gst_number || '',
      'Aadhaar Number': retailer.aadhaar_number || '',
      'PAN Number': retailer.pan_number || '',
      Status: retailer.status,
      'Last Login': retailer.last_login_display,
      'Created At': new Date(retailer.created_at).toLocaleDateString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Retailers');
    XLSX.writeFile(workbook, `retailers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.mobile}?`)) {
      try {
        const result = await adminService.deleteUser(user.id);
        if (result.success) {
          toast.success('Retailer deleted successfully');
          fetchUserData();
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error('Failed to delete retailer');
      }
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      // Ensure role is set to retailer
      const retailerData = {
        ...formData,
        role: 'retailer'
      };
      
      let result;
      if (modalMode === 'add') {
        result = await adminService.createUser(retailerData);
        if (result.success) {
          toast.success('Retailer added successfully');
          setShowModal(false);
          fetchUserData();
        }
      } else {
        result = await adminService.updateUser(selectedUser.id, retailerData);
        if (result.success) {
          toast.success('Retailer updated successfully');
          setShowModal(false);
          fetchUserData();
        }
      }
      
      // Return the result so modal can handle errors
      return result;
    } catch (err) {
      toast.error('Failed to save retailer');
      return { success: false, error: 'Failed to save retailer' };
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') {
      return <Badge bg="success">Active</Badge>;
    } else if (statusLower === 'inactive') {
      return <Badge bg="danger">Inactive</Badge>;
    } else if (statusLower === 'pending') {
      return <Badge bg="warning">Pending</Badge>;
    } else {
      return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: '#031a6f', fontWeight: '700' }}>
          <i className="fas fa-store me-2"></i>
          Retailer
        </h2>
        <div className="d-flex gap-2">
          {/* <Button variant="success" onClick={exportToExcel}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Export Excel
          </Button> */}
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Retailer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search retailers..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>Actions</th>
              <th>ID</th>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Shop Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Parent (FOS/Distributor)</th>
              <th>Location</th>
              <th>GST Number</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Registered</th>
              
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={13} />
            ) : error ? (
              <tr>
                <td colSpan="13" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No retailers found
                </td>
              </tr>
            ) : (
              paginatedData.map((retailer) => (
                <tr key={retailer.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(retailer)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(retailer)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{retailer.id}</strong></td>
                  <td>{retailer.customer_id || 'N/A'}</td>
                  <td>{retailer.name || 'N/A'}</td>
                  <td>{retailer.shop_name || 'N/A'}</td>
                  <td>{retailer.mobile}</td>
                  <td>{retailer.email || 'N/A'}</td>
                  <td>
                    <div>
                      <div><strong>{retailer.parent_name || 'N/A'}</strong></div>
                      <small className="text-muted">{retailer.parent_shop_name || ''}</small>
                      {retailer.parent_mobile && (
                        <div><small className="text-muted">{retailer.parent_mobile}</small></div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{retailer.city || 'N/A'}</div>
                      <small className="text-muted">{retailer.district || ''}</small>
                      <div><small className="text-muted">{retailer.region || ''}</small></div>
                    </div>
                  </td>
                  <td>{retailer.gst_number || 'N/A'}</td>
                  <td>{getStatusBadge(retailer.status)}</td>
                  <td>{retailer.last_login_display}</td>
                  <td>{new Date(retailer.created_at).toLocaleDateString()}</td>
                  
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
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            style={{ width: 'auto' }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </Form.Select>
        </div>
        <div>
          Showing {totalRecords === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalRecords)} of {totalRecords} entries
        </div>
        <Pagination>
          <Pagination.First 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1} 
          />
          <Pagination.Prev 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1} 
          />
          {[...Array(Math.min(5, totalPages))].map((_, index) => {
            const pageNum = Math.max(1, Math.min(currentPage - 2 + index, totalPages - 4 + index));
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
            disabled={currentPage === totalPages} 
          />
          <Pagination.Last 
            onClick={() => setCurrentPage(totalPages)} 
            disabled={currentPage === totalPages} 
          />
        </Pagination>
      </div>

      {/* User Form Modal */}
      <UserFormModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        onSave={handleModalSubmit}
        userRole={userRole}
        userData={selectedUser ? {...selectedUser, role: 'retailer'} : null}
        mode={modalMode}
      />
    </Container>
  );
};

export default Retailers;