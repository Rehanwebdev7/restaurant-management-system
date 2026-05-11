import React, { useMemo, useState, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';
import ImageCropperModal from '../../components/common/ImageCropperModal';
import { useTheme } from '../../contexts/ThemeContext';
import { ApiPostFormData, ApiPut } from '../../ApiServices/ApiServices';
import { toast } from 'react-toastify';

const MyProfile = () => {
  const { primaryColor } = useTheme();
  const navigate = useNavigate();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isEditingParentMobile, setIsEditingParentMobile] = useState(false);
  const [parentMobileDraft, setParentMobileDraft] = useState('');

  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', mobile: '', address: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile photo states
  const [profilePhoto, setProfilePhoto] = useState(localStorage.getItem('profilePhoto') || '');
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const storedProfile = useMemo(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    const userObj = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}');
      } catch {
        return {};
      }
    })();

    return {
      mobile: localStorage.getItem('UserMobile') || userObj.mobile || '',
      email: userObj.email || localStorage.getItem('email') || '',
      fullName: localStorage.getItem('UserName') || userObj.name || '',
      address: localStorage.getItem('address') || userObj.address || '',
      occupation: localStorage.getItem('occupation') || '',
      role: localStorage.getItem('UserRole') || userObj.userType || '',
      userId: userObj.id || localStorage.getItem('UserId') || '',
      superDistributorName: localStorage.getItem('superDistributorName') || localStorage.getItem('superDistributor') || '',
      superDistributorMobile: localStorage.getItem('superDistributorMobile') || '',
      masterDistributorName: localStorage.getItem('masterDistributorName') || localStorage.getItem('masterDistributor') || '',
      masterDistributorMobile: localStorage.getItem('masterDistributorMobile') || '',
      distributorName: localStorage.getItem('distributorName') || '',
      distributorMobile: localStorage.getItem('distributorMobile') || '',
    };
  }, []);

  const profileData = {
    fullName: storedProfile.fullName || 'User',
    role: storedProfile.role ? storedProfile.role.replace(/_/g, ' ') : 'User',
    email: storedProfile.email || 'user@info.com',
    mobile: storedProfile.mobile || '',
    address: storedProfile.address || '',
    occupation: storedProfile.occupation || '',
  };

  const roleKey = storedProfile.role || '';
  const parentDetailFields = [];

  if (roleKey === 'master_distributor') {
    parentDetailFields.push({
      label: 'Super Distributor',
      name: storedProfile.superDistributorName || 'Super Distributor Name',
      mobile: storedProfile.superDistributorMobile || profileData.mobile
    });
  }

  if (roleKey === 'distributor') {
    parentDetailFields.push({
      label: 'Master Distributor',
      name: storedProfile.masterDistributorName || 'Master Distributor Name',
      mobile: storedProfile.masterDistributorMobile || profileData.mobile
    });
  }

  if (roleKey === 'retailer') {
    parentDetailFields.push({
      label: 'Distributor',
      name: storedProfile.distributorName || 'Distributor Name',
      mobile: storedProfile.distributorMobile || profileData.mobile
    });
  }

  // Profile photo handlers
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile, previewUrl) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', croppedFile);

      const result = await ApiPostFormData('/api/admin/business_setting/upload-profile-photo', formData);
      if (result.success) {
        const photoUrl = result.success.data?.data?.url || previewUrl;
        setProfilePhoto(photoUrl);
        localStorage.setItem('profilePhoto', photoUrl);
        // Dispatch event so Header can update
        window.dispatchEvent(new Event('profilePhotoUpdated'));
        toast.success('Profile photo updated successfully');
      } else {
        // Still show preview locally even if upload fails
        setProfilePhoto(previewUrl);
        localStorage.setItem('profilePhoto', previewUrl);
        window.dispatchEvent(new Event('profilePhotoUpdated'));
        toast.info('Photo saved locally');
      }
    } catch (err) {
      // Save locally as fallback
      setProfilePhoto(previewUrl);
      localStorage.setItem('profilePhoto', previewUrl);
      window.dispatchEvent(new Event('profilePhotoUpdated'));
      toast.info('Photo saved locally');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      fullName: profileData.fullName,
      mobile: profileData.mobile,
      address: profileData.address
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ fullName: '', mobile: '', address: '' });
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSavingProfile(true);
    try {
      const updateData = {
        name: editForm.fullName,
        mobile: editForm.mobile,
        address: editForm.address
      };

      const response = await ApiPut('/api/restaurant/users/update', updateData);

      if (response?.success) {
        localStorage.setItem('UserName', editForm.fullName);
        localStorage.setItem('UserMobile', editForm.mobile);
        localStorage.setItem('address', editForm.address);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        toast.error(response?.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Error updating profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleParentMobileEdit = (initialValue) => {
    setParentMobileDraft(initialValue || '');
    setIsEditingParentMobile(true);
  };

  const handleParentMobileSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('distributorMobile', parentMobileDraft);
      localStorage.setItem('superDistributorMobile', parentMobileDraft);
      localStorage.setItem('masterDistributorMobile', parentMobileDraft);
    }
    setIsEditingParentMobile(false);
  };

  const handleParentMobileCancel = () => {
    setIsEditingParentMobile(false);
  };

  const themeColor = primaryColor || '#4db7ec';

  return (
    <div className="profile-page container-fluid py-4">

      {/* Back Button */}
      <div className="mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>
      </div>

      <div className="row g-4 align-items-start">

        {/* Left — Profile Summary Card */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="profile-summary-card">
            <div className="profile-avatar-wrapper">
              {profilePhoto ? (
                <div className="profile-avatar-circle" style={{ overflow: 'hidden', padding: 0 }}>
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <i className="bi bi-person-fill" style={{ display: 'none', fontSize: '48px' }}></i>
                </div>
              ) : (
                <div className="profile-avatar-circle">
                  <i className="bi bi-person-fill"></i>
                </div>
              )}
              <button
                className="avatar-upload-btn"
                type="button"
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                title="Update profile photo"
              >
                {uploadingPhoto ? (
                  <span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }}></span>
                ) : (
                  <i className="bi bi-camera-fill"></i>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            <h2 className="profile-name">{profileData.fullName}</h2>
            <p className="profile-email">{profileData.email}</p>
            <span className="profile-role-badge">{profileData.role}</span>

            <div className="profile-actions">
              <button className="btn btn-outline-primary w-100" onClick={handleEditProfile}>
                <i className="bi bi-pencil-square me-2"></i>
                Edit Profile
              </button>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <i className="bi bi-shield-lock-fill me-2"></i>
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Right — Profile Details Card */}
        <div className="col-12 col-md-8 col-lg-9">
          <div className="profile-details-card">

            {/* Account Information */}
            <div className="card-section">
              <h5 className="section-title">
                <i className="bi bi-person-circle me-2" style={{ color: themeColor }}></i>
                Account Information
              </h5>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted small fw-semibold">Full Name</label>
                  <input type="text" className="form-control" value={profileData.fullName} readOnly />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted small fw-semibold">Email Address</label>
                  <input type="text" className="form-control" value={profileData.email} readOnly />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted small fw-semibold">Mobile Number</label>
                  <input type="text" className="form-control" value={profileData.mobile || '—'} readOnly />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted small fw-semibold">Role</label>
                  <input type="text" className="form-control text-capitalize" value={profileData.role} readOnly />
                </div>
                {profileData.address && (
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Address</label>
                    <textarea className="form-control" rows="2" value={profileData.address} readOnly />
                  </div>
                )}
              </div>
            </div>

            {/* Parent Details (if any) */}
            {parentDetailFields.length > 0 && (
              <div className="card-section">
                <h5 className="section-title">
                  <i className="bi bi-diagram-3 me-2" style={{ color: themeColor }}></i>
                  Parent Details
                </h5>
                <div className="row g-3">
                  {parentDetailFields.map((field, idx) => (
                    <React.Fragment key={idx}>
                      <div className="col-12 col-sm-6">
                        <label className="form-label text-muted small fw-semibold">{field.label} Name</label>
                        <input type="text" className="form-control" value={field.name} readOnly />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label text-muted small fw-semibold">{field.label} Mobile</label>
                        <input type="text" className="form-control" value={field.mobile} readOnly />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Security Section */}
            <div className="card-section">
              <h5 className="section-title">
                <i className="bi bi-shield-lock me-2" style={{ color: themeColor }}></i>
                Security
              </h5>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <p className="mb-1 fw-semibold">Password</p>
                  <small className="text-muted">Change your account password anytime</small>
                </div>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowChangePasswordModal(true)}
                >
                  <i className="bi bi-key me-1"></i>
                  Change Password
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      <Modal show={isEditing} onHide={handleCancelEdit} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil-square me-2" style={{ color: themeColor }}></i>
            Edit Profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Full Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={editForm.fullName}
                onChange={(e) => setEditForm(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={profileData.email}
                readOnly
                style={{ background: '#f8fafc', cursor: 'not-allowed' }}
                title="Email cannot be changed"
              />
              <small className="text-muted">Email cannot be changed</small>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Mobile Number <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter mobile number"
                value={editForm.mobile}
                onChange={(e) => setEditForm(p => ({ ...p, mobile: e.target.value }))}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter your address"
                value={editForm.address}
                onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))}
              ></textarea>
              <small className="text-muted">Include street, locality, city, state, and PIN code</small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-outline-secondary" onClick={handleCancelEdit} disabled={savingProfile}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            style={{ background: themeColor, borderColor: themeColor }}
          >
            {savingProfile ? (
              <><span className="spinner-border spinner-border-sm me-2" style={{ width: '14px', height: '14px' }}></span>Saving...</>
            ) : (
              <><i className="bi bi-check-circle me-2"></i>Save Changes</>
            )}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        show={showCropper}
        onHide={() => setShowCropper(false)}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title="Crop Profile Photo"
        primaryColor={themeColor}
      />

      <ChangePasswordModal
        show={showChangePasswordModal}
        handleClose={() => setShowChangePasswordModal(false)}
      />

    </div>
  );
};

export default MyProfile;
