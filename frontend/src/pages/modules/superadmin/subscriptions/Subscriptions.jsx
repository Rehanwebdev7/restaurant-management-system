import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Form, Row, Col, Modal, Spinner, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import superadminService from '../../../../services/superadminService';
import { getCurrentTheme, getContrastColor } from '../../../../services/themeService';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import '../../../../styles/tables.css';

const theme = getCurrentTheme();
const primaryColor = theme.primary || '#6366f1';
const primaryContrast = getContrastColor(primaryColor);

const statusColors = { active: 'success', expired: 'secondary', cancelled: 'danger', suspended: 'warning', grace: 'info', pending: 'light' };

const Subscriptions = () => {
  const { isDarkMode } = useDarkMode();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, totalPages: 0 });

  // Assign Modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ user_id: '', plan_id: '', coupon_code: '', start_date: '', payment_reference: '', notes: '' });
  const [plans, setPlans] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [couponValid, setCouponValid] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Grace Modal
  const [showGrace, setShowGrace] = useState(false);
  const [graceSubId, setGraceSubId] = useState(null);
  const [graceDays, setGraceDays] = useState(2);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    const result = await superadminService.subscriptions.getAll({ search, status: statusFilter, pageNumber: pagination.page, pageSize: pagination.size });
    if (result.success) {
      const d = result.success.data.data;
      setSubs(d.content || []);
      setPagination(p => ({ ...p, total: d.totalElements, totalPages: d.totalPages }));
    } else { toast.error(result.fail); }
    setLoading(false);
  }, [search, statusFilter, pagination.page, pagination.size]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const openAssign = async () => {
    setAssignForm({ user_id: '', plan_id: '', coupon_code: '', start_date: new Date().toISOString().split('T')[0], payment_reference: '', notes: '' });
    setCouponValid(null);
    setShowAssign(true);
    // Load plans and restaurants
    const [plansRes, restaurantsRes] = await Promise.all([
      superadminService.subscriptionPlans.getAll({ pageSize: 100 }),
      superadminService.userDirectory.getAll({ role_id: '1', page: 1, limit: 500 })
    ]);
    if (plansRes.success) {
      const planData = plansRes.success.data.data.content || [];
      setPlans(planData.map(p => p.plan || p));
    }
    if (restaurantsRes.success) {
      setRestaurants(restaurantsRes.success.data.data?.data || []);
    }
  };

  const validateCoupon = async () => {
    if (!assignForm.coupon_code) return;
    const result = await superadminService.coupons.validate(assignForm.coupon_code, assignForm.plan_id);
    if (result.success) {
      const d = result.success.data.data;
      setCouponValid(d);
      if (!d.valid) toast.warning(d.message);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.user_id || !assignForm.plan_id) { toast.error('User and plan are required'); return; }
    setSubmitting(true);
    const result = await superadminService.subscriptions.assign(assignForm);
    if (result.success) {
      toast.success('Subscription assigned');
      setShowAssign(false);
      fetchSubs();
    } else { toast.error(result.fail); }
    setSubmitting(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this subscription?')) return;
    const result = await superadminService.subscriptions.cancel(id);
    if (result.success) { toast.success('Subscription cancelled'); fetchSubs(); }
    else toast.error(result.fail);
  };

  const handleGrace = async () => {
    setSubmitting(true);
    const result = await superadminService.subscriptions.grantGrace(graceSubId, graceDays);
    if (result.success) { toast.success('Grace period granted'); setShowGrace(false); fetchSubs(); }
    else toast.error(result.fail);
    setSubmitting(false);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{ color: isDarkMode ? '#f8fafc' : primaryColor, fontWeight: '700' }}>
          <i className="bi bi-credit-card me-2"></i>Subscriptions
        </h2>
        <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={openAssign}>
          <i className="bi bi-plus-lg me-1"></i>Assign
        </Button>
      </div>

      <Card
        className="border-0 shadow-sm mb-4"
        style={{
          borderRadius: '16px',
          background: isDarkMode ? 'rgba(15, 15, 25, 0.96)' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
        }}
      >
        <Card.Body className="py-3">
          <Row className="g-3">
            <Col md={4}><Form.Control placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></Col>
            <Col md={3}>
              <Form.Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 0 })); }}>
                <option value="">All Status</option>
                {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card
        className="border-0 shadow-sm"
        style={{
          borderRadius: '16px',
          background: isDarkMode ? 'rgba(15, 15, 25, 0.96)' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
        }}
      >
        <Card.Body className="p-0">
          {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
            <>
              <Table hover responsive className="modern-table mb-0">
                <thead style={{ background: 'var(--theme-primary)' }}>
                  <tr><th>Restaurant</th><th>Plan</th><th>Period</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {subs.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No subscriptions found</td></tr>
                  ) : subs.map(s => (
                    <tr key={s.subscriptionId}>
                      <td><div className="fw-semibold">{s.user?.hospitalName || s.user?.name}</div><div className="text-muted small">{s.user?.name || s.user?.email}</div></td>
                      <td>{s.plan?.planName}</td>
                      <td><div className="small">{s.startDate} to {s.endDate}</div>{s.graceEndDate && <div className="small text-info">Grace: {s.graceEndDate}</div>}</td>
                      <td>
                        <div className="fw-bold">${Number(s.amountPaid).toLocaleString()}</div>
                        {s.discountAmount > 0 && <div className="small text-success">-${Number(s.discountAmount).toLocaleString()}</div>}
                      </td>
                      <td><Badge bg={statusColors[s.status] || 'secondary'} text={s.status === 'pending' ? 'dark' : undefined}>{s.status}</Badge></td>
                      <td>
                        <div className="d-flex gap-1">
                          {s.status === 'active' && <Button size="sm" variant="outline-info" onClick={() => { setGraceSubId(s.subscriptionId); setGraceDays(2); setShowGrace(true); }} title="Grant Grace"><i className="bi bi-hourglass"></i></Button>}
                          {s.status !== 'cancelled' && <Button size="sm" variant="outline-danger" onClick={() => handleCancel(s.subscriptionId)} title="Cancel"><i className="bi bi-x-lg"></i></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center py-3">
                  <Pagination size="sm">
                    <Pagination.Prev disabled={pagination.page === 0} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} />
                    {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => (
                      <Pagination.Item key={i} active={i === pagination.page} onClick={() => setPagination(p => ({ ...p, page: i }))}>{i + 1}</Pagination.Item>
                    ))}
                    <Pagination.Next disabled={pagination.page >= pagination.totalPages - 1} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Assign Modal */}
      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Assign Subscription</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group><Form.Label>Restaurant *</Form.Label>
                <Form.Select value={assignForm.user_id} onChange={e => setAssignForm(f => ({ ...f, user_id: e.target.value }))}>
                  <option value="">Select restaurant...</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.user_id} value={restaurant.user_id}>
                      {restaurant.hospital_name || restaurant.full_name}
                      {restaurant.full_name && restaurant.hospital_name && restaurant.full_name !== restaurant.hospital_name
                        ? ` (${restaurant.full_name})`
                        : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group><Form.Label>Plan *</Form.Label>
                <Form.Select value={assignForm.plan_id} onChange={e => setAssignForm(f => ({ ...f, plan_id: e.target.value }))}>
                  <option value="">Select plan...</option>
                  {plans.map(p => <option key={p.planId} value={p.planId}>{p.planName} - ${p.price} ({p.durationDays}d)</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group><Form.Label>Coupon Code</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control value={assignForm.coupon_code} onChange={e => { setAssignForm(f => ({ ...f, coupon_code: e.target.value.toUpperCase() })); setCouponValid(null); }} placeholder="Optional" />
                  <Button variant="outline-primary" onClick={validateCoupon} disabled={!assignForm.coupon_code}>Validate</Button>
                </div>
                {couponValid && <div className={`small mt-1 ${couponValid.valid ? 'text-success' : 'text-danger'}`}>{couponValid.message}</div>}
              </Form.Group>
            </Col>
            <Col md={6}><Form.Group><Form.Label>Start Date</Form.Label><Form.Control type="date" value={assignForm.start_date} onChange={e => setAssignForm(f => ({ ...f, start_date: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Payment Reference</Form.Label><Form.Control value={assignForm.payment_reference} onChange={e => setAssignForm(f => ({ ...f, payment_reference: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Notes</Form.Label><Form.Control value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} /></Form.Group></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleAssign} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : 'Assign'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Grace Modal */}
      <Modal show={showGrace} onHide={() => setShowGrace(false)} centered>
        <Modal.Header closeButton><Modal.Title>Grant Grace Period</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group><Form.Label>Grace Days (1-365)</Form.Label>
            <Form.Control type="number" min={1} max={365} value={graceDays} onChange={e => setGraceDays(parseInt(e.target.value) || 2)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGrace(false)}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleGrace} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : 'Grant Grace'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Subscriptions;
