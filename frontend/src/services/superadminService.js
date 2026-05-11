import { ApiGet, ApiPost, ApiPut, ApiDelete } from '../ApiServices/ApiServices';

const REAL_USER_FETCH_LIMIT = 1000;

const wrapSuccess = (data) => ({
  success: {
    data: {
      data,
    },
  },
});

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
};

const getUserId = (user = {}) => user.user_id || user.id || user.userId || null;

const normalizeUser = (user = {}) => {
  const id = getUserId(user);
  const role = user.role || '';
  const approvalStatus = (user.approvalStatus || user.approval_status || '').toLowerCase();
  const isActive = typeof user.isActive === 'boolean'
    ? user.isActive
    : typeof user.is_active === 'boolean'
      ? user.is_active
      : toBoolean(user.isActive ?? user.is_active, approvalStatus === 'approved');

  return {
    ...user,
    id,
    user_id: id,
    role,
    name: user.name || user.full_name || user.hospitalName || user.hospital_name || '',
    full_name: user.full_name || user.name || '',
    email: user.email || '',
    mobile: user.mobile || '',
    approvalStatus: approvalStatus || 'pending',
    approval_status: approvalStatus || 'pending',
    approvalNotes: user.approvalNotes || user.approval_notes || '',
    hospitalName: user.hospitalName || user.hospital_name || '',
    hospital_name: user.hospital_name || user.hospitalName || '',
    hospitalType: user.hospitalType || user.hospital_type || '',
    hospital_type: user.hospital_type || user.hospitalType || '',
    hospitalCode: user.hospitalCode || user.hospital_code || '',
    hospital_code: user.hospital_code || user.hospitalCode || '',
    gstNumber: user.gstNumber || user.gst_number || '',
    gst_number: user.gst_number || user.gstNumber || '',
    city: user.city || '',
    state: user.state || '',
    pincode: user.pincode || user.zipCode || user.zip_code || '',
    zipCode: user.zipCode || user.zip_code || user.pincode || '',
    isActive,
    is_active: isActive,
    created_at: user.created_at || user.createdAt || null,
    createdAt: user.createdAt || user.created_at || null,
    updated_at: user.updated_at || user.updatedAt || null,
    updatedAt: user.updatedAt || user.updated_at || null,
    parentId: user.parentId || null,
    branchId: user.branchId || null,
  };
};

const normalizeRestaurant = (user = {}) => {
  const normalized = normalizeUser(user);
  return {
    ...normalized,
    ownerName: normalized.full_name || normalized.name,
    planName: normalized.planName || 'Basic',
    revenue: normalized.revenue || 0,
    orderCount: normalized.orderCount || 0,
    status: normalized.approvalStatus === 'approved'
      ? (normalized.isActive ? 'active' : 'suspended')
      : normalized.approvalStatus || 'pending',
  };
};

const normalizeDirectoryUser = (user = {}) => {
  const isActive = typeof user.is_active === 'boolean'
    ? user.is_active
    : typeof user.isActive === 'boolean'
      ? user.isActive
      : Number(user.status) === 1;

  return normalizeUser({
    ...user,
    id: user.id || user.user_id,
    user_id: user.user_id || user.id,
    name: user.name || user.full_name,
    full_name: user.full_name || user.name,
    mobile: user.mobile || user.mobile_number,
    approvalStatus: user.approvalStatus || user.approval_status,
    hospitalName: user.hospitalName || user.hospital_name,
    hospitalCode: user.hospitalCode || user.hospital_code,
    gstNumber: user.gstNumber || user.gst_number,
    isActive,
    is_active: isActive,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
  });
};

const paginateRecords = (items = [], page = 0, size = 10) => {
  const safePage = Math.max(Number(page) || 0, 0);
  const safeSize = Math.max(Number(size) || 10, 1);
  const start = safePage * safeSize;
  const records = items.slice(start, start + safeSize);

  return {
    records,
    totalRecords: items.length,
    pageSize: safeSize,
    currentPage: safePage + 1,
    totalPages: Math.max(1, Math.ceil(items.length / safeSize)),
  };
};

