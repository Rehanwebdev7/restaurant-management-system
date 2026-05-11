import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';
import apiClient from '../../../api/apiClient';
import { toast } from 'react-toastify';

const LocationPage = () => {
  const navigate = useNavigate();
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#667eea';
  const logoUrl = theme.logoUrl || '/app-favicon.svg';
  const restaurantName = theme.restaurantName || 'RMS';

  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [locating, setLocating] = useState(false);
  const locationSelectedRef = useRef(false);
  const debounceRef = useRef(null);

  // First-time popup
  useEffect(() => {
    const hasVisited = localStorage.getItem('locationPageVisited');
    if (!hasVisited) {
      localStorage.setItem('locationPageVisited', 'true');
      setTimeout(() => {
        toast.success('Your location has been selected.', {
          position: 'bottom-center',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
        });
      }, 500);
    }
  }, []);

  // Debounced location search
  useEffect(() => {
    if (locationSelectedRef.current) {
      locationSelectedRef.current = false;
      return;
    }
    if (!locationSearch || locationSearch.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchLocationApi(locationSearch);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [locationSearch]);

  const searchLocationApi = async (query) => {
    if (!query || query.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }
    try {
      setLocationSearchLoading(true);
      const response = await apiClient.get(`/api/public/customer/search?q=${encodeURIComponent(query.trim())}`);
      const data = response.data || [];
      setLocationSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching location:', error);
      setLocationSuggestions([]);
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const selectLocation = async (placeId, title) => {
    try {
      locationSelectedRef.current = true;
      setLocationSearch(title);
      setSelectedLocationName(title);
      setLocationSuggestions([]);

      const response = await apiClient.get(`/api/public/customer/details?placeId=${placeId}`);
      const { lat, lng } = response.data || {};
      if (lat && lng) {
        localStorage.removeItem('CustomerBranchId');
        localStorage.setItem('CustomerBranchLat', lat);
        localStorage.setItem('CustomerBranchLng', lng);
        localStorage.setItem('CustomerLocationName', title);
        toast.success('Location selected successfully!', { autoClose: 2000 });
        setTimeout(() => navigate('/menu'), 800);
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
      toast.error('Failed to get location details. Please try again.');
    }
  };

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        localStorage.removeItem('CustomerBranchId');
        localStorage.setItem('CustomerBranchLat', coords.latitude);
        localStorage.setItem('CustomerBranchLng', coords.longitude);
        localStorage.setItem('CustomerLocationName', 'Current Location');
        setLocating(false);
        toast.success('Current location selected!', { autoClose: 2000 });
        setTimeout(() => navigate('/menu'), 800);
      },
      () => {
        setLocating(false);
        toast.error('Unable to get your location. Please allow permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [navigate]);

  return (
    <div className="location-page">
      <style>{`
        .location-page {
          min-height: 100vh;
          background: #f8f9fa;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .location-page-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .location-page-back {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1rem;
          color: #334155;
          transition: all 0.2s ease;
        }
        .location-page-back:hover {
          border-color: ${primaryColor};
          color: ${primaryColor};
        }
        .location-page-logo {
          height: 36px;
          object-fit: contain;
        }
        .location-page-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        .location-page-body {
          max-width: 600px;
          margin: 0 auto;
          padding: 32px 20px;
        }
        .location-page-icon-wrap {
          text-align: center;
          margin-bottom: 24px;
        }
        .location-page-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${primaryColor}22, ${primaryColor}11);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: ${primaryColor};
          margin-bottom: 12px;
        }
        .location-page-heading {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px;
        }
        .location-page-subheading {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }
        .location-search-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          padding: 20px;
          margin-bottom: 16px;
        }
        .location-search-field {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          transition: all 0.2s ease;
        }
        .location-search-field:focus-within {
          border-color: ${primaryColor};
          background: #fff;
          box-shadow: 0 0 0 3px ${primaryColor}15;
        }
        .location-search-field i {
          color: ${primaryColor};
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .location-search-field input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.9rem;
          color: #1e293b;
        }
        .location-search-field input::placeholder {
          color: #94a3b8;
        }
        .location-search-field .clear-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 2px;
          font-size: 1rem;
          display: flex;
          align-items: center;
        }
        .location-search-field .clear-btn:hover {
          color: #64748b;
        }
        .location-suggestions-list-page {
          margin-top: 8px;
          max-height: 300px;
          overflow-y: auto;
        }
        .location-suggestion-item-page {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
          border-radius: 10px;
          transition: background 0.15s ease;
        }
        .location-suggestion-item-page:hover {
          background: #f1f5f9;
        }
        .location-suggestion-icon-page {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${primaryColor}12;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          flex-shrink: 0;
          color: ${primaryColor};
        }
        .location-suggestion-title-page {
          font-weight: 500;
          font-size: 0.875rem;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .location-suggestion-subtitle-page {
          font-size: 0.75rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }
        .location-current-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px;
          border: 1.5px dashed ${primaryColor}55;
          border-radius: 12px;
          background: ${primaryColor}08;
          color: ${primaryColor};
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .location-current-btn:hover {
          background: ${primaryColor}15;
          border-color: ${primaryColor};
        }
        .location-current-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .location-current-btn i {
          font-size: 1.1rem;
        }
        .location-or-divider {
          text-align: center;
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 500;
          margin: 16px 0;
          position: relative;
        }
        .location-or-divider::before,
        .location-or-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #e2e8f0;
        }
        .location-or-divider::before { left: 0; }
        .location-or-divider::after { right: 0; }
        @media (max-width: 480px) {
          .location-page-header {
            padding: 0 16px;
            height: 56px;
          }
          .location-page-body {
            padding: 20px 16px;
          }
          .location-page-icon-circle {
            width: 60px;
            height: 60px;
            font-size: 1.6rem;
          }
          .location-page-heading {
            font-size: 1.1rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="location-page-header">
        <button className="location-page-back" onClick={() => navigate('/menu')}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <img src={logoUrl} alt={restaurantName} className="location-page-logo" />
        <h1 className="location-page-title">Select Location</h1>
      </div>

      {/* Body */}
      <div className="location-page-body">
        <div className="location-page-icon-wrap">
          <div className="location-page-icon-circle">
            <i className="bi bi-geo-alt-fill"></i>
          </div>
          <h2 className="location-page-heading">Where are you?</h2>
          <p className="location-page-subheading">Search your area or use current location to find nearby branches</p>
        </div>

        {/* Search Card */}
        <div className="location-search-card">
          <div className="location-search-field">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search for area, street, landmark..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              autoFocus
            />
            {locationSearchLoading && (
              <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px', color: '#999' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
            {locationSearch && !locationSearchLoading && (
              <button className="clear-btn" onClick={() => { setLocationSearch(''); setLocationSuggestions([]); }}>
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          {locationSuggestions.length > 0 && (
            <div className="location-suggestions-list-page">
              {locationSuggestions.map((item, index) => (
                <div
                  key={index}
                  className="location-suggestion-item-page"
                  onClick={() => selectLocation(item.place_id, item.entity_title)}
                >
                  <div className="location-suggestion-icon-page">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="location-suggestion-title-page">{item.entity_title}</div>
                    <div className="location-suggestion-subtitle-page">{item.entity_subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="location-or-divider">OR</div>

        {/* Use Current Location */}
        <button className="location-current-btn" onClick={useCurrentLocation} disabled={locating}>
          <i className="bi bi-crosshair"></i>
          {locating ? 'Detecting location...' : 'Use my current location'}
        </button>
      </div>
    </div>
  );
};

export default LocationPage;
