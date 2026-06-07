import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

const SuperAdminSidebar = ({ collapsed, visible, onLogout }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const navItems = [
    { path: '/superadmin/dashboard', icon: 'bi bi-speedometer2', label: 'Dashboard', exact: true },
    { path: '/superadmin/restaurants', icon: 'bi bi-shop', label: 'Restaurants' },
    {
      path: '/superadmin/user-management',
      icon: 'bi bi-people',
      label: 'User Management',
      submenu: [
        { path: '/superadmin/user-approvals', label: 'User Approvals' },
        { path: '/superadmin/user-directory', label: 'User Directory' },
      ]
    },
    {
      path: '/superadmin/billing',
      icon: 'bi bi-credit-card',
      label: 'Billing',
      submenu: [
        { path: '/superadmin/subscription-plans', label: 'Subscription Plans' },
        { path: '/superadmin/subscriptions', label: 'Subscriptions' },
      ]
    },
    { path: '/superadmin/reports', icon: 'bi bi-bar-chart', label: 'Reports' },
    { path: '/superadmin/notifications', icon: 'bi bi-bell', label: 'Notifications' },
    { path: '/superadmin/settings', icon: 'bi bi-gear', label: 'Settings', exact: true },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const toggleSubmenu = (path) => {
    setExpandedMenus(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const primaryColor = '#3B82F6';

  return (
    <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${visible ? 'mobile-visible' : ''}`}
      style={{
        width: collapsed ? '70px' : '260px',
        minHeight: '100vh',
        background: '#3B82F6',
        transition: 'all 0.3s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1040,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>

      {/* Logo */}
      <div className="d-flex align-items-center px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', minHeight: '64px' }}>
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-shield-lock-fill text-white"></i>
          </div>
          {!collapsed && <span className="text-white fw-bold" style={{ fontSize: '16px' }}>SuperAdmin</span>}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="py-2">
        {navItems.map((item) => (
          <div key={item.path}>
            {item.submenu ? (
              <>
                <div
                  className="d-flex align-items-center px-3 py-2 mx-2 mb-1"
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.7)',
                    background: isActive(item.path) ? 'rgba(99,102,241,0.2)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => toggleSubmenu(item.path)}
                >
                  <i className={`${item.icon} me-3`} style={{ fontSize: '18px' }}></i>
                  {!collapsed && (
                    <>
                      <span className="flex-grow-1" style={{ fontSize: '14px' }}>{item.label}</span>
                      <i className={`bi bi-chevron-${expandedMenus[item.path] ? 'down' : 'right'}`} style={{ fontSize: '12px' }}></i>
                    </>
                  )}
                </div>
                {!collapsed && expandedMenus[item.path] && (
                  <div className="ms-4">
                    {item.submenu.map((sub) => (
                      <Link key={sub.path} to={sub.path} className="text-decoration-none">
                        <div className="d-flex align-items-center px-3 py-2 mx-2 mb-1"
                          style={{
                            borderRadius: '8px',
                            color: isActive(sub.path, true) ? '#fff' : 'rgba(255,255,255,0.6)',
                            background: isActive(sub.path, true) ? primaryColor : 'transparent',
                            fontSize: '13px',
                            transition: 'all 0.2s',
                          }}>
                          <i className="bi bi-dot me-2"></i>
                          {sub.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link to={item.path} className="text-decoration-none">
                <div className="d-flex align-items-center px-3 py-2 mx-2 mb-1"
                  style={{
                    borderRadius: '8px',
                    color: isActive(item.path, item.exact) ? '#fff' : 'rgba(255,255,255,0.7)',
                    background: isActive(item.path, item.exact) ? primaryColor : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                  <i className={`${item.icon} me-3`} style={{ fontSize: '18px' }}></i>
                  {!collapsed && <span style={{ fontSize: '14px' }}>{item.label}</span>}
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', position: 'absolute', bottom: 0, width: '100%' }}>
        <div className="d-flex align-items-center px-3 py-2 mx-0"
          style={{ cursor: 'pointer', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s' }}
          onClick={onLogout}>
          <i className="bi bi-box-arrow-left me-3" style={{ fontSize: '18px' }}></i>
          {!collapsed && <span style={{ fontSize: '14px' }}>Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
