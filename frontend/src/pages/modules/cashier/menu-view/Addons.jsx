import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Spinner, Form, Row, Col, InputGroup, Pagination, Button, Modal } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import '../../../../styles/tables.css';
import { useTheme } from '../../../../contexts/ThemeContext';

const Addons = () => {
  const { primaryColor } = useTheme();
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewAddonItems, setViewAddonItems] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewAddonName, setViewAddonName] = useState('');

  useEffect(() => {
    fetchAddons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchAddons();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };
      if (searchTerm.trim()) {
        params.searchValue = searchTerm.trim();
      }

      const result = await ApiGet('/api/cashier/addons/filter', params);
      if (result.success) {
        const data = result.success.data?.data || result.success.data || {};
        setAddons(data.records || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      toast.error('Failed to fetch addons');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const handleView = async (addon) => {
    setViewAddonName(addon.name);
    setShowViewModal(true);
    setViewLoading(true);
    setViewAddonItems([]);

    try {
      const result = await ApiGet('/api/cashier/addons_items/addonId', { addonId: addon.id });

      if (result.success) {
        const items = result.success.data?.data || result.success.data || [];
        setViewAddonItems(Array.isArray(items) ? items : []);
      } else {
        toast.error(result.fail || 'Failed to fetch addon items');
      }
    } catch (err) {
      toast.error('Failed to fetch addon items');
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-plus-circle me-2"></i>
          Addons
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
              type="text"
              placeholder="Search addons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
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
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={5} />
            ) : addons.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  <i className="bi bi-plus-circle me-2"></i>
                  No addons found
                </td>
              </tr>
            ) : (
              addons.map((addon) => (
                <tr key={addon.id}>
                  <td>
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => handleView(addon)}
                      disabled={loading}
                      title="View Addon Items"
                    >
                      <i className="bi bi-eye"></i>
                    </Button>
                  </td>
                  <td><strong>{addon.id}</strong></td>
                  <td>{addon.name || 'N/A'}</td>
                  <td>
                    <Badge bg={addon.isActive ? 'success' : 'danger'}>
                      {addon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>{addon.createdAt ? new Date(addon.createdAt).toLocaleDateString() : 'N/A'}</td>
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
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
          <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || totalPages === 0} />
          <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || totalPages === 0} />
          {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, index) => {
            let pageNum;
            if (totalPages <= 5) pageNum = index + 1;
            else if (currentPage <= 3) pageNum = index + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + index;
            else pageNum = currentPage - 2 + index;
            return (
              <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>
                {pageNum}
              </Pagination.Item>
            );
          })}
          <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} />
          <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} />
        </Pagination>
      </div>

      {/* View Addon Items Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-eye me-2" style={{ color: primaryColor }}></i>
            Addon Items - {viewAddonName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <div className="mt-2">Loading addon items...</div>
            </div>
          ) : viewAddonItems.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No addon items found for this addon.
            </div>
          ) : (
            <Table bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Attribute</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {viewAddonItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{index + 1}</td>
                    <td><strong>{item.name || 'N/A'}</strong></td>
                    <td>
                      <Badge bg="success">{formatCurrency(item.price)}</Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">{item.attribute || 'N/A'}</Badge>
                    </td>
                    <td>
                      {item.isActive ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="danger">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Addons;
