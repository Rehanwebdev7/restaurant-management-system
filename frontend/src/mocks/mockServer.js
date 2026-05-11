import { mockData } from './mockData';

// ─── Runtime store ───────────────────────────────────────────────
// Sab data yahan live rehta hai — POST/PUT/DELETE se update hota hai
// aur GET yahan se padhta hai. Page reload pe reset ho jaata hai.
const store = {
  restaurants: [
    { id: 101, name: 'RMS Central', email: 'central@rms.local', mobile: '8888888888', ownerName: 'Rajesh Kumar', orderCount: 312, revenue: 94560, status: 'active', planName: 'Standard', isActive: true, createdAt: '2026-01-01T10:00:00Z' },
    { id: 102, name: 'RMS Express', email: 'express@rms.local', mobile: '8888888887', ownerName: 'Priya Sharma', orderCount: 187, revenue: 52340, status: 'active', planName: 'Basic', isActive: true, createdAt: '2026-01-05T10:00:00Z' },
    { id: 103, name: 'Spice Garden', email: 'spice@rms.local', mobile: '9111111111', ownerName: 'Amit Patel', orderCount: 489, revenue: 141230, status: 'active', planName: 'Premium', isActive: true, createdAt: '2026-01-10T10:00:00Z' },
    { id: 104, name: 'Pizza Hub', email: 'pizza@rms.local', mobile: '9222222222', ownerName: 'Neha Rathod', orderCount: 68, revenue: 18760, status: 'inactive', planName: 'Starter', isActive: false, createdAt: '2026-01-15T10:00:00Z' },
    { id: 105, name: 'Tandoor House', email: 'tandoor@rms.local', mobile: '9333333333', ownerName: 'Suresh Verma', orderCount: 156, revenue: 43890, status: 'active', planName: 'Basic', isActive: true, createdAt: '2026-02-01T10:00:00Z' },
    { id: 106, name: 'The Biryani Box', email: 'biryani@rms.local', mobile: '9444444444', ownerName: 'Farhan Sheikh', orderCount: 234, revenue: 71230, status: 'active', planName: 'Standard', isActive: true, createdAt: '2026-02-10T10:00:00Z' },
    { id: 107, name: 'Green Bowl', email: 'green@rms.local', mobile: '9555555550', ownerName: 'Meera Iyer', orderCount: 98, revenue: 27450, status: 'active', planName: 'Starter', isActive: true, createdAt: '2026-02-20T10:00:00Z' },
    { id: 108, name: 'Burger Nation', email: 'burger@rms.local', mobile: '9666666660', ownerName: 'Dhruv Singh', orderCount: 143, revenue: 38920, status: 'active', planName: 'Basic', isActive: true, createdAt: '2026-03-01T10:00:00Z' },
    { id: 109, name: 'Chai & Snacks', email: 'chai@rms.local', mobile: '9777777770', ownerName: 'Kavya Nair', orderCount: 0, revenue: 0, status: 'inactive', planName: null, isActive: false, createdAt: '2026-03-10T10:00:00Z' },
    { id: 110, name: 'The Desi Kitchen', email: 'desi@rms.local', mobile: '9888888880', ownerName: 'Arun Joshi', orderCount: 45, revenue: 12340, status: 'active', planName: 'Standard', isActive: true, createdAt: '2026-03-20T10:00:00Z' }
  ],
  branches:          JSON.parse(JSON.stringify(mockData.branches)),
  users:             JSON.parse(JSON.stringify(mockData.users)),
  customers:         JSON.parse(JSON.stringify(mockData.customers)),
  orders:            JSON.parse(JSON.stringify(mockData.orders)),
  menuCategories:    JSON.parse(JSON.stringify(mockData.menuCategories)),
  menuSubcategories: JSON.parse(JSON.stringify(mockData.menuSubcategories)),
  menuItems:         JSON.parse(JSON.stringify(mockData.menuItems)),
  addons:            JSON.parse(JSON.stringify(mockData.addons)),
  addonItems:        JSON.parse(JSON.stringify(mockData.addonItems)),
  diningTables:      JSON.parse(JSON.stringify(mockData.diningTables)),
  sections:          JSON.parse(JSON.stringify(mockData.sections)),
  deliveryZones:     JSON.parse(JSON.stringify(mockData.deliveryZones)),
  restaurantHours:   JSON.parse(JSON.stringify(mockData.restaurantHours)),
  paymentGateways:   JSON.parse(JSON.stringify(mockData.paymentGateways)),
  coupons:           JSON.parse(JSON.stringify(mockData.coupons)),
  sliders:           JSON.parse(JSON.stringify(mockData.sliders)),
  bankDetails:       JSON.parse(JSON.stringify(mockData.bankDetails)),
  walletTopups:      JSON.parse(JSON.stringify(mockData.walletTopups)),
  outstanding:       JSON.parse(JSON.stringify(mockData.outstanding)),
  subscriptionPlans: JSON.parse(JSON.stringify(mockData.subscriptionPlans)),
  subscriptions:     JSON.parse(JSON.stringify(mockData.subscriptions)),
  approvals: [
    { id: 1, name: 'The Kebab Corner', email: 'kebab@rms.local', mobile: '9100000001', role: 'restaurant', approvalStatus: 'pending', createdAt: '2026-04-18T10:00:00Z' },
    { id: 2, name: 'South Indian Delight', email: 'south@rms.local', mobile: '9100000002', role: 'restaurant', approvalStatus: 'pending', createdAt: '2026-04-19T08:30:00Z' },
    { id: 3, name: 'Wok Express', email: 'wok@rms.local', mobile: '9100000003', role: 'restaurant', approvalStatus: 'pending', createdAt: '2026-04-19T11:00:00Z' },
    { id: 4, name: 'Momo Palace', email: 'momo@rms.local', mobile: '9100000004', role: 'restaurant', approvalStatus: 'pending', createdAt: '2026-04-20T09:00:00Z' },
    { id: 5, name: 'Chai & Snacks', email: 'chai@rms.local', mobile: '9777777770', role: 'restaurant', approvalStatus: 'approved', createdAt: '2026-03-10T10:00:00Z' },
    { id: 6, name: 'Burger Nation', email: 'burger@rms.local', mobile: '9666666660', role: 'restaurant', approvalStatus: 'approved', createdAt: '2026-03-01T10:00:00Z' },
    { id: 7, name: 'Fast Wrap Co.', email: 'wrap@rms.local', mobile: '9100000005', role: 'restaurant', approvalStatus: 'rejected', createdAt: '2026-03-25T10:00:00Z' }
  ],
  superadminCoupons: [
    { couponId: 1, code: 'PLATFORM10', description: '10% off platform fee', discountType: 'percentage', discountValue: 10, maxUses: 100, usedCount: 12, minPlanPrice: 0, validFrom: '2026-01-01', validUntil: '2026-12-31', isActive: true, isGlobal: true },
    { couponId: 2, code: 'LAUNCH500', description: 'Flat $500 off on annual plans', discountType: 'fixed', discountValue: 500, maxUses: 50, usedCount: 8, minPlanPrice: 2000, validFrom: '2026-03-01', validUntil: '2026-06-30', isActive: true, isGlobal: false },
    { couponId: 3, code: 'NEWYEAR25', description: '25% off — New Year special', discountType: 'percentage', discountValue: 25, maxUses: 200, usedCount: 67, minPlanPrice: 0, validFrom: '2026-01-01', validUntil: '2026-01-31', isActive: false, isGlobal: true }
  ],
  branchProfiles:    JSON.parse(JSON.stringify(mockData.branchProfiles)),
  apiLogs:           JSON.parse(JSON.stringify(mockData.apiLogs)),
  settings:          JSON.parse(JSON.stringify(mockData.settings)),
  notifications: [
    { id: 1, title: 'Maintenance Alert', message: 'System maintenance scheduled', target: 'all', sentAt: '2026-04-19T10:00:00Z', status: 'delivered', scheduledAt: null },
    { id: 2, title: 'New Feature', message: 'Check out our new dashboard', target: 'all', sentAt: '2026-04-18T15:00:00Z', status: 'delivered', scheduledAt: null },
    { id: 3, title: 'Payment Reminder', message: 'Your subscription expires soon', target: 'specific', sentAt: '2026-04-17T09:00:00Z', status: 'delivered', scheduledAt: null }
  ],
  superadminProfile: {
    name: 'Super Admin',
    email: 'superadmin@rms.local',
    mobile: '9999999999'
  },
  superadminWebhook: {
    webhook_url: 'https://hooks.example.com/rms',
    webhook_enabled: true,
    webhook_secret: 'webhook_secret_mock'
  },
  withdrawals: [
    { id: 1, customerId: 201, customerName: 'Rajesh Kumar', mobile: '9876543210', amount: 500, requestedAt: '2026-04-18T10:00:00Z', status: 'pending', utr: null },
    { id: 2, customerId: 202, customerName: 'Priya Sharma', mobile: '9876543211', amount: 200, requestedAt: '2026-04-19T11:00:00Z', status: 'approved', utr: null },
    { id: 3, customerId: 203, customerName: 'Amit Verma', mobile: '9876543212', amount: 750, requestedAt: '2026-04-20T09:00:00Z', status: 'pending', utr: null },
    { id: 4, customerId: 204, customerName: 'Neha Singh', mobile: '9876543213', amount: 300, requestedAt: '2026-04-20T14:00:00Z', status: 'paid', utr: 'UTR123456' },
    { id: 5, customerId: 205, customerName: 'Suresh Patel', mobile: '9876543214', amount: 1000, requestedAt: '2026-04-21T08:00:00Z', status: 'rejected', utr: null }
  ],
  marqueeMessages: [
    { id: 1, message: '🎉 Welcome to RMS Central! Order now and get FREE delivery on your first order above $299.', bgColor: '#1e3a5f', textColor: '#ffffff', speed: 30, fontWeight: '500', isActive: true, displayOrder: 1, scheduleStart: null, scheduleEnd: null },
    { id: 2, message: '🔥 Weekend Special: 20% off on all Biryani combos — use code WEEKEND20 at checkout!', bgColor: '#7c3aed', textColor: '#ffffff', speed: 35, fontWeight: '600', isActive: true, displayOrder: 2, scheduleStart: null, scheduleEnd: null },
    { id: 3, message: '⭐ New menu items added: Peri Peri Chicken Wings, Double Patty Burger & Veg Thali — Try them today!', bgColor: '#065f46', textColor: '#ffffff', speed: 40, fontWeight: '500', isActive: true, displayOrder: 3, scheduleStart: null, scheduleEnd: null }
  ],
  kitchenOrders: [
    { id: 3001, orderNumber: 'ORD-3001', orderType: 'DINE_IN', tableNumber: 'T1', status: 'PENDING', createdAt: new Date(Date.now() - 5 * 60000).toISOString(), kitchenAcceptAt: null, kitchenReadyAt: null, orderItems: [{ id: 201, menuItemName: 'Chicken Biryani', quantity: 2, specialInstructions: 'Less spicy', addonItems: [] }, { id: 202, menuItemName: 'Butter Naan', quantity: 4, specialInstructions: '', addonItems: [] }] },
    { id: 3002, orderNumber: 'ORD-3002', orderType: 'DELIVERY', tableNumber: null, status: 'PENDING', createdAt: new Date(Date.now() - 3 * 60000).toISOString(), kitchenAcceptAt: null, kitchenReadyAt: null, orderItems: [{ id: 203, menuItemName: 'Mutton Rogan Josh', quantity: 1, specialInstructions: '', addonItems: [{ name: 'Extra Gravy', quantity: 1 }] }, { id: 204, menuItemName: 'Tandoori Roti', quantity: 3, specialInstructions: '', addonItems: [] }] },
    { id: 3003, orderNumber: 'ORD-3003', orderType: 'TAKEAWAY', tableNumber: null, status: 'PENDING', createdAt: new Date(Date.now() - 8 * 60000).toISOString(), kitchenAcceptAt: null, kitchenReadyAt: null, orderItems: [{ id: 205, menuItemName: 'Veg Thali', quantity: 2, specialInstructions: 'No onion', addonItems: [] }] },
    { id: 3004, orderNumber: 'ORD-3004', orderType: 'DINE_IN', tableNumber: 'T3', status: 'ACCEPTED_ORDER', createdAt: new Date(Date.now() - 15 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 12 * 60000).toISOString(), kitchenReadyAt: null, orderItems: [{ id: 206, menuItemName: 'Butter Chicken', quantity: 1, specialInstructions: 'No onion', addonItems: [] }, { id: 207, menuItemName: 'Jeera Rice', quantity: 1, specialInstructions: '', addonItems: [] }] },
    { id: 3005, orderNumber: 'ORD-3005', orderType: 'DELIVERY', tableNumber: null, status: 'ACCEPTED_ORDER', createdAt: new Date(Date.now() - 18 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 15 * 60000).toISOString(), kitchenReadyAt: null, orderItems: [{ id: 208, menuItemName: 'Peri Peri Chicken Wings', quantity: 2, specialInstructions: 'Extra spicy', addonItems: [{ name: 'Dipping Sauce', quantity: 1 }] }] },
    { id: 3006, orderNumber: 'ORD-3006', orderType: 'DINE_IN', tableNumber: 'F1', status: 'PREPARING_ORDER', createdAt: new Date(Date.now() - 25 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 22 * 60000).toISOString(), kitchenReadyAt: null, orderItems: [{ id: 209, menuItemName: 'Paneer Tikka Masala', quantity: 1, specialInstructions: '', addonItems: [] }, { id: 210, menuItemName: 'Tandoori Roti', quantity: 3, specialInstructions: '', addonItems: [] }] },
    { id: 3007, orderNumber: 'ORD-3007', orderType: 'DELIVERY', tableNumber: null, status: 'PREPARING_ORDER', createdAt: new Date(Date.now() - 20 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 18 * 60000).toISOString(), kitchenReadyAt: null, orderItems: [{ id: 211, menuItemName: 'Dal Makhani', quantity: 1, specialInstructions: 'Extra butter', addonItems: [{ name: 'Extra Paneer', quantity: 1 }] }, { id: 212, menuItemName: 'Garlic Naan', quantity: 2, specialInstructions: '', addonItems: [] }] },
    { id: 3008, orderNumber: 'ORD-3008', orderType: 'TAKEAWAY', tableNumber: null, status: 'READY_FOR_ORDER', createdAt: new Date(Date.now() - 40 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 35 * 60000).toISOString(), kitchenReadyAt: new Date(Date.now() - 5 * 60000).toISOString(), orderItems: [{ id: 213, menuItemName: 'Chicken Shawarma', quantity: 2, specialInstructions: '', addonItems: [] }] },
    { id: 3009, orderNumber: 'ORD-3009', orderType: 'DINE_IN', tableNumber: 'R1', status: 'READY_FOR_ORDER', createdAt: new Date(Date.now() - 35 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 30 * 60000).toISOString(), kitchenReadyAt: new Date(Date.now() - 8 * 60000).toISOString(), orderItems: [{ id: 214, menuItemName: 'Family Biryani Pack', quantity: 1, specialInstructions: '', addonItems: [] }, { id: 215, menuItemName: 'Raita', quantity: 1, specialInstructions: '', addonItems: [] }] },
    { id: 3010, orderNumber: 'ORD-3010', orderType: 'DINE_IN', tableNumber: 'T2', status: 'COMPLETED', createdAt: new Date(Date.now() - 120 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 115 * 60000).toISOString(), kitchenReadyAt: new Date(Date.now() - 105 * 60000).toISOString(), orderItems: [{ id: 216, menuItemName: 'Crunchy Chicken Bucket', quantity: 1, specialInstructions: '', addonItems: [] }] },
    { id: 3011, orderNumber: 'ORD-3011', orderType: 'DELIVERY', tableNumber: null, status: 'COMPLETED', createdAt: new Date(Date.now() - 90 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 85 * 60000).toISOString(), kitchenReadyAt: new Date(Date.now() - 75 * 60000).toISOString(), orderItems: [{ id: 217, menuItemName: 'Mutton Biryani', quantity: 1, specialInstructions: '', addonItems: [] }, { id: 218, menuItemName: 'Gulab Jamun', quantity: 2, specialInstructions: '', addonItems: [] }] },
    { id: 3012, orderNumber: 'ORD-3012', orderType: 'TAKEAWAY', tableNumber: null, status: 'COMPLETED', createdAt: new Date(Date.now() - 180 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 175 * 60000).toISOString(), kitchenReadyAt: new Date(Date.now() - 165 * 60000).toISOString(), orderItems: [{ id: 219, menuItemName: 'Double Patty Burger', quantity: 2, specialInstructions: '', addonItems: [] }] },
    { id: 3013, orderNumber: 'ORD-3013', orderType: 'DINE_IN', tableNumber: 'T4', status: 'CANCELLED', createdAt: new Date(Date.now() - 150 * 60000).toISOString(), kitchenAcceptAt: null, kitchenReadyAt: null, orderItems: [{ id: 220, menuItemName: 'Veg Burger', quantity: 2, specialInstructions: '', addonItems: [] }] },
    { id: 3014, orderNumber: 'ORD-3014', orderType: 'DELIVERY', tableNumber: null, status: 'CANCELLED', createdAt: new Date(Date.now() - 200 * 60000).toISOString(), kitchenAcceptAt: null, kitchenReadyAt: null, orderItems: [{ id: 221, menuItemName: 'Chicken Lollipop', quantity: 6, specialInstructions: '', addonItems: [] }] },
    { id: 3015, orderNumber: 'ORD-3015', orderType: 'DINE_IN', tableNumber: 'F2', status: 'COMPLETED', createdAt: new Date(Date.now() - 240 * 60000).toISOString(), kitchenAcceptAt: new Date(Date.now() - 235 * 60000).toISOString(), kitchenReadyAt: new Date(Date.now() - 225 * 60000).toISOString(), orderItems: [{ id: 222, menuItemName: 'Hara Bhara Kabab', quantity: 1, specialInstructions: '', addonItems: [] }, { id: 223, menuItemName: 'Masala Chai', quantity: 2, specialInstructions: '', addonItems: [] }] }
  ],
  deliveryOrders: [
    { id: 5001, orderNumber: 'ORD-5001', status: 'READY_FOR_ORDER', orderType: 'DELIVERY', deliveryBoyId: 24, customerName: 'Amit Kumar', customerPhone: '9876543210', deliveryAddress: '123, ABC Street, Nashik', totalAmount: 380, items: [{ name: 'Chicken Biryani', quantity: 2, price: 190 }], createdAt: new Date().toISOString() },
    { id: 5002, orderNumber: 'ORD-5002', status: 'OUT_FOR_DELIVERY', orderType: 'DELIVERY', deliveryBoyId: 24, customerName: 'Priya Sharma', customerPhone: '9123456780', deliveryAddress: '456, XYZ Colony, Nashik', totalAmount: 220, items: [{ name: 'Butter Chicken', quantity: 1, price: 220 }], createdAt: new Date().toISOString() },
    { id: 5003, orderNumber: 'ORD-5003', status: 'DELIVERED', orderType: 'DELIVERY', deliveryBoyId: 24, customerName: 'Raj Patel', customerPhone: '9000001234', deliveryAddress: '789, PQR Nagar, Nashik', totalAmount: 150, items: [{ name: 'Dal Makhani', quantity: 1, price: 150 }], createdAt: new Date(Date.now() - 3600000).toISOString() }
  ],
  customerAddresses: JSON.parse(JSON.stringify(mockData.customerAddresses))
};

