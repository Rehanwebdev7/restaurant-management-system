//authServices.js
import apiClient from '../api/apiClient';

const authServices = {

  login: async (mobile, password, fcmToken = null) => {
    try {
      const payload = {
        mobile: mobile,
        password: password,
        version: "2.2",
        platform: "web"
      };

      // Add FCM token if available
      if (fcmToken) {
        payload.fcmToken = fcmToken;
      }

      const response = await apiClient.post(`/login/panelLogin`, payload);

      if (response.data.Status === 'SUCCESS') {
        // Store all user information in localStorage
        const data = response.data.data;
        const normalizedRole = data.userType?.toLowerCase();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('UserRole', normalizedRole);
        localStorage.setItem('UserMobile', data.mobile);
        localStorage.setItem('UserName', data.name);
        if (data.id) localStorage.setItem('UserId', data.id);

        return {
          success: {
            user: {
              role: normalizedRole,
              name: data.name,
              mobile: data.mobile,
            },
            token: data.token
          }
        };
      } else {
        return { errorMsg: response.data.message || "Login failed" };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An unknown error occurred";
      console.error("Login error: ", errorMessage);
      return { errorMsg: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('UserRole');
    localStorage.removeItem('UserName');
    localStorage.removeItem('UserMobile');
    localStorage.removeItem('dark-mode');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');  // Returns true if token exists
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Network error: No refresh token available');
      }

      const response = await apiClient.post('/api/auth/refresh-token/', {
        refresh_token: refreshToken
      });

      if (response.data.success) {
        // Update tokens in localStorage
        localStorage.setItem('authToken', response.data.data.access);
        localStorage.setItem('refreshToken', response.data.data.refresh);

        // Update user data if provided
        if (response.data.data.user) {
          localStorage.setItem('UserRole', response.data.data.user.role);
          localStorage.setItem('UserMobile', response.data.data.user.mobile);
          localStorage.setItem('UserId', response.data.data.user.id);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }

        return { success: true, access: response.data.data.access };
      } else {
        throw new Error(response.data.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    try {
      const response = await apiClient.post('/api/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      return response.data;
    } catch (error) {
      console.error('Change password error:', error);

      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        message: 'Failed to change password. Please try again.'
      };
    }
  },

  // Signup APIs
  sendSignupOtp: async (mobile) => {
    try {
      const response = await apiClient.post('/signup/send_otp', {
        mobile: mobile
      });

      if (response.data.Status === 'SUCCESS') {
        return {
          success: true,
          token: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to send OTP'
        };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP. Please try again.'
      };
    }
  },

  verifySignupOtp: async (otp, token) => {
    try {
      const response = await apiClient.post('/signup/verify_otp', {
        otp: otp,
        token: token
      });

      if (response.data.Status === 'SUCCESS') {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to verify OTP'
        };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP. Please try again.'
      };
    }
  },

  // Forgot Password APIs
  sendForgotPasswordOtp: async (mobile) => {
    try {
      const response = await apiClient.post('/login/fp_sendOTP', {
        mobile: mobile
      });

      if (response.data.Status === 'SUCCESS') {
        return {
          success: true,
          token: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to send OTP'
        };
      }
    } catch (error) {
      console.error('Send Forgot Password OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP. Please try again.'
      };
    }
  },

  verifyForgotPasswordOtp: async (otp, token) => {
    try {
      const response = await apiClient.post('/login/fp_verifyOTP', {
        otp: otp,
        token: token
      });

      if (response.data.Status === 'SUCCESS') {
        return {
          success: true,
          token: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Invalid OTP'
        };
      }
    } catch (error) {
      console.error('Verify Forgot Password OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP. Please try again.'
      };
    }
  },

  setPassword: async (password, confirmPassword, token) => {
    try {
      const response = await apiClient.post('/login/set_password', {
        password: password,
        confirmPassword: confirmPassword
      }, {
        headers: {
          'access_token': token
        }
      });

      if (response.data.Status === 'SUCCESS') {
        return {
          success: true,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to set password'
        };
      }
    } catch (error) {
      console.error('Set Password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to set password. Please try again.'
      };
    }
  },
};

export default authServices;