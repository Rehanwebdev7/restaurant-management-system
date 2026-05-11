// src/components/AuthGuard.js
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from './AuthContext';
import authServices from '../services/AuthServices';

const AuthGuard = ({ children }) => {
  const { authState } = useContext(AuthContext);
  const location = useLocation();
  
  // Show loading while checking auth state
  if (authState.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }
  
  // Check for token in localStorage
  const token = authServices.getToken();
  const refreshToken = localStorage.getItem('refreshToken');
  
  // If no token exists at all, redirect to login
  if (!token && !refreshToken) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  // If not authenticated, redirect to login
  if (!authState.isAuthenticated) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;
