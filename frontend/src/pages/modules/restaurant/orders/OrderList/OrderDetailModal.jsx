import React, { useRef } from 'react';
import { Modal, Button, Badge, Table } from 'react-bootstrap';
import ThermalReceipt from './ThermalReceipt';
import { useDarkMode } from '../../../../../contexts/DarkModeContext';

const OrderDetailModal = ({ show, onClose, order }) => {
  const printRef = useRef();
  const { isDarkMode } = useDarkMode();

  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const statusConfig = {
    'PENDING': { color: '#f59e0b', bg: '#fef3c7', icon: 'bi-clock' },
    'CONFIRMED': { color: '#3b82f6', bg: '#dbeafe', icon: 'bi-check-circle' },
    'PREPARING': { color: '#8b5cf6', bg: '#ede9fe', icon: 'bi-fire' },
    'READY': { color: '#10b981', bg: '#d1fae5', icon: 'bi-bag-check' },
    'OUT_FOR_DELIVERY': { color: '#06b6d4', bg: '#cffafe', icon: 'bi-truck' },
    'DELIVERED': { color: '#059669', bg: '#a7f3d0', icon: 'bi-house-check' },
    'COMPLETED': { color: '#047857', bg: '#6ee7b7', icon: 'bi-check-all' },
    'CANCELLED': { color: '#ef4444', bg: '#fee2e2', icon: 'bi-x-circle' },
    'CREATED': { color: '#3b82f6', bg: '#dbeafe', icon: 'bi-plus-circle' },
    'WORKING': { color: '#8b5cf6', bg: '#ede9fe', icon: 'bi-gear' }
  };

  const typeConfig = {
    'DINE_IN': { color: '#6366f1', bg: '#eef2ff', icon: 'bi-shop' },
    'ONLINE': { color: '#10b981', bg: '#ecfdf5', icon: 'bi-globe' },
    'TAKEAWAY': { color: '#f59e0b', bg: '#fffbeb', icon: 'bi-bag' },
    'DELIVERY': { color: '#3b82f6', bg: '#eff6ff', icon: 'bi-bicycle' },
    'FASTWAY': { color: '#ef4444', bg: '#fef2f2', icon: 'bi-lightning' }
  };

  const payConfig = {
    'PENDING': { color: '#f59e0b', bg: '#fef3c7' },
    'PAID': { color: '#059669', bg: '#d1fae5' },
    'UNPAID': { color: '#ef4444', bg: '#fee2e2' },
    'FAILED': { color: '#ef4444', bg: '#fee2e2' },
    'REFUNDED': { color: '#6b7280', bg: '#f3f4f6' }
  };

  const chipStyle = (config) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 12px',
    borderRadius: '10px',
    fontSize: '0.78rem',
    fontWeight: 600,
    background: isDarkMode ? `${config?.color || '#64748b'}22` : (config?.bg || '#f1f5f9'),
    color: config?.color || '#64748b',
    border: `1px solid ${config?.color || '#64748b'}40`
  });

  const handleThermalPrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt - ${order.orderNumber}</title><style>@page{size:80mm auto;margin:0}body{font-family:'Courier New',monospace;font-size:12px;margin:0;padding:5mm;width:70mm}.receipt-header{text-align:center;border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px}.receipt-header h2{margin:0;font-size:16px}.receipt-header p{margin:2px 0;font-size:10px}.order-info{border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px}.order-info p{margin:3px 0;font-size:11px}.items-table{width:100%;border-collapse:collapse;margin-bottom:10px}.items-table th,.items-table td{text-align:left;padding:3px 0;font-size:11px}.items-table th{border-bottom:1px solid #000}.items-table .qty{width:15%;text-align:center}.items-table .item{width:55%}.items-table .price{width:30%;text-align:right}.addon-row td{font-size:10px;color:#666;padding-left:10px}.totals{border-top:1px dashed #000;padding-top:10px}.totals p{margin:3px 0;display:flex;justify-content:space-between;font-size:11px}.totals .grand-total{font-size:14px;font-weight:bold;border-top:1px solid #000;padding-top:5px;margin-top:5px}.footer{text-align:center;margin-top:15px;border-top:1px dashed #000;padding-top:10px;font-size:10px}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const handleA4Print = () => {
    const printContent = document.getElementById('order-detail-content');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Order - ${order.orderNumber}</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"><style>body{padding:20px;font-family:Arial,sans-serif}@media print{.no-print{display:none}}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const sectionStyle = {
    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #edf2f7',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '14px',
    background: isDarkMode ? '#1e293b' : '#fff'
  };

  const sectionTitleStyle = {
    fontWeight: 700,
    fontSize: '0.82rem',
    color: isDarkMode ? '#cbd5e1' : '#334155',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const infoLabelStyle = { color: '#94a3b8', fontSize: '0.78rem' };
  const infoValueStyle = { fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: '0.85rem' };

  return (
    <Modal show={show} onHide={onClose} size="lg" backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>
          <i className="bi bi-receipt me-2"></i>Order Details: {order.orderNumber}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body id="order-detail-content" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px', background: isDarkMode ? '#0f172a' : '#f8fafc' }}>
        {/* Status Strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
          padding: '14px 16px',
          background: isDarkMode ? '#1e293b' : '#fff',
          borderRadius: '12px',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #edf2f7'
        }}>
          <span style={chipStyle(typeConfig[order.orderType])}>
            <i className={typeConfig[order.orderType]?.icon || 'bi bi-box'}></i>
            {order.orderType?.replace('_', ' ') || '-'}
          </span>
          <span style={chipStyle(statusConfig[order.status])}>
            <i className={statusConfig[order.status]?.icon || 'bi bi-circle'}></i>
            {order.status?.replace('_', ' ') || '-'}
          </span>
          <span style={chipStyle(payConfig[order.paymentStatus])}>
            <i className="bi bi-credit-card"></i>
            {order.paymentStatus || '-'}
          </span>
          {order.paymentMethod && (
            <span style={chipStyle({ color: '#475569', bg: '#f1f5f9' })}>
              <i className="bi bi-wallet2"></i>
              {order.paymentMethod}
            </span>
          )}
          {order.tableNumber && (
            <span style={chipStyle({ color: '#475569', bg: '#f1f5f9' })}>
              <i className="bi bi-grid-3x3"></i>
              Table {order.tableNumber}
            </span>
          )}
        </div>

        {/* Customer Info */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <i className="bi bi-person-circle" style={{ color: '#667eea' }}></i> Customer
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <div style={infoLabelStyle}>Name</div>
              <div style={infoValueStyle}>{order.customerName || '-'}</div>
            </div>
            <div>
              <div style={infoLabelStyle}>Phone</div>
              <div style={infoValueStyle}>{order.customerPhone || '-'}</div>
            </div>
            <div>
              <div style={infoLabelStyle}>Email</div>
              <div style={infoValueStyle}>{order.customerEmail || '-'}</div>
            </div>
            {order.deliveryAddress && (
              <div>
                <div style={infoLabelStyle}>Address</div>
                <div style={infoValueStyle}>{order.deliveryAddress}</div>
              </div>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <i className="bi bi-info-circle" style={{ color: '#3b82f6' }}></i> Order Info
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <div style={infoLabelStyle}>Order #</div>
              <div style={infoValueStyle}>{order.orderNumber}</div>
            </div>
            <div>
              <div style={infoLabelStyle}>Created</div>
              <div style={infoValueStyle}>{formatDate(order.createdAt)}</div>
            </div>
            {order.completedAt && (
              <div>
                <div style={infoLabelStyle}>Completed</div>
                <div style={infoValueStyle}>{formatDate(order.completedAt)}</div>
              </div>
            )}
            {order.estimatedTime && (
              <div>
                <div style={infoLabelStyle}>Est. Time</div>
                <div style={infoValueStyle}>{order.estimatedTime} mins</div>
              </div>
            )}
            {order.branchId && (
              <div>
                <div style={infoLabelStyle}>Branch</div>
                <div style={infoValueStyle}>{order.branchId.name || '-'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Staff Info */}
        {(order.captainId || order.kitchenId || order.deliveryId || order.cashierId) && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <i className="bi bi-people" style={{ color: '#8b5cf6' }}></i> Staff
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {order.captainId && (
                <div>
                  <div style={infoLabelStyle}>Captain</div>
                  <div style={infoValueStyle}>{order.captainId.name}</div>
                </div>
              )}
              {order.kitchenId && (
                <div>
                  <div style={infoLabelStyle}>Kitchen</div>
                  <div style={infoValueStyle}>{order.kitchenId.name}</div>
                </div>
              )}
              {order.deliveryId && (
                <div>
                  <div style={infoLabelStyle}>Delivery</div>
                  <div style={infoValueStyle}>{order.deliveryId.name}</div>
                </div>
              )}
              {order.cashierId && (
                <div>
                  <div style={infoLabelStyle}>Cashier</div>
                  <div style={infoValueStyle}>{order.cashierId.name}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div style={{ ...sectionStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            background: isDarkMode ? '#0f172a' : '#f8fafc',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #edf2f7'
          }}>
            <div style={sectionTitleStyle}>
              <i className="bi bi-cart3" style={{ color: '#10b981' }}></i> Items
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '8px',
              background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              color: isDarkMode ? '#94a3b8' : '#64748b'
            }}>
              {order.orderItems?.length || 0} items
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fafbfc', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Item</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems?.map((item, index) => (
                  <React.Fragment key={item.id || index}>
                    <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <strong style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{item.menuItemName}</strong>
                        {item.specialInstructions && (
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic', marginTop: '2px' }}>
                            <i className="bi bi-chat-left-text me-1"></i>{item.specialInstructions}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.itemTotal)}</td>
                    </tr>
                    {item.addonItems?.map((addon, ai) => (
                      <tr key={`addon-${ai}`} style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fafbfc' }}>
                        <td style={{ padding: '6px 16px' }}></td>
                        <td style={{ padding: '6px 16px', paddingLeft: '28px', color: '#94a3b8', fontSize: '0.8rem' }}>
                          <i className="bi bi-puzzle me-1"></i>{addon.name}
                        </td>
                        <td style={{ padding: '6px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>{addon.quantity}</td>
                        <td style={{ padding: '6px 16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>{formatCurrency(addon.price)}</td>
                        <td style={{ padding: '6px 16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>{formatCurrency(parseFloat(addon.price) * parseInt(addon.quantity))}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div style={{
            ...sectionStyle,
            background: '#fffbeb',
            borderColor: '#fef3c7'
          }}>
            <strong style={{ fontSize: '0.82rem' }}>
              <i className="bi bi-chat-left-text me-1" style={{ color: '#f59e0b' }}></i> Special Instructions:
            </strong>
            <span style={{ fontSize: '0.85rem', color: '#92400e', marginLeft: '6px' }}>{order.specialInstructions}</span>
          </div>
        )}

        {/* Order Summary */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <i className="bi bi-calculator" style={{ color: '#f59e0b' }}></i> Summary
          </div>
          <div style={{ maxWidth: '320px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>Subtotal</span>
              <span style={{ fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Tax</span>
                <span style={{ fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{formatCurrency(order.taxAmount)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#059669' }}>Discount</span>
                <span style={{ fontWeight: 500, color: '#059669' }}>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Delivery Fee</span>
                <span style={{ fontWeight: 500, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0 4px',
              marginTop: '8px',
              borderTop: isDarkMode ? '2px solid rgba(255,255,255,0.1)' : '2px solid #e2e8f0',
              fontSize: '1.05rem'
            }}>
              <span style={{ fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Total</span>
              <span style={{ fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleThermalPrint}
            style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem' }}
          >
            <i className="bi bi-printer me-1"></i> Thermal (80mm)
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleA4Print}
            style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem' }}
          >
            <i className="bi bi-printer me-1"></i> A4 Print
          </Button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Close
        </Button>
      </Modal.Footer>

      <div style={{ display: 'none' }}>
        <ThermalReceipt ref={printRef} order={order} />
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
