import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const DeliverySidebar = ({ collapsed, visible, onLogout }) => {
  const location = useLocation();
  const { logoUrl, restaurantName } = useTheme();
  const { isImpersonating, returnToSuperAdmin } = useAuth();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [favorites, setFavorites] = useState([]);

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
    const savedFavorites = localStorage.getItem('deliverySidebarFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        setFavorites([]);
      }
    }
  }, []);

  const saveFavorites = (newFavorites) => {
    localStorage.setItem('deliverySidebarFavorites', JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  };

  const isFavorited = (path) => {
    return favorites.some(fav => fav.path === path);
  };

  const toggleFavorite = (e, path, label, icon) => {
    e.preventDefault();
    e.stopPropagation();
    const existingIndex = favorites.findIndex(fav => fav.path === path);
    if (existingIndex !== -1) {
      saveFavorites(favorites.filter((_, index) => index !== existingIndex));
    } else {
      saveFavorites([...favorites, { path, label, icon }]);
    }
  };

  const navItems = [
    {
      path: '/delivery/dashboard',
      icon: 'bi bi-speedometer2',
      label: 'Dashboard',
      exact: true
    },
    {
      path: '/delivery/orders',
      icon: 'bi bi-box2-heart',
      label: 'Active Orders',
      exact: false
    },
    {
      path: '/delivery/history',
      icon: 'bi bi-clock-history',
      label: 'Order History',
      exact: false
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

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
      <div className="sidebar-user-card" title={collapsed ? `${userName || 'User'} - ${userRole || 'Delivery'}` : ''}>
        <div className="sidebar-user-avatar">
          {(userName || 'D').charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName || 'User'}</span>
            <span className="sidebar-user-role">{(userRole || 'Delivery').replace(/_/g, ' ')}</span>
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

        {navItems.map((item, index) => (
          <div key={index} className="nav-item">
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

export default DeliverySidebar;
