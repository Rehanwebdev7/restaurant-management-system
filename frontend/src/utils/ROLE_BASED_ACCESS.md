# 🔐 Role-Based Access Control Guide

Complete guide for managing role-based permissions in the application.

## 📋 Available Roles

| Role | Level | Description |
|------|-------|-------------|
| `admin` | 100 | Full system access |
| `super` | 80 | Super Distributor |
| `master` | 60 | Master Distributor |
| `distributor` | 40 | Distributor |
| `retailer` | 20 | Retailer |
| `api_partner` | 20 | API Partner |
| `salesforce` | 10 | Sales Force |
| `employee` | 10 | Employee |
| `support` | 10 | Support Staff |

## 🚀 Quick Start

### 1. Check User Role in Components

```javascript
import { hasRole, isAdmin, hasAnyRole } from '../utils/rolePermissions';

const MyComponent = () => {
  // Check specific role
  if (hasRole('admin')) {
    console.log('User is admin');
  }

  // Check if admin
  if (isAdmin()) {
    console.log('User is admin');
  }

  // Check multiple roles
  if (hasAnyRole(['admin', 'super', 'master'])) {
    console.log('User has management access');
  }
};
```

### 2. Using Role-Based Components

```javascript
import { AdminOnly, RequireRole, RequireAnyRole } from '../components/auth/RoleBasedAccess';

const Dashboard = () => {
  return (
    <div>
      {/* Show only to admin */}
      <AdminOnly>
        <button>Admin Settings</button>
      </AdminOnly>

      {/* Show only to specific role */}
      <RequireRole role="retailer">
        <div>Retailer Dashboard</div>
      </RequireRole>

      {/* Show to multiple roles */}
      <RequireAnyRole roles={['admin', 'super', 'master']}>
        <div>Management Panel</div>
      </RequireAnyRole>

      {/* Show with fallback */}
      <AdminOnly fallback={<p>Access Denied</p>}>
        <button>Delete User</button>
      </AdminOnly>
    </div>
  );
};
```

### 3. Conditional Rendering in Sidebar

```javascript
// In Sidebar.js
const allNavItems = [
  {
    path: '/dashboard',
    icon: 'bi bi-speedometer2',
    label: 'Dashboard',
    // No roles = visible to everyone
  },
  {
    path: '/user-management',
    icon: 'bi bi-people',
    label: 'User Management',
    roles: ['admin'], // Only admin can see
  },
  {
    path: '/reports',
    icon: 'bi bi-file-text',
    label: 'Reports',
    roles: ['admin', 'super', 'master'], // Multiple roles
  },
  {
    path: '/transactions',
    icon: 'bi bi-arrow-left-right',
    label: 'Transactions',
    roles: ['admin', 'super', 'master', 'distributor', 'retailer'],
  }
];

// Filter based on user role
const navItems = allNavItems.filter(item => {
  if (!item.roles || item.roles.length === 0) {
    return true; // Show to everyone
  }
  return item.roles.includes(userRole);
});
```

## 📚 API Reference

### Role Checking Functions

#### `hasRole(requiredRole)`
Check if user has a specific role.
```javascript
if (hasRole('admin')) {
  // User is admin
}
```

#### `hasAnyRole(roles)`
Check if user has any of the specified roles.
```javascript
if (hasAnyRole(['admin', 'super'])) {
  // User is admin OR super
}
```

#### `isAdmin()`
Check if user is admin.
```javascript
if (isAdmin()) {
  // User is admin
}
```

#### `hasMinimumRole(requiredRole)`
Check if user has permission level equal or higher.
```javascript
if (hasMinimumRole('distributor')) {
  // User is distributor, master, super, or admin
}
```

#### `getCurrentRole()`
Get current user's role.
```javascript
const role = getCurrentRole(); // Returns: 'admin', 'retailer', etc.
```

#### `canAccessFeature(feature)`
Check if user can access a feature.
```javascript
if (canAccessFeature('user-management')) {
  // User can access user management
}
```

#### `getRoleDisplayName(role)`
Get human-readable role name.
```javascript
const displayName = getRoleDisplayName('admin'); // Returns: 'Admin'
const displayName = getRoleDisplayName('super'); // Returns: 'Super Distributor'
```

#### `canManageUser(targetUserRole)`
Check if user can manage another user based on role hierarchy.
```javascript
if (canManageUser('retailer')) {
  // Current user can manage retailer
}
```

## 🎨 Component Wrappers

### `<AdminOnly>`
Show content only to admin users.
```javascript
<AdminOnly>
  <button>Delete All Users</button>
</AdminOnly>

// With fallback
<AdminOnly fallback={<p>Admin access required</p>}>
  <AdminPanel />
</AdminOnly>
```

### `<RequireRole>`
Show content to specific role.
```javascript
<RequireRole role="retailer">
  <RetailerDashboard />
</RequireRole>
```

