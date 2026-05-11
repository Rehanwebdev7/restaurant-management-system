import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import authServices from '../../services/AuthServices';
import { getFCMToken } from '../../firebase/firebase';
import OTPVerification from '../../components/common/OTPVerification';

// Generate a simple device fingerprint
const getDeviceFingerprint = () => {
  const nav = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset()
  ].join('|');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'dev_' + Math.abs(hash).toString(36);
};

const APP_VERSION = '2.2';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // First-time / new device flow states
  const [loginStep, setLoginStep] = useState('credentials'); // 'credentials' | 'otp' | 'setPassword'
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState(''); // 'first_time' | 'new_device'

  // Load saved mobile number on mount
  useEffect(() => {
    const savedMobile = localStorage.getItem('rememberedMobile');
    if (savedMobile) {
      setFormData(prev => ({ ...prev, username: savedMobile }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'username') {
      const formattedValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!username) {
      setError('Please enter mobile number');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      let fcmToken = null;
      try {
        fcmToken = await getFCMToken();
      } catch (fcmError) {
        console.warn("Could not get FCM token:", fcmError);
      }

      const response = await authServices.login(username, password, fcmToken);

      if (response.success) {
        completeLogin(response.success, username);
      } else if (response.errorMsg) {
        // Check if the error indicates first-time login (no password set)
        const errMsg = (response.errorMsg || '').toLowerCase();
        if (errMsg.includes('first time') || errMsg.includes('set password') || errMsg.includes('password not set')) {
          setOtpPurpose('first_time');
          try {
            const otpResult = await authServices.sendForgotPasswordOtp(username);
            if (otpResult.success) {
              setOtpToken(otpResult.token);
              setLoginStep('otp');
              toast.info('First time login. Please verify with OTP to set your password.');
            } else {
              setError(otpResult.message || 'Failed to send OTP');
            }
          } catch {
            setError('Failed to send OTP. Please try again.');
          }
        } else {
          setError(response.errorMsg);
        }
      }
    } catch (error) {
      console.error('Login Error:', error);
      let errorMessage = 'An error occurred. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0 || !error.status) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (loginData, username) => {
    // Handle Remember Me
    if (rememberMe) {
      localStorage.setItem('rememberedMobile', username);
    } else {
      localStorage.removeItem('rememberedMobile');
    }

    // Save device fingerprint as known
    const deviceId = getDeviceFingerprint();
    const knownDevices = JSON.parse(localStorage.getItem('knownDevices') || '[]');
    if (!knownDevices.includes(deviceId)) {
      knownDevices.push(deviceId);
      localStorage.setItem('knownDevices', JSON.stringify(knownDevices));
    }

    // authServices.login() already stored token + role in localStorage.
    // Use hard navigation (not React Router navigate) so checkAuth() on reload reads from localStorage cleanly.
    // This avoids React state timing race between setState and route change.
    toast.success('Login successful!');

    const userRole = loginData.user.role;
    const roleDashboards = {
      supadmin: '/superadmin/dashboard',
      admin: '/superadmin/dashboard',
      restaurant: '/restaurant/dashboard',
      branch: '/branch/dashboard',
      kitchen: '/kitchen/dashboard',
      cashier: '/cashier/dashboard',
      delivery: '/delivery/dashboard',
    };
    window.location.href = roleDashboards[userRole] || '/superadmin/dashboard';
  };

  const handleOtpVerified = async (otp) => {
    try {
      const verifyResult = await authServices.verifyForgotPasswordOtp(otp, otpToken);
      if (verifyResult.success) {
        if (otpPurpose === 'first_time') {
          // First time - go to set password
          setOtpToken(verifyResult.token);
          setLoginStep('setPassword');
          toast.success('OTP verified. Please set your password.');
        } else if (otpPurpose === 'new_device') {
          // New device - complete the pending login
          const pendingLogin = JSON.parse(localStorage.getItem('_pendingLogin') || 'null');
          localStorage.removeItem('_pendingLogin');
          if (pendingLogin) {
            completeLogin(pendingLogin, formData.username.trim());
          } else {
            setError('Session expired. Please login again.');
            setLoginStep('credentials');
          }
        }
      } else {
        toast.error(verifyResult.message || 'Invalid OTP');
      }
    } catch {
      toast.error('OTP verification failed. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    try {
      const otpResult = await authServices.sendForgotPasswordOtp(formData.username.trim());
      if (otpResult.success) {
        setOtpToken(otpResult.token);
        toast.success('OTP resent successfully');
      } else {
        toast.error(otpResult.message || 'Failed to resend OTP');
      }
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must include at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must include at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Password must include at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSettingPassword(true);
    try {
      const result = await authServices.setPassword(newPassword, confirmPassword, otpToken);
      if (result.success) {
        toast.success('Password set successfully! Please login with your new password.');
        setLoginStep('credentials');
        setFormData(prev => ({ ...prev, password: '' }));
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message || 'Failed to set password');
      }
    } catch {
      setError('Failed to set password. Please try again.');
    } finally {
      setSettingPassword(false);
    }
  };

  // OTP Step
  if (loginStep === 'otp') {
    return (
      <AuthLayout
        title={otpPurpose === 'first_time' ? 'Verify Your Identity' : 'New Device Detected'}
        subtitle={otpPurpose === 'first_time'
          ? 'Enter the OTP sent to your registered mobile number to set up your account.'
          : 'For security, please verify with OTP sent to your registered mobile number.'
        }
      >
        <OTPVerification
          show={true}
          onHide={() => {
            setLoginStep('credentials');
            localStorage.removeItem('_pendingLogin');
          }}
          onVerify={handleOtpVerified}
          onResend={handleResendOtp}
          title={otpPurpose === 'first_time' ? 'First Time Verification' : 'Device Verification'}
          message={otpPurpose === 'first_time'
            ? 'Enter the OTP sent to your registered mobile to set up your account.'
            : 'For security, please verify with OTP sent to your registered mobile.'
          }
          mobileNumber={formData.username}
          otpLength={6}
          resendEnabled={true}
        />
      </AuthLayout>
    );
  }

  // Set Password Step (first-time users)
  if (loginStep === 'setPassword') {
    return (
      <AuthLayout
        title="Set Your Password"
        subtitle="Create a strong password for your account."
      >
        {error && (
          <div className="toast-error">
            <div className="toast-content">
              <div className="toast-icon">!</div>
              <div className="toast-text">{error}</div>
              <button className="toast-close" onClick={() => setError('')}>x</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSetPassword}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="password-input-container">
              <input
                type={showNewPassword ? "text" : "password"}
                className="form-input"
                placeholder="Min 8 chars (uppercase, lowercase, number)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Password requirements */}
          <div style={{
            background: '#f0f7ff', borderRadius: '8px', padding: '12px 16px',
            marginBottom: '16px', fontSize: '12px', color: '#555'
          }}>
            <strong style={{ fontSize: '13px', color: '#1a73e8' }}>Password Requirements:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
              <li style={{ color: newPassword.length >= 8 ? '#27ae60' : '#999' }}>Minimum 8 characters</li>
              <li style={{ color: /[A-Z]/.test(newPassword) ? '#27ae60' : '#999' }}>At least one uppercase letter</li>
              <li style={{ color: /[a-z]/.test(newPassword) ? '#27ae60' : '#999' }}>At least one lowercase letter</li>
              <li style={{ color: /[0-9]/.test(newPassword) ? '#27ae60' : '#999' }}>At least one number</li>
            </ul>
          </div>

          <button type="submit" className="signin-btn" disabled={settingPassword}>
            {settingPassword ? "Setting Password..." : "Set Password & Login"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            type="button"
            className="btn btn-link"
            style={{ fontSize: '13px', textDecoration: 'none' }}
            onClick={() => setLoginStep('credentials')}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Default: Credentials Step
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back! Please sign in to your account."
    >
      {error && (
        <div className="toast-error">
          <div className="toast-content">
            <div className="toast-icon">!</div>
            <div className="toast-text">{error}</div>
            <button
              className="toast-close"
              onClick={() => setError('')}
            >
              x
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <input
            type="text"
            name="username"
            className="form-input"
            placeholder="Enter mobile number"
            maxLength={10}
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-input"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
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
          <div className="password-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
          </div>
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Version Info */}
      <div className="text-center mt-3">
        <small style={{ color: '#999', fontSize: '11px' }}>v{APP_VERSION}</small>
      </div>

    </AuthLayout>
  );
};

export default Login;
