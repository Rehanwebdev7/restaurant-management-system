import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CashierSidebar from '../components/CashierSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/superadmin-ui.css';

const CashierLayout = ({ onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    const isMobile = window.innerWidth < 992;

    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="d-flex">
      <CashierSidebar
        collapsed={sidebarCollapsed}
        visible={sidebarVisible}
        onLogout={onLogout}
      />
      {sidebarVisible && (
        <div
          className="sidebar-overlay d-lg-none"
          onClick={() => setSidebarVisible(false)}
        ></div>
      )}
      <div className="flex-grow-1" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          sidebarVisible={sidebarVisible}
          onLogout={onLogout}
        />
        <div className={`dms-dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0, paddingBottom: 0 }}>
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default CashierLayout;
