import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AuthLayout = ({ title, subtitle, children, onBack }) => {
  const { primaryColor } = useTheme();

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
            {/* Header: colored icon + title */}
            <div className="auth-form-header">
              <div style={{
                width: 52, height: 52, borderRadius: '14px',
                background: primaryColor || '#3B82F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: `0 8px 24px ${(primaryColor || '#3B82F6')}40`
              }}>
                <i className="bi bi-shop" style={{ fontSize: '22px', color: '#fff' }}></i>
              </div>
              {title && <h2 className="auth-title">{title}</h2>}
              {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            </div>

            <div className="auth-form-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
