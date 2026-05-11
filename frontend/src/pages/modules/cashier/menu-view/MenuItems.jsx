import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Spinner, Form, Row, Col, Button } from 'react-bootstrap';
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

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/cashier/menu/items');
      if (result.success) {
        setMenuItems(result.success.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await ApiGet('/api/cashier/menu/categories');
      if (result.success) {
        setCategories(result.success.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
                <TableSkeletonLoader rows={10} columns={7} />
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
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
          <small className="text-muted">
            Total Items: <strong>{filteredItems.length}</strong>
          </small>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default MenuItems;