const mapUpdatePayloadToUser = (id, data = {}) => {
  const payload = {
    id,
  };

  if (data.name !== undefined) payload.name = data.name;
  if (data.full_name !== undefined) payload.name = data.full_name;
  if (data.email !== undefined) payload.email = data.email;
  if (data.mobile !== undefined) payload.mobile = data.mobile;
  if (data.role !== undefined) payload.role = data.role;

  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.is_active !== undefined) payload.isActive = data.is_active;

  if (data.status !== undefined) {
    if (data.status === 'active') {
      payload.isActive = true;
      payload.approvalStatus = 'approved';
    } else if (data.status === 'pending') {
      payload.isActive = false;
      payload.approvalStatus = 'pending';
    } else if (data.status === 'suspended') {
      payload.isActive = false;
      payload.approvalStatus = 'rejected';
    }
  }

  if (data.approvalStatus !== undefined) payload.approvalStatus = data.approvalStatus;
  if (data.approval_status !== undefined) payload.approvalStatus = data.approval_status;
  if (data.approvalNotes !== undefined) payload.approvalNotes = data.approvalNotes;
  if (data.approval_notes !== undefined) payload.approvalNotes = data.approval_notes;
  if (data.hospitalName !== undefined) payload.hospitalName = data.hospitalName;
  if (data.hospital_name !== undefined) payload.hospitalName = data.hospital_name;
  if (data.hospitalType !== undefined) payload.hospitalType = data.hospitalType;
  if (data.hospital_type !== undefined) payload.hospitalType = data.hospital_type;
  if (data.hospitalCode !== undefined) payload.hospitalCode = data.hospitalCode;
  if (data.hospital_code !== undefined) payload.hospitalCode = data.hospital_code;
  if (data.gstNumber !== undefined) payload.gstNumber = data.gstNumber;
  if (data.gst_number !== undefined) payload.gstNumber = data.gst_number;
  if (data.einNumber !== undefined) payload.gstNumber = data.einNumber;
  if (data.city !== undefined) payload.city = data.city;
  if (data.state !== undefined) payload.state = data.state;
  if (data.pincode !== undefined) payload.pincode = data.pincode;
  if (data.zipCode !== undefined) payload.pincode = data.zipCode;

  return payload;
};

const mapSuperadminUserPayload = (id, data = {}) => {
  const payload = {};

  if (id !== undefined && id !== null) payload.id = id;

  if (data.name !== undefined) payload.name = data.name;
  if (data.full_name !== undefined) payload.name = data.full_name;
  if (data.email !== undefined) payload.email = data.email;
  if (data.mobile !== undefined) payload.mobile = data.mobile;
  if (data.hospitalName !== undefined) payload.hospital_name = data.hospitalName;
  if (data.hospital_name !== undefined) payload.hospital_name = data.hospital_name;
  if (data.hospitalType !== undefined) payload.hospital_type = data.hospitalType;
  if (data.hospital_type !== undefined) payload.hospital_type = data.hospital_type;
  if (data.hospitalCode !== undefined) payload.hospital_code = data.hospitalCode;
  if (data.hospital_code !== undefined) payload.hospital_code = data.hospital_code;
  if (data.gstNumber !== undefined) payload.gst_number = data.gstNumber;
  if (data.gst_number !== undefined) payload.gst_number = data.gst_number;
  if (data.einNumber !== undefined) payload.gst_number = data.einNumber;
  if (data.city !== undefined) payload.city = data.city;
  if (data.state !== undefined) payload.state = data.state;
  if (data.pincode !== undefined) payload.pincode = data.pincode;
  if (data.zipCode !== undefined) payload.pincode = data.zipCode;

  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.is_active !== undefined) payload.is_active = data.is_active;

  if (data.status !== undefined) {
    if (data.status === 'active') {
      payload.is_active = true;
      payload.approval_status = 'approved';
    } else if (data.status === 'pending') {
      payload.is_active = false;
      payload.approval_status = 'pending';
    } else if (data.status === 'suspended') {
      payload.is_active = false;
      payload.approval_status = 'rejected';
    }
  }

  if (data.approvalStatus !== undefined) payload.approval_status = data.approvalStatus;
  if (data.approval_status !== undefined) payload.approval_status = data.approval_status;
  if (data.approvalNotes !== undefined) payload.approval_notes = data.approvalNotes;
  if (data.approval_notes !== undefined) payload.approval_notes = data.approval_notes;

  return payload;
};

