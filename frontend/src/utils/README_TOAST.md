# Toast Notification Utility

A comprehensive toast notification system built on top of react-toastify with custom styling and reusable functions.

## Setup

The toast system is already configured in `App.js` with the `ToastContainer` component and custom styles.

## Usage

Import the toast utility in any component:

```jsx
import { showToast, toastMessages } from '../utils/toast';
```

## Basic Usage Examples

### 1. Success Toast

```jsx
showToast.success('Operation completed successfully!');
```

### 2. Error Toast

```jsx
showToast.error('Something went wrong!');
```

### 3. Info Toast

```jsx
showToast.info('Please check your email');
```

### 4. Warning Toast

```jsx
showToast.warning('This action cannot be undone');
```

## Predefined Toast Functions

### Transaction Success
```jsx
showToast.transactionSuccess('Payment completed successfully!');
// Shows: 🎉 Payment completed successfully!
```

### Transaction Failed
```jsx
showToast.transactionFailed('Payment failed. Please try again.');
// Shows: ❌ Payment failed. Please try again.
```

### Verification Success
```jsx
showToast.verificationSuccess('Email verified successfully!');
// Shows: ✅ Email verified successfully!
```

### Success with Custom Icon
```jsx
showToast.successWithIcon('Profile updated!', '✨');
// Shows: ✨ Profile updated!
```

## Using Predefined Messages

```jsx
import { showToast, toastMessages } from '../utils/toast';

// Use predefined messages
showToast.success(toastMessages.saved);
showToast.error(toastMessages.networkError);
showToast.transactionSuccess(toastMessages.topUpSuccess);
```

### Available Predefined Messages

- **Top Up Request:**
  - `toastMessages.topUpSuccess`
  - `toastMessages.topUpFailed`

- **Verification:**
  - `toastMessages.tpinSuccess`
  - `toastMessages.tpinFailed`
  - `toastMessages.otpSuccess`
  - `toastMessages.otpFailed`

- **General:**
  - `toastMessages.cancelled`
  - `toastMessages.saved`
  - `toastMessages.deleted`
  - `toastMessages.updated`

- **Errors:**
  - `toastMessages.networkError`
  - `toastMessages.serverError`
  - `toastMessages.validationError`

## Advanced Usage

### Custom Configuration

```jsx
showToast.success('Custom message', {
  autoClose: 5000,  // Close after 5 seconds
  position: "bottom-right",
  hideProgressBar: true,
});
```

### Loading Toast

```jsx
// Show loading toast
const toastId = showToast.loading('Processing your request...');

// Later, update it to success or error
showToast.update(toastId, 'success', 'Request completed!');
// or
showToast.update(toastId, 'error', 'Request failed!');
```

### Dismiss All Toasts

```jsx
showToast.dismissAll();
```

## Complete Example - Form Submission with Toast

```jsx
import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { showToast, toastMessages } from '../utils/toast';

function MyForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email) {
      showToast.warning(toastMessages.validationError);
      return;
    }

    setIsSubmitting(true);
    const toastId = showToast.loading('Submitting form...');

    try {
      const response = await submitFormAPI(formData);
      
      if (response.success) {
        showToast.update(toastId, 'success', 'Form submitted successfully!');
        setFormData({ name: '', email: '' });
      } else {
        showToast.update(toastId, 'error', response.message);
      }
    } catch (error) {
      showToast.update(toastId, 'error', toastMessages.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </Form.Group>
      
      <Button type="submit" disabled={isSubmitting}>
        Submit
      </Button>
    </Form>
  );
}

export default MyForm;
```

## Complete Example - API Call with Toast

```jsx
import { showToast, toastMessages } from '../utils/toast';

const handleDeleteUser = async (userId) => {
  try {
    const response = await deleteUserAPI(userId);
    
    if (response.success) {
      showToast.success(toastMessages.deleted);
      // Refresh user list
      fetchUsers();
    } else {
      showToast.error(response.message || 'Failed to delete user');
    }
  } catch (error) {
    if (error.response?.status === 500) {
      showToast.error(toastMessages.serverError);
    } else {
      showToast.error(toastMessages.networkError);
    }
  }
};
```

## Complete Example - Multi-step Process with Toast

```jsx
import { showToast } from '../utils/toast';

const handleMultiStepProcess = async () => {
  // Step 1: Validation
  if (!isValid()) {
    showToast.warning('Please fill all required fields');
    return;
  }

  // Step 2: T-PIN Verification
  try {
    await verifyTPin(tpin);
    showToast.verificationSuccess('T-PIN verified successfully!');
  } catch (error) {
    showToast.error('Invalid T-PIN');
    return;
  }

  // Step 3: OTP Verification
  try {
    await verifyOTP(otp);
    showToast.verificationSuccess('OTP verified successfully!');
  } catch (error) {
    showToast.error('Invalid OTP');
    return;
  }

  // Step 4: Final Transaction
  try {
    await processTransaction();
    showToast.transactionSuccess('Transaction completed successfully!');
  } catch (error) {
    showToast.transactionFailed('Transaction failed. Please try again.');
  }
};
```

## Custom Styling

The toast notifications use custom CSS defined in `src/styles/toast-custom.css`. You can modify these styles to match your brand colors and design system.

### Current Style Features:
- ✅ Gradient backgrounds for different toast types
- ✅ Smooth slide-in animations
- ✅ Custom shadows and border radius
- ✅ Mobile responsive
- ✅ Custom progress bar styles

## Toast Types and Their Colors

- **Success:** Purple gradient (Matches app theme)
- **Error:** Pink-red gradient
- **Info:** Blue gradient
- **Warning:** Pink-yellow gradient

## Best Practices

1. **Use predefined messages** for consistency across the app
2. **Keep messages concise** and actionable
3. **Use appropriate toast types** (success, error, info, warning)
4. **Don't overuse toasts** - only for important user feedback
5. **Use loading toasts** for long-running operations
6. **Add emojis** for better visual feedback (but don't overdo it)

## Notes

- Toast notifications automatically close after 3 seconds (default)
- Users can manually close toasts by clicking on them
- Multiple toasts stack vertically
- Toasts pause auto-close on hover
- All toasts are draggable for better UX

