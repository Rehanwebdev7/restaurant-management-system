import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Modal, Spinner, Pagination, Badge, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../contexts/AuthContext';
import superadminService from '../../../../services/superadminService';
import AddRestaurantModal from './AddRestaurantModal';

const primaryColor = '#3B82F6';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [actionType, setActionType] = useState('');

  const { impersonateUser } = useAuth();

  const fetchRestaurants = async (page = 0) => {
    setLoading(true);
    try {
      const result = await superadminService.restaurants.getAll({
        page,
        size: 10,
        search,
        status: statusFilter || null
      });

      if (result.success) {
        const data = result.success.data.data;
        setRestaurants(data.records || []);
        setPagination({
          page: data.page || 0,
          size: data.size || 10,
          total: data.totalRecords || 0,
          totalPages: data.totalPages || 1
        });
      } else {
        toast.error(result.fail || 'Failed to load restaurants');
      }
    } catch (error) {
      toast.error('Error loading restaurants');
    }
    setLoading(false);
  };

  useEffect(() => { fetchRestaurants(0); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants(0);
  };

  const handleAction = (restaurant, action) => {
    setSelectedRestaurant(restaurant);
    setActionType(action);
    if (action === 'loginAs') {
      handleLoginAs(restaurant);
    } else {
      setShowModal(true);
    }
  };

  const handleLoginAs = async (restaurant) => {
    try {
      const userData = {
        id: restaurant.id,
        email: restaurant.email,
        mobile: restaurant.mobile,
        name: restaurant.name,
        role: 'restaurant'
      };
      const token = localStorage.getItem('authToken');
      impersonateUser(userData, token);
      toast.success(`Logged in as ${restaurant.name}`);
    } catch (error) {
      toast.error('Failed to impersonate restaurant');
    }
  };

  const handleSuspend = async () => {
    if (!selectedRestaurant) return;
    try {
      const newStatus = selectedRestaurant.isActive ? 'suspended' : 'active';
      const result = await superadminService.restaurants.update(selectedRestaurant.id, { status: newStatus });

      if (result.success) {
        toast.success(`Restaurant ${newStatus === 'suspended' ? 'suspended' : 'activated'}`);
        setShowModal(false);
        fetchRestaurants(pagination.page);
      } else {
        toast.error(result.fail || 'Failed to update restaurant');
      }
    } catch (error) {
      toast.error('Error updating restaurant');
    }
  };

  const handleAddNew = () => setShowAddModal(true);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 px-3" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h2 className="mb-0" style={{ color: '#1f2937', fontWeight: '700', fontSize: '28px' }}>
          <i className="bi bi-shop me-2" style={{ color: primaryColor }}></i>All Restaurants
        </h2>
        <Button variant="primary" size="sm" style={{ backgroundColor: primaryColor, borderColor: primaryColor, fontWeight: '600' }} onClick={handleAddNew}>
          <i className="bi bi-plus-lg me-1"></i>Add New Restaurant
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text style={{ backgroundColor: '#f8fafc', borderColor: '#e5e7eb' }}>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by restaurant name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ borderColor: '#e5e7eb' }}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ borderColor: '#e5e7eb' }}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, borderColor: primaryColor }} className="w-100">
                  <i className="bi bi-search me-1"></i>Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Restaurants Table */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : restaurants.length > 0 ? (
            <>
              <div style={{ overflowX: 'auto' }}>
                <Table hover responsive className="mb-0">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th>ID</th>
                      <th>Restaurant Name</th>
                      <th>Owner</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td><small className="text-muted">{restaurant.id}</small></td>
                        <td>
                          <strong>{restaurant.name}</strong>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{restaurant.email}</div>
                        </td>
                        <td>{restaurant.ownerName || 'N/A'}</td>
                        <td>{restaurant.orderCount || 0}</td>
                        <td><strong>${Number(restaurant.revenue || 0).toLocaleString('en-IN')}</strong></td>
                        <td><Badge bg="info">{restaurant.planName || 'Basic'}</Badge></td>
                        <td>
                          <Badge bg={getStatusColor(restaurant.status || 'active')}>
                            {restaurant.status === 'active' ? '🟢 Active' : restaurant.status === 'pending' ? '🟡 Pending' : '🔴 Suspended'}
                          </Badge>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button variant="outline-secondary" size="sm" title="View Details" onClick={() => handleAction(restaurant, 'view')}>
                              <i className="bi bi-eye"></i>
                            </Button>
                            <Button variant="outline-secondary" size="sm" title="Edit" onClick={() => handleAction(restaurant, 'edit')}>
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button variant="outline-primary" size="sm" title="Login As" onClick={() => handleAction(restaurant, 'loginAs')}>
                              <i className="bi bi-box-arrow-in-right"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title={restaurant.isActive ? 'Suspend' : 'Activate'}
                              onClick={() => handleAction(restaurant, 'suspend')}
                            >
                              <i className={`bi ${restaurant.isActive ? 'bi-pause' : 'bi-play'}`}></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-3 d-flex justify-content-center">
                  <Pagination size="sm">
                    <Pagination.First onClick={() => fetchRestaurants(0)} disabled={pagination.page === 0} />
                    <Pagination.Prev onClick={() => fetchRestaurants(Math.max(0, pagination.page - 1))} disabled={pagination.page === 0} />
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = Math.max(0, pagination.page - 2) + i;
                      if (pageNum >= pagination.totalPages) return null;
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === pagination.page}
                          onClick={() => fetchRestaurants(pageNum)}
                        >
                          {pageNum + 1}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next onClick={() => fetchRestaurants(Math.min(pagination.totalPages - 1, pagination.page + 1))} disabled={pagination.page === pagination.totalPages - 1} />
                    <Pagination.Last onClick={() => fetchRestaurants(pagination.totalPages - 1)} disabled={pagination.page === pagination.totalPages - 1} />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No restaurants found
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Suspend/Activate Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRestaurant && (
            <p>Are you sure you want to {selectedRestaurant.isActive ? 'suspend' : 'activate'} <strong>{selectedRestaurant.name}</strong>?</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleSuspend}>
            {selectedRestaurant?.isActive ? 'Suspend' : 'Activate'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Restaurant - Full Onboarding Modal */}
      <AddRestaurantModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={() => fetchRestaurants(0)}
      />
    </Container>
  );
};

export default Restaurants;
