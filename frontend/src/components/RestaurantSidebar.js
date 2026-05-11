import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
const RestaurantSidebar = ({ collapsed, visible, onLogout }) => {
  const location = useLocation();
  const { logoUrl, restaurantName, primaryColor } = useTheme();
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

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('restaurantSidebarFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites) => {
    localStorage.setItem('restaurantSidebarFavorites', JSON.stringify(newFavorites));
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

  // Define restaurant-only navigation items
  const allNavItems = [
    {
      path: '/restaurant/dashboard',
      icon: 'bi bi-speedometer2',
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/restaurant/user-management',
      icon: 'bi bi-people',
      label: 'User Management',
      submenu: [
        { path: '/restaurant/user-management/branch-tree', label: 'Branch Tree' },
        { path: '/restaurant/user-management/branches', label: 'Branches' },
        { path: '/restaurant/user-management/kitchen', label: 'Kitchen' },
        { path: '/restaurant/user-management/cashier', label: 'Cashier' },
        { path: '/restaurant/user-management/customers', label: 'Customers' },
        { path: '/restaurant/user-management/delivery', label: 'Delivery' }
      ]
    },
    {
      path: '/restaurant/menu-management',
      icon: 'bi bi-journal-text',
      label: 'Menu Management',
      submenu: [
        { path: '/restaurant/menu-management/menu-tree', label: 'Menu Tree' },
        { path: '/restaurant/menu-management/categories', label: 'Categories' },
        { path: '/restaurant/menu-management/subcategories', label: 'Subcategories' },
        { path: '/restaurant/menu-management/items', label: 'Menu Items' },
        { path: '/restaurant/menu-management/addons', label: 'Addons' },
        { path: '/restaurant/menu-management/sections', label: 'Sections' },
        { path: '/restaurant/menu-management/dining-tables', label: 'Dining Tables' },
        { path: '/restaurant/user-management/restaurant-hours', label: 'Restaurant Hours' },
        { path: '/restaurant/user-management/delivery-zones', label: 'Delivery Zones' }
      ]
    },
    {
      path: '/restaurant/outstanding',
      icon: 'bi bi-wallet2',
      label: 'Outstanding',
      submenu: [
        { path: '/restaurant/outstanding/delivery', label: 'Delivery' },
        { path: '/restaurant/outstanding/history', label: 'Outstanding History' }
      ]
    },
    {
      path: '/restaurant/orders',
      icon: 'bi bi-cart3',
      label: 'Orders',
      submenu: [
        { path: '/restaurant/orders/list', label: 'All Orders' },
        { path: '/restaurant/orders/new', label: 'New Orders' },
        { path: '/restaurant/orders/preparing', label: 'Preparing' },
        { path: '/restaurant/orders/onway', label: 'On The Way' },
        { path: '/restaurant/orders/delivered', label: 'Delivered' },
        { path: '/restaurant/orders/cancelled', label: 'Cancelled' }
      ]
    },
    {
      path: '/restaurant/reports',
      icon: 'bi bi-bar-chart',
      label: 'Reports',
      exact: true
    },
    {
      path: '/restaurant/settings',
      icon: 'bi bi-gear-fill',
      label: 'Settings',
      submenu: [
        { path: '/restaurant/settings/business-settings', label: 'Business Settings' },
        { path: '/restaurant/settings/payment-gateway', label: 'Payment Gateway' },
        { path: '/restaurant/settings/slider', label: 'Slider' },
        { path: '/restaurant/settings/coupons', label: 'Coupons' },
        { path: '/restaurant/settings/marquee-messages', label: 'Marquee Messages' }
      ]
    }
  ];

  // Restaurant navigation items (no filtering needed)
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

  // Collect all top-level standalone paths (non-submenu items) for exclusion from parent matching
  const standalonePaths = allNavItems.filter(i => !i.submenu).map(i => i.path);

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/';
    }
    // Exact match always wins
    if (location.pathname === path) return true;
    // For prefix matching (submenu parents), exclude if current path matches a standalone item
    if (location.pathname.startsWith(path + '/')) {
      const matchesStandalone = standalonePaths.some(sp => sp !== path && location.pathname === sp);
      return !matchesStandalone;
    }
    return false;
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
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName || "Restaurant"}
                className="sidebar-logo-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="sidebar-logo-initial">
                {(restaurantName || 'R').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="sidebar-user-card" title={collapsed ? `${userName || 'User'} - ${userRole || 'Restaurant'}` : ''}>
        <div className="sidebar-user-avatar">
          {(userName || 'R').charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName || 'User'}</span>
            <span className="sidebar-user-role">{(userRole || 'Restaurant').replace(/_/g, ' ')}</span>
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

export default RestaurantSidebar;