// Helper: find + update item in array
const updateById = (arr, id, patch) => {
  const idx = arr.findIndex(item => String(item.id || item.subscriptionId || item.planId || item.couponId) === String(id));
  if (idx !== -1) Object.assign(arr[idx], patch);
};

// Helper: get next id
const nextId = (arr, idField = 'id') => Math.max(0, ...arr.map(i => Number(i[idField] || i.id || i.couponId || 0))) + 1;

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const EXCEL_HEADERS = {
  'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

export const isMockEnabled = () => {
  if (process.env.REACT_APP_USE_MOCKS === 'false') return false;
  if (process.env.REACT_APP_USE_MOCKS === 'true') return true;
  return false; // default: real backend
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const buildUrl = (rawUrl) => {
  try {
    return new URL(rawUrl, window.location.origin);
  } catch {
    return new URL(window.location.origin);
  }
};

const paginate = (items, pageNumber = 0, pageSize = items.length || 10) => {
  const pn = Number(pageNumber) || 0;
  const ps = Math.max(Number(pageSize) || items.length || 10, 1);
  const start = pn * ps;
  const records = items.slice(start, start + ps);
  return {
    records,
    totalRecords: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / ps))
  };
};

const normalizeApprovalRecord = (approval = {}) => ({
  id: approval.id,
  name: approval.name || '',
  email: approval.email || '',
  mobile: approval.mobile || '',
  role: approval.role || 'restaurant',
  approvalStatus: approval.approvalStatus || approval.status || 'pending',
  approvalNotes: approval.approvalNotes || approval.approval_notes || '',
  hospitalName: approval.hospitalName || approval.hospital_name || approval.name || '',
  hospitalType: approval.hospitalType || approval.hospital_type || '',
  gstNumber: approval.gstNumber || approval.gst_number || '',
  city: approval.city || '',
  state: approval.state || '',
  pincode: approval.pincode || '',
  isActive: typeof approval.isActive === 'boolean' ? approval.isActive : approval.approvalStatus === 'approved',
  createdAt: approval.createdAt || new Date().toISOString()
});

const mapApprovalUpdate = (body = {}) => {
  const patch = {};
  const fieldMap = {
    name: 'name',
    email: 'email',
    mobile: 'mobile',
    hospitalName: 'hospitalName',
    hospital_name: 'hospitalName',
    hospitalType: 'hospitalType',
    hospital_type: 'hospitalType',
    gstNumber: 'gstNumber',
    gst_number: 'gstNumber',
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    approvalNotes: 'approvalNotes',
    approval_notes: 'approvalNotes',
    approvalStatus: 'approvalStatus',
    approval_status: 'approvalStatus'
  };

  Object.entries(fieldMap).forEach(([incomingKey, normalizedKey]) => {
    if (body[incomingKey] !== undefined) {
      patch[normalizedKey] = body[incomingKey];
    }
  });

  return patch;
};

const parseJsonField = (body, key) => {
  const raw = body?.get?.(key) ?? body?.[key];
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const normalizeRestaurantCoupon = (coupon = {}) => ({
  id: coupon.id,
  couponName: coupon.couponName || coupon.name || '',
  couponCode: coupon.couponCode || coupon.code || '',
  discountAmount: coupon.discountAmount ?? coupon.discountValue ?? 0,
  isPercent: coupon.isPercent ?? (coupon.discountType === 'PERCENT'),
  validity: coupon.validity || coupon.expiryDate || '',
  displayOnScreen: coupon.displayOnScreen ?? true,
  description: coupon.description || '',
  title: coupon.title || coupon.name || '',
  global: coupon.global || false,
  firstOrder: coupon.firstOrder || false,
  branchId: coupon.branchId || null,
  menuItems: coupon.menuItems || [],
  couponMappingId: coupon.couponMappingId || [],
  usageLimit: coupon.usageLimit ?? coupon.maxUses ?? '',
  quantity: coupon.quantity ?? '',
  logo: coupon.logo || coupon.logoUrl || null,
  logoUrl: coupon.logoUrl || coupon.logo || null,
  isActive: coupon.isActive !== false
});

const normalizePaymentGateway = (gateway = {}) => ({
  id: gateway.id,
  vendorname: gateway.vendorname || gateway.name || gateway.gatewayName || '',
  title: gateway.title || gateway.name || gateway.gatewayName || '',
  paymentMethod: gateway.paymentMethod || 'PG',
  onOf: gateway.onOf || (gateway.isActive === false ? 'OFF' : 'ON'),
  status: gateway.status ?? gateway.isActive ?? true,
  credentials: gateway.credentials || {
    mode: gateway.mode || 'TEST',
    key_id: gateway.key_id || '',
    key_secret: gateway.key_secret || '',
    currency: gateway.currency || 'INR',
    webhook_secret: gateway.webhook_secret || ''
  }
});

const normalizeRestaurantHourRecord = (hour = {}, fallback = {}) => {
  const normalized = {
    id: hour.id ?? fallback.id,
    restaurantId: hour.restaurantId ?? fallback.restaurantId ?? null,
    branchId: hour.branchId ?? fallback.branchId ?? null,
    dayOfWeek: hour.dayOfWeek || (typeof hour.day === 'string' ? hour.day.toLowerCase() : '') || fallback.dayOfWeek || '',
    specialDate: hour.specialDate || fallback.specialDate || '',
    openingTime: (hour.openingTime || hour.openTime || fallback.openingTime || fallback.openTime || '00:00').slice(0, 5),
    closingTime: (hour.closingTime || hour.closeTime || fallback.closingTime || fallback.closeTime || '00:00').slice(0, 5),
    isClosed: typeof hour.isClosed === 'boolean'
      ? hour.isClosed
      : typeof hour.isOpen === 'boolean'
        ? !hour.isOpen
        : typeof fallback.isClosed === 'boolean'
          ? fallback.isClosed
          : false
  };

  if (!normalized.dayOfWeek) delete normalized.dayOfWeek;
  if (!normalized.specialDate) delete normalized.specialDate;
  return normalized;
};

const success = (data = {}, message = 'Success') => ({
  status: 200,
  data: { Status: 'SUCCESS', StatusCode: 200, message, data }
});

const created = (data = {}, message = 'Created successfully') => ({
  status: 200,
  data: { Status: 'SUCCESS', StatusCode: 200, message, data }
});

const blobSuccess = (body = 'mock file', headers = EXCEL_HEADERS) => ({
  status: 200,
  headers,
  body
});

const normalizeRequest = (method, rawUrl, config = {}) => {
  const url = buildUrl(rawUrl);
  const path = url.pathname;
  const params = new URLSearchParams(url.search);
  const configParams = config.params || {};
  Object.entries(configParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = body;
    }
  }

  return {
    method: method.toUpperCase(),
    path,
    params,
    body,
    headers: config.headers || {}
  };
};

const filterList = (items, params, options = {}) => {
  const searchValue = (params.get('searchValue') || params.get('search') || '').toLowerCase();
  const role = params.get('role');
  const status = params.get('status');
  const isActive = params.get('isActive');
  const categoryId = params.get('categoryId');
  const subcategoryId = params.get('subcategoryId');
  const branchId = params.get('branchId');

  return items.filter((item) => {
    if (role && item.role && item.role !== role) return false;
    if (status && item.status && item.status !== status) return false;
    if (isActive !== null && isActive !== '' && typeof item.isActive === 'boolean') {
      if (String(item.isActive) !== String(isActive)) return false;
    }
    if (categoryId && item.menuCategoryId?.id && String(item.menuCategoryId.id) !== String(categoryId)) return false;
    if (subcategoryId && item.menuSubCategoryId?.id && String(item.menuSubCategoryId.id) !== String(subcategoryId)) return false;
    if (branchId && item.branchId?.id && String(item.branchId.id) !== String(branchId)) return false;
    if (!searchValue) return true;

    const haystack = [
      item.name,
      item.customerName,
      item.customerName,
      item.mobile,
      item.email,
      item.orderNumber,
      item.code,
      item.description
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchValue);
  });
};

const getUsersByRole = (role) => {
  if (role === 'restaurant') {
    return deepClone(store.restaurants).map((restaurant) => ({
      ...restaurant,
      user_id: restaurant.id,
      role: 'restaurant',
      full_name: restaurant.ownerName || restaurant.name
    }));
  }
  if (role === 'branch') return deepClone(store.branches);
  return deepClone(store.users.filter((user) => !role || user.role === role));
};

