import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';

const RefundPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';
  // Contact Info from theme
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
        .highlight-box {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          border-left: 4px solid ${primaryColor};
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }
        .highlight-box i {
          color: ${primaryColor};
          font-size: 1.5rem;
          margin-top: 2px;
        }
        .highlight-box p {
          margin: 0;
          color: #333;
          font-size: 1rem;
          line-height: 1.6;
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
        .refund-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .refund-table th {
          background: ${primaryColor};
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }
        .refund-table td {
          padding: 15px;
          border-bottom: 1px solid #eee;
          color: #666;
        }
        .refund-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        .refund-table tr:last-child td {
          border-bottom: none;
        }
        .status-full {
          color: #10b981;
          font-weight: 600;
        }
        .status-partial {
          color: #f59e0b;
          font-weight: 600;
        }
        .status-none {
          color: #ef4444;
          font-weight: 600;
        }
        .status-case {
          color: #6366f1;
          font-weight: 600;
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
        .important-note {
          background: #fef3c7;
          padding: 20px;
          border-radius: 12px;
          margin-top: 30px;
          border-left: 4px solid #f59e0b;
        }
        .important-note h4 {
          color: #92400e;
          margin: 0 0 10px 0;
        }
        .important-note p {
          margin: 0;
          color: #78350f;
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
          .refund-table {
            font-size: 0.9rem;
          }
          .refund-table th, .refund-table td {
            padding: 10px 8px;
          }
        }
      `}</style>

      <div className="hero-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>Refund Policy</h1>
        <p className="subtitle">Last updated: December 1, 2024</p>
      </div>

      <div className="info-page-content">
        <div className="info-card">
          <h2>Refund Policy</h2>

          <div className="highlight-box">
            <i className="bi bi-info-circle-fill"></i>
            <p>We strive to provide the best dining experience. If you're not satisfied, please let us know immediately so we can make it right.</p>
          </div>

          <p className="intro-text">
            At {theme.restaurantName}, customer satisfaction is our priority. This refund policy outlines the conditions under which refunds are provided for reservations, orders, and other services.
          </p>

          <h3>Refund Eligibility</h3>
          <table className="refund-table">
            <thead>
              <tr>
                <th>Condition</th>
                <th>Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cancellation 24+ hours before reservation</td>
                <td className="status-full">100% refund</td>
              </tr>
              <tr>
                <td>Cancellation 12-24 hours before reservation</td>
                <td className="status-partial">50% refund</td>
              </tr>
              <tr>
                <td>Cancellation less than 12 hours</td>
                <td className="status-none">No refund</td>
              </tr>
              <tr>
                <td>No-show without notice</td>
                <td className="status-none">No refund</td>
              </tr>
              <tr>
                <td>Quality issues reported immediately</td>
                <td className="status-case">Case-by-case basis</td>
              </tr>
            </tbody>
          </table>

          <h3>Reservation Refunds</h3>
          <ul>
            <li>Pre-paid reservations can be cancelled according to the timeline above</li>
            <li>Special event bookings may have different cancellation terms</li>
            <li>Group reservations (8+ guests) require 48-hour notice for full refund</li>
            <li>Refunds are processed within 5-7 business days</li>
          </ul>

          <h3>Online Order Refunds</h3>
          <ul>
            <li>Orders can be cancelled within 5 minutes of placement for full refund</li>
            <li>Once food preparation begins, no cancellation is possible</li>
            <li>Incorrect or missing items will be refunded or replaced</li>
            <li>Quality issues must be reported within 30 minutes of delivery</li>
          </ul>

          <h3>Gift Card Policy</h3>
          <ul>
            <li>Gift cards are non-refundable</li>
            <li>No cash value or change given</li>
            <li>Lost or stolen cards cannot be replaced</li>
            <li>Valid for 2 years from purchase date</li>
          </ul>

          <h3>How to Request a Refund</h3>
          <ul>
            {contactEmail && <li>Contact us immediately at {contactEmail}</li>}
            <li>Provide order number or reservation confirmation</li>
            <li>Include photos for quality-related issues</li>
            <li>Allow 5-7 business days for processing</li>
          </ul>

          <div className="important-note">
            <h4>Important Notes</h4>
            <p>Refunds are issued to the original payment method only. Processing times may vary depending on your bank or credit card company. For catering orders or large events, please refer to your specific contract terms as different policies may apply.</p>
          </div>

          <h3>Contact for Refunds</h3>
          <div className="contact-info">
            {contactEmail && <p><strong>Email:</strong> {contactEmail}</p>}
            {contactPhone && <p><strong>Phone:</strong> {contactPhone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;
