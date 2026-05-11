import apiClient from "../api/apiClient";

// GET Service
export const ApiGet = async (endpoint, params = {}) => {
  try {
    const response = await apiClient.get(endpoint, { params });

    if (response.data.Status === 'SUCCESS') {
      return { success: response };
    } else {
      return { fail: response.data.message || "Failed." };
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "An unexpected error occurred";
    return { fail: errorMessage };
  }
};

// POST Service
export const ApiPost = async (endpoint, data = {}) => {
  console.log('\n=== 📡 API POST REQUEST ===');
  console.log('🔗 Endpoint:', endpoint);
  console.log('📦 Request Data:', data);
  console.log('⏰ Timestamp:', new Date().toISOString());

  try {
    const response = await apiClient.post(endpoint, data);

    console.log('✅ API POST Response Received:');
    console.log('  - Status Code:', response.status);
    console.log('  - Status Text:', response.statusText);
    console.log('  - Response Data:', response.data);
    console.log('  - Response Headers:', response.headers);

    if (response.data.Status === 'SUCCESS') {
      console.log('✅ Response Status: SUCCESS');
      console.log('=== ✨ API POST REQUEST COMPLETED ===\n');
      return { success: response };
    } else {
      console.log('⚠️ Response Status: NOT SUCCESS');
      console.log('  - Message:', response.data.message);
      console.log('=== ⚠️ API POST REQUEST COMPLETED ===\n');
      return { fail: response.data.message || "Failed." };
    }
  } catch (error) {
    console.error('❌ API POST Error:');
    console.error('  - Error Type:', error.constructor.name);
    console.error('  - Error Message:', error.message);

    if (error.response) {
      console.error('  - Response Status:', error.response.status);
      console.error('  - Response Data:', error.response.data);
      console.error('  - Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('  - Request made but no response');
      console.error('  - Request:', error.request);
    } else {
      console.error('  - Error setting up request:', error.message);
    }
    console.error('  - Full Error:', error);
    console.error('=== ❌ API POST REQUEST FAILED ===\n');

    const errorMessage =
      error.response?.data?.message || error.message || "An unexpected error occurred";
    return { fail: errorMessage };
  }
};

// PUT Service
export const ApiPut = async (endpoint, data = {}) => {
  try {
    const response = await apiClient.put(endpoint, data);

    if (response.data.Status === 'SUCCESS') {
      return { success: response };
    } else {
      return { fail: response.data.message || "Failed." };
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "An unexpected error occurred";
    return { fail: errorMessage };
  }
};

// DELETE Service
export const ApiDelete = async (endpoint, params = {}) => {
  try {
    const response = await apiClient.delete(endpoint, { params });

    if (response.data.Status === 'SUCCESS') {
      return { success: response };
    } else {
      return { fail: response.data.message || "Failed." };
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "An unexpected error occurred";
    return { fail: errorMessage };
  }
};

// POST FormData Service (for file uploads)
export const ApiPostFormData = async (endpoint, formData) => {
  try {
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.Status === 'SUCCESS') {
      return { success: response };
    } else {
      return { fail: response.data.message || "Failed." };
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "An unexpected error occurred";
    return { fail: errorMessage };
  }
};
