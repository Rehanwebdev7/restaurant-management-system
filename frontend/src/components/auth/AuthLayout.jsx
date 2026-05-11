import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AuthLayout = ({ title, subtitle, children, onBack }) => {
  const { logoUrl, restaurantName } = useTheme();

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Left panel - Branding */}
        <div className="auth-left-panel">
          <div className="auth-left-content">
            <div className="auth-brand-icon">
              <i className="bi bi-shop"></i>
            </div>
            <h1 className="auth-brand-name">SMR</h1>
            <p className="auth-brand-tagline">Smart Restaurant Management</p>
          </div>
        </div>

        {/* Right panel - Form */}
        <div className="auth-right-panel">
          {onBack && (
            <button type="button" onClick={onBack} className="auth-back-btn" aria-label="Go back">
              <i className="bi bi-chevron-left"></i>
            </button>
          )}

          <div className="auth-form-container">
            <div className="auth-form-header">
              <img
                src={logoUrl || "/app-favicon.svg"}
                alt={restaurantName || "Restaurant Logo"}
                className="auth-logo"
                onError={(e) => { e.target.src = "/app-favicon.svg"; }}
              />
            </div>

            <div className="auth-form-content">
              {title && <h2 className="auth-title">{title}</h2>}
              {subtitle && <p className="auth-subtitle">{subtitle}</p>}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
