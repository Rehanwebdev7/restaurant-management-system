import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import FOSFormModal from '../../../../../components/modals/FOSFormModal';
import { toast } from 'react-toastify';
import adminService from '../../../../../services/AdminService';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const FOS = () => {

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

  const userRole = 'Field Officer Management';

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
        role: 'fos',
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
      setError('Failed to fetch field officers');
      toast.error('Failed to fetch field officers');
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
    const exportData = apiData.map(fos => ({
      ID: fos.id,
      'Customer ID': fos.customer_id || '',
      Name: fos.name || '',
      Mobile: fos.mobile,
      Email: fos.email || '',
      'Parent ID': fos.parent || '',
      'Parent Name': fos.parent_name || '',
      'Parent Shop Name': fos.parent_shop_name || '',
      'Parent Mobile': fos.parent_mobile || '',
      Status: fos.status,
      'Last Login': fos.last_login_display,
      'Created At': new Date(fos.created_at).toLocaleDateString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FOS');
    XLSX.writeFile(workbook, `fos_${new Date().toISOString().split('T')[0]}.xlsx`);
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
          toast.success('Field Officer deleted successfully');
          fetchUserData();
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error('Failed to delete field officer');
      }
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      let result;
      if (modalMode === 'add') {
        result = await adminService.createUser(formData);
        if (result.success) {
          toast.success('Field Officer added successfully');
          setShowModal(false);
          fetchUserData();
        }
      } else {
        result = await adminService.updateUser(selectedUser.id, formData);
        if (result.success) {
          toast.success('Field Officer updated successfully');
          setShowModal(false);
          fetchUserData();
        }
      }
      
      // Return the result so modal can handle errors
      return result;
    } catch (err) {
      toast.error('Failed to save field officer');
      return { success: false, error: 'Failed to save field officer' };
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
          <i className="fas fa-users me-2"></i>
          Field Officers
        </h2>
        <div className="d-flex gap-2">
          {/* <Button variant="success" onClick={exportToExcel}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Export Excel
          </Button> */}
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Field Officer
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
              placeholder="Search field officers..."
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
              <th>Mobile</th>
              <th>Email</th>
              <th>Distributor</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Registered</th>
              
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={10} />
            ) : error ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No field officers found
                </td>
              </tr>
            ) : (
              paginatedData.map((fos) => (
                <tr key={fos.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(fos)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(fos)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>

                  <td><strong>{fos.id}</strong></td>
                  <td>{fos.customer_id || 'N/A'}</td>
                  <td>{fos.name || 'N/A'}</td>
                  <td>{fos.mobile}</td>
                  <td>{fos.email || 'N/A'}</td>
                  <td>
                    <div>
                      <div><strong>{fos.parent_name || 'N/A'}</strong></div>
                      <small className="text-muted">{fos.parent_shop_name || ''}</small>
                      {fos.parent_mobile && (
                        <div><small className="text-muted">{fos.parent_mobile}</small></div>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(fos.status)}</td>
                  <td>{fos.last_login_display}</td>
                  <td>{new Date(fos.created_at).toLocaleDateString()}</td>
                  
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

      {/* FOS Form Modal */}
      <FOSFormModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        onSave={handleModalSubmit}
        userRole={userRole}
        userData={selectedUser}
        mode={modalMode}
      />
    </Container>
  );
};

export default FOS;