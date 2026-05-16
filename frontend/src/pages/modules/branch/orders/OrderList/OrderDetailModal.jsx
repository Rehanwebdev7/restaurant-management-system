import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Row, Col, Badge, Table } from 'react-bootstrap';
import ThermalReceipt from './ThermalReceipt';
import { ApiGet } from '../../../../../ApiServices/ApiServices';

const OrderDetailModal = ({ show, onClose, order: initialOrder }) => {
  const printRef = useRef();
  const [resolvedOrder, setResolvedOrder] = useState(initialOrder);
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!show || !initialOrder?.id) {
        setResolvedOrder(initialOrder);
        return;
      }

      const needsFetch = !Array.isArray(initialOrder.orderItems) || initialOrder.orderItems.length === 0;
      if (!needsFetch) {
        setResolvedOrder(initialOrder);
        return;
      }

      setLoadingOrder(true);
      try {
        const response = await ApiGet(`/api/branch/orders/${initialOrder.id}`);
        if (!cancelled && response.success) {
          setResolvedOrder(response.success.data?.data || initialOrder);
        } else if (!cancelled) {
          setResolvedOrder(initialOrder);
        }
      } catch (error) {
        if (!cancelled) {
          setResolvedOrder(initialOrder);
        }
      } finally {
        if (!cancelled) {
          setLoadingOrder(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [show, initialOrder]);

  const order = resolvedOrder || initialOrder;

  if (!order) return null;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Order type badge colors
  const orderTypeBadges = {
    'DINE_IN': { bg: 'primary', label: 'Dine In' },
    'ONLINE': { bg: 'success', label: 'Online' },
    'TAKEAWAY': { bg: 'warning', label: 'Takeaway' },
    'DELIVERY': { bg: 'info', label: 'Delivery' }
  };

  // Status badge colors
  const statusBadges = {
    'PENDING': { bg: 'warning', label: 'Pending' },
    'CONFIRMED': { bg: 'info', label: 'Confirmed' },
    'PREPARING': { bg: 'primary', label: 'Preparing' },
    'READY': { bg: 'success', label: 'Ready' },
    'OUT_FOR_DELIVERY': { bg: 'info', label: 'Out for Delivery' },
    'DELIVERED': { bg: 'success', label: 'Delivered' },
    'COMPLETED': { bg: 'success', label: 'Completed' },
    'CANCELLED': { bg: 'danger', label: 'Cancelled' }
  };

  // Payment status badge colors
  const paymentStatusBadges = {
    'PENDING': { bg: 'warning', label: 'Pending' },
    'PAID': { bg: 'success', label: 'Paid' },
    'FAILED': { bg: 'danger', label: 'Failed' },
    'REFUNDED': { bg: 'secondary', label: 'Refunded' }
  };

  // Handle thermal print
  const handleThermalPrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Receipt - ${order.orderNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 5mm;
              width: 70mm;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .receipt-header h2 {
              margin: 0;
              font-size: 16px;
            }
            .receipt-header p {
              margin: 2px 0;
              font-size: 10px;
            }
            .order-info {
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .order-info p {
              margin: 3px 0;
              font-size: 11px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .items-table th, .items-table td {
              text-align: left;
              padding: 3px 0;
              font-size: 11px;
            }
            .items-table th {
              border-bottom: 1px solid #000;
            }
            .items-table .qty { width: 15%; text-align: center; }
            .items-table .item { width: 55%; }
            .items-table .price { width: 30%; text-align: right; }
            .addon-row td {
              font-size: 10px;
              color: #666;
              padding-left: 10px;
            }
            .totals {
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .totals p {
              margin: 3px 0;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .totals .grand-total {
              font-size: 14px;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
              font-size: 10px;
            }
            .special-instructions {
              font-style: italic;
              font-size: 10px;
              color: #666;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Handle A4 print
  const handleA4Print = () => {
    const printContent = document.getElementById('order-detail-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Details - ${order.orderNumber}</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body { padding: 20px; font-family: Arial, sans-serif; }
            .badge { font-size: 12px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="xl"
      backdrop="static"
      keyboard={false}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-receipt me-2"></i>
          Order Details: {order.orderNumber}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body id="order-detail-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loadingOrder ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="text-center">
              <div className="spinner-border text-primary mb-2" role="status" />
              <div>Loading order details...</div>
            </div>
          </div>
        ) : (
          <>
            {/* Order Status Bar */}
            <div className="d-flex flex-wrap gap-2 mb-3 pb-3 border-bottom">
              <Badge bg={orderTypeBadges[order.orderType]?.bg || 'secondary'} className="px-3 py-2">
                {orderTypeBadges[order.orderType]?.label || order.orderType}
              </Badge>
              <Badge bg={statusBadges[order.status]?.bg || 'secondary'} className="px-3 py-2">
                Status: {statusBadges[order.status]?.label || order.status}
              </Badge>
              <Badge bg={paymentStatusBadges[order.paymentStatus]?.bg || 'secondary'} className="px-3 py-2">
                Payment: {paymentStatusBadges[order.paymentStatus]?.label || order.paymentStatus}
              </Badge>
              {order.paymentMethod && (
                <Badge bg="dark" className="px-3 py-2">
                  {order.paymentMethod}
                </Badge>
              )}
            </div>

            {/* Order Information */}
            <Row className="mb-3">
              <Col md={6}>
                <div className="border rounded p-3 h-100">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-person me-2"></i>Customer Information
                  </h6>
                  <p className="mb-1"><strong>Name:</strong> {order.customerName || '-'}</p>
                  <p className="mb-1"><strong>Phone:</strong> {order.customerPhone || '-'}</p>
                  <p className="mb-1"><strong>Email:</strong> {order.customerEmail || '-'}</p>
                  {order.tableNumber && (
                    <p className="mb-1"><strong>Table:</strong> {order.tableNumber}</p>
                  )}
                </div>
              </Col>
              <Col md={6}>
                <div className="border rounded p-3 h-100">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-info-circle me-2"></i>Order Information
                  </h6>
                  <p className="mb-1"><strong>Order #:</strong> {order.orderNumber}</p>
                  <p className="mb-1"><strong>Created:</strong> {formatDate(order.createdAt)}</p>
                  {order.completedAt && (
                    <p className="mb-1"><strong>Completed:</strong> {formatDate(order.completedAt)}</p>
                  )}
                  {order.estimatedTime && (
                    <p className="mb-1"><strong>Est. Time:</strong> {order.estimatedTime} mins</p>
                  )}
                </div>
              </Col>
            </Row>

            {/* Staff Information */}
            {(order.captainId || order.kitchenId || order.deliveryId || order.cashierId) && (
              <Row className="mb-3">
                <Col>
                  <div className="border rounded p-3">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-people me-2"></i>Staff Information
                    </h6>
                    <Row>
                      {order.captainId && (
                        <Col md={3}>
                          <p className="mb-1 small"><strong>Captain:</strong></p>
                          <p className="mb-0 small text-muted">{order.captainId.name}</p>
                        </Col>
                      )}
                      {order.kitchenId && (
                        <Col md={3}>
                          <p className="mb-1 small"><strong>Kitchen:</strong></p>
                          <p className="mb-0 small text-muted">{order.kitchenId.name}</p>
                        </Col>
                      )}
                      {order.deliveryId && (
                        <Col md={3}>
                          <p className="mb-1 small"><strong>Delivery:</strong></p>
                          <p className="mb-0 small text-muted">{order.deliveryId.name}</p>
                        </Col>
                      )}
                      {order.cashierId && (
                        <Col md={3}>
                          <p className="mb-1 small"><strong>Cashier:</strong></p>
                          <p className="mb-0 small text-muted">{order.cashierId.name}</p>
                        </Col>
                      )}
                    </Row>
                  </div>
                </Col>
              </Row>
            )}

            {/* Order Items */}
            <div className="border rounded p-3 mb-3">
              <h6 className="text-primary mb-3">
            <i className="bi bi-cart3 me-2"></i>Order Items ({order.orderItemsCount ?? order.orderItems?.length ?? 0})
              </h6>
              <Table bordered hover size="sm" className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems?.map((item, index) => (
                    <React.Fragment key={item.id || index}>
                      <tr>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{item.menuItemName}</strong>
                          {item.specialInstructions && (
                            <div className="text-muted small fst-italic">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">{formatCurrency(item.price)}</td>
                        <td className="text-end">{formatCurrency(item.itemTotal)}</td>
                      </tr>
                      {item.addonItems?.map((addon, addonIndex) => (
                        <tr key={`${item.id}-addon-${addonIndex}`} className="table-secondary">
                          <td></td>
                          <td className="ps-4 small text-muted">
                            <i className="bi bi-plus-circle me-1"></i>
                            {addon.name}
                          </td>
                          <td className="text-center small">{addon.quantity}</td>
                          <td className="text-end small">{formatCurrency(addon.price)}</td>
                          <td className="text-end small">
                            {formatCurrency(parseFloat(addon.price) * parseInt(addon.quantity))}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="border rounded p-3 mb-3 bg-warning bg-opacity-10">
                <h6 className="text-warning mb-2">
                  <i className="bi bi-exclamation-triangle me-2"></i>Special Instructions
                </h6>
                <p className="mb-0">{order.specialInstructions}</p>
              </div>
            )}

            {/* Order Totals */}
            <div className="border rounded p-3">
              <h6 className="text-primary mb-3">
                <i className="bi bi-calculator me-2"></i>Order Summary
              </h6>
              <Row>
                <Col md={6}></Col>
                <Col md={6}>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <strong>{formatCurrency(order.subtotal)}</strong>
                  </div>
                  {order.taxAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tax:</span>
                      <strong>{formatCurrency(order.taxAmount)}</strong>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount:</span>
                      <strong>-{formatCurrency(order.discountAmount)}</strong>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Delivery Fee:</span>
                      <strong>{formatCurrency(order.deliveryFee)}</strong>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="h5 mb-0">Total:</span>
                    <span className="h5 mb-0 text-primary">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </Col>
              </Row>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button variant="outline-primary" onClick={handleThermalPrint} className="me-2" disabled={loadingOrder}>
            <i className="bi bi-printer me-1"></i> Thermal Print (80mm)
          </Button>
          <Button variant="outline-secondary" onClick={handleA4Print} disabled={loadingOrder}>
            <i className="bi bi-file-earmark me-1"></i> A4 Print
          </Button>
        </div>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>

      {/* Hidden Thermal Receipt for printing */}
      <div style={{ display: 'none' }}>
        <ThermalReceipt ref={printRef} order={order} />
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
