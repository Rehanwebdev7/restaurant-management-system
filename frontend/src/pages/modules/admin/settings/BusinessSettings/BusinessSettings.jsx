import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Modal, Table, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut, ApiDelete, ApiPostFormData } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { applyThemeToCSS } from '../../../../../services/themeService';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';
import { extractDominantColor } from '../../../../../utils/colorExtractor';
import '../../../../../styles/tables.css';

const ENTITY_TYPES = [
  'Sole Proprietorship', 'Partnership', 'LLP', 'Private Limited',
  'Public Limited', 'Trust', 'Society', 'HUF', 'Others'
];

const COLOR_SWATCHES = [
  '#4db7ec', '#e74c3c', '#27ae60', '#5b2c6f', '#e67e22',
  '#00bcd4', '#e91e8f', '#8e44ad', '#1abc9c'
];

const BusinessSettings = () => {
  const { primaryColor, reloadTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // Main form data
  const [formData, setFormData] = useState({
    id: null,
    domainUrl: '',
    themeMode: 'light',
    primaryColor: '#4db7ec',
    secondaryColor: '#764ba2',
    tertiaryColor: '#40E0D0',
    fontColor: '#334155',
    fontName: 'Inter',
    fontSize: '14px',
    fontWeight: '400',
    logoUrl: '',
    faviconUrl: '',
    organisationName: '',
    businessName: '',
    authorisedPersonName: '',
    entityType: '',
    gstNumber: '',
    gstCertificateUrl: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    ambulanceNumber: '',
    googleMapEmbed: '',
    address: '',
    socialMediaLinks: { facebook: '', instagram: '', twitter: '', youtube: '' },
    googleRatingUrl: '',
    aboutUs: '',
    privacyPolicy: '',
    termsConditions: '',
    refundPolicy: '',
    cancellationPolicy: '',
    ourMission: '',
    ourVision: '',
    // Referral Settings
    referralAmount: '',
    referralEnabled: false,
    // Menu Filter Visibility
    filterRecommended: true,
    filterPopular: true,
    filterDiscount: true,
    filterFastServing: true,
    filterPrice: true,
    filterRating: true,
    filterVegNonveg: true,
  });

  // Password fields
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Team members
  const [teamMembers, setTeamMembers] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamModalMode, setTeamModalMode] = useState('add');
  const [teamFormData, setTeamFormData] = useState({
    id: null, name: '', designation: '', photoUrl: '', displayOrder: 0
  });
  const [teamLoading, setTeamLoading] = useState(false);

  // Marquee messages
  const [marqueeMessages, setMarqueeMessages] = useState([]);
  const [showMarqueeModal, setShowMarqueeModal] = useState(false);
  const [marqueeModalMode, setMarqueeModalMode] = useState('add');
  const [marqueeFormData, setMarqueeFormData] = useState({
    id: null, message: '', bgColor: '#1a1a2e', textColor: '#ffffff',
    speed: 10, fontWeight: '500', isActive: true, scheduleStart: '', scheduleEnd: '', displayOrder: 0
  });
  const [marqueeLoading, setMarqueeLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const marqueeTextareaRef = useRef(null);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Logo/Favicon URL input mode
  const [logoInputMode, setLogoInputMode] = useState('upload');
  const [faviconInputMode, setFaviconInputMode] = useState('upload');

  // Crop modal state
  const [showLogoCropper, setShowLogoCropper] = useState(false);
  const [showFaviconCropper, setShowFaviconCropper] = useState(false);
  const [tempLogoSrc, setTempLogoSrc] = useState(null);
  const [tempFaviconSrc, setTempFaviconSrc] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [extractedColor, setExtractedColor] = useState(null);
  const logoFileRef = useRef(null);
  const faviconFileRef = useRef(null);

  useEffect(() => {
    fetchBusinessSettings();
    fetchTeamMembers();
    fetchMarqueeMessages();
  }, []);

  const fetchBusinessSettings = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/admin/business_setting/get');
      if (result.success) {
        const data = result.success.data.data;
        if (data && data.id) {
          setFormData({
            id: data.id,
            domainUrl: data.domainUrl || '',
            themeMode: data.themeMode || 'light',
            primaryColor: data.primaryColor || '#4db7ec',
            secondaryColor: data.secondaryColor || '#764ba2',
            tertiaryColor: data.tertiaryColor || '#40E0D0',
            fontColor: data.fontColor || '#334155',
            fontName: data.fontName || 'Inter',
            fontSize: data.fontSize || '14px',
            fontWeight: data.fontWeight || '400',
            logoUrl: data.logoUrl || '',
            faviconUrl: data.faviconUrl || '',
            organisationName: data.organisationName || '',
            businessName: data.businessName || '',
            authorisedPersonName: data.authorisedPersonName || '',
            entityType: data.entityType || '',
            gstNumber: data.gstNumber || '',
            gstCertificateUrl: data.gstCertificateUrl || '',
            email: data.email || '',
            phone: data.phone || '',
            whatsappNumber: data.whatsappNumber || '',
            ambulanceNumber: data.ambulanceNumber || '',
            googleMapEmbed: data.googleMapEmbed || '',
            address: data.address || '',
            socialMediaLinks: (() => {
              const raw = data.socialMediaLinks;
              if (!raw) return { facebook: '', instagram: '', twitter: '', youtube: '' };
              if (typeof raw === 'object') return raw;
              try { return JSON.parse(raw); } catch { return { facebook: '', instagram: '', twitter: '', youtube: '' }; }
            })(),
            googleRatingUrl: data.googleRatingUrl || '',
            aboutUs: data.aboutUs || '',
            privacyPolicy: data.privacyPolicy || '',
            termsConditions: data.termsConditions || '',
            refundPolicy: data.refundPolicy || '',
            cancellationPolicy: data.cancellationPolicy || '',
            ourMission: data.ourMission || '',
            ourVision: data.ourVision || '',
            // Referral Settings
            referralAmount: data.referralAmount || data.refferalAmount || '',
            referralEnabled: data.referralEnabled !== undefined ? data.referralEnabled : false,
            // Menu Filter Visibility
            filterRecommended: data.filterRecommended !== undefined ? data.filterRecommended : true,
            filterPopular: data.filterPopular !== undefined ? data.filterPopular : true,
            filterDiscount: data.filterDiscount !== undefined ? data.filterDiscount : true,
            filterFastServing: data.filterFastServing !== undefined ? data.filterFastServing : true,
            filterPrice: data.filterPrice !== undefined ? data.filterPrice : true,
            filterRating: data.filterRating !== undefined ? data.filterRating : true,
            filterVegNonveg: data.filterVegNonveg !== undefined ? data.filterVegNonveg : true,
          });
        }
      }
    } catch (err) {
      toast.error('Failed to fetch business settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const result = await ApiGet('/api/admin/business_setting/team-members');
      if (result.success) {
        setTeamMembers(result.success.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch team members');
    }
  };

  const handleSave = async () => {
    if (logoUploading || faviconUploading) {
      toast.warning('Please wait — image is still uploading...');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData };
      const result = await ApiPost('/api/admin/business_setting/save', payload);
      if (result.success) {
        toast.success('Business settings saved successfully');
        const data = result.success.data.data;
        if (data && data.id) {
          setFormData(prev => ({ ...prev, id: data.id }));
        }
        // Immediately apply the new branding to CSS so the UI updates without reload
        applyThemeToCSS({
          primary: formData.primaryColor,
          secondary: formData.secondaryColor,
          tertiary: formData.tertiaryColor,
          fontColor: formData.fontColor,
          fontName: formData.fontName,
          fontSize: formData.fontSize,
          fontWeight: formData.fontWeight,
          logoUrl: formData.logoUrl,
          feviconUrl: formData.faviconUrl,
          restaurantName: formData.businessName,
        });
        // Reload theme from API so ThemeContext and all components get updated values
        reloadTheme();
      } else {
        toast.error(result.fail || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      socialMediaLinks: { ...prev.socialMediaLinks, [field]: value }
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ---- Logo / Favicon upload helpers ----
  const readFileAsDataUrl = (file) =>
    new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(file);
    });

  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const src = await readFileAsDataUrl(file);

    // Auto-extract dominant vibrant color from the logo
    extractDominantColor(src).then((color) => {
      if (color) {
        setExtractedColor(color);
        handleChange('primaryColor', color);
      }
    });

    setTempLogoSrc(src);
    setShowLogoCropper(true);
  };

  const handleLogoCropComplete = async (croppedFile) => {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', croppedFile);
      fd.append('type', 'logo');
      const result = await ApiPostFormData('/api/admin/business_setting/upload-image', fd);
      if (result.success) {
        const url = result.success.data?.data?.url || result.success.data?.url;
        if (url) {
          handleChange('logoUrl', url);
          toast.success('Logo uploaded successfully');
        }
      } else {
        toast.error(result.fail || 'Logo upload failed');
      }
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFaviconFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const src = await readFileAsDataUrl(file);
    setTempFaviconSrc(src);
    setShowFaviconCropper(true);
  };

  const handleFaviconCropComplete = async (croppedFile) => {
    setFaviconUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', croppedFile);
      fd.append('type', 'favicon');
      const result = await ApiPostFormData('/api/admin/business_setting/upload-image', fd);
      if (result.success) {
        const url = result.success.data?.data?.url || result.success.data?.url;
        if (url) {
          handleChange('faviconUrl', url);
          toast.success('Favicon uploaded successfully');
        }
      } else {
        toast.error(result.fail || 'Favicon upload failed');
      }
    } catch {
      toast.error('Favicon upload failed');
    } finally {
      setFaviconUploading(false);
    }
  };

  // Team Member CRUD
  const handleAddTeamMember = () => {
    setTeamModalMode('add');
    setTeamFormData({ id: null, name: '', designation: '', photoUrl: '', displayOrder: 0 });
    setShowTeamModal(true);
  };

  const handleEditTeamMember = (member) => {
    setTeamModalMode('edit');
    setTeamFormData({
      id: member.id,
      name: member.name || '',
      designation: member.designation || '',
      photoUrl: member.photoUrl || '',
      displayOrder: member.displayOrder || 0
    });
    setShowTeamModal(true);
  };

  const handleSaveTeamMember = async () => {
    if (!teamFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setTeamLoading(true);
    try {
      let result;
      if (teamModalMode === 'add') {
        result = await ApiPost('/api/admin/business_setting/team-member/add', teamFormData);
      } else {
        result = await ApiPut('/api/admin/business_setting/team-member/update', teamFormData);
      }
      if (result.success) {
        toast.success(`Team member ${teamModalMode === 'add' ? 'added' : 'updated'} successfully`);
        setShowTeamModal(false);
        fetchTeamMembers();
      } else {
        toast.error(result.fail || 'Operation failed');
      }
    } catch (err) {
      toast.error('Failed to save team member');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleDeleteTeamMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    try {
      const result = await ApiDelete(`/api/admin/business_setting/team-member/delete/${id}`);
      if (result.success) {
        toast.success('Team member deleted');
        fetchTeamMembers();
      } else {
        toast.error(result.fail || 'Delete failed');
      }
    } catch (err) {
      toast.error('Failed to delete team member');
    }
  };

  // ========== Marquee Messages ==========
  const fetchMarqueeMessages = async () => {
    try {
      const result = await ApiGet('/api/admin/business_setting/marquee-messages');
      if (result.success) {
        const raw = result.success.data.data;
        setMarqueeMessages(Array.isArray(raw) ? raw : (raw?.records || []));
      }
    } catch (err) {
      console.error('Failed to fetch marquee messages');
    }
  };

  const handleSaveMarqueeMessage = async () => {
    if (!marqueeFormData.message?.trim()) {
      toast.error('Message text is required');
      return;
    }
    setMarqueeLoading(true);
    try {
      const payload = { ...marqueeFormData };
      let result;
      if (marqueeModalMode === 'add') {
        result = await ApiPost('/api/admin/business_setting/marquee-message/add', payload);
      } else {
        result = await ApiPut('/api/admin/business_setting/marquee-message/update', payload);
      }
      if (result.success) {
        toast.success(marqueeModalMode === 'add' ? 'Marquee message added' : 'Marquee message updated');
        setShowMarqueeModal(false);
        fetchMarqueeMessages();
      } else {
        toast.error(result.fail || 'Save failed');
      }
    } catch (err) {
      toast.error('Failed to save marquee message');
    } finally {
      setMarqueeLoading(false);
    }
  };

  const handleDeleteMarqueeMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marquee message?')) return;
    try {
      const result = await ApiDelete(`/api/admin/business_setting/marquee-message/delete/${id}`);
      if (result.success) {
        toast.success('Marquee message deleted');
        fetchMarqueeMessages();
      } else {
        toast.error(result.fail || 'Delete failed');
      }
    } catch (err) {
      toast.error('Failed to delete marquee message');
    }
  };

  const handleToggleMarqueeActive = async (msg) => {
    try {
      const result = await ApiPut('/api/admin/business_setting/marquee-message/update', {
        id: msg.id, isActive: !msg.isActive
      });
      if (result.success) {
        fetchMarqueeMessages();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getMarqueeStatus = (msg) => {
    if (!msg.isActive) return { label: 'Inactive', variant: 'secondary' };
    const now = new Date();
    if (msg.scheduleStart && new Date(msg.scheduleStart) > now) return { label: 'Scheduled', variant: 'info' };
    if (msg.scheduleEnd && new Date(msg.scheduleEnd) < now) return { label: 'Expired', variant: 'warning' };
    return { label: 'Live', variant: 'success' };
  };

  // Section Header Component
  const SectionHeader = ({ icon, title, subtitle, sectionKey }) => (
    <div
      className="bs-section-header"
      onClick={() => toggleSection(sectionKey)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', cursor: 'pointer', borderBottom: expandedSections[sectionKey] ? `1px solid ${activePrimary}20` : 'none',
        transition: 'background 0.15s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
          background: `${activePrimary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${activePrimary}25`
        }}>
          <i className={icon} style={{ fontSize: '18px', color: activePrimary }}></i>
        </div>
        <div>
          <h5 style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>{title}</h5>
          {subtitle && <small style={{ color: '#6c757d', fontSize: '12px' }}>{subtitle}</small>}
        </div>
      </div>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px', background: `${activePrimary}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <i className={`bi bi-chevron-${expandedSections[sectionKey] ? 'up' : 'down'}`} style={{ fontSize: '13px', color: activePrimary }}></i>
      </div>
    </div>
  );

  // Emoji picker helper — insert at cursor position in marquee textarea
  const insertEmoji = (emoji) => {
    const ta = marqueeTextareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newMsg = marqueeFormData.message.substring(0, start) + emoji + marqueeFormData.message.substring(end);
      setMarqueeFormData(prev => ({ ...prev, message: newMsg }));
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }, 0);
    } else {
      setMarqueeFormData(prev => ({ ...prev, message: prev.message + emoji }));
    }
  };

  const EMOJI_GROUPS = [
    { label: '😊 Smileys', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🥰','😍','🤩','😘','😎','🤗','😋','😛','😜','🤪','😏','🙂'] },
    { label: '🎉 Celebration', emojis: ['🎉','🎊','🎈','🎁','🏆','🥇','🌟','⭐','💫','✨','🔥','💥','🎯','🚀','💪','👏','🙌','👍'] },
    { label: '🍕 Food', emojis: ['🍕','🍔','🍟','🌮','🌯','🍱','🍜','🍛','🍣','🍦','🎂','🍰','🧁','🍩','🍪','☕','🧋','🥤'] },
    { label: '💰 Business', emojis: ['💰','💵','💸','🛒','🏷️','📢','📣','🔔','💎','🆕','🆓','🔖','📦','🎪','⚡','✅','❤️','💯'] },
    { label: '➡️ Arrows', emojis: ['➡️','⬅️','⬆️','⬇️','↗️','↘️','🔄','▶️','⏩','🔝','👇','👈','👉','☝️','🔜','🔛'] },
  ];

  // Returns #000 or #fff whichever contrasts better against the given hex bg
  const contrastText = (hex) => {
    if (!hex) return '#ffffff';
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 160 ? '#1a1a2e' : '#ffffff';
  };

  // Reliable primary: prefer formData (always set after load), then ThemeContext, then fallback
  const activePrimary = formData.primaryColor || primaryColor || '#4db7ec';

  const sectionCardStyle = {
    borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginBottom: '20px', border: '1px solid rgba(128,128,128,0.15)', borderLeft: `3px solid ${activePrimary}`, overflow: 'hidden'
  };

  const labelStyle = {
    fontWeight: 600, fontSize: '11px', letterSpacing: '0.5px',
    textTransform: 'uppercase', color: '#374151', marginBottom: '6px'
  };

  const inputStyle = {
    border: 'none', borderBottom: '2px solid #e5e7eb', borderRadius: 0,
    padding: '10px 0', fontSize: '14px', background: 'transparent'
  };

  const subHeadingStyle = {
    color: primaryColor || '#4db7ec', fontWeight: 600, fontSize: '13px',
    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px',
    marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px'
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" style={{ color: primaryColor }} />
        <p className="mt-2">Loading business settings...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 bs-settings-container" style={{ maxWidth: '1100px', paddingBottom: '80px' }}>
      {/* Page Header */}
      <div className="mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${activePrimary}25, ${activePrimary}50)`, border: `1px solid ${activePrimary}40` }}>
            <i className="bi bi-building" style={{ fontSize: '20px', color: activePrimary }}></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Business Settings</h4>
            <small style={{ color: '#6c757d' }}>Admin / <span style={{ color: primaryColor || '#4db7ec' }}>Business Settings</span></small>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${activePrimary}18 0%, ${activePrimary}10 100%)`,
        borderLeft: `4px solid ${activePrimary}`,
        borderRadius: '8px', padding: '14px 20px', marginBottom: '24px', fontSize: '13px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        border: `1px solid ${activePrimary}30`, borderLeftWidth: '4px'
      }}>
        <i className="bi bi-info-circle-fill" style={{ color: activePrimary, fontSize: '16px', marginTop: '1px', flexShrink: 0 }}></i>
        <span style={{ fontWeight: 500, lineHeight: '1.5' }}>
          Your business data — including organisation details, compliance info, branding, and contact information — is managed here.
          Configure all settings from this single page.
        </span>
      </div>

      {/* 1. Marquee / Ticker */}
      <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-megaphone" title="Marquee / Ticker" subtitle="Scheduled scrolling announcements shown to customers" sectionKey="marquee" />
        {expandedSections.marquee && (
          <div>
            {/* Live Preview Strip */}
            {marqueeMessages.some(m => getMarqueeStatus(m).label === 'Live') ? (
              <div style={{ overflow: 'hidden', background: marqueeMessages.find(m => getMarqueeStatus(m).label === 'Live')?.bgColor || '#1a1a2e', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <style>{`
                  @keyframes marqueeScroll {
                    0% { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                  }
                  .marquee-live-text {
                    display: inline-block;
                    white-space: nowrap;
                    animation: marqueeScroll ${marqueeMessages.find(m => getMarqueeStatus(m).label === 'Live')?.speed || 30}s linear infinite;
                  }
                `}</style>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.15)', marginRight: '12px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80', animation: 'none' }}></span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>LIVE</span>
                  </div>
                  <span className="marquee-live-text" style={{ color: marqueeMessages.find(m => getMarqueeStatus(m).label === 'Live')?.textColor || '#fff', fontSize: '13px', fontWeight: 500, letterSpacing: '0.3px' }}>
                    {marqueeMessages.filter(m => getMarqueeStatus(m).label === 'Live').map(m => m.message).join('   •   ')}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', padding: '10px 20px', borderBottom: '1px solid #e8f0fe', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>No live messages — preview will appear here when a message is active</span>
              </div>
            )}

            <div style={{ padding: '24px' }}>
              {/* Stats + Add Button Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total', count: marqueeMessages.length, color: '#64748b', bg: 'rgba(100,116,139,0.15)', icon: 'bi-collection' },
                    { label: 'Live', count: marqueeMessages.filter(m => getMarqueeStatus(m).label === 'Live').length, color: '#16a34a', bg: 'rgba(22,163,74,0.15)', icon: 'bi-broadcast' },
                    { label: 'Scheduled', count: marqueeMessages.filter(m => getMarqueeStatus(m).label === 'Scheduled').length, color: '#0284c7', bg: 'rgba(2,132,199,0.15)', icon: 'bi-calendar-event' },
                    { label: 'Expired', count: marqueeMessages.filter(m => getMarqueeStatus(m).label === 'Expired').length, color: '#b45309', bg: 'rgba(180,83,9,0.15)', icon: 'bi-clock-history' },
                  ].map(stat => (
                    <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: stat.bg, borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: 600, color: stat.color }}>
                      <i className={`bi ${stat.icon}`} style={{ fontSize: '13px' }}></i>
                      <span>{stat.count} {stat.label}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => {
                  setMarqueeModalMode('add');
                  setMarqueeFormData({ id: null, message: '', bgColor: activePrimary, textColor: contrastText(activePrimary), speed: 10, fontWeight: '500', isActive: true, scheduleStart: '', scheduleEnd: '', displayOrder: 0 });
                  setShowMarqueeModal(true);
                }} style={{ background: activePrimary, border: 'none', borderRadius: '10px', padding: '9px 20px', fontWeight: 600, fontSize: '13px', color: contrastText(activePrimary), display: 'flex', alignItems: 'center', gap: '7px', whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${activePrimary}40` }}>
                  <i className="bi bi-plus-lg"></i> New Message
                </Button>
              </div>

              {/* Message Cards */}
              {marqueeMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: 'transparent', borderRadius: '16px', border: '2px dashed rgba(150,160,180,0.3)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${activePrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <i className="bi bi-megaphone" style={{ fontSize: '28px', color: primaryColor || '#4db7ec' }}></i>
                  </div>
                  <h6 style={{ fontWeight: 600, color: '#374151', marginBottom: '6px' }}>No announcements yet</h6>
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>Create scrolling ticker messages shown to your customers across the app.</p>
                  <Button onClick={() => {
                    setMarqueeModalMode('add');
                    setMarqueeFormData({ id: null, message: '', bgColor: activePrimary, textColor: contrastText(activePrimary), speed: 10, fontWeight: '500', isActive: true, scheduleStart: '', scheduleEnd: '', displayOrder: 0 });
                    setShowMarqueeModal(true);
                  }} style={{ background: primaryColor || '#4db7ec', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, fontSize: '14px' }}>
                    <i className="bi bi-plus-lg me-2"></i>Create First Message
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
                  {marqueeMessages.map((msg, idx) => {
                    const status = getMarqueeStatus(msg);
                    const statusColors = { Live: { dot: '#4ade80', badge: '#dcfce7', text: '#16a34a' }, Scheduled: { dot: '#60a5fa', badge: '#dbeafe', text: '#1d4ed8' }, Expired: { dot: '#fb923c', badge: '#ffedd5', text: '#c2410c' }, Inactive: { dot: '#94a3b8', badge: '#f1f5f9', text: '#64748b' } };
                    const sc = statusColors[status.label] || statusColors.Inactive;
                    return (
                      <div key={msg.id} style={{ borderRadius: '14px', border: '1px solid rgba(128,128,128,0.15)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', position: 'relative' }}>
                        {/* Color accent bar */}
                        <div style={{ height: '4px', background: `linear-gradient(90deg, ${msg.bgColor || '#1a1a2e'}, ${msg.textColor || '#fff'})` }} />
                        <div style={{ padding: '16px' }}>
                          {/* Top row: status + order + toggle */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: sc.badge, color: sc.text, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }}></span>
                                {status.label.toUpperCase()}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>#{idx + 1}</span>
                            </div>
                            <Form.Check type="switch" checked={msg.isActive} onChange={() => handleToggleMarqueeActive(msg)} title={msg.isActive ? 'Deactivate' : 'Activate'} style={{ margin: 0 }} />
                          </div>

                          {/* Message text preview */}
                          <div style={{ background: msg.bgColor || '#1a1a2e', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', overflow: 'hidden', position: 'relative' }}>
                            <style>{`@keyframes msgScroll_${msg.id} { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
                            <span style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: `msgScroll_${msg.id} ${msg.speed || 30}s linear infinite`, color: msg.textColor || '#ffffff', fontSize: '12px', fontWeight: msg.fontWeight || '500' }}>
                              {msg.message}
                            </span>
                          </div>

                          {/* Color swatches + speed */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: msg.bgColor || '#1a1a2e', border: '2px solid #e5e7eb', display: 'inline-block' }} title={`BG: ${msg.bgColor}`}></span>
                              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: msg.textColor || '#fff', border: '2px solid #e5e7eb', display: 'inline-block' }} title={`Text: ${msg.textColor}`}></span>
                            </div>
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>|</span>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="bi bi-speedometer2"></i> {msg.speed || 30}s
                            </span>
                            {msg.displayOrder > 0 && (
                              <>
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>|</span>
                                <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="bi bi-sort-numeric-up"></i> Order {msg.displayOrder}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Schedule */}
                          {(msg.scheduleStart || msg.scheduleEnd) && (
                            <div style={{ background: 'rgba(128,128,128,0.08)', borderRadius: '8px', padding: '7px 10px', marginBottom: '10px', fontSize: '11px', color: '#64748b', display: 'flex', gap: '12px' }}>
                              {msg.scheduleStart && (
                                <span><i className="bi bi-play-circle me-1" style={{ color: '#4ade80' }}></i>{new Date(msg.scheduleStart).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                              {msg.scheduleEnd && (
                                <span><i className="bi bi-stop-circle me-1" style={{ color: '#fb923c' }}></i>{new Date(msg.scheduleEnd).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="outline-secondary" size="sm" style={{ flex: 1, borderRadius: '8px', fontSize: '12px', fontWeight: 600, padding: '6px 0' }}
                              onClick={() => {
                                setMarqueeModalMode('edit');
                                setMarqueeFormData({ id: msg.id, message: msg.message || '', bgColor: msg.bgColor || '#1a1a2e', textColor: msg.textColor || '#ffffff', speed: msg.speed || 10, fontWeight: msg.fontWeight || '500', isActive: msg.isActive !== false, scheduleStart: msg.scheduleStart ? msg.scheduleStart.substring(0, 16) : '', scheduleEnd: msg.scheduleEnd ? msg.scheduleEnd.substring(0, 16) : '', displayOrder: msg.displayOrder || 0 });
                                setShowMarqueeModal(true);
                              }}>
                              <i className="bi bi-pencil me-1"></i>Edit
                            </Button>
                            <Button variant="outline-danger" size="sm" style={{ borderRadius: '8px', fontSize: '12px', padding: '6px 12px' }} onClick={() => handleDeleteMarqueeMessage(msg.id)}>
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Password & Security */}
      <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-shield-lock" title="Password & Security" subtitle="Keep your account secure by using a strong password" sectionKey="password" />
        {expandedSections.password && (
          <div style={{ padding: '24px' }}>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>CURRENT PASSWORD<span style={{ color: 'red' }}>*</span></Form.Label>
                <div style={{ position: 'relative' }}>
                  <Form.Control type={showCurrentPassword ? "text" : "password"} placeholder="Enter your current password" style={{ ...inputStyle, paddingRight: '40px' }}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', fontSize: '16px', padding: '4px 8px' }}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}>
                    <i className={`bi ${showCurrentPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>NEW PASSWORD<span style={{ color: 'red' }}>*</span></Form.Label>
                <div style={{ position: 'relative' }}>
                  <Form.Control type={showNewPassword ? "text" : "password"} placeholder="Min 8 chars (uppercase, lowercase, number)" style={{ ...inputStyle, paddingRight: '40px' }}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', fontSize: '16px', padding: '4px 8px' }}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}>
                    <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>CONFIRM NEW PASSWORD<span style={{ color: 'red' }}>*</span></Form.Label>
                <div style={{ position: 'relative' }}>
                  <Form.Control type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your new password" style={{ ...inputStyle, paddingRight: '40px' }}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', fontSize: '16px', padding: '4px 8px' }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </Col>
            </Row>
            <div style={{ background: `${activePrimary}12`, borderRadius: '8px', padding: '14px 18px', marginTop: '8px', marginBottom: '16px', border: `1px solid ${activePrimary}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <i className="bi bi-info-circle" style={{ color: activePrimary }}></i>
                <strong style={{ fontSize: '14px', color: activePrimary }}>Password Requirements:</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                <li>Minimum 8 characters long</li>
                <li>Must include uppercase, lowercase, and at least one number</li>
              </ul>
            </div>
            <div className="text-end">
              <Button style={{ background: primaryColor || '#4db7ec', border: 'none', borderRadius: '8px', padding: '10px 24px' }}>
                <i className="bi bi-send me-2"></i>Send OTP & Verify
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Branding & Appearance */}
      <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-palette" title="Branding & Appearance" subtitle="Customize your app's look and feel" sectionKey="branding" />
        {expandedSections.branding && (
          <div style={{ padding: '24px' }}>
            {/* Theme Mode */}
            <div style={{ background: 'rgba(128,128,128,0.08)', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
              <Form.Label style={labelStyle}>THEME MODE</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`bi ${formData.themeMode === 'light' ? 'bi-sun' : 'bi-moon-stars'}`} style={{ fontSize: '24px', color: '#f59e0b' }}></i>
                  <div>
                    <strong>{formData.themeMode === 'light' ? 'Light Mode' : 'Dark Mode'}</strong>
                    <br /><small style={{ color: '#6c757d' }}>{formData.themeMode === 'light' ? 'Bright and clear for daytime use' : 'Easy on the eyes for nighttime'}</small>
                  </div>
                </div>
                <Form.Check type="switch" checked={formData.themeMode === 'dark'}
                  onChange={(e) => handleChange('themeMode', e.target.checked ? 'dark' : 'light')} />
              </div>
            </div>

            {/* Primary Color */}
            <Form.Label style={labelStyle}>PRIMARY COLOR</Form.Label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {COLOR_SWATCHES.map(color => (
                <div key={color} onClick={() => handleChange('primaryColor', color)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', background: color, cursor: 'pointer',
                    border: formData.primaryColor === color ? '3px solid #333' : '2px solid transparent',
                    boxShadow: formData.primaryColor === color ? '0 0 0 2px #fff, 0 0 0 4px ' + color : 'none'
                  }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6c757d' }}>CUSTOM</span>
              <input type="color" value={formData.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
              <Form.Control type="text" value={formData.primaryColor} style={{ ...inputStyle, width: '120px' }}
                onChange={(e) => handleChange('primaryColor', e.target.value)} />
              <div style={{ flex: 1, height: '28px', borderRadius: '6px', background: formData.primaryColor }}></div>
            </div>
            <small style={{ color: '#6c757d' }}>Theme colors update instantly after saving.</small>
            {extractedColor && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                marginTop: '8px', padding: '6px 12px', borderRadius: '20px',
                background: `${activePrimary}15`, border: `1px solid ${activePrimary}40`, fontSize: '12px',
              }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: extractedColor, border: '2px solid #fff', boxShadow: '0 0 0 1px #cbd5e1' }} />
                <span style={{ color: '#0369a1', fontWeight: 600 }}>
                  <i className="bi bi-magic me-1"></i>
                  Color detected from logo: <span style={{ fontFamily: 'monospace' }}>{extractedColor}</span>
                </span>
                <button onClick={() => setExtractedColor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}

            {/* Secondary Color */}
            <div className="mt-3">
              <Form.Label style={labelStyle}>SECONDARY COLOR</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <input type="color" value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                <Form.Control type="text" value={formData.secondaryColor} style={{ ...inputStyle, width: '120px' }}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)} />
                <div style={{ flex: 1, height: '28px', borderRadius: '6px', background: formData.secondaryColor }}></div>
              </div>
            </div>

            {/* Tertiary Color */}
            <div className="mt-3">
              <Form.Label style={labelStyle}>TERTIARY COLOR</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <input type="color" value={formData.tertiaryColor}
                  onChange={(e) => handleChange('tertiaryColor', e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                <Form.Control type="text" value={formData.tertiaryColor} style={{ ...inputStyle, width: '120px' }}
                  onChange={(e) => handleChange('tertiaryColor', e.target.value)} />
                <div style={{ flex: 1, height: '28px', borderRadius: '6px', background: formData.tertiaryColor }}></div>
              </div>
            </div>

            {/* Font Color */}
            <div className="mt-3">
              <Form.Label style={labelStyle}>FONT COLOR</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <input type="color" value={formData.fontColor}
                  onChange={(e) => handleChange('fontColor', e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                <Form.Control type="text" value={formData.fontColor} style={{ ...inputStyle, width: '120px' }}
                  onChange={(e) => handleChange('fontColor', e.target.value)} />
                <div style={{ flex: 1, height: '28px', borderRadius: '6px', background: formData.fontColor }}></div>
              </div>
            </div>

            {/* Font Name + Size + Weight */}
            <div className="mt-3 mb-3">
              <Form.Label style={labelStyle}>FONT FAMILY</Form.Label>
              <Form.Select value={formData.fontName} onChange={(e) => handleChange('fontName', e.target.value)}
                style={{ ...inputStyle }}>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Nunito">Nunito</option>
                <option value="Raleway">Raleway</option>
                <option value="Ubuntu">Ubuntu</option>
              </Form.Select>
            </div>

            {/* Font Size + Font Weight */}
            <Row className="mt-1 mb-3">
              <Col md={6}>
                <Form.Label style={labelStyle}>FONT SIZE</Form.Label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['12px','13px','14px','15px','16px','17px','18px'].map(size => (
                    <button key={size} onClick={() => handleChange('fontSize', size)}
                      style={{
                        padding: '5px 12px', borderRadius: '8px', border: '1.5px solid',
                        borderColor: formData.fontSize === size ? (primaryColor || '#4db7ec') : '#e2e8f0',
                        background: formData.fontSize === size ? (primaryColor || '#4db7ec') : '#fff',
                        color: formData.fontSize === size ? '#fff' : '#374151',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', lineHeight: 1.4,
                      }}>
                      {size}
                    </button>
                  ))}
                </div>
                <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                  Preview: <span style={{ fontSize: formData.fontSize, fontWeight: formData.fontWeight, color: formData.fontColor || '#334155' }}>Sample Text</span>
                </small>
              </Col>
              <Col md={6}>
                <Form.Label style={labelStyle}>FONT WEIGHT</Form.Label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { value: '300', label: 'Light' },
                    { value: '400', label: 'Regular' },
                    { value: '500', label: 'Medium' },
                    { value: '600', label: 'SemiBold' },
                    { value: '700', label: 'Bold' },
                  ].map(w => (
                    <button key={w.value} onClick={() => handleChange('fontWeight', w.value)}
                      style={{
                        padding: '5px 12px', borderRadius: '8px', border: '1.5px solid',
                        borderColor: formData.fontWeight === w.value ? (primaryColor || '#4db7ec') : '#e2e8f0',
                        background: formData.fontWeight === w.value ? (primaryColor || '#4db7ec') : '#fff',
                        color: formData.fontWeight === w.value ? '#fff' : '#374151',
                        fontSize: '12px', fontWeight: w.value, cursor: 'pointer', lineHeight: 1.4,
                      }}>
                      {w.label}
                    </button>
                  ))}
                </div>
                <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px', display: 'block' }}>Each button displays in its own weight</small>
              </Col>
            </Row>

            {/* Logo */}
            <div className="mt-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Form.Label style={{ ...labelStyle, margin: 0 }}>LOGO</Form.Label>
                <div>
                  <Button size="sm" variant={logoInputMode === 'upload' ? 'primary' : 'outline-secondary'}
                    onClick={() => setLogoInputMode('upload')} style={{ borderRadius: '6px 0 0 6px', fontSize: '12px' }}>
                    <i className="bi bi-upload me-1"></i>Upload
                  </Button>
                  <Button size="sm" variant={logoInputMode === 'url' ? 'primary' : 'outline-secondary'}
                    onClick={() => setLogoInputMode('url')} style={{ borderRadius: '0 6px 6px 0', fontSize: '12px' }}>
                    <i className="bi bi-link-45deg me-1"></i>URL
                  </Button>
                </div>
              </div>
              {logoInputMode === 'upload' ? (
                <div>
                  <input ref={logoFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoFileChange} />
                  <Button size="sm" variant="outline-secondary" onClick={() => logoFileRef.current?.click()}
                    disabled={logoUploading} style={{ borderRadius: '8px', fontSize: '13px' }}>
                    {logoUploading
                      ? <><Spinner animation="border" size="sm" className="me-1" style={{ width: '0.85rem', height: '0.85rem' }} />Uploading...</>
                      : <><i className="bi bi-cloud-upload me-1"></i>Choose & Crop Logo</>
                    }
                  </Button>
                </div>
              ) : (
                <Form.Control type="text" placeholder="Enter logo URL" style={inputStyle}
                  value={formData.logoUrl} onChange={(e) => handleChange('logoUrl', e.target.value)} />
              )}
              {formData.logoUrl && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={formData.logoUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                  <Button variant="outline-danger" size="sm" onClick={() => handleChange('logoUrl', '')}>
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              )}
              <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>Login page & sidebar. PNG with transparency recommended.</small>
            </div>

            {/* Favicon */}
            <div className="mt-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Form.Label style={{ ...labelStyle, margin: 0 }}>FAVICON</Form.Label>
                <div>
                  <Button size="sm" variant={faviconInputMode === 'upload' ? 'primary' : 'outline-secondary'}
                    onClick={() => setFaviconInputMode('upload')} style={{ borderRadius: '6px 0 0 6px', fontSize: '12px' }}>
                    <i className="bi bi-upload me-1"></i>Upload
                  </Button>
                  <Button size="sm" variant={faviconInputMode === 'url' ? 'primary' : 'outline-secondary'}
                    onClick={() => setFaviconInputMode('url')} style={{ borderRadius: '0 6px 6px 0', fontSize: '12px' }}>
                    <i className="bi bi-link-45deg me-1"></i>URL
                  </Button>
                </div>
              </div>
              {faviconInputMode === 'upload' ? (
                <div>
                  <input ref={faviconFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFaviconFileChange} />
                  <Button size="sm" variant="outline-secondary" onClick={() => faviconFileRef.current?.click()}
                    disabled={faviconUploading} style={{ borderRadius: '8px', fontSize: '13px' }}>
                    {faviconUploading
                      ? <><Spinner animation="border" size="sm" className="me-1" style={{ width: '0.85rem', height: '0.85rem' }} />Uploading...</>
                      : <><i className="bi bi-cloud-upload me-1"></i>Choose & Crop Favicon</>
                    }
                  </Button>
                </div>
              ) : (
                <Form.Control type="text" placeholder="Enter favicon URL" style={inputStyle}
                  value={formData.faviconUrl} onChange={(e) => handleChange('faviconUrl', e.target.value)} />
              )}
              {formData.faviconUrl && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={formData.faviconUrl} alt="Favicon" style={{ maxHeight: '40px', maxWidth: '40px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                  <Button variant="outline-danger" size="sm" onClick={() => handleChange('faviconUrl', '')}>
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Business Information */}
      <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-building" title="Business Information" subtitle="Organisation details, compliance info, and contact details shown on invoices" sectionKey="business" />
        {expandedSections.business && (
          <div style={{ padding: '24px' }}>
            {/* Organisation Details */}
            <div style={subHeadingStyle}>
              <i className="bi bi-buildings"></i> ORGANISATION DETAILS
            </div>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>ORGANISATION NAME</Form.Label>
                <Form.Control type="text" placeholder="Registered organisation name" style={inputStyle}
                  value={formData.organisationName} onChange={(e) => handleChange('organisationName', e.target.value)} />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>BUSINESS / TRADE NAME</Form.Label>
                <Form.Control type="text" placeholder="Your Business Name" style={inputStyle}
                  value={formData.businessName} onChange={(e) => handleChange('businessName', e.target.value)} />
              </Col>
            </Row>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>AUTHORISED PERSON NAME</Form.Label>
                <Form.Control type="text" placeholder="Name of authorised signatory" style={inputStyle}
                  value={formData.authorisedPersonName} onChange={(e) => handleChange('authorisedPersonName', e.target.value)} />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>ENTITY TYPE</Form.Label>
                <Form.Select style={{ ...inputStyle, borderBottom: '2px solid #e5e7eb' }}
                  value={formData.entityType} onChange={(e) => handleChange('entityType', e.target.value)}>
                  <option value="">Select Entity Type</option>
                  {ENTITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </Form.Select>
              </Col>
            </Row>

            <hr style={{ borderColor: '#e8f0fe', margin: '20px 0' }} />

            {/* Tax & Compliance */}
            <div style={subHeadingStyle}>
              <i className="bi bi-file-earmark-text"></i> TAX & COMPLIANCE
            </div>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>GST NUMBER</Form.Label>
                <Form.Control type="text" placeholder="22AAAAA0000A1Z5" style={inputStyle} maxLength={15}
                  value={formData.gstNumber} onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())} />
                <small style={{ color: '#6c757d' }}>15-digit GSTIN shown on invoices</small>
                <div className="mt-2">
                  <small><i className="bi bi-paperclip me-1"></i><i className="bi bi-upload me-1"></i> Upload GST Certificate</small>
                </div>
              </Col>
            </Row>

            <hr style={{ borderColor: '#e8f0fe', margin: '20px 0' }} />

            {/* Contact Details */}
            <div style={subHeadingStyle}>
              <i className="bi bi-telephone"></i> CONTACT DETAILS
            </div>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>EMAIL</Form.Label>
                <Form.Control type="email" placeholder="info@yourbusiness.com" style={inputStyle}
                  value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>PHONE NUMBER</Form.Label>
                <Form.Control type="tel" placeholder="+91 98765 43210" style={inputStyle}
                  value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </Col>
            </Row>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>WHATSAPP NUMBER</Form.Label>
                <Form.Control type="text" placeholder="919876543210" style={inputStyle}
                  value={formData.whatsappNumber} onChange={(e) => handleChange('whatsappNumber', e.target.value.replace(/[^0-9]/g, ''))} />
                <small style={{ color: '#6c757d' }}>With country code, no + or spaces</small>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}><i className="bi bi-truck me-1" style={{ color: 'red' }}></i> AMBULANCE NUMBER</Form.Label>
                <Form.Control type="text" placeholder="108 or +91 98765 43210" style={inputStyle}
                  value={formData.ambulanceNumber} onChange={(e) => handleChange('ambulanceNumber', e.target.value)} />
                <small style={{ color: '#6c757d' }}>Emergency ambulance contact shown to patients</small>
              </Col>
            </Row>

            <hr style={{ borderColor: '#e8f0fe', margin: '20px 0' }} />

            {/* Google Map & Address */}
            <Form.Label style={labelStyle}>GOOGLE MAP EMBED CODE</Form.Label>
            <Form.Control as="textarea" rows={3} style={{ ...inputStyle, borderBottom: '2px solid #e5e7eb', fontFamily: 'monospace', fontSize: '12px' }}
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" ...></iframe>'
              value={formData.googleMapEmbed} onChange={(e) => handleChange('googleMapEmbed', e.target.value)} />
            <small style={{ color: '#6c757d', display: 'block', marginTop: '4px', marginBottom: '16px' }}>
              How to get the embed code: Open <strong>Google Maps</strong> &rarr; search your location &rarr; click <strong>Share</strong> &rarr; select "<strong>Embed a map</strong>" tab &rarr; click "<strong>Copy HTML</strong>" &rarr; paste the full <code>&lt;iframe&gt;</code> code here.
            </small>

            <Form.Label style={labelStyle}>ADDRESS</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="Full business address..." style={inputStyle}
              value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />

            <hr style={{ borderColor: '#e8f0fe', margin: '20px 0' }} />

            {/* Social Media Links */}
            <div style={subHeadingStyle}>
              <i className="bi bi-share"></i> SOCIAL MEDIA LINKS
            </div>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>FACEBOOK</Form.Label>
                <Form.Control type="url" placeholder="https://facebook.com/yourpage" style={inputStyle}
                  value={formData.socialMediaLinks?.facebook || ''} onChange={(e) => handleSocialChange('facebook', e.target.value)} />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>INSTAGRAM</Form.Label>
                <Form.Control type="url" placeholder="https://instagram.com/yourpage" style={inputStyle}
                  value={formData.socialMediaLinks?.instagram || ''} onChange={(e) => handleSocialChange('instagram', e.target.value)} />
              </Col>
            </Row>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>TWITTER / X</Form.Label>
                <Form.Control type="url" placeholder="https://x.com/yourhandle" style={inputStyle}
                  value={formData.socialMediaLinks?.twitter || ''} onChange={(e) => handleSocialChange('twitter', e.target.value)} />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>YOUTUBE</Form.Label>
                <Form.Control type="url" placeholder="https://youtube.com/@yourchannel" style={inputStyle}
                  value={formData.socialMediaLinks?.youtube || ''} onChange={(e) => handleSocialChange('youtube', e.target.value)} />
              </Col>
            </Row>

            {/* Google Rating Link */}
            <div style={subHeadingStyle}>
              <i className="bi bi-google"></i> GOOGLE RATING
            </div>
            <Row>
              <Col md={12} className="mb-3">
                <Form.Label style={labelStyle}>GOOGLE RATING LINK</Form.Label>
                <Form.Control type="url" placeholder="https://g.page/r/your-business/review" style={inputStyle}
                  value={formData.googleRatingUrl || ''} onChange={(e) => handleChange('googleRatingUrl', e.target.value)} />
                <Form.Text className="text-muted">Paste your Google Business review link. This will show a "Rate Us" option in the customer app.</Form.Text>
              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* Referral Settings - removed per requirements */}
      {false && <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-gift" title="Referral Program" subtitle="Configure referral rewards for customer referrals" sectionKey="referral" />
        {expandedSections.referral && (
          <div style={{ padding: '24px' }}>
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="bi bi-info-circle" style={{ color: '#16a34a', fontSize: '18px' }}></i>
                <strong style={{ color: '#166534' }}>How Referral Program Works</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                <li>Each customer gets a unique referral code to share with friends</li>
                <li>When a new customer signs up using the code and completes their first order, the referrer earns the reward</li>
                <li>The reward amount is credited to the referrer's wallet balance</li>
              </ul>
            </div>

            <Row>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>ENABLE REFERRAL PROGRAM</Form.Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Form.Check
                    type="switch"
                    id="referral-enabled-switch"
                    checked={formData.referralEnabled || false}
                    onChange={(e) => handleChange('referralEnabled', e.target.checked)}
                    style={{ transform: 'scale(1.3)' }}
                  />
                  <span style={{ fontSize: '14px', color: formData.referralEnabled ? '#16a34a' : '#9ca3af', fontWeight: 500 }}>
                    {formData.referralEnabled ? 'Referral Program Active' : 'Referral Program Disabled'}
                  </span>
                </div>
                <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                  Turn on to allow customers to refer friends and earn rewards
                </small>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label style={labelStyle}>REFERRAL REWARD AMOUNT ($)</Form.Label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: 600 }}>$</span>
                  <Form.Control
                    type="number"
                    placeholder="50"
                    style={{ ...inputStyle, paddingLeft: '32px' }}
                    value={formData.referralAmount || ''}
                    onChange={(e) => handleChange('referralAmount', e.target.value)}
                    disabled={!formData.referralEnabled}
                    min="0"
                    step="1"
                  />
                </div>
                <small style={{ color: '#6c757d' }}>
                  Amount credited to referrer's wallet when their referral completes first order
                </small>
              </Col>
            </Row>
          </div>
        )}
      </div>}

      {/* Menu Filter Visibility */}
      <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-funnel" title="Menu Filters" subtitle="Control which filter chips are shown to customers on the menu page" sectionKey="menuFilters" />
        {expandedSections.menuFilters && (
          <div style={{ padding: '24px' }}>
            <div style={{ background: `${activePrimary}12`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: `1px solid ${activePrimary}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="bi bi-info-circle" style={{ color: activePrimary, fontSize: '18px' }}></i>
                <strong style={{ color: activePrimary }}>Menu Filter Configuration</strong>
              </div>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Toggle filters on/off to control what customers see on the menu page. Disabled filters will be hidden from the customer app.
              </p>
            </div>
            <Row>
              {[
                { key: 'filterRecommended', label: 'Recommended', icon: '⭐', desc: 'Show items marked as recommended' },
                { key: 'filterPopular', label: 'Popular', icon: '🔥', desc: 'Show popular/bestseller items' },
                { key: 'filterDiscount', label: 'Discount', icon: '🏷️', desc: 'Show items with discounts' },
                { key: 'filterFastServing', label: 'Fast Serving', icon: '⚡', desc: 'Show quick preparation items' },
                { key: 'filterPrice', label: 'Price Sort', icon: '💰', desc: 'Show price sorting (low/high)' },
                { key: 'filterRating', label: 'Rating', icon: '★', desc: 'Show rating-based sorting' },
                { key: 'filterVegNonveg', label: 'Veg / Non-Veg', icon: '🟢', desc: 'Show vegetarian filter' },
              ].map(f => (
                <Col md={6} key={f.key} className="mb-3">
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', borderRadius: '12px',
                    border: `1px solid ${formData[f.key] ? 'rgba(22,163,74,0.35)' : 'rgba(128,128,128,0.2)'}`,
                    background: formData[f.key] ? 'rgba(22,163,74,0.08)' : 'rgba(128,128,128,0.06)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{f.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{f.label}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{f.desc}</div>
                      </div>
                    </div>
                    <Form.Check
                      type="switch"
                      checked={formData[f.key] || false}
                      onChange={(e) => handleChange(f.key, e.target.checked)}
                      style={{ transform: 'scale(1.3)' }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>

      {/* Team Members - removed per requirements */}
      {false && <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-people" title="Team Members" subtitle="Add leadership & key staff shown on your hospital website" sectionKey="team" />
        {expandedSections.team && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <small style={{ color: primaryColor || '#4db7ec', fontWeight: 600 }}>{teamMembers.length} team members</small>
              <Button size="sm" style={{ background: primaryColor || '#4db7ec', border: 'none', borderRadius: '6px' }}
                onClick={handleAddTeamMember}>
                + Add Member
              </Button>
            </div>

            {teamMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6c757d' }}>
                <i className="bi bi-people" style={{ fontSize: '40px', display: 'block', marginBottom: '12px', opacity: 0.4 }}></i>
                <p>No team members added yet. Click "Add Member" to get started.</p>
              </div>
            ) : (
              <div style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                <Table hover responsive size="sm" className="mb-0">
                  <thead>
                    <tr style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6c757d' }}>
                      <th style={{ padding: '10px 16px' }}>#</th>
                      <th style={{ padding: '10px 16px' }}>Name</th>
                      <th style={{ padding: '10px 16px' }}>Designation</th>
                      <th style={{ padding: '10px 16px' }}>Order</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member, idx) => (
                      <tr key={member.id}>
                        <td style={{ padding: '10px 16px' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-person" style={{ fontSize: '14px' }}></i>
                              </div>
                            )}
                            {member.name}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>{member.designation || '-'}</td>
                        <td style={{ padding: '10px 16px' }}>{member.displayOrder}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleEditTeamMember(member)}>
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTeamMember(member.id)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>}

      {/* 6. Legal & Policy Pages */}
      <div className="bs-section-card" style={sectionCardStyle}>
        <SectionHeader icon="bi bi-file-earmark-ruled" title="Legal & Policy Pages" subtitle="Content shown to users in the app. Supports plain text." sectionKey="legal" />
        {expandedSections.legal && (
          <div style={{ padding: '24px' }}>
            {[
              { key: 'aboutUs', label: 'ABOUT US', placeholder: 'Enter About Us content...' },
              { key: 'privacyPolicy', label: 'PRIVACY POLICY', placeholder: 'Enter Privacy Policy content...' },
              { key: 'termsConditions', label: 'TERMS & CONDITIONS', placeholder: 'Enter Terms & Conditions content...' },
              { key: 'refundPolicy', label: 'REFUND POLICY', placeholder: 'Enter Refund Policy content...' },
              { key: 'cancellationPolicy', label: 'CANCELLATION POLICY', placeholder: 'Enter Cancellation Policy content...' },
              { key: 'ourMission', label: 'OUR MISSION', placeholder: "Enter your hospital's mission statement..." },
              { key: 'ourVision', label: 'OUR VISION', placeholder: "Enter your hospital's vision statement..." }
            ].map((field, idx) => (
              <div key={field.key} style={{ marginBottom: '20px', borderRadius: '8px', padding: '16px', background: 'rgba(128,128,128,0.05)', border: '1px solid rgba(128,128,128,0.1)' }}>
                <Form.Label style={{ ...labelStyle, fontWeight: 700 }}>{field.label}</Form.Label>
                <Form.Control as="textarea" rows={4} placeholder={field.placeholder}
                  style={{ border: '1px solid rgba(128,128,128,0.2)', borderRadius: '8px', fontSize: '14px', background: 'rgba(128,128,128,0.08)' }}
                  value={formData[field.key]} onChange={(e) => handleChange(field.key, e.target.value)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Save Bar — always visible at viewport bottom */}
      <div className="bs-save-bar" style={{
        borderTop: `3px solid ${primaryColor || '#4db7ec'}`,
      }}>
        <small style={{ color: '#999', fontSize: '12px' }}>
          <i className="bi bi-info-circle me-1"></i>App Version: v2.2
        </small>
        <Button onClick={handleSave} disabled={saving || logoUploading || faviconUploading}
          style={{ background: primaryColor || '#4db7ec', border: 'none', borderRadius: '10px', padding: '12px 40px', fontSize: '16px', fontWeight: 600 }}>
          {saving ? <><Spinner size="sm" className="me-2" />Saving...</> : logoUploading || faviconUploading ? <><Spinner size="sm" className="me-2" />Uploading Image...</> : <><i className="bi bi-check-circle me-2"></i>Save All Changes</>}
        </Button>
      </div>

      {/* Team Member Modal */}
      <Modal show={showTeamModal} onHide={() => setShowTeamModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '18px' }}>
            {teamModalMode === 'add' ? 'Add Team Member' : 'Edit Team Member'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>NAME<span style={{ color: 'red' }}>*</span></Form.Label>
            <Form.Control type="text" placeholder="Full name" value={teamFormData.name}
              onChange={(e) => setTeamFormData(prev => ({ ...prev, name: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>DESIGNATION</Form.Label>
            <Form.Control type="text" placeholder="e.g. Chief Surgeon, Director" value={teamFormData.designation}
              onChange={(e) => setTeamFormData(prev => ({ ...prev, designation: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>PHOTO URL</Form.Label>
            <Form.Control type="text" placeholder="https://..." value={teamFormData.photoUrl}
              onChange={(e) => setTeamFormData(prev => ({ ...prev, photoUrl: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>DISPLAY ORDER</Form.Label>
            <Form.Control type="number" value={teamFormData.displayOrder}
              onChange={(e) => setTeamFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTeamModal(false)}>Cancel</Button>
          <Button onClick={handleSaveTeamMember} disabled={teamLoading}
            style={{ background: primaryColor || '#4db7ec', border: 'none' }}>
            {teamLoading ? <Spinner size="sm" /> : (teamModalMode === 'add' ? 'Add Member' : 'Update Member')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Marquee Message Modal */}
      <Modal show={showMarqueeModal} onHide={() => setShowMarqueeModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ border: 'none', paddingBottom: 0 }}>
          <Modal.Title style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${activePrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-megaphone" style={{ color: activePrimary, fontSize: '16px' }}></i>
            </div>
            {marqueeModalMode === 'add' ? 'New Marquee Message' : 'Edit Marquee Message'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px 24px' }}>
          {/* Live Preview */}
          <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ background: 'rgba(128,128,128,0.08)', padding: '7px 14px', borderBottom: '1px solid rgba(128,128,128,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: marqueeFormData.message ? '#4ade80' : '#94a3b8', display: 'inline-block' }}></span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Live Preview</span>
            </div>
            <div style={{ background: marqueeFormData.bgColor || '#1a1a2e', padding: '10px 0', overflow: 'hidden', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
              {marqueeFormData.message ? (
                <>
                  <style>{`@keyframes marqueeModal { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }`}</style>
                  <span style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: `marqueeModal ${marqueeFormData.speed || 30}s linear infinite`, color: marqueeFormData.textColor || '#ffffff', fontSize: '13px', fontWeight: marqueeFormData.fontWeight || '500', letterSpacing: '0.3px' }}>
                    {marqueeFormData.message}
                  </span>
                </>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', paddingLeft: '16px', fontStyle: 'italic' }}>Your message will scroll here...</span>
              )}
            </div>
          </div>

          {/* Message input */}
          <Form.Group className="mb-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Form.Label style={{ ...labelStyle, margin: 0 }}>MESSAGE TEXT <span style={{ color: '#ef4444' }}>*</span></Form.Label>
              <button onClick={() => setShowEmojiPicker(p => !p)}
                style={{ background: showEmojiPicker ? activePrimary : '#f1f5f9', border: '1.5px solid', borderColor: showEmojiPicker ? activePrimary : '#e2e8f0', borderRadius: '8px', padding: '4px 10px', fontSize: '14px', cursor: 'pointer', color: showEmojiPicker ? contrastText(activePrimary) : '#374151', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                😊 <span style={{ fontSize: '11px' }}>Emoji</span>
              </button>
            </div>

            {/* Emoji Picker Panel */}
            {showEmojiPicker && (
              <div style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px', marginBottom: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.30)' }}>
                {EMOJI_GROUPS.map(group => (
                  <div key={group.label} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>{group.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                      {group.emojis.map(emoji => (
                        <button key={emoji} onClick={() => insertEmoji(emoji)}
                          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '3px 4px', borderRadius: '6px', lineHeight: 1, transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Form.Control as="textarea" rows={2} ref={marqueeTextareaRef}
              placeholder="e.g.  Special lunch offer today — 20% off on all combos! 🎉"
              value={marqueeFormData.message}
              onChange={(e) => setMarqueeFormData(prev => ({ ...prev, message: e.target.value }))}
              style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', resize: 'none', padding: '10px 14px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>Click 😊 Emoji to insert emojis at cursor</small>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>{marqueeFormData.message?.length || 0} chars</small>
            </div>
          </Form.Group>

          {/* Color + Speed */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Form.Label style={labelStyle}>BACKGROUND</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={marqueeFormData.bgColor}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, bgColor: e.target.value }))}
                  style={{ width: '40px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                <Form.Control size="sm" value={marqueeFormData.bgColor} style={{ fontFamily: 'monospace', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px' }}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, bgColor: e.target.value }))} />
              </div>
            </div>
            <div>
              <Form.Label style={labelStyle}>TEXT COLOR</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={marqueeFormData.textColor}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, textColor: e.target.value }))}
                  style={{ width: '40px', height: '40px', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                <Form.Control size="sm" value={marqueeFormData.textColor} style={{ fontFamily: 'monospace', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px' }}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, textColor: e.target.value }))} />
              </div>
            </div>
            <div>
              <Form.Label style={labelStyle}>SPEED (sec)</Form.Label>
              <Form.Control type="number" min={5} max={120} value={marqueeFormData.speed}
                onChange={(e) => setMarqueeFormData(prev => ({ ...prev, speed: parseInt(e.target.value) || 30 }))}
                style={{ borderRadius: '8px', border: '1.5px solid #e2e8f0', height: '40px' }} />
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>5 = fast · 120 = slow</small>
            </div>
          </div>

          {/* Font Weight */}
          <div style={{ marginBottom: '16px' }}>
            <Form.Label style={labelStyle}>FONT WEIGHT</Form.Label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: '300', label: 'Light' },
                { value: '400', label: 'Regular' },
                { value: '500', label: 'Medium' },
                { value: '600', label: 'SemiBold' },
                { value: '700', label: 'Bold' },
                { value: '800', label: 'ExtraBold' },
              ].map(w => (
                <button key={w.value} onClick={() => setMarqueeFormData(prev => ({ ...prev, fontWeight: w.value }))}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: '1.5px solid',
                    borderColor: marqueeFormData.fontWeight === w.value ? activePrimary : '#e2e8f0',
                    background: marqueeFormData.fontWeight === w.value ? activePrimary : '#fff',
                    color: marqueeFormData.fontWeight === w.value ? contrastText(activePrimary) : '#374151',
                    fontSize: '12px', fontWeight: w.value, cursor: 'pointer', lineHeight: 1.5, outline: 'none',
                  }}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Themes */}
          <div style={{ marginBottom: '20px' }}>
            <Form.Label style={labelStyle}>QUICK THEMES</Form.Label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { bg: '#1a1a2e', text: '#e94560', label: 'Dark Red' },
                { bg: '#0f3460', text: '#e94560', label: 'Navy' },
                { bg: '#16213e', text: '#a8d8ea', label: 'Midnight' },
                { bg: '#1b4332', text: '#95d5b2', label: 'Forest' },
                { bg: '#7c3aed', text: '#fff', label: 'Purple' },
                { bg: '#d97706', text: '#fff', label: 'Amber' },
                { bg: '#be123c', text: '#fff', label: 'Crimson' },
                { bg: '#0ea5e9', text: '#fff', label: 'Sky' },
              ].map(theme => (
                <button key={theme.label} title={theme.label} onClick={() => setMarqueeFormData(prev => ({ ...prev, bgColor: theme.bg, textColor: theme.text }))}
                  style={{ width: '28px', height: '28px', borderRadius: '6px', background: theme.bg, border: marqueeFormData.bgColor === theme.bg ? `2px solid ${theme.text}` : '2px solid transparent', cursor: 'pointer', outline: 'none' }}>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule + Order + Active */}
          <div style={{ background: 'rgba(128,128,128,0.06)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(128,128,128,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="bi bi-calendar3" style={{ color: primaryColor || '#4db7ec' }}></i> Schedule & Settings
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Active</span>
                <Form.Check type="switch" id="marquee-active-switch" checked={marqueeFormData.isActive}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, isActive: e.target.checked }))} style={{ margin: 0 }} />
              </div>
            </div>
            <Row>
              <Col md={5} className="mb-2">
                <Form.Label style={{ ...labelStyle, fontSize: '10px' }}>START <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(optional)</span></Form.Label>
                <Form.Control type="datetime-local" size="sm" value={marqueeFormData.scheduleStart}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, scheduleStart: e.target.value }))}
                  style={{ borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
                <small style={{ color: '#94a3b8', fontSize: '10px' }}>Empty = starts immediately</small>
              </Col>
              <Col md={5} className="mb-2">
                <Form.Label style={{ ...labelStyle, fontSize: '10px' }}>END <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(optional)</span></Form.Label>
                <Form.Control type="datetime-local" size="sm" value={marqueeFormData.scheduleEnd}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, scheduleEnd: e.target.value }))}
                  style={{ borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
                <small style={{ color: '#94a3b8', fontSize: '10px' }}>Empty = no expiry</small>
              </Col>
              <Col md={2} className="mb-2">
                <Form.Label style={{ ...labelStyle, fontSize: '10px' }}>ORDER</Form.Label>
                <Form.Control type="number" size="sm" min={0} value={marqueeFormData.displayOrder}
                  onChange={(e) => setMarqueeFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  style={{ borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', paddingTop: 0, gap: '10px' }}>
          <Button variant="light" onClick={() => setShowMarqueeModal(false)} style={{ borderRadius: '10px', padding: '9px 20px', fontWeight: 600, border: '1.5px solid #e2e8f0' }}>Cancel</Button>
          <Button onClick={handleSaveMarqueeMessage} disabled={marqueeLoading}
            style={{ background: activePrimary, border: 'none', borderRadius: '10px', padding: '9px 28px', fontWeight: 600, color: contrastText(activePrimary), boxShadow: `0 4px 12px ${activePrimary}40` }}>
            {marqueeLoading ? <><Spinner size="sm" className="me-2" />Saving...</> : (marqueeModalMode === 'add' ? <><i className="bi bi-plus-lg me-2"></i>Add Message</> : <><i className="bi bi-check2 me-2"></i>Update Message</>)}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Logo Crop Modal */}
      <ImageCropperModal
        show={showLogoCropper}
        onHide={() => setShowLogoCropper(false)}
        imageSrc={tempLogoSrc}
        onCropComplete={handleLogoCropComplete}
        aspectRatio={null}
        title="Crop Logo"
        primaryColor={primaryColor || '#4db7ec'}
        outputFormat="png"
      />

      {/* Favicon Crop Modal */}
      <ImageCropperModal
        show={showFaviconCropper}
        onHide={() => setShowFaviconCropper(false)}
        imageSrc={tempFaviconSrc}
        onCropComplete={handleFaviconCropComplete}
        aspectRatio={1}
        title="Crop Favicon"
        primaryColor={primaryColor || '#4db7ec'}
        outputFormat="png"
      />
    </Container>
  );
};

export default BusinessSettings;
