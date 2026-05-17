import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const CashierSidebar = ({ collapsed, visible, onLogout }) => {
  const location = useLocation();
  const { logoUrl, restaurantName } = useTheme();
  const { isImpersonating, returnToSuperAdmin } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [clickedMenu, setClickedMenu] = useState(null);
  const [clickedMenuPosition, setClickedMenuPosition] = useState({ top: 0 });
  const [favorites, setFavorites] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

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

  useEffect(() => {
    const savedFavorites = localStorage.getItem('cashierSidebarFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
    }
  }, []);

  const saveFavorites = (newFavorites) => {
    localStorage.setItem('cashierSidebarFavorites', JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  };

  const isFavorited = (path) => {
    return favorites.some(fav => fav.path === path);
  };

  const toggleFavorite = (e, path, label, icon, parentIcon = null) => {
    e.preventDefault();
    e.stopPropagation();

    const existingIndex = favorites.findIndex(fav => fav.path === path);

    if (existingIndex !== -1) {
      const newFavorites = favorites.filter((_, index) => index !== existingIndex);
      saveFavorites(newFavorites);
    } else {
      const newFavorite = {
        path,
        label,
        icon: parentIcon || icon
      };
      saveFavorites([...favorites, newFavorite]);
    }
  };

  const allNavItems = [
    {
      path: '/cashier/dashboard',
      icon: 'bi bi-speedometer2',
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/cashier/dining-tables',
      icon: 'bi bi-grid-3x3',
      label: 'Dining',
      exact: true
    },
    {
      path: '/cashier/delivery',
      icon: 'bi bi-truck',
      label: 'Delivery',
      exact: true
    },
    {
      path: '/cashier/takeaway',
      icon: 'bi bi-bag-check',
      label: 'Takeaway',
      exact: true
    },
    {
      path: '/cashier/customers',
      icon: 'bi bi-people',
      label: 'Customers',
      exact: true
    },
    {
      path: '/cashier/menu-view',
      icon: 'bi bi-journal-text',
      label: 'Menu',
      submenu: [
        { path: '/cashier/menu-view/categories', label: 'Categories' },
        { path: '/cashier/menu-view/subcategories', label: 'Subcategories' },
        { path: '/cashier/menu-view/addons', label: 'Addons' },
        { path: '/cashier/menu-view/sections', label: 'Sections' }
      ]
    },
    {
      path: '/cashier/operations',
      icon: 'bi bi-clipboard-check',
      label: 'Operations',
      submenu: [
        { path: '/cashier/operations/orders', label: 'Orders' },
        { path: '/cashier/operations/payments', label: 'Payments' }
      ]
    },
    {
      path: '/cashier/outstanding',
      icon: 'bi bi-wallet2',
      label: 'Outstanding',
      submenu: [
        { path: '/cashier/outstanding/delivery', label: 'Delivery' },
        { path: '/cashier/outstanding/history', label: 'Outstanding History' }
      ]
    },
    {
      path: '/cashier/wallet-topup',
      icon: 'bi bi-wallet-fill',
      label: 'Withdrawal Wallet',
      submenu: [
        { path: '/cashier/wallet-topup/requests', label: 'Withdrawal Request' },
        { path: '/cashier/wallet-topup/history', label: 'Withdrawal History' }
      ]
    }
  ];

  const navItems = allNavItems;

  const toggleMenu = (menuPath) => {
    if (collapsed) return;

    setExpandedMenus(prev => {
      if (prev[menuPath]) {
        return {};
      }
      return { [menuPath]: true };
    });
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isMenuExpanded = (menuPath) => {
    return expandedMenus[menuPath] || false;
  };

  const hasActiveSubmenu = (submenu) => {
    return submenu && submenu.some(item => location.pathname.startsWith(item.path));
  };

  const handleMenuClick = (menuPath, event) => {
    if (collapsed) {
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      setClickedMenuPosition({ top: rect.top });

      if (clickedMenu === menuPath) {
        setClickedMenu(null);
      } else {
        setClickedMenu(menuPath);
      }
    } else {
      toggleMenu(menuPath);
    }
  };

  const handleDocumentClick = useCallback((event) => {
    if (collapsed && clickedMenu) {
      const submenu = document.querySelector('.nav-submenu-hover');
      const menuItem = event.target.closest('.nav-menu-group');

      if (!submenu?.contains(event.target) && !menuItem) {
        setClickedMenu(null);
      }
    }
  }, [collapsed, clickedMenu]);

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleDocumentClick]);

  return (
    <div className={`dms-sidebar ${collapsed ? 'collapsed' : ''} ${visible ? 'show' : ''}`}>
      {isImpersonating && (
        <button
          type="button"
          className="sidebar-impersonation-btn"
          onClick={returnToSuperAdmin}
          title={collapsed ? 'Back to Super Admin' : ''}
        >
          <i className="bi bi-arrow-left-circle-fill"></i>
          {!collapsed && (
            <span className="sidebar-impersonation-text">
              <span className="sidebar-impersonation-label">Back to Super Admin</span>
              <span className="sidebar-impersonation-sub">Viewing as {restaurantName || localStorage.getItem('UserName') || 'User'}</span>
            </span>
          )}
        </button>
      )}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img
              src={logoUrl || "/app-favicon.svg"}
              alt={restaurantName || "Restaurant"}
              className="sidebar-logo-img"
              onError={(e) => { e.target.src = "/app-favicon.svg"; }}
            />
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="sidebar-user-card" title={collapsed ? `${userName || 'User'} - ${userRole || 'Cashier'}` : ''}>
        <div className="sidebar-user-avatar">
          {(userName || 'C').charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName || 'User'}</span>
            <span className="sidebar-user-role">{(userRole || 'Cashier').replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {favorites.length > 0 && (
          <div className="favorites-section">
            {!collapsed && (
              <div className="section-header">
                <i className="bi bi-star-fill"></i>
                
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
                    <i className={favorite.icon}></i>
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

        {navItems.map((item, index) => (
          <div key={index} className="nav-item">
            {item.submenu ? (
              <div className="nav-menu-group">
                <div
                  className={`nav-link nav-link-expandable ${
                    hasActiveSubmenu(item.submenu) || (collapsed && clickedMenu === item.path) ? 'active' : ''
                  }`}
                  onClick={(e) => handleMenuClick(item.path, e)}
                  title={collapsed ? item.label : ''}
                >
                  <i
                    className={item.icon}
                    style={{
                      transition: 'transform 0.3s ease',
                      transform: isMenuExpanded(item.path) ? 'rotate(20deg) scale(1.1)' : 'rotate(0deg) scale(1)'
                    }}
                  ></i>
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
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
                <i className={item.icon}></i>
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
        <div className="nav-item">
          <div
            className="nav-link"
            onClick={onLogout}
            style={{ cursor: 'pointer' }}
            title={collapsed ? 'Logout' : ''}
          >
            <i className="bi bi-box-arrow-right"></i>
            {!collapsed && <span className="nav-label">Logout</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierSidebar;
