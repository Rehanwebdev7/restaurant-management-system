import React, { useState } from 'react';
import '../../../../../../styles/modals.css';

const AddTryForPaymentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    customerPhone: '',
    amount: '',
    paymentAttempts: '',
    lastAttemptDate: '',
    paymentMethod: '',
    status: '',
  });

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
    setFormData({
      orderId: '',
      customerName: '',
      customerPhone: '',
      amount: '',
      paymentAttempts: '',
      lastAttemptDate: '',
      paymentMethod: '',
      status: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Payment Attempt</h2>
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
            <label htmlFor="customerPhone">Customer Phone</label>
            <input
              type="tel"
              id="customerPhone"
              name="customerPhone"
              value={formData.customerPhone}
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
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="paymentAttempts">Payment Attempts</label>
            <input
              type="number"
              id="paymentAttempts"
              name="paymentAttempts"
              value={formData.paymentAttempts}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastAttemptDate">Last Attempt Date</label>
            <input
              type="datetime-local"
              id="lastAttemptDate"
              name="lastAttemptDate"
              value={formData.lastAttemptDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="retrying">Retrying</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTryForPaymentModal;
