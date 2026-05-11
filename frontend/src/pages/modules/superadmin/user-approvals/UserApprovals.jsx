import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Form, Row, Col, Modal, Spinner, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import superadminService from '../../../../services/superadminService';
import { getCurrentTheme, getContrastColor } from '../../../../services/themeService';

const theme = getCurrentTheme();
const primaryColor = theme.primary || '#6366f1';
const primaryContrast = getContrastColor(primaryColor);

const approvalTone = (status) => {
  const tones = {
    approved: { bg: '#10b98118', color: '#10b981', label: 'Approved' },
    pending: { bg: '#f59e0b18', color: '#f59e0b', label: 'Pending' },
    rejected: { bg: '#ef444418', color: '#ef4444', label: 'Rejected' },
  };
  return tones[status] || tones.pending;
};

const UserApprovals = () => {
  const emptyEditForm = {
    name: '',
    email: '',
    mobile: '',
    hospitalName: '',
    hospitalType: '',
    einNumber: '',
    city: '',
    state: '',
    zipCode: ''
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, totalPages: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await superadminService.userApprovals.getAll({
      search, approvalStatus: approvalFilter, pageNumber: pagination.page, pageSize: pagination.size
    });
    if (result.success) {
      const d = result.success.data.data;
      setUsers(d.content || []);
      setPendingCount(d.pendingCount || 0);
      setPagination(p => ({ ...p, total: d.totalElements, totalPages: d.totalPages }));
    } else {
      toast.error(result.fail);
    }
    setLoading(false);
  }, [search, approvalFilter, pagination.page, pagination.size]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleApprove = async (status) => {
    setSubmitting(true);
    const result = await superadminService.userApprovals.update(selectedUser.id, {
      approval_status: status, approval_notes: approvalNotes
    });
    if (result.success) {
      toast.success(`User ${status} successfully`);
      setShowApproveModal(false);
      fetchUsers();
    } else {
      toast.error(result.fail);
    }
    setSubmitting(false);
  };

  const handleEdit = async () => {
    setSubmitting(true);
    const result = await superadminService.userApprovals.update(selectedUser.id, editForm);
    if (result.success) {
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } else {
      toast.error(result.fail);
    }
    setSubmitting(false);
  };

  const handleImpersonate = async (user) => {
    if (!window.confirm(`Impersonate ${user.name}? This action is logged.`)) return;
    const result = await superadminService.userApprovals.impersonate(user.id);
    if (result.success) {
      const d = result.success.data.data;
      localStorage.setItem('sa_original_token', localStorage.getItem('authToken'));
      localStorage.setItem('sa_original_role', localStorage.getItem('UserRole'));
      localStorage.setItem('authToken', d.token);
      localStorage.setItem('UserRole', d.userType);
      localStorage.setItem('UserName', d.name);
      toast.info(`Impersonating ${d.name} (2hr session)`);
      window.location.href = '/';
    } else {
      toast.error(result.fail);
    }
  };

  const openApproveModal = (user) => { setSelectedUser(user); setApprovalNotes(''); setShowApproveModal(true); };
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      hospitalName: user.hospitalName || '',
      hospitalType: user.hospitalType || '',
      einNumber: user.gstNumber || user.einNumber || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.pincode || user.zipCode || ''
    });
    setShowEditModal(true);
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4 p-4 text-white" style={{ borderRadius: '16px', background: 'var(--theme-primary)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bi bi-person-check me-2"></i>User Approvals
            </h4>
            <p className="mb-0 opacity-75" style={{ fontSize: '14px' }}>
              Review pending signups, edit details, and approve access from one place
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center', minWidth: '96px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{pendingCount}</div>
            <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Card.Body className="py-3">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Control
                placeholder="Search by name, email, mobile..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 0 })); }}
                style={{ minHeight: '46px', borderRadius: '12px' }}
              />
            </Col>
            <Col md={3}>
              <Form.Select
                value={approvalFilter}
                onChange={e => { setApprovalFilter(e.target.value); setPagination(p => ({ ...p, page: 0 })); }}
                style={{ minHeight: '46px', borderRadius: '12px' }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Approval List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner style={{ color: primaryColor }} />
          <div className="text-muted mt-2" style={{ fontSize: '13px' }}>Loading approvals...</div>
        </div>
      ) : users.length === 0 ? (
        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Body className="text-center py-5">
            <i className="bi bi-person-x" style={{ fontSize: 56, color: '#cbd5e1' }}></i>
            <div className="mt-3" style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>No users found</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Try adjusting your search or approval filter</div>
          </Card.Body>
        </Card>
      ) : (
        <div>
          {users.map((u) => {
            const tone = approvalTone(u.approvalStatus);
            return (
              <div
                key={u.id}
                style={{
                  marginBottom: '12px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
                  padding: '18px 20px',
                }}
              >
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-start gap-3 flex-grow-1">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        background: 'var(--theme-primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(u.name || 'U').charAt(0).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{u.name}</span>
                        <span
                          className="d-inline-flex align-items-center gap-1"
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: tone.bg,
                            color: tone.color,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
                          {tone.label}
                        </span>
                        {u.isActive && (
                          <span style={{ fontSize: '11px', color: '#10b981', background: '#10b98118', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
                            Active
                          </span>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: '13px', color: '#64748b' }}>
                        {u.mobile && <span><i className="bi bi-phone me-1"></i>{u.mobile}</span>}
                        {u.email && <span><i className="bi bi-envelope me-1"></i>{u.email}</span>}
                        {u.hospitalName && <span><i className="bi bi-shop me-1"></i>{u.hospitalName}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                    {u.approvalStatus !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => openApproveModal(u)}
                        style={{ background: '#10b981', borderColor: '#10b981', borderRadius: '999px', paddingInline: '14px' }}
                      >
                        <i className="bi bi-check2-circle me-1"></i>Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => openEditModal(u)}
                      style={{ borderRadius: '999px', paddingInline: '14px' }}
                    >
                      <i className="bi bi-pencil-square me-1"></i>Edit
                    </Button>
                    {u.approvalStatus === 'approved' && u.isActive && (
                      <Button
                        size="sm"
                        variant="outline-warning"
                        onClick={() => handleImpersonate(u)}
                        style={{ borderRadius: '999px', paddingInline: '14px' }}
                      >
                        <i className="bi bi-person-badge me-1"></i>Impersonate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

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
        </div>
      )}

      {/* Approve/Reject Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Review: {selectedUser?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control as="textarea" rows={3} value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} placeholder="Add approval/rejection notes..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => handleApprove('rejected')} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : <><i className="bi bi-x-lg me-1"></i>Reject</>}
          </Button>
          <Button variant="success" onClick={() => handleApprove('approved')} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : <><i className="bi bi-check-lg me-1"></i>Approve</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Edit: {selectedUser?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            {Object.entries(editForm).map(([key, val]) => (
              <Col md={6} key={key}>
                <Form.Group>
                  <Form.Label className="small text-capitalize">{key.replace(/_/g, ' ')}</Form.Label>
                  <Form.Control value={val} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </Form.Group>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleEdit} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserApprovals;
