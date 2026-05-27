import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Modal, Button, Card, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import RestaurantSidebar from '../components/RestaurantSidebar';
import Header from '../components/Header';
import { ApiGet, ApiPost } from '../ApiServices/ApiServices';
import '../styles/superadmin-ui.css';

const MarqueeTicker = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await ApiGet('/api/global/marquee/getByRestId');
        const data = res?.success?.data?.data || res?.data?.data || [];
        const active = Array.isArray(data) ? data.filter(m => m.isActive !== false) : [];
        setMessages(active);
      } catch (e) { /* silent */ }
    };
    fetch();
  }, []);

  if (messages.length === 0) return null;

  const combined = messages.map(m => m.message).join('   •••   ');

  return (
    <div style={{ width: '100%', overflow: 'hidden', background: messages[0]?.bgColor || '#1e3a5f', padding: '6px 0', zIndex: 1040 }}>
      <div style={{ display: 'flex', width: '200%', animation: 'marqueeScroll 40s linear infinite' }}>
        <span style={{ display: 'flex', alignItems: 'center', width: '50%', flexShrink: 0, color: messages[0]?.textColor || '#ffffff', fontSize: '13px', fontWeight: messages[0]?.fontWeight || 500, whiteSpace: 'nowrap', paddingLeft: '100%' }}>
          {combined}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', width: '50%', flexShrink: 0, color: messages[0]?.textColor || '#ffffff', fontSize: '13px', fontWeight: messages[0]?.fontWeight || 500, whiteSpace: 'nowrap', paddingLeft: '2rem' }}>
          {combined}
        </span>
      </div>
      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

const SubscriptionBanner = ({ status, onSubscribeClick }) => {
  if (!status || status === 'active' || status === 'grace') return null;

  const isExpired = status === 'expired';
  return (
    <div style={{
      background: isExpired ? '#fef2f2' : '#fffbeb',
      borderBottom: `2px solid ${isExpired ? '#fca5a5' : '#fcd34d'}`,
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 13,
      zIndex: 1039
    }}>
      <span style={{ color: isExpired ? '#dc2626' : '#92400e', fontWeight: 500 }}>
        {isExpired
          ? 'Your subscription has expired. Some features are disabled.'
          : 'No active subscription. Please select a plan to use all features.'}
      </span>
      <Button size="sm" variant={isExpired ? 'danger' : 'warning'} onClick={onSubscribeClick} style={{ fontSize: 12, fontWeight: 600 }}>
        Subscribe Now
      </Button>
    </div>
  );
};

const SubscriptionModal = ({ show, onHide, onSubscribed }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    ApiGet('/api/restaurant/subscription/plans')
      .then(res => {
        const data = res?.success?.data?.data || [];
        setPlans(Array.isArray(data) ? data : []);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [show]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    const res = await ApiPost('/api/restaurant/subscription/select-plan', { plan_id: selectedPlan });
    setSubscribing(false);
    if (res?.success) {
      toast.success('Plan selected successfully!');
      // Update localStorage with new subscription status
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const plan = plans.find(p => p.planId === selectedPlan);
        if (plan) {
          user.subscriptionStatus = 'active';
          user.planName = plan.planName;
          user.planId = plan.planId;
          user.maxBranch = plan.maxBranch;
          user.maxKitchen = plan.maxKitchen;
          user.maxDeliveryBoy = plan.maxDeliveryBoy;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (e) { /* silent */ }
      onSubscribed();
    } else {
      toast.error(res?.fail || 'Failed to select plan');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" keyboard={false}>
      <Modal.Header style={{ background: '#1e3a5f', color: '#fff', border: 'none' }}>
        <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>
          Select a Subscription Plan
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '24px' }}>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
          Please select a plan to unlock all features. Your plan determines how many branches, kitchens, and delivery staff you can manage.
        </p>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p style={{ marginTop: 10, color: '#9ca3af', fontSize: 13 }}>Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-4" style={{ color: '#6b7280' }}>
            No plans available. Please contact admin.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {plans.map(plan => (
              <Card
                key={plan.planId}
                onClick={() => setSelectedPlan(plan.planId)}
                style={{
                  cursor: 'pointer',
                  border: selectedPlan === plan.planId ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: 12,
                  background: selectedPlan === plan.planId ? '#eff6ff' : '#fff',
                  transition: 'all 0.2s',
                  boxShadow: selectedPlan === plan.planId ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none'
                }}
              >
                <Card.Body style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{plan.planName}</div>
                    {plan.planName?.toLowerCase() === 'free' && (
                      <Badge bg="success" style={{ fontSize: 10 }}>FREE</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', marginBottom: 6 }}>
                    {plan.price === 0 || plan.price === '0' || plan.price === '0.00'
                      ? 'Free'
                      : `$${plan.price}`}
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>/{plan.durationDays}d</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{plan.description}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#374151' }}>
                      Branches: <strong>{plan.maxBranch ?? '∞'}</strong>
                    </span>
                    <span style={{ fontSize: 12, color: '#374151' }}>
                      Kitchens: <strong>{plan.maxKitchen ?? '∞'}</strong>
                    </span>
                    <span style={{ fontSize: 12, color: '#374151' }}>
                      Delivery Boys: <strong>{plan.maxDeliveryBoy ?? '∞'}</strong>
                    </span>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #f3f4f6', padding: '16px 24px' }}>
        <Button variant="outline-secondary" onClick={onHide} style={{ fontSize: 13 }}>
          Skip for now
        </Button>
        <Button
          variant="primary"
          onClick={handleSubscribe}
          disabled={!selectedPlan || subscribing}
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          {subscribing ? <Spinner animation="border" size="sm" /> : 'Confirm Plan'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const RestaurantLayout = ({ onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const status = user.subscriptionStatus || 'active';
      setSubscriptionStatus(status);
      if (status === 'none' || status === 'expired') {
        setShowSubModal(true);
      }
    } catch (e) { /* silent */ }
  }, []);

  const handleSubscribed = () => {
    setSubscriptionStatus('active');
    setShowSubModal(false);
  };

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
      <RestaurantSidebar
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
      <div className="flex-grow-1" style={{ minHeight: '100vh' }}>
        <MarqueeTicker />
        <SubscriptionBanner
          status={subscriptionStatus}
          onSubscribeClick={() => setShowSubModal(true)}
        />
        <Header
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          sidebarVisible={sidebarVisible}
          onLogout={onLogout}
        />
        <div className={`dms-dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Outlet context={{ subscriptionStatus, onSubscribeClick: () => setShowSubModal(true) }} />
        </div>
      </div>

      <SubscriptionModal
        show={showSubModal}
        onHide={() => setShowSubModal(false)}
        onSubscribed={handleSubscribed}
      />
    </div>
  );
};

export default RestaurantLayout;
