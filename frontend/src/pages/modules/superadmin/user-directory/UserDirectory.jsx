import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Badge, Button, Form, Spinner, Modal, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import superadminService from '../../../../services/superadminService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDarkMode } from '../../../../contexts/DarkModeContext';

const ROLE_CONFIG = {
  restaurant: { label: 'Restaurant', icon: 'bi-shop', color: '#6366f1', bg: '#6366f110' },
  branch: { label: 'Branch', icon: 'bi-diagram-2', color: '#0891b2', bg: '#0891b210' },
  kitchen: { label: 'Kitchen', icon: 'bi-fire', color: '#ea580c', bg: '#ea580c10' },
  delivery: { label: 'Delivery', icon: 'bi-bicycle', color: '#16a34a', bg: '#16a34a10' },
  cashier: { label: 'Cashier', icon: 'bi-cash-stack', color: '#d97706', bg: '#d9770610' },
};

// ==================== EDIT USER MODAL ====================
const EditUserModal = ({ show, onHide, user, onSave }) => {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ ...user });
  }, [user]);

  if (!user) return null;

  const isAdmin = user.role === 'restaurant' || user.role === 'admin' || !user.role;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { name: form.full_name, email: form.email, mobile: form.mobile };
    if (isAdmin) {
      data.hospital_name = form.hospital_name;
      data.hospital_code = form.hospital_code;
      data.city = form.city;
      data.state = form.state;
      data.pincode = form.pincode;
      data.gst_number = form.gst_number;
    }
    data.is_active = form.is_active;
    const result = await superadminService.userDirectory.updateUser(user.user_id, data);
    if (result.success) {
      toast.success('User updated successfully');
      onSave();
      onHide();
    } else {
      toast.error(result.fail);
    }
    setSaving(false);
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Modal show={show} onHide={onHide} centered size={isAdmin ? 'lg' : 'md'}>
      <Modal.Header closeButton style={{ background: 'var(--theme-primary)', color: '#fff', border: 0 }}>
        <Modal.Title style={{ fontSize: '16px' }}>
          <i className="bi bi-pencil-square me-2"></i>
          Edit {isAdmin ? 'Restaurant' : 'User'} - {user.full_name}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <div className="row g-3">
            <div className={isAdmin ? 'col-md-6' : 'col-12'}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">Full Name</Form.Label>
                <Form.Control size="sm" value={form.full_name || ''} onChange={e => handleChange('full_name', e.target.value)} required />
              </Form.Group>
            </div>
            <div className={isAdmin ? 'col-md-6' : 'col-12'}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">Email</Form.Label>
                <Form.Control size="sm" type="email" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} />
              </Form.Group>
            </div>
            <div className={isAdmin ? 'col-md-6' : 'col-12'}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">Mobile</Form.Label>
                <Form.Control size="sm" value={form.mobile || ''} onChange={e => handleChange('mobile', e.target.value)} />
              </Form.Group>
            </div>
            <div className={isAdmin ? 'col-md-6' : 'col-12'}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">Status</Form.Label>
                <Form.Select size="sm" value={form.is_active ? 'true' : 'false'} onChange={e => handleChange('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Form.Select>
              </Form.Group>
            </div>
            {isAdmin && (
              <>
                <div className="col-12"><hr className="my-1" /><small className="text-muted fw-semibold">Restaurant Details</small></div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">Restaurant Name</Form.Label>
                    <Form.Control size="sm" value={form.hospital_name || ''} onChange={e => handleChange('hospital_name', e.target.value)} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">Restaurant Code</Form.Label>
                    <Form.Control size="sm" value={form.hospital_code || ''} onChange={e => handleChange('hospital_code', e.target.value)} />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">City</Form.Label>
                    <Form.Control size="sm" value={form.city || ''} onChange={e => handleChange('city', e.target.value)} />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">State</Form.Label>
                    <Form.Control size="sm" value={form.state || ''} onChange={e => handleChange('state', e.target.value)} />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">ZIP Code</Form.Label>
                    <Form.Control size="sm" value={form.pincode || ''} onChange={e => handleChange('pincode', e.target.value)} maxLength={5} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted">EIN Number</Form.Label>
                    <Form.Control size="sm" value={form.gst_number || ''} onChange={e => handleChange('gst_number', e.target.value)} placeholder="12-3456789" />
                  </Form.Group>
                </div>
              </>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" size="sm" onClick={onHide}>Cancel</Button>
          <Button type="submit" size="sm" disabled={saving} style={{ background: '#06b6d4', borderColor: '#06b6d4' }}>
            {saving ? <Spinner size="sm" /> : <><i className="bi bi-check-lg me-1"></i>Save Changes</>}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// ==================== ANIMATED COLLAPSE WRAPPER ====================
const AnimatedCollapse = ({ open, children }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [open, children]);

  return (
    <div style={{
      maxHeight: open ? height + 20 : 0,
      overflow: 'hidden',
      transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

// ==================== ADMIN ACCORDION ITEM ====================
const AdminAccordionItem = ({ admin, isExpanded, onToggle, onLogin, onEditUser, index }) => {
  const { isDarkMode } = useDarkMode();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const totalUsers = (admin.branch_count || 0) + (admin.kitchen_count || 0) + (admin.delivery_count || 0) + (admin.cashier_count || 0);

  const fetchDetail = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    const result = await superadminService.userDirectory.getDetail(admin.user_id);
    if (result.success) {
      const d = result.success.data.data;
      // Flatten all roles into one list
      const flat = [];
      const roles = ['restaurant', 'branch', 'kitchen', 'delivery', 'cashier'];
      roles.forEach(role => {
        (d.users?.[role] || []).forEach(u => flat.push({ ...u, role: role }));
      });
      setAllUsers(flat);
      setLoaded(true);
    } else {
      toast.error(result.fail || 'Failed to load details');
    }
    setLoading(false);
  }, [admin.user_id, loaded]);

  const handleToggle = () => {
    if (!isExpanded) fetchDetail();
    onToggle(admin.user_id);
  };

  const roleCounts = {
    branch: admin.branch_count || 0,
    kitchen: admin.kitchen_count || 0,
    delivery: admin.delivery_count || 0,
    cashier: admin.cashier_count || 0,
  };
  const surface = isDarkMode ? '#0f172a' : '#fff';
  const surfaceHover = isDarkMode ? '#1e293b' : '#f8fafc';
  const surfaceExpanded = isDarkMode ? 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(99,102,241,0.16))' : 'linear-gradient(135deg, #f0fdfa, #eff6ff)';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  const chip = isDarkMode ? '#1e293b' : '#f1f5f9';
  const text = isDarkMode ? '#f8fafc' : '#1e293b';
  const muted = isDarkMode ? '#cbd5e1' : '#64748b';
  const faint = isDarkMode ? '#94a3b8' : '#94a3b8';

  return (
    <div style={{
      marginBottom: '8px',
      borderRadius: '12px',
      border: isExpanded ? '1.5px solid #06b6d4' : `1px solid ${border}`,
      background: surface,
      transition: 'all 0.25s ease',
      boxShadow: isExpanded ? '0 4px 20px rgba(6,182,212,0.12)' : (isDarkMode ? '0 1px 3px rgba(2,6,23,0.4)' : '0 1px 3px rgba(0,0,0,0.04)'),
    }}>
      {/* Admin Header Row - Clickable */}
      <div
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 20px',
          cursor: 'pointer',
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
          background: isExpanded ? surfaceExpanded : surface,
          transition: 'background 0.25s ease',
          gap: '16px',
          userSelect: 'none',
        }}
        className="admin-header-row"
      >
        {/* Expand/Collapse chevron */}
        <i
          className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}
          style={{
            fontSize: '14px',
            color: isExpanded ? '#06b6d4' : '#94a3b8',
            transition: 'transform 0.25s ease, color 0.25s ease',
            minWidth: '16px',
          }}
        ></i>

        {/* Admin Avatar */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: isExpanded ? 'var(--theme-primary)' : chip,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 700,
          color: isExpanded ? '#fff' : muted,
          transition: 'all 0.25s ease',
          flexShrink: 0,
        }}>
          {(admin.hospital_name || admin.full_name || '?').charAt(0).toUpperCase()}
        </div>

        {/* Admin Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontWeight: 600, fontSize: '14px', color: text }}>
              {admin.hospital_name || admin.full_name}
            </span>
            <span style={{
              fontSize: '11px',
              color: muted,
              background: chip,
              padding: '1px 8px',
              borderRadius: '4px',
            }}>
              ID: {admin.user_id}
            </span>
            <span className="d-inline-flex align-items-center gap-1" style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '1px 8px',
              borderRadius: '10px',
              background: admin.is_active ? '#10b98118' : '#6b728018',
              color: admin.is_active ? '#10b981' : '#6b7280',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
              {admin.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: '12px', color: muted }}>
            {admin.mobile && <span><i className="bi bi-phone me-1"></i>{admin.mobile}</span>}
            {admin.email && <span><i className="bi bi-envelope me-1"></i>{admin.email}</span>}
            {admin.created_at && (
              <span><i className="bi bi-calendar3 me-1"></i>{new Date(admin.created_at).toLocaleDateString('en-GB')}</span>
            )}
          </div>
        </div>

        {/* User Count Badges */}
        <div className="d-none d-md-flex align-items-center gap-2">
          {Object.entries(roleCounts).map(([role, count]) => count > 0 ? (
            <span key={role} className="d-inline-flex align-items-center gap-1" style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              background: ROLE_CONFIG[role]?.bg || '#f1f5f9',
              color: ROLE_CONFIG[role]?.color || '#64748b',
            }}>
              <i className={`bi ${ROLE_CONFIG[role]?.icon}`} style={{ fontSize: '10px' }}></i>
              {count}
            </span>
          ) : null)}
        </div>

        {/* Total User Count */}
        <div style={{
          background: chip,
          borderRadius: '8px',
          padding: '4px 10px',
          textAlign: 'center',
          minWidth: '48px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: text, lineHeight: 1 }}>{totalUsers}</div>
          <div style={{ fontSize: '9px', color: faint, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Users</div>
        </div>

        {/* View Users Button */}
        <Button
          size="sm"
          className="d-flex align-items-center gap-1 rounded-pill"
          style={{ fontSize: '12px', background: isExpanded ? 'var(--theme-primary)' : chip, border: 'none', color: isExpanded ? '#fff' : (isDarkMode ? '#cbd5e1' : '#475569'), whiteSpace: 'nowrap' }}
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          title={isExpanded ? 'Hide users' : 'View all users'}
        >
          <i className={`bi ${isExpanded ? 'bi-people-fill' : 'bi-people'}`}></i>
          <span className="d-none d-lg-inline">{isExpanded ? 'Hide' : 'View Users'}</span>
        </Button>

        {/* Login Button */}
        <Button
          size="sm"
          variant="outline-primary"
          className="d-flex align-items-center gap-1 rounded-pill"
          style={{ fontSize: '12px', borderColor: '#06b6d4', color: '#06b6d4', whiteSpace: 'nowrap' }}
          onClick={(e) => { e.stopPropagation(); onLogin(admin.user_id); }}
          title="Login as this admin"
        >
          <i className="bi bi-box-arrow-in-right"></i>
          <span className="d-none d-lg-inline">Login</span>
        </Button>
      </div>

      {/* Expanded Children Section */}
      <AnimatedCollapse open={isExpanded}>
        <div style={{ borderTop: `1px solid ${border}` }}>
          {loading ? (
            <div className="text-center py-4">
              <Spinner size="sm" style={{ color: '#06b6d4' }} />
              <div className="text-muted mt-2" style={{ fontSize: '12px' }}>Loading users...</div>
            </div>
          ) : allUsers.length === 0 && loaded ? (
            <div className="text-center py-4" style={{ color: '#94a3b8' }}>
              <i className="bi bi-people" style={{ fontSize: '28px', opacity: 0.4 }}></i>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>No users found under this admin</div>
            </div>
          ) : allUsers.length > 0 ? (
            <Table hover responsive size="sm" className="mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Name', 'Role', 'Contact', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                      color: '#94a3b8', fontWeight: 600, padding: '8px 14px',
                      textAlign: h === 'Actions' ? 'right' : 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u, i) => {
                  const rc = ROLE_CONFIG[u.role] || { label: u.role, icon: 'bi-person', color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <tr key={u.user_id} style={{ transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 500 }}>{i + 1}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{
                            width: 30, height: 30, borderRadius: '8px',
                            background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, color: rc.color, flexShrink: 0,
                          }}>
                            {(u.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.full_name}</div>
                            {u.branch_name && (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                <i className="bi bi-diagram-2 me-1"></i>{u.branch_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="d-inline-flex align-items-center gap-1" style={{
                          fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                          background: rc.bg, color: rc.color,
                        }}>
                          <i className={`bi ${rc.icon}`} style={{ fontSize: '10px' }}></i>
                          {rc.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {u.email && <div style={{ color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>}
                        {u.mobile && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.mobile}</div>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="d-inline-flex align-items-center gap-1" style={{
                          fontSize: '12px', fontWeight: 500, padding: '2px 8px', borderRadius: '10px',
                          background: u.is_active ? '#10b98118' : '#6b728018',
                          color: u.is_active ? '#10b981' : '#6b7280',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div className="d-flex gap-1 justify-content-end">
                          <Button size="sm" variant="link" className="p-0 px-1" style={{ color: '#6366f1', fontSize: '14px' }} title="Edit user" onClick={() => onEditUser(u)}>
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button size="sm" variant="link" className="p-0 px-1" style={{ color: '#06b6d4', fontSize: '14px' }} title="Login as this user" onClick={() => onLogin(u.user_id)}>
                            <i className="bi bi-box-arrow-in-right"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : null}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const UserDirectory = () => {
  const { isDarkMode } = useDarkMode();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const { impersonateUser } = useAuth();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    const result = await superadminService.userDirectory.getTree(debouncedSearch);
    if (result.success) {
      setRestaurants(result.success.data.data || []);
    } else {
      toast.error(result.fail);
    }
    setLoading(false);
  }, [debouncedSearch]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const handleToggle = (adminId) => {
    setExpandedId(prev => prev === adminId ? null : adminId);
  };

  const handleLogin = async (userId) => {
    const result = await superadminService.userDirectory.impersonate(userId);
    if (result.success) {
      const d = result.success.data.data;
      impersonateUser({ role_name: d.userType, full_name: d.name, mobile_number: '' }, d.token);
    } else {
      toast.error(result.fail);
    }
  };

  return (
    <Container fluid className="py-4" style={{ '--theme-surface-hover': isDarkMode ? '#1e293b' : '#f8fafc' }}>
      {/* Header Banner */}
      <div className="mb-4 p-4 text-white" style={{ borderRadius: '16px', background: 'var(--theme-primary)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bi bi-diagram-3 me-2"></i>Restaurant User Tree
            </h4>
            <p className="mb-0 opacity-75" style={{ fontSize: '14px' }}>
              Click on any restaurant to expand and view all mapped users
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '10px',
              padding: '8px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{restaurants.length}</div>
              <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Restaurants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-search text-muted"></i>
            <Form.Control
              type="text"
              placeholder="Search restaurants by name, email, or mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', boxShadow: 'none', fontSize: '14px' }}
            />
            {search && (
              <Button variant="link" className="p-0 text-muted" onClick={() => setSearch('')} style={{ fontSize: '18px' }}>
                <i className="bi bi-x-circle"></i>
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Restaurant Accordion Tree */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner style={{ color: '#06b6d4' }} />
          <div className="text-muted mt-2" style={{ fontSize: '13px' }}>Loading restaurants...</div>
        </div>
      ) : restaurants.length === 0 ? (
        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Body className="text-center py-5">
            <i className="bi bi-shop" style={{ fontSize: 56, color: '#cbd5e1' }}></i>
            <div className="mt-3" style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>No restaurants found</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Try adjusting your search criteria</div>
          </Card.Body>
        </Card>
      ) : (
        <div>
          {restaurants.map((admin, index) => (
            <AdminAccordionItem
              key={admin.user_id}
              admin={admin}
              index={index}
              isExpanded={expandedId === admin.user_id}
              onToggle={handleToggle}
              onLogin={handleLogin}
              onEditUser={setEditUser}
            />
          ))}
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        show={!!editUser}
        onHide={() => setEditUser(null)}
        user={editUser}
        onSave={() => {
          fetchTree();
          setEditUser(null);
        }}
      />

      {/* Hover styles */}
      <style>{`
        .admin-header-row:hover {
          background: var(--theme-surface-hover, #f8fafc) !important;
        }
      `}</style>
    </Container>
  );
};

export default UserDirectory;
