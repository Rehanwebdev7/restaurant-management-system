import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../../components/auth/AuthLayout';

const maskValue = (value = '') => (value ? '•'.repeat(Math.min(8, value.length)) : '—');

const SignupSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { credentials } = location.state || {};
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (!credentials) {
      navigate('/signup', { replace: true });
    }
  }, [credentials, navigate]);

  const handleBack = () => {
    navigate('/admin');
  };

  const password = credentials?.password || '';
  const pin = credentials?.pin || '';

  const copyToClipboard = async (label, value) => {
    if (!value) {
      toast.error(`No ${label} available to copy`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleFinish = () => {
    navigate('/admin');
  };

  const cardBaseStyle = {
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  };

  const headerAccentStyle = (color) => ({
    width: '3rem',
    height: '3rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color,
    color: '#0f172a',
    fontWeight: 600,
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  });

  const detailRowStyle = {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '1.25rem',
    padding: '0.85rem 1.25rem',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.25)',
  };

  const detailLabelStyle = {
    color: '#64748b',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.7rem',
  };

  const detailValueStyle = {
    fontWeight: 600,
    color: '#0f172a',
    fontSize: '1.05rem',
    letterSpacing: '0.02em',
  };

  const credentialRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.6)',
    color: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.35)',
  };

  const credentialLabelStyle = {
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.7rem',
    color: 'rgba(226, 232, 240, 0.75)',
    marginBottom: '0.35rem',
  };

  return (
    <AuthLayout
      title="Registration completed"
      subtitle="Your account is ready. Save the credentials below."
      onBack={handleBack}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        <div
          style={{
            ...cardBaseStyle,
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 75%)',
          }}
        >
          <div style={sectionHeaderStyle}>
            <div style={headerAccentStyle('rgba(59, 130, 246, 0.16)')}>
              AD
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>Account details</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                Keep these profile details handy for support and verification.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>Mobile</span>
              <span style={detailValueStyle}>{credentials?.mobile || '—'}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>Unique ID</span>
              <span style={detailValueStyle}>{credentials?.uniqueId || '—'}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardBaseStyle,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#e2e8f0',
          }}
        >
          <div style={sectionHeaderStyle}>
            <div style={headerAccentStyle('rgba(148, 163, 184, 0.22)')}>
              CR
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>Credentials</h3>
              <p style={{ margin: 0, color: 'rgba(148, 163, 184, 0.82)', fontSize: '0.88rem' }}>
                Copy and store these credentials securely. They will not be shown again.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={credentialRowStyle}>
              <div>
                <span style={credentialLabelStyle}>Password</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  {showPassword ? password || '—' : maskValue(password)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="signup-link"
                  style={{
                    background: 'rgba(59, 130, 246, 0.26)',
                    color: '#f8fafc',
                    borderRadius: '999px',
                    padding: '0.35rem 0.9rem',
                    fontWeight: 600,
                    border: 'none',
                    letterSpacing: '0.04em',
                    fontSize: '0.75rem',
                  }}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="signup-link"
                  style={{
                    background: 'rgba(59, 130, 246, 0.26)',
                    color: '#f8fafc',
                    borderRadius: '999px',
                    padding: '0.35rem 0.9rem',
                    fontWeight: 600,
                    border: 'none',
                    letterSpacing: '0.04em',
                    fontSize: '0.75rem',
                  }}
                  onClick={() => copyToClipboard('Password', password)}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={credentialRowStyle}>
              <div>
                <span style={credentialLabelStyle}>PIN</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  {showPin ? pin || '—' : maskValue(pin)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="signup-link"
                  style={{
                    background: 'rgba(59, 130, 246, 0.26)',
                    color: '#f8fafc',
                    borderRadius: '999px',
                    padding: '0.35rem 0.9rem',
                    fontWeight: 600,
                    border: 'none',
                    letterSpacing: '0.04em',
                    fontSize: '0.75rem',
                  }}
                  onClick={() => setShowPin((prev) => !prev)}
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="signup-link"
                  style={{
                    background: 'rgba(59, 130, 246, 0.26)',
                    color: '#f8fafc',
                    borderRadius: '999px',
                    padding: '0.35rem 0.9rem',
                    fontWeight: 600,
                    border: 'none',
                    letterSpacing: '0.04em',
                    fontSize: '0.75rem',
                  }}
                  onClick={() => copyToClipboard('PIN', pin)}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <button type="button" className="signin-btn" onClick={handleFinish}>
          Go to Login
        </button>
      </div>
    </AuthLayout>
  );
};

export default SignupSuccess;