const getDefaultDateRange = (params = {}) => {
  const today = new Date();
  return {
    fromDate: params.fromDate || params.from || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    toDate: params.toDate || params.to || today.toISOString().split('T')[0],
  };
};

const fetchRestaurantUsers = async (params = {}) => {
  const response = await ApiGet('/api/admin/users/filter', {
    role: 'restaurant',
    searchValue: params.searchValue || params.search || '',
    pageNumber: 0,
    pageSize: params.pageSize || REAL_USER_FETCH_LIMIT,
  });

  if (!response.success) return response;

  const records = response.success.data?.data?.records || [];
  return {
    success: records.map(normalizeRestaurant),
    raw: response,
  };
};

const superadminService = {
  getDashboardData: (params) => {
    const { fromDate, toDate } = getDefaultDateRange(params);
    return ApiGet('/api/admin/dashboard/summary', { ...params, fromDate, toDate });
  },

  userApprovals: {
    getAll: async (params = {}) => {
      const [listResponse, pendingResponse] = await Promise.all([
        ApiGet('/api/admin/user-approvals', params),
        ApiGet('/api/admin/user-approvals', {
          approvalStatus: 'pending',
          pageNumber: 0,
          pageSize: 1,
        }),
      ]);

      if (!listResponse.success) {
        return { fail: listResponse.fail || 'Failed to load approvals' };
      }

      const payload = listResponse.success.data?.data || {};
      const items = (payload.content || []).map(normalizeDirectoryUser);
      const pendingCount = pendingResponse.success
        ? pendingResponse.success.data?.data?.totalElements || 0
        : payload.pendingCount || items.filter((user) => user.approvalStatus === 'pending').length;

      return wrapSuccess({
        ...payload,
        content: items,
        pendingCount,
      });
    },
    getById: (id) => ApiGet(`/api/admin/user-approvals/${id}`),
    update: async (id, data) => ApiPut(`/api/admin/user-approvals/${id}`, mapSuperadminUserPayload(id, data)),
    impersonate: (id) => ApiPost(`/api/admin/user-approvals/${id}/impersonate`),
  },

  userDirectory: {
    getAll: async (params = {}) => {
      const response = await ApiGet('/api/admin/users', params);
      if (!response.success) {
        return response;
      }

      const payload = response.success.data?.data || {};
      const rows = (payload.data || []).map(normalizeDirectoryUser);

      return wrapSuccess({
        ...payload,
        data: rows,
      });
    },
    getTree: async (search) => {
      const response = await ApiGet('/api/admin/users/tree', { search });
      if (!response.success) return response;
      return wrapSuccess((response.success.data?.data || []).map(normalizeDirectoryUser));
    },
    getTreeChildren: async (restaurantId) => {
      const response = await ApiGet(`/api/admin/users/tree/${restaurantId}`);
      if (!response.success) return response;
      return wrapSuccess((response.success.data?.data || []).map(normalizeDirectoryUser));
    },
    getDetail: async (id) => {
      const response = await ApiGet(`/api/admin/users/${id}/detail`);
      if (!response.success) return response;

      const payload = response.success.data?.data || {};
      const users = payload.users || {};

      return wrapSuccess({
        ...payload,
        users: {
          restaurant: (users.restaurant || []).map(normalizeDirectoryUser),
          branch: (users.branch || []).map(normalizeDirectoryUser),
          kitchen: (users.kitchen || []).map(normalizeDirectoryUser),
          delivery: (users.delivery || []).map(normalizeDirectoryUser),
          cashier: (users.cashier || []).map(normalizeDirectoryUser),
        },
      });
    },
    updateUser: async (id, data) => ApiPut(`/api/admin/users/${id}`, mapSuperadminUserPayload(id, data)),
    impersonate: (id, adminId) => ApiPost(`/api/admin/users/${id}/impersonate`, { admin_id: adminId }),
  },

  restaurants: {
    getAll: async (params = {}) => {
      const restaurantResponse = await fetchRestaurantUsers({
        search: params.search,
        pageSize: REAL_USER_FETCH_LIMIT,
      });

      if (!restaurantResponse.success) {
        return { fail: restaurantResponse.fail || 'Failed to load restaurants' };
      }

      let items = restaurantResponse.success;
      if (params.status) {
        items = items.filter((restaurant) => restaurant.status === params.status);
      }

      const paginated = paginateRecords(items, params.page, params.size);
      return wrapSuccess({
        records: paginated.records,
        page: Number(params.page) || 0,
        size: Number(params.size) || 10,
        totalRecords: paginated.totalRecords,
        totalPages: paginated.totalPages,
      });
    },
    getById: (id) => ApiGet(`/api/admin/users/${id}`),
    create: (data) => ApiPost('/api/admin/users/add', mapUpdatePayloadToUser(undefined, { ...data, role: 'restaurant' })),
    update: async (id, data) => ApiPut('/api/admin/users/update', mapUpdatePayloadToUser(id, data)),
    delete: (id) => ApiDelete(`/api/admin/users/${id}`),
  },

  subscriptionPlans: {
    getAll: (params) => ApiGet('/api/admin/subscription-plans', params),
    getById: (id) => ApiGet(`/api/admin/subscription-plans/${id}`),
    create: (data) => ApiPost('/api/admin/subscription-plans', data),
    update: (id, data) => ApiPut(`/api/admin/subscription-plans/${id}`, data),
    delete: (id) => ApiDelete(`/api/admin/subscription-plans/${id}`),
  },

  subscriptions: {
    getAll: (params) => ApiGet('/api/admin/subscriptions', params),
    getById: (id) => ApiGet(`/api/admin/subscriptions/${id}`),
    assign: (data) => ApiPost('/api/admin/subscriptions', data),
    update: (id, data) => ApiPut(`/api/admin/subscriptions/${id}`, data),
    cancel: (id) => ApiDelete(`/api/admin/subscriptions/${id}`),
    grantGrace: (id, graceDays) => ApiPost(`/api/admin/subscriptions/${id}/grant-grace`, { grace_days: graceDays }),
    getRestaurants: (search) => ApiGet('/api/admin/subscriptions/restaurants', { search }),
  },

  coupons: {
    getAll: (params) => ApiGet('/api/superadmin/coupons', params),
    getById: (id) => ApiGet(`/api/superadmin/coupons/${id}`),
    create: (data) => ApiPost('/api/superadmin/coupons', data),
    update: (id, data) => ApiPut(`/api/superadmin/coupons/${id}`, data),
    delete: (id) => ApiDelete(`/api/superadmin/coupons/${id}`),
    getUsage: (id) => ApiGet(`/api/superadmin/coupons/${id}/usage`),
    validate: (code, planId) => ApiPost('/api/superadmin/coupons/validate', { code, plan_id: planId }),
    getAdminUsers: (search) => ApiGet('/api/superadmin/coupons/admin-users', { search }),
  },

  settings: {
    get: () => ApiGet('/api/superadmin/settings'),
    updateProfile: (data) => ApiPut('/api/superadmin/settings/profile', data),
    sendPasswordChangeOtp: (currentPassword) => ApiPost('/api/superadmin/settings/password/send-otp', { current_password: currentPassword }),
    updatePassword: (data) => ApiPut('/api/superadmin/settings/password', data),
    getWebhookSettings: () => ApiGet('/api/superadmin/settings/webhook'),
    saveWebhookSettings: (data) => ApiPut('/api/superadmin/settings/webhook', data),
    testWebhook: () => ApiPost('/api/superadmin/settings/webhook/test'),
  },

  reports: {
    getSummary: async (params = {}) => {
      const { fromDate, toDate } = getDefaultDateRange(params);
      const response = await ApiGet('/api/admin/dashboard/summary', { fromDate, toDate });
      if (!response.success) return response;

      const raw = response.success.data?.data || {};
      const summary = raw.summary || {};
      return wrapSuccess({
        ...summary,
        avgOrderValue: summary.avgOrderValue ?? summary.averageOrderValue ?? 0,
      });
    },
    getRestaurantPerformance: (params) => ApiGet('/api/superadmin/reports/restaurant-performance', params),
    getRevenueByRestaurant: (params) => ApiGet('/api/superadmin/reports/revenue-by-restaurant', params),
  },

  notifications: {
    send: (data) => ApiPost('/api/superadmin/notifications/send', data),
    getHistory: (params) => ApiGet('/api/superadmin/notifications/history', params),
  },
};

export default superadminService;
