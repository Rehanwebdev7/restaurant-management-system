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

const SubscriptionPlans = () => {
  const { isDarkMode } = useDarkMode();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ planName: '', description: '', price: '', durationDays: 30, maxBranch: '', maxKitchen: '', maxDeliveryBoy: '', features: '', isActive: true, sortOrder: 0 });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const result = await superadminService.subscriptionPlans.getAll({ search, pageNumber: pagination.page, pageSize: pagination.size });
    if (result.success) {
      const d = result.success.data.data;
      setPlans(d.content || []);
      setPagination(p => ({ ...p, total: d.totalElements, totalPages: d.totalPages }));
    } else {
      toast.error(result.fail);
    }
    setLoading(false);
  }, [search, pagination.page, pagination.size]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ planName: '', description: '', price: '', durationDays: 30, maxBranch: '', maxKitchen: '', maxDeliveryBoy: '', features: '', isActive: true, sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (plan) => {
    const p = plan.plan || plan;
    setEditingPlan(p);
    setForm({
      planName: p.planName || '', description: p.description || '', price: p.price || '',
      durationDays: p.durationDays || 30, maxBranch: p.maxBranch || '', maxKitchen: p.maxKitchen || '',
      maxDeliveryBoy: p.maxDeliveryBoy || '', features: p.features || '', isActive: p.isActive !== false, sortOrder: p.sortOrder || 0
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.planName || !form.price) { toast.error('Name and price are required'); return; }
    setSubmitting(true);
    const payload = { ...form, price: parseFloat(form.price), durationDays: parseInt(form.durationDays),
      maxBranch: form.maxBranch ? parseInt(form.maxBranch) : null, maxKitchen: form.maxKitchen ? parseInt(form.maxKitchen) : null,
      maxDeliveryBoy: form.maxDeliveryBoy ? parseInt(form.maxDeliveryBoy) : null, sortOrder: parseInt(form.sortOrder) || 0 };

    const result = editingPlan
      ? await superadminService.subscriptionPlans.update(editingPlan.planId, payload)
      : await superadminService.subscriptionPlans.create(payload);

    if (result.success) {
      toast.success(editingPlan ? 'Plan updated' : 'Plan created');
      setShowModal(false);
      fetchPlans();
    } else {
      toast.error(result.fail);
    }
    setSubmitting(false);
  };

  const handleDelete = async (plan) => {
    const p = plan.plan || plan;
    if (!window.confirm(`Delete plan "${p.planName}"?`)) return;
    const result = await superadminService.subscriptionPlans.delete(p.planId);
    if (result.success) {
      toast.success('Plan deleted');
      fetchPlans();
    } else {
      toast.error(result.fail);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{ color: primaryColor, fontWeight: '700' }}>
          <i className="bi bi-card-list me-2"></i>Subscription Plans
        </h2>
        <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i>New Plan
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
          <Form.Control placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '400px' }} />
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
            <Table hover responsive className="modern-table mb-0">
              <thead style={{ background: 'var(--theme-primary)' }}>
                <tr><th>Plan Name</th><th>Price</th><th>Duration</th><th>Limits</th><th>Active Subs</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-4 text-muted">No plans found</td></tr>
                ) : plans.map(item => {
                  const p = item.plan || item;
                  return (
                    <tr key={p.planId}>
                      <td><div className="fw-semibold">{p.planName}</div><div className="text-muted small">{p.description?.substring(0, 50)}</div></td>
                      <td className="fw-bold">${Number(p.price).toLocaleString()}</td>
                      <td>{p.durationDays} days</td>
                      <td><div className="small">B:{p.maxBranch || '∞'} K:{p.maxKitchen || '∞'} D:{p.maxDeliveryBoy || '∞'}</div></td>
                      <td><Badge bg="primary">{item.active_subscribers || 0}</Badge></td>
                      <td>{p.isActive ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button size="sm" variant="outline-primary" onClick={() => openEdit(item)}><i className="bi bi-pencil"></i></Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item)}><i className="bi bi-trash"></i></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
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
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header
          closeButton
          style={{
            background: isDarkMode ? 'var(--theme-primary)' : '#ffffff',
            borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'
          }}
        >
          <Modal.Title
            style={{
              color: isDarkMode ? '#ffffff' : '#1e293b',
              fontWeight: 700,
              fontSize: '1.05rem'
            }}
          >
            {editingPlan ? 'Edit Plan' : 'Create Plan'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>Plan Name *</Form.Label><Form.Control value={form.planName} onChange={e => setForm(f => ({ ...f, planName: e.target.value }))} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Price ($) *</Form.Label><Form.Control type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Duration (days)</Form.Label><Form.Control type="number" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))} /></Form.Group></Col>
            <Col md={12}><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Max Branch</Form.Label><Form.Control type="number" value={form.maxBranch} onChange={e => setForm(f => ({ ...f, maxBranch: e.target.value }))} placeholder="Unlimited" /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Max Kitchen</Form.Label><Form.Control type="number" value={form.maxKitchen} onChange={e => setForm(f => ({ ...f, maxKitchen: e.target.value }))} placeholder="Unlimited" /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Max Delivery Boy</Form.Label><Form.Control type="number" value={form.maxDeliveryBoy} onChange={e => setForm(f => ({ ...f, maxDeliveryBoy: e.target.value }))} placeholder="Unlimited" /></Form.Group></Col>
            <Col md={8}><Form.Group><Form.Label>Features (JSON array)</Form.Label><Form.Control value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder='["Feature 1", "Feature 2"]' /></Form.Group></Col>
            <Col md={2}><Form.Group><Form.Label>Sort Order</Form.Label><Form.Control type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} /></Form.Group></Col>
            <Col md={2}><Form.Group><Form.Label>Active</Form.Label><Form.Check type="switch" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} label={form.isActive ? 'Yes' : 'No'} className="mt-2" /></Form.Group></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : (editingPlan ? 'Update' : 'Create')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SubscriptionPlans;
