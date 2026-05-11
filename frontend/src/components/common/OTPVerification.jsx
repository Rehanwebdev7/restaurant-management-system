import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const OTPVerification = ({
  show,
  onHide,
  onVerify,
  onResend,
  title = "OTP Verification",
  message = "Enter the OTP sent to your registered mobile number",
  mobileNumber = "",
  otpLength = 6,
  resendEnabled = true
}) => {
  const [otp, setOtp] = useState(new Array(otpLength).fill(''));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Timer for resend OTP
  useEffect(() => {
    if (show && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [show, timer]);

  // Reset on modal open
  useEffect(() => {
    if (show) {
      setOtp(new Array(otpLength).fill(''));
      setTimer(30);
      setCanResend(false);
      setIsVerifying(false);
      // Focus first input
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [show, otpLength]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input
    if (element.value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, otpLength);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (!isNaN(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    
    // Focus last filled input or next empty
    const lastFilledIndex = Math.min(pastedData.length, otpLength - 1);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== otpLength) {
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otpValue);
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setTimer(30);
    setCanResend(false);
    setOtp(new Array(otpLength).fill(''));
    inputRefs.current[0]?.focus();
    if (onResend) {
      try {
        await onResend();
      } catch (error) {
        console.error('Resend OTP failed:', error);
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-shield-lock me-2" style={{ color: '#3b82f6' }}></i>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        <div className="mb-3">
          <p className="text-muted mb-1">{message}</p>
          {mobileNumber && (
            <p className="fw-bold mb-0">
              {mobileNumber.replace(/(\d{2})(\d{4})(\d{4})/, '+91 $1XXXX$3')}
            </p>
          )}
        </div>

        {/* OTP Input Fields */}
        <div className="d-flex justify-content-center gap-2 mb-4 mt-4">
          {otp.map((digit, index) => (
            <Form.Control
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              style={{
                width: '50px',
                height: '50px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        {/* Timer and Resend */}
        {resendEnabled && (
          <div className="mt-3">
            {!canResend ? (
              <p className="text-muted small">
                Resend OTP in <span className="fw-bold text-primary">{timer}s</span>
              </p>
            ) : (
              <Button
                variant="link"
                onClick={handleResend}
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Resend OTP
              </Button>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={isVerifying}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.9rem'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          disabled={!isOtpComplete || isVerifying}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.9rem',
            backgroundColor: !isOtpComplete || isVerifying ? '#94a3b8' : '#3b82f6',
            border: 'none',
            fontWeight: '500',
            cursor: !isOtpComplete || isVerifying ? 'not-allowed' : 'pointer'
          }}
        >
          {isVerifying ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Verifying...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-1"></i>
              Verify OTP
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OTPVerification;

