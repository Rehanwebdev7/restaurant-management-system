import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // Center of India

const mapContainerStyle = {
  width: '100%',
  height: '340px',
  borderRadius: '18px',
  overflow: 'hidden',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12)',
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  fullscreenControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  clickableIcons: false,
  styles: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#1f2937' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#b0b8c5' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#e6ecf5' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#64748b' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#d9f2e6' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#2f855a' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#64748b' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#cbd5f5' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#334155' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#e2e8f0' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#cdeafb' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#1e3a8a' }],
    },
  ],
};

const cardStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 22px 48px rgba(15, 23, 42, 0.12)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const titleStyle = {
  margin: 0,
  fontWeight: 700,
  color: '#0f172a',
  fontSize: '1.05rem',
  letterSpacing: '-0.02em',
};

const subtitleStyle = {
  fontSize: '0.9rem',
  color: '#64748b',
  lineHeight: 1.5,
};

const controlRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  alignItems: 'center',
};

const inputWrapperStyle = {
  position: 'relative',
  flex: '1 1 320px',
  minWidth: '260px',
};

const inputStyle = {
  width: '100%',
  padding: '14px 18px 14px 52px',
  borderRadius: '14px',
  border: '1px solid rgba(37, 99, 235, 0.15)',
  background: '#f8fafc',
  fontSize: '0.95rem',
  color: '#0f172a',
  fontWeight: 500,
  boxShadow: '0 10px 24px rgba(37, 99, 235, 0.08)',
  outline: 'none',
  transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
};

const iconStyle = {
  position: 'absolute',
  left: '18px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#64748b',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
};

const actionButtonStyle = (disabled) => ({
  padding: '13px 24px',
  borderRadius: '14px',
  border: 'none',
  backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.75 : 1,
  boxShadow: '0 18px 32px rgba(79, 70, 229, 0.25)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
});

const helperRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const helperTextStyle = {
  fontSize: '0.86rem',
  color: '#64748b',
};

const statusTextStyle = (color) => ({
  fontSize: '0.85rem',
  fontWeight: 600,
  color,
});

