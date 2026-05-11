import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Form, Row, Col, Modal, Spinner, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import superadminService from '../../../../services/superadminService';

const primaryColor = '#6366f1';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, totalPages: 0 });

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageData, setUsageData] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = { code: '', description: '', discountType: 'percentage', discountValue: '', maxUses: '', minPlanPrice: '0',
    applicablePlanIds: '', applicableUserIds: '', validFrom: '', validUntil: '', isActive: true, isGlobal: true };
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const params = { search, pageNumber: pagination.page, pageSize: pagination.size };
    if (activeFilter !== '') params.isActive = activeFilter === 'true';
    if (typeFilter) params.discountType = typeFilter;
    const result = await superadminService.coupons.getAll(params);
    if (result.success) {
      const d = result.success.data.data;
      setCoupons(d.content || []);
      setPagination(p => ({ ...p, total: d.totalElements, totalPages: d.totalPages }));
    } else { toast.error(result.fail); }
    setLoading(false);
  }, [search, activeFilter, typeFilter, pagination.page, pagination.size]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => { setEditingCoupon(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code, description: coupon.description || '', discountType: coupon.discountType,
      discountValue: coupon.discountValue, maxUses: coupon.maxUses || '', minPlanPrice: coupon.minPlanPrice || '0',
      applicablePlanIds: coupon.applicablePlanIds || '', applicableUserIds: coupon.applicableUserIds || '',
      validFrom: coupon.validFrom || '', validUntil: coupon.validUntil || '',
      isActive: coupon.isActive !== false, isGlobal: coupon.isGlobal !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.code || !form.discountValue) { toast.error('Code and discount value are required'); return; }
    setSubmitting(true);
    const payload = { ...form, discountValue: parseFloat(form.discountValue),
      maxUses: form.maxUses ? parseInt(form.maxUses) : null, minPlanPrice: parseFloat(form.minPlanPrice) || 0 };

    const result = editingCoupon
      ? await superadminService.coupons.update(editingCoupon.couponId, payload)
      : await superadminService.coupons.create(payload);

    if (result.success) {
      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
      setShowModal(false); fetchCoupons();
    } else { toast.error(result.fail); }
    setSubmitting(false);
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    const result = await superadminService.coupons.delete(coupon.couponId);
    if (result.success) { toast.success('Coupon deleted'); fetchCoupons(); }
    else toast.error(result.fail);
  };

  const viewUsage = async (couponId) => {
    const result = await superadminService.coupons.getUsage(couponId);
    if (result.success) { setUsageData(result.success.data.data || []); setShowUsageModal(true); }
    else toast.error(result.fail);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{ color: primaryColor, fontWeight: '700' }}>
          <i className="bi bi-tag me-2"></i>Coupons
        </h2>
        <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor }} onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i>New Coupon
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <Card.Body className="py-3">
          <Row className="g-3">
            <Col md={4}><Form.Control placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></Col>
            <Col md={2}>
              <Form.Select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
                <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">All Types</option><option value="percentage">Percentage</option><option value="fixed">Fixed</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Body className="p-0">
          {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
            <Table hover responsive className="mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr><th>Code</th><th>Discount</th><th>Usage</th><th>Valid Period</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">No coupons found</td></tr>
                ) : coupons.map(c => (
                  <tr key={c.couponId}>
                    <td><span className="fw-bold" style={{ color: primaryColor }}>{c.code}</span>
                      {c.isGlobal && <Badge bg="info" className="ms-1">Global</Badge>}
                      <div className="text-muted small">{c.description?.substring(0, 40)}</div></td>
                    <td className="fw-bold">{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                    <td>{c.usedCount}/{c.maxUses || '∞'}</td>
                    <td className="small">{c.validFrom || '-'} to {c.validUntil || '-'}</td>
                    <td>{c.isActive ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button size="sm" variant="outline-info" onClick={() => viewUsage(c.couponId)} title="Usage"><i className="bi bi-eye"></i></Button>
                        <Button size="sm" variant="outline-primary" onClick={() => openEdit(c)}><i className="bi bi-pencil"></i></Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c)}><i className="bi bi-trash"></i></Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        <Modal.Header closeButton><Modal.Title>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}><Form.Group><Form.Label>Code *</Form.Label><Form.Control value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Discount Type</Form.Label><Form.Select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
              <option value="percentage">Percentage</option><option value="fixed">Fixed</option>
            </Form.Select></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Discount Value *</Form.Label><Form.Control type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} /></Form.Group></Col>
            <Col md={12}><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Max Uses</Form.Label><Form.Control type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Valid From</Form.Label><Form.Control type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Valid Until</Form.Label><Form.Control type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Min Plan Price</Form.Label><Form.Control type="number" value={form.minPlanPrice} onChange={e => setForm(f => ({ ...f, minPlanPrice: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Check type="switch" label="Global" checked={form.isGlobal} onChange={e => setForm(f => ({ ...f, isGlobal: e.target.checked }))} className="mt-4" /></Col>
            <Col md={4}><Form.Check type="switch" label="Active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="mt-4" /></Col>
            {!form.isGlobal && (
              <>
                <Col md={6}><Form.Group><Form.Label>Applicable Plan IDs (JSON)</Form.Label><Form.Control value={form.applicablePlanIds} onChange={e => setForm(f => ({ ...f, applicablePlanIds: e.target.value }))} placeholder="[1,2,3]" /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Applicable User IDs (JSON)</Form.Label><Form.Control value={form.applicableUserIds} onChange={e => setForm(f => ({ ...f, applicableUserIds: e.target.value }))} placeholder="[10,20]" /></Form.Group></Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : (editingCoupon ? 'Update' : 'Create')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Usage Modal */}
      <Modal show={showUsageModal} onHide={() => setShowUsageModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Coupon Usage</Modal.Title></Modal.Header>
        <Modal.Body>
          {usageData.length === 0 ? <div className="text-center text-muted py-3">No usage records</div> : (
            <Table size="sm" hover>
              <thead><tr><th>User</th><th>Discount</th><th>Date</th></tr></thead>
              <tbody>
                {usageData.map((u, i) => (
                  <tr key={i}>
                    <td>{u.user?.name || 'Unknown'}</td>
                    <td>${u.discountApplied}</td>
                    <td className="small">{u.usedAt ? new Date(u.usedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Coupons;
