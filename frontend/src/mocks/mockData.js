export const mockData = {
  theme: {
    id: 1,
    restaurantId: { id: 101, email: 'hello@rms.local' },
    restaurantName: 'RMS',
    primarys: '#3B82F6',
    secondary: '#3B82F6',
    tertiary: '#3B82F6',
    fontColour: '#1f2937',
    fontName: 'Poppins',
    logoUrl: null,
    feviconUrl: null,
    address: 'Mock Street, Nashik',
    phone: '9876543210',
    alternatePhone: '9123456780',
    socialMediaDetails: {
      instagram: 'https://instagram.com/rms',
      facebook: 'https://facebook.com/rms'
    }
  },

  marqueeMessages: [
    { id: 1, message: 'Mock mode active: all API responses are local.' },
    { id: 2, message: 'Try login with 9999999999 / 123456 for superadmin.' }
  ],

  restaurants: [
    { id: 101, name: 'RMS Central', email: 'central@rms.local', mobile: '8888888888', ownerName: 'Rajesh Kumar', isActive: true, createdAt: '2026-01-01T10:00:00Z' },
    { id: 102, name: 'RMS Express', email: 'express@rms.local', mobile: '8888888887', ownerName: 'Priya Sharma', isActive: true, createdAt: '2026-01-05T10:00:00Z' },
    { id: 103, name: 'Spice Garden', email: 'spice@rms.local', mobile: '9111111111', ownerName: 'Amit Patel', isActive: true, createdAt: '2026-01-10T10:00:00Z' },
    { id: 104, name: 'Pizza Hub', email: 'pizza@rms.local', mobile: '9222222222', ownerName: 'Neha Rathod', isActive: false, createdAt: '2026-01-15T10:00:00Z' },
    { id: 105, name: 'Tandoor House', email: 'tandoor@rms.local', mobile: '9333333333', ownerName: 'Suresh Verma', isActive: true, createdAt: '2026-02-01T10:00:00Z' },
    { id: 106, name: 'The Biryani Box', email: 'biryani@rms.local', mobile: '9444444444', ownerName: 'Farhan Sheikh', isActive: true, createdAt: '2026-02-10T10:00:00Z' },
    { id: 107, name: 'Green Bowl', email: 'green@rms.local', mobile: '9555555550', ownerName: 'Meera Iyer', isActive: true, createdAt: '2026-02-20T10:00:00Z' },
    { id: 108, name: 'Burger Nation', email: 'burger@rms.local', mobile: '9666666660', ownerName: 'Dhruv Singh', isActive: true, createdAt: '2026-03-01T10:00:00Z' },
    { id: 109, name: 'Chai & Snacks', email: 'chai@rms.local', mobile: '9777777770', ownerName: 'Kavya Nair', isActive: false, createdAt: '2026-03-10T10:00:00Z' },
    { id: 110, name: 'The Desi Kitchen', email: 'desi@rms.local', mobile: '9888888880', ownerName: 'Arun Joshi', isActive: true, createdAt: '2026-03-20T10:00:00Z' }
  ],

  branches: [
    { id: 201, name: 'RMS Central - Main', email: 'branch1@rms.local', mobile: '7777777777', role: 'branch', isActive: true, parentId: { id: 101, name: 'RMS Central' }, latitude: 20.01, longitude: 73.78, createdAt: '2026-01-02T10:00:00Z' },
    { id: 202, name: 'RMS Central - Andheri', email: 'branch2@rms.local', mobile: '7777777776', role: 'branch', isActive: true, parentId: { id: 101, name: 'RMS Central' }, latitude: 20.02, longitude: 73.79, createdAt: '2026-01-03T10:00:00Z' },
    { id: 203, name: 'RMS Express - Bandra', email: 'branch3@rms.local', mobile: '7777777775', role: 'branch', isActive: true, parentId: { id: 102, name: 'RMS Express' }, latitude: 20.03, longitude: 73.80, createdAt: '2026-01-08T10:00:00Z' },
    { id: 204, name: 'Spice Garden - Dadar', email: 'branch4@rms.local', mobile: '7777777774', role: 'branch', isActive: true, parentId: { id: 103, name: 'Spice Garden' }, latitude: 20.04, longitude: 73.81, createdAt: '2026-01-12T10:00:00Z' },
    { id: 205, name: 'Tandoor House - Main', email: 'branch5@rms.local', mobile: '7777777773', role: 'branch', isActive: true, parentId: { id: 105, name: 'Tandoor House' }, latitude: 20.05, longitude: 73.82, createdAt: '2026-02-03T10:00:00Z' },
    { id: 206, name: 'The Biryani Box - Kurla', email: 'branch6@rms.local', mobile: '7777777772', role: 'branch', isActive: true, parentId: { id: 106, name: 'The Biryani Box' }, latitude: 20.06, longitude: 73.83, createdAt: '2026-02-12T10:00:00Z' },
    { id: 207, name: 'Green Bowl - Vashi', email: 'branch7@rms.local', mobile: '7777777771', role: 'branch', isActive: true, parentId: { id: 107, name: 'Green Bowl' }, latitude: 20.07, longitude: 73.84, createdAt: '2026-02-22T10:00:00Z' },
    { id: 208, name: 'Burger Nation - Powai', email: 'branch8@rms.local', mobile: '7777777770', role: 'branch', isActive: true, parentId: { id: 108, name: 'Burger Nation' }, latitude: 20.08, longitude: 73.85, createdAt: '2026-03-03T10:00:00Z' }
  ],

  approvals: [
    { id: 1, name: 'The Kebab Corner', email: 'kebab@rms.local', mobile: '9100000001', role: 'restaurant', status: 'pending', createdAt: '2026-04-18T10:00:00Z' },
    { id: 2, name: 'South Indian Delight', email: 'south@rms.local', mobile: '9100000002', role: 'restaurant', status: 'pending', createdAt: '2026-04-19T08:30:00Z' },
    { id: 3, name: 'Wok Express', email: 'wok@rms.local', mobile: '9100000003', role: 'restaurant', status: 'pending', createdAt: '2026-04-19T11:00:00Z' },
    { id: 4, name: 'Momo Palace', email: 'momo@rms.local', mobile: '9100000004', role: 'restaurant', status: 'pending', createdAt: '2026-04-20T09:00:00Z' },
    { id: 5, name: 'Chai & Snacks', email: 'chai@rms.local', mobile: '9777777770', role: 'restaurant', status: 'approved', createdAt: '2026-03-10T10:00:00Z' },
    { id: 6, name: 'Burger Nation', email: 'burger@rms.local', mobile: '9666666660', role: 'restaurant', status: 'approved', createdAt: '2026-03-01T10:00:00Z' },
    { id: 7, name: 'Fast Wrap Co.', email: 'wrap@rms.local', mobile: '9100000005', role: 'restaurant', status: 'rejected', createdAt: '2026-03-25T10:00:00Z' }
  ],

  users: [
    { id: 1, user_id: 1, name: 'Super Admin', full_name: 'Super Admin', email: 'superadmin@rms.local', mobile: '9999999999', role: 'supadmin', isActive: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 2, user_id: 2, name: 'Rajesh Kumar', full_name: 'Rajesh Kumar', hospital_name: 'RMS Central', email: 'central@rms.local', mobile: '8888888888', role: 'restaurant', isActive: true, parentId: { id: 101, name: 'RMS Central' }, createdAt: '2026-01-01T09:00:00Z' },
    { id: 3, user_id: 3, name: 'Priya Sharma', full_name: 'Priya Sharma', hospital_name: 'RMS Express', email: 'express@rms.local', mobile: '8888888887', role: 'restaurant', isActive: true, parentId: { id: 102, name: 'RMS Express' }, createdAt: '2026-01-05T09:00:00Z' },
    { id: 4, user_id: 4, name: 'Amit Patel', full_name: 'Amit Patel', hospital_name: 'Spice Garden', email: 'spice@rms.local', mobile: '9111111111', role: 'restaurant', isActive: true, parentId: { id: 103, name: 'Spice Garden' }, createdAt: '2026-01-10T09:00:00Z' },
    { id: 5, user_id: 5, name: 'Neha Rathod', full_name: 'Neha Rathod', hospital_name: 'Pizza Hub', email: 'pizza@rms.local', mobile: '9222222222', role: 'restaurant', isActive: false, parentId: { id: 104, name: 'Pizza Hub' }, createdAt: '2026-01-15T09:00:00Z' },
    { id: 6, user_id: 6, name: 'Suresh Verma', full_name: 'Suresh Verma', hospital_name: 'Tandoor House', email: 'tandoor@rms.local', mobile: '9333333333', role: 'restaurant', isActive: true, parentId: { id: 105, name: 'Tandoor House' }, createdAt: '2026-02-01T09:00:00Z' },
    { id: 7, user_id: 7, name: 'Farhan Sheikh', full_name: 'Farhan Sheikh', hospital_name: 'The Biryani Box', email: 'biryani@rms.local', mobile: '9444444444', role: 'restaurant', isActive: true, parentId: { id: 106, name: 'The Biryani Box' }, createdAt: '2026-02-10T09:00:00Z' },
    { id: 8, user_id: 8, name: 'Meera Iyer', full_name: 'Meera Iyer', hospital_name: 'Green Bowl', email: 'green@rms.local', mobile: '9555555550', role: 'restaurant', isActive: true, parentId: { id: 107, name: 'Green Bowl' }, createdAt: '2026-02-20T09:00:00Z' },
    { id: 9, user_id: 9, name: 'Dhruv Singh', full_name: 'Dhruv Singh', hospital_name: 'Burger Nation', email: 'burger@rms.local', mobile: '9666666660', role: 'restaurant', isActive: true, parentId: { id: 108, name: 'Burger Nation' }, createdAt: '2026-03-01T09:00:00Z' },
    { id: 10, user_id: 10, name: 'Kavya Nair', full_name: 'Kavya Nair', hospital_name: 'Chai & Snacks', email: 'chai@rms.local', mobile: '9777777770', role: 'restaurant', isActive: false, parentId: { id: 109, name: 'Chai & Snacks' }, createdAt: '2026-03-10T09:00:00Z' },
    { id: 11, user_id: 11, name: 'Arun Joshi', full_name: 'Arun Joshi', hospital_name: 'The Desi Kitchen', email: 'desi@rms.local', mobile: '9888888880', role: 'restaurant', isActive: true, parentId: { id: 110, name: 'The Desi Kitchen' }, createdAt: '2026-03-20T09:00:00Z' },
    { id: 12, user_id: 12, name: 'Vishal Mehta', full_name: 'Vishal Mehta', email: 'branch1@rms.local', mobile: '7777777777', role: 'branch', isActive: true, parentId: { id: 101, name: 'RMS Central' }, createdAt: '2026-01-02T10:00:00Z' },
    { id: 13, user_id: 13, name: 'Sneha Kulkarni', full_name: 'Sneha Kulkarni', email: 'branch2@rms.local', mobile: '7777777776', role: 'branch', isActive: true, parentId: { id: 101, name: 'RMS Central' }, createdAt: '2026-01-03T10:00:00Z' },
    { id: 14, user_id: 14, name: 'Akash Desai', full_name: 'Akash Desai', email: 'branch3@rms.local', mobile: '7777777775', role: 'branch', isActive: true, parentId: { id: 102, name: 'RMS Express' }, createdAt: '2026-01-08T10:00:00Z' },
    { id: 15, user_id: 15, name: 'Rekha Pandey', full_name: 'Rekha Pandey', email: 'branch4@rms.local', mobile: '7777777774', role: 'branch', isActive: true, parentId: { id: 103, name: 'Spice Garden' }, createdAt: '2026-01-12T10:00:00Z' },
    { id: 16, user_id: 16, name: 'Nikhil Jain', full_name: 'Nikhil Jain', email: 'branch5@rms.local', mobile: '7777777773', role: 'branch', isActive: true, parentId: { id: 105, name: 'Tandoor House' }, createdAt: '2026-02-03T10:00:00Z' },
    { id: 17, user_id: 17, name: 'Chef Ramesh', full_name: 'Chef Ramesh', email: 'kitchen1@rms.local', mobile: '6666666666', role: 'kitchen', isActive: true, parentId: { id: 201, name: 'RMS Central - Main' }, createdAt: '2026-01-02T11:00:00Z' },
    { id: 18, user_id: 18, name: 'Chef Sunil', full_name: 'Chef Sunil', email: 'kitchen2@rms.local', mobile: '6600000001', role: 'kitchen', isActive: true, parentId: { id: 202, name: 'RMS Central - Andheri' }, createdAt: '2026-01-04T11:00:00Z' },
    { id: 19, user_id: 19, name: 'Chef Lakshmi', full_name: 'Chef Lakshmi', email: 'kitchen3@rms.local', mobile: '6600000002', role: 'kitchen', isActive: true, parentId: { id: 204, name: 'Spice Garden - Dadar' }, createdAt: '2026-01-13T11:00:00Z' },
    { id: 20, user_id: 20, name: 'Chef Mohsin', full_name: 'Chef Mohsin', email: 'kitchen4@rms.local', mobile: '6600000003', role: 'kitchen', isActive: true, parentId: { id: 206, name: 'The Biryani Box - Kurla' }, createdAt: '2026-02-13T11:00:00Z' },
    { id: 21, user_id: 21, name: 'Pooja Cashier', full_name: 'Pooja Cashier', email: 'cashier1@rms.local', mobile: '5555555555', role: 'cashier', isActive: true, parentId: { id: 201, name: 'RMS Central - Main' }, createdAt: '2026-01-02T12:00:00Z' },
    { id: 22, user_id: 22, name: 'Ankit Cashier', full_name: 'Ankit Cashier', email: 'cashier2@rms.local', mobile: '5500000001', role: 'cashier', isActive: true, parentId: { id: 203, name: 'RMS Express - Bandra' }, createdAt: '2026-01-09T12:00:00Z' },
    { id: 23, user_id: 23, name: 'Ritu Cashier', full_name: 'Ritu Cashier', email: 'cashier3@rms.local', mobile: '5500000002', role: 'cashier', isActive: true, parentId: { id: 205, name: 'Tandoor House - Main' }, createdAt: '2026-02-04T12:00:00Z' },
    { id: 24, user_id: 24, name: 'Ramu Delivery', full_name: 'Ramu Delivery', email: 'delivery1@rms.local', mobile: '4444444444', role: 'delivery', isActive: true, parentId: { id: 201, name: 'RMS Central - Main' }, createdAt: '2026-01-03T13:00:00Z' },
    { id: 25, user_id: 25, name: 'Shyam Delivery', full_name: 'Shyam Delivery', email: 'delivery2@rms.local', mobile: '4400000001', role: 'delivery', isActive: true, parentId: { id: 204, name: 'Spice Garden - Dadar' }, createdAt: '2026-01-14T13:00:00Z' },
    { id: 26, user_id: 26, name: 'Kiran Delivery', full_name: 'Kiran Delivery', email: 'delivery3@rms.local', mobile: '4400000002', role: 'delivery', isActive: true, parentId: { id: 206, name: 'The Biryani Box - Kurla' }, createdAt: '2026-02-14T13:00:00Z' },
    { id: 27, user_id: 27, name: 'Chef Arun', full_name: 'Chef Arun', email: 'kitchen5@rms.local', mobile: '6600000004', role: 'kitchen', isActive: true, parentId: { id: 203, name: 'RMS Express - Bandra' }, createdAt: '2026-02-05T11:00:00Z' },
    { id: 28, user_id: 28, name: 'Chef Priya', full_name: 'Chef Priya', email: 'kitchen6@rms.local', mobile: '6600000005', role: 'kitchen', isActive: true, parentId: { id: 205, name: 'Tandoor House - Main' }, createdAt: '2026-03-15T11:00:00Z' },
    { id: 29, user_id: 29, name: 'Vikram Cashier', full_name: 'Vikram Cashier', email: 'cashier4@rms.local', mobile: '5500000003', role: 'cashier', isActive: true, parentId: { id: 207, name: 'Green Bowl - Vashi' }, createdAt: '2026-03-01T12:00:00Z' },
    { id: 30, user_id: 30, name: 'Swati Cashier', full_name: 'Swati Cashier', email: 'cashier5@rms.local', mobile: '5500000004', role: 'cashier', isActive: true, parentId: { id: 208, name: 'Burger Nation - Powai' }, createdAt: '2026-03-10T12:00:00Z' },
    { id: 31, user_id: 31, name: 'Rajesh Delivery', full_name: 'Rajesh Delivery', email: 'delivery4@rms.local', mobile: '4400000003', role: 'delivery', isActive: true, parentId: { id: 201, name: 'RMS Central - Main' }, createdAt: '2026-02-25T13:00:00Z' },
    { id: 32, user_id: 32, name: 'Ankur Delivery', full_name: 'Ankur Delivery', email: 'delivery5@rms.local', mobile: '4400000004', role: 'delivery', isActive: true, parentId: { id: 202, name: 'RMS Central - Andheri' }, createdAt: '2026-03-08T13:00:00Z' },
    { id: 33, user_id: 33, name: 'Gopal Delivery', full_name: 'Gopal Delivery', email: 'delivery6@rms.local', mobile: '4400000005', role: 'delivery', isActive: true, parentId: { id: 203, name: 'RMS Express - Bandra' }, createdAt: '2026-03-20T13:00:00Z' },
    { id: 34, user_id: 34, name: 'Sanjay Delivery', full_name: 'Sanjay Delivery', email: 'delivery7@rms.local', mobile: '4400000006', role: 'delivery', isActive: true, parentId: { id: 205, name: 'Tandoor House - Main' }, createdAt: '2026-04-01T13:00:00Z' }
  ],

  branchProfiles: [
    { id: 1, branchId: 201, address: '12 MG Road, Nashik - 422001', phone: '7777777777', alternatePhone: '7000000000', latitude: 20.01, longitude: 73.78, isActive: true },
    { id: 2, branchId: 202, address: '45 Andheri West, Mumbai - 400058', phone: '7777777776', alternatePhone: '7000000001', latitude: 20.02, longitude: 73.79, isActive: true },
    { id: 3, branchId: 203, address: '8 Bandra Hill Road, Mumbai - 400050', phone: '7777777775', alternatePhone: '7000000002', latitude: 20.03, longitude: 73.80, isActive: true },
    { id: 4, branchId: 204, address: '67 Dadar TT Circle, Mumbai - 400014', phone: '7777777774', alternatePhone: '7000000003', latitude: 20.04, longitude: 73.81, isActive: true },
    { id: 5, branchId: 205, address: '22 FC Road, Pune - 411004', phone: '7777777773', alternatePhone: '7000000004', latitude: 18.52, longitude: 73.85, isActive: true },
    { id: 6, branchId: 206, address: '11 Juhu Beach Road, Mumbai - 400049', phone: '7777777772', alternatePhone: '7000000005', latitude: 19.10, longitude: 72.82, isActive: true },
    { id: 7, branchId: 207, address: '5 Koregaon Park, Pune - 411001', phone: '7777777771', alternatePhone: '7000000006', latitude: 18.53, longitude: 73.89, isActive: true },
    { id: 8, branchId: 208, address: '88 Linking Road, Bandra - 400050', phone: '7777777770', alternatePhone: '7000000007', latitude: 19.06, longitude: 72.83, isActive: true }
  ],

  customers: [
    { id: 301, customerName: 'Aman Verma', name: 'Aman Verma', mobile: '9000000000', email: 'aman@example.com', isActive: true, createdAt: '2026-02-01T10:00:00Z' },
    { id: 302, customerName: 'Sara Khan', name: 'Sara Khan', mobile: '9000000001', email: 'sara@example.com', isActive: true, createdAt: '2026-02-05T10:00:00Z' },
    { id: 303, customerName: 'Raj Patel', name: 'Raj Patel', mobile: '9000000002', email: 'raj@example.com', isActive: true, createdAt: '2026-02-10T10:00:00Z' },
    { id: 304, customerName: 'Priya Singh', name: 'Priya Singh', mobile: '9000000003', email: 'priya@example.com', isActive: true, createdAt: '2026-02-15T10:00:00Z' },
    { id: 305, customerName: 'Vikram Kumar', name: 'Vikram Kumar', mobile: '9000000004', email: 'vikram@example.com', isActive: true, createdAt: '2026-02-20T10:00:00Z' },
    { id: 306, customerName: 'Neha Sharma', name: 'Neha Sharma', mobile: '9000000005', email: 'neha@example.com', isActive: true, createdAt: '2026-03-01T10:00:00Z' },
    { id: 307, customerName: 'Arjun Gupta', name: 'Arjun Gupta', mobile: '9000000006', email: 'arjun@example.com', isActive: true, createdAt: '2026-03-05T10:00:00Z' },
    { id: 308, customerName: 'Anjali Rao', name: 'Anjali Rao', mobile: '9000000007', email: 'anjali@example.com', isActive: true, createdAt: '2026-03-10T10:00:00Z' },
    { id: 309, customerName: 'Rohan Desai', name: 'Rohan Desai', mobile: '9000000008', email: 'rohan@example.com', isActive: true, createdAt: '2026-03-15T10:00:00Z' },
    { id: 310, customerName: 'Maya Reddy', name: 'Maya Reddy', mobile: '9000000009', email: 'maya@example.com', isActive: false, createdAt: '2026-03-20T10:00:00Z' },
    { id: 311, customerName: 'Deepak Mehta', name: 'Deepak Mehta', mobile: '9100000010', email: 'deepak@example.com', isActive: true, createdAt: '2026-02-28T14:30:00Z' },
    { id: 312, customerName: 'Sunita Yadav', name: 'Sunita Yadav', mobile: '9100000011', email: 'sunita@example.com', isActive: true, createdAt: '2026-03-05T09:15:00Z' },
    { id: 313, customerName: 'Karan Bhatt', name: 'Karan Bhatt', mobile: '9100000012', email: 'karan@example.com', isActive: true, createdAt: '2026-03-12T16:45:00Z' },
    { id: 314, customerName: 'Pooja Nair', name: 'Pooja Nair', mobile: '9100000013', email: 'pooja@example.com', isActive: true, createdAt: '2026-03-18T11:20:00Z' },
    { id: 315, customerName: 'Manish Tiwari', name: 'Manish Tiwari', mobile: '9100000014', email: 'manish@example.com', isActive: false, createdAt: '2026-02-25T13:00:00Z' },
    { id: 316, customerName: 'Riya Kapoor', name: 'Riya Kapoor', mobile: '9100000015', email: 'riya@example.com', isActive: true, createdAt: '2026-03-22T10:30:00Z' },
    { id: 317, customerName: 'Gaurav Soni', name: 'Gaurav Soni', mobile: '9100000016', email: 'gaurav@example.com', isActive: true, createdAt: '2026-03-25T15:50:00Z' },
    { id: 318, customerName: 'Tanvi Bose', name: 'Tanvi Bose', mobile: '9100000017', email: 'tanvi@example.com', isActive: true, createdAt: '2026-04-01T12:15:00Z' },
    { id: 319, customerName: 'Harsh Malhotra', name: 'Harsh Malhotra', mobile: '9100000018', email: 'harsh@example.com', isActive: true, createdAt: '2026-04-05T08:45:00Z' },
    { id: 320, customerName: 'Simran Kaur', name: 'Simran Kaur', mobile: '9100000019', email: 'simran@example.com', isActive: true, createdAt: '2026-04-08T17:20:00Z' },
    { id: 321, customerName: 'Kabir Rastogi', name: 'Kabir Rastogi', mobile: '9100000020', email: 'kabir@example.com', isActive: false, createdAt: '2026-03-30T14:00:00Z' },
    { id: 322, customerName: 'Zara Shaikh', name: 'Zara Shaikh', mobile: '9100000021', email: 'zara@example.com', isActive: true, createdAt: '2026-04-10T19:30:00Z' },
    { id: 323, customerName: 'Nitin Pawar', name: 'Nitin Pawar', mobile: '9100000022', email: 'nitin@example.com', isActive: true, createdAt: '2026-04-12T11:00:00Z' },
    { id: 324, customerName: 'Divya Krishnan', name: 'Divya Krishnan', mobile: '9100000023', email: 'divya@example.com', isActive: true, createdAt: '2026-04-15T13:45:00Z' },
    { id: 325, customerName: 'Rahul Mishra', name: 'Rahul Mishra', mobile: '9100000024', email: 'rahul@example.com', isActive: true, createdAt: '2026-04-18T09:30:00Z' }
  ],

  customerAddresses: [
    { id: 401, customerId: 301, addressType: 'Home', addressLine1: '21 Mock Residency', addressLine2: 'Near City Mall', landmark: 'Mock Park', latitude: 20.015, longitude: 73.781, isDefault: true },
    { id: 402, customerId: 301, addressType: 'Office', addressLine1: 'Tech Plaza, 2nd Floor', addressLine2: 'Business Bay', landmark: 'Opp. Station', latitude: 20.016, longitude: 73.782, isDefault: false },
    { id: 403, customerId: 302, addressType: 'Home', addressLine1: '45 Oak Street, Apt 12B', addressLine2: 'Near Central Park', landmark: 'Green Building', latitude: 20.020, longitude: 73.785, isDefault: true },
    { id: 404, customerId: 303, addressType: 'Home', addressLine1: '78 Rose Garden', addressLine2: 'Sector 4', landmark: 'Near Hospital', latitude: 20.025, longitude: 73.788, isDefault: true }
  ],

  menuCategories: [
    { id: 501, name: 'Starters', description: 'Appetizers and starters', priority: 1, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=120&h=120&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' }, restaurantId: { id: 101, name: 'RMS Central' } },
    { id: 502, name: 'Chicken', description: 'Chicken specialties', priority: 2, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=120&h=120&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' }, restaurantId: { id: 101, name: 'RMS Central' } },
    { id: 503, name: 'Burgers', description: 'Burgers and wraps', priority: 3, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' }, restaurantId: { id: 101, name: 'RMS Central' } },
    { id: 504, name: 'Indian Mains', description: 'North Indian curries and mains', priority: 1, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=120&h=120&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' }, restaurantId: { id: 101, name: 'RMS Central' } },
    { id: 505, name: 'Biryani', description: 'Dum biryani specials', priority: 2, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&h=120&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' }, restaurantId: { id: 101, name: 'RMS Central' } },
    { id: 506, name: 'Desserts', description: 'Sweet endings', priority: 3, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc5164?w=120&h=120&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' }, restaurantId: { id: 101, name: 'RMS Central' } },
    { id: 507, name: 'Beverages', description: 'Drinks and juices', priority: 4, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=120&h=120&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' }, restaurantId: { id: 101, name: 'RMS Central' } },
    { id: 508, name: 'Combos', description: 'Value meal combos', priority: 5, isActive: true, iconUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' }, restaurantId: { id: 101, name: 'RMS Central' } }
  ],

  menuSubcategories: [
    { id: 601, name: 'Veg Starters', menuCategoryId: { id: 501, name: 'Starters' }, isActive: true },
    { id: 602, name: 'Non-Veg Starters', menuCategoryId: { id: 501, name: 'Starters' }, isActive: true },
    { id: 603, name: 'Fried Chicken', menuCategoryId: { id: 502, name: 'Chicken' }, isActive: true },
    { id: 604, name: 'Grilled Chicken', menuCategoryId: { id: 502, name: 'Chicken' }, isActive: true },
    { id: 605, name: 'Veg Burgers', menuCategoryId: { id: 503, name: 'Burgers' }, isActive: true },
    { id: 606, name: 'Chicken Burgers', menuCategoryId: { id: 503, name: 'Burgers' }, isActive: true },
    { id: 607, name: 'Dal & Curry', menuCategoryId: { id: 504, name: 'Indian Mains' }, isActive: true },
    { id: 608, name: 'Paneer Dishes', menuCategoryId: { id: 504, name: 'Indian Mains' }, isActive: true },
    { id: 609, name: 'Dum Biryani', menuCategoryId: { id: 505, name: 'Biryani' }, isActive: true },
    { id: 610, name: 'Gulab Jamun', menuCategoryId: { id: 506, name: 'Desserts' }, isActive: true }
  ],

  addons: [
    { id: 701, name: 'Extra Cheese', description: 'Add cheese topping', isActive: true, priority: 1, minSelection: 0, maxSelection: 2 },
    { id: 702, name: 'Spice Level', description: 'Choose your spice', isActive: true, priority: 2, minSelection: 1, maxSelection: 1 },
    { id: 703, name: 'Extras', description: 'Add-on items', isActive: true, priority: 3, minSelection: 0, maxSelection: 3 },
    { id: 704, name: 'Drink Upgrade', description: 'Choose your beverage', isActive: true, priority: 4, minSelection: 0, maxSelection: 1 },
    { id: 705, name: 'Bread Choice', description: 'Select bread type', isActive: true, priority: 5, minSelection: 1, maxSelection: 1 }
  ],

  addonItems: [
    { id: 801, addonsId: 701, name: 'Cheese Slice', amount: 20, isActive: true },
    { id: 802, addonsId: 702, name: 'Mild', amount: 0, isActive: true },
    { id: 803, addonsId: 702, name: 'Medium', amount: 0, isActive: true },
    { id: 804, addonsId: 702, name: 'Hot', amount: 10, isActive: true },
    { id: 805, addonsId: 703, name: 'Extra Sauce', amount: 15, isActive: true },
    { id: 806, addonsId: 703, name: 'Coleslaw', amount: 25, isActive: true },
    { id: 807, addonsId: 701, name: 'Double Cheese', amount: 35, isActive: true },
    { id: 808, addonsId: 703, name: 'Crispy Onions', amount: 12, isActive: true },
    { id: 809, addonsId: 703, name: 'Tomato Salsa', amount: 18, isActive: true },
    { id: 810, addonsId: 704, name: 'Coke', amount: 40, isActive: true },
    { id: 811, addonsId: 704, name: 'Sprite', amount: 40, isActive: true },
    { id: 812, addonsId: 704, name: 'Lassi', amount: 50, isActive: true },
    { id: 813, addonsId: 705, name: 'Butter Naan', amount: 0, isActive: true },
    { id: 814, addonsId: 705, name: 'Tandoori Roti', amount: 0, isActive: true },
    { id: 815, addonsId: 705, name: 'Garlic Naan', amount: 10, isActive: true },
    { id: 816, addonsId: 705, name: 'Kulcha', amount: 15, isActive: true },
    { id: 817, addonsId: 703, name: 'Jalapeños', amount: 10, isActive: true },
    { id: 818, addonsId: 701, name: 'Mozzarella Blend', amount: 40, isActive: true }
  ],

  menuItems: [
    { id: 901, name: 'Paneer Tikka', menuCategoryId: { id: 501, name: 'Starters' }, menuSubCategoryId: { id: 601, name: 'Veg Starters' }, addonId: { id: 702, name: 'Spice Level' }, price: 249, offerPrice: 229, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 902, name: 'Chicken Lollipop (6 pcs)', menuCategoryId: { id: 501, name: 'Starters' }, menuSubCategoryId: { id: 602, name: 'Non-Veg Starters' }, addonId: { id: 702, name: 'Spice Level' }, price: 299, offerPrice: 279, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 903, name: 'Crunchy Chicken Bucket', menuCategoryId: { id: 502, name: 'Chicken' }, menuSubCategoryId: { id: 603, name: 'Fried Chicken' }, addonId: { id: 701, name: 'Extra Cheese' }, price: 549, offerPrice: 499, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 904, name: 'Smoky Grill Half Chicken', menuCategoryId: { id: 502, name: 'Chicken' }, menuSubCategoryId: { id: 604, name: 'Grilled Chicken' }, addonId: { id: 702, name: 'Spice Level' }, price: 399, offerPrice: 369, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 35, imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 905, name: 'Paneer Burger', menuCategoryId: { id: 503, name: 'Burgers' }, menuSubCategoryId: { id: 605, name: 'Veg Burgers' }, addonId: null, price: 179, offerPrice: 159, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f8a745a?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 906, name: 'Zinger Burger', menuCategoryId: { id: 503, name: 'Burgers' }, menuSubCategoryId: { id: 606, name: 'Chicken Burgers' }, addonId: { id: 703, name: 'Extras' }, price: 219, offerPrice: 199, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 907, name: 'Dal Makhani', menuCategoryId: { id: 504, name: 'Indian Mains' }, menuSubCategoryId: { id: 607, name: 'Dal & Curry' }, addonId: { id: 702, name: 'Spice Level' }, price: 269, offerPrice: 249, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 908, name: 'Paneer Butter Masala', menuCategoryId: { id: 504, name: 'Indian Mains' }, menuSubCategoryId: { id: 608, name: 'Paneer Dishes' }, addonId: { id: 702, name: 'Spice Level' }, price: 329, offerPrice: 299, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 909, name: 'Butter Chicken', menuCategoryId: { id: 504, name: 'Indian Mains' }, menuSubCategoryId: { id: 607, name: 'Dal & Curry' }, addonId: { id: 702, name: 'Spice Level' }, price: 359, offerPrice: 329, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 910, name: 'Chicken Biryani', menuCategoryId: { id: 505, name: 'Biryani' }, menuSubCategoryId: { id: 609, name: 'Dum Biryani' }, addonId: { id: 702, name: 'Spice Level' }, price: 419, offerPrice: 389, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 35, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 911, name: 'Mutton Biryani', menuCategoryId: { id: 505, name: 'Biryani' }, menuSubCategoryId: { id: 609, name: 'Dum Biryani' }, addonId: { id: 702, name: 'Spice Level' }, price: 469, offerPrice: 449, foodType: 'NON_VEG', isRecommended: false, isActive: true, prepTime: 40, imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 912, name: 'Veg Biryani', menuCategoryId: { id: 505, name: 'Biryani' }, menuSubCategoryId: { id: 609, name: 'Dum Biryani' }, addonId: null, price: 319, offerPrice: 299, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 913, name: 'Gulab Jamun (2 pcs)', menuCategoryId: { id: 506, name: 'Desserts' }, menuSubCategoryId: { id: 610, name: 'Gulab Jamun' }, addonId: null, price: 99, offerPrice: 89, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 914, name: 'Veg Manchurian', menuCategoryId: { id: 501, name: 'Starters' }, menuSubCategoryId: { id: 601, name: 'Veg Starters' }, addonId: { id: 702, name: 'Spice Level' }, price: 199, offerPrice: 179, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 915, name: 'Prawn Tikka', menuCategoryId: { id: 501, name: 'Starters' }, menuSubCategoryId: { id: 602, name: 'Non-Veg Starters' }, addonId: { id: 702, name: 'Spice Level' }, price: 349, offerPrice: 329, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 916, name: 'Hara Bhara Kabab', menuCategoryId: { id: 501, name: 'Starters' }, menuSubCategoryId: { id: 601, name: 'Veg Starters' }, addonId: null, price: 229, offerPrice: 209, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 917, name: 'Chicken Shawarma', menuCategoryId: { id: 502, name: 'Chicken' }, menuSubCategoryId: { id: 604, name: 'Grilled Chicken' }, addonId: { id: 705, name: 'Bread Choice' }, price: 259, offerPrice: 239, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 918, name: 'Peri Peri Chicken Wings', menuCategoryId: { id: 502, name: 'Chicken' }, menuSubCategoryId: { id: 603, name: 'Fried Chicken' }, addonId: { id: 702, name: 'Spice Level' }, price: 329, offerPrice: 299, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 919, name: 'Double Patty Burger', menuCategoryId: { id: 503, name: 'Burgers' }, menuSubCategoryId: { id: 606, name: 'Chicken Burgers' }, addonId: { id: 703, name: 'Extras' }, price: 299, offerPrice: 279, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 20, imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 920, name: 'Crispy Veg Burger', menuCategoryId: { id: 503, name: 'Burgers' }, menuSubCategoryId: { id: 605, name: 'Veg Burgers' }, addonId: { id: 703, name: 'Extras' }, price: 189, offerPrice: 169, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 921, name: 'Shahi Paneer', menuCategoryId: { id: 504, name: 'Indian Mains' }, menuSubCategoryId: { id: 608, name: 'Paneer Dishes' }, addonId: { id: 702, name: 'Spice Level' }, price: 349, offerPrice: 319, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 922, name: 'Chicken Korma', menuCategoryId: { id: 504, name: 'Indian Mains' }, menuSubCategoryId: { id: 607, name: 'Dal & Curry' }, addonId: { id: 702, name: 'Spice Level' }, price: 379, offerPrice: 349, foodType: 'NON_VEG', isRecommended: true, isActive: true, prepTime: 30, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 923, name: 'Rajma Masala', menuCategoryId: { id: 504, name: 'Indian Mains' }, menuSubCategoryId: { id: 607, name: 'Dal & Curry' }, addonId: { id: 702, name: 'Spice Level' }, price: 249, offerPrice: 229, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 25, imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 924, name: 'Rasmalai', menuCategoryId: { id: 506, name: 'Desserts' }, menuSubCategoryId: { id: 610, name: 'Gulab Jamun' }, addonId: null, price: 129, offerPrice: 119, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1571167366136-b57e98c1b83a?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 925, name: 'Chocolate Brownie', menuCategoryId: { id: 506, name: 'Desserts' }, menuSubCategoryId: { id: 610, name: 'Gulab Jamun' }, addonId: null, price: 149, offerPrice: 139, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 926, name: 'Mango Kulfi', menuCategoryId: { id: 506, name: 'Desserts' }, menuSubCategoryId: { id: 610, name: 'Gulab Jamun' }, addonId: null, price: 99, offerPrice: 89, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 927, name: 'Mango Lassi', menuCategoryId: { id: 507, name: 'Beverages' }, menuSubCategoryId: null, addonId: null, price: 119, offerPrice: 109, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1622623174581-26b8ea85bd7d?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 928, name: 'Cold Coffee', menuCategoryId: { id: 507, name: 'Beverages' }, menuSubCategoryId: null, addonId: null, price: 99, offerPrice: 89, foodType: 'VEG', isRecommended: true, isActive: true, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 929, name: 'Fresh Lime Soda', menuCategoryId: { id: 507, name: 'Beverages' }, menuSubCategoryId: null, addonId: null, price: 79, offerPrice: 69, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 930, name: 'Masala Chai', menuCategoryId: { id: 507, name: 'Beverages' }, menuSubCategoryId: null, addonId: null, price: 49, offerPrice: 45, foodType: 'VEG', isRecommended: false, isActive: true, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 931, name: 'Rose Sharbat', menuCategoryId: { id: 507, name: 'Beverages' }, menuSubCategoryId: null, addonId: null, price: 69, offerPrice: 59, foodType: 'VEG', isRecommended: false, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 932, name: 'Chicken Combo Meal', menuCategoryId: { id: 508, name: 'Combos' }, menuSubCategoryId: null, addonId: { id: 704, name: 'Drink Upgrade' }, price: 549, offerPrice: 499, foodType: 'NON_VEG', isRecommended: true, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 933, name: 'Family Biryani Pack', menuCategoryId: { id: 508, name: 'Combos' }, menuSubCategoryId: null, addonId: null, price: 999, offerPrice: 899, foodType: 'NON_VEG', isRecommended: true, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1633945274417-e81e5b71e9e9?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } },
    { id: 934, name: 'Veg Thali', menuCategoryId: { id: 508, name: 'Combos' }, menuSubCategoryId: null, addonId: null, price: 399, offerPrice: 359, foodType: 'VEG', isRecommended: true, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&auto=format', branchId: { id: 201, name: 'RMS Central - Main' } },
    { id: 935, name: 'Student Combo', menuCategoryId: { id: 508, name: 'Combos' }, menuSubCategoryId: null, addonId: null, price: 299, offerPrice: 269, foodType: 'VEG', isRecommended: false, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&auto=format', branchId: { id: 202, name: 'RMS Central - Andheri' } }
  ],

  diningTables: [
    { id: 1001, name: 'T1', tableNumber: 'T1', sectionId: { id: 1101, name: 'Ground Floor' }, capacity: 2, isActive: true },
    { id: 1002, name: 'T2', tableNumber: 'T2', sectionId: { id: 1101, name: 'Ground Floor' }, capacity: 4, isActive: true },
    { id: 1003, name: 'T3', tableNumber: 'T3', sectionId: { id: 1101, name: 'Ground Floor' }, capacity: 4, isActive: true },
    { id: 1004, name: 'T4', tableNumber: 'T4', sectionId: { id: 1101, name: 'Ground Floor' }, capacity: 6, isActive: true },
    { id: 1005, name: 'F1', tableNumber: 'F1', sectionId: { id: 1102, name: 'Family Zone' }, capacity: 8, isActive: true },
    { id: 1006, name: 'F2', tableNumber: 'F2', sectionId: { id: 1102, name: 'Family Zone' }, capacity: 10, isActive: true },
    { id: 1007, name: 'R1', tableNumber: 'R1', sectionId: { id: 1103, name: 'Rooftop' }, capacity: 4, isActive: true },
    { id: 1008, name: 'R2', tableNumber: 'R2', sectionId: { id: 1103, name: 'Rooftop' }, capacity: 4, isActive: false }
  ],

  sections: [
    { id: 1101, name: 'Ground Floor', priority: 1, isActive: true },
    { id: 1102, name: 'Family Zone', priority: 2, isActive: true },
    { id: 1103, name: 'Rooftop', priority: 3, isActive: true }
  ],

  deliveryZones: [
    { id: 1201, areaName: 'City Center (0-3 km)', minKm: 0, maxKm: 3, charge: 20, isActive: true },
    { id: 1202, areaName: 'Near Zone (3-6 km)', minKm: 3, maxKm: 6, charge: 40, isActive: true },
    { id: 1203, areaName: 'Mid Zone (6-10 km)', minKm: 6, maxKm: 10, charge: 60, isActive: true },
    { id: 1204, areaName: 'Far Zone (10-15 km)', minKm: 10, maxKm: 15, charge: 90, isActive: true }
  ],

  restaurantHours: [
    { id: 1301, restaurantId: { id: 101 }, branchId: { id: 201 }, dayOfWeek: 'monday', openingTime: '10:00', closingTime: '23:00', isClosed: false },
    { id: 1302, restaurantId: { id: 101 }, branchId: { id: 201 }, dayOfWeek: 'tuesday', openingTime: '10:00', closingTime: '23:00', isClosed: false },
    { id: 1303, restaurantId: { id: 101 }, branchId: { id: 201 }, dayOfWeek: 'wednesday', openingTime: '10:00', closingTime: '23:00', isClosed: false },
    { id: 1304, restaurantId: { id: 101 }, branchId: { id: 201 }, dayOfWeek: 'thursday', openingTime: '10:00', closingTime: '23:00', isClosed: false },
    { id: 1305, restaurantId: { id: 101 }, branchId: { id: 201 }, dayOfWeek: 'friday', openingTime: '10:00', closingTime: '23:59', isClosed: false },
    { id: 1306, restaurantId: { id: 101 }, branchId: { id: 201 }, dayOfWeek: 'saturday', openingTime: '09:00', closingTime: '01:00', isClosed: false },
    { id: 1307, restaurantId: { id: 101 }, branchId: { id: 201 }, dayOfWeek: 'sunday', openingTime: '11:00', closingTime: '23:00', isClosed: false },
    { id: 1308, restaurantId: { id: 103 }, branchId: { id: 204 }, dayOfWeek: 'monday', openingTime: '09:00', closingTime: '22:00', isClosed: false },
    { id: 1309, restaurantId: { id: 105 }, branchId: { id: 205 }, specialDate: '2026-12-25', openingTime: '00:00', closingTime: '00:00', isClosed: true }
  ],

  paymentGateways: [
    { id: 1401, name: 'Cash On Delivery', title: 'Cash On Delivery', gatewayName: 'COD', paymentMethod: 'COD', isActive: true, charges: 0 },
    { id: 1402, name: 'Online Payment', title: 'Online Payment', gatewayName: 'PG', paymentMethod: 'PG', isActive: true, charges: 0 }
  ],

  coupons: [
    { id: 1501, code: 'WELCOME50', name: 'Welcome Offer', description: 'Flat $50 off on first order', discountType: 'FLAT', discountValue: 50, minOrderValue: 299, maxUses: 1000, usedCount: 342, isActive: true, expiryDate: '2026-12-31' },
    { id: 1502, code: 'SAVE10', name: '10% Off', description: '10% discount on all orders', discountType: 'PERCENT', discountValue: 10, minOrderValue: 199, maxUses: 500, usedCount: 187, isActive: true, expiryDate: '2026-06-30' },
    { id: 1503, code: 'BIGSAVE200', name: 'Big Saver', description: 'Flat $200 off on orders above $999', discountType: 'FLAT', discountValue: 200, minOrderValue: 999, maxUses: 200, usedCount: 89, isActive: true, expiryDate: '2026-05-31' },
    { id: 1504, code: 'WEEKEND20', name: 'Weekend Special', description: '20% off on weekends', discountType: 'PERCENT', discountValue: 20, minOrderValue: 399, maxUses: 300, usedCount: 145, isActive: true, expiryDate: '2026-08-31' },
    { id: 1505, code: 'NEWBRANCH', name: 'New Branch Launch', description: 'Flat $100 off — new branch promo', discountType: 'FLAT', discountValue: 100, minOrderValue: 499, maxUses: 500, usedCount: 23, isActive: true, expiryDate: '2026-04-30' },
    { id: 1506, code: 'OLDOFFER', name: 'Expired Offer', description: 'Old promo code', discountType: 'FLAT', discountValue: 75, minOrderValue: 299, maxUses: 100, usedCount: 100, isActive: false, expiryDate: '2026-02-28' }
  ],

  sliders: [
    { id: 1601, title: '🍗 Free Delivery on First Order', description: 'Order above $299 and get FREE delivery. Use code: FIRST50', imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', isActive: true },
    { id: 1602, title: '🍛 Weekend Biryani Bonanza', description: '20% OFF on all Biryani combos — use code WEEKEND20 at checkout!', imageUrl: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', isActive: true },
    { id: 1603, title: '🔥 New Spicy Menu is Here!', description: 'Try our new Peri Peri Wings, Zinger Burgers & more — exclusively at RMS!', imageUrl: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', isActive: true }
  ],

  bankDetails: [
    { id: 1701, bankName: 'State Bank of India', accountHolderName: 'RMS Central Pvt Ltd', accountNumber: '1234567890', ifscCode: 'SBIN0001234', branchName: 'Nashik Main Branch', isActive: true }
  ],

  walletTopups: [
    { id: 1801, amount: 5000, status: 'PENDING', requestedBy: 'RMS Central', createdAt: '2026-04-18T09:00:00Z' },
    { id: 1802, amount: 2000, status: 'APPROVED', requestedBy: 'Spice Garden', approvedAt: '2026-04-15T11:00:00Z', createdAt: '2026-04-14T09:00:00Z' },
    { id: 1803, amount: 10000, status: 'APPROVED', requestedBy: 'RMS Express', approvedAt: '2026-04-10T14:00:00Z', createdAt: '2026-04-09T09:00:00Z' },
    { id: 1804, amount: 3000, status: 'REJECTED', requestedBy: 'Pizza Hub', rejectedReason: 'Insufficient documents', createdAt: '2026-04-05T09:00:00Z' },
    { id: 1805, amount: 7500, status: 'PENDING', requestedBy: 'Tandoor House', createdAt: '2026-04-19T14:30:00Z' },
    { id: 1806, amount: 15000, status: 'APPROVED', requestedBy: 'The Biryani Box', approvedAt: '2026-04-17T10:45:00Z', createdAt: '2026-04-16T08:00:00Z' },
    { id: 1807, amount: 4500, status: 'APPROVED', requestedBy: 'Green Bowl', approvedAt: '2026-04-13T16:20:00Z', createdAt: '2026-04-12T09:30:00Z' },
    { id: 1808, amount: 8000, status: 'REJECTED', requestedBy: 'Burger Nation', rejectedReason: 'Pending compliance verification', createdAt: '2026-04-08T11:15:00Z' },
    { id: 1809, amount: 20000, status: 'APPROVED', requestedBy: 'The Desi Kitchen', approvedAt: '2026-04-12T13:00:00Z', createdAt: '2026-04-11T09:00:00Z' },
    { id: 1810, amount: 1500, status: 'PENDING', requestedBy: 'Chai & Snacks', createdAt: '2026-04-20T10:45:00Z' },
    { id: 1811, amount: 6000, status: 'APPROVED', requestedBy: 'RMS Central', approvedAt: '2026-04-14T15:30:00Z', createdAt: '2026-04-13T08:00:00Z' },
    { id: 1812, amount: 12000, status: 'APPROVED', requestedBy: 'Spice Garden', approvedAt: '2026-04-11T12:00:00Z', createdAt: '2026-04-10T10:00:00Z' }
  ],

  outstanding: [
    { id: 1901, customerName: 'Aman Verma', mobile: '9000000000', amount: 240, isActive: true },
    { id: 1902, customerName: 'Sara Khan', mobile: '9000000001', amount: 480, isActive: true },
    { id: 1903, customerName: 'Raj Patel', mobile: '9000000002', amount: 150, isActive: true },
    { id: 1904, customerName: 'Ramu Delivery', mobile: '4444444444', amount: 320, isActive: true },
    { id: 1905, customerName: 'Shyam Delivery', mobile: '4400000001', amount: 580, isActive: true },
    { id: 1906, customerName: 'Kiran Delivery', mobile: '4400000002', amount: 195, isActive: false },
    { id: 1907, customerName: 'Rajesh Delivery', mobile: '4400000003', amount: 420, isActive: true },
    { id: 1908, customerName: 'Ankur Delivery', mobile: '4400000004', amount: 750, isActive: true },
    { id: 1909, customerName: 'Gopal Delivery', mobile: '4400000005', amount: 280, isActive: false },
    { id: 1910, customerName: 'Sanjay Delivery', mobile: '4400000006', amount: 520, isActive: true }
  ],

  orders: [
    { id: 2001, orderNumber: 'ORD-2001', customerName: 'Aman Verma', customerPhone: '9000000000', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 499, payableAmount: 499, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: '21 Mock Residency, Near City Mall', createdAt: '2026-04-20T10:30:00Z', orderItems: [{ id: 1, menuItemName: 'Crunchy Chicken Bucket', quantity: 1, price: 499 }] },
    { id: 2002, orderNumber: 'ORD-2002', customerName: 'Sara Khan', customerPhone: '9000000001', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 369, payableAmount: 369, branchId: 201, branchName: 'RMS Central - Main', tableNumber: 'T1', createdAt: '2026-04-20T11:00:00Z', orderItems: [{ id: 2, menuItemName: 'Smoky Grill Half Chicken', quantity: 1, price: 369 }] },
    { id: 2003, orderNumber: 'ORD-2003', customerName: 'Raj Patel', customerPhone: '9000000002', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 608, payableAmount: 608, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: '78 Rose Garden, Sector 4', createdAt: '2026-04-19T18:10:00Z', orderItems: [{ id: 3, menuItemName: 'Chicken Biryani', quantity: 1, price: 389 }, { id: 4, menuItemName: 'Paneer Tikka', quantity: 1, price: 229 }] },
    { id: 2004, orderNumber: 'ORD-2004', customerName: 'Priya Singh', customerPhone: '9000000003', status: 'PENDING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 329, payableAmount: 329, branchId: 201, branchName: 'RMS Central - Main', tableNumber: 'T3', createdAt: '2026-04-20T10:15:00Z', orderItems: [{ id: 5, menuItemName: 'Butter Chicken', quantity: 1, price: 329 }] },
    { id: 2005, orderNumber: 'ORD-2005', customerName: 'Vikram Kumar', customerPhone: '9000000004', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 758, payableAmount: 758, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: 'Tech Plaza, Business Bay', createdAt: '2026-04-20T10:45:00Z', orderItems: [{ id: 6, menuItemName: 'Mutton Biryani', quantity: 1, price: 449 }, { id: 7, menuItemName: 'Dal Makhani', quantity: 1, price: 249 }, { id: 8, menuItemName: 'Gulab Jamun (2 pcs)', quantity: 1, price: 89 }] },
    { id: 2006, orderNumber: 'ORD-2006', customerName: 'Neha Sharma', customerPhone: '9000000005', status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 557, payableAmount: 507, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: '45 Oak Street', createdAt: '2026-04-19T12:00:00Z', orderItems: [{ id: 9, menuItemName: 'Crunchy Chicken Bucket', quantity: 1, price: 499 }, { id: 10, menuItemName: 'Gulab Jamun (2 pcs)', quantity: 1, price: 89 }] },
    { id: 2007, orderNumber: 'ORD-2007', customerName: 'Arjun Gupta', customerPhone: '9000000006', status: 'CANCELLED', paymentStatus: 'REFUNDED', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 389, payableAmount: 0, branchId: 202, branchName: 'RMS Central - Andheri', tableNumber: 'T2', createdAt: '2026-04-19T19:30:00Z', orderItems: [{ id: 11, menuItemName: 'Chicken Biryani', quantity: 1, price: 389 }] },
    { id: 2008, orderNumber: 'ORD-2008', customerName: 'Anjali Rao', customerPhone: '9000000007', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 658, payableAmount: 608, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: '21 Mock Residency', createdAt: '2026-04-20T14:15:00Z', orderItems: [{ id: 12, menuItemName: 'Smoky Grill Half Chicken', quantity: 2, price: 738 }] },
    { id: 2009, orderNumber: 'ORD-2009', customerName: 'Rohan Desai', customerPhone: '9000000008', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 448, payableAmount: 448, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: '45 Oak Street', createdAt: '2026-04-18T15:45:00Z', orderItems: [{ id: 13, menuItemName: 'Veg Biryani', quantity: 1, price: 299 }, { id: 14, menuItemName: 'Paneer Tikka', quantity: 1, price: 229 }] },
    { id: 2010, orderNumber: 'ORD-2010', customerName: 'Aman Verma', customerPhone: '9000000000', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 298, payableAmount: 298, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: '21 Mock Residency', createdAt: '2026-04-20T16:00:00Z', orderItems: [{ id: 15, menuItemName: 'Zinger Burger', quantity: 1, price: 199 }, { id: 16, menuItemName: 'Paneer Burger', quantity: 1, price: 159 }] },
    { id: 2011, orderNumber: 'ORD-2011', customerName: 'Sara Khan', customerPhone: '9000000001', status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 798, payableAmount: 748, branchId: 201, branchName: 'RMS Central - Main', tableNumber: 'F1', createdAt: '2026-04-17T13:20:00Z', orderItems: [{ id: 17, menuItemName: 'Crunchy Chicken Bucket', quantity: 1, price: 499 }, { id: 18, menuItemName: 'Dal Makhani', quantity: 1, price: 249 }, { id: 19, menuItemName: 'Gulab Jamun (2 pcs)', quantity: 1, price: 89 }] },
    { id: 2012, orderNumber: 'ORD-2012', customerName: 'Priya Singh', customerPhone: '9000000003', status: 'PENDING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 499, payableAmount: 499, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: 'Tech Plaza, Business Bay', createdAt: '2026-04-20T17:00:00Z', orderItems: [{ id: 20, menuItemName: 'Mutton Biryani', quantity: 1, price: 449 }, { id: 21, menuItemName: 'Gulab Jamun (2 pcs)', quantity: 1, price: 89 }] },
    { id: 2013, orderNumber: 'ORD-2013', customerName: 'Vikram Kumar', customerPhone: '9000000004', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 648, payableAmount: 598, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: 'Tech Plaza', createdAt: '2026-04-20T17:30:00Z', orderItems: [{ id: 22, menuItemName: 'Crunchy Chicken Bucket', quantity: 1, price: 499 }, { id: 23, menuItemName: 'Chicken Lollipop (6 pcs)', quantity: 1, price: 279 }] },
    { id: 2014, orderNumber: 'ORD-2014', customerName: 'Neha Sharma', customerPhone: '9000000005', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 389, payableAmount: 389, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: '45 Oak Street', createdAt: '2026-04-16T10:00:00Z', orderItems: [{ id: 24, menuItemName: 'Chicken Biryani', quantity: 1, price: 389 }] },
    { id: 2015, orderNumber: 'ORD-2015', customerName: 'Arjun Gupta', customerPhone: '9000000006', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'TAKEAWAY', totalAmount: 369, payableAmount: 369, branchId: 201, branchName: 'RMS Central - Main', createdAt: '2026-04-20T18:00:00Z', orderItems: [{ id: 25, menuItemName: 'Smoky Grill Half Chicken', quantity: 1, price: 369 }] },
    { id: 2016, orderNumber: 'ORD-2016', customerName: 'Anjali Rao', customerPhone: '9000000007', status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 628, payableAmount: 578, branchId: 202, branchName: 'RMS Central - Andheri', tableNumber: 'R1', createdAt: '2026-04-15T20:00:00Z', orderItems: [{ id: 26, menuItemName: 'Paneer Butter Masala', quantity: 1, price: 299 }, { id: 27, menuItemName: 'Veg Biryani', quantity: 1, price: 299 }, { id: 28, menuItemName: 'Gulab Jamun (2 pcs)', quantity: 1, price: 89 }] },
    { id: 2017, orderNumber: 'ORD-2017', customerName: 'Rohan Desai', customerPhone: '9000000008', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 229, payableAmount: 229, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: '78 Rose Garden', createdAt: '2026-04-20T18:15:00Z', orderItems: [{ id: 29, menuItemName: 'Paneer Tikka', quantity: 1, price: 229 }] },
    { id: 2018, orderNumber: 'ORD-2018', customerName: 'Maya Reddy', customerPhone: '9000000009', status: 'CANCELLED', paymentStatus: 'REFUNDED', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 499, payableAmount: 0, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: '21 Mock Residency', createdAt: '2026-04-18T19:00:00Z', orderItems: [{ id: 30, menuItemName: 'Crunchy Chicken Bucket', quantity: 1, price: 499 }] },
    { id: 2019, orderNumber: 'ORD-2019', customerName: 'Aman Verma', customerPhone: '9000000000', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 849, payableAmount: 799, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: '21 Mock Residency', createdAt: '2026-04-14T12:00:00Z', orderItems: [{ id: 31, menuItemName: 'Mutton Biryani', quantity: 1, price: 449 }, { id: 32, menuItemName: 'Butter Chicken', quantity: 1, price: 329 }, { id: 33, menuItemName: 'Gulab Jamun (2 pcs)', quantity: 1, price: 89 }] },
    { id: 2020, orderNumber: 'ORD-2020', customerName: 'Sara Khan', customerPhone: '9000000001', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 559, payableAmount: 509, branchId: 201, branchName: 'RMS Central - Main', tableNumber: 'T4', createdAt: '2026-04-20T18:45:00Z', orderItems: [{ id: 34, menuItemName: 'Crunchy Chicken Bucket', quantity: 1, price: 499 }, { id: 35, menuItemName: 'Paneer Tikka', quantity: 1, price: 229 }] },
    { id: 2021, orderNumber: 'ORD-2021', customerName: 'Deepak Mehta', customerPhone: '9100000010', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 398, payableAmount: 398, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: 'Mock Street, Area 5', createdAt: '2026-04-20T08:30:00Z', orderItems: [{ id: 36, menuItemName: 'Chicken Shawarma', quantity: 1, price: 239 }, { id: 37, menuItemName: 'Mango Lassi', quantity: 1, price: 109 }] },
    { id: 2022, orderNumber: 'ORD-2022', customerName: 'Sunita Yadav', customerPhone: '9100000011', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 648, payableAmount: 598, branchId: 202, branchName: 'RMS Central - Andheri', tableNumber: 'F1', createdAt: '2026-04-20T12:00:00Z', orderItems: [{ id: 38, menuItemName: 'Paneer Butter Masala', quantity: 1, price: 299 }, { id: 39, menuItemName: 'Cold Coffee', quantity: 1, price: 89 }, { id: 40, menuItemName: 'Garlic Naan', quantity: 1, price: 10 }] },
    { id: 2023, orderNumber: 'ORD-2023', customerName: 'Karan Bhatt', customerPhone: '9100000012', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 1898, payableAmount: 1798, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: 'Tech Park, Sector 2', createdAt: '2026-04-19T15:20:00Z', orderItems: [{ id: 41, menuItemName: 'Family Biryani Pack', quantity: 1, price: 899 }, { id: 42, menuItemName: 'Gulab Jamun (2 pcs)', quantity: 2, price: 178 }, { id: 43, menuItemName: 'Fresh Lime Soda', quantity: 1, price: 69 }] },
    { id: 2024, orderNumber: 'ORD-2024', customerName: 'Pooja Nair', customerPhone: '9100000013', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Card', orderType: 'DINE_IN', totalAmount: 1098, payableAmount: 1048, branchId: 201, branchName: 'RMS Central - Main', tableNumber: 'F2', createdAt: '2026-04-17T19:30:00Z', orderItems: [{ id: 44, menuItemName: 'Chicken Combo Meal', quantity: 1, price: 499 }, { id: 45, menuItemName: 'Veg Thali', quantity: 1, price: 359 }, { id: 46, menuItemName: 'Rasmalai', quantity: 2, price: 238 }] },
    { id: 2025, orderNumber: 'ORD-2025', customerName: 'Manish Tiwari', customerPhone: '9100000014', status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'TAKEAWAY', totalAmount: 479, payableAmount: 429, branchId: 201, branchName: 'RMS Central - Main', createdAt: '2026-04-16T11:45:00Z', orderItems: [{ id: 47, menuItemName: 'Double Patty Burger', quantity: 1, price: 279 }, { id: 48, menuItemName: 'Mango Lassi', quantity: 1, price: 109 }, { id: 49, menuItemName: 'Crispy Veg Burger', quantity: 1, price: 169 }] },
    { id: 2026, orderNumber: 'ORD-2026', customerName: 'Riya Kapoor', customerPhone: '9100000015', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 598, payableAmount: 548, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: 'Rose Garden, Apt 5', createdAt: '2026-04-20T13:15:00Z', orderItems: [{ id: 50, menuItemName: 'Peri Peri Chicken Wings', quantity: 1, price: 299 }, { id: 51, menuItemName: 'Fresh Lime Soda', quantity: 1, price: 69 }, { id: 52, menuItemName: 'Butter Naan', quantity: 1, price: 0 }] },
    { id: 2027, orderNumber: 'ORD-2027', customerName: 'Gaurav Soni', customerPhone: '9100000016', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 449, payableAmount: 449, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: 'Business Center, Road 3', createdAt: '2026-04-20T10:20:00Z', orderItems: [{ id: 53, menuItemName: 'Shahi Paneer', quantity: 1, price: 319 }, { id: 54, menuItemName: 'Masala Chai', quantity: 1, price: 45 }, { id: 55, menuItemName: 'Tandoori Roti', quantity: 1, price: 0 }] },
    { id: 2028, orderNumber: 'ORD-2028', customerName: 'Tanvi Bose', customerPhone: '9100000017', status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 729, payableAmount: 679, branchId: 201, branchName: 'RMS Central - Main', tableNumber: 'R1', createdAt: '2026-04-15T20:45:00Z', orderItems: [{ id: 56, menuItemName: 'Veg Manchurian', quantity: 1, price: 179 }, { id: 57, menuItemName: 'Student Combo', quantity: 1, price: 269 }, { id: 58, menuItemName: 'Chocolate Brownie', quantity: 2, price: 278 }] },
    { id: 2029, orderNumber: 'ORD-2029', customerName: 'Harsh Malhotra', customerPhone: '9100000018', status: 'CANCELLED', paymentStatus: 'REFUNDED', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 399, payableAmount: 0, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: 'Tech Plaza, Wing A', createdAt: '2026-04-18T17:00:00Z', orderItems: [{ id: 59, menuItemName: 'Hara Bhara Kabab', quantity: 2, price: 418 }] },
    { id: 2030, orderNumber: 'ORD-2030', customerName: 'Simran Kaur', customerPhone: '9100000019', status: 'PENDING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'TAKEAWAY', totalAmount: 748, payableAmount: 748, branchId: 202, branchName: 'RMS Central - Andheri', createdAt: '2026-04-20T16:30:00Z', orderItems: [{ id: 60, menuItemName: 'Chicken Korma', quantity: 1, price: 349 }, { id: 61, menuItemName: 'Rajma Masala', quantity: 1, price: 229 }, { id: 62, menuItemName: 'Rose Sharbat', quantity: 2, price: 118 }] },
    { id: 2031, orderNumber: 'ORD-2031', customerName: 'Kabir Rastogi', customerPhone: '9100000020', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 698, payableAmount: 648, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: 'Market Square, Shop 12', createdAt: '2026-04-19T09:50:00Z', orderItems: [{ id: 63, menuItemName: 'Prawn Tikka', quantity: 1, price: 329 }, { id: 64, menuItemName: 'Mango Kulfi', quantity: 2, price: 178 }, { id: 65, menuItemName: 'Cold Coffee', quantity: 1, price: 89 }] },
    { id: 2032, orderNumber: 'ORD-2032', customerName: 'Zara Shaikh', customerPhone: '9100000021', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 549, payableAmount: 549, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: 'Park Street, Apt 8B', createdAt: '2026-04-20T14:00:00Z', orderItems: [{ id: 66, menuItemName: 'Chicken Combo Meal', quantity: 1, price: 499 }, { id: 67, menuItemName: 'Mango Lassi', quantity: 1, price: 109 }] },
    { id: 2033, orderNumber: 'ORD-2033', customerName: 'Nitin Pawar', customerPhone: '9100000022', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Card', orderType: 'DINE_IN', totalAmount: 988, payableAmount: 938, branchId: 202, branchName: 'RMS Central - Andheri', tableNumber: 'T2', createdAt: '2026-04-20T11:30:00Z', orderItems: [{ id: 68, menuItemName: 'Family Biryani Pack', quantity: 1, price: 899 }, { id: 69, menuItemName: 'Paneer Tikka', quantity: 1, price: 229 }] },
    { id: 2034, orderNumber: 'ORD-2034', customerName: 'Divya Krishnan', customerPhone: '9100000023', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 398, payableAmount: 348, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: 'Sector 7, New Colony', createdAt: '2026-04-19T13:45:00Z', orderItems: [{ id: 70, menuItemName: 'Veg Thali', quantity: 1, price: 359 }, { id: 71, menuItemName: 'Masala Chai', quantity: 1, price: 45 }] },
    { id: 2035, orderNumber: 'ORD-2035', customerName: 'Rahul Mishra', customerPhone: '9100000024', status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'TAKEAWAY', totalAmount: 878, payableAmount: 828, branchId: 201, branchName: 'RMS Central - Main', createdAt: '2026-04-14T18:20:00Z', orderItems: [{ id: 72, menuItemName: 'Double Patty Burger', quantity: 2, price: 558 }, { id: 73, menuItemName: 'Fresh Lime Soda', quantity: 1, price: 69 }, { id: 74, menuItemName: 'Garlic Naan', quantity: 2, price: 20 }] },
    { id: 2036, orderNumber: 'ORD-2036', customerName: 'Sara Khan', customerPhone: '9000000001', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'COD', orderType: 'DELIVERY', totalAmount: 628, payableAmount: 628, branchId: 201, branchName: 'RMS Central - Main', deliveryAddress: '45 Oak Street', createdAt: '2026-04-20T15:10:00Z', orderItems: [{ id: 75, menuItemName: 'Peri Peri Chicken Wings', quantity: 1, price: 299 }, { id: 76, menuItemName: 'Veg Thali', quantity: 1, price: 359 }] },
    { id: 2037, orderNumber: 'ORD-2037', customerName: 'Raj Patel', customerPhone: '9000000002', status: 'PREPARING', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DINE_IN', totalAmount: 778, payableAmount: 728, branchId: 202, branchName: 'RMS Central - Andheri', tableNumber: 'T1', createdAt: '2026-04-20T17:45:00Z', orderItems: [{ id: 77, menuItemName: 'Chicken Korma', quantity: 1, price: 349 }, { id: 78, menuItemName: 'Chocolate Brownie', quantity: 2, price: 278 }, { id: 79, menuItemName: 'Kulcha', quantity: 1, price: 15 }] },
    { id: 2038, orderNumber: 'ORD-2038', customerName: 'Priya Singh', customerPhone: '9000000003', status: 'CANCELLED', paymentStatus: 'REFUNDED', paymentMethod: 'Online', orderType: 'TAKEAWAY', totalAmount: 359, payableAmount: 0, branchId: 201, branchName: 'RMS Central - Main', createdAt: '2026-04-17T16:00:00Z', orderItems: [{ id: 80, menuItemName: 'Veg Thali', quantity: 1, price: 359 }] },
    { id: 2039, orderNumber: 'ORD-2039', customerName: 'Vikram Kumar', customerPhone: '9000000004', status: 'COMPLETED', paymentStatus: 'PAID', paymentMethod: 'Online', orderType: 'DELIVERY', totalAmount: 1048, payableAmount: 998, branchId: 202, branchName: 'RMS Central - Andheri', deliveryAddress: 'Tech Plaza, Business Bay', createdAt: '2026-04-13T10:15:00Z', orderItems: [{ id: 81, menuItemName: 'Family Biryani Pack', quantity: 1, price: 899 }, { id: 82, menuItemName: 'Mango Kulfi', quantity: 1, price: 89 }, { id: 83, menuItemName: 'Rose Sharbat', quantity: 1, price: 59 }] },
    { id: 2040, orderNumber: 'ORD-2040', customerName: 'Neha Sharma', customerPhone: '9000000005', status: 'DELIVERED', paymentStatus: 'PAID', paymentMethod: 'Card', orderType: 'DINE_IN', totalAmount: 848, payableAmount: 798, branchId: 201, branchName: 'RMS Central - Main', tableNumber: 'F2', createdAt: '2026-04-12T20:30:00Z', orderItems: [{ id: 84, menuItemName: 'Chicken Combo Meal', quantity: 1, price: 499 }, { id: 85, menuItemName: 'Hara Bhara Kabab', quantity: 1, price: 209 }, { id: 86, menuItemName: 'Rasmalai', quantity: 2, price: 238 }] }
  ],

  // Subscription plans — format matches SubscriptionPlans.jsx expectations
  // Each item: { plan: { planId, planName, description, price, durationDays, maxBranch, maxKitchen, maxDeliveryBoy, features, isActive, sortOrder }, active_subscribers }
  subscriptionPlans: [
    {
      plan: {
        planId: 1,
        planName: 'Starter',
        description: 'Perfect for small restaurants getting started with digital ordering',
        price: 999,
        durationDays: 30,
        maxBranch: 1,
        maxKitchen: 1,
        maxDeliveryBoy: 2,
        features: '["Order Management", "Menu Management", "Customer App", "Basic Reports"]',
        isActive: true,
        sortOrder: 1
      },
      active_subscribers: 14
    },
    {
      plan: {
        planId: 2,
        planName: 'Basic',
        description: 'Ideal for growing restaurants needing more staff and delivery',
        price: 1999,
        durationDays: 90,
        maxBranch: 2,
        maxKitchen: 2,
        maxDeliveryBoy: 5,
        features: '["Order Management", "Menu Management", "Customer App", "Advanced Reports", "Delivery Zones", "Coupons"]',
        isActive: true,
        sortOrder: 2
      },
      active_subscribers: 26
    },
    {
      plan: {
        planId: 3,
        planName: 'Standard',
        description: 'For established restaurants with multiple branches',
        price: 4999,
        durationDays: 180,
        maxBranch: 5,
        maxKitchen: 3,
        maxDeliveryBoy: 15,
        features: '["All Basic Features", "Multiple Branches", "Kitchen Display System", "Loyalty Program", "Payment Gateway", "Priority Support"]',
        isActive: true,
        sortOrder: 3
      },
      active_subscribers: 19
    },
    {
      plan: {
        planId: 4,
        planName: 'Premium',
        description: 'Advanced features for restaurant chains and franchises',
        price: 9999,
        durationDays: 365,
        maxBranch: 15,
        maxKitchen: 8,
        maxDeliveryBoy: 40,
        features: '["All Standard Features", "Custom Branding", "API Access", "Analytics Dashboard", "Bulk Menu Update", "Dedicated Support"]',
        isActive: true,
        sortOrder: 4
      },
      active_subscribers: 8
    },
    {
      plan: {
        planId: 5,
        planName: 'Enterprise',
        description: 'Unlimited everything for large chains and enterprises',
        price: 24999,
        durationDays: 365,
        maxBranch: null,
        maxKitchen: null,
        maxDeliveryBoy: null,
        features: '["Unlimited Branches", "White Label App", "Custom Integrations", "Dedicated Account Manager", "24x7 SLA Support", "Custom Reports"]',
        isActive: true,
        sortOrder: 5
      },
      active_subscribers: 3
    }
  ],

  // Subscriptions — format matches Subscriptions.jsx expectations
  // Fields: subscriptionId, user { id, name, hospitalName, email }, plan { planId, planName }, startDate, endDate, graceEndDate, amountPaid, discountAmount, status, paymentReference
  // status values: active, expired, cancelled, suspended, grace, pending
  subscriptions: [
    {
      subscriptionId: 3001,
      user: { id: 2, name: 'Rajesh Kumar', hospitalName: 'RMS Central', email: 'central@rms.local' },
      plan: { planId: 3, planName: 'Standard' },
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      graceEndDate: null,
      amountPaid: 4999,
      discountAmount: 0,
      status: 'active',
      paymentReference: 'PAY-2026-001'
    },
    {
      subscriptionId: 3002,
      user: { id: 3, name: 'Priya Sharma', hospitalName: 'RMS Express', email: 'express@rms.local' },
      plan: { planId: 2, planName: 'Basic' },
      startDate: '2026-02-01',
      endDate: '2026-04-30',
      graceEndDate: null,
      amountPaid: 1799,
      discountAmount: 200,
      status: 'active',
      paymentReference: 'PAY-2026-007'
    },
    {
      subscriptionId: 3003,
      user: { id: 4, name: 'Amit Patel', hospitalName: 'Spice Garden', email: 'spice@rms.local' },
      plan: { planId: 4, planName: 'Premium' },
      startDate: '2025-12-01',
      endDate: '2026-04-22',
      graceEndDate: '2026-04-29',
      amountPaid: 8999,
      discountAmount: 1000,
      status: 'grace',
      paymentReference: 'PAY-2025-089'
    },
    {
      subscriptionId: 3004,
      user: { id: 5, name: 'Neha Rathod', hospitalName: 'Pizza Hub', email: 'pizza@rms.local' },
      plan: { planId: 1, planName: 'Starter' },
      startDate: '2025-10-01',
      endDate: '2026-02-28',
      graceEndDate: null,
      amountPaid: 999,
      discountAmount: 0,
      status: 'expired',
      paymentReference: 'PAY-2025-041'
    },
    {
      subscriptionId: 3005,
      user: { id: 6, name: 'Suresh Verma', hospitalName: 'Tandoor House', email: 'tandoor@rms.local' },
      plan: { planId: 2, planName: 'Basic' },
      startDate: '2026-03-01',
      endDate: '2026-05-31',
      graceEndDate: null,
      amountPaid: 1999,
      discountAmount: 0,
      status: 'active',
      paymentReference: 'PAY-2026-019'
    },
    {
      subscriptionId: 3006,
      user: { id: 7, name: 'Farhan Sheikh', hospitalName: 'The Biryani Box', email: 'biryani@rms.local' },
      plan: { planId: 3, planName: 'Standard' },
      startDate: '2026-01-15',
      endDate: '2026-07-14',
      graceEndDate: null,
      amountPaid: 4499,
      discountAmount: 500,
      status: 'active',
      paymentReference: 'PAY-2026-011'
    },
    {
      subscriptionId: 3007,
      user: { id: 8, name: 'Meera Iyer', hospitalName: 'Green Bowl', email: 'green@rms.local' },
      plan: { planId: 1, planName: 'Starter' },
      startDate: '2026-02-20',
      endDate: '2026-03-19',
      graceEndDate: null,
      amountPaid: 999,
      discountAmount: 0,
      status: 'expired',
      paymentReference: 'PAY-2026-014'
    },
    {
      subscriptionId: 3008,
      user: { id: 9, name: 'Dhruv Singh', hospitalName: 'Burger Nation', email: 'burger@rms.local' },
      plan: { planId: 2, planName: 'Basic' },
      startDate: '2026-03-01',
      endDate: '2026-05-31',
      graceEndDate: null,
      amountPaid: 1999,
      discountAmount: 0,
      status: 'suspended',
      paymentReference: 'PAY-2026-021'
    },
    {
      subscriptionId: 3009,
      user: { id: 11, name: 'Arun Joshi', hospitalName: 'The Desi Kitchen', email: 'desi@rms.local' },
      plan: { planId: 3, planName: 'Standard' },
      startDate: '2026-04-01',
      endDate: '2026-09-30',
      graceEndDate: null,
      amountPaid: 4999,
      discountAmount: 0,
      status: 'active',
      paymentReference: 'PAY-2026-033'
    },
    {
      subscriptionId: 3010,
      user: { id: 10, name: 'Kavya Nair', hospitalName: 'Chai & Snacks', email: 'chai@rms.local' },
      plan: { planId: 1, planName: 'Starter' },
      startDate: '2026-04-10',
      endDate: '2026-05-09',
      graceEndDate: null,
      amountPaid: 999,
      discountAmount: 0,
      status: 'cancelled',
      paymentReference: 'PAY-2026-029'
    }
  ],

  settings: {
    business: {
      restaurantName: 'RMS Platform',
      email: 'admin@rms.local',
      phone: '9999999999',
      address: 'Mock Street, Nashik - 422001',
      logo: null,
      gstNumber: '27AAAPA1234Z1ZA',
      panNumber: 'AAAPA1234Z'
    },
    payment: {
      razorpayKeyId: 'rzp_test_mock123',
      razorpayKeySecret: '',
      ccavenueAccessCode: 'MOCK_ACCESS_CODE',
      ccavenueMerchantId: 'MOCK_MERCHANT'
    },
    webhook: {
      url: 'https://hooks.example.com/rms',
      secret: 'webhook_secret_mock',
      events: ['order.placed', 'order.delivered', 'payment.success']
    },
    appVersion: {
      customerApp: '2.4.1',
      adminApp: '1.8.3',
      minRequired: '2.0.0',
      forceUpdate: false
    }
  },

  apiLogs: [
    { id: 1, method: 'POST', endpoint: '/api/restaurant/orders/adds', status: 200, duration: 145, restaurantId: 101, createdAt: '2026-04-20T18:45:00Z' },
    { id: 2, method: 'GET', endpoint: '/api/superadmin/dashboard', status: 200, duration: 89, restaurantId: null, createdAt: '2026-04-20T18:44:00Z' },
    { id: 3, method: 'PUT', endpoint: '/api/restaurant/orders/update', status: 200, duration: 210, restaurantId: 103, createdAt: '2026-04-20T18:43:00Z' },
    { id: 4, method: 'GET', endpoint: '/api/public/customer/menu-items', status: 200, duration: 67, restaurantId: 101, createdAt: '2026-04-20T18:42:00Z' },
    { id: 5, method: 'POST', endpoint: '/api/customer/orders/adds', status: 500, duration: 3450, restaurantId: 102, createdAt: '2026-04-20T18:40:00Z' },
    { id: 6, method: 'GET', endpoint: '/api/superadmin/subscriptions', status: 200, duration: 134, restaurantId: null, createdAt: '2026-04-20T18:38:00Z' },
    { id: 7, method: 'PUT', endpoint: '/api/superadmin/subscription-plans/3', status: 200, duration: 98, restaurantId: null, createdAt: '2026-04-20T18:35:00Z' },
    { id: 8, method: 'GET', endpoint: '/api/kitchen/orders/filter', status: 200, duration: 112, restaurantId: 101, createdAt: '2026-04-20T18:30:00Z' },
    { id: 9, method: 'POST', endpoint: '/login/panelLogin', status: 200, duration: 340, restaurantId: null, createdAt: '2026-04-20T18:28:00Z' },
    { id: 10, method: 'GET', endpoint: '/api/superadmin/reports/summary', status: 200, duration: 456, restaurantId: null, createdAt: '2026-04-20T18:25:00Z' }
  ],

  locations: [
    { placeId: 'mock-place-1', description: 'Mock Street, Nashik' },
    { placeId: 'mock-place-2', description: 'Branch One, Nashik' },
    { placeId: 'mock-place-3', description: 'Andheri West, Mumbai' }
  ]
};
