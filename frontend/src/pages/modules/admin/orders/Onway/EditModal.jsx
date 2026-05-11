import React, { useState, useEffect } from 'react';
import '../../../../../../styles/modals.css';

const EditOnwayOrderModal = ({ isOpen, onClose, onSubmit, orderData }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    amount: '',
    currentLocation: '',
    estimatedDelivery: '',
    trackingNumber: '',
    deliveryAgent: '',
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
          <h2>Edit On-way Order</h2>
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
            <label htmlFor="currentLocation">Current Location</label>
            <input
              type="text"
              id="currentLocation"
              name="currentLocation"
              value={formData.currentLocation}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="trackingNumber">Tracking Number</label>
            <input
              type="text"
              id="trackingNumber"
              name="trackingNumber"
              value={formData.trackingNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryAgent">Delivery Agent</label>
            <input
              type="text"
              id="deliveryAgent"
              name="deliveryAgent"
              value={formData.deliveryAgent}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="estimatedDelivery">Estimated Delivery</label>
            <input
              type="datetime-local"
              id="estimatedDelivery"
              name="estimatedDelivery"
              value={formData.estimatedDelivery}
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

export default EditOnwayOrderModal;
