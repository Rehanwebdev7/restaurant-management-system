import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Button, Form, Spinner, Badge, Row, Col, InputGroup, Table, Modal, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut } from '../../../../../ApiServices/ApiServices';
import apiClient from '../../../../../api/apiClient';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../../contexts/DarkModeContext';
import RestaurantHours from '../../menu-management/RestaurantHours/RestaurantHours';

// ==================== LEVEL CONFIG ====================
const LEVEL_CONFIG = {
  branch: { label: 'Branch', icon: 'bi-shop', color: '#0891b2', bg: '#0891b210' },
  cashier: { label: 'Cashier', icon: 'bi-person-badge', color: '#6366f1', bg: '#6366f110' },
  kitchen: { label: 'Kitchen', icon: 'bi-fire', color: '#ea580c', bg: '#ea580c10' },
  delivery: { label: 'Delivery', icon: 'bi-bicycle', color: '#14b8a6', bg: '#14b8a610' },
};

const ROLE_ORDER = ['cashier', 'kitchen', 'delivery'];

// ==================== ANIMATED COLLAPSE ====================
const AnimatedCollapse = ({ open, children }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
      setTransitioning(true);
    } else {
      // When closing, re-capture current height first so transition works from actual size
      if (contentRef.current) setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
      setTransitioning(true);
    }
  }, [open]);

  // After open animation ends, remove maxHeight constraint so nested content can grow freely
  const handleTransitionEnd = () => {
    setTransitioning(false);
  };

  const style = open && !transitioning
    ? { maxHeight: 'none', overflow: 'visible' }
    : { maxHeight: open ? height + 100 : 0, overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)' };

  return (
    <div style={style} onTransitionEnd={handleTransitionEnd}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

// ==================== USER FORM MODAL (Add/Edit) ====================
const RmsUserFormModal = ({ show, onClose, mode, user, role, branchId, onSaved }) => {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '', isActive: true });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) {
      if (mode === 'edit' && user) {
        setFormData({ name: user.name || user.full_name || '', email: user.email || '', mobile: user.mobile || '', password: '', isActive: user.isActive !== false && user.is_active !== false });
      } else {
        setFormData({ name: '', email: '', mobile: '', password: '', isActive: true });
      }
      setErrors({});
    }
  }, [show, mode, user]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(formData.mobile.trim())) e.mobile = 'Must be 10 digits';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
    if (mode === 'add' && !formData.password.trim()) e.password = 'Password is required';
    else if (formData.password && formData.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        mobile: formData.mobile.trim(),
        role,
        isActive: formData.isActive,
        branchId: { id: branchId },
      };
      if (formData.password.trim()) payload.password = formData.password.trim();

      let result;
      if (mode === 'add') {
        result = await ApiPost('/api/restaurant/users/add', payload);
      } else {
        payload.id = user.id;
        result = await ApiPut('/api/restaurant/users/update', payload);
      }
      if (result.success) {
        toast.success(`User ${mode === 'add' ? 'added' : 'updated'} successfully`);
        onSaved();
        onClose();
      } else {
        toast.error(result.fail || 'Failed to save user');
      }
    } catch { toast.error('Failed to save user'); }
    setSaving(false);
  };

  const rc = LEVEL_CONFIG[role] || LEVEL_CONFIG.cashier;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton style={{ background: `${rc.color}08`, borderBottom: `2px solid ${rc.color}30` }}>
        <Modal.Title style={{ fontSize: '16px', fontWeight: 700 }}>
          <i className={`bi ${mode === 'add' ? 'bi-person-plus' : 'bi-pencil-square'} me-2`} style={{ color: rc.color }}></i>
          {mode === 'add' ? `Add ${rc.label}` : `Edit ${rc.label}`}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Name <span className="text-danger">*</span></Form.Label>
                <Form.Control size="sm" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} isInvalid={!!errors.name} placeholder="Full name" />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Mobile <span className="text-danger">*</span></Form.Label>
                <Form.Control size="sm" value={formData.mobile} onChange={e => setFormData(p => ({ ...p, mobile: e.target.value }))} isInvalid={!!errors.mobile} placeholder="10-digit number" maxLength={10} />
                <Form.Control.Feedback type="invalid">{errors.mobile}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Email</Form.Label>
                <Form.Control size="sm" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} isInvalid={!!errors.email} placeholder="Optional" />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Password {mode === 'add' && <span className="text-danger">*</span>}
                </Form.Label>
                <Form.Control size="sm" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} isInvalid={!!errors.password} placeholder={mode === 'edit' ? 'Leave empty to keep current' : 'Min 6 chars'} />
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Check type="switch" label="Active" checked={formData.isActive} onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} style={{ fontSize: '13px' }} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e2e8f0', padding: '10px 16px' }}>
          <Button variant="light" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" size="sm" disabled={saving} style={{ background: rc.color, border: 'none' }}>
            {saving ? <><Spinner size="sm" className="me-1" />Saving...</> : mode === 'add' ? 'Add User' : 'Update'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// ==================== SET PASSWORD MODAL ====================
const SetPasswordModal = ({ show, onClose, user }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (show) { setPassword(''); setConfirm(''); setError(''); } }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      const result = await ApiPut('/api/restaurant/users/update', { id: user.id, password: password.trim() });
      if (result.success) {
        toast.success(`Password set for ${user.name || user.full_name}`);
        onClose();
      } else {
        setError(result.fail || 'Failed to set password');
      }
    } catch { setError('Failed to set password'); }
    setSaving(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '15px', fontWeight: 700 }}>
          <i className="bi bi-key me-2" style={{ color: '#f59e0b' }}></i>Set Password
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Setting password for <strong>{user?.name || user?.full_name}</strong> (ID: {user?.id})
          </div>
          {error && <Alert variant="danger" style={{ fontSize: '12px', padding: '8px 12px' }}>{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>New Password <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Min 6 characters" />
          </Form.Group>
          <Form.Group>
            <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>Confirm Password <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} placeholder="Re-enter password" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e2e8f0', padding: '10px 16px' }}>
          <Button variant="light" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" size="sm" variant="warning" disabled={saving}>
            {saving ? <><Spinner size="sm" className="me-1" />Setting...</> : 'Set Password'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// ==================== USER ROW ====================
const UserRow = ({ user, index, roleConfig, onEdit, onSetPassword }) => {
  const initial = (user.name || user.full_name || '?').charAt(0).toUpperCase();
  const isActive = user.isActive !== false && user.is_active !== false;

  return (
    <div className="user-row-hover bt-user-row">
      <span className="bt-user-index">{index + 1}</span>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${roleConfig.color}20, ${roleConfig.color}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: roleConfig.color, flexShrink: 0 }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="bt-user-name">{user.name || user.full_name || '—'}</div>
        <div className="d-flex align-items-center gap-3 bt-user-meta">
          {user.email && <span><i className="bi bi-envelope me-1"></i>{user.email}</span>}
          {user.mobile && <span><i className="bi bi-phone me-1"></i>{user.mobile}</span>}
        </div>
      </div>
      <span className="bt-id-badge">ID: {user.id}</span>
      <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '10px', background: isActive ? '#10b98118' : '#6b728018', color: isActive ? '#10b981' : '#6b7280' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>{isActive ? 'Active' : 'Inactive'}
      </span>
      <div className="d-flex gap-1" style={{ flexShrink: 0 }}>
        <button onClick={(e) => { e.stopPropagation(); onEdit?.(user); }} title="Edit User" style={{ width: 28, height: 28, borderRadius: '6px', border: '1px solid var(--bt-border)', background: 'var(--bt-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '12px', transition: 'all 0.15s ease' }} className="user-action-btn">
          <i className="bi bi-pencil"></i>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onSetPassword?.(user); }} title="Set Password" style={{ width: 28, height: 28, borderRadius: '6px', border: '1px solid var(--bt-border)', background: 'var(--bt-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '12px', transition: 'all 0.15s ease' }} className="user-action-btn">
          <i className="bi bi-key"></i>
        </button>
      </div>
    </div>
  );
};

// ==================== ROLE GROUP ====================
const RoleGroup = ({ role, users, primaryColor, onAddUser, onEditUser, onSetPassword }) => {
  const [expanded, setExpanded] = useState(true);
  const rc = LEVEL_CONFIG[role] || { label: role, icon: 'bi-person', color: '#64748b', bg: '#64748b10' };

  return (
    <div className="bt-role-group" style={{ marginBottom: '6px', marginLeft: '20px', borderRadius: '10px', border: `1px solid ${rc.color}25`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', cursor: 'pointer', background: expanded ? `${rc.color}08` : 'transparent', transition: 'background 0.2s ease', gap: '10px', userSelect: 'none' }} className="role-header-row">
        <div onClick={() => setExpanded(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}>
          <i className={`bi bi-chevron-${expanded ? 'down' : 'right'}`} style={{ fontSize: '11px', color: expanded ? rc.color : '#94a3b8', minWidth: '12px' }}></i>
          <div style={{ width: 28, height: 28, borderRadius: '8px', background: expanded ? `linear-gradient(135deg, ${rc.color}, ${primaryColor})` : rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`bi ${rc.icon}`} style={{ fontSize: '13px', color: expanded ? '#fff' : rc.color }}></i>
          </div>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--bt-text)', flex: 1 }}>{rc.label}</span>
        </div>
        <Badge pill bg="none" style={{ fontSize: '11px', fontWeight: 600, background: `${rc.color}15`, color: rc.color }}>{users.length}</Badge>
        <button onClick={(e) => { e.stopPropagation(); onAddUser?.(role); }} title={`Add ${rc.label}`} style={{ width: 26, height: 26, borderRadius: '6px', border: `1.5px solid ${rc.color}40`, background: `${rc.color}08`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc.color, fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
          <i className="bi bi-plus"></i>
        </button>
      </div>
      <AnimatedCollapse open={expanded}>
        <div style={{ borderTop: `1px solid ${rc.color}15` }}>
          {users.length === 0 ? (
            <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--bt-text-muted)', textAlign: 'center' }}>No {rc.label.toLowerCase()} users yet</div>
          ) : users.map((user, i) => <UserRow key={user.id} user={user} index={i} roleConfig={rc} onEdit={onEditUser} onSetPassword={onSetPassword} />)}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== SECTION CARD ====================
const SectionCard = ({ icon, iconColor, iconBg, title, subtitle, badge, actionLabel, actionIcon, onAction, children, expanded, onToggle, primaryColor }) => {
  return (
    <div style={{ borderRadius: '12px', border: expanded ? `1.5px solid ${iconColor || primaryColor}30` : '1px solid var(--bt-border)', background: 'var(--bt-surface)', marginBottom: '8px', overflow: 'hidden', transition: 'all 0.2s ease' }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: '14px', userSelect: 'none', background: expanded ? `${iconColor || primaryColor}08` : 'var(--bt-surface)', transition: 'background 0.2s ease' }}
        className="section-card-header"
      >
        <div style={{ width: 38, height: 38, borderRadius: '10px', background: iconBg || `${iconColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bi ${icon}`} style={{ fontSize: '17px', color: iconColor || primaryColor }}></i>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--bt-text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '12px', color: 'var(--bt-text-muted)', marginTop: '1px' }}>{subtitle}</div>}
        </div>
        {badge}
        <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: '14px', color: 'var(--bt-text-muted)', transition: 'transform 0.2s' }}></i>
      </div>
      <AnimatedCollapse open={expanded}>
        <div style={{ borderTop: '1px solid var(--bt-border-soft)', padding: '16px 18px' }}>
          {children}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== BRANCH PROFILE SECTION ====================
const BranchProfileSection = ({ branch, primaryColor, onBranchUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', password: '', branchIsActive: true,
    address: '', alternatePhone: '', latitude: '', longitude: '', isActive: true,
  });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id]);

  const fetchProfile = async () => {
    setLoading(true);
    setFormData({
      name: branch.name || '', email: branch.email || '', mobile: branch.mobile || '',
      password: '', branchIsActive: branch.isActive ?? true,
      address: '', alternatePhone: '', latitude: '', longitude: '', isActive: true,
    });

    try {
      const result = await ApiGet('/api/restaurant/users_profile/branchId', { id: branch.id });
      if (result.success) {
        const data = result.success.data.data || [];
        if (data.length > 0) {
          const profile = data[0];
          setFormData(prev => ({
            ...prev,
            address: profile.address || '',
            alternatePhone: profile.alternatePhone || '',
            latitude: profile.latitude || '',
            longitude: profile.longitude || '',
            isActive: profile.isActive ?? true,
          }));
        }
      }
    } catch (err) {
      // Profile may not exist yet - that's okay
    }
    setLoading(false);
    setHasChanges(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  // Location search
  useEffect(() => {
    if (!locationQuery.trim()) { setLocationSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const response = await apiClient.get(`/api/public/customer/search?q=${encodeURIComponent(locationQuery.trim())}`);
        setLocationSuggestions(Array.isArray(response.data) ? response.data : []);
      } catch { setLocationSuggestions([]); }
      finally { setLocationSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleSelectLocation = async (placeId, title) => {
    setLocationQuery(''); setLocationSuggestions([]);
    try {
      const response = await apiClient.get(`/api/public/customer/details?placeId=${placeId}`);
      const { lat, lng, address } = response.data || {};
      setFormData(prev => ({
        ...prev,
        latitude: lat ? String(lat) : prev.latitude,
        longitude: lng ? String(lng) : prev.longitude,
        address: address || title || prev.address,
      }));
      setHasChanges(true);
    } catch { toast.error('Failed to get location details'); }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) { toast.error('Name is required'); return; }
    if (!formData.mobile?.trim()) { toast.error('Mobile is required'); return; }

    setSaving(true);
    try {
      // 1. Update branch user info
      const branchPayload = {
        id: branch.id, name: formData.name.trim(),
        email: formData.email.trim() || null, mobile: formData.mobile.trim(),
        role: 'branch', isActive: formData.branchIsActive,
      };
      if (formData.password?.trim()) branchPayload.password = formData.password.trim();

      const branchResult = await ApiPut('/api/restaurant/users/update', branchPayload);
      if (!branchResult.success) { toast.error(branchResult.fail || 'Failed to update branch'); setSaving(false); return; }

      // 2. Update profile info
      const profilePayload = {
        branchId: { id: branch.id },
        address: formData.address, phone: formData.mobile,
        alternatePhone: formData.alternatePhone,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        isActive: formData.isActive,
      };

      const result = await ApiPost('/api/restaurant/users_profile/add-update', profilePayload);
      if (result.success) {
        toast.success('Profile updated successfully');
        setHasChanges(false);
        if (onBranchUpdated) onBranchUpdated();
      } else {
        toast.error(result.fail || 'Failed to update profile');
      }
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-3"><Spinner size="sm" style={{ color: primaryColor }} /><div className="text-muted mt-1" style={{ fontSize: '12px' }}>Loading profile...</div></div>;

  return (
    <div>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Branch Name <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter branch name" />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Mobile <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" type="text" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Enter mobile" maxLength={10} />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Email</Form.Label>
            <Form.Control size="sm" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Password</Form.Label>
            <Form.Control size="sm" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" autoComplete="new-password" />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Alternate Phone</Form.Label>
            <Form.Control size="sm" type="text" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} placeholder="Alternate phone" maxLength={10} />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Status</Form.Label>
            <Form.Check
              type="switch" id={`branchActive-${branch.id}`}
              label={formData.branchIsActive ? 'Active' : 'Inactive'}
              checked={formData.branchIsActive}
              onChange={(e) => { setFormData(prev => ({ ...prev, branchIsActive: e.target.checked })); setHasChanges(true); }}
              className="mt-1"
            />
          </Form.Group>
        </Col>
      </Row>

      <div style={{ borderTop: '1px solid var(--bt-border-soft)', margin: '4px 0 12px', paddingTop: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--bt-text-muted)', marginBottom: '8px' }}>
          <i className="bi bi-geo-alt me-1"></i>Location & Address
        </div>
        <Row>
          <Col md={8}>
            <Form.Group className="mb-3" style={{ position: 'relative' }}>
              <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Search Location</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control type="text" value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="Search to auto-fill address & coordinates..." autoComplete="off" />
                {locationQuery && (
                  <Button variant="outline-secondary" size="sm" onClick={() => { setLocationQuery(''); setLocationSuggestions([]); }}>
                    <i className="bi bi-x-lg"></i>
                  </Button>
                )}
              </InputGroup>
              {locationSuggestions.length > 0 && (
                <div style={{ position: 'absolute', zIndex: 1050, width: '100%', maxHeight: '180px', overflowY: 'auto', backgroundColor: 'var(--bt-surface)', border: '1px solid var(--bt-dropdown-border)', borderRadius: '0 0 6px 6px', boxShadow: 'var(--bt-dropdown-shadow)' }}>
                  {locationSuggestions.map((item, idx) => (
                    <div key={idx} onClick={() => handleSelectLocation(item.place_id, item.entity_title)} style={{ padding: '8px 12px', cursor: 'pointer', borderTop: idx > 0 ? '1px solid #f0f0f0' : 'none', fontSize: '0.82rem' }} className="location-suggestion-row">
                      <i className="bi bi-geo-alt text-danger me-2"></i>
                      <strong>{item.entity_title}</strong>
                      {item.entity_subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--bt-text-muted)', marginLeft: '20px' }}>{item.entity_subtitle}</div>}
                    </div>
                  ))}
                </div>
              )}
              {locationSearching && <small className="text-muted mt-1">Searching...</small>}
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Latitude</Form.Label>
              <Form.Control size="sm" type="text" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="Lat" />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Longitude</Form.Label>
              <Form.Control size="sm" type="text" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="Lng" />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Address</Form.Label>
              <Form.Control size="sm" as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} placeholder="Enter branch address" />
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-2">
        {hasChanges && <Badge bg="warning" className="py-2 px-3 align-self-center"><i className="bi bi-exclamation-triangle me-1"></i>Unsaved changes</Badge>}
        <Button size="sm" variant="outline-secondary" onClick={fetchProfile} disabled={saving}><i className="bi bi-arrow-clockwise me-1"></i>Reset</Button>
        <Button size="sm" style={{ backgroundColor: primaryColor, borderColor: primaryColor }} onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? <><Spinner size="sm" className="me-1" style={{ width: 14, height: 14 }} />Saving...</> : <><i className="bi bi-check-lg me-1"></i>Save Profile</>}
        </Button>
      </div>
    </div>
  );
};

// ==================== DELIVERY ZONES SECTION ====================
const DeliveryZonesSection = ({ branch, primaryColor }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zones, setZones] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id]);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/restaurant/delivery_zones/branchId', { id: branch.id, pageNumber: 0, pageSize: 10000 });
      if (result.success) {
        setZones((result.success.data.data || []).map(z => ({ ...z, _modified: false, _isNew: false })));
      } else {
        setZones([]);
      }
    } catch { setZones([]); }
    setLoading(false);
    setHasChanges(false);
  };

  const handleChange = (index, field, value) => {
    setZones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, _modified: true };
      return updated;
    });
    setHasChanges(true);
  };

  const addZone = () => {
    setZones(prev => [...prev, { zoneName: '', description: '', radiusKmFrom: 0, radiusKmTo: 5, deliveryCharge: 0, isActive: true, _modified: true, _isNew: true }]);
    setHasChanges(true);
  };

  const removeZone = (index) => {
    const zone = zones[index];
    if (zone._isNew) {
      setZones(prev => prev.filter((_, i) => i !== index));
    } else {
      handleChange(index, 'isActive', false);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    const errors = [];
    zones.forEach((zone, i) => {
      if (!zone.zoneName?.trim()) errors.push(`Zone ${i + 1}: Name required`);
      if (parseFloat(zone.radiusKmFrom) > parseFloat(zone.radiusKmTo)) errors.push(`Zone ${i + 1}: From > To`);
    });
    if (errors.length > 0) { errors.forEach(e => toast.error(e)); return; }

    const modified = zones.filter(z => z._modified);
    if (modified.length === 0) { toast.info('No changes'); return; }

    setSaving(true);
    try {
      const payload = modified.map(z => ({
        ...(z.id && { id: z.id }),
        branchId: { id: parseInt(branch.id) },
        zoneName: z.zoneName?.trim(), description: z.description?.trim() || '',
        radiusKmFrom: parseFloat(z.radiusKmFrom) || 0, radiusKmTo: parseFloat(z.radiusKmTo) || 0,
        deliveryCharge: parseFloat(z.deliveryCharge) || 0, isActive: z.isActive,
      }));

      const result = await ApiPost('/api/restaurant/delivery_zones/bulkUpdate', payload);
      if (result.success) {
        toast.success(`${modified.length} zone(s) saved`);
        fetchZones();
      } else {
        toast.error(result.fail || 'Failed to save');
      }
    } catch { toast.error('Failed to save delivery zones'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-3"><Spinner size="sm" style={{ color: primaryColor }} /><div className="text-muted mt-1" style={{ fontSize: '12px' }}>Loading zones...</div></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">Total: {zones.length} | Active: {zones.filter(z => z.isActive).length}</small>
        <Button variant="outline-success" size="sm" onClick={addZone} disabled={saving}>
          <i className="bi bi-plus-lg me-1"></i>Add Zone
        </Button>
      </div>
      {hasChanges && <Badge bg="warning" className="mb-2 py-1 px-2" style={{ fontSize: '11px' }}><i className="bi bi-exclamation-triangle me-1"></i>Unsaved changes</Badge>}

      <div className="table-responsive">
        <Table bordered hover size="sm" style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
          <thead style={{ background: 'var(--bt-surface-alt)' }}>
            <tr>
              <th style={{ width: '36px' }}>#</th>
              <th>Zone Name <span className="text-danger">*</span></th>
              <th>Description</th>
              <th style={{ width: '90px' }}>From (KM)</th>
              <th style={{ width: '90px' }}>To (KM)</th>
              <th style={{ width: '100px' }}>Charge</th>
              <th style={{ width: '60px' }}>Active</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {zones.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-3 text-muted" style={{ fontSize: '12px' }}><i className="bi bi-geo-alt me-1"></i>No delivery zones. Click "Add Zone" to create one.</td></tr>
            ) : zones.map((zone, index) => (
              <tr key={zone.id || `new-${index}`} style={{ backgroundColor: zone._modified ? 'var(--bt-warning-bg)' : 'inherit', opacity: zone.isActive === false ? 0.5 : 1 }}>
                <td className="align-middle">
                  <strong>{index + 1}</strong>
                  {zone._isNew && <Badge bg="success" className="ms-1" style={{ fontSize: '0.55rem' }}>New</Badge>}
                </td>
                <td><Form.Control type="text" size="sm" value={zone.zoneName || ''} onChange={(e) => handleChange(index, 'zoneName', e.target.value)} placeholder="Zone name" disabled={!zone.isActive} style={{ fontSize: '0.82rem' }} /></td>
                <td><Form.Control type="text" size="sm" value={zone.description || ''} onChange={(e) => handleChange(index, 'description', e.target.value)} placeholder="Description" disabled={!zone.isActive} style={{ fontSize: '0.82rem' }} /></td>
                <td><Form.Control type="number" size="sm" step="0.1" min="0" value={zone.radiusKmFrom ?? 0} onChange={(e) => handleChange(index, 'radiusKmFrom', e.target.value)} disabled={!zone.isActive} style={{ fontSize: '0.82rem' }} /></td>
                <td><Form.Control type="number" size="sm" step="0.1" min="0" value={zone.radiusKmTo ?? 0} onChange={(e) => handleChange(index, 'radiusKmTo', e.target.value)} disabled={!zone.isActive} style={{ fontSize: '0.82rem' }} /></td>
                <td><Form.Control type="number" size="sm" step="0.01" min="0" value={zone.deliveryCharge ?? 0} onChange={(e) => handleChange(index, 'deliveryCharge', e.target.value)} disabled={!zone.isActive} style={{ fontSize: '0.82rem' }} /></td>
                <td className="text-center align-middle"><Form.Check type="switch" checked={zone.isActive ?? true} onChange={(e) => handleChange(index, 'isActive', e.target.checked)} /></td>
                <td className="text-center align-middle"><Button variant="outline-danger" size="sm" onClick={() => removeZone(index)} title={zone._isNew ? 'Remove' : 'Deactivate'} style={{ padding: '2px 6px' }}><i className={`bi bi-${zone._isNew ? 'x-lg' : 'trash'}`} style={{ fontSize: '12px' }}></i></Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <Button size="sm" style={{ backgroundColor: primaryColor, borderColor: primaryColor }} onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? <><Spinner size="sm" className="me-1" style={{ width: 14, height: 14 }} />Saving...</> : <><i className="bi bi-check-all me-1"></i>Save All Changes</>}
        </Button>
      </div>
    </div>
  );
};

// ==================== ORDER CONTROL SECTION ====================
const OrderControlSection = ({ branch, primaryColor }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await ApiGet(`/api/admin/restaurant_branch/branch-status/${branch.id}`);
      if (result.success) setStatus(result.success.data.data);
    } catch { /* silent */ }
    setLoading(false);
  }, [branch.id]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleStop = async () => {
    setStopping(true);
    try {
      const result = await ApiPost(`/api/admin/restaurant_branch/stop-orders/${branch.id}`);
      if (result.success) { toast.success('Orders stopped'); setShowConfirm(false); fetchStatus(); }
      else toast.error(result.fail || 'Failed');
    } catch { toast.error('Failed to stop orders'); }
    finally { setStopping(false); }
  };

  const handleResume = async () => {
    setResuming(true);
    try {
      const result = await ApiPost(`/api/admin/restaurant_branch/resume-orders/${branch.id}`);
      if (result.success) { toast.success('Orders resumed'); fetchStatus(); }
      else toast.error(result.fail || 'Failed');
    } catch { toast.error('Failed to resume orders'); }
    finally { setResuming(false); }
  };

  if (loading) return <div className="text-center py-2"><Spinner size="sm" style={{ color: primaryColor }} /></div>;

  const isAccepting = status?.acceptingOrders;
  const isStopped = status?.status === 'STOPPED';
  const isClosed = status?.status === 'CLOSED';

  return (
    <div>
      {/* Status display */}
      <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: isAccepting ? '#10b981' : isStopped ? '#ef4444' : '#f59e0b', display: 'inline-block', boxShadow: isAccepting ? '0 0 8px #10b98180' : isStopped ? '0 0 8px #ef444480' : 'none' }}></span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: isAccepting ? '#10b981' : isStopped ? '#ef4444' : '#f59e0b' }}>
            {isAccepting ? 'Accepting Orders' : isStopped ? 'Orders Stopped' : 'Closed'}
          </span>
        </div>
        {status?.openingTime && (
          <span style={{ fontSize: '12px', color: 'var(--bt-text-muted)', background: 'var(--bt-chip)', padding: '3px 10px', borderRadius: '6px' }}>
            <i className="bi bi-clock me-1"></i>{status.openingTime} – {status.closingTime}
            {status.orderCutoffTime && <span className="ms-1">(cutoff {status.orderCutoffTime})</span>}
          </span>
        )}
        {status?.nextOpenTime && !isAccepting && (
          <span style={{ fontSize: '12px', color: 'var(--bt-text-muted)', background: 'var(--bt-chip)', padding: '3px 10px', borderRadius: '6px' }}>
            <i className="bi bi-calendar-event me-1"></i>Reopens: {status.nextOpenTime} {status.nextOpenDay}
          </span>
        )}
      </div>

      {/* Message */}
      {status?.message && (
        <div style={{ fontSize: '13px', color: 'var(--bt-text-muted)', marginBottom: '12px', padding: '8px 12px', background: 'var(--bt-surface-alt)', borderRadius: '8px', border: '1px solid var(--bt-border)' }}>
          {status.message}
        </div>
      )}

      {/* Action buttons */}
      <div className="d-flex gap-2 flex-wrap">
        {isStopped ? (
          <Button size="sm" variant="success" onClick={handleResume} disabled={resuming} style={{ borderRadius: '8px' }}>
            {resuming ? <><Spinner size="sm" className="me-1" style={{ width: 14, height: 14 }} />Resuming...</> : <><i className="bi bi-play-fill me-1"></i>Resume Orders</>}
          </Button>
        ) : (
          <>
            {!showConfirm ? (
              <Button size="sm" variant="outline-danger" onClick={() => setShowConfirm(true)} style={{ borderRadius: '8px' }}>
                <i className="bi bi-stop-fill me-1"></i>Stop Taking Orders
              </Button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bt-danger-bg)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--bt-danger-border)' }}>
                <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>Are you sure?</span>
                <Button size="sm" variant="danger" onClick={handleStop} disabled={stopping} style={{ borderRadius: '6px', fontSize: '12px' }}>
                  {stopping ? <Spinner size="sm" style={{ width: 12, height: 12 }} /> : 'Yes, Stop'}
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setShowConfirm(false)} style={{ borderRadius: '6px', fontSize: '12px' }}>Cancel</Button>
              </div>
            )}
          </>
        )}
        <Button size="sm" variant="outline-secondary" onClick={fetchStatus} style={{ borderRadius: '8px' }}>
          <i className="bi bi-arrow-clockwise"></i>
        </Button>
      </div>

      {isStopped && (
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
          <i className="bi bi-info-circle me-1"></i>Orders will auto-resume tomorrow at opening time.
        </div>
      )}
    </div>
  );
};


