import React, { useState, useEffect } from 'react';
import '../../../../../styles/modals.css';

const EditCancelledOrderModal = ({ isOpen, onClose, onSubmit, orderData }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    amount: '',
    reason: '',
    cancelledDate: '',
  });

  useEffect(() => {
    if (orderData) {
      setFormData(orderData);
    }
  }, [orderData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Cancelled Order</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="orderId">Order ID</label>
            <input
              type="text"
              id="orderId"
              name="orderId"
              value={formData.orderId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reason">Cancellation Reason</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cancelledDate">Cancelled Date</label>
            <input
              type="date"
              id="cancelledDate"
              name="cancelledDate"
              value={formData.cancelledDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCancelledOrderModal;