const dashboardSummary = () => {
  const orders = store.orders;
  const totalRev = orders.reduce((s, o) => s + Number(o.payableAmount || 0), 0);
  const recentFive = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  return ({
  summary: {
    totalOrders: orders.length,
    totalRevenue: totalRev,
    averageOrderValue: Math.round(totalRev / Math.max(orders.length, 1)),
    period: { fromDate: '2026-03-18', toDate: '2026-04-20' }
  },
  orderByStatus: {
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    COMPLETED: orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status)).length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
    UNKNOWN: 0,
    WORKING: orders.filter((o) => ['PREPARING', 'READY', 'CONFIRMED'].includes(o.status)).length
  },
  // SuperAdmin platform stats
  total_restaurants: mockData.restaurants.length,
  active_restaurants: mockData.restaurants.filter(r => r.isActive).length,
  total_branches: mockData.branches.length,
  active_subscriptions: mockData.subscriptions.filter(s => s.status === 'active').length,
  expiring_soon: mockData.subscriptions.filter(s => s.status === 'grace').length,
  expired_subscriptions: mockData.subscriptions.filter(s => s.status === 'expired').length,
  total_revenue: totalRev,
  total_orders: orders.length,
  pending_orders: orders.filter(o => o.status === 'PENDING').length,
  completed_orders: orders.filter(o => ['DELIVERED','COMPLETED'].includes(o.status)).length,
  cancelled_orders: orders.filter(o => o.status === 'CANCELLED').length,
  preparing_orders: orders.filter(o => ['PREPARING','READY','CONFIRMED'].includes(o.status)).length,
  pending_verifications: 2,
  total_customers: store.customers.length,
  today_revenue: orders.filter(o => o.createdAt?.startsWith('2026-04-20')).reduce((s,o) => s + Number(o.payableAmount||0), 0) || 14320,
  active_coupons: store.coupons.filter(c => c.isActive).length,
  // Order Status Distribution (for Doughnut chart)
  order_status_distribution: {
    pending: orders.filter(o => o.status === 'PENDING').length,
    preparing: orders.filter(o => ['PREPARING','CONFIRMED'].includes(o.status)).length,
    completed: orders.filter(o => ['DELIVERED','COMPLETED'].includes(o.status)).length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
  },
  // Restaurant-wide KPIs
  todayRevenue: orders.filter(o => o.createdAt?.startsWith('2026-04-20')).reduce((s,o) => s + Number(o.payableAmount||0), 0) || 14320,
  todayOrders: orders.filter(o => o.createdAt?.startsWith('2026-04-20')).length || 18,
  activeMenuItems: store.menuItems.filter(m => m.isActive).length,
  totalCustomers: store.customers.length,
  activeBranches: store.branches.length,
  recentOrders: recentFive.map(o => ({
    orderId: '#' + o.orderNumber,
    customerName: o.customerName,
    items: o.orderItems?.map(i => `${i.menuItemName}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ') || '',
    status: o.status === 'PREPARING' ? 'WORKING' : o.status,
    amount: o.payableAmount,
    createdAt: o.createdAt
  })),
  topMenuItems: [
    { name: 'Crunchy Chicken Bucket', orderCount: 48, price: 499 },
    { name: 'Chicken Biryani', orderCount: 42, price: 389 },
    { name: 'Paneer Tikka', orderCount: 37, price: 229 },
    { name: 'Butter Chicken', orderCount: 31, price: 329 },
    { name: 'Mutton Biryani', orderCount: 26, price: 449 }
  ],
  lowStockItems: [
    { id: 1, name: 'Paneer', stock: 5, threshold: 10, unit: 'kg', level: 'critical' },
    { id: 2, name: 'Naan Dough', stock: 8, threshold: 10, unit: 'pcs', level: 'low' },
    { id: 3, name: 'Chicken Breast', stock: 3, threshold: 8, unit: 'kg', level: 'critical' },
    { id: 4, name: 'Heavy Cream', stock: 9, threshold: 10, unit: 'litre', level: 'low' }
  ],
  // Restaurant-wise order summary (NO customer details - just counts)
  restaurant_order_summary: [
    { id: 101, name: 'RMS Central', total_orders: 312, pending: 42, completed: 246, cancelled: 24 },
    { id: 102, name: 'RMS Express', total_orders: 187, pending: 28, completed: 143, cancelled: 16 },
    { id: 103, name: 'Spice Garden', total_orders: 489, pending: 61, completed: 401, cancelled: 27 },
    { id: 104, name: 'Pizza Hub', total_orders: 68, pending: 8, completed: 52, cancelled: 8 },
    { id: 105, name: 'Tandoor House', total_orders: 156, pending: 19, completed: 124, cancelled: 13 },
    { id: 106, name: 'The Biryani Box', total_orders: 234, pending: 33, completed: 189, cancelled: 12 },
    { id: 107, name: 'Green Bowl', total_orders: 98, pending: 14, completed: 79, cancelled: 5 },
    { id: 108, name: 'Burger Nation', total_orders: 143, pending: 22, completed: 112, cancelled: 9 },
  ],
  // Order trend last 7 days (combined all restaurants)
  order_trend: [
    { day: 'Mon', orders: 38 },
    { day: 'Tue', orders: 52 },
    { day: 'Wed', orders: 44 },
    { day: 'Thu', orders: 61 },
    { day: 'Fri', orders: 78 },
    { day: 'Sat', orders: 95 },
    { day: 'Sun', orders: 72 },
  ],
  restaurant_performance: [
    { id: 101, name: 'RMS Central', orders: 312, revenue: 94560, status: 'active', plan: 'Standard', subscription_status: 'ACTIVE' },
    { id: 102, name: 'RMS Express', orders: 187, revenue: 52340, status: 'active', plan: 'Basic', subscription_status: 'ACTIVE' },
    { id: 103, name: 'Spice Garden', orders: 489, revenue: 141230, status: 'active', plan: 'Premium', subscription_status: 'GRACE' },
    { id: 104, name: 'Pizza Hub', orders: 68, revenue: 18760, status: 'inactive', plan: 'Starter', subscription_status: 'EXPIRED' },
    { id: 105, name: 'Tandoor House', orders: 156, revenue: 43890, status: 'active', plan: 'Basic', subscription_status: 'ACTIVE' },
    { id: 106, name: 'The Biryani Box', orders: 234, revenue: 71230, status: 'active', plan: 'Standard', subscription_status: 'ACTIVE' },
    { id: 107, name: 'Green Bowl', orders: 98, revenue: 27450, status: 'active', plan: 'Starter', subscription_status: 'EXPIRED' },
    { id: 108, name: 'Burger Nation', orders: 143, revenue: 38920, status: 'active', plan: 'Basic', subscription_status: 'SUSPENDED' }
  ],
  pending_verifications_list: [
    { id: 104, name: 'Pizza Hub', email: 'pizza@rms.local', applied_days_ago: 2 },
    { id: 105, name: 'Tandoor House', email: 'tandoor@rms.local', applied_days_ago: 1 }
  ],
  expiring_subscriptions_list: [
    { id: 101, name: 'RMS Central', expires_in_days: 5 },
    { id: 102, name: 'RMS Express', expires_in_days: 12 },
    { id: 103, name: 'Spice Garden', expires_in_days: 18 }
  ],
  monthly_revenue: [
    { month: 'Nov', revenue: 12000, is_current: false },
    { month: 'Dec', revenue: 18500, is_current: false },
    { month: 'Jan', revenue: 15200, is_current: false },
    { month: 'Feb', revenue: 21000, is_current: false },
    { month: 'Mar', revenue: 24500, is_current: false },
    { month: 'Apr', revenue: 18997, is_current: true }
  ],
  topRestaurants: mockData.restaurants.map((restaurant) => ({ ...restaurant, orderCount: 12 })),
  revenueTrend: [
    { date: '2026-04-14', orders: 24, revenue: 8900 },
    { date: '2026-04-15', orders: 31, revenue: 11200 },
    { date: '2026-04-16', orders: 28, revenue: 10100 },
    { date: '2026-04-17', orders: 35, revenue: 13200 },
    { date: '2026-04-18', orders: 29, revenue: 10500 },
    { date: '2026-04-19', orders: 38, revenue: 14100 },
    { date: '2026-04-20', orders: 18, revenue: 6500 }
  ],
});
};

const customerMenuResponse = (params) => {
  const categoryId = params.get('categoryId');
  const subcategoryId = params.get('subcategoryId');
  const pageNumber = Number(params.get('pageNumber') || 0);
  const pageSize = Number(params.get('pageSize') || 10);
  const vegOnly = params.get('dietaryType') === 'true' || params.get('vegOnly') === 'true';

  let items = deepClone(mockData.menuItems);
  if (categoryId && categoryId !== 'all') {
    items = items.filter((item) => String(item.menuCategoryId?.id) === String(categoryId));
  }
  if (subcategoryId && subcategoryId !== 'all_sub') {
    items = items.filter((item) => String(item.menuSubCategoryId?.id) === String(subcategoryId));
  }
  if (vegOnly) {
    items = items.filter((item) => item.foodType === 'VEG');
  }

  return paginate(items, pageNumber, pageSize);
};

const resolveEntityList = (path) => {
  if (path.includes('/menu_category/')) return deepClone(store.menuCategories);
  if (path.includes('/menu_subcategory/')) return deepClone(store.menuSubcategories);
  if (path.includes('/menu_items/')) return deepClone(store.menuItems);
  if (path.includes('/addons_items/') || path.includes('/addon_items/')) return deepClone(store.addonItems);
  if (path.includes('/addons/')) return deepClone(store.addons);
  if (path.includes('/dining_tables/')) return deepClone(store.diningTables);
  if (path.includes('/section/')) return deepClone(store.sections);
  if (path.includes('/delivery_zones/')) return deepClone(store.deliveryZones);
  if (path.includes('/restaurant_hours/')) return deepClone(store.restaurantHours);
  if (path.includes('/payment_gateway/')) return deepClone(store.paymentGateways);
  if (path.includes('/coupon/')) return deepClone(store.coupons);
  if (path.includes('/sliders/')) return deepClone(store.sliders);
  if (path.includes('/bank_details/')) return deepClone(store.bankDetails);
  if (path.includes('/wallet_topup_request/')) return deepClone(store.walletTopups);
  if (path.includes('/withdrawals/')) return deepClone(store.withdrawals);
  if (path.includes('/outstanding/')) return deepClone(store.outstanding);
  if (path.includes('/orders/')) return deepClone(store.orders);
  if (path.includes('/users_profile/')) return deepClone(store.branchProfiles);
  if (path.includes('/customers/')) return deepClone(store.customers);
  if (path.includes('/subscription-plans')) return deepClone(store.subscriptionPlans);
  if (path.includes('/subscriptions')) return deepClone(store.subscriptions);
  if (path.includes('/user-approvals')) return deepClone(store.approvals).map(normalizeApprovalRecord);
  return [];
};

const handleAuthRoutes = ({ method, path, body }) => {
  const panelRoleMap = {
    '9999999999': { role: 'supadmin', name: 'Super Admin', id: 1 },
    '8888888888': { role: 'restaurant', name: 'Restaurant Admin', id: 2 },
    '7777777777': { role: 'branch', name: 'Branch Manager', id: 3 },
    '6666666666': { role: 'kitchen', name: 'Kitchen User', id: 4 },
    '5555555555': { role: 'cashier', name: 'Cashier User', id: 5 },
    '4444444444': { role: 'delivery', name: 'Ramu Delivery', id: 24 },
    '4400000001': { role: 'delivery', name: 'Shyam Delivery', id: 25 },
    '4400000002': { role: 'delivery', name: 'Kiran Delivery', id: 26 },
    '4400000003': { role: 'delivery', name: 'Rajesh Delivery', id: 31 },
    '4400000004': { role: 'delivery', name: 'Ankur Delivery', id: 32 },
    '4400000005': { role: 'delivery', name: 'Gopal Delivery', id: 33 },
    '4400000006': { role: 'delivery', name: 'Sanjay Delivery', id: 34 }
  };

  if (method === 'POST' && path === '/login/panelLogin') {
    const profile = panelRoleMap[body?.mobile] || { role: 'admin', name: 'Admin User', id: 10 };
    return success({
      token: `mock-token-${profile.role}`,
      userType: profile.role,
      name: profile.name,
      mobile: body?.mobile || '9999999999',
      id: profile.id
    }, 'Login successful');
  }

  if (method === 'POST' && path === '/login/send_otp') {
    return success({ token: 'mock-customer-otp-token', otp: '123456' }, 'OTP sent successfully');
  }

  if (method === 'POST' && path === '/login/verify_otp') {
    localStorage.setItem('customerToken', 'mock-customer-token');
    localStorage.setItem('customerData', JSON.stringify(mockData.customers[0]));
    return success({ token: 'mock-customer-token', customer: mockData.customers[0] }, 'OTP verified');
  }

  // Signup: Send OTP
  if (method === 'POST' && path === '/signup/send_otp') {
    return success({ token: 'mock-otp-token-' + Date.now(), mobile: body?.mobile || '9876543210' }, 'OTP sent successfully');
  }

  // Signup: Verify OTP
  if (method === 'POST' && path === '/signup/verify_otp') {
    return success({
      token: 'mock-signup-token-' + Date.now(),
      mobile: body?.mobile || '9876543210',
      restaurantId: 501
    }, 'OTP verified successfully');
  }

  // Signup: DigiLocker
  if (method === 'POST' && path === '/signup/digilocker') {
    const url = `${window.location.origin}/signup/aadhaar?gateway=digilocker&type=aadhaar&client_id=mock-client&status=success`;
    return success({ url }, 'DigiLocker initialized');
  }

  // Signup: DigiLocker Callback
  if (method === 'GET' && path === '/signup/callBack') {
    return success({
      aadhar_name: 'Aman Verma',
      aadhar_mask: 'XXXX-XXXX-1234',
      address: 'Mock Aadhaar Address'
    }, 'Aadhaar verified');
  }

  // Signup: PAN Verify
  if (method === 'POST' && path === '/signup/panVerify') {
    return success({
      namePanCard: 'Demo User',
      panNumber: body?.panNumber || 'ABCDE1234F',
      status: 'VALID'
    }, 'PAN verified successfully');
  }

  // Signup: Save Profile (business details + documents)
  if (method === 'POST' && path === '/signup/save-profile') {
    // Body can be plain object OR FormData (multipart upload)
    let payload = body || {};
    if (body instanceof FormData) {
      try { payload = JSON.parse(body.get('payload') || '{}'); } catch { payload = {}; }
    } else if (typeof body === 'object' && body !== null && typeof body.get === 'function') {
      try { payload = JSON.parse(body.get('payload') || '{}'); } catch { payload = {}; }
    }
    const restaurantId = nextId(store.restaurants);
    const mobile = payload?.mobile || payload?.mobileNumber || '9876543210';
    const restaurantName = payload?.name || payload?.restaurantName || 'New Restaurant';
    const createdAt = new Date().toISOString();

    // Add to restaurants list (so it shows up immediately)
    // Status is 'active' because Super Admin is creating it directly
    const newRestaurant = {
      id: restaurantId,
      name: restaurantName,
      email: payload?.email || '',
      mobile,
      ownerName: payload?.ownerName || '',
      address: payload?.address || '',
      city: payload?.city || '',
      state: payload?.state || '',
      pincode: payload?.pincode || '',
      gstNumber: payload?.gstNumber || '',
      entityType: payload?.entityType || 'Proprietor',
      restaurantType: payload?.hospitalType || 'both',
      restaurantCode: payload?.hospitalCode || '',
      primaryColor: payload?.primaryColor || '#3B82F6',
      logoUrl: payload?.logoUrl || '',
      aadhaarNumber: payload?.aadhaarNumber || '',
      panNumber: payload?.panNumber || '',
      orderCount: 0,
      revenue: 0,
      status: 'active',
      planName: 'Basic',
      isActive: true,
      createdAt
    };
    store.restaurants.push(newRestaurant);

    console.log('✅ [MOCK] Restaurant created via signup:', newRestaurant);
    return created({
      restaurantId,
      uniqueId: `RMS${restaurantId}`,
      password: 'Demo@1234',
      pin: '1234',
      mobile
    }, 'Restaurant profile saved successfully');
  }

  if (method === 'POST' && ['/login/fp_sendOTP', '/login/fp_verifyOTP', '/login/set_password'].includes(path)) {
    return success({ token: 'mock-signup-token', restaurantId: 101 }, 'Operation successful');
  }

  return null;
};

const handlePublicCustomerRoutes = ({ method, path, params, body }) => {
  if (method === 'GET' && path === '/api/public/customer/search') {
    return success(mockData.locations.filter((item) => item.description.toLowerCase().includes((params.get('q') || '').toLowerCase())));
  }

  if (method === 'GET' && path === '/api/public/customer/details') {
    return success({
      address: 'Mock Street, Nashik',
      latitude: 20.015,
      longitude: 73.781,
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422001'
    });
  }

  if (method === 'GET' && path.includes('/api/public/customer/sections/tax-details')) {
    return success({ gstPercentage: 5, serviceChargePercentage: 2, deliveryCharge: 30 });
  }

  if (method === 'GET' && path.includes('/api/global/theme/getBy')) {
    return success(mockData.theme);
  }

  if (method === 'GET' && path === '/api/global/marquee/getByRestId') {
    return success(store.marqueeMessages.filter(m => m.isActive));
  }

  // Marquee Messages CRUD — for restaurant settings page
  if (path.includes('/api/admin/business_setting/marquee-message')) {
    if (method === 'GET') {
      return success(deepClone(store.marqueeMessages));
    }
    if (method === 'POST') {
      const newMsg = { id: nextId(store.marqueeMessages), ...body, createdAt: new Date().toISOString() };
      store.marqueeMessages.push(newMsg);
      return created(newMsg, 'Marquee message added');
    }
    if (method === 'PUT') {
      updateById(store.marqueeMessages, body.id, body);
      return success(body, 'Marquee message updated');
    }
    const deleteId = path.split('/').pop();
    if (method === 'DELETE') {
      store.marqueeMessages = store.marqueeMessages.filter(m => String(m.id) !== String(deleteId));
      return success(null, 'Marquee message deleted');
    }
  }

  if (method === 'GET' && path.includes('/api/public/customer/sections')) {
    return success(paginate(mockData.menuCategories, Number(params.get('pageNumber') || 0), Number(params.get('pageSize') || 10)));
  }

  if (method === 'GET' && path.includes('/api/public/customer/menu-items')) {
    return success(customerMenuResponse(params));
  }

  if (method === 'POST' && path === '/api/customer/coupon/available') {
    return success({ global: mockData.coupons, suggested: mockData.coupons.slice(0, 1), firstOrder: mockData.coupons.slice(0, 1) });
  }

  if (method === 'POST' && path === '/api/customer/coupon/apply') {
    return success({ discount: 50, isPercent: false, paybleAmount: 388, coupon: mockData.coupons[0] }, 'Coupon applied');
  }

  if (method === 'GET' && path === '/api/customer/orders/isAllowedOrder') {
    return success({ deliveryCharge: 30 }, 'Delivery available');
  }

  if (method === 'GET' && path === '/api/customer/payment_gateway/restaurantId') {
    return success(mockData.paymentGateways);
  }

  if (method === 'GET' && path === '/api/customer/customer_delivery_addresses/getAddress') {
    const allAddrs = deepClone(store.customerAddresses || mockData.customerAddresses);
    return success({
      priorAddress: allAddrs[0] || null,  // single object, not array
      otherAddresses: allAddrs.slice(1)
    });
  }

  if (method === 'POST' && path === '/api/customer/customer_delivery_addresses/add') {
    return created({ id: Date.now(), ...body }, 'Address added');
  }

  if (method === 'GET' && (path === '/api/customer/orders/all' || path === '/api/customer/orders/filter')) {
    return success(paginate(deepClone(mockData.orders), Number(params.get('pageNumber') || 0), Number(params.get('pageSize') || 10)));
  }

  if (method === 'PUT' && path === '/api/customer/orders/update') {
    return success({ ...body }, 'Order updated');
  }

  if (method === 'POST' && path === '/api/customer/orders/adds') {
    const orderDate = new Date();
    const orderId = Date.now();
    const orderNumber = `ORD-${orderId}`;

    // Customer order (for /api/customer/orders/all endpoint)
    const newOrder = {
      id: orderId,
      orderId: orderId,
      orderNumber: orderNumber,
      status: 'PENDING',
      orderType: body.orderType || 'DELIVERY',
      branchId: body.branchId,
      customerName: body.customerName || 'Guest',
      customerPhone: body.customerPhone || '',
      customerEmail: body.cutomerEmail || body.customerEmail || '',
      items: body.items || [],
      totalAmount: body.totalAmount || 0,
      paymentMethod: body.paymentMethod || 'COD',
      custAddressId: body.custAddressId || null,
      couponCode: body.couponCode || null,
      createdAt: orderDate.toISOString()
    };

    // Kitchen order (for kitchen display)
    const kitchenOrder = {
      id: orderId,
      orderNumber: orderNumber,
      orderType: body.orderType || 'DELIVERY',
      status: 'PENDING',
      branchId: body.branchId,
      customerName: body.customerName || 'Guest',
      customerPhone: body.customerPhone || '',
      items: body.items || [],
      totalAmount: body.totalAmount || 0,
      paymentMethod: body.paymentMethod || 'COD',
      tableNo: body.tableNo || null,
      createdAt: orderDate.toISOString(),
      kitchenAcceptAt: null,
      kitchenReadyAt: null
    };

    // Save to both stores
    store.orders = store.orders || [];
    store.orders.unshift(newOrder);

    store.kitchenOrders = store.kitchenOrders || [];
    store.kitchenOrders.unshift(kitchenOrder);

    return created({ order: newOrder, orderId: newOrder.id, orderNumber: newOrder.orderNumber }, 'Order placed successfully');
  }

  if (method === 'POST' && path === '/api/customer/ccavenue/payment-request') {
    return success({
      encRequest: 'MOCK_ENC_REQUEST_' + Date.now(),
      access_code: 'MOCK_ACCESS_CODE',
      ccavenue_url: 'https://secure.ccavenue.com/transaction/transaction.do'
    }, 'Payment session created');
  }

  if (method === 'POST' && path.includes('/payment-response')) {
    return success({ orderNumber: 'MOCK123', paymentStatus: 'SUCCESS' });
  }

  // GET /api/public/customer/nearest-branches
  if (method === 'GET' && path.includes('/nearest-branches')) {
    const branches = (store.branches || mockData.branches || []).slice(0, 3).map(b => ({
      branchId: b.id,
      branchName: b.name,
      address: b.address || 'City Center',
      phone: '9000000000',
      distance_km: 1.2,
      time_text: '15 mins',
      time_minutes: 15,
      deliveryCharge: 30,
      isOpen: true
    }));
    return success(branches);
  }

  // GET /api/public/customer/menucategories/filter
  if (method === 'GET' && path.includes('/menucategories/filter')) {
    const categories = deepClone(store.menuCategories || mockData.menuCategories).map(cat => ({
      ...cat,
      iconUrl: cat.iconUrl || 'https://cdn-icons-png.flaticon.com/128/2313/2313712.png',
      subcategories: cat.subcategories || []
    }));
    const page = Number(params.get('pageNumber') || 0);
    const size = Number(params.get('pageSize') || 12);
    return success(paginate(categories, page, size));
  }

  // GET /api/public/customer/subCategories/getByCategoriesId
  if (method === 'GET' && path.includes('/subCategories/getByCategoriesId')) {
    const catId = Number(params.get('categoryId'));
    const subs = deepClone(store.menuSubcategories || mockData.menuSubcategories || []);
    const filtered = catId ? subs.filter(s => s.categoryId === catId) : subs;
    return success(paginate(filtered, 0, 50));
  }

  // GET /api/public/customer/menu_items/advanceFilter
  if (method === 'GET' && path.includes('/menu_items/advanceFilter')) {
    const foodImages = [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      'https://images.unsplash.com/photo-1585238341710-4b4e6f8f8e8f?w=400',
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc029?w=400',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      'https://images.unsplash.com/photo-1585521537332-a0b0e53e2b00?w=400',
      'https://images.unsplash.com/photo-1597521368149-fd3035cecb47?w=400'
    ];

    let items = deepClone(store.menuItems || mockData.menuItems).map((item, idx) => ({
      ...item,
      imageUrl: (item.imageUrl && item.imageUrl.startsWith('http')) ? item.imageUrl : foodImages[idx % foodImages.length],
      price: item.price || item.itemPrice || 250,
      mrp: item.mrp || item.offerPrice || item.price || 250,
      dietaryType: item.dietaryType || (item.foodType === 'VEG' ? 'veg' : item.foodType === 'NON_VEG' ? 'non-veg' : 'veg'),
      isAvailable: item.isAvailable !== false,
      isRecommended: item.isRecommended || item.recommended || false,
      rating: item.rating || (4.0 + Math.round(Math.random() * 10) / 10),
      prepTime: item.prepTime || 20,
      menuCategoryId: typeof item.menuCategoryId === 'object' ? item.menuCategoryId : { id: item.categoryId, name: item.categoryName || 'Category' }
    }));

    const catId = params.get('categoryId');
    const subCatId = params.get('subcategoryId');
    const search = params.get('searchValue') || '';
    const recommended = params.get('recommended');
    const dietaryType = params.get('dietaryType'); // 'true' = veg only
    if (catId) items = items.filter(i => String(i.categoryId) === catId || String(i.menuCategoryId?.id) === catId);
    if (subCatId) items = items.filter(i => String(i.subcategoryId) === subCatId || String(i.menuSubCategoryId?.id) === subCatId);
    if (search) items = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()));
    if (recommended === 'true') items = items.filter(i => i.isRecommended);
    if (dietaryType === 'true') items = items.filter(i => i.dietaryType === 'veg');
    const page = Number(params.get('pageNumber') || 0);
    const size = Number(params.get('pageSize') || 12);
    return success(paginate(items, page, size));
  }

  // GET /api/public/customer/sliders/get_sliders
  if (method === 'GET' && path.includes('/sliders/get_sliders')) {
    const sliderImages = [
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ];
    const sliders = deepClone(store.sliders || mockData.sliders || []).map((s, idx) => ({
      ...s,
      imageUrl: s.imageUrl?.startsWith('http') ? s.imageUrl : sliderImages[idx % sliderImages.length],
      description: s.description || 'Delicious food, delivered fresh to your door'
    }));
    return success(sliders);
  }

  // GET /api/customer/orders/ordered-menu-items
  if (method === 'GET' && path.includes('/orders/ordered-menu-items')) {
    const rawItems = deepClone(store.menuItems || mockData.menuItems).slice(0, 6);
    // Component expects each item wrapped as { menuItemId: { id, name, price, ... } }
    const items = rawItems.map(item => ({
      id: Date.now() + item.id,
      menuItemId: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price || item.offerPrice,
        mrp: item.mrp || item.price,
        imageUrl: (item.imageUrl && item.imageUrl.startsWith('http')) ? item.imageUrl : null,
        dietaryType: item.dietaryType || (item.foodType === 'VEG' ? 'veg' : 'non-veg'),
        isAvailable: item.isAvailable !== false,
        isRecommended: item.isRecommended || false,
        prepTime: item.prepTime || 20,
        menuCategoryId: item.menuCategoryId,
        menuSubcategoryId: item.menuSubCategoryId,
        addonsId: item.addonId ? { id: item.addonId.id } : null
      }
    }));
    return success(items);
  }

  // PUT /api/customer/customer_delivery_addresses/update
  if (method === 'PUT' && path.includes('/customer_delivery_addresses/update')) {
    const idx = (store.customerAddresses || []).findIndex(a => a.id === body.id);
    if (idx !== -1) {
      store.customerAddresses[idx] = { ...store.customerAddresses[idx], ...body };
      return success(store.customerAddresses[idx], 'Address updated');
    }
    return success(null, 'Address not found');
  }

  // DELETE /api/admin/customer_delivery_addresses/delete/:id
  if (method === 'DELETE' && path.includes('/customer_delivery_addresses/delete/')) {
    const id = Number(path.split('/delete/')[1]);
    store.customerAddresses = (store.customerAddresses || []).filter(a => a.id !== id);
    return success(null, 'Address deleted');
  }

  return null;
};

const handleCommonAppRoutes = ({ method, path, params, body }) => {
  if (method === 'GET' && (path.endsWith('/dashboard/summary') && path !== '/api/restaurant/dashboard/summary' && path !== '/api/branch/dashboard/summary' && !path.includes('/api/cashier/') && !path.includes('/api/kitchen/') && !path.includes('/api/admin/'))) {
    return success(dashboardSummary());
  }

  // Restaurants endpoints
  if (method === 'GET' && path === '/api/superadmin/restaurants') {
    let filtered = store.restaurants.filter(r => {
      if (params.get('search')) {
        const s = params.get('search').toLowerCase();
        if (!r.name.toLowerCase().includes(s) && !(r.email || '').toLowerCase().includes(s)) return false;
      }
      if (params.get('status')) return r.status === params.get('status');
      return true;
    });
    // Sort by newest first (descending order)
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return success(paginate(filtered, params.get('page') || params.get('pageNumber'), params.get('size') || params.get('pageSize')));
  }

  if (method === 'POST' && path === '/api/superadmin/restaurants') {
    const newId = nextId(store.restaurants);
    const newRestaurant = {
      id: newId,
      name: body.name || body.restaurantName || '',
      email: body.email || '',
      mobile: body.mobile || '',
      ownerName: body.ownerName || '',
      address: body.address || '',
      orderCount: 0,
      revenue: 0,
      status: 'pending',
      planName: 'Basic',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    store.restaurants.push(newRestaurant);
    store.approvals.push({
      id: nextId(store.approvals),
      name: newRestaurant.name,
      email: newRestaurant.email,
      mobile: newRestaurant.mobile,
      role: 'restaurant',
      status: 'pending',
      createdAt: newRestaurant.createdAt
    });
    console.log('✅ [MOCK] New Restaurant Created:', newRestaurant);
    return created(newRestaurant, 'Restaurant added successfully');
  }

  if (method === 'PUT' && /\/api\/superadmin\/restaurants\/\d+/.test(path)) {
    const id = path.split('/').pop();
    const patch = { ...body };
    if (patch.status === 'suspended') patch.isActive = false;
    if (patch.status === 'active') patch.isActive = true;
    updateById(store.restaurants, id, patch);
    const updated = store.restaurants.find(r => String(r.id) === String(id));
    return success(updated || body, 'Restaurant updated successfully');
  }

  // Reports endpoints
  if (method === 'GET' && path === '/api/superadmin/reports/summary') {
    return success({
      totalRevenue: 167300,
      totalOrders: 1234,
      avgOrderValue: 136,
      dateRange: { from: '2026-03-20', to: '2026-04-20' }
    });
  }

  if (method === 'GET' && path === '/api/superadmin/reports/restaurant-performance') {
    const data = [
      { restaurantId: 101, name: 'RMS Central', orders: 156, revenue: 45230, avgOrderValue: 290, topItem: 'Crunchy Chicken' },
      { restaurantId: 102, name: 'RMS Express', orders: 89, revenue: 23450, avgOrderValue: 263, topItem: 'Paneer Butter' },
      { restaurantId: 103, name: 'Spice Garden', orders: 234, revenue: 67890, avgOrderValue: 290, topItem: 'Veg Biryani' },
      { restaurantId: 104, name: 'Pizza Hub', orders: 45, revenue: 12890, avgOrderValue: 286, topItem: 'Cheese Pizza' }
    ];
    return success(paginate(data, params.get('page'), params.get('size')));
  }

  if (method === 'GET' && path === '/api/superadmin/reports/revenue-by-restaurant') {
    const data = {
      labels: ['RMS Central', 'RMS Express', 'Spice Garden', 'Pizza Hub'],
      datasets: [{
        label: 'Monthly Revenue',
        data: [45230, 23450, 67890, 12890],
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F615'
      }]
    };
    return success(data);
  }

  // Notifications endpoints
  if (method === 'POST' && path === '/api/superadmin/notifications/send') {
    const scheduledAt = body?.scheduledAt || null;
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const newNotif = {
      id: nextId(store.notifications),
      title: body?.title || '',
      message: body?.message || '',
      target: body?.target || 'all',
      restaurantIds: body?.restaurantIds || null,
      scheduledAt,
      sentAt: isScheduled ? null : new Date().toISOString(),
      status: isScheduled ? 'scheduled' : 'delivered'
    };
    store.notifications.unshift(newNotif);
    return success(newNotif, isScheduled ? 'Notification scheduled successfully' : 'Notification sent successfully');
  }

  if (method === 'GET' && path === '/api/superadmin/notifications/history') {
    return success(paginate(store.notifications, params.get('page'), params.get('size')));
  }

  if (method === 'GET' && path === '/api/superadmin/settings') {
    return success(deepClone(store.superadminProfile));
  }

  if (method === 'PUT' && path === '/api/superadmin/settings/profile') {
    store.superadminProfile = { ...store.superadminProfile, ...body };
    return success(deepClone(store.superadminProfile), 'Profile updated');
  }

  if (method === 'POST' && path === '/api/superadmin/settings/password/send-otp') {
    const mobile = store.superadminProfile.mobile || '9999999999';
    return success({ masked_mobile: `${mobile.slice(0, 2)}******${mobile.slice(-2)}`, otp: '123456' }, 'OTP sent successfully');
  }

  if (method === 'PUT' && path === '/api/superadmin/settings/password') {
    return success({}, 'Password updated successfully');
  }

  if (method === 'GET' && path === '/api/superadmin/settings/webhook') {
    return success(deepClone(store.superadminWebhook));
  }

  if (method === 'PUT' && path === '/api/superadmin/settings/webhook') {
    store.superadminWebhook = {
      webhook_url: body?.webhook_url || '',
      webhook_enabled: String(body?.webhook_enabled) === 'true' || body?.webhook_enabled === true,
      webhook_secret: body?.webhook_secret || ''
    };
    return success(deepClone(store.superadminWebhook), 'Webhook settings saved');
  }

  if (method === 'POST' && path === '/api/superadmin/settings/webhook/test') {
    return success({
      status_code: store.superadminWebhook.webhook_enabled && store.superadminWebhook.webhook_url ? 200 : 400,
      response: store.superadminWebhook.webhook_enabled && store.superadminWebhook.webhook_url
        ? JSON.stringify({ ok: true, delivered_to: store.superadminWebhook.webhook_url }, null, 2)
        : JSON.stringify({ ok: false, error: 'Webhook disabled or URL missing' }, null, 2)
    }, 'Webhook tested');
  }

  // SuperAdmin Coupons — separate from restaurant coupons, uses couponId field
  if (method === 'GET' && /\/api\/superadmin\/coupons$/.test(path)) {
    let items = deepClone(store.superadminCoupons);
    const q = (params.get('search') || '').toLowerCase();
    if (q) items = items.filter(c => c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    return success(paginate(items, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'POST' && path === '/api/superadmin/coupons') {
    const newCoupon = { ...body, couponId: nextId(store.superadminCoupons, 'couponId'), usedCount: 0 };
    store.superadminCoupons.push(newCoupon);
    return created(newCoupon, 'Coupon created successfully');
  }

  if (method === 'PUT' && /\/api\/superadmin\/coupons\/\d+/.test(path)) {
    const id = path.split('/').pop();
    updateById(store.superadminCoupons, id, body);
    return success(store.superadminCoupons.find(c => String(c.couponId) === String(id)) || body, 'Coupon updated');
  }

  if (method === 'DELETE' && /\/api\/superadmin\/coupons\/\d+/.test(path)) {
    const id = path.split('/').pop();
    const idx = store.superadminCoupons.findIndex(c => String(c.couponId) === String(id));
    if (idx !== -1) store.superadminCoupons.splice(idx, 1);
    return success({}, 'Coupon deleted');
  }

  if (method === 'POST' && path.includes('/coupons/validate')) {
    const code = body?.code || body?.couponCode || '';
    const found = store.superadminCoupons.find(c => c.code === code && c.isActive);
    if (found) return success({ valid: true, message: `Coupon "${code}" is valid`, coupon: found });
    return success({ valid: false, message: found ? 'Coupon is inactive' : 'Coupon not found' });
  }

  if (method === 'GET' && path.includes('/coupons/usage')) {
    return success([
      { restaurantId: 101, restaurantName: 'RMS Central', usedAt: '2026-04-15T10:00:00Z', planName: 'Standard' },
      { restaurantId: 103, restaurantName: 'Spice Garden', usedAt: '2026-04-18T14:30:00Z', planName: 'Premium' }
    ]);
  }

  // UserDirectory: GET /api/superadmin/users (exact path, used by Subscriptions assign modal)
  if (method === 'GET' && /\/api\/superadmin\/users$/.test(path)) {
    let items = deepClone(store.restaurants).map((restaurant) => ({
      id: restaurant.id,
      user_id: restaurant.id,
      full_name: restaurant.ownerName || restaurant.name,
      hospital_name: restaurant.name,
      name: restaurant.ownerName || restaurant.name,
      email: restaurant.email,
      mobile: restaurant.mobile,
      role: 'restaurant',
      isActive: restaurant.isActive !== false
    }));
    if (params.get('search')) {
      const q = params.get('search').toLowerCase();
      items = items.filter(u => (u.hospital_name || u.name || '').toLowerCase().includes(q));
    }
    const limit = Number(params.get('limit') || params.get('pageSize') || 20);
    const page = Number(params.get('page') || params.get('pageNumber') || 1);
    const start = (page - 1) * limit;
    return success({ data: items.slice(start, start + limit), total: items.length });
  }

  if (method === 'POST' && path === '/api/superadmin/subscription-plans') {
    const newPlanId = nextId(store.subscriptionPlans.map((item) => ({ planId: item.plan?.planId || item.planId })), 'planId');
    const newPlan = {
      plan: {
        planId: newPlanId,
        ...body
      },
      active_subscribers: 0
    };
    store.subscriptionPlans.push(newPlan);
    return created(newPlan, 'Plan created successfully');
  }

  if (method === 'PUT' && /\/api\/superadmin\/subscription-plans\/\d+/.test(path)) {
    const id = path.split('/').pop();
    const item = store.subscriptionPlans.find((plan) => String(plan.plan?.planId) === String(id));
    if (item) item.plan = { ...item.plan, ...body };
    return success(item || body, 'Plan updated successfully');
  }

  if (method === 'DELETE' && /\/api\/superadmin\/subscription-plans\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.subscriptionPlans = store.subscriptionPlans.filter((plan) => String(plan.plan?.planId) !== String(id));
    return success({}, 'Plan deleted successfully');
  }

  if (method === 'POST' && path === '/api/superadmin/subscriptions') {
    const restaurant = store.restaurants.find((item) => String(item.id) === String(body?.user_id));
    const planWrapper = store.subscriptionPlans.find((item) => String(item.plan?.planId) === String(body?.plan_id));
    const startDate = body?.start_date || new Date().toISOString().slice(0, 10);
    const durationDays = Number(planWrapper?.plan?.durationDays || 30);
    const endDate = new Date(new Date(startDate).getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const newSubscription = {
      subscriptionId: nextId(store.subscriptions, 'subscriptionId'),
      user: {
        id: restaurant?.id || Number(body?.user_id),
        name: restaurant?.ownerName || restaurant?.name || 'Restaurant Admin',
        hospitalName: restaurant?.name || 'Restaurant',
        email: restaurant?.email || ''
      },
      plan: {
        planId: planWrapper?.plan?.planId || Number(body?.plan_id),
        planName: planWrapper?.plan?.planName || 'Plan'
      },
      startDate,
      endDate,
      graceEndDate: null,
      amountPaid: Number(planWrapper?.plan?.price || 0),
      discountAmount: 0,
      status: 'active',
      paymentReference: body?.payment_reference || `PAY-MOCK-${Date.now()}`
    };
    store.subscriptions.unshift(newSubscription);
    return created(newSubscription, 'Subscription assigned successfully');
  }

  if (method === 'DELETE' && /\/api\/superadmin\/subscriptions\/\d+/.test(path)) {
    const id = path.split('/').pop();
    const sub = store.subscriptions.find((item) => String(item.subscriptionId) === String(id));
    if (sub) sub.status = 'cancelled';
    return success(sub || {}, 'Subscription cancelled successfully');
  }

  if (method === 'POST' && /\/api\/superadmin\/subscriptions\/\d+\/grant-grace/.test(path)) {
    const id = path.split('/')[4];
    const sub = store.subscriptions.find((item) => String(item.subscriptionId) === String(id));
    const graceDays = Number(body?.grace_days || 0);
    if (sub) {
      const baseDate = sub.endDate || new Date().toISOString().slice(0, 10);
      sub.status = 'grace';
      sub.graceEndDate = new Date(new Date(baseDate).getTime() + graceDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }
    return success(sub || {}, 'Grace period granted');
  }

  // API Logs
  if (method === 'GET' && path.includes('/settings/api-logs')) {
    return success(paginate(deepClone(mockData.apiLogs), params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path.includes('/users/filter')) {
    const items = filterList(getUsersByRole(params.get('role')), params);
    return success(paginate(items, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && (path.includes('/users/getBy_restId') || path.includes('/users/getBy_branchId'))) {
    const items = filterList(getUsersByRole(params.get('role')), params);
    return success(items);
  }

  if (method === 'GET' && path.includes('/users_profile/branchId')) {
    const id = Number(params.get('id'));
    return success(store.branchProfiles.filter((item) => item.branchId === id));
  }

  if (method === 'GET' && path.includes('/users_profile/restaurantId')) {
    return success([{ id: 1, address: 'Central Restaurant', phone: '8888888888', latitude: 20.01, longitude: 73.78 }]);
  }

  if (method === 'POST' && path.includes('/users/add')) {
    return created({ id: Date.now(), ...body }, 'User created');
  }

  if (method === 'PUT' && (path.includes('/users/update') || /\/users\/\d+\/?$/.test(path))) {
    return success({ ...body }, 'User updated');
  }

  if (method === 'DELETE' && /\/(users|orders|customers|subscription-plans|subscriptions)\/\d+\/?$/.test(path)) {
    return success({}, 'Deleted successfully');
  }

  if (method === 'POST' && path.includes('/users_profile/add-update')) {
    const branchId = body?.branchId?.id || body?.branchId || body?.id;
    if (branchId) {
      const idx = store.branchProfiles.findIndex(p => p.branchId === Number(branchId));
      if (idx !== -1) Object.assign(store.branchProfiles[idx], body);
      else store.branchProfiles.push({ id: nextId(store.branchProfiles), branchId: Number(branchId), ...body });
    }
    return success({ id: branchId, ...body }, 'Profile saved');
  }

  if (method === 'GET' && path.includes('/branch-status')) {
    return success({ isOpen: true, branches: mockData.branches });
  }

  if (method === 'GET' && path.includes('/states/all')) {
    return success([{ id: 1, name: 'Maharashtra' }]);
  }

  if (method === 'GET' && path.includes('/cities/cityAll')) {
    return success([{ id: 1, name: 'Nashik', stateId: 1 }]);
  }

  if (method === 'GET' && path.includes('/reports') && !path.includes('/api/kitchen/')) {
    return success(paginate(deepClone(mockData.orders), params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path.includes('/order-status-count') && !path.includes('/api/kitchen/')) {
    return success({
      pending: mockData.orders.filter((order) => order.status === 'PENDING').length,
      preparing: mockData.orders.filter((order) => order.status === 'PREPARING').length,
      delivered: mockData.orders.filter((order) => order.status === 'DELIVERED').length
    });
  }

  if (method === 'GET' && path.includes('/distanceCalculator')) {
    return success({ distance: 3.5, deliveryCharge: 30, zoneName: 'City Center' });
  }

  if (method === 'GET' && path.includes('/xl_export')) {
    return blobSuccess();
  }

  // ── Branch: delivery users filter with outstanding balance ────────
  if (method === 'GET' && path.includes('/branch/users/filter') && params.get('role') === 'delivery') {
    const outstandingMap = { '4444444444': { outstandingBalance: 260, balance: 500 }, '4400000001': { outstandingBalance: 480, balance: 800 }, '4400000002': { outstandingBalance: 150, balance: 300 }, '4400000003': { outstandingBalance: 420, balance: 600 }, '4400000004': { outstandingBalance: 750, balance: 950 }, '4400000005': { outstandingBalance: 280, balance: 400 }, '4400000006': { outstandingBalance: 520, balance: 700 } };
    const search   = (params.get('searchValue') || '').toLowerCase();
    const isActive = params.get('isActive');
    let delivery = deepClone(store.users).filter(u => u.role === 'delivery').map(u => ({ ...u, ...(outstandingMap[u.mobile] || { outstandingBalance: 0, balance: 0 }) }));
    if (isActive !== null && isActive !== '') delivery = delivery.filter(u => String(u.isActive) === String(isActive));
    if (search) delivery = delivery.filter(u => [u.name, u.mobile, u.email].join(' ').toLowerCase().includes(search));
    return success(paginate(delivery, params.get('pageNumber'), params.get('pageSize')));
  }

  // ── Branch: Orders filter with proper status + pagination ────────
  if (method === 'GET' && path.includes('/branch/orders/filter')) {
    const status   = params.get('status');
    const search   = (params.get('searchValue') || '').toLowerCase();
    const fromDate = params.get('fromDate');
    const toDate   = params.get('toDate');
    let orders = deepClone(store.orders).filter(o => String(o.branchId) === '201' || String(o.branchId?.id) === '201');
    if (status) {
      const statusMap = { OUT_FOR_DELIVERY: ['OUT_FOR_DELIVERY'], PREPARING: ['PREPARING'], PENDING: ['PENDING'], DELIVERED: ['DELIVERED'], COMPLETED: ['COMPLETED'], CANCELLED: ['CANCELLED'] };
      const allowed = statusMap[status] || [status];
      orders = orders.filter(o => allowed.includes(o.status));
    }
    if (search) orders = orders.filter(o => [o.orderNumber, o.customerName, o.customerPhone].join(' ').toLowerCase().includes(search));
    if (fromDate) orders = orders.filter(o => o.createdAt >= fromDate);
    if (toDate)   orders = orders.filter(o => o.createdAt <= toDate + 'T23:59:59Z');
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return success(paginate(orders, params.get('pageNumber'), params.get('pageSize')));
  }

  // ── Branch: orderUpdate (status change) ─────────────────────────
  if (method === 'PUT' && path.includes('/branch/orders/orderUpdate')) {
    const id = body?.id || body?.orderId;
    if (id) updateById(store.orders, id, { status: body.status });
    return success({ id }, 'Order status updated');
  }

  // ── Branch: bank_details delete (uses GET with id query param) ───
  if (method === 'GET' && path.includes('/bank_details/delete')) {
    const id = Number(params.get('id'));
    if (id) store.bankDetails = store.bankDetails.filter(b => b.id !== id);
    return success({}, 'Bank detail deleted');
  }

  // ── Branch: outstanding filter (history with proper shape) ───────
  if (method === 'GET' && path.includes('/branch/outstanding/filter')) {
    const search = (params.get('searchValue') || '').toLowerCase();
    const outstandingHistory = [
      { id: 1, userId: { name: 'Ramu Delivery', mobile: '4444444444' }, openingBal: 500, amount: 240, closingBal: 260, mode: 1, date: '2026-04-20', time: '10:30:00', remark: 'Cash collected from delivery' },
      { id: 2, userId: { name: 'Shyam Delivery', mobile: '4400000001' }, openingBal: 800, amount: 320, closingBal: 480, mode: 1, date: '2026-04-19', time: '15:00:00', remark: 'Order settlement' },
      { id: 3, userId: { name: 'Kiran Delivery', mobile: '4400000002' }, openingBal: 300, amount: 150, closingBal: 150, mode: 2, date: '2026-04-18', time: '09:00:00', remark: 'Balance credited' },
      { id: 4, userId: { name: 'Rajesh Delivery', mobile: '4400000003' }, openingBal: 600, amount: 420, closingBal: 180, mode: 1, date: '2026-04-17', time: '18:45:00', remark: 'Daily settlement' },
      { id: 5, userId: { name: 'Ankur Delivery', mobile: '4400000004' }, openingBal: 950, amount: 750, closingBal: 200, mode: 1, date: '2026-04-16', time: '12:20:00', remark: 'Cash settlement' },
      { id: 6, userId: { name: 'Gopal Delivery', mobile: '4400000005' }, openingBal: 400, amount: 280, closingBal: 120, mode: 1, date: '2026-04-15', time: '14:00:00', remark: 'Deducted from balance' },
      { id: 7, userId: { name: 'Sanjay Delivery', mobile: '4400000006' }, openingBal: 700, amount: 520, closingBal: 180, mode: 1, date: '2026-04-14', time: '11:30:00', remark: 'Daily adjustment' }
    ];
    let filtered = outstandingHistory;
    if (search) filtered = filtered.filter(h => [h.userId?.name, h.userId?.mobile, h.remark].join(' ').toLowerCase().includes(search));
    return success(paginate(filtered, params.get('pageNumber'), params.get('pageSize')));
  }

  // ── Branch: wallet topup filter (pending requests with proper shape) ─
  if (method === 'GET' && path.includes('/branch/wallet_topup_request/filter')) {
    const branchWalletRequests = [
      { id: 1, userId: { name: 'Branch Manager', mobile: '7777777777' }, amount: 5000, bankName: 'HDFC Bank', utr: null, status: 'pending', date: '2026-04-20', reason: null },
      { id: 2, userId: { name: 'Branch Manager', mobile: '7777777777' }, amount: 7500, bankName: 'SBI', utr: null, status: 'pending', date: '2026-04-19', reason: null }
    ];
    return success(paginate(branchWalletRequests, params.get('pageNumber'), params.get('pageSize')));
  }

  // ── Branch: wallet topup history ─────────────────────────────────
  if (method === 'GET' && path.includes('/branch/wallet_topup_request/history')) {
    const walletHistory = [
      { id: 3, userId: { name: 'Branch Manager', mobile: '7777777777' }, amount: 15000, bankName: 'HDFC Bank', utr: 'UTR20260418001', status: 'approved', approvedById: { name: 'Restaurant Admin' }, approvedDate: '2026-04-18', reason: null },
      { id: 4, userId: { name: 'Branch Manager', mobile: '7777777777' }, amount: 6000, bankName: 'ICICI Bank', utr: 'UTR20260414002', status: 'approved', approvedById: { name: 'Restaurant Admin' }, approvedDate: '2026-04-14', reason: null },
      { id: 5, userId: { name: 'Branch Manager', mobile: '7777777777' }, amount: 3000, bankName: 'SBI', utr: null, status: 'rejected', approvedById: { name: 'Restaurant Admin' }, approvedDate: '2026-04-10', reason: 'Insufficient documents' }
    ];
    const search = (params.get('searchValue') || '').toLowerCase();
    const statusFilter = params.get('status');
    let filtered = walletHistory;
    if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
    if (search) filtered = filtered.filter(r => [r.userId?.name, r.utr, r.bankName].join(' ').toLowerCase().includes(search));
    return success(paginate(filtered, params.get('pageNumber'), params.get('pageSize')));
  }

  const list = resolveEntityList(path);
  if (method === 'GET' && !path.includes('/api/kitchen/') && (path.includes('/filter') || path.includes('/getAll') || path.includes('/history') || path.includes('/all'))) {
    const items = filterList(list, params);
    return success(paginate(items, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path.includes('/addons_items/addonsId')) {
    const id = Number(params.get('id') || params.get('addonsId'));
    return success(mockData.addonItems.filter((item) => item.addonsId === id));
  }

  if (method === 'GET' && path.includes('/addons_items/getByAddonsId')) {
    const id = Number(params.get('id') || params.get('addonsId'));
    return success(store.addonItems.filter((item) => Number(item.addonsId?.id || item.addonsId) === id));
  }

  if (method === 'GET' && path.includes('/delivery_zones/branchId')) {
    const id = params.get('id');
    const items = !id
      ? deepClone(store.deliveryZones)
      : store.deliveryZones.filter((item) => String(item.branchId?.id || item.branchId) === String(id));
    return success(paginate(items, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path.includes('/restaurant_hours/branchId')) {
    const id = params.get('id');
    const items = !id
      ? store.restaurantHours.map((item) => normalizeRestaurantHourRecord(item))
      : store.restaurantHours
        .filter((item) => String(item.branchId?.id || item.branchId) === String(id))
        .map((item) => normalizeRestaurantHourRecord(item));
    return success(items);
  }

  if (method === 'GET' && path === '/api/restaurant/bank_details/getAll') {
    return success(paginate(deepClone(store.bankDetails), params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path === '/api/restaurant/bank_details/delete') {
    const id = params.get('id');
    store.bankDetails = store.bankDetails.filter((item) => String(item.id) !== String(id));
    return success({}, 'Bank detail deleted successfully');
  }

  if (method === 'GET' && path === '/api/restaurant/sliders/getAll') {
    return success(paginate(deepClone(store.sliders), params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path.includes('/menu_subcategory/categoryId')) {
    const id = Number(params.get('categoryId'));
    return success(mockData.menuSubcategories.filter((item) => item.menuCategoryId?.id === id));
  }

  if (method === 'GET' && path.includes('/customer_delivery_addresses/customerId')) {
    const id = Number(params.get('customerId'));
    return success(mockData.customerAddresses.filter((item) => item.customerId === id));
  }

  if (method === 'GET' && path.includes('/customers/search')) {
    return success(filterList(mockData.customers, params));
  }

  if (method === 'GET' && path.includes('/subscriptions/restaurants')) {
    return success(mockData.restaurants);
  }

  if (method === 'GET' && path.includes('/coupons/admin-users')) {
    return success(mockData.users.filter((user) => ['admin', 'supadmin'].includes(user.role)));
  }

  if (method === 'GET' && path.includes('/users/tree')) {
    const q = (params.get('search') || '').toLowerCase();
    let restaurantAdmins = deepClone(store.restaurants).map((restaurant) => ({
      id: restaurant.id,
      user_id: restaurant.id,
      name: restaurant.ownerName || restaurant.name,
      full_name: restaurant.ownerName || restaurant.name,
      email: restaurant.email,
      mobile: restaurant.mobile,
      role: 'restaurant',
      isActive: restaurant.isActive !== false,
      hospital_name: restaurant.name,
      branch_count: store.branches.length,
      kitchen_count: store.users.filter((user) => user.role === 'kitchen').length,
      cashier_count: store.users.filter((user) => user.role === 'cashier').length,
      children: store.branches.map((branch) => ({ ...branch, role: 'branch', children: [] }))
    }));
    if (q) {
      restaurantAdmins = restaurantAdmins.filter((restaurant) =>
        [restaurant.hospital_name, restaurant.name, restaurant.email, restaurant.mobile].filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return success(restaurantAdmins);
  }

  if (method === 'GET' && /\/api\/superadmin\/users\/\d+\/detail/.test(path)) {
    const id = path.split('/')[4];
    const restaurant = store.restaurants.find(r => String(r.id) === String(id));
    const user = restaurant ? {
      id: restaurant.id,
      user_id: restaurant.id,
      name: restaurant.ownerName || restaurant.name,
      full_name: restaurant.ownerName || restaurant.name,
      email: restaurant.email,
      mobile: restaurant.mobile,
      role: 'restaurant',
      isActive: restaurant.isActive !== false,
      hospital_name: restaurant.name
    } : (store.users.find(u => String(u.id) === String(id)) || {});
    const branches = store.branches;
    return success({
      data: {
        users: {
          restaurant: [user],
          branch: branches,
          kitchen: store.users.filter((item) => item.role === 'kitchen'),
          delivery: store.users.filter((item) => item.role === 'delivery'),
          cashier: store.users.filter((item) => item.role === 'cashier')
        }
      }
    });
  }

  if (method === 'GET' && path === '/api/superadmin/user-approvals') {
    const search = (params.get('search') || '').trim().toLowerCase();
    const approvalStatus = (params.get('approvalStatus') || '').trim().toLowerCase();
    const normalized = deepClone(store.approvals).map(normalizeApprovalRecord);
    const pendingCount = normalized.filter((item) => item.approvalStatus === 'pending').length;

    let items = normalized;
    if (approvalStatus) {
      items = items.filter((item) => item.approvalStatus === approvalStatus);
    }

    if (search) {
      items = items.filter((item) => {
        const haystack = [
          item.name,
          item.email,
          item.mobile,
          item.hospitalName
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(search);
      });
    }

    const { records, totalRecords, totalPages } = paginate(items, params.get('pageNumber'), params.get('pageSize'));
    return success({ content: records, totalElements: totalRecords, totalPages, pendingCount });
  }

  if (method === 'POST' && /\/api\/superadmin\/user-approvals\/\d+\/impersonate/.test(path)) {
    const id = path.split('/')[4];
    const approval = normalizeApprovalRecord(store.approvals.find((item) => String(item.id) === String(id)) || {});
    return success({
      token: `mock-impersonate-approval-${id}`,
      userType: approval.role || 'restaurant',
      name: approval.name || 'Restaurant Admin'
    }, 'Impersonation token generated');
  }

  if (method === 'POST' && /\/api\/superadmin\/users\/\d+\/impersonate/.test(path)) {
    const id = path.split('/')[4];
    const restaurant = store.restaurants.find((item) => String(item.id) === String(id));
    return success({
      token: `mock-impersonate-user-${id}`,
      userType: 'restaurant',
      name: restaurant?.ownerName || restaurant?.name || 'Restaurant Admin'
    }, 'Impersonation token generated');
  }

  if (method === 'GET' && /\/(subscription-plans|subscriptions|coupons|user-approvals)(\/\d+|\/detail)?$/.test(path)) {
    let items = resolveEntityList(path);
    // Filter subscriptions by status if provided
    if (path.includes('/subscriptions') && params.get('status')) {
      items = items.filter(s => s.status === params.get('status'));
    }
    // Filter by search
    if (params.get('search') || params.get('searchValue')) {
      const q = (params.get('search') || params.get('searchValue') || '').toLowerCase();
      if (q) {
        items = items.filter(item => {
          const haystack = [item.plan?.planName, item.code, item.name, item.user?.hospitalName, item.user?.name].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(q);
        });
      }
    }
    const { records, totalRecords, totalPages } = paginate(items, params.get('pageNumber'), params.get('pageSize'));
    return success({ content: records, totalElements: totalRecords, totalPages });
  }

  if (method === 'GET' && /\/settings(\/\w+)?$/.test(path)) {
    return success(mockData.settings);
  }

  // User approval: approve or reject
  if (['POST', 'PUT'].includes(method) && path.includes('/user-approvals')) {
    const id = path.split('/').filter(Boolean).pop();
    const currentApproval = store.approvals.find(a => String(a.id) === String(id));
    const patch = mapApprovalUpdate(body);
    const nextStatus = patch.approvalStatus || body?.status || (path.includes('/approve') ? 'approved' : path.includes('/reject') ? 'rejected' : currentApproval?.approvalStatus || 'pending');
    updateById(store.approvals, id, { ...patch, approvalStatus: nextStatus, isActive: nextStatus === 'approved' });
    if (nextStatus === 'approved') {
      const approval = store.approvals.find(a => String(a.id) === String(id));
      if (approval) {
        const exists = store.restaurants.find(r => r.mobile === approval.mobile);
        if (!exists) {
          store.restaurants.push({
            id: nextId(store.restaurants),
            name: approval.name,
            email: approval.email,
            mobile: approval.mobile,
            ownerName: approval.name,
            orderCount: 0, revenue: 0,
            status: 'active', planName: 'Basic', isActive: true,
            createdAt: approval.createdAt || new Date().toISOString()
          });
        }
      }
    }
    return success({ id, approvalStatus: nextStatus }, 'Status updated successfully');
  }

  // Withdrawal approve
  if (method === 'PUT' && /\/withdrawals\/approve\/\d+/.test(path)) {
    const id = path.split('/').pop();
    updateById(store.withdrawals, id, { status: 'approved' });
    return success({ id }, 'Withdrawal approved');
  }

  // Withdrawal reject
  if (method === 'PUT' && /\/withdrawals\/reject\/\d+/.test(path)) {
    const id = path.split('/').pop();
    updateById(store.withdrawals, id, { status: 'rejected', rejectReason: body?.reason || '' });
    return success({ id }, 'Withdrawal rejected');
  }

  // Withdrawal mark-paid
  if (method === 'PUT' && /\/withdrawals\/mark-paid\/\d+/.test(path)) {
    const id = path.split('/').pop();
    updateById(store.withdrawals, id, { status: 'paid', utr: body?.utr || '' });
    return success({ id }, 'Withdrawal marked as paid');
  }

  // Outstanding deduct
  if (method === 'POST' && path.includes('/outstanding/deduct')) {
    const userId = body?.userId;
    if (userId) {
      const user = store.users.find(u => String(u.id) === String(userId));
      if (user) user.outstandingBalance = Math.max(0, (user.outstandingBalance || 0) - (body?.amount || 0));
    }
    store.outstanding.push({ id: nextId(store.outstanding), ...body, createdAt: new Date().toISOString() });
    return success({}, 'Outstanding deducted successfully');
  }

  // Menu items by branch
  if (method === 'GET' && path.includes('/menu_items/by-branch')) {
    const branchId = params.get('branchId');
    let items = deepClone(store.menuItems);
    if (branchId) items = items.filter(i => !i.branchId || String(i.branchId?.id || i.branchId) === String(branchId));
    return success(items);
  }

  if (method === 'GET' && path === '/api/restaurant/payment_gateway/getAll') {
    const items = deepClone(store.paymentGateways).map(normalizePaymentGateway);
    return success(paginate(items, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'POST' && path === '/api/restaurant/payment_gateway/add') {
    const gateway = normalizePaymentGateway({ id: nextId(store.paymentGateways), ...body });
    store.paymentGateways.push(gateway);
    return created(gateway, 'Payment gateway added successfully');
  }

  if (method === 'PUT' && path === '/api/restaurant/payment_gateway/update') {
    const gateway = normalizePaymentGateway(body);
    if (gateway.id) {
      updateById(store.paymentGateways, gateway.id, gateway);
    }
    return success(gateway, 'Payment gateway updated successfully');
  }

  if (method === 'DELETE' && /\/api\/restaurant\/payment_gateway\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.paymentGateways = store.paymentGateways.filter((item) => String(item.id) !== String(id));
    return success({}, 'Payment gateway deleted successfully');
  }

  if (method === 'DELETE' && path === '/api/restaurant/sliders/delete') {
    const id = params.get('id');
    store.sliders = store.sliders.filter((item) => String(item.id) !== String(id));
    return success({}, 'Slider deleted successfully');
  }

  if (method === 'GET' && path === '/api/restaurant/coupon/filter') {
    const items = deepClone(store.coupons).map(normalizeRestaurantCoupon);
    return success(paginate(items, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'POST' && path === '/api/restaurant/coupon/addCoupons') {
    const payload = parseJsonField(body, 'payload') || {};
    const coupon = normalizeRestaurantCoupon({
      id: nextId(store.coupons),
      ...payload,
      logo: payload.logo || null
    });
    store.coupons.push(coupon);
    return created(coupon, 'Coupon added successfully');
  }

  if (method === 'PUT' && path === '/api/restaurant/coupon/updateCoupon') {
    const payload = parseJsonField(body, 'payload') || {};
    const coupon = normalizeRestaurantCoupon(payload);
    if (coupon.id) {
      updateById(store.coupons, coupon.id, coupon);
    }
    return success(coupon, 'Coupon updated successfully');
  }

  if (method === 'DELETE' && path === '/api/restaurant/coupon/deleteCoupon') {
    const id = params.get('id');
    store.coupons = store.coupons.filter((item) => String(item.id) !== String(id));
    return success({}, 'Coupon deleted successfully');
  }

  if (method === 'GET' && path === '/api/admin/business_setting/marquee-messages') {
    return success(deepClone(store.marqueeMessages));
  }

  if (method === 'POST' && path === '/api/admin/business_setting/marquee-message/add') {
    const msg = { id: nextId(store.marqueeMessages), ...body };
    store.marqueeMessages.push(msg);
    return created(msg, 'Marquee message added');
  }

  if (method === 'PUT' && path === '/api/admin/business_setting/marquee-message/update') {
    if (body?.id) updateById(store.marqueeMessages, body.id, body);
    return success(body, 'Marquee message updated');
  }

  if (method === 'DELETE' && /\/api\/admin\/business_setting\/marquee-message\/delete\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.marqueeMessages = store.marqueeMessages.filter((item) => String(item.id) !== String(id));
    return success({}, 'Marquee message deleted');
  }

  // Coupon delete
  if (method === 'DELETE' && path.includes('/coupon/')) {
    const id = path.split('/').pop();
    const idx = store.coupons.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) store.coupons.splice(idx, 1);
    return success({}, 'Coupon deleted');
  }

  // ── Helper to read FormData or plain-object body ──────────────────
  const fd = (b, k) => b?.get?.(k) ?? b?.[k];

  // ── Menu Items CRUD ──────────────────────────────────────────────
  if (method === 'POST' && path.includes('/menu_items/add_Menu')) {
    const item = {
      id: nextId(store.menuItems),
      name: fd(body, 'name') || 'New Item',
      price: Number(fd(body, 'price') || 0),
      offerPrice: Number(fd(body, 'offerPrice') || 0),
      foodType: fd(body, 'foodType') || 'VEG',
      isActive: fd(body, 'isActive') !== 'false',
      isRecommended: fd(body, 'isRecommended') === 'true',
      imageUrl: '/material/ImageNotFound.png',
      menuCategoryId: { id: Number(fd(body, 'menuCategoryId') || 501), name: 'Starters' },
      menuSubCategoryId: null,
      addonId: null,
      branchId: { id: 201, name: 'RMS Central - Main' }
    };
    store.menuItems.push(item);
    return created(item, 'Menu item added');
  }

  if (method === 'POST' && path.includes('/menu_items/update_Menu')) {
    const id = fd(body, 'id') || fd(body, 'menuItemId');
    if (id) {
      const patch = { name: fd(body,'name'), price: Number(fd(body,'price')||0), offerPrice: Number(fd(body,'offerPrice')||0), foodType: fd(body,'foodType'), isActive: fd(body,'isActive') !== 'false', isRecommended: fd(body,'isRecommended') === 'true' };
      updateById(store.menuItems, id, patch);
    }
    return success({ id }, 'Menu item updated');
  }

  // ── Menu Category CRUD ───────────────────────────────────────────
  if (method === 'POST' && path.includes('/menu_category/add_Category')) {
    const cat = { id: nextId(store.menuCategories), name: fd(body,'name') || 'New Category', description: fd(body,'description') || '', priority: Number(fd(body,'priority')||1), isActive: true, branchId: { id: 201, name: 'RMS Central - Main' }, restaurantId: { id: 101, name: 'RMS Central' } };
    store.menuCategories.push(cat);
    return created(cat, 'Category added');
  }

  if (method === 'POST' && path.includes('/menu_category/update_Category')) {
    const id = fd(body,'id') || fd(body,'categoryId');
    updateById(store.menuCategories, id, { name: fd(body,'name'), description: fd(body,'description'), priority: Number(fd(body,'priority')||1), isActive: fd(body,'isActive') !== 'false' });
    return success({ id }, 'Category updated');
  }

  // ── Menu Subcategory CRUD ────────────────────────────────────────
  if (method === 'POST' && path.includes('/menu_subcategory/add_Subcategory')) {
    const sub = { id: nextId(store.menuSubcategories), name: fd(body,'name') || 'New Subcategory', menuCategoryId: { id: Number(fd(body,'menuCategoryId')||501), name: 'Starters' }, isActive: true };
    store.menuSubcategories.push(sub);
    return created(sub, 'Subcategory added');
  }

  if (method === 'POST' && path.includes('/menu_subcategory/update_Subcategory')) {
    const id = fd(body,'id') || fd(body,'subcategoryId');
    updateById(store.menuSubcategories, id, { name: fd(body,'name'), isActive: fd(body,'isActive') !== 'false' });
    return success({ id }, 'Subcategory updated');
  }

  // ── Addons & Addon Items CRUD ────────────────────────────────────
  if (method === 'POST' && path.includes('/addons/add_addonItem')) {
    const addon = { id: nextId(store.addons), name: fd(body,'name') || 'New Addon', description: fd(body,'description') || '', isActive: true, priority: Number(fd(body,'priority')||1), minSelection: Number(fd(body,'minSelection')||0), maxSelection: Number(fd(body,'maxSelection')||1) };
    store.addons.push(addon);
    return created(addon, 'Addon added');
  }

  if (method === 'PUT' && path.includes('/addons/update_addonItem')) {
    const id = fd(body,'id');
    updateById(store.addons, id, { name: fd(body,'name'), description: fd(body,'description'), isActive: fd(body,'isActive') !== false && fd(body,'isActive') !== 'false', minSelection: Number(fd(body,'minSelection')||0), maxSelection: Number(fd(body,'maxSelection')||1) });
    return success({ id }, 'Addon updated');
  }

  if (method === 'POST' && path.includes('/addons_items/add')) {
    const item = { id: nextId(store.addonItems), addonsId: Number(fd(body,'addonsId')||0), name: fd(body,'name') || 'New Option', amount: Number(fd(body,'amount')||0), isActive: true };
    store.addonItems.push(item);
    return created(item, 'Addon item added');
  }

  if (method === 'PUT' && path.includes('/addons_items/update')) {
    const id = fd(body,'id');
    updateById(store.addonItems, id, { name: fd(body,'name'), amount: Number(fd(body,'amount')||0), isActive: fd(body,'isActive') !== false && fd(body,'isActive') !== 'false' });
    return success({ id }, 'Addon item updated');
  }

  if (method === 'DELETE' && path.includes('/addons_items/')) {
    const id = path.split('/').pop();
    store.addonItems = store.addonItems.filter(i => String(i.id) !== String(id));
    return success({}, 'Addon item deleted');
  }

  if (method === 'DELETE' && path.includes('/addons/')) {
    const id = path.split('/').pop();
    store.addons = store.addons.filter(a => String(a.id) !== String(id));
    store.addonItems = store.addonItems.filter(i => String(i.addonsId) !== String(id));
    return success({}, 'Addon deleted');
  }

  // ── Coupon ADD / UPDATE ──────────────────────────────────────────
  if (method === 'POST' && path.includes('/coupon/addCoupons')) {
    const coupon = { id: nextId(store.coupons), code: fd(body,'code') || 'NEWCODE', name: fd(body,'name') || 'New Coupon', description: fd(body,'description') || '', discountType: fd(body,'discountType') || 'FLAT', discountValue: Number(fd(body,'discountValue')||0), minOrderValue: Number(fd(body,'minOrderValue')||0), maxUses: Number(fd(body,'maxUses')||100), usedCount: 0, isActive: true, expiryDate: fd(body,'expiryDate') || '2026-12-31' };
    store.coupons.push(coupon);
    return created(coupon, 'Coupon added');
  }

  if (method === 'PUT' && path.includes('/coupon/updateCoupon')) {
    const id = fd(body,'id') || fd(body,'couponId');
    updateById(store.coupons, id, { code: fd(body,'code'), name: fd(body,'name'), description: fd(body,'description'), discountType: fd(body,'discountType'), discountValue: Number(fd(body,'discountValue')||0), minOrderValue: Number(fd(body,'minOrderValue')||0), maxUses: Number(fd(body,'maxUses')||100), isActive: fd(body,'isActive') !== false && fd(body,'isActive') !== 'false', expiryDate: fd(body,'expiryDate') });
    return success({ id }, 'Coupon updated');
  }

  // ── Slider CRUD ──────────────────────────────────────────────────
  if (method === 'POST' && path.includes('/sliders/add_slider')) {
    const slider = { id: nextId(store.sliders), title: fd(body,'title') || 'New Slider', imageUrl: '/material/ImageNotFound.png', isActive: fd(body,'isActive') !== 'false' };
    store.sliders.push(slider);
    return created(slider, 'Slider added');
  }

  if (method === 'POST' && path.includes('/sliders/update_slider')) {
    const id = fd(body,'id') || fd(body,'sliderId');
    updateById(store.sliders, id, { title: fd(body,'title'), isActive: fd(body,'isActive') !== false && fd(body,'isActive') !== 'false' });
    return success({ id }, 'Slider updated');
  }

  if (method === 'DELETE' && path.includes('/sliders/')) {
    const id = path.split('/').pop();
    store.sliders = store.sliders.filter(s => String(s.id) !== String(id));
    return success({}, 'Slider deleted');
  }

  // ── Delivery Zones bulk update ───────────────────────────────────
  if (method === 'POST' && path.includes('/delivery_zones/bulkUpdate')) {
    const zones = Array.isArray(body) ? body : (body?.zones || []);
    zones.forEach(z => {
      const idx = store.deliveryZones.findIndex(d => String(d.id) === String(z.id));
      if (idx !== -1) Object.assign(store.deliveryZones[idx], z);
      else store.deliveryZones.push({ id: nextId(store.deliveryZones), ...z });
    });
    return success(store.deliveryZones, 'Delivery zones updated');
  }

  // ── User CRUD (add/update mutates store.users + store.branches for role=branch) ──
  if (method === 'POST' && path.includes('/users/add')) {
    const role = fd(body,'role') || body?.role || 'delivery';
    const newId = nextId(store.users);
    const rawBranchId = body?.branchId?.id || body?.branchId || null;
    const branchRecord = rawBranchId ? store.branches.find(b => String(b.id) === String(rawBranchId)) : null;
    const branchId = branchRecord ? { id: branchRecord.id, name: branchRecord.name } : (rawBranchId ? { id: Number(rawBranchId), name: `Branch ${rawBranchId}` } : null);
    const user = { id: newId, user_id: newId, name: fd(body,'name') || body?.name || 'New User', full_name: fd(body,'name') || body?.name || 'New User', mobile: fd(body,'mobile') || body?.mobile || '', email: fd(body,'email') || body?.email || '', role, isActive: fd(body,'isActive') !== false && fd(body,'isActive') !== 'false', branchId, parentId: body?.parentId || { id: 101, name: 'RMS Central' }, createdAt: new Date().toISOString() };
    store.users.push(user);
    if (role === 'branch') store.branches.push({ ...user, latitude: 20.01, longitude: 73.78 });
    return created(user, 'User added');
  }

  if (method === 'PUT' && path.includes('/users/update')) {
    const id = body?.id || body?.userId;
    if (id) {
      const rawBranchId = body?.branchId?.id || body?.branchId || null;
      const branchRecord = rawBranchId ? store.branches.find(b => String(b.id) === String(rawBranchId)) : null;
      const patch = { ...body };
      if (rawBranchId) patch.branchId = branchRecord ? { id: branchRecord.id, name: branchRecord.name } : { id: Number(rawBranchId), name: `Branch ${rawBranchId}` };
      updateById(store.users, id, patch);
      updateById(store.branches, id, patch);
    }
    return success({ id }, 'User updated');
  }

  if (method === 'DELETE' && /\/users\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.users = store.users.filter(u => String(u.id) !== String(id));
    store.branches = store.branches.filter(b => String(b.id) !== String(id));
    return success({}, 'User deleted');
  }

  // ── Customer CRUD (mutates store.customers) ──────────────────────
  if (method === 'POST' && path.includes('/customers/add')) {
    const cust = { id: nextId(store.customers), customerName: body?.customerName || '', name: body?.customerName || '', mobile: body?.mobile || '', email: body?.email || '', isActive: true, createdAt: new Date().toISOString() };
    store.customers.push(cust);
    return created(cust, 'Customer added');
  }

  if (method === 'PUT' && path.includes('/customers/update')) {
    const id = body?.id || body?.customerId;
    if (id) updateById(store.customers, id, body);
    return success({ id }, 'Customer updated');
  }

  if (method === 'DELETE' && /\/customers\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.customers = store.customers.filter(c => String(c.id) !== String(id));
    return success({}, 'Customer deleted');
  }

  // ── Order status update (mutates store.orders) ───────────────────
  if (method === 'PUT' && path.includes('/orders/update')) {
    const id = body?.id || body?.orderId;
    if (id) updateById(store.orders, id, body);
    return success({ id }, 'Order updated');
  }

  if (method === 'DELETE' && /\/orders\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.orders = store.orders.filter(o => String(o.id) !== String(id));
    return success({}, 'Order deleted');
  }

  // ── Dining Tables CRUD ───────────────────────────────────────────
  if (method === 'POST' && path.includes('/dining_tables/add')) {
    const table = { id: nextId(store.diningTables), name: body?.name || body?.tableNumber || 'T-New', tableNumber: body?.tableNumber || body?.name || 'T-New', capacity: Number(body?.capacity||2), sectionId: body?.sectionId || { id: 1101, name: 'Ground Floor' }, isActive: true };
    store.diningTables.push(table);
    return created(table, 'Table added');
  }

  if (method === 'PUT' && path.includes('/dining_tables/update')) {
    const id = body?.id;
    if (id) updateById(store.diningTables, id, body);
    return success({ id }, 'Table updated');
  }

  if (method === 'DELETE' && /\/dining_tables\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.diningTables = store.diningTables.filter(t => String(t.id) !== String(id));
    return success({}, 'Table deleted');
  }

  // ── Section CRUD ─────────────────────────────────────────────────
  if (method === 'POST' && path.includes('/section/add')) {
    const sec = { id: nextId(store.sections), name: body?.name || 'New Section', priority: Number(body?.priority||1), isActive: true };
    store.sections.push(sec);
    return created(sec, 'Section added');
  }

  if (method === 'PUT' && path.includes('/section/update')) {
    const id = body?.id;
    if (id) updateById(store.sections, id, body);
    return success({ id }, 'Section updated');
  }

  if (method === 'DELETE' && /\/section\/\d+/.test(path)) {
    const id = path.split('/').pop();
    store.sections = store.sections.filter(s => String(s.id) !== String(id));
    return success({}, 'Section deleted');
  }

  // ── Wallet topup request ─────────────────────────────────────────
  if (method === 'POST' && path.includes('/wallet_topup_request/add')) {
    const topup = { id: nextId(store.walletTopups), amount: Number(body?.amount||0), status: 'PENDING', requestedBy: 'RMS Central', createdAt: new Date().toISOString() };
    store.walletTopups.push(topup);
    return created(topup, 'Topup request submitted');
  }

  if (method === 'PUT' && path.includes('/wallet_topup_request/update')) {
    const id = body?.id;
    if (id) updateById(store.walletTopups, id, body);
    return success({ id }, 'Topup updated');
  }

  // ── Bank details ─────────────────────────────────────────────────
  if ((method === 'POST' || method === 'PUT') && path.includes('/bank_details/')) {
    const id = body?.id;
    if (id) {
      updateById(store.bankDetails, id, body);
    } else {
      store.bankDetails.push({ id: nextId(store.bankDetails), ...body });
    }
    return success(body, 'Bank details saved');
  }

  // ── Restaurant hours ─────────────────────────────────────────────
  if ((method === 'POST' || method === 'PUT') && path.includes('/restaurant_hours/')) {
    const records = Array.isArray(body) ? body : [body].filter(Boolean);
    const saved = records.map((record) => {
      const existing = record?.id
        ? store.restaurantHours.find((item) => String(item.id) === String(record.id))
        : null;
      const normalized = normalizeRestaurantHourRecord(record, existing || {});

      if (normalized.id) {
        updateById(store.restaurantHours, normalized.id, normalized);
        return normalizeRestaurantHourRecord(
          store.restaurantHours.find((item) => String(item.id) === String(normalized.id)) || normalized
        );
      }

      const createdRecord = {
        ...normalized,
        id: nextId(store.restaurantHours)
      };
      store.restaurantHours.push(createdRecord);
      return normalizeRestaurantHourRecord(createdRecord);
    });

    return success(Array.isArray(body) ? saved : saved[0], 'Hours updated');
  }

  // ── Payment gateway ──────────────────────────────────────────────
  if ((method === 'POST' || method === 'PUT') && path.includes('/payment_gateway/')) {
    const id = body?.id;
    if (id) {
      updateById(store.paymentGateways, id, body);
    } else {
      store.paymentGateways.push({ id: nextId(store.paymentGateways), ...body });
    }
    return success(body, 'Payment gateway saved');
  }

  // Reports summary
  if (method === 'GET' && path === '/api/restaurant/dashboard/summary') {
    const orders = deepClone(store.orders);
    const todayOrders = orders.filter((order) => order.createdAt?.startsWith('2026-04-20'));
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.payableAmount || 0), 0);
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.payableAmount || 0), 0);
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((order) => ({
        orderId: order.orderNumber,
        customerName: order.customerName,
        items: (order.orderItems || []).map((item) => `${item.menuItemName} x${item.quantity}`).join(', '),
        status: ['PREPARING', 'READY', 'CONFIRMED'].includes(order.status) ? 'WORKING' : order.status,
        amount: order.payableAmount,
        createdAt: order.createdAt
      }));
    const topMenuItems = Object.values(
      orders.flatMap((order) => order.orderItems || []).reduce((acc, item) => {
        if (!acc[item.menuItemName]) acc[item.menuItemName] = { name: item.menuItemName, orderCount: 0, price: item.price || 0 };
        acc[item.menuItemName].orderCount += Number(item.quantity || 1);
        return acc;
      }, {})
    ).sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);

    return success({
      todayRevenue,
      todayOrders: todayOrders.length,
      activeMenuItems: store.menuItems.filter((item) => item.isActive !== false).length,
      totalCustomers: store.customers.length,
      summary: {
        totalOrders: orders.length,
        totalRevenue
      },
      orderByStatus: {
        PENDING: orders.filter((order) => order.status === 'PENDING').length,
        WORKING: orders.filter((order) => ['PREPARING', 'READY', 'CONFIRMED'].includes(order.status)).length,
        COMPLETED: orders.filter((order) => ['DELIVERED', 'COMPLETED'].includes(order.status)).length,
        CANCELLED: orders.filter((order) => order.status === 'CANCELLED').length
      },
      revenueTrend: [
        { date: '2026-04-14', revenue: 42000, orders: 124 },
        { date: '2026-04-15', revenue: 55000, orders: 158 },
        { date: '2026-04-16', revenue: 48000, orders: 139 },
        { date: '2026-04-17', revenue: 67000, orders: 191 },
        { date: '2026-04-18', revenue: 72000, orders: 204 },
        { date: '2026-04-19', revenue: 89000, orders: 253 },
        { date: '2026-04-20', revenue: 64000, orders: 179 }
      ],
      topMenuItems,
      recentOrders,
      lowStockItems: [
        { id: 1, name: 'Paneer', stock: 5, threshold: 10, unit: 'kg', level: 'critical' },
        { id: 2, name: 'Naan Dough', stock: 8, threshold: 10, unit: 'pcs', level: 'low' },
        { id: 3, name: 'Chicken Breast', stock: 3, threshold: 8, unit: 'kg', level: 'critical' },
        { id: 4, name: 'Heavy Cream', stock: 9, threshold: 10, unit: 'litre', level: 'low' }
      ]
    });
  }

  if (method === 'GET' && path === '/api/branch/dashboard/summary') {
    const allOrders = deepClone(store.orders);
    const branchOrders = allOrders.filter(o => String(o.branchId) === '201' || String(o.branchId?.id) === '201');
    const totalRevenue = branchOrders.reduce((sum, o) => sum + Number(o.payableAmount || 0), 0);
    const totalOrders = branchOrders.length;
    const recentOrders = [...branchOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(o => ({
        orderId: o.orderNumber,
        customerName: o.customerName,
        items: (o.orderItems || []).map(i => `${i.menuItemName} x${i.quantity}`).join(', '),
        status: ['PREPARING', 'READY', 'CONFIRMED'].includes(o.status) ? 'WORKING' : o.status,
        amount: o.payableAmount,
        createdAt: o.createdAt
      }));
    const topMenuItems = Object.values(
      branchOrders.flatMap(o => o.orderItems || []).reduce((acc, item) => {
        const key = item.menuItemName;
        if (!acc[key]) acc[key] = { name: key, orderCount: 0, price: item.price || 0, revenue: 0 };
        acc[key].orderCount += Number(item.quantity || 1);
        acc[key].revenue += Number(item.price || 0) * Number(item.quantity || 1);
        return acc;
      }, {})
    ).sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
    const statusMap = { PENDING: 0, WORKING: 0, COMPLETED: 0, CANCELLED: 0, UNKNOWN: 0 };
    branchOrders.forEach(o => {
      const s = ['PREPARING', 'READY', 'CONFIRMED'].includes(o.status) ? 'WORKING'
        : ['DELIVERED', 'COMPLETED'].includes(o.status) ? 'COMPLETED'
        : ['PENDING', 'CANCELLED'].includes(o.status) ? o.status : 'UNKNOWN';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    return success({
      branchId: 201,
      branchName: 'RMS Central - Main Branch',
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      ordersByStatus: statusMap,
      revenueTrend: [
        { date: '2026-04-14', revenue: 8900, orders: 24 },
        { date: '2026-04-15', revenue: 11200, orders: 31 },
        { date: '2026-04-16', revenue: 9800, orders: 27 },
        { date: '2026-04-17', revenue: 13500, orders: 38 },
        { date: '2026-04-18', revenue: 10200, orders: 29 },
        { date: '2026-04-19', revenue: 14800, orders: 42 },
        { date: '2026-04-20', revenue: 12400, orders: 35 }
      ],
      topMenuItems,
      recentOrders,
      walletBalance: 4250,
      pendingOutstanding: 1800
    });
  }

  // Cashier routes
  if (method === 'GET' && path === '/api/cashier/dashboard/summary') {
    const fromDate = params.get('fromDate') || new Date().toISOString().split('T')[0];
    const toDate = params.get('toDate') || new Date().toISOString().split('T')[0];
    const allOrders = deepClone(store.orders);
    const totalOrders = 28;
    const totalRevenue = 54000;
    const averageOrderValue = 1928;
    const pendingOrders = 6;
    const recentOrders = [
      { orderId: 'ORD-2045', customerName: 'Rajesh Kumar', type: 'DELIVERY', amount: 1850, status: 'PENDING', createdAt: new Date().toISOString() },
      { orderId: 'ORD-2044', customerName: 'Priya Singh', type: 'TAKEAWAY', amount: 750, status: 'COMPLETED', createdAt: new Date(Date.now() - 600000).toISOString() },
      { orderId: 'ORD-2043', customerName: 'Amit Patel', type: 'DINING', amount: 2300, status: 'COMPLETED', createdAt: new Date(Date.now() - 1200000).toISOString() },
      { orderId: 'ORD-2042', customerName: 'Neha Sharma', type: 'DELIVERY', amount: 1200, status: 'COMPLETED', createdAt: new Date(Date.now() - 1800000).toISOString() },
      { orderId: 'ORD-2041', customerName: 'Vikram Desai', type: 'TAKEAWAY', amount: 980, status: 'COMPLETED', createdAt: new Date(Date.now() - 2400000).toISOString() }
    ];
    return success({
      cashierName: 'Cashier User',
      branchName: 'RMS Central - Main Branch',
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders,
      ordersByStatus: { PENDING: 6, WORKING: 8, COMPLETED: 12, CANCELLED: 2 },
      ordersByType: { DINING: 10, TAKEAWAY: 12, DELIVERY: 6 },
      ordersByPayment: { Cash: 14000, Online: 28000, Card: 12000 },
      revenueTrend: [
        { hour: '8 AM', revenue: 2500 },
        { hour: '10 AM', revenue: 3200 },
        { hour: '12 PM', revenue: 4500 },
        { hour: '2 PM', revenue: 2800 },
        { hour: '4 PM', revenue: 3900 },
        { hour: '6 PM', revenue: 5200 },
        { hour: '8 PM', revenue: 4900 },
        { hour: '10 PM', revenue: 2900 },
        { hour: '11 PM', revenue: 1500 }
      ],
      recentOrders
    });
  }

  if (method === 'GET' && path === '/api/cashier/menu_category/all') {
    return success(store.menuCategories.map(c => ({ id: c.id, name: c.name, description: c.description })));
  }

  if (method === 'GET' && path.includes('/api/cashier/menu_subcategory/')) {
    const categoryId = Number(params.get('categoryId'));
    const subs = store.menuSubcategories
      .filter(s => Number(s.menuCategoryId?.id) === categoryId)
      .map(s => ({ id: s.id, name: s.name }));
    return success(subs);
  }

  if (method === 'GET' && path === '/api/cashier/menu_items/filter') {
    const categoryId = Number(params.get('categoryId'));
    const subcategoryId = Number(params.get('subcategoryId'));
    const searchValue = params.get('searchValue');
    let filtered = store.menuItems.filter(item => item.isActive !== false);
    if (categoryId) filtered = filtered.filter(i => Number(i.menuCategoryId?.id) === categoryId);
    if (subcategoryId) filtered = filtered.filter(i => Number(i.menuSubCategoryId?.id) === subcategoryId);
    if (searchValue) filtered = filtered.filter(i => i.name?.toLowerCase().includes(searchValue.toLowerCase()));
    return success(paginate(filtered, params.get('pageNumber') || '0', params.get('pageSize') || '40'));
  }

  if (method === 'GET' && path === '/api/cashier/delivery_zones/distanceCalculator') {
    const latitude = params.get('latitude') || params.get('lat');
    const longitude = params.get('longitude') || params.get('lng');
    const distance = Math.random() * 10 + 2; // 2-12 km
    let charge = 50;
    if (distance > 5) charge = 100;
    if (distance > 10) charge = 150;
    return success({
      zoneId: Math.floor(Math.random() * 5) + 1,
      zoneName: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
      deliveryCharge: charge,
      distance: parseFloat(distance.toFixed(2)),
      eta: Math.ceil(distance / 2) + ' mins'
    });
  }

  if (method === 'GET' && path === '/api/cashier/customers/search') {
    // Comprehensive mock customer database
    const allCustomers = [
      { id: 3001, name: 'Rajesh Kumar', mobile: '9876543210', email: 'rajesh@example.com', totalOrders: 12, totalSpent: 4560, lastOrder: '2026-04-28T18:30:00Z', joinDate: '2025-10-15T10:00:00Z', status: 'ACTIVE' },
      { id: 3002, name: 'Priya Singh', mobile: '9876543211', email: 'priya@example.com', totalOrders: 8, totalSpent: 3120, lastOrder: '2026-04-27T19:45:00Z', joinDate: '2025-11-20T10:00:00Z', status: 'ACTIVE' },
      { id: 3003, name: 'Amit Patel', mobile: '9876543212', email: 'amit@example.com', totalOrders: 15, totalSpent: 5890, lastOrder: '2026-04-29T20:00:00Z', joinDate: '2025-08-10T10:00:00Z', status: 'ACTIVE' },
      { id: 3004, name: 'Neha Sharma', mobile: '9876543213', email: 'neha@example.com', totalOrders: 6, totalSpent: 2340, lastOrder: '2026-04-25T12:30:00Z', joinDate: '2025-12-05T10:00:00Z', status: 'ACTIVE' },
      { id: 3005, name: 'Rohan Gupta', mobile: '9876543214', email: 'rohan@example.com', totalOrders: 20, totalSpent: 7650, lastOrder: '2026-04-30T19:15:00Z', joinDate: '2025-06-22T10:00:00Z', status: 'ACTIVE' },
      { id: 3006, name: 'Sneha Desai', mobile: '9876543215', email: 'sneha@example.com', totalOrders: 4, totalSpent: 1560, lastOrder: '2026-04-20T18:00:00Z', joinDate: '2026-01-10T10:00:00Z', status: 'ACTIVE' },
      { id: 3007, name: 'Vikram Reddy', mobile: '9876543216', email: 'vikram@example.com', totalOrders: 11, totalSpent: 4210, lastOrder: '2026-04-24T21:30:00Z', joinDate: '2025-09-08T10:00:00Z', status: 'ACTIVE' },
      { id: 3008, name: 'Anjali Verma', mobile: '9876543217', email: 'anjali@example.com', totalOrders: 9, totalSpent: 3450, lastOrder: '2026-04-26T20:45:00Z', joinDate: '2025-10-30T10:00:00Z', status: 'ACTIVE' },
      { id: 3009, name: 'Suresh Joshi', mobile: '9876543218', email: 'suresh@example.com', totalOrders: 7, totalSpent: 2890, lastOrder: '2026-04-22T17:30:00Z', joinDate: '2025-11-12T10:00:00Z', status: 'INACTIVE' },
      { id: 3010, name: 'Kavya Nair', mobile: '9876543219', email: 'kavya@example.com', totalOrders: 13, totalSpent: 5120, lastOrder: '2026-04-29T19:00:00Z', joinDate: '2025-07-18T10:00:00Z', status: 'ACTIVE' },
      { id: 3011, name: 'Arun Menon', mobile: '9876543220', email: 'arun@example.com', totalOrders: 5, totalSpent: 1980, lastOrder: '2026-04-23T18:15:00Z', joinDate: '2025-12-25T10:00:00Z', status: 'ACTIVE' },
      { id: 3012, name: 'Divya Chopra', mobile: '9876543221', email: 'divya@example.com', totalOrders: 18, totalSpent: 6780, lastOrder: '2026-04-30T20:30:00Z', joinDate: '2025-08-05T10:00:00Z', status: 'ACTIVE' }
    ];

    const searchValue = params.get('searchValue') || '';
    const pageNumber = parseInt(params.get('pageNumber') || '0');
    const pageSize = parseInt(params.get('pageSize') || '5');

    // Filter customers
    let filtered = allCustomers;
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase();
      filtered = allCustomers.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.mobile.includes(search) ||
        c.email.toLowerCase().includes(search)
      );
    }

    // Sort by last order (newest first)
    filtered.sort((a, b) => new Date(b.lastOrder) - new Date(a.lastOrder));

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = pageNumber * pageSize;
    const records = filtered.slice(start, start + pageSize);

    return success({
      data: {
        records,
        page: pageNumber,
        size: pageSize,
        totalRecords: total,
        totalPages
      }
    });
  }

  if (method === 'GET' && path.includes('/api/cashier/customer_delivery_addresses/')) {
    const customerId = params.get('customerId');
    const addressMap = {
      '3001': [
        { id: 4001, type: 'Home', address: '123 Main Street, Apt 5B', landmark: 'Near City Park', city: 'Mumbai', state: 'Maharashtra', pinCode: '400001', lat: 19.0760, lng: 72.8777, isDefault: true },
        { id: 4002, type: 'Office', address: '456 Park Avenue, Suite 200', landmark: 'Next to School', city: 'Mumbai', state: 'Maharashtra', pinCode: '400002', lat: 19.0800, lng: 72.8800, isDefault: false }
      ],
      '3002': [
        { id: 4003, type: 'Home', address: '789 Oak Road, House 12', landmark: 'Near Market', city: 'Mumbai', state: 'Maharashtra', pinCode: '400003', lat: 19.0850, lng: 72.8900, isDefault: true }
      ],
      '3003': [
        { id: 4004, type: 'Home', address: '321 Elm Street, Floor 3', landmark: 'Opposite Mall', city: 'Mumbai', state: 'Maharashtra', pinCode: '400004', lat: 19.0900, lng: 72.8950, isDefault: true },
        { id: 4005, type: 'Office', address: '654 Birch Lane, Building A', landmark: 'Near Station', city: 'Mumbai', state: 'Maharashtra', pinCode: '400005', lat: 19.0750, lng: 72.8700, isDefault: false }
      ],
      '3004': [
        { id: 4006, type: 'Home', address: '987 Cedar Road, Apt 2A', landmark: 'Near Hospital', city: 'Mumbai', state: 'Maharashtra', pinCode: '400006', lat: 19.0850, lng: 72.8850, isDefault: true }
      ],
      '3005': [
        { id: 4007, type: 'Home', address: '111 Maple Street, Bungalow', landmark: 'Near Beach', city: 'Mumbai', state: 'Maharashtra', pinCode: '400020', lat: 18.9675, lng: 72.8194, isDefault: true },
        { id: 4008, type: 'Office', address: '222 Pine Avenue, Floor 10', landmark: 'Business District', city: 'Mumbai', state: 'Maharashtra', pinCode: '400021', lat: 19.0895, lng: 72.8685, isDefault: false }
      ]
    };
    return success(addressMap[String(customerId)] || []);
  }

  if (method === 'GET' && path.includes('/api/cashier/addons_items/')) {
    const addonId = params.get('addonId');
    const addonsMap = {
      '1': [{ id: 2001, name: 'Extra Cheese', price: 50 }, { id: 2002, name: 'Jalapenos', price: 30 }, { id: 2003, name: 'BBQ Sauce', price: 40 }],
      '2': [{ id: 2004, name: 'Extra Toppings', price: 75 }, { id: 2005, name: 'Extra Sauce', price: 25 }],
      '3': [{ id: 2006, name: 'Lemon', price: 10 }, { id: 2007, name: 'Mint', price: 15 }]
    };
    const result = addonsMap[String(addonId)] || [];
    return success(result);
  }

  if (method === 'POST' && path === '/api/cashier/customers/add') {
    const { name, mobile } = body;
    return success({ id: Date.now(), name, mobile });
  }

  if (method === 'POST' && path === '/api/cashier/customer_delivery_addresses/add') {
    const { customerId, address } = body;
    return success({ id: Date.now(), customerId, address });
  }

  if (method === 'POST' && path === '/api/cashier/orders/adds') {
    const newId = Date.now();
    const orderNumber = 'ORD-' + String(newId).slice(-5);
    const kitchenOrder = {
      id: newId,
      orderNumber,
      orderType: body.orderType || 'DINE_IN',
      tableNumber: body.tableNumber || null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      kitchenAcceptAt: null,
      kitchenReadyAt: null,
      orderItems: (body.items || []).map((item, idx) => ({
        id: newId + idx,
        menuItemName: item.menuItemName || item.name || 'Item',
        quantity: item.quantity || 1,
        specialInstructions: item.specialInstructions || '',
        addonItems: item.addonItems || []
      }))
    };
    store.kitchenOrders.unshift(kitchenOrder);
    return success({ orderNumber, id: newId, totalAmount: body.totalAmount || 0, status: 'PENDING' });
  }

  if (method === 'GET' && path === '/api/cashier/orders/filter') {
    const status = params.get('status');
    const orders = [
      { id: 2045, orderId: 'ORD-2045', orderNumber: 'ORD-2045', customerName: 'Rajesh Kumar', type: 'DELIVERY', amount: 1850, status: 'PENDING', paymentMethod: 'CASH', paymentStatus: 'PENDING', createdAt: new Date().toISOString() }
    ];
    let filtered = orders;
    if (status && status !== 'null') {
      filtered = filtered.filter(o => o.status === status);
    }
    return success(paginate(filtered, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path === '/api/cashier/orders/history') {
    const orders = [
      { id: 2045, orderId: 'ORD-2045', orderNumber: 'ORD-2045', customerName: 'Rajesh Kumar', type: 'DELIVERY', amount: 1850, status: 'PENDING', paymentMethod: 'CASH', paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
      { id: 2044, orderId: 'ORD-2044', orderNumber: 'ORD-2044', customerName: 'Priya Singh', type: 'TAKEAWAY', amount: 750, status: 'COMPLETED', paymentMethod: 'CARD', paymentStatus: 'SUCCESS', createdAt: new Date(Date.now() - 600000).toISOString() },
      { id: 2043, orderId: 'ORD-2043', orderNumber: 'ORD-2043', customerName: 'Amit Patel', type: 'DINING', amount: 2300, status: 'COMPLETED', paymentMethod: 'UPI', paymentStatus: 'SUCCESS', createdAt: new Date(Date.now() - 1200000).toISOString() },
      { id: 2042, orderId: 'ORD-2042', orderNumber: 'ORD-2042', customerName: 'Neha Sharma', type: 'DELIVERY', amount: 1200, status: 'COMPLETED', paymentMethod: 'CASH', paymentStatus: 'SUCCESS', createdAt: new Date(Date.now() - 1800000).toISOString() },
      { id: 2041, orderId: 'ORD-2041', orderNumber: 'ORD-2041', customerName: 'Vikram Desai', type: 'TAKEAWAY', amount: 980, status: 'COMPLETED', paymentMethod: 'CARD', paymentStatus: 'SUCCESS', createdAt: new Date(Date.now() - 2400000).toISOString() },
      { id: 2040, orderId: 'ORD-2040', orderNumber: 'ORD-2040', customerName: 'Anjali Verma', type: 'DINING', amount: 1500, status: 'COMPLETED', paymentMethod: 'CASH', paymentStatus: 'SUCCESS', createdAt: new Date(Date.now() - 3000000).toISOString() },
      { id: 2039, orderId: 'ORD-2039', orderNumber: 'ORD-2039', customerName: 'Rohan Das', type: 'DELIVERY', amount: 2100, status: 'COMPLETED', paymentMethod: 'UPI', paymentStatus: 'SUCCESS', createdAt: new Date(Date.now() - 3600000).toISOString() }
    ];

    // Apply filters
    let filtered = orders;
    if (params.get('searchValue')) {
      const search = params.get('searchValue').toLowerCase();
      filtered = filtered.filter(o =>
        o.customerName.toLowerCase().includes(search) ||
        o.orderId.toLowerCase().includes(search)
      );
    }
    if (params.get('paymentMethod') && params.get('paymentMethod') !== 'null') {
      filtered = filtered.filter(o => o.paymentMethod === params.get('paymentMethod'));
    }
    if (params.get('paymentStatus') && params.get('paymentStatus') !== 'null') {
      filtered = filtered.filter(o => o.paymentStatus === params.get('paymentStatus'));
    }

    return success(paginate(filtered, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'GET' && path === '/api/cashier/users/filter') {
    const role = params.get('role');
    const searchValue = params.get('searchValue');
    const isActive = params.get('isActive');

    let agents = [];
    if (role === 'delivery') {
      agents = [
        { id: 601, name: 'Delivery Boy 1', mobile: '9876543210', email: 'boy1@example.com', outstandingBalance: 500, balance: 2000, isActive: true },
        { id: 602, name: 'Delivery Boy 2', mobile: '9876543211', email: 'boy2@example.com', outstandingBalance: 300, balance: 3500, isActive: true },
        { id: 603, name: 'Delivery Boy 3', mobile: '9876543212', email: 'boy3@example.com', outstandingBalance: 700, balance: 1500, isActive: false },
        { id: 604, name: 'Delivery Boy 4', mobile: '9876543213', email: 'boy4@example.com', outstandingBalance: 200, balance: 4000, isActive: true }
      ];
    }

    // Apply filters
    if (searchValue) {
      const search = searchValue.toLowerCase();
      agents = agents.filter(a => a.name.toLowerCase().includes(search) || a.mobile.includes(search));
    }
    if (isActive !== null && isActive !== undefined && isActive !== 'null') {
      agents = agents.filter(a => a.isActive === (isActive === true || isActive === 'true'));
    }

    const result = paginate(agents, params.get('pageNumber'), params.get('pageSize'));
    return success(result);
  }

  if (method === 'POST' && path === '/api/cashier/outstanding/deduct') {
    const { userId, amount } = body;
    return success({ success: true, message: 'Outstanding deducted' });
  }

  if (method === 'GET' && path === '/api/cashier/wallet_topup_request/filter') {
    const requests = [
      { id: 701, userId: { id: 501, name: 'John Doe', mobile: '9876543210' }, amount: 5000, status: 'APPROVED', approvedBy: 'Manager', requestedAt: new Date().toISOString(), approvedAt: new Date().toISOString() },
      { id: 702, userId: { id: 502, name: 'Jane Smith', mobile: '9876543211' }, amount: 3000, status: 'PENDING', requestedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 703, userId: { id: 503, name: 'Raj Patel', mobile: '9876543212' }, amount: 2500, status: 'REJECTED', rejectedReason: 'Insufficient balance', requestedAt: new Date(Date.now() - 172800000).toISOString() },
      { id: 704, userId: { id: 504, name: 'Priya Singh', mobile: '9876543213' }, amount: 7500, status: 'APPROVED', approvedBy: 'Admin', requestedAt: new Date(Date.now() - 259200000).toISOString() }
    ];

    let filtered = requests;
    if (params.get('searchValue')) {
      const search = params.get('searchValue').toLowerCase();
      filtered = filtered.filter(r =>
        r.userId.name.toLowerCase().includes(search) ||
        r.userId.mobile.includes(search)
      );
    }
    if (params.get('status') && params.get('status') !== 'null') {
      filtered = filtered.filter(r => r.status === params.get('status'));
    }

    return success(paginate(filtered, params.get('pageNumber'), params.get('pageSize')));
  }

  if (method === 'PUT' && path.includes('/api/cashier/wallet_topup_request/')) {
    const requestId = path.split('/').pop();
    return success({ ...body, id: requestId, success: true });
  }

  if (method === 'PUT' && path === '/api/cashier/wallet_topup_request/update') {
    return success({ ...body, success: true, message: 'Wallet top-up request updated' });
  }

  if (method === 'PUT' && path === '/api/cashier/orders/update') {
    const { id, paymentMethod, paymentStatus } = body;
    return success({ id, paymentMethod, paymentStatus, success: true, message: 'Order updated successfully' });
  }

  if (method === 'GET' && path === '/api/cashier/orders/update') {
    return success({ success: true });
  }

  if (method === 'GET' && path === '/api/cashier/orders/xl_export') {
    // This endpoint returns binary Excel file, but for mock we just return success message
    return success({ message: 'Excel file ready for download' });
  }

  if (method === 'GET' && path === '/api/restaurant/reports/summary') {
    return success({
      totalRevenue: 342850, totalOrders: 1248, avgOrderValue: 274,
      totalCustomers: 892, cancellationRate: 4.8,
      revenueTrend: [
        { date: '2026-04-14', revenue: 42000, orders: 124 },
        { date: '2026-04-15', revenue: 55000, orders: 158 },
        { date: '2026-04-16', revenue: 48000, orders: 139 },
        { date: '2026-04-17', revenue: 67000, orders: 191 },
        { date: '2026-04-18', revenue: 72000, orders: 204 },
        { date: '2026-04-19', revenue: 89000, orders: 253 },
        { date: '2026-04-20', revenue: 64000, orders: 179 }
      ],
      topItems: [
        { name: 'Chicken Biryani', orders: 287, revenue: 91840 },
        { name: 'Paneer Butter Masala', orders: 234, revenue: 56160 },
        { name: 'Mutton Rogan Josh', orders: 198, revenue: 83160 },
        { name: 'Dal Makhani', orders: 312, revenue: 59280 },
        { name: 'Garlic Naan', orders: 445, revenue: 35600 }
      ],
      ordersByStatus: { COMPLETED: 748, PREPARING: 198, PENDING: 243, CANCELLED: 59 },
      ordersByType: { online: 848, dineIn: 400 }
    });
  }

  if (['POST', 'PUT'].includes(method) && (
    path.includes('/update') ||
    path.includes('/add') ||
    path.includes('/bulk') ||
    path.includes('/deduct') ||
    path.includes('/grant-grace') ||
    path.includes('/impersonate') ||
    path.includes('/validate') ||
    path.includes('/test')
  )) {
    return success({ id: Date.now(), ...body }, 'Mock save successful');
  }

  // ─── Kitchen routes ───────────────────────────────────────────────────────

  if (method === 'GET' && path === '/api/kitchen/dashboard/summary') {
    const orders = store.kitchenOrders;
    const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
    return success({
      chefName: 'Chef Ramesh',
      branchName: 'RMS Central - Main',
      fromDate: params.get('fromDate') || new Date().toISOString().split('T')[0],
      toDate: params.get('toDate') || new Date().toISOString().split('T')[0],
      totalOrders: orders.length,
      newOrders: (statusCounts.PENDING || 0) + (statusCounts.ACCEPTED_ORDER || 0),
      preparing: statusCounts.PREPARING_ORDER || 0,
      ready: statusCounts.READY_FOR_ORDER || 0,
      totalRevenue: 18450,
      avgPrepTime: 18,
      ordersByStatus: {
        PENDING: statusCounts.PENDING || 0,
        ACCEPTED_ORDER: statusCounts.ACCEPTED_ORDER || 0,
        PREPARING_ORDER: statusCounts.PREPARING_ORDER || 0,
        READY_FOR_ORDER: statusCounts.READY_FOR_ORDER || 0,
        COMPLETED: statusCounts.COMPLETED || 0,
        CANCELLED: statusCounts.CANCELLED || 0
      },
      hourlyTrend: [
        { hour: '9AM', orders: 3 }, { hour: '10AM', orders: 7 }, { hour: '11AM', orders: 9 },
        { hour: '12PM', orders: 14 }, { hour: '1PM', orders: 11 }, { hour: '2PM', orders: 8 },
        { hour: '3PM', orders: 5 }, { hour: '4PM', orders: 4 }
      ],
      recentOrders: orders.slice(0, 5).map(o => ({
        orderId: o.orderNumber,
        type: o.orderType,
        itemsCount: o.orderItems?.length || 0,
        status: o.status,
        createdAt: o.createdAt
      }))
    });
  }

  if (method === 'GET' && path === '/api/kitchen/orders/filter') {
    const statusParam = params.get('status');
    const searchValue = params.get('searchValue');
    const activeStatuses = ['PENDING', 'ACCEPTED_ORDER', 'PREPARING_ORDER', 'READY_FOR_ORDER', 'SERVED'];
    let filtered = store.kitchenOrders.filter(o => activeStatuses.includes(o.status));
    if (statusParam) filtered = filtered.filter(o => o.status === statusParam);
    if (searchValue) filtered = filtered.filter(o => o.orderNumber?.toLowerCase().includes(searchValue.toLowerCase()));
    return success(paginate(filtered, params.get('pageNumber') || '0', params.get('pageSize') || '10'));
  }

  if (method === 'GET' && path === '/api/kitchen/orders/history') {
    const statusParam = params.get('status');
    const searchValue = params.get('searchValue');
    let filtered = deepClone(store.kitchenOrders);
    if (statusParam) filtered = filtered.filter(o => o.status === statusParam);
    if (searchValue) filtered = filtered.filter(o => o.orderNumber?.toLowerCase().includes(searchValue.toLowerCase()));
    return success(paginate(filtered, params.get('pageNumber') || '0', params.get('pageSize') || '5'));
  }

  if (method === 'GET' && path === '/api/kitchen/orders/order-status-count') {
    const counts = store.kitchenOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
    return success({
      PENDING: counts.PENDING || 0,
      ACCEPTED_ORDER: counts.ACCEPTED_ORDER || 0,
      PREPARING_ORDER: counts.PREPARING_ORDER || 0,
      READY_FOR_ORDER: counts.READY_FOR_ORDER || 0,
      COMPLETED: counts.COMPLETED || 0,
      CANCELLED: counts.CANCELLED || 0
    });
  }

  if (method === 'PUT' && path === '/api/kitchen/orders/update') {
    const { id, orderId, status } = body || {};
    const lookupId = id || orderId;
    if (lookupId && status) {
      const idx = store.kitchenOrders.findIndex(o => o.id === lookupId || o.orderNumber === lookupId || String(o.id) === String(lookupId));
      if (idx !== -1) {
        store.kitchenOrders[idx].status = status;
        if (status === 'ACCEPTED_ORDER') store.kitchenOrders[idx].kitchenAcceptAt = new Date().toISOString();
        if (status === 'READY_FOR_ORDER') store.kitchenOrders[idx].kitchenReadyAt = new Date().toISOString();
      }
    }
    return success({ orderId: lookupId, status }, 'Order status updated');
  }

  if (method === 'GET' && path === '/api/kitchen/orders/xl_export') {
    return blobSuccess('Kitchen Orders Mock Export', EXCEL_HEADERS);
  }

  if (method === 'GET' && path === '/api/kitchen/reports') {
    const orders = store.kitchenOrders;
    const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
    return success({
      summary: {
        totalOrders: orders.length,
        completedOrders: statusCounts.COMPLETED || 0,
        avgPrepTime: 18,
        peakHour: '12 PM - 1 PM'
      },
      ordersByStatus: [
        { status: 'PENDING', count: statusCounts.PENDING || 0 },
        { status: 'ACCEPTED_ORDER', count: statusCounts.ACCEPTED_ORDER || 0 },
        { status: 'PREPARING_ORDER', count: statusCounts.PREPARING_ORDER || 0 },
        { status: 'READY_FOR_ORDER', count: statusCounts.READY_FOR_ORDER || 0 },
        { status: 'COMPLETED', count: statusCounts.COMPLETED || 0 },
        { status: 'CANCELLED', count: statusCounts.CANCELLED || 0 }
      ],
      topItems: [
        { name: 'Chicken Biryani', quantity: 45 },
        { name: 'Butter Chicken', quantity: 38 },
        { name: 'Dal Makhani', quantity: 32 },
        { name: 'Veg Thali', quantity: 28 },
        { name: 'Paneer Tikka', quantity: 24 },
        { name: 'Mutton Biryani', quantity: 19 }
      ],
      hourlyBreakdown: [
        { hour: '9 AM', orders: 3, avgPrepTime: 15 },
        { hour: '10 AM', orders: 7, avgPrepTime: 17 },
        { hour: '11 AM', orders: 9, avgPrepTime: 18 },
        { hour: '12 PM', orders: 14, avgPrepTime: 22 },
        { hour: '1 PM', orders: 11, avgPrepTime: 20 },
        { hour: '2 PM', orders: 8, avgPrepTime: 16 },
        { hour: '3 PM', orders: 5, avgPrepTime: 14 },
        { hour: '4 PM', orders: 4, avgPrepTime: 13 }
      ]
    });
  }

  return null;
};

const handleDeliveryRoutes = ({ method, path, params, body }) => {
  // GET /api/delivery/dashboard
  if (method === 'GET' && path.includes('/delivery/dashboard')) {
    const orders = store.deliveryOrders || [];
    return success({
      todayDeliveries: orders.filter(o => o.status === 'DELIVERED').length,
      activeOrders: orders.filter(o => ['READY_FOR_ORDER', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
      totalEarnings: orders.filter(o => o.status === 'DELIVERED').length * 50,
      deliveryBoy: { id: 24, name: 'Ramu Delivery', mobile: '4444444444', isActive: true }
    });
  }

  // GET /api/delivery/orders (active)
  if (method === 'GET' && path.includes('/delivery/orders') && !path.includes('/history')) {
    const orders = (store.deliveryOrders || []).filter(o =>
      ['READY_FOR_ORDER', 'OUT_FOR_DELIVERY'].includes(o.status)
    );
    return success({ records: orders, totalRecords: orders.length });
  }

  // PUT /api/delivery/orders/update
  if (method === 'PUT' && path.includes('/delivery/orders/update')) {
    const idx = (store.deliveryOrders || []).findIndex(o => o.id === body.id);
    if (idx !== -1) {
      store.deliveryOrders[idx].status = body.status;
      return success(store.deliveryOrders[idx], 'Order updated');
    }
    return success(null, 'Order not found');
  }

  // GET /api/delivery/orders/history
  if (method === 'GET' && path.includes('/delivery/orders/history')) {
    const orders = (store.deliveryOrders || []).filter(o => o.status === 'DELIVERED');
    return success(paginate(orders, Number(params.get('pageNumber') || 0), Number(params.get('pageSize') || 10)));
  }

  // GET /api/delivery/earnings
  if (method === 'GET' && path.includes('/delivery/earnings')) {
    const delivered = (store.deliveryOrders || []).filter(o => o.status === 'DELIVERED');
    return success({ totalEarnings: delivered.length * 50, totalOrders: delivered.length, perOrderEarning: 50 });
  }

  return null;
};

const fallbackResponse = ({ method, path, params, body }) => {
  if (method === 'GET') {
    if (path.includes('/summary') || path.includes('/overview')) return success(dashboardSummary());
    if (path.includes('/filter') || path.includes('/getAll') || path.includes('/all') || path.includes('/history')) {
      return success(paginate([], params.get('pageNumber'), params.get('pageSize')));
    }
    return success({});
  }
  return success(body || {}, 'Mock request completed');
};

export const handleMockRequest = (method, rawUrl, config = {}) => {
  const request = normalizeRequest(method, rawUrl, config);
  const authResponse = handleAuthRoutes(request);
  if (authResponse) return authResponse;

  const publicResponse = handlePublicCustomerRoutes(request);
  if (publicResponse) return publicResponse;

  const deliveryResponse = handleDeliveryRoutes(request);
  if (deliveryResponse) return deliveryResponse;

  const appResponse = handleCommonAppRoutes(request);
  if (appResponse) return appResponse;

  return fallbackResponse(request);
};

export const mockAxiosAdapter = async (config) => {
  const response = handleMockRequest(config.method || 'GET', config.url || '', config);
  return {
    data: response.data,
    status: response.status || 200,
    statusText: 'OK',
    headers: response.headers || JSON_HEADERS,
    config,
    request: {}
  };
};

export const installMockFetch = () => {
  if (!isMockEnabled() || typeof window === 'undefined' || window.__MOCK_FETCH_INSTALLED__) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  const realBackendPrefixes = [
    '/api/admin/',
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
  window.__MOCK_FETCH_INSTALLED__ = true;

  window.fetch = async (input, init = {}) => {
    const rawUrl = typeof input === 'string' ? input : input?.url;
    const method = init.method || input?.method || 'GET';
    const headers = init.headers || {};
    const body = init.body;

    if (rawUrl && realBackendPrefixes.some((prefix) => rawUrl.includes(prefix))) {
      return originalFetch(input, init);
    }

    if (rawUrl && (rawUrl.includes('/api/') || rawUrl.includes('/login/') || rawUrl.includes('/signup/'))) {
      const response = handleMockRequest(method, rawUrl, { headers, data: body });
      if (response.body) {
        return new Response(response.body, { status: response.status || 200, headers: response.headers || EXCEL_HEADERS });
      }
      return new Response(JSON.stringify(response.data), { status: response.status || 200, headers: response.headers || JSON_HEADERS });
    }

    return originalFetch(input, init);
  };
};