// ==================== BRANCH TAB BAR ====================
const BranchTabBar = ({ activeTab, onTabChange, primaryColor }) => {
  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'bi-grid' },
    { key: 'users', label: 'Users', icon: 'bi-people' },
    { key: 'hours', label: 'Operating Hours', icon: 'bi-clock' },
  ];
  return (
    <div style={{ display: 'flex', gap: '2px', padding: '8px 16px 0', borderBottom: '1px solid var(--bt-border)', background: 'var(--bt-tab-strip)' }}>
      {tabs.map(tab => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              border: 'none', background: active ? 'var(--bt-active-tab)' : 'transparent',
              borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 500,
              color: active ? primaryColor : 'var(--bt-text-muted)', borderBottom: active ? `2px solid ${primaryColor}` : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <i className={`bi ${tab.icon}`} style={{ fontSize: '14px' }}></i>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// ==================== BRANCH ACCORDION ITEM ====================
const BranchAccordionItem = ({ branch, isExpanded, onToggle, primaryColor, onBranchUpdated }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Section expand states for overview tab
  const [expandedSections, setExpandedSections] = useState({ profile: false, zones: false, orderControl: true });
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // User modal states
  const [userModal, setUserModal] = useState({ show: false, mode: 'add', user: null, role: 'cashier' });
  const [passwordModal, setPasswordModal] = useState({ show: false, user: null });

  const fetchUsers = useCallback(async (force = false) => {
    if (loaded && !force) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        ROLE_ORDER.map(role => ApiGet('/api/restaurant/users/filter', { role, pageNumber: 0, pageSize: 500 }))
      );
      const allUsers = [];
      results.forEach(result => {
        if (result.success) {
          const records = result.success.data.data.records || [];
          allUsers.push(...records.filter(u => u.branchId?.id === branch.id));
        }
      });
      setUsers(allUsers);
    } catch (err) {
      toast.error('Failed to load users');
    }
    setLoaded(true); setLoading(false);
  }, [branch.id, loaded]);

  const handleToggle = () => { if (!isExpanded) fetchUsers(); onToggle(branch.id); };
  const bc = LEVEL_CONFIG.branch;

  const groupedByRole = {};
  ROLE_ORDER.forEach(r => { groupedByRole[r] = []; });
  users.forEach(u => {
    const role = (u.role || '').toLowerCase();
    if (groupedByRole[role]) groupedByRole[role].push(u);
    else {
      if (!groupedByRole[role]) groupedByRole[role] = [];
      groupedByRole[role].push(u);
    }
  });

  const totalUsers = users.length;
  const isActive = branch.isActive !== false && branch.is_active !== false;

  return (
    <div className="bt-branch-card" style={{ marginBottom: '8px', borderRadius: '12px', border: isExpanded ? `1.5px solid ${bc.color}` : '1px solid var(--bt-border)', background: 'var(--bt-surface)', transition: 'all 0.25s ease', boxShadow: isExpanded ? `0 4px 20px ${bc.color}18` : 'var(--bt-card-shadow)' }}>
      {/* Branch Header */}
      <div onClick={handleToggle} className="branch-header-row" style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderRadius: isExpanded ? '12px 12px 0 0' : '12px', background: isExpanded ? 'var(--bt-surface-expanded)' : 'var(--bt-surface)', transition: 'background 0.25s ease', gap: '16px', userSelect: 'none' }}>
        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '14px', color: isExpanded ? bc.color : 'var(--bt-text-faint)', minWidth: '16px' }}></i>
        <div style={{ width: 40, height: 40, borderRadius: '10px', background: isExpanded ? `linear-gradient(135deg, ${bc.color}, #6366f1)` : 'var(--bt-chip)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: isExpanded ? '#fff' : 'var(--bt-text-muted)', transition: 'all 0.25s ease', flexShrink: 0 }}>
          {(branch.name || branch.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--bt-text)' }}>{branch.name || branch.full_name}</span>
            <span style={{ fontSize: '11px', color: 'var(--bt-text-muted)', background: 'var(--bt-chip)', padding: '1px 8px', borderRadius: '4px' }}>ID: {branch.id}</span>
            <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '11px', fontWeight: 500, padding: '1px 8px', borderRadius: '10px', background: isActive ? '#10b98118' : '#6b728018', color: isActive ? '#10b981' : '#6b7280' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>{isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: '12px', color: 'var(--bt-text-muted)' }}>
            {branch.mobile && <span><i className="bi bi-phone me-1"></i>{branch.mobile}</span>}
            {branch.email && <span><i className="bi bi-envelope me-1"></i>{branch.email}</span>}
          </div>
        </div>
        {/* Role count badges */}
        <div className="d-none d-md-flex align-items-center gap-2">
          {loaded && ROLE_ORDER.map(role => {
            const rc = LEVEL_CONFIG[role];
            const count = groupedByRole[role]?.length || 0;
            if (count === 0) return null;
            return (
              <span key={role} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: rc.bg, color: rc.color }}>
                <i className={`bi ${rc.icon}`} style={{ fontSize: '10px' }}></i> {count}
              </span>
            );
          })}
        </div>
        <div style={{ background: 'var(--bt-chip)', borderRadius: '8px', padding: '4px 10px', textAlign: 'center', minWidth: '48px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bt-text)', lineHeight: 1 }}>{loaded ? totalUsers : '—'}</div>
          <div style={{ fontSize: '9px', color: 'var(--bt-text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Users</div>
        </div>
      </div>

      {/* Expanded content with tabs */}
      <AnimatedCollapse open={isExpanded}>
        <div style={{ borderTop: '1px solid var(--bt-border)' }}>
          <BranchTabBar activeTab={activeTab} onTabChange={setActiveTab} primaryColor={primaryColor} />

          {/* Overview Tab — central control panel */}
          {activeTab === 'overview' && (
            <div style={{ padding: '16px' }}>
              {/* Order Control — always visible at top */}
              <SectionCard
                icon="bi-power" iconColor="#ef4444" iconBg="#fef2f2"
                title="Order Control" subtitle="Stop or resume accepting orders"
                expanded={expandedSections.orderControl} onToggle={() => toggleSection('orderControl')} primaryColor={primaryColor}
              >
                <OrderControlSection branch={branch} primaryColor={primaryColor} />
              </SectionCard>

              {/* Branch Profile */}
              <SectionCard
                icon="bi-building" iconColor="#6366f1" iconBg="#eef2ff"
                title="Branch Profile" subtitle="Name, contact, address, location"
                expanded={expandedSections.profile} onToggle={() => toggleSection('profile')} primaryColor={primaryColor}
              >
                <BranchProfileSection branch={branch} primaryColor={primaryColor} onBranchUpdated={onBranchUpdated} />
              </SectionCard>

              {/* Delivery Zones */}
              <SectionCard
                icon="bi-geo-alt" iconColor="#14b8a6" iconBg="#f0fdfa"
                title="Delivery Zones" subtitle="Manage delivery areas and charges"
                expanded={expandedSections.zones} onToggle={() => toggleSection('zones')} primaryColor={primaryColor}
              >
                <DeliveryZonesSection branch={branch} primaryColor={primaryColor} />
              </SectionCard>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              {loading ? (
                <div className="text-center py-4"><Spinner size="sm" style={{ color: bc.color }} /><div className="text-muted mt-2" style={{ fontSize: '12px' }}>Loading users...</div></div>
              ) : (
                <div style={{ padding: '8px 8px 8px 0' }}>
                  {Object.entries(groupedByRole).map(([role, roleUsers]) => (
                    <RoleGroup
                      key={role} role={role} users={roleUsers} primaryColor={primaryColor}
                      onAddUser={(r) => setUserModal({ show: true, mode: 'add', user: null, role: r })}
                      onEditUser={(u) => setUserModal({ show: true, mode: 'edit', user: u, role: (u.role || '').toLowerCase() })}
                      onSetPassword={(u) => setPasswordModal({ show: true, user: u })}
                    />
                  ))}
                </div>
              )}
              {/* User Form Modal */}
              <RmsUserFormModal
                show={userModal.show}
                onClose={() => setUserModal(p => ({ ...p, show: false }))}
                mode={userModal.mode}
                user={userModal.user}
                role={userModal.role}
                branchId={branch.id}
                onSaved={() => fetchUsers(true)}
              />
              {/* Set Password Modal */}
              <SetPasswordModal
                show={passwordModal.show}
                onClose={() => setPasswordModal({ show: false, user: null })}
                user={passwordModal.user}
              />
            </>
          )}

          {/* Operating Hours Tab */}
          {activeTab === 'hours' && (
            <div style={{ padding: '16px' }}>
              <RestaurantHours
                embedded
                branchIdProp={branch.id}
                restaurantIdProp={branch.parentId?.id || localStorage.getItem('UserId')}
                branchNameProp={branch.name || branch.full_name}
              />
            </div>
          )}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const BranchTree = () => {
  const { primaryColor } = useTheme();
  const { isDarkMode } = useDarkMode();
  const pc = primaryColor || '#6366f1';
  const branchTreeVars = {
    '--bt-surface': isDarkMode ? '#0f172a' : '#ffffff',
    '--bt-surface-alt': isDarkMode ? '#111827' : '#f8fafc',
    '--bt-surface-hover': isDarkMode ? '#1e293b' : '#f8fafc',
    '--bt-surface-expanded': isDarkMode ? 'linear-gradient(135deg, rgba(8,145,178,0.18), rgba(99,102,241,0.16))' : 'linear-gradient(135deg, #f0fdfa, #eff6ff)',
    '--bt-border': isDarkMode ? '#334155' : '#e2e8f0',
    '--bt-border-soft': isDarkMode ? '#1e293b' : '#f1f5f9',
    '--bt-text': isDarkMode ? '#f8fafc' : '#1e293b',
    '--bt-text-muted': isDarkMode ? '#cbd5e1' : '#64748b',
    '--bt-text-faint': isDarkMode ? '#94a3b8' : '#94a3b8',
    '--bt-chip': isDarkMode ? '#1e293b' : '#f1f5f9',
    '--bt-dropdown-border': isDarkMode ? '#334155' : '#ddd',
    '--bt-dropdown-shadow': isDarkMode ? '0 10px 24px rgba(2,6,23,0.48)' : '0 4px 12px rgba(0,0,0,0.15)',
    '--bt-tab-strip': isDarkMode ? '#111827' : '#fafbfc',
    '--bt-active-tab': isDarkMode ? '#0f172a' : '#ffffff',
    '--bt-warning-bg': isDarkMode ? 'rgba(245, 158, 11, 0.14)' : '#fffbeb',
    '--bt-danger-bg': isDarkMode ? 'rgba(127, 29, 29, 0.35)' : '#fef2f2',
    '--bt-danger-border': isDarkMode ? '#7f1d1d' : '#fecaca',
    '--bt-card-shadow': isDarkMode ? '0 1px 3px rgba(2,6,23,0.4)' : '0 1px 3px rgba(0,0,0,0.04)',
  };

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedBranchId, setExpandedBranchId] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    const result = await ApiGet('/api/restaurant/users/filter', { role: 'branch', pageNumber: 0, pageSize: 200 });
    if (result.success) setBranches(result.success.data.data.records || []);
    else toast.error(result.fail || 'Failed to load branches');
    setLoading(false);
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const filtered = debouncedSearch
    ? branches.filter(b => [b.name, b.full_name, b.email, b.mobile].some(f => (f || '').toLowerCase().includes(debouncedSearch.toLowerCase())))
    : branches;

  return (
    <Container fluid className="py-4" style={branchTreeVars}>
      {/* Header Banner */}
      <div className="mb-4 p-4 text-white" style={{ borderRadius: '16px', background: `linear-gradient(135deg, ${pc}, #6366f1, #a855f7)` }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1"><i className="bi bi-diagram-3 me-2"></i>Branch Control Panel</h4>
            <p className="mb-0 opacity-75" style={{ fontSize: '14px' }}>Manage profiles, delivery zones, operating hours, users, and order control for each branch</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{branches.length}</div>
            <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Branches</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-search text-muted"></i>
            <Form.Control type="text" placeholder="Search branches by name, email, or mobile..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', boxShadow: 'none', fontSize: '14px' }} />
            {search && <Button variant="link" className="p-0 text-muted" onClick={() => setSearch('')} style={{ fontSize: '18px' }}><i className="bi bi-x-circle"></i></Button>}
          </div>
        </Card.Body>
      </Card>

      {/* Branch Accordion Tree */}
      {loading ? (
        <div className="text-center py-5"><Spinner style={{ color: pc }} /><div className="text-muted mt-2" style={{ fontSize: '13px' }}>Loading branches...</div></div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Body className="text-center py-5">
            <i className="bi bi-shop" style={{ fontSize: 56, color: '#cbd5e1' }}></i>
            <div className="mt-3" style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>No branches found</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{search ? 'Try adjusting your search' : 'Add branches in User Management first'}</div>
          </Card.Body>
        </Card>
      ) : (
        <div>
          {filtered.map(branch => (
            <BranchAccordionItem
              key={branch.id}
              branch={branch}
              isExpanded={expandedBranchId === branch.id}
              onToggle={id => setExpandedBranchId(prev => prev === id ? null : id)}
              primaryColor={pc}
              onBranchUpdated={fetchBranches}
            />
          ))}
        </div>
      )}

      <style>{`
        .branch-header-row:hover { background: var(--bt-surface-hover) !important; }
        .role-header-row:hover { background: var(--bt-surface-hover) !important; }
        .user-row-hover:hover { background: var(--bt-surface-hover) !important; }
        .section-card-header:hover { background: var(--bt-surface-hover) !important; }
        .location-suggestion-row { color: var(--bt-text); }
        .location-suggestion-row:hover { background: var(--bt-surface-hover) !important; }
        .user-action-btn:hover {
          background: var(--bt-surface-hover) !important;
          border-color: var(--bt-border) !important;
        }
      `}</style>
    </Container>
  );
};

export default BranchTree;
