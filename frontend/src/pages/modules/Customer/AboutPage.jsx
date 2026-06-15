import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const AboutPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#b48a1d';

  const [themeMode, setThemeMode] = React.useState(() => {
    return localStorage.getItem('customerThemeMode') || 'dark';
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    <div className="info-page">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .info-page {
          min-height: 100vh;
          background: ${bgColor};
          color: ${textColor};
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: all 0.3s ease;
          overflow-x: hidden;
        }

        .hero-header {
          background: ${headerBg};
          padding: 80px 20px 100px;
          text-align: center;
          position: relative;
          border-bottom: 1px solid ${borderCol};
        }

        .back-button {
          position: absolute;
          top: 24px;
          left: 24px;
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .back-button:hover {
          background: ${accentGold};
          color: #05070c;
          border-color: ${accentGold};
          transform: translateX(-3px);
        }

        .hero-header h1 {
          color: ${headerTextColor};
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 800;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .hero-header .subtitle {
          color: ${textMuted};
          font-size: 1.15rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards;
          opacity: 0;
        }

        .info-page-content {
          max-width: 850px;
          margin: -60px auto 60px;
          padding: 0 20px;
          position: relative;
          z-index: 1;
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
          opacity: 0;
        }

        .info-card {
          background: ${cardBg};
          border-radius: 24px;
          padding: 48px;
          border: 1px solid ${borderCol};
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
        }

        .info-card h2 {
          color: ${textColor};
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 24px;
          padding-bottom: 15px;
          border-bottom: 1px solid ${borderCol};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-card p {
          color: ${textColor};
          line-height: 1.8;
          font-size: 1.05rem;
          margin-bottom: 24px;
          text-align: left;
          opacity: 0.95;
        }

        .about-highlights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin-top: 36px;
        }

        .about-highlight {
          background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8f9fa'};
          border: 1px solid ${borderCol};
          border-radius: 18px;
          padding: 28px 20px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .about-highlight:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: ${accentGold};
          box-shadow: 0 15px 30px rgba(180, 138, 29, 0.1);
        }

        .about-highlight i {
          color: ${accentGold};
          font-size: 1.4rem;
          margin-bottom: 16px;
          display: inline-flex;
          width: 44px;
          height: 44px;
          background: rgba(180, 138, 29, 0.1);
          border-radius: 12px;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .about-highlight:hover i {
          background: ${accentGold};
          color: #05070c;
        }

        .about-highlight h4 {
          color: ${textColor};
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .about-highlight p {
          margin: 0;
          text-align: left;
          font-size: 0.92rem;
          line-height: 1.6;
          color: ${textMuted};
        }

        @media (max-width: 768px) {
          .hero-header {
            padding: 60px 20px 80px;
          }
          .hero-header h1 {
            font-size: 2.2rem;
          }
          .info-page-content {
            padding: 0 16px;
            margin-top: -40px;
          }
          .info-card {
            padding: 30px 24px;
            border-radius: 20px;
          }
          .info-card h2 {
            font-size: 1.5rem;
          }
          .about-highlights {
            grid-template-columns: 1fr;
            gap: 16px;
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
