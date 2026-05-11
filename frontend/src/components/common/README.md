# Reusable Common Components

This folder contains reusable components that can be used across multiple pages in the application.

## Components

### 1. OTPVerification Component

A reusable OTP verification modal component with auto-focus, paste support, and resend functionality.

**Props:**
- `show` (boolean, required) - Controls modal visibility
- `onHide` (function, required) - Called when modal is closed
- `onVerify` (function, required) - Called when OTP is verified. Receives OTP value as parameter
- `title` (string, optional) - Modal title. Default: "OTP Verification"
- `message` (string, optional) - Message to display. Default: "Enter the OTP sent to your registered mobile number"
- `mobileNumber` (string, optional) - Mobile number to display (partially masked)
- `otpLength` (number, optional) - Number of OTP digits. Default: 6
- `resendEnabled` (boolean, optional) - Enable/disable resend functionality. Default: true

**Usage Example:**

```jsx
import React, { useState } from 'react';
import OTPVerification from '../common/OTPVerification';

function MyComponent() {
  const [showOTP, setShowOTP] = useState(false);

  const handleOTPVerify = async (otpValue) => {
    // Your OTP verification logic here
    try {
      const response = await verifyOTPAPI(otpValue);
      if (response.success) {
        setShowOTP(false);
        // Success handling
      }
    } catch (error) {
      throw new Error('Invalid OTP');
    }
  };

  return (
    <>
      <button onClick={() => setShowOTP(true)}>Verify OTP</button>
      
      <OTPVerification
        show={showOTP}
        onHide={() => setShowOTP(false)}
        onVerify={handleOTPVerify}
        title="Verify Your Mobile"
        message="Enter the 6-digit OTP sent to your registered mobile"
        mobileNumber="9876543210"
        otpLength={6}
        resendEnabled={true}
      />
    </>
  );
}
```

### 2. TPinModal Component

A reusable T-PIN verification modal component with auto-focus and paste support.

**Props:**
- `show` (boolean, required) - Controls modal visibility
- `onHide` (function, required) - Called when modal is closed
- `onVerify` (function, required) - Called when T-PIN is verified. Receives T-PIN value as parameter
- `title` (string, optional) - Modal title. Default: "Enter T-PIN"
- `message` (string, optional) - Message to display. Default: "Please enter your 4-digit T-PIN to continue"
- `pinLength` (number, optional) - Number of T-PIN digits. Default: 4

**Usage Example:**

```jsx
import React, { useState } from 'react';
import TPinModal from '../common/TPinModal';

function MyComponent() {
  const [showTPin, setShowTPin] = useState(false);

  const handleTPinVerify = async (tpinValue) => {
    // Your T-PIN verification logic here
    try {
      const response = await verifyTPinAPI(tpinValue);
      if (response.success) {
        setShowTPin(false);
        // Success handling - maybe show OTP modal
      }
    } catch (error) {
      throw new Error('Invalid T-PIN');
    }
  };

  return (
    <>
      <button onClick={() => setShowTPin(true)}>Enter T-PIN</button>
      
      <TPinModal
        show={showTPin}
        onHide={() => setShowTPin(false)}
        onVerify={handleTPinVerify}
        title="Security Verification"
        message="Enter your 4-digit T-PIN to authorize this transaction"
        pinLength={4}
      />
    </>
  );
}
```

### 3. Combined T-PIN + OTP Flow Example

Here's how to use both components together for a complete verification flow:

```jsx
import React, { useState } from 'react';
import TPinModal from '../common/TPinModal';
import OTPVerification from '../common/OTPVerification';

function TransactionComponent() {
  const [showTPin, setShowTPin] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [transactionData, setTransactionData] = useState(null);

  const handleSubmitTransaction = (data) => {
    setTransactionData(data);
    setShowTPin(true);
  };

  const handleTPinVerify = async (tpinValue) => {
    try {
      await verifyTPinAPI(tpinValue);
      setShowTPin(false);
      // After T-PIN success, show OTP
      setTimeout(() => {
        setShowOTP(true);
      }, 300);
    } catch (error) {
      throw new Error('Invalid T-PIN');
    }
  };

  const handleOTPVerify = async (otpValue) => {
    try {
      await verifyOTPAPI(otpValue);
      // Process transaction with transactionData
      await processTransaction(transactionData);
      setShowOTP(false);
      setTransactionData(null);
      alert('Transaction successful!');
    } catch (error) {
      throw new Error('Invalid OTP');
    }
  };

  const handleCancelTPin = () => {
    setShowTPin(false);
    setTransactionData(null);
  };

  const handleCancelOTP = () => {
    setShowOTP(false);
    setShowTPin(true); // Go back to T-PIN
  };

  return (
    <>
      <button onClick={() => handleSubmitTransaction({ amount: 1000 })}>
        Submit Transaction
      </button>
      
      <TPinModal
        show={showTPin}
        onHide={handleCancelTPin}
        onVerify={handleTPinVerify}
      />
      
      <OTPVerification
        show={showOTP}
        onHide={handleCancelOTP}
        onVerify={handleOTPVerify}
        mobileNumber="9876543210"
      />
    </>
  );
}
```

## Features

### OTPVerification Features:
- ✅ Auto-focus on first input
- ✅ Auto-advance to next input on entry
- ✅ Backspace navigation
- ✅ Paste support (from clipboard)
- ✅ Resend OTP with countdown timer
- ✅ Loading state during verification
- ✅ Error handling
- ✅ Masked mobile number display
- ✅ Customizable OTP length

### TPinModal Features:
- ✅ Auto-focus on first input
- ✅ Auto-advance to next input on entry
- ✅ Backspace navigation
- ✅ Paste support (from clipboard)
- ✅ Password field (masked input)
- ✅ Loading state during verification
- ✅ Error display
- ✅ Forgot T-PIN link
- ✅ Customizable PIN length

## Notes

- Both components use Bootstrap modals
- Components have `backdrop="static"` to prevent accidental closing
- Error handling is built-in - just throw an error from the verify function
- The verify functions should return a Promise
- Components automatically reset state when opened

