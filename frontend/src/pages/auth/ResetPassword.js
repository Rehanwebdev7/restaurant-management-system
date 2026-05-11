import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import showToast from '../../utils/toast';
import AuthLayout from '../../components/auth/AuthLayout';
import authServices from '../../services/AuthServices';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const mobile = location.state?.mobile || localStorage.getItem('resetMobile') || '';
  const tokenFromState = location.state?.token;
  const storedToken = localStorage.getItem('resetToken');
  const token = tokenFromState || storedToken || '';

  useEffect(() => {
    if (!mobile || !token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [mobile, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authServices.setPassword(password, confirmPassword, token);

      if (response.success) {
        showToast.success(response.message || 'Password updated successfully.');

        // Clear reset data from localStorage
        localStorage.removeItem('resetMobile');
        localStorage.removeItem('resetToken');

        navigate('/admin');
      } else {
        showToast.error(response.message || 'Failed to set password');
        setError(response.message || 'Failed to set password');
      }
    } catch (error) {
      console.error('Set Password Error:', error);
      const errorMessage = 'An error occurred. Please try again.';
      showToast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/verify-otp', { state: { mobile } });
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={`Set a new password for ${mobile ? `+91 ${mobile}` : 'your account'}.`}
      onBack={handleBack}
    >
      {error && (
        <div className="toast-error">
          <div className="toast-content">
            <div className="toast-icon">⚠️</div>
            <div className="toast-text">{error}</div>
            <button className="toast-close" onClick={() => setError('')}>
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) {
                  setError('');
                }
              }}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="form-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) {
                  setError('');
                }
              }}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? 'Updating password...' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