### `<RequireAnyRole>`
Show content to users with any of the specified roles.
```javascript
<RequireAnyRole roles={['admin', 'super', 'master']}>
  <ManagementPanel />
</RequireAnyRole>
```

### `<RequireFeature>`
Show content if user can access feature.
```javascript
<RequireFeature feature="user-management">
  <UserManagementSection />
</RequireFeature>
```

### `<ExcludeRoles>`
Show content to everyone except specified roles.
```javascript
<ExcludeRoles roles={['retailer']}>
  <AdvancedSettings />
</ExcludeRoles>
```

## 🛠️ Real-World Examples

### Example 1: Protected Button
```javascript
import { AdminOnly } from '../components/auth/RoleBasedAccess';

const UserList = () => {
  return (
    <div>
      <h2>Users</h2>
      <table>
        {/* User list */}
      </table>
      
      <AdminOnly>
        <button onClick={deleteAllUsers}>Delete All</button>
      </AdminOnly>
    </div>
  );
};
```

### Example 2: Conditional Menu Items
```javascript
import { hasAnyRole } from '../utils/rolePermissions';

const Header = () => {
  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      
      {hasAnyRole(['admin', 'super']) && (
        <a href="/reports">Reports</a>
      )}
      
      {hasRole('admin') && (
        <a href="/settings">Settings</a>
      )}
    </nav>
  );
};
```

### Example 3: Dynamic Permissions
```javascript
import { canAccessFeature, getCurrentRole } from '../utils/rolePermissions';

const Dashboard = () => {
  const role = getCurrentRole();
  
  return (
    <div>
      <h1>Welcome, {getRoleDisplayName(role)}</h1>
      
      {canAccessFeature('user-management') && (
        <UserManagementWidget />
      )}
      
      {canAccessFeature('reports') && (
        <ReportsWidget />
      )}
      
      {canAccessFeature('transactions') && (
        <TransactionsWidget />
      )}
    </div>
  );
};
```

### Example 4: Hierarchical Access
```javascript
import { hasMinimumRole } from '../utils/rolePermissions';

const ReportPage = () => {
  return (
    <div>
      <h1>Reports</h1>
      
      {/* All management roles can see basic reports */}
      {hasMinimumRole('distributor') && (
        <BasicReports />
      )}
      
      {/* Only master and above can see advanced reports */}
      {hasMinimumRole('master') && (
        <AdvancedReports />
      )}
      
      {/* Only admin can see system reports */}
      {hasMinimumRole('admin') && (
        <SystemReports />
      )}
    </div>
  );
};
```

### Example 5: User Management with Hierarchy
```javascript
import { canManageUser, getCurrentRole } from '../utils/rolePermissions';

const UserActionButtons = ({ targetUser }) => {
  const canManage = canManageUser(targetUser.role);
  
  return (
    <div>
      {canManage && (
        <>
          <button>Edit</button>
          <button>Delete</button>
        </>
      )}
      {!canManage && (
        <p>You cannot manage this user</p>
      )}
    </div>
  );
};
```

## 🔒 Protected Routes

```javascript
import { Navigate } from 'react-router-dom';
import { hasRole, isAdmin } from '../utils/rolePermissions';

const ProtectedRoute = ({ children, requiredRole }) => {
  if (!hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }
  return children;
};

// Usage
<Route 
  path="/admin/*" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

## 📊 Feature Permissions

Edit `src/utils/rolePermissions.js` to add/modify feature permissions:

```javascript
const featurePermissions = {
  'user-management': ['admin'],
  'reports': ['admin', 'super', 'master'],
  'transactions': ['admin', 'super', 'master', 'distributor', 'retailer'],
  'wallet': ['admin', 'super', 'master', 'distributor', 'retailer'],
  'settings': ['admin'],
  'support': ['admin', 'super', 'support'],
  // Add more features
};
```

## 🎯 Best Practices

1. **Always check permissions on both frontend and backend**
   - Frontend checks for UX
   - Backend checks for security

2. **Use role wrappers for cleaner code**
   ```javascript
   // ✅ Good
   <AdminOnly><DeleteButton /></AdminOnly>
   
   // ❌ Avoid
   {isAdmin() && <DeleteButton />}
   ```

3. **Define permissions in one place**
   - Use `featurePermissions` object
   - Don't hardcode roles everywhere

4. **Use hierarchy for related roles**
   ```javascript
   // ✅ Good
   hasMinimumRole('distributor')
   
   // ❌ Avoid
   hasAnyRole(['distributor', 'master', 'super', 'admin'])
   ```

5. **Provide fallback UI**
   ```javascript
   <RequireRole role="admin" fallback={<AccessDenied />}>
     <AdminPanel />
   </RequireRole>
   ```

---

**Current Role:** `{getCurrentRole()}`  
**Is Admin:** `{isAdmin() ? 'Yes' : 'No'}`

