import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AuthLayout = ({ title, subtitle, children, onBack }) => {
  const {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    logoUrl,
    restaurantName,
    fontColor,
  } = useTheme();

  const brandName = restaurantName || 'Restaurant Suite';
  const accent = primaryColor || '#3B82F6';
  const accent2 = secondaryColor || '#1e3a8a';
  const accent3 = tertiaryColor || '#14b8a6';
  const brandText = fontColor || '#0f172a';

  return (
    <div className="auth-container">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-grid" />
      <div className="auth-card">
        {/* Left panel - Branding */}
        <div
          className="auth-left-panel"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accent2} 58%, ${accent3} 100%)`,
            color: '#fff',
          }}
        >
          <div className="auth-left-panel-overlay" />
          <div className="auth-left-content">
            <div className="auth-brand-icon auth-brand-logo-shell">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="auth-brand-logo" />
              ) : (
                <i className="bi bi-shop"></i>
              )}
            </div>
            <div className="auth-brand-copy">
              <h1 className="auth-brand-name">{brandName}</h1>
              <p className="auth-brand-tagline">White-label restaurant SaaS built for scale</p>
            </div>
            <div className="auth-brand-pills">
              <span className="auth-brand-pill">Tenant aware</span>
              <span className="auth-brand-pill">Mobile ready</span>
              <span className="auth-brand-pill">Theme driven</span>
            </div>
            <div className="auth-brand-highlights">
              <div className="auth-mini-stat">
                <span>01</span>
                <strong>Logo based identity</strong>
              </div>
              <div className="auth-mini-stat">
                <span>02</span>
                <strong>Restaurant specific colors</strong>
              </div>
              <div className="auth-mini-stat">
                <span>03</span>
                <strong>Reusable SaaS modules</strong>
              </div>
            </div>
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
                background: `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: `0 10px 30px ${accent}40`
              }}>
                <i className="bi bi-shop" style={{ fontSize: '22px', color: '#fff' }}></i>
              </div>
              {title && <h2 className="auth-title" style={{ color: brandText }}>{title}</h2>}
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
