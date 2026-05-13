import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Spinner, Form, Row, Col, Button, Pagination } from 'react-bootstrap';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import { useTheme } from '../../../../contexts/ThemeContext';

const MenuItems = () => {
  const { primaryColor } = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [pagination.currentPage, pagination.pageSize, searchTerm, selectedCategory]);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: pagination.currentPage - 1,
        pageSize: pagination.pageSize
      };
      if (searchTerm) params.searchValue = searchTerm;
      if (selectedCategory !== 'all') params.categoryId = selectedCategory;

      const result = await ApiGet('/api/cashier/menu_items/filter', params);
      if (result.success) {
        const data = result.success.data?.data || {};
        setMenuItems(data.records || []);
        setPagination(prev => ({
          ...prev,
          totalRecords: data.totalRecords || 0,
          totalPages: data.totalPages || 0
        }));
      }
    } catch (err) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await ApiGet('/api/cashier/menu_category/all');
      if (result.success) {
        setCategories(result.success.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, pageSize: Number(newSize), currentPage: 1 }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <Container fluid className="py-4">
      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <Card.Header className="bg-white border-0 py-3">
          <Row className="align-items-center g-2">
            <Col md={4}>
              <h5 className="mb-0 fw-bold" style={{ color: primaryColor }}>
                <i className="bi bi-journal-text me-2"></i>
                Menu Items
              </h5>
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Control
                type="search"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Type</th>
                <th>Availability</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader rows={pagination.pageSize} columns={7} />
              ) : menuItems.length > 0 ? (
                menuItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="rounded me-2"
                              style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded bg-light d-flex align-items-center justify-content-center me-2"
                              style={{ width: '45px', height: '45px' }}
                            >
                              <i className="bi bi-image text-muted"></i>
                            </div>
                          )}
                          <div>
                            <div className="fw-semibold">{item.name}</div>
                            {item.description && (
                              <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                                {item.description}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.categoryName || 'N/A'}</td>
                      <td className="fw-bold text-danger">{formatCurrency(item.price)}</td>
                      <td>
                        <Badge bg={item.isVeg ? 'success' : 'danger'}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.isAvailable ? 'success' : 'warning'}>
                          {item.isAvailable ? 'Available' : 'Out of Stock'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.isActive ? 'success' : 'secondary'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-journal-x fs-1 d-block mb-2"></i>
                    No menu items found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        <Card.Footer className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Total Items: <strong>{pagination.totalRecords}</strong>
            </small>
            <div className="d-flex gap-2 align-items-center">
              <Form.Select
                size="sm"
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                style={{ width: '80px' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
              <small className="text-muted">per page</small>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </Button>
              <small className="text-muted">
                Page {pagination.currentPage} of {pagination.totalPages || 1}
              </small>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </Button>
            </div>
          </div>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default MenuItems;
