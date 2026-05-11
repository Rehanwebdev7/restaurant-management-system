import React, { useState, useEffect } from 'react';
import '../../../../../../styles/modals.css';

const EditSubCategoryModal = ({ isOpen, onClose, onSubmit, subCategoryData }) => {
  const [formData, setFormData] = useState({
    subCategoryName: '',
    subCategoryCode: '',
    parentCategory: '',
    description: '',
    image: '',
    displayOrder: '',
    status: 'active',
  });

  useEffect(() => {
    if (subCategoryData) {
      setFormData(subCategoryData);
    }
  }, [subCategoryData]);

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
          <h2>Edit Sub Category</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="subCategoryName">Sub Category Name</label>
            <input
              type="text"
              id="subCategoryName"
              name="subCategoryName"
              value={formData.subCategoryName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="subCategoryCode">Sub Category Code</label>
            <input
              type="text"
              id="subCategoryCode"
              name="subCategoryCode"
              value={formData.subCategoryCode}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="parentCategory">Parent Category</label>
            <input
              type="text"
              id="parentCategory"
              name="parentCategory"
              value={formData.parentCategory}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label htmlFor="image">Image URL</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="displayOrder">Display Order</label>
            <input
              type="number"
              id="displayOrder"
              name="displayOrder"
              value={formData.displayOrder}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Sub Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSubCategoryModal;
