import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../../components/auth/AuthLayout';
import { API_BASE_URL } from '../../../utils/constants';

const initialState = {
  restaurantName: '',
  restaurantHeadAddress: '',
  mobileNumber: '',
  email: '',
  entityType: '',
  zipCode: '',
  einProof: null,
  businessRegistration: null,
  foodLicense: null,
  foodProtectionCertificate: null,
  addressProof: null,
  fireSafety: null,
  liquorLicense: null,
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
  tertiaryColor: '#f59e0b',
};

const entityTypes = [
  { value: '', label: 'Select Entity Type' },
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 's_corp', label: 'S-Corp' },
  { value: 'non_profit', label: 'Non-Profit' },
];

const SignupBusinessDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mobile, restaurantId, signupToken } = location.state || {};
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [fileNames, setFileNames] = useState({
    einProof: '',
    businessRegistration: '',
    foodLicense: '',
    foodProtectionCertificate: '',
    addressProof: '',
    fireSafety: '',
    liquorLicense: '',
  });

  const einProofRef = useRef(null);
  const businessRegistrationRef = useRef(null);
  const foodLicenseRef = useRef(null);
  const foodProtectionCertificateRef = useRef(null);
  const addressProofRef = useRef(null);
  const fireSafetyRef = useRef(null);
  const liquorLicenseRef = useRef(null);

  useEffect(() => {
    if (!mobile) {
      navigate('/signup', { replace: true });
    }
  }, [mobile, navigate]);

  const renderLabel = (text, { required = false, optional = false } = {}) => (
    <span>
      {text}
      {required && (
        <span style={{ color: 'red', marginLeft: 4 }} aria-hidden="true">
          *
        </span>
      )}
      {optional && (
        <span style={{ color: '#6b7280', marginLeft: 4 }}>(Optional)</span>
      )}
    </span>
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'zipCode') {
      const formatted = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === 'mobileNumber') {
      const formatted = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    // Handle color inputs
    if (name === 'primaryColor' || name === 'secondaryColor' || name === 'tertiaryColor') {
      let colorValue = value;
      // Add # if not present for text input
      if (colorValue && !colorValue.startsWith('#')) {
        colorValue = '#' + colorValue;
      }
      // Validate hex color format
      if (/^#[0-9A-Fa-f]{0,6}$/.test(colorValue) || colorValue === '') {
        setFormData((prev) => ({ ...prev, [name]: colorValue }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      setFormData((prev) => ({ ...prev, [fieldName]: file }));
      setFileNames((prev) => ({ ...prev, [fieldName]: file.name }));
    }
  };

  const removeFile = (fieldName, inputRef) => {
    setFormData((prev) => ({ ...prev, [fieldName]: null }));
    setFileNames((prev) => ({ ...prev, [fieldName]: '' }));
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.restaurantName || !formData.restaurantHeadAddress || !formData.mobileNumber ||
        !formData.email || !formData.entityType || !formData.zipCode ||
        !formData.einProof || !formData.businessRegistration ||
        !formData.foodLicense || !formData.foodProtectionCertificate || !formData.addressProof) {
      toast.error('Please fill all required fields and upload required documents');
      setLoading(false);
      return;
    }

    try {
      // Prepare payload JSON
      const payload = {
        restaurantName: formData.restaurantName,
        address: formData.restaurantHeadAddress,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        entityType: formData.entityType,
        pincode: formData.zipCode,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        tertiaryColor: formData.tertiaryColor,
      };

      // Create FormData and append payload as JSON string
      const formDataToSend = new FormData();
      formDataToSend.append('payload', JSON.stringify(payload));

      // Append US documents
      if (formData.einProof) formDataToSend.append('einProof', formData.einProof);
      if (formData.businessRegistration) formDataToSend.append('businessRegistration', formData.businessRegistration);
      if (formData.foodLicense) formDataToSend.append('foodLicense', formData.foodLicense);
      if (formData.foodProtectionCertificate) formDataToSend.append('foodProtectionCertificate', formData.foodProtectionCertificate);
      if (formData.addressProof) formDataToSend.append('addressProof', formData.addressProof);
      if (formData.fireSafety) formDataToSend.append('fireSafety', formData.fireSafety);
      if (formData.liquorLicense) formDataToSend.append('liquorLicense', formData.liquorLicense);

      const response = await fetch(`${API_BASE_URL}/signup/save-profile`, {
        method: 'POST',
        headers: {
          'access_token': signupToken,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.Status === 'SUCCESS' && data.StatusCode === 200) {
        toast.success(data.message || 'Restaurant details saved');
        navigate('/signup/business-documents', {
          state: { mobile, restaurantId, signupToken, restaurantDetails: formData }
        });
      } else {
        toast.error(data.message || 'Failed to save Restaurant details');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('Failed to save Restaurant details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFileUpload = (label, fieldName, inputRef, required = true) => (
    <div className="form-group">
      <label className="form-label">
        {renderLabel(label, { required })}
      </label>
      <div className="file-upload-container">
        <input
          type="file"
          ref={inputRef}
          onChange={(e) => handleFileChange(e, fieldName)}
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ display: 'none' }}
        />
        {fileNames[fieldName] ? (
          <div className="file-preview">
            <span className="file-name">{fileNames[fieldName]}</span>
            <button
              type="button"
              className="remove-file-btn"
              onClick={() => removeFile(fieldName, inputRef)}
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="upload-btn"
            onClick={() => inputRef.current?.click()}
          >
            Choose File
          </button>
        )}
        <small className="file-hint">Accepted formats: JPG, PNG, PDF (Max 5MB)</small>
      </div>
    </div>
  );

  return (
    <AuthLayout
      title="Restaurant Details"
      subtitle="Tell us about your restaurant business"
      onBack={() => navigate(-1)}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            {renderLabel('Restaurant Name', { required: true })}
          </label>
          <input
            type="text"
            className="form-input"
            name="restaurantName"
            value={formData.restaurantName}
            onChange={handleChange}
            placeholder="Enter restaurant name"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {renderLabel('Restaurant Head Address', { required: true })}
          </label>
          <textarea
            className="form-input"
            name="restaurantHeadAddress"
            value={formData.restaurantHeadAddress}
            onChange={handleChange}
            placeholder="Enter complete head office address"
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {renderLabel('Mobile Number', { required: true })}
          </label>
          <input
            type="tel"
            className="form-input"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {renderLabel('Email ID', { required: true })}
          </label>
          <input
            type="email"
            className="form-input"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {renderLabel('Type of Entity', { required: true })}
          </label>
          <select
            className="form-input"
            name="entityType"
            value={formData.entityType}
            onChange={handleChange}
            required
          >
            {entityTypes.map((type) => (
              <option key={type.value} value={type.value} disabled={type.value === ''}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {renderLabel('ZIP Code', { required: true })}
          </label>
          <input
            type="text"
            className="form-input"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="Enter 5-digit ZIP code"
            maxLength={5}
            required
          />
        </div>

        <div className="conditional-fields-notice">
          <p>Required Business Documents (USA)</p>
        </div>

        {renderFileUpload('EIN Proof', 'einProof', einProofRef)}
        {renderFileUpload('Business Registration Proof', 'businessRegistration', businessRegistrationRef)}
        {renderFileUpload('Food License', 'foodLicense', foodLicenseRef)}
        {renderFileUpload('Food Protection Certificate', 'foodProtectionCertificate', foodProtectionCertificateRef)}
        {renderFileUpload('Address Proof (Lease)', 'addressProof', addressProofRef)}
        {renderFileUpload('Fire Safety Certificate', 'fireSafety', fireSafetyRef, false)}
        {renderFileUpload('Liquor License', 'liquorLicense', liquorLicenseRef, false)}

        {/* Theme Colors Section */}
        <div className="color-section-header">
          <p>Theme Colors (Optional)</p>
        </div>

        <div className="color-picker-row">
          <div className="color-picker-group">
            <label className="form-label">
              {renderLabel('Primary Color', { optional: true })}
            </label>
            <div className="color-input-wrapper">
              <input
                type="color"
                className="color-picker"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
              />
              <input
                type="text"
                className="color-code-input"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                placeholder="#3b82f6"
                maxLength={7}
              />
            </div>
          </div>

          <div className="color-picker-group">
            <label className="form-label">
              {renderLabel('Secondary Color', { optional: true })}
            </label>
            <div className="color-input-wrapper">
              <input
                type="color"
                className="color-picker"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
              />
              <input
                type="text"
                className="color-code-input"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
                placeholder="#10b981"
                maxLength={7}
              />
            </div>
          </div>

          <div className="color-picker-group">
            <label className="form-label">
              {renderLabel('Tertiary Color', { optional: true })}
            </label>
            <div className="color-input-wrapper">
              <input
                type="color"
                className="color-picker"
                name="tertiaryColor"
                value={formData.tertiaryColor}
                onChange={handleChange}
              />
              <input
                type="text"
                className="color-code-input"
                name="tertiaryColor"
                value={formData.tertiaryColor}
                onChange={handleChange}
                placeholder="#f59e0b"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>

      <style>{`
        .file-upload-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .upload-btn {
          padding: 10px 20px;
          background-color: #f3f4f6;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          color: #374151;
          font-size: 14px;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }

        .file-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 15px;
          background-color: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 8px;
        }

        .file-name {
          font-size: 14px;
          color: #166534;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }

        .remove-file-btn {
          padding: 5px 12px;
          background-color: #fee2e2;
          border: none;
          border-radius: 4px;
          color: #dc2626;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
        }

        .remove-file-btn:hover {
          background-color: #fecaca;
        }

        .file-hint {
          color: #6b7280;
          font-size: 12px;
        }

        .conditional-fields-notice {
          background-color: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 16px 0;
        }

        .conditional-fields-notice p {
          margin: 0;
          color: #92400e;
          font-size: 14px;
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        select.form-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }

        textarea.form-input {
          resize: vertical;
          min-height: 80px;
        }

        .color-section-header {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 16px 0;
        }

        .color-section-header p {
          margin: 0;
          color: #0369a1;
          font-size: 14px;
          font-weight: 500;
        }

        .color-picker-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .color-picker-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .color-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
        }

        .color-picker {
          width: 36px;
          height: 36px;
          padding: 0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: none;
        }

        .color-picker::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .color-picker::-webkit-color-swatch {
          border: 2px solid #e5e7eb;
          border-radius: 6px;
        }

        .color-code-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13px;
          font-family: monospace;
          text-transform: uppercase;
          color: #374151;
          background: transparent;
        }

        @media (max-width: 600px) {
          .color-picker-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AuthLayout>
  );
};

export default SignupBusinessDetails;
