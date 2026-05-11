import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const PrivacyPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';
  // Contact Info from theme
  const contactAddress = theme.address || '';
  const contactPhone = theme.phone || '';
  const contactEmail = theme.email || '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="info-page">
      <style>{`
        .info-page {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .hero-header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 50%, ${primaryColor}99 100%);
          padding: 60px 20px 80px;
          text-align: center;
          position: relative;
        }
        .back-button {
          position: absolute;
          top: 20px;
          left: 20px;
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
        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(-3px);
        }
        .hero-header h1 {
          color: white;
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 15px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .hero-header .subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
        }
        .info-page-content {
          max-width: 900px;
          margin: -40px auto 40px;
          padding: 0 20px;
          position: relative;
          z-index: 1;
        }
        .info-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        .info-card h2 {
          color: #333;
          font-size: 1.8rem;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #eee;
        }
        .intro-text {
          color: #666;
          line-height: 1.8;
          font-size: 1.05rem;
          margin-bottom: 30px;
        }
        .info-card h3 {
          color: ${primaryColor};
          font-size: 1.3rem;
          margin: 30px 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #eee;
        }
        .info-card p {
          color: #666;
          line-height: 1.8;
          font-size: 1rem;
          margin-bottom: 15px;
        }
        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 15px 0;
        }
        .info-card ul li {
          color: #666;
          padding: 10px 0 10px 30px;
          position: relative;
          line-height: 1.6;
        }
        .info-card ul li::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 18px;
          width: 8px;
          height: 8px;
          background: ${primaryColor};
          border-radius: 50%;
        }
        .contact-info {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 20px;
          border-radius: 12px;
          margin-top: 15px;
        }
        .contact-info p {
          margin: 8px 0;
          color: #555;
        }
        .disclaimer {
          background: ${primaryColor}15;
          padding: 20px;
          border-radius: 12px;
          margin-top: 30px;
          border-left: 4px solid ${primaryColor};
        }
        .disclaimer p {
          margin: 0;
          color: #555;
          font-style: italic;
        }
        @media (max-width: 768px) {
          .hero-header {
            padding: 40px 20px 60px;
          }
          .hero-header h1 {
            font-size: 2rem;
          }
          .info-page-content {
            padding: 0 15px;
            margin-top: -30px;
          }
          .info-card {
            padding: 25px 20px;
            border-radius: 15px;
          }
          .info-card h2 {
            font-size: 1.4rem;
          }
        }
      `}</style>

      <div className="hero-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>Privacy Policy</h1>
        <p className="subtitle">Last updated: December 1, 2024</p>
      </div>

      <div className="info-page-content">
        <div className="info-card">
          <h2>Privacy Policy</h2>
          <p className="intro-text">
            At {theme.restaurantName}, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and protect your data when you interact with our restaurant, website, or services.
          </p>

          <h3>Information We Collect</h3>
          <ul>
            <li>Personal information (name, email, phone number) when you make a reservation</li>
            <li>Dining preferences and dietary restrictions</li>
            <li>Payment information for online orders</li>
            <li>Location data when using our delivery services</li>
            <li>Usage data and analytics when you visit our website</li>
          </ul>

          <h3>How We Use Your Information</h3>
          <ul>
            <li>Process reservations and food orders</li>
            <li>Communicate with you about your bookings and orders</li>
            <li>Send promotional offers and updates (with your consent)</li>
            <li>Improve our services and menu offerings</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h3>Data Protection</h3>
          <ul>
            <li>We use industry-standard encryption to protect your data</li>
            <li>Access to personal information is restricted to authorized personnel only</li>
            <li>Regular security audits are conducted</li>
            <li>We do not sell your personal information to third parties</li>
          </ul>

          <h3>Your Rights</h3>
          <ul>
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability upon request</li>
          </ul>

          <h3>Cookies and Tracking</h3>
          <ul>
            <li>We use cookies to enhance your browsing experience</li>
            <li>Analytics cookies help us understand website usage</li>
            <li>You can disable cookies in your browser settings</li>
            <li>Third-party services may use their own cookies</li>
          </ul>

          <h3>Contact Information</h3>
          <div className="contact-info">
            {contactEmail && <p><strong>For privacy concerns:</strong> {contactEmail}</p>}
            {contactPhone && <p><strong>Phone:</strong> {contactPhone}</p>}
            {contactAddress && <p><strong>Address:</strong> {contactAddress}</p>}
          </div>

          <h3>Updates to This Policy</h3>
          <p>We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.</p>

          <div className="disclaimer">
            <p>By using our services, you agree to the collection and use of information in accordance with this privacy policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
