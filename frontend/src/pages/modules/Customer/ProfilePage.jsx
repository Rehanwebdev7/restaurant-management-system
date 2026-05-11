import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';

  const [customer, setCustomer] = useState(null);

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

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
          min-height: 100vh;
          background: #fdf0ee;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .profile-header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}99 100%);
          padding: 16px 24px 120px;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
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
          background: rgba(255, 255, 255, 0.3);
        }

        .header-title {
          color: white;
          font-size: 20px;
          font-weight: 600;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: white;
          padding: 9px 18px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          letter-spacing: 0.3px;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.85);
          border-color: rgba(239, 68, 68, 1);
        }

        .profile-content {
          max-width: 600px;
          margin: -60px auto 40px;
          padding: 0 20px;
          position: relative;
          z-index: 1;
        }

        .profile-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
        }

        .profile-avatar-section {
          text-align: center;
          padding: 40px 24px 32px;
          border-bottom: 1px solid #f0f0f0;
          background: linear-gradient(135deg, rgba(255,255,255,1) 0%, ${primaryColor}04 100%);
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 5px solid white;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          font-size: 48px;
          color: white;
          font-weight: 700;
        }

        .profile-avatar i {
          font-size: 56px;
          color: white;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .profile-name {
          font-size: 26px;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .profile-mobile {
          color: #888;
          font-size: 15px;
          font-weight: 500;
        }

        .profile-details {
          padding: 20px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-icon {
          width: 44px;
          height: 44px;
          background: ${primaryColor}15;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
        }

        .detail-icon i {
          font-size: 20px;
          color: ${primaryColor};
        }

        .detail-content {
          flex: 1;
        }

        .detail-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .menu-section {
          background: white;
          border-radius: 20px;
          margin-top: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .menu-item {
          display: flex;
          align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-item:last-child {
          border-bottom: none;
        }

        .menu-item:hover {
          background: #f8f9fa;
        }

        .menu-icon {
          width: 40px;
          height: 40px;
          background: ${primaryColor}10;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 14px;
        }

        .menu-icon i {
          font-size: 18px;
          color: ${primaryColor};
        }

        .menu-text {
          flex: 1;
          font-size: 15px;
          font-weight: 500;
          color: #333;
        }

        .menu-arrow {
          color: #ccc;
        }

        .logout-section {
          padding: 20px;
        }

        .logout-full-btn {
          width: 100%;
          padding: 16px;
          background: #fff;
          border: 2px solid #ff4757;
          color: #ff4757;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .logout-full-btn:hover {
          background: #ff4757;
          color: white;
        }

        @media (max-width: 480px) {
          .profile-header {
            padding: 15px 15px 80px;
          }
          .profile-content {
            padding: 0 15px;
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
