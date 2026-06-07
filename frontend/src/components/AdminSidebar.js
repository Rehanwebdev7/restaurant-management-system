import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import superadminService from '../services/superadminService';

const AdminSidebar = ({ collapsed, visible, onLogout }) => {
  const location = useLocation();
  useTheme();
  const { } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [clickedMenu, setClickedMenu] = useState(null);
  const [clickedMenuPosition, setClickedMenuPosition] = useState({ top: 0 });
  const [favorites, setFavorites] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Load user info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserName(userData.name || '');
        setUserRole(userData.role || '');
      } catch (e) { /* ignore */ }
    }
    if (!userName) setUserName(localStorage.getItem('UserName') || '');
    if (!userRole) setUserRole(localStorage.getItem('UserRole') || '');
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('sidebarFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Fetch pending orders count
  useEffect(() => {
    const fetchPendingCount = async () => {
      const result = await superadminService.getDashboardData();
      if (result.success) {
        setPendingCount(result.success.data.data.pending_orders || 0);
      }
    };
    fetchPendingCount();
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites) => {
    localStorage.setItem('sidebarFavorites', JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  };

  // Check if a link is favorited
  const isFavorited = (path) => {
    return favorites.some(fav => fav.path === path);
  };

  // Toggle favorite
  const toggleFavorite = (e, path, label, icon, parentIcon = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const existingIndex = favorites.findIndex(fav => fav.path === path);
    
    if (existingIndex !== -1) {
      // Remove from favorites
      const newFavorites = favorites.filter((_, index) => index !== existingIndex);
      saveFavorites(newFavorites);
    } else {
      // Add to favorites
      const newFavorite = {
        path,
        label,
        icon: parentIcon || icon
      };
      saveFavorites([...favorites, newFavorite]);
    }
  };

  // Define super admin navigation items (merged admin + superadmin)
  const allNavItems = [
    {
      path: '/superadmin/dashboard',
      icon: 'bi bi-speedometer2',
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/superadmin/user-management',
      icon: 'bi bi-people',
      label: 'User Management',
      submenu: [
        { path: '/superadmin/user-approvals', label: 'User Approvals' },
        { path: '/superadmin/user-directory', label: 'User Directory' },
        { path: '/superadmin/user-management/restaurants', label: 'All Restaurants' },
        { path: '/superadmin/user-management/branches', label: 'Branches' },
        { path: '/superadmin/user-management/kitchen', label: 'Kitchen' },
        { path: '/superadmin/user-management/delivery', label: 'Delivery' },
        { path: '/superadmin/user-management/cashier', label: 'Cashier' }
      ]
    },
    {
      path: '/superadmin/menu-management',
      icon: 'bi bi-journal-text',
      label: 'Menu Management',
      submenu: [
        { path: '/superadmin/menu-management/categories', label: 'Categories' },
        { path: '/superadmin/menu-management/subcategories', label: 'Subcategories' },
        { path: '/superadmin/menu-management/sections', label: 'Sections' },
        { path: '/superadmin/menu-management/dining-tables', label: 'Dining Tables' },
        { path: '/superadmin/menu-management/addons', label: 'Addons' },
        { path: '/superadmin/menu-management/items', label: 'Menu Items' },
        { path: '/superadmin/menu-management/items-bulk-update', label: 'Bulk Update' },
        { path: '/superadmin/user-management/delivery-zones', label: 'Delivery Zones' },
      ]
    },
    {
      path: '/superadmin/orders',
      icon: 'bi bi-cart3',
      label: 'Orders',
      submenu: [
        { path: '/superadmin/orders/list', label: 'All Orders' },
        { path: '/superadmin/orders/new', label: 'New Orders' },
        { path: '/superadmin/orders/preparing', label: 'Preparing' },
        { path: '/superadmin/orders/delivered', label: 'Delivered' },
        { path: '/superadmin/orders/cancelled', label: 'Cancelled' }
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
    {
      path: '/superadmin/notifications',
      icon: 'bi bi-bell',
      label: 'Notifications',
      exact: true
    },
    {
      path: '/superadmin/settings',
      icon: 'bi bi-gear-fill',
      label: 'Settings',
      submenu: [
        { path: '/superadmin/settings/business-settings', label: 'Business Settings' },
        { path: '/superadmin/settings/payment-gateway', label: 'Payment Gateway' },
        { path: '/superadmin/settings/api-logs', label: 'API Logs' },
        { path: '/superadmin/settings/state', label: 'State' },
        { path: '/superadmin/settings/city', label: 'City' }
      ]
    }
  ];

  // Admin navigation items (no filtering needed)
  const navItems = allNavItems;

  const toggleMenu = (menuPath) => {
    if (collapsed) return; // Don't expand menus when sidebar is collapsed
    
    setExpandedMenus(prev => {
      // If clicking on already expanded menu, close it
      if (prev[menuPath]) {
        return {};
      }
      // Otherwise, close all menus and open only the clicked one
      return { [menuPath]: true };
    });
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isMenuExpanded = (menuPath) => {
    return expandedMenus[menuPath] || false;
  };

  const hasActiveSubmenu = (submenu) => {
    return submenu && submenu.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
  };

  const handleMenuClick = (menuPath, event) => {
    if (collapsed) {
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      setClickedMenuPosition({ top: rect.top });
      
      // Toggle submenu - close if already open, open if closed
      if (clickedMenu === menuPath) {
        setClickedMenu(null);
      } else {
        setClickedMenu(menuPath);
      }
    } else {
      // Normal behavior for expanded sidebar
      toggleMenu(menuPath);
    }
  };

  // Close submenu when clicking outside
  const handleDocumentClick = useCallback((event) => {
    if (collapsed && clickedMenu) {
      const submenu = document.querySelector('.nav-submenu-hover');
      const menuItem = event.target.closest('.nav-menu-group');
      
      if (!submenu?.contains(event.target) && !menuItem) {
        setClickedMenu(null);
      }
    }
  }, [collapsed, clickedMenu]);

  // Add document click listener
  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleDocumentClick]);

  return (
    <div className={`dms-sidebar ${collapsed ? 'collapsed' : ''} ${visible ? 'show' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', background: 'transparent' }}>
            <img
              src="/app-favicon.svg"
              alt="Platform"
              style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
            />
            {!collapsed && (
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap' }}>Super Admin</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Platform Panel</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="sidebar-user-card" title={collapsed ? `${userName || 'User'} - ${userRole || 'Admin'}` : ''}>
        <div className="sidebar-user-avatar">
          {(userName || 'A').charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName || 'User'}</span>
            <span className="sidebar-user-role">{(userRole || 'Admin').replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="favorites-section">
            {!collapsed && (
              <div className="section-header">
                <i className="bi bi-star-fill"></i>
                
                <div className="menu-label-line"></div>
              </div>
            )}
            <div className="favorites-list">
              {favorites.map((favorite, index) => (
                <div key={index} className="nav-item">
                  <Link
                    to={favorite.path}
                    className={`nav-link ${isActive(favorite.path) ? 'active' : ''}`}
                    title={collapsed ? favorite.label : ''}
                  >
                    <span className="nav-icon-wrap">
                      <i className={favorite.icon}></i>
                    </span>
                    {!collapsed && <span className="nav-label">{favorite.label}</span>}
                    {!collapsed && (
                      <i
                        className="bi bi-star-fill favorite-icon filled"
                        onClick={(e) => toggleFavorite(e, favorite.path, favorite.label, favorite.icon)}
                        title="Remove from favorites"
                      ></i>
                    )}
                  </Link>
                </div>
              ))}
            </div>
            {!collapsed && <div className="section-divider"></div>}
          </div>
        )}

        {/* MENU Section Label */}
        {!collapsed && (
          <div className="sidebar-menu-label">
            <span>MENU</span>
            <div className="menu-label-line"></div>
          </div>
        )}

        {/* Regular Navigation Items */}
        {navItems.map((item, index) => (
          <div key={index} className="nav-item">
            {item.submenu ? (
              <div className="nav-menu-group">
                <div
                  className={`nav-link nav-link-expandable ${
                    isActive(item.path) || hasActiveSubmenu(item.submenu) || (collapsed && clickedMenu === item.path) ? 'active' : ''
                  }`}
                  onClick={(e) => handleMenuClick(item.path, e)}
                  title={collapsed ? item.label : ''}
                  style={{
                    background: (isActive(item.path) || hasActiveSubmenu(item.submenu) || (collapsed && clickedMenu === item.path))
                      ? 'rgba(var(--theme-primary-rgb), 0.06)'
                      : 'inherit',
                    borderLeft: (isActive(item.path) || hasActiveSubmenu(item.submenu) || (collapsed && clickedMenu === item.path))
                      ? '3px solid var(--theme-primary)'
                      : '3px solid transparent',
                    borderRadius: 0,
                    boxShadow: 'none',
                    transform: 'none',
                  }}
                >
                  <span className="nav-icon-wrap">
                    <i className={item.icon}></i>
                  </span>
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.label === 'Orders' && pendingCount > 0 && userRole !== 'supadmin' && (
                        <span className="nav-badge">{pendingCount}</span>
                      )}
                      <i
                        className={`bi ${isMenuExpanded(item.path) ? 'bi-chevron-down' : 'bi-chevron-right'} nav-chevron`}
                        style={{
                          transition: 'transform 0.3s ease'
                        }}
                      ></i>
                    </>
                  )}
                </div>

                {!collapsed && (
                  <div className={`nav-submenu ${isMenuExpanded(item.path) ? 'expanded' : ''}`}>
                    {item.submenu.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subItem.path}
                        className={`nav-sublink ${isActive(subItem.path) ? 'active' : ''}`}
                      >
                        <i
                          className={`bi ${isFavorited(subItem.path) ? 'bi-star-fill' : 'bi-star'} favorite-icon ${isFavorited(subItem.path) ? 'filled' : ''}`}
                          onClick={(e) => toggleFavorite(e, subItem.path, subItem.label, item.icon)}
                          title={isFavorited(subItem.path) ? 'Remove from favorites' : 'Add to favorites'}
                        ></i>
                        <span className="nav-sublabel">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {collapsed && clickedMenu === item.path && (
                  <div
                    className="nav-submenu-hover"
                    style={{ top: clickedMenuPosition.top }}
                  >
                    <div className="submenu-header">
                      <span className="submenu-title">{item.label}</span>
                    </div>
                    {item.submenu.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subItem.path}
                        className={`nav-sublink-hover ${isActive(subItem.path) ? 'active' : ''}`}
                        onClick={() => setClickedMenu(null)}
                      >
                        <span className="nav-sublabel">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-icon-wrap">
                  <i className={item.icon}></i>
                </span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {!collapsed && (
                  <i
                    className={`bi ${isFavorited(item.path) ? 'bi-star-fill' : 'bi-star'} favorite-icon ${isFavorited(item.path) ? 'filled' : ''}`}
                    onClick={(e) => toggleFavorite(e, item.path, item.label, item.icon)}
                    title={isFavorited(item.path) ? 'Remove from favorites' : 'Add to favorites'}
                  ></i>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>


      <div className="sidebar-logout">
        <button
          className="sidebar-signout-btn"
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : ''}
        >
          <i className="bi bi-box-arrow-right"></i>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
