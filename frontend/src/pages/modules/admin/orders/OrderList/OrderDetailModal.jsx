import React, { useRef } from 'react';
import { Modal, Button, Row, Col, Badge, Table } from 'react-bootstrap';
import ThermalReceipt from './ThermalReceipt';

const OrderDetailModal = ({ show, onClose, order }) => {
  const printRef = useRef();

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

  const typeBadge = { 'DINE_IN': 'primary', 'ONLINE': 'success', 'TAKEAWAY': 'warning', 'DELIVERY': 'info', 'FASTWAY': 'danger' };
  const statusBadge = { 'PENDING': 'warning', 'CREATED': 'info', 'CONFIRMED': 'info', 'WORKING': 'primary', 'PREPARING': 'primary', 'READY': 'success', 'OUT_FOR_DELIVERY': 'info', 'DELIVERED': 'success', 'COMPLETED': 'success', 'CANCELLED': 'danger' };
  const payBadge = { 'PENDING': 'warning', 'PAID': 'success', 'UNPAID': 'danger', 'FAILED': 'danger', 'REFUNDED': 'secondary' };

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

  return (
    <Modal show={show} onHide={onClose} size="lg" backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>
          <i className="bi bi-receipt me-2"></i>Order Details: {order.orderNumber}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body id="order-detail-content" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
        {/* Status Badges */}
        <div className="d-flex flex-wrap gap-2 mb-3 pb-2 border-bottom">
          <Badge bg={typeBadge[order.orderType] || 'secondary'} className="fw-normal" style={{ fontSize: '0.75rem' }}>Type: {order.orderType?.replace('_', ' ') || '-'}</Badge>
          <Badge bg={statusBadge[order.status] || 'secondary'} className="fw-normal" style={{ fontSize: '0.75rem' }}>Status: {order.status?.replace('_', ' ') || '-'}</Badge>
          <Badge bg={payBadge[order.paymentStatus] || 'secondary'} className="fw-normal" style={{ fontSize: '0.75rem' }}>Payment: {order.paymentStatus || '-'}</Badge>
          {order.paymentMethod && <Badge bg="dark" className="fw-normal" style={{ fontSize: '0.75rem' }}>Method: {order.paymentMethod}</Badge>}
          {order.tableNumber && <Badge bg="light" text="dark" className="fw-normal border" style={{ fontSize: '0.75rem' }}>Table: {order.tableNumber}</Badge>}
        </div>

        {/* Customer Info */}
        <div className="border rounded p-3 mb-3" style={{ fontSize: '0.85rem' }}>
          <h6 className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#333' }}>
            <i className="bi bi-person me-1"></i> Customer
          </h6>
          <div className="d-flex flex-wrap gap-4">
            <div><span style={{ color: '#888' }}>Name:</span> <strong>{order.customerName || '-'}</strong></div>
            <div><span style={{ color: '#888' }}>Phone:</span> <strong>{order.customerPhone || '-'}</strong></div>
            <div><span style={{ color: '#888' }}>Email:</span> <strong>{order.customerEmail || '-'}</strong></div>
            {order.deliveryAddress && <div><span style={{ color: '#888' }}>Address:</span> <strong>{order.deliveryAddress}</strong></div>}
          </div>
        </div>

        {/* Order Info */}
        <div className="border rounded p-3 mb-3" style={{ fontSize: '0.85rem' }}>
          <h6 className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#333' }}>
            <i className="bi bi-info-circle me-1"></i> Order Info
          </h6>
          <div className="d-flex flex-wrap gap-4">
            <div><span style={{ color: '#888' }}>Order #:</span> <strong>{order.orderNumber}</strong></div>
            <div><span style={{ color: '#888' }}>Created:</span> <strong>{formatDate(order.createdAt)}</strong></div>
            {order.completedAt && <div><span style={{ color: '#888' }}>Completed:</span> <strong>{formatDate(order.completedAt)}</strong></div>}
            {order.estimatedTime && <div><span style={{ color: '#888' }}>Est. Time:</span> <strong>{order.estimatedTime} mins</strong></div>}
            {order.branchId && <div><span style={{ color: '#888' }}>Branch:</span> <strong>{order.branchId.name || '-'}</strong></div>}
          </div>
        </div>

        {/* Staff Info */}
        {(order.captainId || order.kitchenId || order.deliveryId || order.cashierId) && (
          <div className="border rounded p-3 mb-3" style={{ fontSize: '0.85rem' }}>
            <h6 className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#333' }}>
              <i className="bi bi-people me-1"></i> Staff
            </h6>
            <div className="d-flex flex-wrap gap-3">
              {order.captainId && <div><span style={{ color: '#888' }}>Captain:</span> <strong>{order.captainId.name}</strong></div>}
              {order.kitchenId && <div><span style={{ color: '#888' }}>Kitchen:</span> <strong>{order.kitchenId.name}</strong></div>}
              {order.deliveryId && <div><span style={{ color: '#888' }}>Delivery:</span> <strong>{order.deliveryId.name}</strong></div>}
              {order.cashierId && <div><span style={{ color: '#888' }}>Cashier:</span> <strong>{order.cashierId.name}</strong></div>}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="border rounded mb-3" style={{ fontSize: '0.85rem' }}>
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style={{ background: '#f8f9fa' }}>
            <h6 className="fw-bold mb-0" style={{ fontSize: '0.85rem', color: '#333' }}>
              <i className="bi bi-cart3 me-1"></i> Items
            </h6>
            <small className="text-muted">{order.orderItems?.length || 0} items</small>
          </div>
          <Table hover size="sm" className="mb-0">
            <thead>
              <tr style={{ fontSize: '0.78rem', color: '#888' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>#</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Item</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Price</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems?.map((item, index) => (
                <React.Fragment key={item.id || index}>
                  <tr>
                    <td style={{ padding: '8px 12px' }}>{index + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <strong>{item.menuItemName}</strong>
                      {item.specialInstructions && (
                        <div className="text-muted small fst-italic">Note: {item.specialInstructions}</div>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.itemTotal)}</td>
                  </tr>
                  {item.addonItems?.map((addon, ai) => (
                    <tr key={`addon-${ai}`} style={{ background: '#fafafa' }}>
                      <td style={{ padding: '4px 12px' }}></td>
                      <td style={{ padding: '4px 12px', paddingLeft: '24px', color: '#888', fontSize: '0.8rem' }}>+ {addon.name}</td>
                      <td style={{ padding: '4px 12px', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>{addon.quantity}</td>
                      <td style={{ padding: '4px 12px', textAlign: 'right', color: '#888', fontSize: '0.8rem' }}>{formatCurrency(addon.price)}</td>
                      <td style={{ padding: '4px 12px', textAlign: 'right', color: '#888', fontSize: '0.8rem' }}>{formatCurrency(parseFloat(addon.price) * parseInt(addon.quantity))}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="border rounded p-3 mb-3 bg-warning bg-opacity-10" style={{ fontSize: '0.85rem' }}>
            <strong><i className="bi bi-chat-left-text me-1"></i> Special Instructions:</strong> {order.specialInstructions}
          </div>
        )}

        {/* Order Summary */}
        <div className="border rounded p-3" style={{ fontSize: '0.85rem' }}>
          <h6 className="fw-bold mb-2" style={{ fontSize: '0.85rem', color: '#333' }}>
            <i className="bi bi-calculator me-1"></i> Summary
          </h6>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ color: '#888', paddingBottom: '4px' }}>Subtotal</td>
                <td style={{ textAlign: 'right', paddingBottom: '4px', fontWeight: 500 }}>{formatCurrency(order.subtotal)}</td>
              </tr>
              {order.taxAmount > 0 && (
                <tr>
                  <td style={{ color: '#888', paddingBottom: '4px' }}>Tax</td>
                  <td style={{ textAlign: 'right', paddingBottom: '4px', fontWeight: 500 }}>{formatCurrency(order.taxAmount)}</td>
                </tr>
              )}
              {order.discountAmount > 0 && (
                <tr>
                  <td style={{ color: '#198754', paddingBottom: '4px' }}>Discount</td>
                  <td style={{ textAlign: 'right', paddingBottom: '4px', fontWeight: 500, color: '#198754' }}>-{formatCurrency(order.discountAmount)}</td>
                </tr>
              )}
              {order.deliveryFee > 0 && (
                <tr>
                  <td style={{ color: '#888', paddingBottom: '4px' }}>Delivery Fee</td>
                  <td style={{ textAlign: 'right', paddingBottom: '4px', fontWeight: 500 }}>{formatCurrency(order.deliveryFee)}</td>
                </tr>
              )}
              <tr><td colSpan="2"><hr className="my-2" /></td></tr>
              <tr>
                <td style={{ fontWeight: 700, fontSize: '1rem' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(order.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline-secondary" size="sm" onClick={handleThermalPrint}>
            <i className="bi bi-printer me-1"></i> Thermal (80mm)
          </Button>
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      </Modal.Footer>

      <div style={{ display: 'none' }}>
        <ThermalReceipt ref={printRef} order={order} />
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
