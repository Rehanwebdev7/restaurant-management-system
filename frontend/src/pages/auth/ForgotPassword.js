import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import showToast from '../../utils/toast';
import AuthLayout from '../../components/auth/AuthLayout';
import authServices from '../../services/AuthServices';

const ForgotPassword = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { value } = e.target;
    const formattedValue = value.replace(/\D/g, '');
    setMobile(formattedValue.slice(0, 10));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authServices.sendForgotPasswordOtp(mobile);

      if (response.success) {
        // Store mobile and token for verification
        localStorage.setItem('resetMobile', mobile);
        localStorage.setItem('resetToken', response.token);

        showToast.success(response.message || 'OTP sent successfully.');
        navigate('/verify-otp', { state: { mobile, token: response.token } });
      } else {
        showToast.error(response.message || 'Failed to send OTP');
        setError(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      const errorMessage = 'An error occurred. Please try again.';
      showToast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/admin');
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your registered mobile number to receive an OTP."
      onBack={handleBackToLogin}
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
          <label className="form-label">Mobile Number</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter mobile number"
            value={mobile}
            onChange={handleChange}
            maxLength={10}
            required
          />
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
