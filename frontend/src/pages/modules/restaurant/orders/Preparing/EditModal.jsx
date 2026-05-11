import React, { useState, useEffect } from 'react';
import '../../../../../../styles/modals.css';

const EditPREPARING_ORDERModal = ({ isOpen, onClose, onSubmit, orderData }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    amount: '',
    productName: '',
    preparationStage: '',
    estimatedCompletion: '',
    assignedTo: '',
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
          <h2>Edit Preparing Order</h2>
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
            <label htmlFor="productName">Product Name</label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
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
            <label htmlFor="preparationStage">Preparation Stage</label>
            <select
              id="preparationStage"
              name="preparationStage"
              value={formData.preparationStage}
              onChange={handleChange}
              required
            >
              <option value="">Select Stage</option>
              <option value="initial">Initial</option>
              <option value="processing">Processing</option>
              <option value="quality-check">Quality Check</option>
              <option value="packaging">Packaging</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="assignedTo">Assigned To</label>
            <input
              type="text"
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="estimatedCompletion">Estimated Completion</label>
            <input
              type="datetime-local"
              id="estimatedCompletion"
              name="estimatedCompletion"
              value={formData.estimatedCompletion}
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

export default EditPREPARING_ORDERModal;
