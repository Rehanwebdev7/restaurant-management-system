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
          <p>
            Tucked away in the historic heart of Daryaganj, Delhi, our restaurant is more than just a place to eat—it's a journey into the soul of Old Delhi's iconic Mughlai cuisine. Inspired by the grandeur of royal kitchens and the timeless flavors of Purani Dilli, we bring together tradition, taste, and togetherness under one roof.
          </p>
          <p>
            Our kitchen follows age-old recipes, slow-cooking techniques, and authentic spice blends to create dishes that are rich, aromatic, and deeply satisfying. From succulent kebabs and velvety curries to fragrant biryanis and freshly baked tandoori rotis and naans, every plate reflects our commitment to preserving the true essence of Mughlai food.
          </p>
          <p>
            To make the experience even more fulfilling, we offer thoughtfully curated unlimited combo meals, allowing our guests to enjoy a wide variety of dishes without limits. These combos are designed for those who love to indulge, share, and explore multiple flavors in one memorable meal—perfect for families, friends, and food lovers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