const LocationPickerMap = ({ latitude, longitude, onLocationSelect }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const [searchValue, setSearchValue] = useState('');
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState('');

  const parsedInitialPosition = useMemo(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)) {
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  const ensureGeocoder = useCallback(() => {
    if (!geocoderRef.current && window.google && window.google.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    return geocoderRef.current;
  }, []);

  const extractAddressFields = (result) => {
    if (!result) {
      return {};
    }

    const components = result.address_components || [];
    const getComponent = (types) =>
      components.find((component) =>
        types.some((type) => component.types.includes(type))
      )?.long_name || '';

    return {
      city:
        getComponent(['locality']) ||
        getComponent(['postal_town']) ||
        getComponent(['administrative_area_level_2']) ||
        '',
      state: getComponent(['administrative_area_level_1']) || '',
      pincode: getComponent(['postal_code']) || '',
    };
  };

  const forwardLocation = useCallback(
    (latLng, addressResult) => {
      if (!latLng) {
        return;
      }

      const formattedLatLng = {
        latitude: latLng.lat.toFixed(6),
        longitude: latLng.lng.toFixed(6),
      };

      const addressFields = extractAddressFields(addressResult);

      onLocationSelect({
        ...formattedLatLng,
        ...addressFields,
      });
    },
    [onLocationSelect]
  );

  const geocodeLatLng = useCallback(
    (latLng) => {
      const geocoder = ensureGeocoder();
      if (!geocoder || !latLng) {
        forwardLocation(latLng, null);
        return;
      }

      setIsGeocoding(true);
      setError('');

      geocoder.geocode({ location: latLng }, (results, status) => {
        setIsGeocoding(false);
        if (status === 'OK' && results && results.length > 0) {
          const [primary] = results;
          setSearchValue(primary.formatted_address || '');
          forwardLocation(latLng, primary);
        } else {
          let message = 'Unable to fetch address details. Try again.';
          if (status === 'ZERO_RESULTS') {
            message = 'Location selected but no address found. Please refine.';
          } else if (status === 'OVER_QUERY_LIMIT' || status === 'OVER_DAILY_LIMIT') {
            message =
              'Google geocoding quota exceeded for this API key. Try again later or increase your quota.';
          } else if (status === 'REQUEST_DENIED') {
            message =
              'Google geocoding request denied. Verify that billing is enabled and the Geocoding API is active for your API key.';
          } else if (status === 'INVALID_REQUEST') {
            message =
              'Google geocoding rejected the request. Please pick a different location or adjust the marker.';
          } else if (status === 'UNKNOWN_ERROR') {
            message = 'Temporary geocoding issue on Google’s side. Please retry in a moment.';
          }

          setError(`${message} (status: ${status || 'UNKNOWN'})`);
          forwardLocation(latLng, null);
        }
      });
    },
    [ensureGeocoder, forwardLocation]
  );

  const updatePosition = useCallback(
    (latLng, options = {}) => {
      if (!latLng || Number.isNaN(latLng.lat) || Number.isNaN(latLng.lng)) {
        return;
      }

      setPosition(latLng);

      if (mapRef.current) {
        const zoomLevel = options.zoom ?? 16;
        mapRef.current.panTo(latLng);
        mapRef.current.setZoom(zoomLevel);
      }

      geocodeLatLng(latLng);
    },
    [geocodeLatLng]
  );

  const handlePlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) {
      return;
    }

    const place = autocompleteRef.current.getPlace();

    if (!place || !place.geometry || !place.geometry.location) {
      setError('Could not get details for this place. Please pick from the map.');
      return;
    }

    const latLng = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setSearchValue(place.formatted_address || place.name || '');
    updatePosition(latLng, { zoom: 17 });
  }, [updatePosition]);

  const handleMapClick = useCallback(
    (event) => {
      if (!event?.latLng) {
        return;
      }

      const latLng = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      updatePosition(latLng, { zoom: 17 });
    },
    [updatePosition]
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser.');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latLng = { lat: coords.latitude, lng: coords.longitude };
        updatePosition(latLng, { zoom: 17 });
      },
      () => {
        setError('Unable to fetch your location. Please allow permission and try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      }
    );
  }, [updatePosition]);

  const handleInputFocus = (event) => {
    event.target.style.background = '#ffffff';
    event.target.style.boxShadow = '0 16px 32px rgba(37, 99, 235, 0.18)';
    event.target.style.borderColor = '#2563eb';
  };

  const handleInputBlur = (event) => {
    event.target.style.background = '#f8fafc';
    event.target.style.boxShadow = '0 10px 24px rgba(37, 99, 235, 0.08)';
    event.target.style.borderColor = 'rgba(37, 99, 235, 0.15)';
  };

  const handleMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      updatePosition(parsedInitialPosition, { zoom: 13 });
    },
    [parsedInitialPosition, updatePosition]
  );

  useEffect(() => {
    if (!isLoaded || !window.google || !window.google.maps) {
      return;
    }

    ensureGeocoder();
    updatePosition(parsedInitialPosition, { zoom: 13 });
  }, [ensureGeocoder, isLoaded, parsedInitialPosition, updatePosition]);

  if (loadError) {
    return (
      <div style={cardStyle}>
        <p style={titleStyle}>Google Maps unavailable</p>
        <span style={subtitleStyle}>
          We were unable to load Google Maps. Please check your API key or connection and try
          again.
        </span>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <p style={titleStyle}>Select business location</p>
        <span style={subtitleStyle}>
          Search for your shop or drop the pin. We’ll autofill city, state and pincode for you.
        </span>
      </div>

      <div style={controlRowStyle}>
        {isLoaded && (
          <Autocomplete
            onLoad={(ref) => {
              autocompleteRef.current = ref;
            }}
            onPlaceChanged={handlePlaceChanged}
            fields={['formatted_address', 'geometry']}
            restrictions={{ country: ['in'] }}
          >
            <div style={inputWrapperStyle}>
              <span style={iconStyle}>
                <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search your business location"
                aria-label="Search your business location"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </Autocomplete>
        )}

        <button
          type="button"
          style={actionButtonStyle(!isLoaded)}
          disabled={!isLoaded}
          onClick={handleUseCurrentLocation}
          onMouseDown={(event) => {
            event.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(event) => {
            event.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Use my location
        </button>
      </div>

      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={mapOptions}
          center={position}
          zoom={14}
          onClick={handleMapClick}
          onLoad={handleMapLoad}
        >
          <Marker
            position={position}
            draggable
            onDragEnd={(event) => {
              if (!event?.latLng) return;
              const latLng = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
              };
              updatePosition(latLng);
            }}
            icon={{
              url: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png',
              scaledSize: new window.google.maps.Size(36, 36),
            }}
          />
        </GoogleMap>
      ) : (
        <div
          style={{
            ...mapContainerStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)',
            color: '#334155',
            fontWeight: 600,
          }}
        >
          Loading Google Maps…
        </div>
      )}

      <div style={helperRowStyle}>
        <span style={helperTextStyle}>
          Drop or drag the pin to fine tune your shop location. Accurate details help with KYC.
        </span>
        {isGeocoding && <span style={statusTextStyle('#2563eb')}>Fetching address details…</span>}
        {error && !isGeocoding && <span style={statusTextStyle('#dc2626')}>{error}</span>}
      </div>
    </div>
  );
};

export default LocationPickerMap;

