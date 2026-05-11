import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = ({ collapsed, visible, onLogout }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [clickedMenu, setClickedMenu] = useState(null);
  const [clickedMenuPosition, setClickedMenuPosition] = useState({ top: 0 });
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [favorites, setFavorites] = useState([]);

  // Get user role and name from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('UserRole');

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserRole(userData.role);
        setUserName(userData.name || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
        if (storedRole) {
          setUserRole(storedRole);
        }
      }
    } else if (storedRole) {
      setUserRole(storedRole);
    }
    if (!userName) setUserName(localStorage.getItem('UserName') || '');
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

  // Define all navigation items with role requirements
  const allNavItems = [
    {
      path: '/admin/dashboard',
      icon: 'bi bi-speedometer2',
      label: 'Admin Dashboard',
      roles: ['admin'],
      exact: true
    },
    {
      path: '/admin/user-management',
      icon: 'bi bi-people',
      label: 'User Management',
      roles: ['admin'],
      submenu: [
        { path: '/admin/user-management/fos', label: 'Field Officers (FOS)' },
        { path: '/admin/user-management/retailers', label: 'Retailers' }
      ]
    },
    {
      path: '/admin/portal-requests',
      icon: 'bi bi-cloud-arrow-up',
      label: 'Portal Requests',
      roles: ['admin'],
      exact: true
    }
  ];

  // Filter nav items based on user role
  const priorityLookup = {
    '/dashboard': 0
  };

  const rolePriorityMap = {
    admin: {
      '/admin/dashboard': 0,
      '/admin/user-management': 1,
      '/admin/portal-requests': 2
    },
    api_partner: {
      '/dashboard': 0,
      '/top-up-request': 1,
      '/white-listing': 2,
      '/ledger': 3,
      '/commission-report': 4,
      '/my-commission': 5
    },
    master_distributor: {
      '/dashboard': 0,
      '/user-management': 1,
      '/top-up-request': 2,
      '/reports': 3
    },
    super_distributor: {
      '/dashboard': 0,
      '/user-management': 1,
      '/top-up-request': 2,
      '/reports': 3
    }
  };

  const getPriority = (path) => {
    if (!path) {
      return 5000;
    }
    if (rolePriorityMap[userRole]?.hasOwnProperty(path)) {
      return rolePriorityMap[userRole][path];
    }
    if (path === '/logout') {
      return 100000;
    }
    if (priorityLookup.hasOwnProperty(path)) {
      return priorityLookup[path];
    }
    return 5000;
  };

  const navItems = allNavItems
  .filter(item => {
    // If no roles specified, show to everyone
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if user's role is in the allowed roles
    return item.roles.includes(userRole);
  })
  .sort((a, b) => {
    const aPriority = getPriority(a.path);
    const bPriority = getPriority(b.path);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return (a.label || '').localeCompare(b.label || '');
  });

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
  }, [collapsed, clickedMenu]);

  return (
    <div className={`dms-sidebar ${collapsed ? 'collapsed' : ''} ${visible ? 'show' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="company-logo-text">
              <span className="brand-text-white">RMS</span>
              {!collapsed && <p className="brand-subtext">Restaurant Management</p>}
            </div>
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

export default Sidebar;
