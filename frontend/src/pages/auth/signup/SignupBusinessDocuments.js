import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../../../components/auth/AuthLayout';
import { ApiPostFormData } from '../../../ApiServices/ApiServices';
import authServices from '../../../services/AuthServices';

const photoLabels = [
  { key: 'restaurantFront', label: 'Restaurant Front Photo', description: 'Clear photo of your restaurant entrance', acceptPdf: false },
  { key: 'restaurantInside', label: 'Restaurant Inside Photo', description: 'Interior view of your restaurant', acceptPdf: false },
  { key: 'restaurantBoard', label: 'Restaurant Board Photo', description: 'Photo of your restaurant name board', acceptPdf: false },
  { key: 'selfie', label: 'Selfie', description: 'Your selfie photo', acceptPdf: false },
  { key: 'visitingCard', label: 'Visiting Card', description: 'Your business card (if available)', acceptPdf: true },
  { key: 'otherDocument', label: 'Other Document', description: 'Any other relevant document (PDF supported)', acceptPdf: true },
];

const SignupBusinessDocuments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mobile, restaurantId, signupToken } = location.state || {};
  const [photos, setPhotos] = useState({
    restaurantFront: null,
    restaurantInside: null,
    restaurantBoard: null,
    selfie: null,
    visitingCard: null,
    otherDocument: null,
  });
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (!mobile) {
      navigate('/signup', { replace: true });
    }
  }, [mobile, navigate]);

  const handleFileChange = (key, file) => {
    if (file) {
      setPhotos(prev => ({ ...prev, [key]: file }));

      // Create preview for images, store file info for PDFs
      if (file.type === 'application/pdf') {
        setPreviews(prev => ({ ...prev, [key]: { isPdf: true, name: file.name } }));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({ ...prev, [key]: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemovePhoto = (key) => {
    setPhotos(prev => ({ ...prev, [key]: null }));
    setPreviews(prev => ({ ...prev, [key]: null }));
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key].value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check required photos (first 4 are required)
    const requiredPhotos = ['restaurantFront', 'restaurantInside', 'restaurantBoard', 'selfie'];
    const missingPhotos = requiredPhotos.filter(key => !photos[key]);

    if (missingPhotos.length > 0) {
      const missingLabels = missingPhotos.map(key =>
        photoLabels.find(p => p.key === key)?.label
      ).join(', ');
      toast.error(`Please upload: ${missingLabels}`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(photos).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      const token = authServices.getToken() || sessionStorage.getItem('signupToken') || '';
      const response = await ApiPostFormData('/signup/save-profile', formData);

      if (response.success) {
        const credentials = {
          mobile: response.success.mobile || mobile,
          uniqueId: response.success.uniqueId,
          password: response.success.password,
          pin: response.success.pin,
        };

        toast.success('Registration completed successfully');
        navigate('/signup/success', {
          state: { credentials }
        });
      } else {
        toast.error(response.fail || 'Registration failed');
      }
    } catch (error) {
      toast.error('Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadedCount = Object.values(photos).filter(Boolean).length;

  return (
    <AuthLayout
      title="Upload Photos"
      subtitle="Upload 6 photos to complete registration"
      onBack={() => navigate(-1)}
    >
      <form onSubmit={handleSubmit}>
        {/* Progress indicator */}
        <div style={{
          // marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--theme-background)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Upload Progress</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--theme-primary)' }}>
              {uploadedCount}/6 Photos
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e2e8f0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(uploadedCount / 6) * 100}%`,
              height: '100%',
              background: 'var(--theme-primary)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Photo upload grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {photoLabels.map(({ key, label, description, acceptPdf }, index) => {
            const isRequired = index < 4;
            const hasPhoto = photos[key];
            const preview = previews[key];
            const isPdfPreview = preview && typeof preview === 'object' && preview.isPdf;

            return (
              <div
                key={key}
                style={{
                  border: hasPhoto ? '2px solid var(--theme-primary)' : '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  background: hasPhoto ? 'rgba(var(--theme-primary-rgb), 0.05)' : '#ffffff',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {hasPhoto && preview ? (
                  <div style={{ position: 'relative' }}>
                    {isPdfPreview ? (
                      <div
                        style={{
                          width: '100%',
                          height: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <i className="bi bi-file-pdf" style={{ fontSize: '2rem', color: '#ef4444' }}></i>
                        <span style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.25rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.5rem' }}>
                          {preview.name}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={preview}
                        alt={label}
                        style={{
                          width: '100%',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '0.5rem'
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(key)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '80px',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    <i className={`bi ${acceptPdf ? 'bi-file-earmark-plus' : 'bi-camera'}`} style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}></i>
                    <span style={{ fontSize: '0.7rem', textAlign: 'center' }}>
                      {acceptPdf ? 'Image/PDF' : 'Click to upload'}
                    </span>
                    <input
                      type="file"
                      accept={acceptPdf ? 'image/*,.pdf' : 'image/*'}
                      ref={el => fileInputRefs.current[key] = el}
                      onChange={(e) => handleFileChange(key, e.target.files?.[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#334155'
                  }}>
                    {label}
                    {isRequired && <span style={{ color: 'red', marginLeft: '2px' }}>*</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{
          fontSize: '0.75rem',
          color: '#64748b',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <span style={{ color: 'red' }}>*</span> First 4 photos are required. Last 2 are optional (PDF supported).
        </p>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? 'Uploading...' : 'Complete Registration'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SignupBusinessDocuments;


