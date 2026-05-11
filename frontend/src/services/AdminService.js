import apiClient from '../api/apiClient';

const adminService = {
  
  // Get users by role (retailers, fos)
  getUsers: async (params = {}) => {
    try {
      const {
        role = 'retailer',
        page = 1,
        page_size = 20,
        search = '',
        region = '',
        district = '',
        city = ''
      } = params;

      const queryParams = new URLSearchParams({
        role,
        page: page.toString(),
        page_size: page_size.toString()
      });

      // Add optional search and filter parameters
      if (search) queryParams.append('search', search);
      if (region) queryParams.append('region', region);
      if (district) queryParams.append('district', district);
      if (city) queryParams.append('city', city);

      const response = await apiClient.get(`/api/admin/users/?${queryParams.toString()}`);

      if (response.data) {
        return {
          success: true,
          data: {
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
            results: response.data.results,
            totalPages: Math.ceil(response.data.count / page_size),
            currentPage: page,
            pageSize: page_size
          }
        };
      } else {
        return { success: false, error: 'No data received' };
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch users'
      };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/api/admin/users/${userId}/`);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch user'
      };
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/api/admin/users/', userData);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to create user' };
      }
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to create user',
          errors: error.response.data.errors || {},
          error: error.response.data.message || error.message || 'Failed to create user'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create user'
      };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/`, userData);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to update user' };
      }
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to update user',
          errors: error.response.data.errors || {},
          error: error.response.data.message || error.message || 'Failed to update user'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to update user'
      };
    }
  },

  // Patch user (partial update)
  patchUser: async (userId, userData) => {
    try {
      const response = await apiClient.patch(`/api/admin/users/${userId}/`, userData);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to update user' };
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update user'
      };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await apiClient.delete(`/api/admin/users/${userId}/`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete user'
      };
    }
  },

  // Activate/Deactivate user
  toggleUserStatus: async (userId, status) => {
    try {
      const response = await apiClient.patch(`/api/admin/users/${userId}/`, { status });
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to update user status' };
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update user status'
      };
    }
  },

  // Get dashboard overview
  getDashboardOverview: async () => {
    try {
      const response = await apiClient.get('/api/admin/dashboard/overview/');
      
      if (response.data?.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data?.message || 'No dashboard data received' };
      }
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to fetch dashboard data'
      };
    }
  },

  // Get registration trends
  getRegistrationTrends: async (period = 'weekly', startDate = null, endDate = null) => {
    try {
      const params = { period };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/api/admin/dashboard/registration-trends/?${queryString}`);
      
      if (response.data?.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data?.message || 'No trends data received' };
      }
    } catch (error) {
      console.error('Error fetching registration trends:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to fetch trends data'
      };
    }
  },

  // Get recent activities
  getRecentActivities: async (limit = 10, offset = 0) => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await apiClient.get(`/api/admin/dashboard/recent-activities/?${params.toString()}`);
      
      if (response.data?.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data?.message || 'No activities data received' };
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to fetch activities data'
      };
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await apiClient.get('/api/admin/dashboard/user-stats/');
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'No user stats data received' };
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch user stats'
      };
    }
  },

  // Portal Configs API methods
  getPortalConfigs: async (params = {}) => {
    try {
      const {
        page = 1,
        page_size = 20,
        search = '',
        status = '',
        distributor = '',
        operator = ''
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: page_size.toString()
      });

      // Add optional search and filter parameters
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);
      if (distributor) queryParams.append('distributor', distributor);
      if (operator) queryParams.append('operator', operator);

      const response = await apiClient.get(`/api/admin/portal-configs/?${queryParams.toString()}`);

      if (response.data) {
        return {
          success: true,
          data: {
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
            results: response.data.results,
            totalPages: Math.ceil(response.data.count / page_size),
            currentPage: page,
            pageSize: page_size
          }
        };
      } else {
        return { success: false, error: 'No data received' };
      }
    } catch (error) {
      console.error('Error fetching portal configs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch portal configs'
      };
    }
  },

  createPortalConfig: async (configData) => {
    try {
      const response = await apiClient.post('/api/admin/portal-configs/', configData);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to create portal config' };
      }
    } catch (error) {
      console.error('Error creating portal config:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to create portal config',
          errors: error.response.data.errors || {},
          error: error.response.data.message || error.message || 'Failed to create portal config'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create portal config'
      };
    }
  },

  updatePortalConfig: async (configId, configData) => {
    try {
      const response = await apiClient.put(`/api/admin/portal-configs/${configId}/`, configData);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to update portal config' };
      }
    } catch (error) {
      console.error('Error updating portal config:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to update portal config',
          errors: error.response.data.errors || {},
          error: error.response.data.message || error.message || 'Failed to update portal config'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to update portal config'
      };
    }
  },

  deletePortalConfig: async (configId) => {
    try {
      await apiClient.delete(`/api/admin/portal-configs/${configId}/`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting portal config:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete portal config'
      };
    }
  },

  // UPI Configs API methods
  getUpiConfigs: async (params = {}) => {
    try {
      const {
        page = 1,
        page_size = 20,
        search = '',
        status = '',
        distributor = '',
        operator = ''
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: page_size.toString()
      });

      // Add optional search and filter parameters
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);
      if (distributor) queryParams.append('distributor', distributor);
      if (operator) queryParams.append('operator', operator);

      const response = await apiClient.get(`/api/admin/upi-configs/?${queryParams.toString()}`);

      if (response.data) {
        return {
          success: true,
          data: {
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous,
            results: response.data.results,
            totalPages: Math.ceil(response.data.count / page_size),
            currentPage: page,
            pageSize: page_size
          }
        };
      } else {
        return { success: false, error: 'No data received' };
      }
    } catch (error) {
      console.error('Error fetching UPI configs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch UPI configs'
      };
    }
  },

  createUpiConfig: async (configData) => {
    try {
      const response = await apiClient.post('/api/admin/upi-configs/', configData);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to create UPI config' };
      }
    } catch (error) {
      console.error('Error creating UPI config:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to create UPI config',
          errors: error.response.data.errors || {},
          error: error.response.data.message || error.message || 'Failed to create UPI config'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create UPI config'
      };
    }
  },

  updateUpiConfig: async (configId, configData) => {
    try {
      const response = await apiClient.put(`/api/admin/upi-configs/${configId}/`, configData);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to update UPI config' };
      }
    } catch (error) {
      console.error('Error updating UPI config:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to update UPI config',
          errors: error.response.data.errors || {},
          error: error.response.data.message || error.message || 'Failed to update UPI config'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to update UPI config'
      };
    }
  },

  deleteUpiConfig: async (configId) => {
    try {
      await apiClient.delete(`/api/admin/upi-configs/${configId}/`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting UPI config:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete UPI config'
      };
    }
  }

};

export default adminService;