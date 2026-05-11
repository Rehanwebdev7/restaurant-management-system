import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const TermsPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';

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
        <h1>Terms & Conditions</h1>
        <p className="subtitle">Last updated: December 1, 2024</p>
      </div>

      <div className="info-page-content">
        <div className="info-card">
          <h2>Terms & Conditions</h2>

          <h3>1. Acceptance of Terms</h3>
          <p>By accessing and using the {theme.restaurantName} website and services, you accept and agree to be bound by the terms and provisions of this agreement.</p>

          <h3>2. Use of Service</h3>
          <p>You agree to use the service only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account information.</p>

          <h3>3. Orders and Payments</h3>
          <p>All orders are subject to availability. Prices are subject to change without notice. Payment must be made at the time of ordering through our accepted payment methods.</p>

          <h3>4. Delivery</h3>
          <p>We strive to deliver your order within the estimated time. However, delivery times may vary based on location, weather conditions, and order volume.</p>

          <h3>5. Cancellations</h3>
          <p>Orders can be cancelled within 5 minutes of placing. After the food preparation begins, cancellations may not be accepted.</p>

          <h3>6. Quality Assurance</h3>
          <p>We are committed to delivering fresh, quality food. If you are not satisfied with your order, please contact us immediately.</p>

          <h3>7. Intellectual Property</h3>
          <p>All content on this website, including logos, images, and text, is the property of {theme.restaurantName} and protected by copyright laws.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
