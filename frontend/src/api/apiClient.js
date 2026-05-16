import axios from 'axios';
import { server_api } from '../utils/constants';
import { isMockEnabled, mockAxiosAdapter } from '../mocks/mockServer';

const baseURL = server_api();

const REAL_API_PREFIXES = [
  '/api/admin/',
  '/api/branch/',
  '/api/cashier/',
  '/api/customer/',
  '/api/delivery/',
  '/api/kitchen/',
  '/api/restaurant/users/',
  '/api/restaurant/users_profile/',
  '/api/restaurant/menu_category/',
  '/api/restaurant/menu_subcategory/',
  '/api/restaurant/menu_items/',
  '/api/restaurant/menu_item_addons/',
  '/api/restaurant/addons/',
  '/api/restaurant/addons_items/',
  '/api/restaurant/section/',
  '/api/restaurant/dining_tables/',
  '/api/restaurant/delivery_zones/',
  '/api/restaurant/restaurant_hours/',
  '/api/restaurant/orders/',
  '/api/restaurant/order_items/',
  '/api/restaurant/order_payments/',
  '/api/restaurant/order_addons_items/',
  '/api/restaurant/bank_details/',
  '/api/restaurant/payment_gateway/',
  '/api/restaurant/sliders/',
  '/api/restaurant/customers/',
  '/api/restaurant/customer_delivery_addresses/',
  '/api/restaurant/states/',
  '/api/restaurant/cities/',
  '/api/restaurant/dashboard/',
  '/login/',
];

const shouldUseRealBackend = (url = '') => REAL_API_PREFIXES.some((prefix) => url.includes(prefix));

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

if (isMockEnabled()) {
  apiClient.defaults.adapter = (config) => {
    const url = config.url || '';
    if (shouldUseRealBackend(url)) {
      const method = (config.method || 'GET').toUpperCase();
      const params = config.params ? '?' + new URLSearchParams(config.params) : '';
      const fullUrl = (config.baseURL || '') + url + params;
      const isFormData = config.data instanceof FormData;
      const reqHeaders = {};
      if (config.headers) {
        Object.entries(config.headers).forEach(([k, v]) => {
          if (!v || typeof v !== 'string') return;
          if (isFormData && k.toLowerCase() === 'content-type') return;
          reqHeaders[k] = v;
        });
      }
      if (!isFormData && !reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
      return fetch(fullUrl, {
        method,
        headers: reqHeaders,
        body: method !== 'GET' && config.data
          ? (isFormData ? config.data : (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)))
          : undefined,
      }).then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        const responseData = contentType.includes('application/json')
          ? await res.json()
          : await res.text();
        return { data: responseData, status: res.status, statusText: res.statusText, headers: {}, config, request: {} };
      });
    }
    return mockAxiosAdapter(config);
  };
}

apiClient.defaults.headers.post['Content-Type'] = 'application/json';
apiClient.defaults.headers.put['Content-Type'] = 'application/json';

// Token injection
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  const customerToken = localStorage.getItem('customerToken');
  const token = localStorage.getItem('authToken');
  if (config.url?.includes('/api/customer/') && customerToken) {
    config.headers['access_token'] = customerToken;
  } else if (token) {
    config.headers['access_token'] = token;
  }
  return config;
});

function handleLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('UserRole');
  localStorage.removeItem('UserName');
  localStorage.removeItem('UserMobile');
  localStorage.removeItem('UserId');
  localStorage.removeItem('dark-mode');
  localStorage.removeItem('user');
  window.location.href = '/';
}

export default apiClient;
