import React, { useState } from 'react';
import { useOrderAlert } from '../contexts/OrderAlertContext';

const OrderAlertOverlay = () => {
  // Notification overlay disabled for testing
  return null;

  const { pendingOrders, isRinging, acceptOrder, rejectOrder, actionLoading } = useOrderAlert();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Only kitchen role handles order alerts
  const userRole = localStorage.getItem('UserRole') || '';
  const alertRoles = ['kitchen'];
  if (!alertRoles.includes(userRole)) return null;

  // Don't render if no pending orders
  if (!pendingOrders || pendingOrders.length === 0) return null;

  // Clamp index
  const idx = Math.min(currentIndex, pendingOrders.length - 1);
  const order = pendingOrders[idx];
  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const orderTypeLabels = {
    'DINE_IN': 'Dine In',
    'ONLINE': 'Online',
    'TAKEAWAY': 'Takeaway',
    'DELIVERY': 'Delivery'
  };

  const handleAccept = () => {
    acceptOrder(order.id);
    if (idx >= pendingOrders.length - 1) setCurrentIndex(Math.max(0, idx - 1));
  };

  const handleReject = () => {
    rejectOrder(order.id);
    if (idx >= pendingOrders.length - 1) setCurrentIndex(Math.max(0, idx - 1));
  };

  const isLoading = actionLoading === order.id;

  return (
    <>
      {/* Backdrop */}
      <div style={styles.backdrop} />

      {/* Alert Card */}
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Bell Animation */}
          <div style={styles.bellWrapper}>
            <div style={{
              ...styles.bellCircle,
              animation: isRinging ? 'bellPulse 1.5s ease-in-out infinite' : 'none'
            }}>
              <i className="bi bi-bell-fill" style={{
                fontSize: '2rem',
                color: '#fff',
                animation: isRinging ? 'bellSwing 0.5s ease-in-out infinite alternate' : 'none'
              }}></i>
            </div>
            <div style={styles.bellLabel}>New Order!</div>
          </div>

          {/* Order Count Navigation */}
          {pendingOrders.length > 1 && (
            <div style={styles.orderNav}>
              <button
                onClick={() => setCurrentIndex(Math.max(0, idx - 1))}
                disabled={idx === 0}
                style={{
                  ...styles.navBtn,
                  opacity: idx === 0 ? 0.3 : 1
                }}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <span style={styles.orderCounter}>
                {idx + 1} of {pendingOrders.length} pending orders
              </span>
              <button
                onClick={() => setCurrentIndex(Math.min(pendingOrders.length - 1, idx + 1))}
                disabled={idx === pendingOrders.length - 1}
                style={{
                  ...styles.navBtn,
                  opacity: idx === pendingOrders.length - 1 ? 0.3 : 1
                }}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}

          {/* Order Info */}
          <div style={styles.orderInfo}>
            {/* Order Number & Type */}
            <div style={styles.orderHeader}>
              <div>
                <div style={styles.orderNumber}>{order.orderNumber}</div>
                <div style={styles.orderTime}>
                  <i className="bi bi-clock me-1"></i>
                  {formatTime(order.createdAt)}
                </div>
              </div>
              <span style={styles.orderTypeBadge}>
                {orderTypeLabels[order.orderType] || order.orderType}
              </span>
            </div>

            {/* Customer */}
            <div style={styles.customerRow}>
              <i className="bi bi-person-fill" style={{ color: '#94a3b8' }}></i>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>
                  {order.customerName || 'Walk-in Customer'}
                </div>
                {order.customerPhone && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{order.customerPhone}</div>
                )}
              </div>
            </div>

            {/* Items List */}
            {order.orderItems && order.orderItems.length > 0 && (
              <div style={styles.itemsList}>
                <div style={styles.itemsHeader}>
                  <span><i className="bi bi-cart3 me-1"></i> Items ({order.orderItems.length})</span>
                </div>
                <div style={styles.itemsScrollable}>
                  {order.orderItems.map((item, i) => (
                    <div key={item.id || i} style={styles.itemRow}>
                      <div style={styles.itemName}>
                        <span style={styles.itemQty}>{item.quantity}x</span>
                        {item.menuItemName}
                      </div>
                      <div style={styles.itemPrice}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div style={styles.totalRow}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Total Amount</span>
              <span style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</span>
            </div>

            {/* Payment Method */}
            {order.paymentMethod && (
              <div style={styles.paymentRow}>
                <i className="bi bi-credit-card me-1"></i>
                Payment: <strong>{order.paymentMethod}</strong>
              </div>
            )}

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div style={styles.addressRow}>
                <i className="bi bi-geo-alt me-1"></i>
                {order.deliveryAddress}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button
              onClick={handleReject}
              disabled={isLoading}
              style={styles.rejectBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
            >
              {isLoading && actionLoading === order.id ? (
                <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px' }}></span>
              ) : (
                <><i className="bi bi-x-lg me-2"></i>Reject</>
              )}
            </button>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              style={styles.acceptBtn}
            >
              {isLoading && actionLoading === order.id ? (
                <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px' }}></span>
              ) : (
                <><i className="bi bi-check-lg me-2"></i>Accept Order</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes bellSwing {
          0% { transform: rotate(-15deg); }
          100% { transform: rotate(15deg); }
        }
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10000,
    animation: 'fadeInBackdrop 0.3s ease'
  },
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    padding: '20px',
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  card: {
    background: '#fff',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column'
  },
  bellWrapper: {
    textAlign: 'center',
    padding: '28px 20px 16px',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)'
  },
  bellCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px'
  },
  bellLabel: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#dc2626',
    letterSpacing: '-0.02em'
  },
  orderNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '10px 20px',
    borderBottom: '1px solid #f1f5f9',
    background: '#fafbfc'
  },
  navBtn: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: '#475569'
  },
  orderCounter: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#64748b'
  },
  orderInfo: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  orderNumber: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em'
  },
  orderTime: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    marginTop: '2px'
  },
  orderTypeBadge: {
    padding: '5px 14px',
    borderRadius: '10px',
    fontSize: '0.78rem',
    fontWeight: 700,
    background: '#eff6ff',
    color: '#3b82f6',
    border: '1px solid #bfdbfe'
  },
  customerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '14px'
  },
  itemsList: {
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '14px'
  },
  itemsHeader: {
    padding: '10px 14px',
    background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#475569'
  },
  itemsScrollable: {
    maxHeight: '180px',
    overflowY: 'auto',
    padding: '4px 0'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    borderBottom: '1px solid #f8fafc'
  },
  itemName: {
    fontSize: '0.85rem',
    color: '#334155',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  itemQty: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    height: '22px',
    borderRadius: '6px',
    background: '#f1f5f9',
    color: '#475569',
    fontSize: '0.75rem',
    fontWeight: 700
  },
  itemPrice: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#475569',
    whiteSpace: 'nowrap'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    borderRadius: '12px',
    marginBottom: '10px',
    border: '1px solid #bbf7d0'
  },
  totalAmount: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#059669'
  },
  paymentRow: {
    fontSize: '0.82rem',
    color: '#64748b',
    padding: '8px 0'
  },
  addressRow: {
    fontSize: '0.82rem',
    color: '#64748b',
    padding: '8px 14px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginTop: '6px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px 24px',
    borderTop: '1px solid #f1f5f9'
  },
  rejectBtn: {
    flex: '1',
    padding: '14px 20px',
    borderRadius: '14px',
    border: '2px solid #fecaca',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  acceptBtn: {
    flex: '2',
    padding: '14px 20px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default OrderAlertOverlay;
