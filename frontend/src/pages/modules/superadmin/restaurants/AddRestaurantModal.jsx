import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ApiPost, ApiPostFormData } from '../../../../ApiServices/ApiServices';

const STEPS = [
  { id: 1, label: 'Basic Info',     icon: 'bi-person'         },
  { id: 2, label: 'KYC',            icon: 'bi-shield-check'   },
  { id: 3, label: 'Business',       icon: 'bi-building'       },
  { id: 4, label: 'Documents',      icon: 'bi-file-earmark'   },
  { id: 5, label: 'Photos',         icon: 'bi-camera'         },
  { id: 6, label: 'Done',           icon: 'bi-check-circle'   },
];

const ENTITY_TYPES = ['Sole Proprietor', 'Partnership', 'LLC', 'Corporation', 'S-Corp', 'Non-Profit'];
const RESTAURANT_TYPES = [
  { value: 'veg',    label: '🟢 Pure Veg'   },
  { value: 'nonveg', label: '🔴 Non-Veg'    },
  { value: 'both',   label: '🟡 Both'       },
];

const COUNTRY_TIMEZONES = [
  { country: 'United States', flag: '🇺🇸', timezone: 'America/New_York',    currency: 'USD' },
  { country: 'United Kingdom',flag: '🇬🇧', timezone: 'Europe/London',        currency: 'GBP' },
  { country: 'India',         flag: '🇮🇳', timezone: 'Asia/Kolkata',         currency: 'INR' },
  { country: 'UAE',           flag: '🇦🇪', timezone: 'Asia/Dubai',           currency: 'AED' },
  { country: 'Canada',        flag: '🇨🇦', timezone: 'America/Toronto',      currency: 'CAD' },
  { country: 'Australia',     flag: '🇦🇺', timezone: 'Australia/Sydney',     currency: 'AUD' },
  { country: 'Singapore',     flag: '🇸🇬', timezone: 'Asia/Singapore',       currency: 'SGD' },
  { country: 'Saudi Arabia',  flag: '🇸🇦', timezone: 'Asia/Riyadh',          currency: 'SAR' },
  { country: 'Germany',       flag: '🇩🇪', timezone: 'Europe/Berlin',        currency: 'EUR' },
  { country: 'France',        flag: '🇫🇷', timezone: 'Europe/Paris',         currency: 'EUR' },
  { country: 'Netherlands',   flag: '🇳🇱', timezone: 'Europe/Amsterdam',     currency: 'EUR' },
  { country: 'New Zealand',   flag: '🇳🇿', timezone: 'Pacific/Auckland',     currency: 'NZD' },
  { country: 'South Africa',  flag: '🇿🇦', timezone: 'Africa/Johannesburg',  currency: 'ZAR' },
  { country: 'Malaysia',      flag: '🇲🇾', timezone: 'Asia/Kuala_Lumpur',    currency: 'MYR' },
  { country: 'Bangladesh',    flag: '🇧🇩', timezone: 'Asia/Dhaka',           currency: 'BDT' },
  { country: 'Pakistan',      flag: '🇵🇰', timezone: 'Asia/Karachi',         currency: 'PKR' },
  { country: 'Nepal',         flag: '🇳🇵', timezone: 'Asia/Kathmandu',       currency: 'NPR' },
  { country: 'Sri Lanka',     flag: '🇱🇰', timezone: 'Asia/Colombo',         currency: 'LKR' },
];

const emptyBasic = { ownerName: '', mobile: '', email: '', password: '' };
const emptyKyc   = { einNumber: '' };
const emptyBiz   = { restaurantName: '', address: '', city: '', state: '', zipCode: '', entityType: 'Sole Proprietor', restaurantType: 'both', restaurantCode: '', primaryColor: '#3B82F6', logoUrl: '', country: 'United States', timezone: 'America/New_York', currencyCode: 'USD' };

const PRESET_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#EF4444','#F97316','#EAB308','#22C55E','#14B8A6','#06B6D4','#64748B'];
const emptyDocs  = { einProof: null, businessRegistration: null, foodLicense: null, foodProtectionCertificate: null, addressProof: null, fireSafety: null, liquorLicense: null };
const emptyPhotos = { restaurantFront: null, restaurantInside: null, restaurantBoard: null, selfie: null, visitingCard: null, otherDocument: null };

