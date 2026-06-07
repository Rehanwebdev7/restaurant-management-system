import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const AboutPage = () => {
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
        .info-card p {
          color: #666;
          line-height: 1.9;
          font-size: 1.05rem;
          margin-bottom: 20px;
          text-align: justify;
        }
        .about-highlights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        .about-highlight {
          background: linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%);
          border: 1px solid #edf2f7;
          border-radius: 14px;
          padding: 18px 16px;
        }
        .about-highlight i {
          color: ${primaryColor};
          font-size: 1.25rem;
          margin-bottom: 10px;
          display: inline-flex;
        }
        .about-highlight h4 {
          color: #222;
          margin: 0 0 8px 0;
          font-size: 1rem;
        }
        .about-highlight p {
          margin: 0;
          text-align: left;
          font-size: 0.92rem;
          line-height: 1.6;
          color: #666;
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
          .info-card p {
            font-size: 1rem;
          }
          .about-highlights {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="hero-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>About Us</h1>
        <p className="subtitle">Know more about {theme.restaurantName}</p>
      </div>

      <div className="info-page-content">
        <div className="info-card">
          <h2>Welcome to {theme.restaurantName}</h2>
          {theme.aboutUs && (
            <p>{theme.aboutUs}</p>
          )}
          {theme.ourMission && (
            <p><strong>Our Mission:</strong> {theme.ourMission}</p>
          )}
          {theme.ourVision && (
            <p><strong>Our Vision:</strong> {theme.ourVision}</p>
          )}
          {!theme.aboutUs && !theme.ourMission && !theme.ourVision && (
            <p>Welcome to {theme.restaurantName}. We are committed to serving delicious food with friendly service.</p>
          )}

          <div className="about-highlights">
            <div className="about-highlight">
              <i className="bi bi-award"></i>
              <h4>Quality First</h4>
              <p>Every dish is prepared with consistency, hygiene, and careful attention to detail.</p>
            </div>
            <div className="about-highlight">
              <i className="bi bi-people"></i>
              <h4>Customer Focused</h4>
              <p>Our team makes sure every customer has a warm, comfortable, and happy visit.</p>
            </div>
            <div className="about-highlight">
              <i className="bi bi-heart"></i>
              <h4>Made With Care</h4>
              <p>We keep the taste familiar while improving our presentation and service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
