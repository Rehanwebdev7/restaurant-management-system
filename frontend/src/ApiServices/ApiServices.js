import apiClient from "../api/apiClient";
import authServices from "../services/AuthServices";

// GET Service
export const ApiGet = async (endpoint, params = {}) => {
  const token = authServices.getToken();
  try {
    const response = await apiClient.get(endpoint, {
      params,
      headers: { access_token: token }
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

// POST Service
export const ApiPost = async (endpoint, data = {}) => {
  const token = authServices.getToken();
  try {
    const response = await apiClient.post(endpoint, data, {
      headers: { access_token: token }
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

// PUT Service
export const ApiPut = async (endpoint, data = {}) => {
  const token = authServices.getToken();
  try {
    const response = await apiClient.put(endpoint, data, {
      headers: { access_token: token }
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

// DELETE Service
export const ApiDelete = async (endpoint, params = {}) => {
  const token = authServices.getToken();
  try {
    const response = await apiClient.delete(endpoint, {
      params,
      headers: { access_token: token }
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

// POST FormData Service (for file uploads)
export const ApiPostFormData = async (endpoint, formData) => {
  const token = authServices.getToken();
  try {
    // Don't set Content-Type for FormData - axios will set it automatically with correct boundary
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        access_token: token
      },
      transformRequest: [(data) => data] // Prevent axios from transforming FormData
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

// PUT FormData Service (for file uploads with PUT)
export const ApiPutFormData = async (endpoint, formData) => {
  const token = authServices.getToken();
  try {
    // Don't set Content-Type for FormData - axios will set it automatically with correct boundary
    const response = await apiClient.put(endpoint, formData, {
      headers: {
        access_token: token
      },
      transformRequest: [(data) => data] // Prevent axios from transforming FormData
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
