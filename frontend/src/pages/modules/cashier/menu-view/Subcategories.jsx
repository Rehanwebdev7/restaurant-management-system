import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Spinner, Form, Row, Col, InputGroup, Pagination } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import '../../../../styles/tables.css';
import { useTheme } from '../../../../contexts/ThemeContext';

const Subcategories = () => {
  const { primaryColor } = useTheme();
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubcategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchSubcategories();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      const result = await ApiGet('/api/cashier/menu_category/filter', { pageNumber: 0, pageSize: 100 });
      if (result.success) {
        const data = result.success.data?.data || result.success.data || {};
        setCategories(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };
      if (searchTerm.trim()) {
        params.searchValue = searchTerm.trim();
      }
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      const result = await ApiGet('/api/cashier/menu_subcategory/filter', params);
      if (result.success) {
        const data = result.success.data?.data || result.success.data || {};
        setSubcategories(data.records || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      toast.error('Failed to fetch subcategories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-diagram-3 me-2"></i>
          Subcategories
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
              placeholder="Search subcategories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            style={{ height: '42px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={7} />
            ) : subcategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  <i className="bi bi-diagram-3 me-2"></i>
                  No subcategories found
                </td>
              </tr>
            ) : (
              subcategories.map((sub) => (
                <tr key={sub.id}>
                  <td><strong>{sub.id}</strong></td>
                  <td>
                    {sub.iconUrl ? (
                      <img src={sub.iconUrl} alt={sub.name} width={40} height={40} className="rounded" style={{ objectFit: 'cover' }} />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>{sub.name || 'N/A'}</td>
                  <td><Badge bg="secondary">{sub.categoryId?.name || 'N/A'}</Badge></td>
                  <td>{sub.priority || 0}</td>
                  <td>
                    <Badge bg={sub.isActive ? 'success' : 'danger'}>
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}</td>
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
    </Container>
  );
};

export default Subcategories;
