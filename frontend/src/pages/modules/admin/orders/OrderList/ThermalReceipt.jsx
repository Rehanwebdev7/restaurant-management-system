import React, { forwardRef } from 'react';

const ThermalReceipt = forwardRef(({ order }, ref) => {
  if (!order) return null;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date for receipt
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get restaurant name from order
  const restaurantName = order.restaurantId?.name || 'RMS';
  const branchName = order.branchId?.name || '';

  return (
    <div ref={ref} className="thermal-receipt">
      {/* Header */}
      <div className="receipt-header">
        <h2>{restaurantName}</h2>
        {branchName && <p>{branchName}</p>}
        <p>--------------------------------</p>
        <p style={{ fontWeight: 'bold', fontSize: '14px' }}>ORDER RECEIPT</p>
        <p>--------------------------------</p>
      </div>

      {/* Order Info */}
      <div className="order-info">
        <p><strong>Order #:</strong> {order.orderNumber}</p>
        <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
        <p><strong>Type:</strong> {order.orderType?.replace('_', ' ')}</p>
        {order.tableNumber && <p><strong>Table:</strong> {order.tableNumber}</p>}
        <p>--------------------------------</p>
        <p><strong>Customer:</strong> {order.customerName || 'Walk-in'}</p>
        {order.customerPhone && <p><strong>Phone:</strong> {order.customerPhone}</p>}
      </div>

      {/* Items */}
      <table className="items-table">
        <thead>
          <tr>
            <th className="qty">Qty</th>
            <th className="item">Item</th>
            <th className="price">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.orderItems?.map((item, index) => (
            <React.Fragment key={item.id || index}>
              <tr>
                <td className="qty">{item.quantity}</td>
                <td className="item">{item.menuItemName}</td>
                <td className="price">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
              {item.addonItems?.map((addon, addonIndex) => (
                <tr key={`addon-${addonIndex}`} className="addon-row">
                  <td className="qty">{addon.quantity}</td>
                  <td className="item">+ {addon.name}</td>
                  <td className="price">{formatCurrency(parseFloat(addon.price) * parseInt(addon.quantity))}</td>
                </tr>
              ))}
              {item.specialInstructions && (
                <tr className="addon-row">
                  <td colSpan="3" className="special-instructions">
                    * {item.specialInstructions}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '5px' }}>
          <p style={{ fontSize: '10px', fontStyle: 'italic' }}>
            <strong>Note:</strong> {order.specialInstructions}
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="totals">
        <p>
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </p>
        {order.taxAmount > 0 && (
          <p>
            <span>Tax:</span>
            <span>{formatCurrency(order.taxAmount)}</span>
          </p>
        )}
        {order.discountAmount > 0 && (
          <p>
            <span>Discount:</span>
            <span>-{formatCurrency(order.discountAmount)}</span>
          </p>
        )}
        {order.deliveryFee > 0 && (
          <p>
            <span>Delivery Fee:</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </p>
        )}
        <p className="grand-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </p>
      </div>

      {/* Payment Info */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginTop: '10px' }}>
        <p style={{ margin: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span>Payment:</span>
          <span>{order.paymentMethod || 'N/A'}</span>
        </p>
        <p style={{ margin: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span>Status:</span>
          <span>{order.paymentStatus}</span>
        </p>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>--------------------------------</p>
        <p>Thank you for your order!</p>
        <p>Visit us again</p>
        <p>--------------------------------</p>
        <p style={{ fontSize: '9px' }}>
          Printed: {new Date().toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
