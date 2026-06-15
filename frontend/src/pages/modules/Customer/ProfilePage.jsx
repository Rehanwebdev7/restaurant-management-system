import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#b48a1d';

  const [customer, setCustomer] = useState(null);
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('customerThemeMode') || 'dark';
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    // Get customer data from localStorage
    const customerData = localStorage.getItem('customerData');
    if (customerData) {
      setCustomer(JSON.parse(customerData));
    } else {
      // Not logged in, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    localStorage.removeItem('customerId');
    localStorage.removeItem('customerMobile');
    localStorage.removeItem('customerName');
    navigate('/menu');
  };

  if (!customer) {
    return null;
  }

  const isDark = themeMode === 'dark';
  const bgColor = isDark ? '#05070c' : '#f5f2eb';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f4efe6' : '#1c1917';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 0, 0, 0.06)';
  const accentGold = '#b48a1d';
  const headerBg = isDark 
    ? 'linear-gradient(135deg, #0f172a 0%, #05070c 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f5f2eb 100%)';
  const headerTextColor = isDark ? '#f4efe6' : '#1c1917';

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
          min-height: 100vh;
          background: ${bgColor};
          color: ${textColor};
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: all 0.3s ease;
        }

        .profile-header {
          background: ${headerBg};
          padding: 24px 24px 120px;
          position: relative;
          border-bottom: 1px solid ${borderCol};
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 600px;
          margin: 0 auto;
        }

        .back-btn {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border: 1px solid ${borderCol};
          color: ${headerTextColor};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: ${accentGold};
          color: #05070c;
          border-color: ${accentGold};
          transform: translateX(-2px);
        }

        .header-title {
          color: ${headerTextColor};
          font-size: 20px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .logout-btn {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border: 1px solid ${borderCol};
          color: ${headerTextColor};
          padding: 9px 18px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .logout-btn:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          transform: translateY(-1px);
        }

        .profile-content {
          max-width: 600px;
          margin: -80px auto 40px;
          padding: 0 20px;
          position: relative;
          z-index: 1;
        }

        .profile-card {
          background: ${cardBg};
          border: 1px solid ${borderCol};
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .profile-avatar-section {
          text-align: center;
          padding: 40px 24px 32px;
          border-bottom: 1px solid ${borderCol};
          background: linear-gradient(to bottom, ${cardBg} 0%, ${isDark ? '#0c101b' : '#faf9f6'} 100%);
        }

        .profile-avatar {
          width: 110px;
          height: 110px;
          background: linear-gradient(135deg, ${accentGold}, #d4af37);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 4px solid ${isDark ? '#0f172a' : '#ffffff'};
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          font-size: 44px;
          color: #05070c;
          font-weight: 700;
        }

        .profile-avatar i {
          font-size: 50px;
          color: #05070c;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .profile-name {
          font-size: 24px;
          font-weight: 800;
          color: ${textColor};
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .profile-mobile {
          color: ${textMuted};
          font-size: 15px;
          font-weight: 600;
        }

        .profile-details {
          padding: 24px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          padding: 16px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8f9fa'};
          border: 1px solid ${borderCol};
          border-radius: 16px;
          margin-bottom: 14px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-icon {
          width: 44px;
          height: 44px;
          background: rgba(180, 138, 29, 0.12);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
        }

        .detail-icon i {
          font-size: 20px;
          color: ${accentGold};
        }

        .detail-content {
          flex: 1;
        }

        .detail-label {
          font-size: 11px;
          color: ${textMuted};
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 2px;
          font-weight: 700;
        }

        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: ${textColor};
        }

        .menu-section {
          background: ${cardBg};
          border: 1px solid ${borderCol};
          border-radius: 24px;
          margin-top: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .menu-item {
          display: flex;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid ${borderCol};
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .menu-item:last-child {
          border-bottom: none;
        }

        .menu-item:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8f9fa'};
          padding-left: 28px;
        }

        .menu-icon {
          width: 40px;
          height: 40px;
          background: rgba(180, 138, 29, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 14px;
          transition: all 0.3s;
        }

        .menu-item:hover .menu-icon {
          background: ${accentGold};
        }

        .menu-item:hover .menu-icon i {
          color: #05070c;
        }

        .menu-icon i {
          font-size: 18px;
          color: ${accentGold};
          transition: all 0.3s;
        }

        .menu-text {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          color: ${textColor};
        }

        .menu-arrow {
          color: ${textMuted};
          transition: transform 0.3s;
        }

        .menu-item:hover .menu-arrow {
          transform: translateX(4px);
          color: ${accentGold};
        }

        .logout-section {
          padding: 24px 0;
        }

        .logout-full-btn {
          width: 100%;
          padding: 16px;
          background: transparent;
          border: 2px solid #ef4444;
          color: #ef4444;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .logout-full-btn:hover {
          background: #ef4444;
          color: white;
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25);
          transform: translateY(-2px);
        }

        @media (max-width: 480px) {
          .profile-header {
            padding: 16px 16px 80px;
          }
          .profile-content {
            padding: 0 16px;
            margin-top: -50px;
          }
          .profile-avatar {
            width: 80px;
            height: 80px;
          }
          .profile-avatar i {
            font-size: 36px;
          }
          .profile-name {
            font-size: 20px;
          }
        }
      `}</style>

      <div className="profile-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/menu')}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <span className="header-title">My Profile</span>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {customer.photoUrl ? (
                <img src={customer.photoUrl} alt="Profile" />
              ) : (
                <i className="bi bi-person-fill"></i>
              )}
            </div>
            <h2 className="profile-name">{customer.name || 'Guest User'}</h2>
            <p className="profile-mobile">+91 {customer.mobileNumber}</p>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-phone"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Mobile Number</div>
                <div className="detail-value">+91 {customer.mobileNumber}</div>
              </div>
            </div>

            {customer.email && (
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="bi bi-envelope"></i>
                </div>
                <div className="detail-content">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{customer.email}</div>
                </div>
              </div>
            )}

            {customer.dateOfBirth && (
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="bi bi-calendar"></i>
                </div>
                <div className="detail-content">
                  <div className="detail-label">Date of Birth</div>
                  <div className="detail-value">
                    {new Date(customer.dateOfBirth).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            )}

            {customer.createdAt && (
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="detail-content">
                  <div className="detail-label">Member Since</div>
                  <div className="detail-value">
                    {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Account Status</div>
                <div className="detail-value" style={{ color: customer.isActive ? '#22c55e' : '#ef4444' }}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="menu-section">
          <div className="menu-item" onClick={() => navigate('/orders')}>
            <div className="menu-icon">
              <i className="bi bi-bag"></i>
            </div>
            <span className="menu-text">My Orders</span>
            <i className="bi bi-chevron-right menu-arrow"></i>
          </div>
          <div className="menu-item" onClick={() => navigate('/addresses')}>
            <div className="menu-icon">
              <i className="bi bi-geo-alt"></i>
            </div>
            <span className="menu-text">Saved Addresses</span>
            <i className="bi bi-chevron-right menu-arrow"></i>
          </div>
          <div className="menu-item" onClick={() => navigate('/about')}>
            <div className="menu-icon">
              <i className="bi bi-info-circle"></i>
            </div>
            <span className="menu-text">About Us</span>
            <i className="bi bi-chevron-right menu-arrow"></i>
          </div>
          <div className="menu-item" onClick={() => navigate('/contact')}>
            <div className="menu-icon">
              <i className="bi bi-headset"></i>
            </div>
            <span className="menu-text">Contact Support</span>
            <i className="bi bi-chevron-right menu-arrow"></i>
          </div>
        </div>

        <div className="logout-section">
          <button className="logout-full-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
