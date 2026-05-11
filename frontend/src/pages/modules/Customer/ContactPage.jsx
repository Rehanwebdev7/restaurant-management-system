import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const ContactPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';
  // Contact Info from theme
  const contactAddress = theme.address || '';
  const contactPhone = theme.phone || '';
  const contactEmail = theme.email || '';
  const restaurantName = theme.restaurantName || 'Restaurant';

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
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #eee;
        }
        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .contact-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 30px 25px;
          border-radius: 15px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .contact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .contact-card i {
          font-size: 2.5rem;
          color: ${primaryColor};
          margin-bottom: 15px;
        }
        .contact-card h4 {
          color: #333;
          font-size: 1.2rem;
          margin: 0 0 12px 0;
          font-weight: 600;
        }
        .contact-card p {
          color: #666;
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.7;
        }
        .contact-card .subtitle {
          color: #999;
          font-size: 0.85rem;
          margin-top: 8px;
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
          .contact-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="hero-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>Contact Us</h1>
        <p className="subtitle">Get in touch with {restaurantName}</p>
      </div>

      <div className="info-page-content">
        <div className="info-card">
          <h2>Get in Touch</h2>

          <div className="contact-info-grid">
            {contactAddress && (
              <div className="contact-card">
                <i className="bi bi-geo-alt-fill"></i>
                <h4>Visit Us</h4>
                <p>{contactAddress}</p>
              </div>
            )}
            {contactPhone && (
              <div className="contact-card">
                <i className="bi bi-telephone-fill"></i>
                <h4>Call Us</h4>
                <p>{contactPhone}</p>
                <p className="subtitle">For reservations & inquiries</p>
              </div>
            )}
            {contactEmail && (
              <div className="contact-card">
                <i className="bi bi-envelope-fill"></i>
                <h4>Email Us</h4>
                <p>{contactEmail}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
