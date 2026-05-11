import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarVisible(false); // Hide mobile sidebar on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    // Check if we're on mobile (window width < 992px)
    const isMobile = window.innerWidth < 992;
    
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} visible={sidebarVisible} onLogout={onLogout} />
      {sidebarVisible && (
        <div 
          className="sidebar-overlay d-lg-none" 
          onClick={() => setSidebarVisible(false)}
        ></div>
      )}
      <div className="flex-grow-1">
        <Header 
          onToggleSidebar={toggleSidebar} 
          sidebarCollapsed={sidebarCollapsed} 
          sidebarVisible={sidebarVisible} 
          onLogout={onLogout} 
        />
        <div className={`dms-dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

