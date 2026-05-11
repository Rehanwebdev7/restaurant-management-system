import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import showToast from '../../utils/toast';
import AuthLayout from '../../components/auth/AuthLayout';
import authServices from '../../services/AuthServices';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const mobileFromState = location.state?.mobile;
  const tokenFromState = location.state?.token;
  const storedMobile = localStorage.getItem('resetMobile');
  const storedToken = localStorage.getItem('resetToken');

  const mobile = mobileFromState || storedMobile || '';
  const token = tokenFromState || storedToken || '';

  useEffect(() => {
    if (!mobile || !token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [mobile, token, navigate]);

  const handleChange = (e) => {
    const { value } = e.target;
    const formattedValue = value.replace(/\D/g, '');
    setOtp(formattedValue.slice(0, 6));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authServices.verifyForgotPasswordOtp(otp, token);

      if (response.success) {
        // Store the new token for reset password
        localStorage.setItem('resetToken', response.token);

        showToast.success(response.message || 'OTP verified successfully.');
        navigate('/reset-password', { state: { mobile, token: response.token } });
      } else {
        showToast.error(response.message || 'Invalid OTP');
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      const errorMessage = 'An error occurred. Please try again.';
      showToast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/forgot-password');
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the OTP sent to ${mobile ? `+91 ${mobile}` : 'your registered mobile number'}.`}
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
          <label className="form-label">OTP</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={handleChange}
            maxLength={6}
            required
          />
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default VerifyOtp;