const primaryColor = '#3B82F6';

const StepIndicator = ({ current }) => (
  <div className="d-flex align-items-center justify-content-center mb-4 gap-1 flex-wrap">
    {STEPS.map((step, idx) => {
      const done    = current > step.id;
      const active  = current === step.id;
      return (
        <React.Fragment key={step.id}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 56 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? '#22c55e' : active ? primaryColor : '#e5e7eb',
              color: done || active ? '#fff' : '#9ca3af',
              fontSize: 15, transition: 'all .25s'
            }}>
              {done ? <i className="bi bi-check-lg" /> : <i className={`bi ${step.icon}`} />}
            </div>
            <span style={{ fontSize: 10, marginTop: 3, color: active ? primaryColor : done ? '#22c55e' : '#9ca3af', fontWeight: active ? 700 : 400 }}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: done ? '#22c55e' : '#e5e7eb', minWidth: 12, maxWidth: 32, marginBottom: 18 }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const FileUploadBox = ({ label, required, fileKey, file, onChange, acceptPdf = false }) => {
  const ref = useRef();
  return (
    <div className="mb-3">
      <Form.Label style={{ fontSize: 13 }}>
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      <div
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${file ? '#22c55e' : '#d1d5db'}`,
          borderRadius: 10, padding: '14px 12px', cursor: 'pointer',
          background: file ? '#f0fdf4' : '#f9fafb',
          display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s'
        }}
      >
        <i className={`bi ${file ? 'bi-check-circle-fill text-success' : 'bi-upload text-muted'}`} style={{ fontSize: 20 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: file ? '#16a34a' : '#374151' }}>
            {file ? file.name : `Upload ${label}`}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {acceptPdf ? 'JPG, PNG, PDF • Max 5MB' : 'JPG, PNG • Max 5MB'}
          </div>
        </div>
        {file && (
          <button type="button" className="btn btn-sm btn-outline-danger py-0 px-1"
            onClick={e => { e.stopPropagation(); onChange(fileKey, null); }}>
            <i className="bi bi-x" />
          </button>
        )}
      </div>
      <input ref={ref} type="file" hidden
        accept={acceptPdf ? 'image/*,.pdf' : 'image/*'}
        onChange={e => { if (e.target.files[0]) onChange(fileKey, e.target.files[0]); }}
      />
    </div>
  );
};

const AddRestaurantModal = ({ show, onHide, onSuccess }) => {
  const [step, setStep]           = useState(1);
  const [basic, setBasic]         = useState(emptyBasic);
  const [kyc, setKyc]             = useState(emptyKyc);
  const [biz, setBiz]             = useState(emptyBiz);
  const [docs, setDocs]           = useState(emptyDocs);
  const [photos, setPhotos]       = useState(emptyPhotos);
  const [credentials, setCreds]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [logoFile, setLogoFile]   = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef();

  const getLoggedInUserId = () => {
    const rawId = localStorage.getItem('UserId');
    const parsedId = Number(rawId);
    return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  };

  const reset = () => {
    setStep(1); setBasic(emptyBasic); setKyc(emptyKyc);
    setBiz(emptyBiz); setDocs(emptyDocs); setPhotos(emptyPhotos);
    setCreds(null); setLogoFile(null); setLogoPreview('');
  };

  const handleClose = () => { reset(); onHide(); };

  // ---------- STEP 1 ----------
  const submitBasic = (e) => {
    e.preventDefault();
    if (!basic.ownerName || !basic.mobile) return toast.error('Fill all required fields');
    if (!/^\d{10}$/.test(basic.mobile)) return toast.error('Enter valid 10-digit mobile');
    setStep(2);
  };

  // ---------- STEP 2 - KYC ----------
  const submitKyc = (e) => {
    e.preventDefault();
    const cleanEin = kyc.einNumber.replace(/\D/g, '');
    if (cleanEin.length !== 9) return toast.error('Enter valid 9-digit EIN (e.g. 12-3456789)');
    setStep(3);
  };

  // ---------- STEP 3 ----------
  const submitBiz = (e) => {
    e.preventDefault();
    if (!biz.restaurantName || !biz.address || !biz.zipCode) return toast.error('Fill all required fields');
    setStep(4);
  };

  // ---------- STEP 4 ----------
  const handleDocChange = (key, file) => setDocs(prev => ({ ...prev, [key]: file }));

  const submitDocs = (e) => {
    e.preventDefault();
    setStep(5);
  };

  // ---------- STEP 5 ----------
  const handlePhotoChange = (key, file) => setPhotos(prev => ({ ...prev, [key]: file }));

  const submitPhotos = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userPayload = {
        name: biz.restaurantName.trim(),
        email: basic.email.trim() || null,
        mobile: basic.mobile.trim(),
        password: basic.password.trim() || null,
        role: 'restaurant',
        isActive: true,
        parentId: getLoggedInUserId() ? { id: getLoggedInUserId() } : undefined,
      };

      const addUserRes = await ApiPost('/api/admin/users/add', userPayload);
      if (!addUserRes.success) {
        toast.error(addUserRes.fail || 'Failed to create restaurant');
        return;
      }

      const createdRestaurant = addUserRes.success.data?.data;
      const createdRestaurantId = createdRestaurant?.id;
      if (!createdRestaurantId) {
        toast.error('Restaurant created, but server did not return the new id');
        return;
      }

      const profilePayload = {
        restaurantId: { id: createdRestaurantId },
        restaurantName: biz.restaurantName.trim(),
        phone: basic.mobile.trim(),
        country: biz.country,
        timezone: biz.timezone,
        currencyCode: biz.currencyCode,
        isActive: true,
        primarys: biz.primaryColor,
        secondary: '#10b981',
        tertiary: '#f59e0b',
        fontColour: '#000000',
        fontName: 'Roboto',
      };

      let profileRes = await ApiPostFormData(
        '/api/admin/users_profile/profileAdd',
        (() => {
          const formData = new FormData();
          formData.append('payload', JSON.stringify(profilePayload));
          if (logoFile) {
            formData.append('logo', logoFile);
          }
          return formData;
        })()
      );

      if (!profileRes.success) {
        profileRes = await ApiPost('/api/admin/users_profile/add', profilePayload);
      }

      const restaurantRecordId = createdRestaurantId;

      setCreds({
        mobile: basic.mobile,
        restaurantName: biz.restaurantName,
        uniqueId: `RMS${String(restaurantRecordId).padStart(4, '0')}`,
        password: basic.password || 'Not set',
        pin: biz.restaurantCode || biz.zipCode || 'Not set',
        restaurantId: restaurantRecordId,
      });
      setStep(6);
      onSuccess?.();
      if (!profileRes.success) {
        toast.warning(profileRes.fail || 'Restaurant created, but profile save failed');
      } else {
        toast.success('Restaurant created successfully!');
      }
    } catch { toast.error('Something went wrong'); }
    finally { setSaving(false); }
  };

  // ---------- DONE ----------
  const handleFinish = () => {
    onSuccess();
    handleClose();
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static">
      <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9' }}>
        <Modal.Title style={{ fontSize: 17, fontWeight: 700 }}>
          <i className="bi bi-shop me-2" style={{ color: primaryColor }} />
          Add New Restaurant
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '24px 28px' }}>
        <StepIndicator current={step} />

        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <Form onSubmit={submitBasic}>
            <h6 className="mb-3 text-muted fw-semibold">Owner & Login Details</h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Owner Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={basic.ownerName} onChange={e => setBasic(p => ({ ...p, ownerName: e.target.value }))} placeholder="Full name of owner" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Mobile Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={basic.mobile} maxLength={10}
                    onChange={e => setBasic(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))}
                    placeholder="10-digit mobile" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={basic.email} onChange={e => setBasic(p => ({ ...p, email: e.target.value }))} placeholder="owner@restaurant.com" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Password (Login ke liye)</Form.Label>
                  <Form.Control type="password" value={basic.password} onChange={e => setBasic(p => ({ ...p, password: e.target.value }))} placeholder="Set login password" />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-4 gap-2">
              <Button variant="outline-secondary" onClick={handleClose}>Cancel</Button>
              <Button type="submit" style={{ background: primaryColor, borderColor: primaryColor }}>
                Next <i className="bi bi-arrow-right ms-1" />
              </Button>
            </div>
          </Form>
        )}

        {/* ── STEP 2: KYC ── */}
        {step === 2 && (
          <Form onSubmit={submitKyc}>
            <h6 className="mb-3 text-muted fw-semibold">Business Tax ID</h6>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>EIN Number (Employer Identification Number) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={kyc.einNumber}
                    maxLength={11}
                    onChange={e => setKyc(p => ({ ...p, einNumber: e.target.value }))}
                    placeholder="12-3456789"
                  />
                  <Form.Text className="text-muted">9-digit Federal Tax ID assigned by the IRS (format: XX-XXXXXXX)</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => setStep(1)}><i className="bi bi-arrow-left me-1" />Back</Button>
              <Button type="submit" style={{ background: primaryColor, borderColor: primaryColor }}>
                Next <i className="bi bi-arrow-right ms-1" />
              </Button>
            </div>
          </Form>
        )}

        {/* ── STEP 3: Business Details ── */}
        {step === 3 && (
          <Form onSubmit={submitBiz}>
            <h6 className="mb-3 text-muted fw-semibold">Business Details</h6>
            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Restaurant Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={biz.restaurantName} onChange={e => setBiz(p => ({ ...p, restaurantName: e.target.value }))} placeholder="Full restaurant name" required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Short Code</Form.Label>
                  <Form.Control value={biz.restaurantCode} onChange={e => setBiz(p => ({ ...p, restaurantCode: e.target.value.toUpperCase() }))} placeholder="e.g. RMS001" maxLength={10} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={biz.address} onChange={e => setBiz(p => ({ ...p, address: e.target.value }))} placeholder="Full address" required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control value={biz.city} onChange={e => setBiz(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control value={biz.state} onChange={e => setBiz(p => ({ ...p, state: e.target.value }))} placeholder="State" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>ZIP Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={biz.zipCode} maxLength={5} onChange={e => setBiz(p => ({ ...p, zipCode: e.target.value.replace(/\D/g, '') }))} placeholder="5-digit ZIP" required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Country <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={biz.country}
                    onChange={e => {
                      const selected = COUNTRY_TIMEZONES.find(c => c.country === e.target.value);
                      setBiz(p => ({
                        ...p,
                        country: e.target.value,
                        timezone: selected?.timezone || p.timezone,
                        currencyCode: selected?.currency || p.currencyCode,
                      }));
                    }}
                  >
                    {COUNTRY_TIMEZONES.map(c => (
                      <option key={c.country} value={c.country}>{c.flag} {c.country}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Timezone</Form.Label>
                  <Form.Control
                    value={biz.timezone}
                    readOnly
                    style={{ background: '#f8fafc', cursor: 'default', fontSize: 13 }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: 11 }}>
                    Auto-set based on country
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Currency</Form.Label>
                  <Form.Control
                    value={biz.currencyCode}
                    readOnly
                    style={{ background: '#f8fafc', cursor: 'default', fontSize: 13 }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: 11 }}>
                    Auto-set based on country
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Entity Type</Form.Label>
                  <Form.Select value={biz.entityType} onChange={e => setBiz(p => ({ ...p, entityType: e.target.value }))}>
                    {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Restaurant Type</Form.Label>
                  <Form.Select value={biz.restaurantType} onChange={e => setBiz(p => ({ ...p, restaurantType: e.target.value }))}>
                    {RESTAURANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* ── Branding ── */}
            <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="bi bi-palette2" style={{ color: primaryColor }} />
                Branding <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>(optional)</span>
              </div>
              <Row className="g-3">
                {/* Logo Upload */}
                <Col md={5}>
                  <Form.Label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Restaurant Logo</Form.Label>
                  <div
                    onClick={() => logoInputRef.current.click()}
                    style={{
                      border: `2px dashed ${logoPreview ? '#22c55e' : '#d1d5db'}`,
                      borderRadius: 10, padding: '12px', cursor: 'pointer',
                      background: logoPreview ? '#f0fdf4' : '#fff',
                      display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s'
                    }}
                  >
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-image text-muted" style={{ fontSize: 20 }} />
                        </div>
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: logoPreview ? '#16a34a' : '#374151' }}>
                        {logoFile ? logoFile.name : 'Upload Logo'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>PNG, JPG • Max 2MB</div>
                    </div>
                    {logoFile && (
                      <button type="button" className="btn btn-sm btn-outline-danger py-0 px-1"
                        onClick={e => { e.stopPropagation(); setLogoFile(null); setLogoPreview(''); setBiz(p => ({ ...p, logoUrl: '' })); }}>
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" hidden accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setLogoFile(f);
                      const reader = new FileReader();
                      reader.onloadend = () => { setLogoPreview(reader.result); setBiz(p => ({ ...p, logoUrl: reader.result })); };
                      reader.readAsDataURL(f);
                    }}
                  />
                </Col>

                {/* Color Picker */}
                <Col md={7}>
                  <Form.Label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Brand / Theme Color</Form.Label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {PRESET_COLORS.map(c => (
                      <div key={c} onClick={() => setBiz(p => ({ ...p, primaryColor: c }))}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                          border: biz.primaryColor === c ? '3px solid #111' : '2px solid #fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'transform .15s',
                          transform: biz.primaryColor === c ? 'scale(1.2)' : 'scale(1)'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={biz.primaryColor}
                      onChange={e => setBiz(p => ({ ...p, primaryColor: e.target.value }))}
                      style={{ width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }}
                    />
                    <div style={{ padding: '6px 14px', borderRadius: 8, background: biz.primaryColor, color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
                      {biz.primaryColor.toUpperCase()}
                    </div>
                    <small style={{ color: '#9ca3af' }}>Preview</small>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => setStep(2)}><i className="bi bi-arrow-left me-1" />Back</Button>
              <Button type="submit" style={{ background: primaryColor, borderColor: primaryColor }}>
                Next <i className="bi bi-arrow-right ms-1" />
              </Button>
            </div>
          </Form>
        )}

        {/* ── STEP 4: Documents ── */}
        {step === 4 && (
          <Form onSubmit={submitDocs}>
            <h6 className="mb-3 text-muted fw-semibold">Business Documents Upload</h6>
            <Row>
              <Col md={6}>
                <FileUploadBox label="EIN Proof" fileKey="einProof" file={docs.einProof} onChange={handleDocChange} acceptPdf />
              </Col>
              <Col md={6}>
                <FileUploadBox label="Business Registration Proof" fileKey="businessRegistration" file={docs.businessRegistration} onChange={handleDocChange} acceptPdf />
              </Col>
              <Col md={6}>
                <FileUploadBox label="Food License" fileKey="foodLicense" file={docs.foodLicense} onChange={handleDocChange} acceptPdf />
              </Col>
              <Col md={6}>
                <FileUploadBox label="Food Protection Certificate" fileKey="foodProtectionCertificate" file={docs.foodProtectionCertificate} onChange={handleDocChange} acceptPdf />
              </Col>
              <Col md={6}>
                <FileUploadBox label="Address Proof (Lease)" fileKey="addressProof" file={docs.addressProof} onChange={handleDocChange} acceptPdf />
              </Col>
              <Col md={6}>
                <FileUploadBox label="Fire Safety Certificate" fileKey="fireSafety" file={docs.fireSafety} onChange={handleDocChange} acceptPdf />
              </Col>
              <Col md={6}>
                <FileUploadBox label="Liquor License" fileKey="liquorLicense" file={docs.liquorLicense} onChange={handleDocChange} acceptPdf />
              </Col>
            </Row>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              All documents are optional. You can continue without uploading any files.
            </p>
            <div className="d-flex justify-content-between mt-2">
              <Button variant="outline-secondary" onClick={() => setStep(3)}><i className="bi bi-arrow-left me-1" />Back</Button>
              <Button type="submit" style={{ background: primaryColor, borderColor: primaryColor }}>
                Next <i className="bi bi-arrow-right ms-1" />
              </Button>
            </div>
          </Form>
        )}

        {/* ── STEP 5: Photos ── */}
        {step === 5 && (
          <Form onSubmit={submitPhotos}>
            <h6 className="mb-3 text-muted fw-semibold">
              Restaurant Photos
              <small className="text-muted ms-2 fw-normal">(all optional)</small>
            </h6>
            <Row>
              {[
                { key: 'restaurantFront',  label: 'Restaurant Front',  req: false },
                { key: 'restaurantInside', label: 'Restaurant Inside', req: false },
                { key: 'restaurantBoard',  label: 'Name Board',        req: false },
                { key: 'selfie',           label: 'Owner Selfie',      req: false },
                { key: 'visitingCard',     label: 'Visiting Card',     req: false, pdf: true },
                { key: 'otherDocument',    label: 'Other Document',    req: false, pdf: true },
              ].map(p => (
                <Col md={6} key={p.key}>
                  <FileUploadBox label={p.label} required={p.req} fileKey={p.key} file={photos[p.key]} onChange={handlePhotoChange} acceptPdf={p.pdf} />
                </Col>
              ))}
            </Row>
            {/* Upload progress */}
            <div className="mb-3">
              {(() => {
                const total   = 6;
                const uploaded = ['restaurantFront','restaurantInside','restaurantBoard','selfie','visitingCard','otherDocument'].filter(k => photos[k]).length;
                return (
                  <div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: 12, color: '#6b7280' }}>
                      <span>Uploaded photos: {uploaded}/{total}</span>
                      <span>{Math.round((uploaded / total) * 100)}%</span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div className="progress-bar bg-success" style={{ width: `${(uploaded / total) * 100}%`, transition: 'width .3s' }} />
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => setStep(4)}><i className="bi bi-arrow-left me-1" />Back</Button>
              <Button type="submit" disabled={saving} style={{ background: primaryColor, borderColor: primaryColor }}>
                {saving ? <><Spinner size="sm" className="me-1" />Creating...</> : <>Create Restaurant <i className="bi bi-check-lg ms-1" /></>}
              </Button>
            </div>
          </Form>
        )}

        {/* ── STEP 6: Success ── */}
        {step === 6 && credentials && (
          <div className="text-center">
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: 36 }} />
            </div>
            <h5 className="fw-bold mb-1">Restaurant Created!</h5>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
              <strong>{credentials.restaurantName}</strong> ko successfully add kar diya gaya hai.
              Neeche credentials save karo.
            </p>

            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px 24px', textAlign: 'left', border: '1px solid #e5e7eb' }}>
              {[
                { label: 'Restaurant',  value: credentials.restaurantName, icon: 'bi-shop'         },
                { label: 'Mobile',      value: credentials.mobile,         icon: 'bi-phone'        },
                { label: 'Restaurant ID', value: credentials.uniqueId,     icon: 'bi-person-badge' },
                { label: 'Password',    value: credentials.password,       icon: 'bi-key',  secret: true },
                { label: 'Short Code',   value: credentials.pin,            icon: 'bi-lock', secret: true },
              ].map(item => (
                <div key={item.label} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div className="d-flex align-items-center gap-2">
                    <i className={`bi ${item.icon}`} style={{ color: primaryColor, width: 18 }} />
                    <span style={{ fontSize: 13, color: '#6b7280', minWidth: 90 }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                    onClick={() => copyText(item.value)}
                    title="Copy"
                  >
                    <i className="bi bi-copy" style={{ fontSize: 12 }} />
                  </button>
                </div>
              ))}
            </div>

            <div className="d-flex gap-2 mt-4">
              <Button variant="outline-secondary" className="flex-grow-1" onClick={handleClose}>
                Close
              </Button>
              <Button className="flex-grow-1" style={{ background: primaryColor, borderColor: primaryColor }} onClick={handleFinish}>
                <i className="bi bi-check-lg me-1" />Done — Refresh List
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AddRestaurantModal;
