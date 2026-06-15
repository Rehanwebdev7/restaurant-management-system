// ==========================================
// API Configuration
// ==========================================
/**
 * Get the API base URL from environment variable or return default
 * @returns {string} - API base URL
 */
export const server_api = () => {
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8091/rms';
};

/**
 * Set the API base URL in localStorage
 * @param {string} url - The base URL to save
 */
export const setBaseUrl = (url) => {
  localStorage.setItem('host', url);
  console.log('Custom API host saved:', url);
};

/**
 * Clear the saved base URL from localStorage
 */
export const clearBaseUrl = () => {
  localStorage.removeItem('host');
  console.log('Custom API host override cleared');
};

/**
 * Get current base URL (use this for API calls)
 */
export const API_BASE_URL = server_api();

// ==========================================
// App Configuration
// ==========================================
export const APP_VERSION = 7;
export const PLATFORM = "web";

// ==========================================
// Firebase Configuration
// ==========================================
// Get your VAPID key from Firebase Console:
// Project Settings > Cloud Messaging > Web Push certificates > Generate key pair
export const FIREBASE_VAPID_KEY = "BLx1gw_uBrpoOJGgcDkRWsVcWZlK8dcH3FqYmSfQnfEQxEZmnC68BfiooUryHu_iSWo2T4_ALvScQSVfCxu1lIM";
