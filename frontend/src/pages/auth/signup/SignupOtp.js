import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../../components/auth/AuthLayout';
import authServices from '../../../services/AuthServices';

const SignupOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mobile, token } = location.state || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mobile || !token) {
      navigate('/signup', { replace: true });
    }
  }, [mobile, token, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await authServices.verifySignupOtp(otp.trim(), token);

      if (response.success) {
        toast.success(response.message || 'OTP verified successfully');

        // Navigate to business details with data from API response
        navigate('/signup/business', {
          state: {
            mobile: response.data.mobile,
            restaurantId: response.data.restaurantId,
            signupToken: response.data.token || response.token
          }
        });
      } else {
        toast.error(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/signup');
  };

  return (
    <AuthLayout
      title="Verify mobile"
      subtitle={`Enter OTP sent to ${mobile || 'your mobile number'}`}
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">OTP</label>
          <input
            type="tel"
            className="form-input"
            maxLength={6}
            value={otp}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, '');
              setOtp(value);
            }}
            placeholder="Enter 6-digit OTP"
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

export default SignupOtp;


