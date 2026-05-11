import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from './modals/ChangePasswordModal';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useOrderAlert } from '../contexts/OrderAlertContext';
import { ApiGet, ApiPost } from '../ApiServices/ApiServices';

const Header = ({ onToggleSidebar, sidebarCollapsed, sidebarVisible, onLogout }) => {
  const { primaryColor } = useTheme();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const { pendingOrders, isRinging } = useOrderAlert();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [shopName, setShopName] = useState('');
  const [userName, setUserName] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');

  // ── STOP/RESUME Orders state ──
  const [ordersStopped, setOrdersStopped] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedStopBranch, setSelectedStopBranch] = useState(null);
  const [branchStatuses, setBranchStatuses] = useState({});
  const stopConfirmRef = useRef(null);

  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);

    // Get user information from localStorage
    const role = localStorage.getItem('UserRole');
    const shop = localStorage.getItem('ShopName');
    const name = localStorage.getItem('UserName');
    const mobile = localStorage.getItem('UserMobile');
    const photo = localStorage.getItem('profilePhoto');

    if (role) setUserRole(role);
    if (shop) setShopName(shop);
    if (name) setUserName(name);
    if (mobile) setUserMobile(mobile);
    if (photo) setProfilePhoto(photo);

    // Listen for profile photo updates
    const handlePhotoUpdate = () => {
      const updatedPhoto = localStorage.getItem('profilePhoto');
      setProfilePhoto(updatedPhoto || '');
    };
    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch branch status for STOP button ──
  const fetchBranchStatuses = useCallback(async () => {
    try {
      if (userRole === 'branch') {
        const res = await ApiGet('/api/branch/restaurant_branch/branch-status');
        if (res.success) {
          const data = res.success.data.data;
          const branchId = data.branchId;
          setBranchStatuses({ [branchId]: data });
          setSelectedStopBranch(branchId);
          setOrdersStopped(data.adminStopped === true);
        }
      } else if (userRole === 'restaurant') {
        // Fetch all branches first
        const brRes = await ApiGet('/api/restaurant/users/filter', { role: 'branch', pageNumber: 0, pageSize: 100 });
        if (brRes.success) {
          const records = brRes.success.data.data.records || [];
          setBranches(records);
          if (records.length > 0) {
            const firstBranch = records[0];
            setSelectedStopBranch(firstBranch.id);
            // Fetch status for each branch
            const statuses = {};
            for (const br of records) {
              try {
                const sRes = await ApiGet(`/api/admin/restaurant_branch/branch-status/${br.id}`);
                if (sRes.success) statuses[br.id] = sRes.success.data.data;
              } catch (e) { /* skip */ }
            }
            setBranchStatuses(statuses);
            if (statuses[firstBranch.id]) {
              setOrdersStopped(statuses[firstBranch.id].adminStopped === true);
            }
          }
        }
      }
    } catch (e) { /* silent */ }
  }, [userRole]);

  useEffect(() => {
    if (userRole === 'branch' || userRole === 'restaurant') {
      fetchBranchStatuses();
    }
  }, [userRole, fetchBranchStatuses]);

  // Close stop confirm dropdown on outside click
  useEffect(() => {
    const handleClickOutsideStop = (event) => {
      if (stopConfirmRef.current && !stopConfirmRef.current.contains(event.target)) {
        setShowStopConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideStop);
    return () => document.removeEventListener('mousedown', handleClickOutsideStop);
  }, []);

  const handleStopOrders = async () => {
    if (!selectedStopBranch) return;
    setStopLoading(true);
    try {
      const endpoint = userRole === 'branch'
        ? '/api/branch/restaurant_branch/stop-orders'
        : `/api/admin/restaurant_branch/stop-orders/${selectedStopBranch}`;
      const res = await ApiPost(endpoint);
      if (res.success) {
        setOrdersStopped(true);
        setBranchStatuses(prev => ({
          ...prev,
          [selectedStopBranch]: { ...prev[selectedStopBranch], adminStopped: true, status: 'STOPPED', acceptingOrders: false }
        }));
      }
    } catch (e) { /* silent */ }
    setStopLoading(false);
    setShowStopConfirm(false);
  };

  const handleResumeOrders = async () => {
    if (!selectedStopBranch) return;
    setStopLoading(true);
    try {
      const endpoint = userRole === 'branch'
        ? '/api/branch/restaurant_branch/resume-orders'
        : `/api/admin/restaurant_branch/resume-orders/${selectedStopBranch}`;
      const res = await ApiPost(endpoint);
      if (res.success) {
        setOrdersStopped(false);
        setBranchStatuses(prev => ({
          ...prev,
          [selectedStopBranch]: { ...prev[selectedStopBranch], adminStopped: false, status: 'OPEN', acceptingOrders: true }
        }));
      }
    } catch (e) { /* silent */ }
    setStopLoading(false);
    setShowStopConfirm(false);
  };

  // Update ordersStopped when selectedStopBranch changes
  useEffect(() => {
    if (selectedStopBranch && branchStatuses[selectedStopBranch]) {
      setOrdersStopped(branchStatuses[selectedStopBranch].adminStopped === true);
    }
  }, [selectedStopBranch, branchStatuses]);

  const getToggleIcon = () => {
    if (isMobile) {
      return sidebarVisible ? 'bi-x-lg' : 'bi-list';
    }
    return sidebarCollapsed ? 'bi-list' : 'bi-chevron-left';
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleNavigateToProfile = () => {
    setShowProfileMenu(false);
    navigate('/profile');
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    handleNavigateToProfile();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setShowProfileMenu(false);
    setShowChangePasswordModal(true);
  };


  return (
    <header className={`dms-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-menu">
        <i
          className={`bi ${getToggleIcon()} fs-responsive-md`}
          style={{ cursor: 'pointer' }}
          onClick={onToggleSidebar}
        ></i>
      </div>

      <div className="header-actions">

        {/* Dark/Light Mode Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        {/* STOP/RESUME Orders Button — for restaurant and branch roles */}
        {(userRole === 'restaurant' || userRole === 'branch') && (
          <div style={{ position: 'relative' }} ref={stopConfirmRef}>
            {/* Branch selector for restaurant with multiple branches */}
            {userRole === 'restaurant' && branches.length > 1 && (
              <select
                value={selectedStopBranch || ''}
                onChange={(e) => setSelectedStopBranch(Number(e.target.value))}
                style={{
                  position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)',
                  fontSize: '9px', padding: '0 4px', border: 'none', background: 'transparent',
                  color: '#64748b', cursor: 'pointer', maxWidth: '120px', textAlign: 'center',
                }}
              >
                {branches.map(br => (
                  <option key={br.id} value={br.id}>{br.name || br.full_name || `Branch ${br.id}`}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                if (ordersStopped) {
                  handleResumeOrders();
                } else {
                  setShowStopConfirm(true);
                }
              }}
              disabled={stopLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600, transition: 'all 0.3s ease',
                background: ordersStopped ? '#dc3545' : `${primaryColor}15`,
                color: ordersStopped ? '#fff' : primaryColor,
                animation: ordersStopped ? 'pulse-stop 2s infinite' : 'none',
                marginTop: userRole === 'restaurant' && branches.length > 1 ? '8px' : '0',
              }}
            >
              {stopLoading ? (
                <span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }}></span>
              ) : (
                <i className={`bi ${ordersStopped ? 'bi-play-circle-fill' : 'bi-stop-circle-fill'}`} style={{ fontSize: '14px' }}></i>
              )}
              <span className="d-none d-lg-inline">
                {ordersStopped ? 'Resume Orders' : 'STOP Orders'}
              </span>
            </button>

            {/* Confirmation dropdown */}
            {showStopConfirm && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                background: isDarkMode ? '#1e293b' : '#fff',
                borderRadius: '12px',
                boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.15)',
                border: isDarkMode ? '1px solid rgba(220,53,69,0.3)' : '1px solid #fee2e2',
                minWidth: '280px', padding: '16px', zIndex: 1000,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '20px', color: '#dc3545' }}></i>
                  <strong style={{ fontSize: '14px', color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>Stop Taking Orders?</strong>
                </div>
                <p style={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0 0 12px' }}>
                  Customers will not be able to place new orders. Existing orders remain unaffected.
                  Orders will auto-resume tomorrow at opening time.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowStopConfirm(false)}
                    style={{
                      padding: '6px 16px', borderRadius: '8px',
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
                      background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f8fafc',
                      color: isDarkMode ? '#e2e8f0' : '#475569',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                    }}
                  >Cancel</button>
                  <button
                    onClick={handleStopOrders}
                    disabled={stopLoading}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#dc3545', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {stopLoading ? 'Stopping...' : 'Yes, Stop Orders'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Orders Indicator — for restaurant, kitchen, cashier */}
        {(userRole === 'restaurant' || userRole === 'kitchen' || userRole === 'cashier') && pendingOrders.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              fontSize: '12px',
              fontWeight: 700,
              color: '#dc2626',
              animation: isRinging ? 'pulse-stop 1.5s infinite' : 'none',
              cursor: 'default'
            }}
          >
            <i className="bi bi-bell-fill" style={{
              animation: isRinging ? 'bell-header-swing 0.4s ease-in-out infinite alternate' : 'none',
              fontSize: '14px'
            }}></i>
            <span>{pendingOrders.length} Pending</span>
          </div>
        )}

        {/* Notifications — visible for restaurant, kitchen, cashier */}
        {(userRole === 'restaurant' || userRole === 'kitchen' || userRole === 'cashier') && <div className="notification-container" ref={notificationRef}>
          <div
            className="notification-icon"
            onClick={toggleNotifications}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `${primaryColor}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${primaryColor}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${primaryColor}10`;
            }}
          >
            <i className="bi bi-bell" style={{ fontSize: '18px', color: primaryColor }}></i>
            {unreadCount > 0 && (
              <span
                className="notification-badge"
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#dc3545',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          
          {showNotifications && (
            <div
              className="notification-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: `1px solid ${primaryColor}20`,
                minWidth: '280px',
                overflow: 'hidden',
                zIndex: 1000
              }}
            >
              <div
                className="dropdown-header"
                style={{
                  padding: '14px 16px',
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h6 style={{ margin: 0, color: '#fff', fontWeight: '600', fontSize: '15px' }}>Notifications</h6>
                {unreadCount > 0 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {unreadCount} new - Mark all read
                  </span>
                )}
              </div>
              <div className="notification-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    color: '#999'
                  }}>
                    <i className="bi bi-bell-slash" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: '#ddd' }}></i>
                    <span style={{ fontSize: '13px' }}>No notifications</span>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: notification.unread ? `${primaryColor}08` : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {notification.unread && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: primaryColor, flexShrink: 0 }}></span>
                        )}
                        <div className="notification-title" style={{ fontWeight: notification.unread ? '600' : '500', fontSize: '13px', color: '#333' }}>{notification.title}</div>
                      </div>
                      <div className="notification-message" style={{ fontSize: '12px', color: '#666', marginTop: '2px', paddingLeft: notification.unread ? '14px' : '0' }}>{notification.message}</div>
                      <div className="notification-time" style={{ fontSize: '11px', color: primaryColor, marginTop: '4px', paddingLeft: notification.unread ? '14px' : '0' }}>{notification.time}</div>
                    </div>
                  ))
                )}
              </div>
              <div
                className="dropdown-footer"
                style={{
                  padding: '10px 16px',
                  borderTop: '1px solid #eee',
                  textAlign: 'center'
                }}
              >
                <button
                  type="button"
                  onClick={() => { clearNotifications(); setShowNotifications(false); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc3545',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dc354510';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <i className="bi bi-trash3" style={{ marginRight: '5px' }}></i>
                  Clear all notifications
                </button>
              </div>
            </div>
          )}
        </div>}

        {/* Profile Menu */}
        <div className="profile-container" ref={profileRef}>
          <div
            className="user-profile"
            onClick={toggleProfileMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              borderRadius: '25px',
              background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}08 100%)`,
              border: `1px solid ${primaryColor}30`,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div
              className="user-avatar"
              onClick={handleAvatarClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: profilePhoto ? 'transparent' : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                textTransform: 'uppercase',
                boxShadow: `0 2px 8px ${primaryColor}40`,
                overflow: 'hidden'
              }}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = (shopName || userName || userRole || 'U').charAt(0); }} />
              ) : (
                (shopName || userName || userRole || 'U').charAt(0)
              )}
            </div>
            <div className="user-info d-none d-md-block" onClick={handleAvatarClick}>
              <div className="user-name" style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#333',
                lineHeight: '1.2'
              }}>
                {shopName || userName || userRole}
              </div>
              <div className="user-role" style={{
                fontSize: '11px',
                color: primaryColor,
                fontWeight: '500'
              }}>
                {userMobile}
              </div>
            </div>
            <i
              className="bi bi-chevron-down d-none d-md-block"
              style={{
                fontSize: '12px',
                color: primaryColor,
                transition: 'transform 0.3s ease',
                transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            ></i>
          </div>

          {showProfileMenu && (
            <div
              className="profile-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                background: isDarkMode ? 'rgba(15, 15, 25, 0.95)' : '#fff',
                borderRadius: '12px',
                boxShadow: isDarkMode ? '0 20px 60px rgba(0, 0, 0, 0.5)' : '0 10px 40px rgba(0,0,0,0.15)',
                border: isDarkMode ? `1px solid rgba(var(--theme-primary-rgb), 0.15)` : `1px solid ${primaryColor}20`,
                minWidth: '220px',
                overflow: 'hidden',
                zIndex: 1000,
                animation: 'slideDown 0.2s ease'
              }}
            >
              <div
                className="dropdown-header"
                style={{
                  padding: '16px',
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  className="profile-avatar"
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: profilePhoto ? 'transparent' : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '20px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    overflow: 'hidden'
                  }}
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    (shopName || userName || userRole || 'U').charAt(0)
                  )}
                </div>
                <div className="profile-details">
                  <div className="profile-name" style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#fff'
                  }}>
                    {shopName || userName || userRole}
                  </div>
                  <div className="profile-email" style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.85)'
                  }}>
                    {userMobile}
                  </div>
                </div>
              </div>
              <div className="profile-menu-list" style={{ padding: '8px' }}>
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={handleNavigateToProfile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '13px',
                    color: isDarkMode ? '#e2e8f0' : '#333'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${primaryColor}10`;
                    e.currentTarget.style.color = primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isDarkMode ? '#e2e8f0' : '#333';
                  }}
                >
                  <i className="bi bi-person-fill" style={{ fontSize: '16px' }}></i>
                  <span>My Profile</span>
                </button>
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={handleChangePassword}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '13px',
                    color: isDarkMode ? '#e2e8f0' : '#333'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${primaryColor}10`;
                    e.currentTarget.style.color = primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isDarkMode ? '#e2e8f0' : '#333';
                  }}
                >
                  <i className="bi bi-lock-fill" style={{ fontSize: '16px' }}></i>
                  <span>Change Password</span>
                </button>
                <hr style={{ margin: '8px 0', borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#eee' }} />
                <button
                  onClick={handleLogout}
                  className="profile-menu-item logout"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '13px',
                    color: '#dc3545'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(220, 53, 69, 0.16)' : '#dc354510';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <i className="bi bi-box-arrow-right" style={{ fontSize: '16px' }}></i>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        show={showChangePasswordModal}
        handleClose={() => setShowChangePasswordModal(false)}
      />

      {/* STOP button pulse + bell swing animations */}
      <style>{`
        @keyframes pulse-stop {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(220, 53, 69, 0); }
        }
        @keyframes bell-header-swing {
          0% { transform: rotate(-12deg); }
          100% { transform: rotate(12deg); }
        }
      `}</style>

    </header>
  );
};

export default Header;
