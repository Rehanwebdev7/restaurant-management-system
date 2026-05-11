// Example component showing how to use AdminService
import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import adminService from '../services/AdminService';

const AdminServiceUsage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Example: Fetch dashboard overview
  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await adminService.getDashboardOverview();
      if (result.success) {
        setDashboardData(result.data);
        console.log('Dashboard data:', result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Example: Fetch users with filters
  const fetchDistributors = async () => {
    const result = await adminService.getUsers({
      role: 'distributor',
      status: 'active',
      page: 1,
      page_size: 10,
      search: '',
      region: 'North'
    });

    if (result.success) {
      console.log('Distributors:', result.data.results);
      console.log('Total count:', result.data.count);
    } else {
      console.error('Error:', result.error);
    }
  };

  // Example: Fetch registration trends
  const fetchTrends = async () => {
    const result = await adminService.getRegistrationTrends('weekly');
    
    if (result.success) {
      console.log('Trends:', result.data.data.trends);
      console.log('Summary:', result.data.data.summary);
    } else {
      console.error('Error:', result.error);
    }
  };

  // Example: Create a new user
  const createUser = async () => {
    const userData = {
      mobile: '9876543210',
      role: 'retailer',
      email: 'test@example.com',
      region: 'North',
      district: 'Delhi',
      city: 'New Delhi'
    };

    const result = await adminService.createUser(userData);
    
    if (result.success) {
      console.log('User created:', result.data);
    } else {
      console.error('Error creating user:', result.error);
    }
  };

  // Example: Update user status
  const toggleUserStatus = async (userId) => {
    const result = await adminService.toggleUserStatus(userId, 'inactive');
    
    if (result.success) {
      console.log('User status updated:', result.data);
    } else {
      console.error('Error updating status:', result.error);
    }
  };

  return (
    <div className="p-4">
      <h3>AdminService Usage Examples</h3>
      
      <div className="mb-4">
        <h5>Dashboard Data</h5>
        <Button onClick={fetchDashboard} disabled={loading} className="me-2">
          {loading && <Spinner size="sm" className="me-2" />}
          Fetch Dashboard
        </Button>
        
        {error && (
          <Alert variant="danger" className="mt-2">
            {error}
          </Alert>
        )}
        
        {dashboardData && (
          <pre className="mt-2 p-2 bg-light">
            {JSON.stringify(dashboardData, null, 2)}
          </pre>
        )}
      </div>

      <div className="mb-4">
        <h5>Other API Calls</h5>
        <Button onClick={fetchDistributors} className="me-2">
          Fetch Distributors
        </Button>
        <Button onClick={fetchTrends} className="me-2">
          Fetch Trends
        </Button>
        <Button onClick={createUser} className="me-2">
          Create User
        </Button>
        <Button onClick={() => toggleUserStatus(123)}>
          Toggle User Status
        </Button>
      </div>

      <div className="alert alert-info">
        <h6>Available AdminService Methods:</h6>
        <ul className="mb-0">
          <li><strong>getUsers(params)</strong> - Fetch users with filtering</li>
          <li><strong>getUserById(id)</strong> - Get single user</li>
          <li><strong>createUser(data)</strong> - Create new user</li>
          <li><strong>updateUser(id, data)</strong> - Update user</li>
          <li><strong>patchUser(id, data)</strong> - Partial update user</li>
          <li><strong>deleteUser(id)</strong> - Delete user</li>
          <li><strong>toggleUserStatus(id, status)</strong> - Change user status</li>
          <li><strong>getDashboardOverview()</strong> - Get dashboard data</li>
          <li><strong>getRegistrationTrends(period, start, end)</strong> - Get trends</li>
          <li><strong>getRecentActivities(limit, offset)</strong> - Get activities</li>
          <li><strong>getUserStats()</strong> - Get user statistics</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminServiceUsage;