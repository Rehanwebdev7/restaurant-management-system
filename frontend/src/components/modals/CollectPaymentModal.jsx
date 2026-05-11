import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ApiPut } from '../../ApiServices/ApiServices';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: 'bi-cash-coin' },
  { value: 'UPI', label: 'UPI', icon: 'bi-phone' },
  { value: 'CARD', label: 'Card', icon: 'bi-credit-card' },
  { value: 'PG', label: 'Pay Link', icon: 'bi-link-45deg' },
];

const CollectPaymentModal = ({ order, show, onClose, onCollected, endpoint = '/api/restaurant/orders/update' }) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    if (show && order) {
      setPaymentMethod(order.paymentMethod && order.paymentMethod !== 'COD' ? order.paymentMethod : 'CASH');
      setRemarks('');
    }
  }, [show, order]);

  const handleConfirm = async () => {
    if (!order) return;
    setCollecting(true);
    try {
      const payload = {
        id: order.id,
        paymentStatus: 'SUCCESS',
        status: 'COMPLETED',
        paymentMethod,
      };
      const trimmed = (remarks || '').trim();
      if (trimmed) payload.paymentRemarks = trimmed;

      const response = await ApiPut(endpoint, payload);
      if (response.success) {
        toast.success(`$${order.totalAmount || 0} collected via ${paymentMethod} — Order completed & table freed`);
        if (onCollected) {
          onCollected({
            ...order,
            paymentStatus: 'SUCCESS',
            status: 'COMPLETED',
            paymentMethod,
            paymentRemarks: trimmed || order.paymentRemarks,
          });
        }
        onClose();
      } else {
        toast.error(response.fail || 'Failed to update payment status');
      }
    } catch (error) {
      toast.error('Error updating payment status');
    } finally {
      setCollecting(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !collecting && onClose()} centered>
      <Modal.Body style={{ padding: '28px 28px 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <i className="bi bi-cash-coin" style={{ fontSize: 28, color: '#059669' }}></i>
          </div>
          <h5 style={{ fontWeight: 800, marginBottom: 6 }}>Collect Payment</h5>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 18 }}>
            Confirm collection for order <strong>#{order?.orderNumber}</strong>
          </p>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: '#94a3b8' }}>Customer</span>
            <span style={{ fontWeight: 600 }}>
              {order?.customerName || order?.customerId?.name || 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: '#94a3b8' }}>Items</span>
            <span style={{ fontWeight: 600 }}>{order?.orderItems?.length || order?.items?.length || '—'}</span>
          </div>
          {order?.paymentMethod && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: '#94a3b8' }}>Original Method</span>
              <span style={{ fontWeight: 600 }}>{order.paymentMethod}</span>
            </div>
          )}
          {order?.tableNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: '#94a3b8' }}>Table</span>
              <span style={{ fontWeight: 600 }}>T-{order.tableNumber}</span>
            </div>
          )}
          <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Amount to Collect</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#059669' }}>${order?.totalAmount || 0}</span>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
            Payment Method <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PAYMENT_METHODS.map((m) => {
              const active = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={collecting}
                  onClick={() => setPaymentMethod(m.value)}
                  style={{
                    padding: '8px 4px',
                    border: active ? '2px solid #059669' : '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: active ? '#ecfdf5' : '#fff',
                    color: active ? '#059669' : '#475569',
                    fontWeight: active ? 700 : 500,
                    fontSize: 11,
                    cursor: collecting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    transition: 'all 0.15s',
                  }}
                >
                  <i className={`bi ${m.icon}`} style={{ fontSize: 15 }}></i>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
            Remarks <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
          </label>
          <Form.Control
            as="textarea"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={collecting}
            placeholder="e.g. Tip included, partial tendered, UPI ref no..."
            style={{ borderRadius: 8, fontSize: 13, borderColor: '#e2e8f0', resize: 'none' }}
            maxLength={500}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="outline-secondary"
            onClick={onClose}
            disabled={collecting}
            style={{ flex: 1, borderRadius: 10, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleConfirm}
            disabled={collecting}
            style={{ flex: 1, borderRadius: 10, fontWeight: 700, background: '#059669', border: 'none' }}
          >
            {collecting ? (
              <><Spinner animation="border" size="sm" className="me-1" />Collecting...</>
            ) : (
              <>✅ Confirm Collection</>
            )}
          </Button>
        </div>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center', marginBottom: 0 }}>
          This will mark payment as collected, complete the order, and free the table.
        </p>
      </Modal.Body>
    </Modal>
  );
};

export default CollectPaymentModal;
