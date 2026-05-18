import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentTheme, getRestaurantId } from '../../../services/themeService';
import { ApiPost } from '../../../ApiServices/CustomerApiServices';
import { getFCMToken } from '../../../firebase/firebase';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/menu';
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';

  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);

  useEffect(() => {
    // If customer is already logged in, redirect to menu
    const customerToken = localStorage.getItem('customerToken');
    if (customerToken) {
      navigate('/menu', { replace: true });
      return;
    }
    window.scrollTo(0, 0);
  }, [navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      // MOCK: Skip API call for dev, use static OTP 123456
      console.log('🔐 [MOCK LOGIN] Mobile:', mobile, '| OTP: 123456');
      setToken('MOCK_DEV_TOKEN');
      setStep('otp');
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // MOCK: Accept OTP 123456 for dev, skip API
      if (otpString === '123456') {
        console.log('✅ [MOCK LOGIN] OTP Verified!');
        const mockCustomer = {
          id: 1,
          name: 'Customer',
          mobileNumber: mobile,
          email: ''
        };
        localStorage.setItem('customerToken', 'MOCK_DEV_TOKEN');
        localStorage.setItem('customerData', JSON.stringify(mockCustomer));
        localStorage.setItem('customerId', mockCustomer.id);
        localStorage.setItem('customerMobile', mobile);
        localStorage.setItem('customerName', mockCustomer.name);
        navigate(redirectPath, { replace: true });
      } else {
        setError('Invalid OTP. Use 123456 for now (dev mode)');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError('');
    try {
      // MOCK: Skip API, just reset timer
      console.log('🔄 [MOCK LOGIN] OTP Resent | OTP: 123456');
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
          position: relative;
        }

        .login-back-btn {
          background: #f0f0f0;
          border: none;
          color: #333;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          margin-bottom: 10px;
        }

        .login-back-btn:hover {
          background: ${primaryColor}15;
          color: ${primaryColor};
        }

        .login-page-content {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 20px;
          min-height: 100vh;
        }

        .login-card-wrapper {
          background: white;
          border-radius: 24px;
          padding: 30px 40px 40px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        }

        .login-icon-wrapper {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}30 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
        }

        .login-icon-wrapper i {
          font-size: 36px;
          color: ${primaryColor};
        }

        .login-page-title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px 0;
        }

        .login-page-subtitle {
          text-align: center;
          color: #666;
          font-size: 16px;
          margin: 0 0 36px 0;
          line-height: 1.5;
        }

        .login-mobile-display {
          text-align: center;
          font-weight: 600;
          color: ${primaryColor};
          font-size: 18px;
          margin: -12px 0 28px 0;
        }

        .login-form-group {
          margin-bottom: 28px;
        }

        .login-form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }

        .login-mobile-input-wrapper {
          display: flex;
          align-items: stretch;
          background: #f8f9fa;
          border: 2px solid #e0e0e0;
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .login-mobile-input-wrapper:focus-within {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 4px ${primaryColor}15;
        }

        .login-country-code {
          padding: 18px 16px;
          background: #e9ecef;
          font-weight: 600;
          color: #333;
          font-size: 16px;
          border-right: 2px solid #e0e0e0;
          display: flex;
          align-items: center;
        }

        .login-mobile-field {
          flex: 1;
          padding: 18px 16px;
          border: none;
          background: transparent;
          font-size: 17px;
          outline: none;
          letter-spacing: 2px;
          font-weight: 500;
        }

        .login-mobile-field::placeholder {
          letter-spacing: normal;
          font-weight: 400;
          color: #aaa;
        }

        .login-otp-wrapper {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .login-otp-field {
          width: 52px;
          height: 60px;
          border: 2px solid #e0e0e0;
          border-radius: 14px;
          font-size: 26px;
          font-weight: 700;
          text-align: center;
          outline: none;
          transition: all 0.3s;
          background: #fff;
        }

        .login-otp-field:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 4px ${primaryColor}15;
        }

        .login-otp-field.filled {
          border-color: ${primaryColor};
          background: ${primaryColor}08;
        }

        .login-submit-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px ${primaryColor}35;
        }

        .login-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .login-error-box {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          color: #c53030;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .login-error-box i {
          font-size: 18px;
        }

        .login-resend-area {
          text-align: center;
          margin-top: 28px;
        }

        .login-resend-text {
          color: #666;
          font-size: 15px;
        }

        .login-resend-btn {
          background: none;
          border: none;
          color: ${primaryColor};
          font-weight: 600;
          cursor: pointer;
          font-size: 15px;
          padding: 0;
          margin-left: 6px;
        }

        .login-resend-btn:disabled {
          color: #999;
          cursor: not-allowed;
        }

        .login-change-number {
          text-align: center;
          margin-top: 20px;
        }

        .login-change-number-btn {
          background: none;
          border: none;
          color: #666;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .login-change-number-btn:hover {
          color: ${primaryColor};
        }

        .login-spinner {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: loginSpin 0.8s linear infinite;
        }

        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .login-card-wrapper {
            padding: 36px 28px;
            border-radius: 20px;
            margin: 0 10px;
          }
          .login-page-title {
            font-size: 26px;
          }
          .login-otp-field {
            width: 44px;
            height: 52px;
            font-size: 22px;
          }
          .login-otp-wrapper {
            gap: 8px;
          }
        }
      `}</style>

      <div className="login-page-container">
        <div className="login-page-content">
          <div className="login-card-wrapper">
            <button className="login-back-btn" onClick={() => navigate('/menu')}>
              <i className="bi bi-arrow-left"></i>
            </button>
            {step === 'mobile' ? (
              <div>
                <div className="login-icon-wrapper">
                  <i className="bi bi-phone"></i>
                </div>
                <h1 className="login-page-title">Log In</h1>
                <p className="login-page-subtitle">Enter your mobile number to continue</p>

                {error && (
                  <div className="login-error-box">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSendOtp}>
                  <div className="login-form-group">
                    <label className="login-form-label">Mobile Number</label>
                    <div className="login-mobile-input-wrapper">
                      <span className="login-country-code">+91</span>
                      <input
                        type="tel"
                        className="login-mobile-field"
                        placeholder="Enter 10 digit number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={loading || mobile.length !== 10}>
                    {loading ? (
                      <>
                        <span className="login-spinner"></span>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="login-icon-wrapper">
                  <i className="bi bi-shield-lock"></i>
                </div>
                <h1 className="login-page-title">Verify OTP</h1>
                <p className="login-page-subtitle">Enter the 6-digit code sent to</p>
                <p className="login-mobile-display">+91 {mobile}</p>

                {error && (
                  <div className="login-error-box">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp}>
                  <div className="login-otp-wrapper" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        className={`login-otp-field ${digit ? 'filled' : ''}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        maxLength={1}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={loading || otp.join('').length !== 6}>
                    {loading ? (
                      <>
                        <span className="login-spinner"></span>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Log In</span>
                        <i className="bi bi-check-lg"></i>
                      </>
                    )}
                  </button>
                </form>

                <div className="login-resend-area">
                  <span className="login-resend-text">Didn't receive the code?</span>
                  <button
                    className="login-resend-btn"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>

                <div className="login-change-number">
                  <button className="login-change-number-btn" onClick={() => { setStep('mobile'); setError(''); }}>
                    Change mobile number
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
