import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../../components/auth/AuthLayout';
import authServices from '../../../services/AuthServices';

const SignupMobile = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigate('/admin');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mobile.trim().length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await authServices.sendSignupOtp(mobile.trim());

      if (response.success) {
        toast.success(response.message || 'OTP sent successfully');

        // Navigate with state including the token from API
        navigate('/signup/otp', {
          state: {
            mobile: mobile.trim(),
            token: response.token
          }
        });
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Enter your mobile number to start registration"
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <input
            type="tel"
            className="form-input"
            maxLength={10}
            value={mobile}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, '');
              setMobile(value);
            }}
            placeholder="Enter mobile number"
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

export default SignupMobile;


