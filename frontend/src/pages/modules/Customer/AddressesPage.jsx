import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';
import { server_api } from '../../../utils/constants';
import axios from 'axios';
import apiClient from '../../../api/apiClient';

const AddressesPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';

  const [addresses, setAddresses] = useState([]);
  const [priorAddress, setPriorAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading', 'granted', 'denied', 'error'
  const [addressMapSearch, setAddressMapSearch] = useState('');
  const [addressMapSuggestions, setAddressMapSuggestions] = useState([]);
  const [showAddressMapSuggestions, setShowAddressMapSuggestions] = useState(false);
  const [addressMapSearchLoading, setAddressMapSearchLoading] = useState(false);
  const addressMapSelectedRef = useRef(false);
  const [newAddress, setNewAddress] = useState({
    addressType: 'Home',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    deliveryInstructions: '',
    latitude: 0,
    longitude: 0,
    isActive: true
  });

  const getToken = () => localStorage.getItem('customerToken');

  // Get user's geolocation
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location obtained:', { latitude, longitude });
        setUserLocation({ latitude, longitude });
        setLocationStatus('granted');
        // Update newAddress with location
        setNewAddress(prev => ({
          ...prev,
          latitude: latitude,
          longitude: longitude
        }));
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setLocationStatus('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Search location API for address map
  const searchAddressMapApi = async (query) => {
    if (!query || query.trim().length < 2) {
      setAddressMapSuggestions([]);
      setShowAddressMapSuggestions(false);
      return;
    }
    try {
      setAddressMapSearchLoading(true);
      const response = await apiClient.get(`/api/public/customer/search?q=${encodeURIComponent(query.trim())}`);
      const data = response.data || [];
      setAddressMapSuggestions(Array.isArray(data) ? data : []);
      setShowAddressMapSuggestions(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error('Error searching address map:', error);
      setAddressMapSuggestions([]);
    } finally {
      setAddressMapSearchLoading(false);
    }
  };

  // Parse address string into form fields
  const parseAddressToFields = (address) => {
    if (!address) return { addressLine1: '', addressLine2: '', landmark: '' };

    const parts = address.split(',').map(p => p.trim()).filter(Boolean);

    let landmark = '';
    let landmarkIndex = -1;
    // Extract landmark (part containing "near")
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].toLowerCase().includes('near')) {
        landmark = parts[i];
        landmarkIndex = i;
        break;
      }
    }

    const remaining = parts.filter((_, i) => i !== landmarkIndex);

    // Split: first half → Address Line 1, second half → Address Line 2
    const mid = Math.ceil(remaining.length / 2);
    const addressLine1 = remaining.slice(0, mid).join(', ');
    const addressLine2 = remaining.slice(mid).join(', ');

    return { addressLine1, addressLine2, landmark };
  };

  // Select a location from address map suggestions
  const selectAddressMapLocation = async (placeId, title) => {
    try {
      addressMapSelectedRef.current = true;
      setAddressMapSearch(title);
      setShowAddressMapSuggestions(false);
      setAddressMapSuggestions([]);

      const response = await apiClient.get(`/api/public/customer/details?placeId=${placeId}`);
      const { lat, lng, address } = response.data || {};
      if (lat && lng) {
        const parsed = parseAddressToFields(address || title);
        setNewAddress(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          addressLine1: parsed.addressLine1,
          addressLine2: parsed.addressLine2,
          landmark: parsed.landmark
        }));
        setLocationStatus('granted');
      }
    } catch (error) {
      console.error('Error fetching address map details:', error);
    }
  };

  // Debounced address map search
  useEffect(() => {
    if (addressMapSelectedRef.current) {
      addressMapSelectedRef.current = false;
      return;
    }
    if (!addressMapSearch || addressMapSearch.trim().length < 2) {
      setAddressMapSuggestions([]);
      setShowAddressMapSuggestions(false);
      return;
    }
    const timer = setTimeout(() => {
      searchAddressMapApi(addressMapSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [addressMapSearch]);

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${server_api()}/api/customer/customer_delivery_addresses/getAddress`,
        {
          headers: {
            'access_token': token
          }
        }
      );

      if (response.data.Status === 'SUCCESS') {
        const data = response.data.data;
        setPriorAddress(data.priorAddress || null);
        setAddresses(data.otherAddresses || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    // Check if customer is logged in
    const customerData = localStorage.getItem('customerData');
    if (!customerData) {
      navigate('/login');
      return;
    }

    fetchAddresses();
  }, [navigate]);

  const getAddressIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'home': return 'bi-house-door';
      case 'work': return 'bi-briefcase';
      case 'office': return 'bi-building';
      default: return 'bi-geo-alt';
    }
  };

  // Add new address
  const handleAddAddress = async () => {
    if (!newAddress.addressLine1) {
      alert('Please enter address');
      return;
    }

    try {
      setSaving(true);
      const token = getToken();

      const response = await axios.post(
        `${server_api()}/api/customer/customer_delivery_addresses/add`,
        {
          addressType: newAddress.addressType,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2,
          landmark: newAddress.landmark,
          deliveryInstructions: newAddress.deliveryInstructions,
          latitude: newAddress.latitude || 0,
          longitude: newAddress.longitude || 0,
          isActive: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': token
          }
        }
      );

      if (response.data.Status === 'SUCCESS') {
        setShowAddModal(false);
        resetForm();
        fetchAddresses();
      } else {
        alert(response.data.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update address
  const handleUpdateAddress = async () => {
    if (!newAddress.addressLine1) {
      alert('Please enter address');
      return;
    }

    try {
      setSaving(true);
      const token = getToken();

      const response = await axios.put(
        `${server_api()}/api/customer/customer_delivery_addresses/update`,
        {
          id: editingAddress.id,
          addressType: newAddress.addressType,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2,
          landmark: newAddress.landmark,
          deliveryInstructions: newAddress.deliveryInstructions,
          latitude: newAddress.latitude || editingAddress.latitude || 0,
          longitude: newAddress.longitude || editingAddress.longitude || 0,
          isActive: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': token
          }
        }
      );

      if (response.data.Status === 'SUCCESS') {
        setShowAddModal(false);
        setEditingAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        alert(response.data.message || 'Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const token = getToken();

      const response = await axios.delete(
        `${server_api()}/api/admin/customer_delivery_addresses/delete/${id}`,
        {
          headers: {
            'access_token': token
          }
        }
      );

      if (response.data.Status === 'SUCCESS') {
        fetchAddresses();
      } else {
        alert(response.data.message || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address. Please try again.');
    }
  };

  // Open edit modal
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress({
      addressType: address.addressType || 'Home',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || '',
      deliveryInstructions: address.deliveryInstructions || '',
      latitude: address.latitude,
      longitude: address.longitude,
      isActive: address.isActive
    });
    setShowAddModal(true);
  };

  // Reset form
  const resetForm = () => {
    setNewAddress({
      addressType: 'Home',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      deliveryInstructions: '',
      latitude: userLocation.latitude || 0,
      longitude: userLocation.longitude || 0,
      isActive: true
    });
    setEditingAddress(null);
    setAddressMapSearch('');
    setAddressMapSuggestions([]);
    setShowAddressMapSuggestions(false);
  };

  // Open add modal with location
  const openAddModal = () => {
    resetForm();
    getUserLocation();
    setShowAddModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  // Render address card
  const renderAddressCard = (address, isPrior = false) => (
    <div key={address.id} className={`address-card ${isPrior ? 'prior' : ''}`}>
      <div className="address-icon">
        <i className={`bi ${getAddressIcon(address.addressType)}`}></i>
      </div>
      <div className="address-details">
        <div className="address-type-row">
          <span className="address-type">{address.addressType}</span>
          {isPrior && <span className="default-badge">Default</span>}
        </div>
        <div className="address-text">{address.addressLine1}</div>
        {address.addressLine2 && <div className="address-text">{address.addressLine2}</div>}
        {address.landmark && (
          <div className="address-landmark">
            <i className="bi bi-pin-map"></i> {address.landmark}
          </div>
        )}
        {address.deliveryInstructions && (
          <div className="address-instructions">
            <i className="bi bi-info-circle"></i> {address.deliveryInstructions}
          </div>
        )}
      </div>
      <div className="address-actions">
        <button className="action-btn edit-btn" onClick={() => handleEditAddress(address)}>
          <i className="bi bi-pencil"></i>
        </button>
        <button className="action-btn delete-btn" onClick={() => handleDeleteAddress(address.id)}>
          <i className="bi bi-trash"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="addresses-page">
      <style>{`
        .addresses-page {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .addresses-header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%);
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .header-title {
          color: white;
          font-size: 20px;
          font-weight: 600;
        }

        .add-btn {
          background: white;
          border: none;
          color: ${primaryColor};
          padding: 10px 20px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s;
        }

        .add-btn:hover {
          transform: scale(1.05);
        }

        .addresses-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .addresses-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 25px;
        }

        .address-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
          display: flex;
          gap: 15px;
        }

        .address-card.prior {
          border: 2px solid ${primaryColor}30;
          background: ${primaryColor}05;
        }

        .address-icon {
          width: 50px;
          height: 50px;
          background: ${primaryColor}10;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .address-icon i {
          font-size: 24px;
          color: ${primaryColor};
        }

        .address-details {
          flex: 1;
        }

        .address-type-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .address-type {
          font-size: 14px;
          font-weight: 600;
          color: ${primaryColor};
          text-transform: capitalize;
        }

        .default-badge {
          background: ${primaryColor};
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 10px;
          text-transform: uppercase;
        }

        .address-text {
          font-size: 14px;
          color: #333;
          line-height: 1.5;
        }

        .address-landmark {
          font-size: 13px;
          color: #666;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .address-landmark i {
          color: ${primaryColor};
        }

        .address-instructions {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-style: italic;
        }

        .address-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
        }

        .edit-btn {
          color: ${primaryColor};
          background: ${primaryColor}10;
        }

        .edit-btn:hover {
          background: ${primaryColor}20;
        }

        .delete-btn {
          color: #ef4444;
          background: #ef444410;
        }

        .delete-btn:hover {
          background: #ef444420;
        }

        .empty-addresses {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
        }

        .empty-addresses-icon {
          width: 100px;
          height: 100px;
          background: ${primaryColor}10;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .empty-addresses-icon i {
          font-size: 48px;
          color: ${primaryColor};
        }

        .empty-addresses h3 {
          font-size: 20px;
          color: #333;
          margin-bottom: 8px;
        }

        .empty-addresses p {
          color: #666;
          margin-bottom: 24px;
        }

        .add-address-btn {
          background: ${primaryColor};
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .add-address-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px ${primaryColor}40;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f0f0f0;
          border-top-color: ${primaryColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .modal-close {
          background: #f0f0f0;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #666;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: ${primaryColor};
        }

        .form-textarea {
          resize: none;
          min-height: 80px;
        }

        .address-type-selector {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .type-option {
          flex: 1;
          min-width: 80px;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .type-option.selected {
          border-color: ${primaryColor};
          background: ${primaryColor}10;
        }

        .type-option i {
          font-size: 20px;
          display: block;
          margin-bottom: 4px;
          color: ${primaryColor};
        }

        .type-option span {
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 12px;
        }

        .btn-cancel {
          flex: 1;
          padding: 14px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
        }

        .btn-save {
          flex: 1;
          padding: 14px;
          border: none;
          background: ${primaryColor};
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Map & Location Search */
        .address-map-section {
          margin-bottom: 10px;
        }

        .address-map-container {
          width: 100%;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          background: #f0f0f0;
          margin-bottom: 10px;
        }

        .address-map-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .address-location-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #0369a133;
          border-top-color: #0369a1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .address-map-search-wrapper {
          position: relative;
        }

        .address-map-search-input {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8f9fa;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 10px 14px;
          transition: all 0.3s;
        }

        .address-map-search-input:focus-within {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 3px ${primaryColor}1a;
        }

        .address-map-search-input i.bi-geo-alt-fill {
          color: ${primaryColor};
          font-size: 16px;
        }

        .address-map-search-input input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          width: 100%;
          color: #333;
        }

        .address-map-search-input input::placeholder {
          color: #aaa;
        }

        .address-map-suggestions {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
        }

        .address-map-suggestion-item {
          padding: 10px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          border-bottom: 1px solid #f5f5f5;
          transition: background 0.2s;
        }

        .address-map-suggestion-item:hover {
          background: #fff5f5;
        }

        .address-map-suggestion-item:last-child {
          border-bottom: none;
        }

        .address-location-confirmed {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #f0fdf4;
          color: #15803d;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          margin-top: 8px;
        }

        @media (max-width: 480px) {
          .addresses-header {
            padding: 15px;
          }
          .add-btn span {
            display: none;
          }
          .add-btn {
            padding: 10px 14px;
          }
          .addresses-content {
            padding: 15px;
          }
          .address-card {
            padding: 15px;
            flex-wrap: wrap;
          }
          .address-actions {
            flex-direction: row;
            width: 100%;
            justify-content: flex-end;
            margin-top: 10px;
          }
        }
      `}</style>

      <div className="addresses-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <span className="header-title">Saved Addresses</span>
        </div>
        <button className="add-btn" onClick={openAddModal}>
          <i className="bi bi-plus-lg"></i>
          <span>Add New</span>
        </button>
      </div>

      <div className="addresses-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (priorAddress || addresses.length > 0) ? (
          <>
            {priorAddress && (
              <>
                <div className="section-title">Default Address</div>
                <div className="addresses-list">
                  {renderAddressCard(priorAddress, true)}
                </div>
              </>
            )}

            {addresses.length > 0 && (
              <>
                <div className="section-title">Other Addresses</div>
                <div className="addresses-list">
                  {addresses.map(address => renderAddressCard(address, false))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="empty-addresses">
            <div className="empty-addresses-icon">
              <i className="bi bi-geo-alt"></i>
            </div>
            <h3>No Saved Addresses</h3>
            <p>Add your delivery addresses for faster checkout</p>
            <button className="add-address-btn" onClick={openAddModal}>
              <i className="bi bi-plus-lg"></i>
              Add Address
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Address Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingAddress ? 'Edit Address' : 'Add New Address'}</span>
              <button className="modal-close" onClick={handleCloseModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* Map & Location Search */}
              <div className="address-map-section">
                <div className="address-map-container">
                  {newAddress.latitude && newAddress.longitude && newAddress.latitude !== 0 ? (
                    <iframe
                      title="Address Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0, borderRadius: '12px' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${newAddress.latitude},${newAddress.longitude}&z=16&output=embed`}
                    ></iframe>
                  ) : (
                    <div className="address-map-placeholder">
                      {locationStatus === 'loading' ? (
                        <>
                          <div className="address-location-spinner"></div>
                          <span>Getting your location...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-geo-alt" style={{ fontSize: '32px', color: '#ccc' }}></i>
                          <span style={{ color: '#999', fontSize: '13px' }}>Search a location below</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="address-map-search-wrapper">
                  <div className="address-map-search-input">
                    <i className="bi bi-geo-alt-fill"></i>
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={addressMapSearch}
                      onChange={(e) => setAddressMapSearch(e.target.value)}
                      onFocus={() => {
                        if (addressMapSuggestions.length > 0) setShowAddressMapSuggestions(true);
                      }}
                    />
                    {addressMapSearchLoading && (
                      <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px', color: '#999' }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    )}
                    {addressMapSearch && !addressMapSearchLoading && (
                      <button style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 0 }} onClick={() => { setAddressMapSearch(''); setAddressMapSuggestions([]); setShowAddressMapSuggestions(false); }}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  {showAddressMapSuggestions && (
                    <div className="address-map-suggestions">
                      {addressMapSuggestions.map((item, index) => (
                        <div
                          key={index}
                          className="address-map-suggestion-item"
                          onClick={() => selectAddressMapLocation(item.place_id, item.entity_title)}
                        >
                          <i className="bi bi-geo-alt" style={{ color: primaryColor, marginTop: '2px' }}></i>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{item.entity_title}</div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>{item.entity_subtitle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {locationStatus === 'granted' && newAddress.latitude !== 0 && (
                  <div className="address-location-confirmed">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Location selected</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Address Type</label>
                <div className="address-type-selector">
                  {['Home', 'Work', 'Office', 'Other'].map(type => (
                    <div
                      key={type}
                      className={`type-option ${newAddress.addressType === type ? 'selected' : ''}`}
                      onClick={() => setNewAddress({ ...newAddress, addressType: type })}
                    >
                      <i className={`bi ${type === 'Home' ? 'bi-house-door' : type === 'Work' ? 'bi-briefcase' : type === 'Office' ? 'bi-building' : 'bi-geo-alt'}`}></i>
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address Line 1 *</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="House/Flat No., Building, Street"
                  value={newAddress.addressLine1}
                  onChange={e => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Address Line 2</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Area, Colony (optional)"
                  value={newAddress.addressLine2}
                  onChange={e => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nearby landmark (optional)"
                  value={newAddress.landmark}
                  onChange={e => setNewAddress({ ...newAddress, landmark: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Instructions</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Call before delivery (optional)"
                  value={newAddress.deliveryInstructions}
                  onChange={e => setNewAddress({ ...newAddress, deliveryInstructions: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
              <button
                className="btn-save"
                onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="btn-spinner"></span>
                    Saving...
                  </>
                ) : (
                  editingAddress ? 'Update Address' : 'Save Address'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
