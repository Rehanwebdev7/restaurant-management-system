import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Button, Form, Spinner, Modal, Table, Row, Col, Image } from 'react-bootstrap';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { ApiGet, ApiPostFormData, ApiPut, ApiDelete } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../../contexts/DarkModeContext';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';

// ==================== LEVEL CONFIG ====================
const LEVEL_CONFIG = {
  branch: { label: 'Branch', icon: 'bi-shop', color: '#0891b2', bg: '#0891b210' },
  category: { label: 'Category', icon: 'bi-grid-3x3-gap-fill', color: '#6366f1', bg: '#6366f110' },
  subcategory: { label: 'Subcategory', icon: 'bi-collection', color: '#14b8a6', bg: '#14b8a610' },
  item: { label: 'Item', icon: 'bi-cup-hot', color: '#ea580c', bg: '#ea580c10' },
  addon: { label: 'Addon', icon: 'bi-puzzle', color: '#8b5cf6', bg: '#8b5cf610' },
};

const sortCategoriesAscending = (records = []) => [...records].sort((a, b) => {
  const aPriority = Number.isFinite(Number(a?.priority)) ? Number(a.priority) : Number.MAX_SAFE_INTEGER;
  const bPriority = Number.isFinite(Number(b?.priority)) ? Number(b.priority) : Number.MAX_SAFE_INTEGER;

  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  return (a?.id || 0) - (b?.id || 0);
});

// ==================== TOGGLE SWITCH ====================
const ToggleSwitch = ({ isActive, onToggle, loading, size = 'sm' }) => {
  const w = size === 'lg' ? 40 : 34;
  const h = size === 'lg' ? 22 : 18;
  const dot = size === 'lg' ? 16 : 13;
  return (
    <div
      onClick={e => { e.stopPropagation(); if (!loading) onToggle(!isActive); }}
      title={isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
      style={{
        width: w, height: h, borderRadius: h, cursor: loading ? 'wait' : 'pointer',
        background: isActive ? '#10b981' : '#d1d5db', position: 'relative',
        transition: 'background 0.25s ease', opacity: loading ? 0.6 : 1, flexShrink: 0,
      }}
    >
      <div style={{
        width: dot, height: dot, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: (h - dot) / 2,
        left: isActive ? w - dot - (h - dot) / 2 : (h - dot) / 2,
        transition: 'left 0.25s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
};

// ==================== ANIMATED COLLAPSE ====================
const AnimatedCollapse = ({ open, children }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [isFullyOpen, setIsFullyOpen] = useState(false);

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
      // After transition completes, remove overflow hidden so modals/popups aren't clipped
      const timer = setTimeout(() => setIsFullyOpen(true), 380);
      return () => clearTimeout(timer);
    } else {
      setIsFullyOpen(false);
      setHeight(0);
    }
  }, [open, children]);

  return (
    <div style={{
      maxHeight: open ? (isFullyOpen ? 'none' : height + 60) : 0,
      overflow: isFullyOpen ? 'visible' : 'hidden',
      transition: isFullyOpen ? 'none' : 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

// ==================== SHARED MODAL STYLES ====================
const modalStyles = (pc, isDarkMode) => ({
  overlay: { backdropFilter: 'blur(6px)' },
  dialog: { borderRadius: '20px', overflow: 'hidden', border: 'none', boxShadow: isDarkMode ? '0 25px 60px rgba(2,6,23,0.55), 0 0 0 1px rgba(148,163,184,0.08)' : '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)' },
  header: { padding: '28px 28px 0', border: 'none', background: 'transparent' },
  headerIcon: { width: 44, height: 44, borderRadius: '14px', background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 70%, #000))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', flexShrink: 0, boxShadow: `0 8px 20px color-mix(in srgb, ${pc} 35%, transparent)` },
  headerTitle: { fontSize: '18px', fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a', letterSpacing: '-0.3px' },
  headerSub: { fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#94a3b8', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: '10px', border: 'none', background: isDarkMode ? '#1e293b' : '#f1f5f9', color: isDarkMode ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px', flexShrink: 0, marginLeft: 'auto' },
  body: { padding: '24px 28px' },
  label: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: isDarkMode ? '#cbd5e1' : '#64748b', marginBottom: '6px', display: 'block' },
  input: { borderRadius: '10px', border: `1.5px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: '10px 14px', fontSize: '14px', transition: 'all 0.2s', background: isDarkMode ? '#111827' : '#f8fafc', color: isDarkMode ? '#f8fafc' : '#0f172a' },
  inputFocus: `outline: none; border-color: ${pc}; box-shadow: 0 0 0 3px color-mix(in srgb, ${pc} 12%, transparent); background: ${isDarkMode ? '#0f172a' : '#fff'};`,
  uploadZone: { border: `2px dashed ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '14px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s', background: isDarkMode ? '#111827' : '#fafbfc', position: 'relative', overflow: 'hidden' },
  uploadZoneHover: `border-color: ${pc}; background: ${isDarkMode ? 'rgba(15,23,42,0.92)' : `color-mix(in srgb, ${pc} 4%, #fff)`};`,
  footer: { padding: '0 28px 24px', border: 'none', display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 22px', borderRadius: '12px', border: `1.5px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? '#cbd5e1' : '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  submitBtn: { padding: '10px 28px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 80%, #000))`, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 14px color-mix(in srgb, ${pc} 35%, transparent)`, display: 'flex', alignItems: 'center', gap: '6px' },
});

// Reusable image upload zone
const ImageUploadZone = ({ imagePreview, onSelect, onRemove, pc }) => {
  const { isDarkMode } = useDarkMode();
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer?.files?.[0]; if (file && file.type.startsWith('image/')) { const reader = new FileReader(); reader.onloadend = () => onSelect(reader.result); reader.readAsDataURL(file); } };
  return (
    <div
      onClick={() => !imagePreview && fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{ border: `2px dashed ${dragOver ? pc : imagePreview ? 'transparent' : (isDarkMode ? '#334155' : '#e2e8f0')}`, borderRadius: '14px', padding: imagePreview ? '0' : '20px 16px', textAlign: 'center', cursor: imagePreview ? 'default' : 'pointer', transition: 'all 0.25s', background: dragOver ? (isDarkMode ? '#0f172a' : `color-mix(in srgb, ${pc} 4%, #fff)`) : imagePreview ? 'transparent' : (isDarkMode ? '#111827' : '#fafbfc'), position: 'relative', overflow: 'hidden', minHeight: imagePreview ? 'auto' : '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => onSelect(reader.result); reader.readAsDataURL(file); } e.target.value = ''; }} />
      {imagePreview ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', width: '100%' }}>
          <div style={{ width: 64, height: 64, borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: `2px solid ${isDarkMode ? '#1e293b' : '#f1f5f9'}` }}>
            <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Image uploaded</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Click buttons to modify</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} style={{ width: 32, height: 32, borderRadius: '8px', border: `1.5px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? '#cbd5e1' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', transition: 'all 0.2s' }} title="Change image"><i className="bi bi-arrow-repeat"></i></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ width: 32, height: 32, borderRadius: '8px', border: '1.5px solid #fee2e2', background: isDarkMode ? '#0f172a' : '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', transition: 'all 0.2s' }} title="Remove image"><i className="bi bi-trash3"></i></button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: isDarkMode ? 'rgba(59,130,246,0.14)' : `color-mix(in srgb, ${pc} 10%, #fff)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            <i className="bi bi-cloud-arrow-up" style={{ fontSize: '18px', color: pc }}></i>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#475569' }}>Drop image or <span style={{ color: pc }}>browse</span></div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>PNG, JPG up to 5MB</div>
        </div>
      )}
    </div>
  );
};

// ==================== CATEGORY MODAL ====================
const CategoryModal = ({ show, onHide, category, branchId, onSave, primaryColor }) => {
  const { isDarkMode } = useDarkMode();
  const [form, setForm] = useState({ name: '', description: '', priority: 1, isActive: true });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const ms = modalStyles(primaryColor, isDarkMode);

  useEffect(() => {
    if (show) {
      if (category) { setForm({ name: category.name || '', description: category.description || '', priority: category.priority || 1, isActive: category.isActive ?? true }); setImagePreview(category.iconUrl || null); }
      else { setForm({ name: '', description: '', priority: 1, isActive: true }); setImagePreview(null); }
      setImageFile(null); setErrors({});
    }
  }, [show, category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description.trim(), priority: parseInt(form.priority), isActive: form.isActive, branchId: { id: branchId } };
    if (category) payload.id = category.id;
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    if (imageFile) fd.append('photo', imageFile);
    const endpoint = category ? '/api/restaurant/menu_category/update_Category' : '/api/restaurant/menu_category/add_Category';
    const result = await ApiPostFormData(endpoint, fd);
    if (result.success) { toast.success(category ? 'Category updated' : 'Category added'); onSave(); onHide(); } else toast.error(result.fail);
    setSaving(false);
  };
  const handleImageSelect = (src) => { setTempImageSrc(src); setShowCropper(true); };

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" contentClassName="mtree-modal-content">
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={ms.headerIcon}><i className={`bi bi-${category ? 'pencil-square' : 'grid-3x3-gap-fill'}`}></i></div>
            <div style={{ flex: 1 }}>
              <div style={ms.headerTitle}>{category ? 'Edit Category' : 'New Category'}</div>
              <div style={ms.headerSub}>{category ? 'Update category details below' : 'Add a new category to your menu'}</div>
            </div>
            <button onClick={onHide} style={ms.closeBtn} className="mtree-close-btn"><i className="bi bi-x-lg"></i></button>
          </div>
        </div>
        <Form onSubmit={handleSubmit}>
          <div style={ms.body}>
            <Row className="g-3">
              <Col md={6}>
                <label style={ms.label}>Category Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="mtree-input" placeholder="e.g. Starters, Main Course" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors({}); }} style={{ ...ms.input, width: '100%', ...(errors.name ? { borderColor: '#ef4444' } : {}) }} />
                {errors.name && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.name}</div>}
              </Col>
              <Col md={3}>
                <label style={ms.label}>Priority</label>
                <input className="mtree-input" type="number" min="0" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...ms.input, width: '100%' }} />
              </Col>
              <Col md={3}>
                <label style={ms.label}>Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px' }}>
                  <ToggleSwitch isActive={form.isActive} onToggle={v => setForm(p => ({ ...p, isActive: v }))} loading={false} size="lg" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: form.isActive ? '#10b981' : '#94a3b8' }}>{form.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </Col>
              <Col md={6}>
                <label style={ms.label}>Image</label>
                <ImageUploadZone imagePreview={imagePreview} onSelect={handleImageSelect} onRemove={() => { setImageFile(null); setImagePreview(null); }} pc={primaryColor} />
              </Col>
              <Col md={6}>
                <label style={ms.label}>Description</label>
                <textarea className="mtree-input" rows={3} placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...ms.input, width: '100%', resize: 'vertical', minHeight: '90px' }} />
              </Col>
            </Row>
          </div>
          <div style={ms.footer}>
            <button type="button" onClick={onHide} style={ms.cancelBtn} className="mtree-cancel-btn">Cancel</button>
            <button type="submit" disabled={saving} style={{ ...ms.submitBtn, opacity: saving ? 0.7 : 1 }} className="mtree-submit-btn">
              {saving ? <Spinner size="sm" /> : <><i className="bi bi-check-lg"></i>{category ? 'Update' : 'Add Category'}</>}
            </button>
          </div>
        </Form>
      </Modal>
      <ImageCropperModal show={showCropper} onHide={() => setShowCropper(false)} imageSrc={tempImageSrc} onCropComplete={(f, url) => { setImageFile(f); setImagePreview(url); }} aspectRatio={1} title="Crop Category Image" primaryColor={primaryColor} />
    </>
  );
};

// ==================== SUBCATEGORY MODAL ====================
const SubcategoryModal = ({ show, onHide, subcategory, categoryId, branchId, onSave, primaryColor }) => {
  const { isDarkMode } = useDarkMode();
  const [form, setForm] = useState({ name: '', description: '', isActive: true, priority: 1 });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const ms = modalStyles(primaryColor, isDarkMode);

  useEffect(() => {
    if (show) {
      if (subcategory) { setForm({ name: subcategory.name || '', description: subcategory.description || '', isActive: subcategory.isActive ?? true, priority: subcategory.priority ?? 1 }); setImagePreview(subcategory.iconUrl || null); }
      else { setForm({ name: '', description: '', isActive: true, priority: 1 }); setImagePreview(null); }
      setImageFile(null); setErrors({});
    }
  }, [show, subcategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description.trim(), isActive: form.isActive, priority: parseInt(form.priority) || 1, menuCategoryId: { id: categoryId }, branchId: { id: branchId } };
    if (subcategory) payload.id = subcategory.id;
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    if (imageFile) fd.append('photo', imageFile);
    const endpoint = subcategory ? '/api/restaurant/menu_subcategory/update_Subcategory' : '/api/restaurant/menu_subcategory/add_Subcategory';
    const result = await ApiPostFormData(endpoint, fd);
    if (result.success) { toast.success(subcategory ? 'Updated' : 'Added'); onSave(); onHide(); } else toast.error(result.fail);
    setSaving(false);
  };
  const handleImageSelect = (src) => { setTempImageSrc(src); setShowCropper(true); };

  const pc = primaryColor;
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer?.files?.[0]; if (file && file.type.startsWith('image/')) { const reader = new FileReader(); reader.onloadend = () => handleImageSelect(reader.result); reader.readAsDataURL(file); } };
  const handleFileChange = (e) => { const file = e.target.files?.[0]; if (file && file.type.startsWith('image/')) { const reader = new FileReader(); reader.onloadend = () => handleImageSelect(reader.result); reader.readAsDataURL(file); } e.target.value = ''; };

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" contentClassName="mtree-modal-content">
        <Form onSubmit={handleSubmit}>
          {/* ═══ HERO HEADER with gradient mesh background ═══ */}
          <div style={{
            position: 'relative', padding: '32px 32px 24px', overflow: 'hidden',
            background: `linear-gradient(135deg, color-mix(in srgb, ${pc} 6%, #fff) 0%, #fff 50%, color-mix(in srgb, ${pc} 4%, #fff) 100%)`,
            borderBottom: '1px solid #f1f5f9',
          }}>
            {/* Decorative blurred orbs */}
            <div style={{ position: 'absolute', top: -40, right: -20, width: 120, height: 120, borderRadius: '50%', background: `color-mix(in srgb, ${pc} 8%, transparent)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'color-mix(in srgb, #8b5cf6 6%, transparent)', filter: 'blur(30px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '18px', flexShrink: 0, position: 'relative',
                background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 60%, #8b5cf6))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 10px 30px color-mix(in srgb, ${pc} 30%, transparent)`,
              }}>
                <i className={`bi bi-${subcategory ? 'pencil-square' : 'layers-fill'}`} style={{ fontSize: '22px', color: '#fff' }}></i>
                {/* Shine effect */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: '18px', background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)', pointerEvents: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                  {subcategory ? 'Edit Subcategory' : 'New Subcategory'}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: 2 }}>
                  {subcategory ? 'Modify name, image, priority & visibility' : 'Add a fresh subcategory to organize your menu'}
                </div>
              </div>
              <button type="button" onClick={onHide} style={{
                width: 38, height: 38, borderRadius: '14px', border: 'none',
                background: 'rgba(0,0,0,0.04)', backdropFilter: 'blur(10px)',
                color: '#64748b', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px', flexShrink: 0,
              }} className="mtree-close-btn"><i className="bi bi-x-lg"></i></button>
            </div>

            {/* ── Inline Name Input inside header ── */}
            <div style={{ position: 'relative' }}>
              <input
                className="mtree-input" placeholder={subcategory ? 'Subcategory name' : 'Enter subcategory name...'}
                value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors({}); }}
                autoFocus
                style={{
                  width: '100%', padding: '14px 18px', fontSize: '16px', fontWeight: 700,
                  borderRadius: '14px', border: `2px solid ${errors.name ? '#ef4444' : 'rgba(0,0,0,0.06)'}`,
                  background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                  outline: 'none', transition: 'all 0.3s', color: '#0f172a', letterSpacing: '-0.3px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                }}
                onFocus={e => { e.target.style.borderColor = pc; e.target.style.boxShadow = `0 0 0 4px color-mix(in srgb, ${pc} 10%, transparent)`; }}
                onBlur={e => { e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)'; }}
              />
              {errors.name && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><i className="bi bi-exclamation-triangle-fill"></i>Name is required</div>}
            </div>
          </div>

          {/* ═══ BODY - Two column layout ═══ */}
          <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* ── LEFT COLUMN: Image Upload ── */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '6px', background: '#ea580c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-image" style={{ fontSize: '10px', color: '#ea580c' }}></i>
                </div>
                Cover Image
              </div>

              {imagePreview ? (
                <div style={{
                  position: 'relative', borderRadius: '18px', overflow: 'hidden',
                  border: '2px solid #e8ecf1', height: 220, background: '#0f172a',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}>
                  <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }} />
                  {/* Overlay controls */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.2) 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 14,
                    opacity: 0, transition: 'opacity 0.25s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{
                        width: 34, height: 34, borderRadius: '10px', border: 'none', fontSize: '14px',
                        background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><i className="bi bi-trash3"></i></button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button type="button" onClick={() => fileRef.current?.click()} style={{
                        padding: '8px 20px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 700,
                        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
                        color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', letterSpacing: '-0.2px',
                      }}><i className="bi bi-arrow-repeat" style={{ fontSize: '13px' }}></i>Change Image</button>
                    </div>
                  </div>
                  {/* Badge */}
                  <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', fontSize: '10px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="bi bi-check-circle-fill" style={{ fontSize: '9px' }}></i>Uploaded
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  style={{
                    borderRadius: '18px', height: 220, position: 'relative', overflow: 'hidden',
                    border: `2.5px dashed ${dragOver ? pc : '#d1d5db'}`,
                    background: dragOver ? `color-mix(in srgb, ${pc} 4%, #fff)` : 'linear-gradient(145deg, #fafbfd, #f5f7fa)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.3s', gap: 10,
                  }}
                >
                  {/* Decorative ring */}
                  <div style={{
                    width: 64, height: 64, borderRadius: '20px', position: 'relative',
                    background: `linear-gradient(135deg, color-mix(in srgb, ${pc} 12%, #fff), color-mix(in srgb, ${pc} 6%, #fff))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 8px 24px color-mix(in srgb, ${pc} 10%, transparent)`,
                  }}>
                    <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: '24px', color: pc }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                      {dragOver ? 'Drop it here!' : 'Upload Cover Image'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 3 }}>
                      Drag & drop or <span style={{ color: pc, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>browse files</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#c1c8d4', background: '#f1f5f9', padding: '3px 10px', borderRadius: '6px' }}>PNG, JPG, WEBP up to 5MB</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            </div>

            {/* ── RIGHT COLUMN: Controls ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Status Toggle Card */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '6px', background: form.isActive ? '#10b98110' : '#64748b10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-broadcast" style={{ fontSize: '10px', color: form.isActive ? '#10b981' : '#64748b' }}></i>
                  </div>
                  Visibility
                </div>
                <div onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s', userSelect: 'none',
                  background: form.isActive
                    ? 'linear-gradient(135deg, #ecfdf5, #f0fdf4)'
                    : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  border: `1.5px solid ${form.isActive ? '#86efac' : '#e2e8f0'}`,
                  boxShadow: form.isActive ? '0 4px 16px rgba(16,185,129,0.1)' : 'none',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '14px', flexShrink: 0,
                    background: form.isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: form.isActive ? '0 6px 16px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s',
                  }}>
                    <i className={`bi bi-${form.isActive ? 'eye-fill' : 'eye-slash-fill'}`} style={{ fontSize: '17px', color: '#fff' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: form.isActive ? '#065f46' : '#475569', letterSpacing: '-0.3px' }}>
                      {form.isActive ? 'Live on Menu' : 'Hidden'}
                    </div>
                    <div style={{ fontSize: '11px', color: form.isActive ? '#6ee7b7' : '#94a3b8', fontWeight: 500, marginTop: 1 }}>
                      {form.isActive ? 'Customers can see this subcategory' : 'Not visible to customers'}
                    </div>
                  </div>
                  <ToggleSwitch isActive={form.isActive} onToggle={v => setForm(p => ({ ...p, isActive: v }))} loading={false} size="lg" />
                </div>
              </div>

              {/* Priority Stepper */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '6px', background: '#6366f110', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-arrows-move" style={{ fontSize: '10px', color: '#6366f1' }}></i>
                  </div>
                  Display Order
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px', borderRadius: '14px',
                  background: '#f8fafc', border: '1.5px solid #e8ecf1',
                }}>
                  <button type="button" onClick={() => setForm(p => ({ ...p, priority: Math.max(0, (parseInt(p.priority) || 1) - 1) }))} style={{
                    width: 42, height: 42, borderRadius: '10px', border: 'none',
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', color: '#64748b', transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0,
                  }}><i className="bi bi-dash-lg"></i></button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <input type="number" min="0" value={form.priority}
                      onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                      style={{
                        width: '100%', padding: '6px', fontSize: '22px', fontWeight: 800,
                        textAlign: 'center', border: 'none', background: 'transparent',
                        outline: 'none', color: '#1e293b', letterSpacing: '-0.5px',
                      }} />
                    <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginTop: -2 }}>Priority</div>
                  </div>
                  <button type="button" onClick={() => setForm(p => ({ ...p, priority: (parseInt(p.priority) || 0) + 1 }))} style={{
                    width: 42, height: 42, borderRadius: '10px', border: 'none',
                    background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 80%, #8b5cf6))`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', color: '#fff', transition: 'all 0.2s',
                    boxShadow: `0 4px 12px color-mix(in srgb, ${pc} 25%, transparent)`, flexShrink: 0,
                  }}><i className="bi bi-plus-lg"></i></button>
                </div>
              </div>

              {/* Description */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '6px', background: '#8b5cf610', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-text-paragraph" style={{ fontSize: '10px', color: '#8b5cf6' }}></i>
                  </div>
                  Description
                  <span style={{ fontSize: '9px', fontWeight: 500, color: '#b0b8c4', textTransform: 'none', letterSpacing: 0 }}>optional</span>
                </div>
                <textarea className="mtree-input" rows={3} placeholder="Brief description of this subcategory..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: '13px', borderRadius: '14px',
                    border: '1.5px solid #e8ecf1', background: '#fafbfd', outline: 'none',
                    resize: 'none', transition: 'all 0.3s', minHeight: 72, color: '#334155',
                    lineHeight: 1.6,
                  }}
                  onFocus={e => { e.target.style.borderColor = pc; e.target.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${pc} 8%, transparent)`; }}
                  onBlur={e => { e.target.style.borderColor = '#e8ecf1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div style={{
            padding: '18px 32px 24px', display: 'flex', alignItems: 'center',
            background: 'linear-gradient(180deg, #fafbfd, #f5f7fa)',
            borderTop: '1px solid #edf0f4',
            borderRadius: '0 0 20px 20px',
          }}>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {form.isActive && <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></div>Live</span>}
              {!form.isActive && <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}></div>Draft</span>}
              {form.priority !== '' && <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 4 }}><i className="bi bi-arrow-up-short" style={{ fontSize: '11px' }}></i>#{form.priority}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onHide} style={{
                padding: '11px 24px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#475569', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', transition: 'all 0.2s',
              }} className="mtree-cancel-btn">Cancel</button>
              <button type="submit" disabled={saving} style={{
                padding: '11px 32px', borderRadius: '12px', border: 'none', position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 65%, #7c3aed))`,
                color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.3s', letterSpacing: '-0.2px',
                boxShadow: `0 6px 20px color-mix(in srgb, ${pc} 35%, transparent)`,
                opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8,
              }} className="mtree-submit-btn">
                {/* Shine overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)', pointerEvents: 'none' }} />
                {saving ? <Spinner size="sm" /> : <><i className="bi bi-check2-circle" style={{ fontSize: '16px' }}></i><span style={{ position: 'relative' }}>{subcategory ? 'Save Changes' : 'Create Subcategory'}</span></>}
              </button>
            </div>
          </div>
        </Form>
      </Modal>
      <ImageCropperModal show={showCropper} onHide={() => setShowCropper(false)} imageSrc={tempImageSrc} onCropComplete={(f, url) => { setImageFile(f); setImagePreview(url); }} aspectRatio={1} title="Crop Subcategory Image" primaryColor={primaryColor} />
    </>
  );
};

// ==================== SECTION CARD ====================
const SectionCard = ({ icon, title, children, pc, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '16px', borderRadius: '14px', border: '1px solid var(--mtree-border)', background: 'var(--mtree-surface)', overflow: 'hidden', transition: 'box-shadow 0.2s', boxShadow: open ? 'var(--mtree-card-shadow)' : 'none' }}>
      <div onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', cursor: 'pointer', userSelect: 'none', background: open ? 'var(--mtree-surface-alt)' : 'var(--mtree-surface)', transition: 'background 0.2s' }}>
        <div style={{ width: 30, height: 30, borderRadius: '9px', background: `linear-gradient(135deg, ${pc}18, ${pc}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bi bi-${icon}`} style={{ fontSize: '13px', color: pc }}></i>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mtree-text)', flex: 1, letterSpacing: '-0.2px' }}>{title}</span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '12px', color: '#94a3b8' }}></i>
      </div>
      {open && <div style={{ padding: '4px 18px 18px' }}>{children}</div>}
    </div>
  );
};

// ==================== SPICE LEVEL PILL SELECTOR ====================
const SpicePills = ({ value, onChange }) => {
  const levels = [
    { value: '', label: 'None', color: '#94a3b8', bg: '#f1f5f9' },
    { value: 'MILD', label: 'Mild', color: '#f59e0b', bg: '#fef3c7' },
    { value: 'MEDIUM', label: 'Medium', color: '#f97316', bg: '#ffedd5' },
    { value: 'HOT', label: 'Hot', color: '#ef4444', bg: '#fee2e2' },
    { value: 'EXTRA_HOT', label: 'Extra Hot', color: '#dc2626', bg: '#fecaca' },
  ];
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {levels.map(l => {
        const active = value === l.value;
        return (
          <button key={l.value} type="button" onClick={() => onChange(l.value)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${active ? l.color : '#e2e8f0'}`, background: active ? l.bg : '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: active ? l.color : '#94a3b8', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {l.value === 'MILD' && '🌶 '}{l.value === 'MEDIUM' && '🌶🌶 '}{l.value === 'HOT' && '🌶🌶🌶 '}{l.value === 'EXTRA_HOT' && '🔥 '}{l.label}
          </button>
        );
      })}
    </div>
  );
};

// ==================== INLINE ADDON ROW (compact) ====================
const InlineAddonRow = ({ addon, index, onChange, onRemove, pc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'var(--mtree-surface-alt)', borderRadius: '8px', border: '1px solid var(--mtree-border-soft)' }}>
    <input placeholder="Add-on name" value={addon.name} onChange={e => onChange({ ...addon, name: e.target.value })}
      style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1.5px solid var(--mtree-border)', fontSize: '12px', background: 'var(--mtree-surface)', outline: 'none', minWidth: 0, color: 'var(--mtree-text)' }} className="mtree-input" />
    <div style={{ position: 'relative', width: '72px', flexShrink: 0 }}>
      <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>$</span>
      <input type="number" step="0.01" placeholder="0" value={addon.price} onChange={e => onChange({ ...addon, price: e.target.value })}
        style={{ width: '100%', padding: '5px 6px 5px 20px', borderRadius: '6px', border: '1.5px solid var(--mtree-border)', fontSize: '12px', background: 'var(--mtree-surface)', outline: 'none', color: 'var(--mtree-text)' }} className="mtree-input" />
    </div>
    <div title={addon.isRequired ? 'Required' : 'Optional'} onClick={() => onChange({ ...addon, isRequired: !addon.isRequired })}
      style={{ width: 26, height: 26, borderRadius: '6px', border: `1.5px solid ${addon.isRequired ? pc : 'var(--mtree-border)'}`, background: addon.isRequired ? `${pc}10` : 'var(--mtree-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <i className={`bi bi-${addon.isRequired ? 'check-circle-fill' : 'circle'}`} style={{ fontSize: '11px', color: addon.isRequired ? pc : '#cbd5e1' }}></i>
    </div>
    <button type="button" onClick={onRemove}
      style={{ width: 26, height: 26, borderRadius: '6px', border: '1px solid #fee2e2', background: 'var(--mtree-surface)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
      <i className="bi bi-trash3"></i>
    </button>
  </div>
);

// ==================== VEG / NON-VEG ICON (FSSAI style) ====================
const VegIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <rect x="1" y="1" width="18" height="18" rx="3" fill="none" stroke="#10b981" strokeWidth="2" />
    <circle cx="10" cy="10" r="4.5" fill="#10b981" />
  </svg>
);
const NonVegIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <rect x="1" y="1" width="18" height="18" rx="3" fill="none" stroke="#ef4444" strokeWidth="2" />
    <polygon points="10,4 16,15 4,15" fill="#ef4444" />
  </svg>
);

// ==================== ITEM MODAL ====================
const ItemModal = ({ show, onHide, item, categoryId, subcategoryId, branchId, addons, onSave, primaryColor }) => {
  const { isDarkMode } = useDarkMode();
  const [form, setForm] = useState({ name: '', description: '', price: '', mrp: '', halfPrice: '', halfMrp: '', qtrPrice: '', qtrMrp: '', dietaryType: true, isAvailable: true, isActive: true, isRecommended: false, preparationMinutes: '', priority: 1, spiceLevel: '', addonsId: '', gstPercentage: '', gstType: '' });
  const [inlineAddons, setInlineAddons] = useState([]);
  const [existingAddonItems, setExistingAddonItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  // Category/subcategory remap state
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(subcategoryId);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const ms = modalStyles(primaryColor, isDarkMode);
  const pc = primaryColor;

  // Fetch categories for this branch when modal opens
  useEffect(() => {
    if (show && branchId) {
      setSelectedCategoryId(categoryId);
      setSelectedSubcategoryId(subcategoryId);
      setLoadingCats(true);
      ApiGet('/api/restaurant/menu_category/filter', { pageNumber: 0, pageSize: 200, branchId }).then(res => {
        if (res.success) setCategories((res.success.data?.data?.records || []).filter(c => c.isActive !== false));
      }).catch(() => {}).finally(() => setLoadingCats(false));
    }
  }, [show, branchId, categoryId, subcategoryId]);

  // Fetch subcategories when selected category changes
  useEffect(() => {
    if (show && selectedCategoryId) {
      setLoadingSubs(true);
      ApiGet('/api/restaurant/menu_subcategory/filter', { pageNumber: 0, pageSize: 200, categoryId: selectedCategoryId }).then(res => {
        if (res.success) {
          const subs = (res.success.data?.data?.records || []).filter(s => s.isActive !== false);
          setSubcategories(subs);
          // If category changed and current subcategory isn't in the new list, auto-select first
          if (subs.length > 0 && !subs.find(s => s.id === selectedSubcategoryId)) {
            setSelectedSubcategoryId(subs[0].id);
          }
        }
      }).catch(() => {}).finally(() => setLoadingSubs(false));
    }
  }, [show, selectedCategoryId]);

  useEffect(() => {
    if (show) {
      if (item) {
        setForm({ name: item.name || '', description: item.description || '', price: item.price ?? '', mrp: item.mrp ?? '', halfPrice: item.halfPrice ?? '', halfMrp: item.halfMrp ?? '', qtrPrice: item.qtrPrice ?? '', qtrMrp: item.qtrMrp ?? '', dietaryType: item.dietaryType ?? true, isAvailable: item.isAvailable ?? true, isActive: item.isActive ?? true, isRecommended: item.isRecommended ?? false, preparationMinutes: item.preparationMinutes ?? '', priority: item.priority || 1, spiceLevel: item.spiceLevel || '', addonsId: item.addonsId?.id || '', gstPercentage: item.gstPercentage ?? '', gstType: item.gstType || '' });
        setImagePreview(item.imageUrl || null);
        // Load existing addon items if item has addonsId
        if (item.addonsId?.id) {
          ApiGet('/api/restaurant/addons_items/getByAddonsId', { addonsId: item.addonsId.id }).then(res => {
            if (res.success) {
              const items = res.success.data?.data || [];
              const mapped = items.filter(a => a.isActive !== false).map(a => ({ id: a.id, name: a.name || '', price: a.price ?? '', isRequired: (a.attribute || '').toLowerCase() === 'required' }));
              setExistingAddonItems(mapped);
              setInlineAddons(mapped);
            }
          }).catch(() => {});
        } else { setInlineAddons([]); setExistingAddonItems([]); }
      } else {
        setForm({ name: '', description: '', price: '', mrp: '', halfPrice: '', halfMrp: '', qtrPrice: '', qtrMrp: '', dietaryType: true, isAvailable: true, isActive: true, isRecommended: false, preparationMinutes: '', priority: 1, spiceLevel: '', addonsId: '', gstPercentage: '', gstType: '' });
        setImagePreview(null); setInlineAddons([]); setExistingAddonItems([]);
      }
      setImageFile(null); setErrors({});
    }
  }, [show, item]);

  const addAddonRow = () => setInlineAddons(p => [...p, { name: '', price: '', isRequired: false }]);
  const updateAddonRow = (i, val) => setInlineAddons(p => { const n = [...p]; n[i] = val; return n; });
  const removeAddonRow = (i) => setInlineAddons(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.price && form.price !== 0) errs.price = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description.trim(), price: parseFloat(form.price), mrp: form.mrp ? parseFloat(form.mrp) : null, halfPrice: form.halfPrice ? parseFloat(form.halfPrice) : null, halfMrp: form.halfMrp ? parseFloat(form.halfMrp) : null, qtrPrice: form.qtrPrice ? parseFloat(form.qtrPrice) : null, qtrMrp: form.qtrMrp ? parseFloat(form.qtrMrp) : null, dietaryType: form.dietaryType, isAvailable: form.isAvailable, isActive: form.isActive, isRecommended: form.isRecommended, preparationMinutes: form.preparationMinutes ? parseInt(form.preparationMinutes) : null, priority: parseInt(form.priority), spiceLevel: form.spiceLevel || null, gstPercentage: form.gstPercentage !== '' ? parseFloat(form.gstPercentage) : null, gstType: form.gstType || null, menuCategoryId: { id: selectedCategoryId || categoryId }, menuSubcategoryId: { id: selectedSubcategoryId || subcategoryId }, branchId: { id: branchId } };
    // Pass existing addonsId if present and not using inline addons
    const validAddons = inlineAddons.filter(a => a.name.trim());
    if (validAddons.length > 0) {
      payload.inlineAddons = validAddons.map(a => ({ name: a.name.trim(), price: parseFloat(a.price) || 0, isRequired: a.isRequired }));
      if (form.addonsId) payload.addonsId = { id: parseInt(form.addonsId) };
    } else if (form.addonsId) {
      payload.addonsId = { id: parseInt(form.addonsId) };
    }
    if (item) payload.id = item.id;
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    if (imageFile) fd.append('photo', imageFile);
    const endpoint = item ? '/api/restaurant/menu_items/update_Menu' : '/api/restaurant/menu_items/add_Menu';
    const result = await ApiPostFormData(endpoint, fd);
    if (result.success) { toast.success(item ? 'Item updated' : 'Item added'); onSave(); onHide(); } else toast.error(result.fail);
    setSaving(false);
  };
  const handleImageSelect = (src) => { setTempImageSrc(src); setShowCropper(true); };

  // Compact section header
  const SH = ({ icon, title, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
      <div style={{ width: 24, height: 24, borderRadius: '7px', background: `${color || pc}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`bi bi-${icon}`} style={{ fontSize: '11px', color: color || pc }}></i>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>{title}</span>
    </div>
  );

  // Compact toggle row
  const ToggleRow = ({ icon, label, active, activeColor, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '9px', border: `1.5px solid ${active ? activeColor + '40' : '#edf0f4'}`, background: active ? activeColor + '0a' : '#fafbfc', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}>
      <i className={`bi ${icon}`} style={{ fontSize: '12px', color: active ? activeColor : '#94a3b8' }}></i>
      <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: active ? '#1e293b' : '#64748b' }}>{label}</span>
      <ToggleSwitch isActive={active} onToggle={onClick} loading={false} size="sm" />
    </div>
  );

  return (
    <>
      <Modal show={show} onHide={onHide} centered contentClassName="mtree-modal-content" dialogClassName="mtree-item-modal-wide">
        {/* ── HEADER ── */}
        <div style={{ padding: '18px 24px 0', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ ...ms.headerIcon, width: 38, height: 38, borderRadius: '11px', fontSize: '15px' }}><i className={`bi bi-${item ? 'pencil-square' : 'cup-hot-fill'}`}></i></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>{item ? 'Edit Menu Item' : 'New Menu Item'}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 1 }}>{item ? 'Update item details and pricing' : 'Add a delicious new item to your menu'}</div>
          </div>
          <button onClick={onHide} style={{ ...ms.closeBtn, width: 30, height: 30 }} className="mtree-close-btn"><i className="bi bi-x-lg" style={{ fontSize: '14px' }}></i></button>
        </div>

        <Form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* ── 3-COLUMN BODY ── */}
          <div className="mtree-item-body-grid" style={{ padding: '16px 24px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', overflowY: 'auto', flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch' }}>

            {/* ═══ COLUMN 1: Basic Info + Remap + Toggles ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SH icon="tag" title="Basic Info" />

              <div>
                <label style={{ ...ms.label, marginBottom: '4px' }}>Item Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="mtree-input" placeholder="e.g. Paneer Tikka" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }} style={{ ...ms.input, width: '100%', padding: '8px 12px', fontSize: '13px', ...(errors.name ? { borderColor: '#ef4444' } : {}) }} />
                {errors.name && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>{errors.name}</div>}
              </div>

              {/* Pricing Table: FULL, HALF, QTR */}
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <div style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}></div>
                  <div style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderLeft: '1px solid #e2e8f0' }}>Price <span style={{ color: '#ef4444' }}>*</span></div>
                  <div style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderLeft: '1px solid #e2e8f0' }}>MRP <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(opt)</span></div>
                </div>
                {/* FULL Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center' }}>FULL</div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                    <input className="mtree-input" type="number" step="0.01" placeholder="220" value={form.price} onChange={e => { setForm(p => ({ ...p, price: e.target.value })); setErrors(p => ({ ...p, price: '' })); }} style={{ width: '100%', padding: '7px 8px 7px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none', ...(errors.price ? { background: '#fef2f2' } : {}) }} />
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                    <input className="mtree-input" type="number" step="0.01" placeholder="260" value={form.mrp} onChange={e => setForm(p => ({ ...p, mrp: e.target.value }))} style={{ width: '100%', padding: '7px 8px 7px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                  </div>
                </div>
                {/* HALF Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center' }}>HALF</div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                    <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.halfPrice} onChange={e => setForm(p => ({ ...p, halfPrice: e.target.value }))} style={{ width: '100%', padding: '7px 8px 7px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                    <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.halfMrp} onChange={e => setForm(p => ({ ...p, halfMrp: e.target.value }))} style={{ width: '100%', padding: '7px 8px 7px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                  </div>
                </div>
                {/* QTR Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr' }}>
                  <div style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center' }}>QTR</div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                    <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.qtrPrice} onChange={e => setForm(p => ({ ...p, qtrPrice: e.target.value }))} style={{ width: '100%', padding: '7px 8px 7px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                    <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.qtrMrp} onChange={e => setForm(p => ({ ...p, qtrMrp: e.target.value }))} style={{ width: '100%', padding: '7px 8px 7px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                  </div>
                </div>
              </div>
              {errors.price && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>Full price is required</div>}

              {/* GST Configuration */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...ms.label, marginBottom: '4px' }}>GST %</label>
                  <div style={{ position: 'relative' }}>
                    <input className="mtree-input" type="number" step="0.01" min="0" max="100" placeholder="0" value={form.gstPercentage} onChange={e => setForm(p => ({ ...p, gstPercentage: e.target.value }))} style={{ ...ms.input, width: '100%', padding: '8px 30px 8px 12px', fontSize: '13px' }} />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>%</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...ms.label, marginBottom: '4px' }}>GST Type</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => setForm(p => ({ ...p, gstType: 'INCLUSIVE' }))}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: '8px', border: `1.5px solid ${form.gstType === 'INCLUSIVE' ? pc : '#e2e8f0'}`, background: form.gstType === 'INCLUSIVE' ? `${pc}10` : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: form.gstType === 'INCLUSIVE' ? pc : '#94a3b8' }}>Inclusive</span>
                    </button>
                    <button type="button" onClick={() => setForm(p => ({ ...p, gstType: 'EXCLUSIVE' }))}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: '8px', border: `1.5px solid ${form.gstType === 'EXCLUSIVE' ? pc : '#e2e8f0'}`, background: form.gstType === 'EXCLUSIVE' ? `${pc}10` : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: form.gstType === 'EXCLUSIVE' ? pc : '#94a3b8' }}>Exclusive</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }}></div>

              {/* Category / Subcategory remap */}
              <SH icon="folder2-open" title="Placement" color="#0891b2" />
              <div>
                <label style={{ ...ms.label, marginBottom: '4px' }}><i className="bi bi-grid-3x3-gap-fill me-1"></i>Category</label>
                <select className="mtree-input" value={selectedCategoryId || ''} onChange={e => { setSelectedCategoryId(parseInt(e.target.value)); setSelectedSubcategoryId(''); }}
                  style={{ ...ms.input, width: '100%', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', appearance: 'auto' }}>
                  {loadingCats ? <option>Loading...</option> : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...ms.label, marginBottom: '4px' }}><i className="bi bi-collection me-1"></i>Subcategory</label>
                <select className="mtree-input" value={selectedSubcategoryId || ''} onChange={e => setSelectedSubcategoryId(parseInt(e.target.value))}
                  style={{ ...ms.input, width: '100%', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', appearance: 'auto' }}>
                  {loadingSubs ? <option>Loading...</option> : subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }}></div>

              <SH icon="stars" title="Visibility" color="#6366f1" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <ToggleRow icon="bi-hand-thumbs-up-fill" label="Recommended" active={form.isRecommended} activeColor="#f59e0b" onClick={() => setForm(p => ({ ...p, isRecommended: !p.isRecommended }))} />
                <ToggleRow icon="bi-eye-fill" label="Available" active={form.isAvailable} activeColor="#10b981" onClick={() => setForm(p => ({ ...p, isAvailable: !p.isAvailable }))} />
                <ToggleRow icon="bi-lightning-fill" label="Active" active={form.isActive} activeColor="#6366f1" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} />
              </div>
            </div>

            {/* ═══ COLUMN 2: Details + Media ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SH icon="sliders" title="Details" />

              <div>
                <label style={{ ...ms.label, marginBottom: '4px' }}>Dietary Type</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button type="button" onClick={() => setForm(p => ({ ...p, dietaryType: true }))} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `1.5px solid ${form.dietaryType ? '#10b981' : '#e2e8f0'}`, background: form.dietaryType ? '#10b98110' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                    <VegIcon size={16} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: form.dietaryType ? '#059669' : '#94a3b8' }}>Veg</span>
                  </button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, dietaryType: false }))} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `1.5px solid ${!form.dietaryType ? '#ef4444' : '#e2e8f0'}`, background: !form.dietaryType ? '#ef444410' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                    <NonVegIcon size={16} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: !form.dietaryType ? '#dc2626' : '#94a3b8' }}>Non-Veg</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...ms.label, marginBottom: '4px' }}><i className="bi bi-clock me-1"></i>Prep Time</label>
                  <div style={{ position: 'relative' }}>
                    <input className="mtree-input" type="number" placeholder="15" value={form.preparationMinutes} onChange={e => setForm(p => ({ ...p, preparationMinutes: e.target.value }))} style={{ ...ms.input, width: '100%', padding: '8px 36px 8px 12px', fontSize: '13px' }} />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>min</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...ms.label, marginBottom: '4px' }}><i className="bi bi-sort-numeric-up me-1"></i>Priority</label>
                  <input className="mtree-input" type="number" min="0" placeholder="1" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...ms.input, width: '100%', padding: '8px 12px', fontSize: '13px' }} />
                </div>
              </div>

              <div>
                <label style={{ ...ms.label, marginBottom: '4px' }}><i className="bi bi-fire me-1"></i>Spice Level</label>
                <SpicePills value={form.spiceLevel} onChange={v => setForm(p => ({ ...p, spiceLevel: v }))} />
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }}></div>

              <SH icon="image" title="Media" color="#ea580c" />
              <ImageUploadZone imagePreview={imagePreview} onSelect={handleImageSelect} onRemove={() => { setImageFile(null); setImagePreview(null); }} pc={pc} />

              <div>
                <label style={{ ...ms.label, marginBottom: '4px' }}>Description</label>
                <textarea className="mtree-input" rows={2} placeholder="Describe the dish..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...ms.input, width: '100%', resize: 'vertical', fontSize: '12px', padding: '8px 12px', minHeight: '52px' }} />
              </div>
            </div>

            {/* ═══ COLUMN 3: Add-ons Builder ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid #f1f5f9', paddingLeft: '18px' }}>
              <SH icon="puzzle" title={`Add-ons${inlineAddons.length > 0 ? ` (${inlineAddons.length})` : ''}`} color="#8b5cf6" />

              {inlineAddons.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', borderRadius: '12px', border: '1.5px dashed #e8ecf1', background: '#fafbfc' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <i className="bi bi-puzzle" style={{ fontSize: '17px', color: '#cbd5e1' }}></i>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px', textAlign: 'center' }}>No add-ons yet</div>
                  <button type="button" onClick={addAddonRow}
                    style={{ padding: '7px 16px', borderRadius: '8px', border: `1.5px dashed ${pc}`, background: `${pc}06`, color: pc, fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <i className="bi bi-plus-lg" style={{ fontSize: '11px' }}></i> Add Add-on
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '340px', overflowY: 'auto' }}>
                  {inlineAddons.map((addon, i) => (
                    <InlineAddonRow key={i} addon={addon} index={i} onChange={val => updateAddonRow(i, val)} onRemove={() => removeAddonRow(i)} pc={pc} />
                  ))}
                  <button type="button" onClick={addAddonRow}
                    style={{ padding: '7px', borderRadius: '8px', border: '1.5px dashed #e2e8f0', background: '#fafbfc', color: '#64748b', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '2px' }}>
                    <i className="bi bi-plus-lg" style={{ fontSize: '10px' }}></i> Add Another
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ padding: '12px 24px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {form.isRecommended && <span style={{ fontSize: '10px', fontWeight: 600, color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: '5px' }}><i className="bi bi-hand-thumbs-up-fill me-1"></i>Recommended</span>}
              {inlineAddons.filter(a => a.name.trim()).length > 0 && <span style={{ fontSize: '10px', fontWeight: 600, color: '#8b5cf6', background: '#ede9fe', padding: '2px 8px', borderRadius: '5px' }}><i className="bi bi-puzzle me-1"></i>{inlineAddons.filter(a => a.name.trim()).length} add-on{inlineAddons.filter(a => a.name.trim()).length > 1 ? 's' : ''}</span>}
            </div>
            <button type="button" onClick={onHide} style={{ ...ms.cancelBtn, padding: '9px 20px' }} className="mtree-cancel-btn">Cancel</button>
            <button type="submit" disabled={saving} style={{ ...ms.submitBtn, opacity: saving ? 0.7 : 1, padding: '9px 28px' }} className="mtree-submit-btn">
              {saving ? <Spinner size="sm" /> : <><i className="bi bi-check-lg"></i>{item ? 'Update Item' : 'Add Item'}</>}
            </button>
          </div>
        </Form>
      </Modal>
      <ImageCropperModal show={showCropper} onHide={() => setShowCropper(false)} imageSrc={tempImageSrc} onCropComplete={(f, url) => { setImageFile(f); setImagePreview(url); }} aspectRatio={1} title="Crop Item Image" primaryColor={primaryColor} />
    </>
  );
};

// ==================== SUBCATEGORY ACCORDION ITEM (nested inside category) ====================
const SubcategoryAccordionItem = ({ sub, isExpanded, onToggle, onEditSub, onDeleteSub, onEditItem, onDeleteItem, onAddItem, primaryColor, onStatusChange }) => {
  const [items, setItems] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [localActive, setLocalActive] = useState(sub.isActive);
  const [toggling, setToggling] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState(null);

  useEffect(() => { setLocalActive(sub.isActive); }, [sub.isActive]);

  const fetchItems = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    const result = await ApiGet('/api/restaurant/menu_items/filter', { pageNumber: 0, pageSize: 500, categoryId: sub.menuCategoryId?.id });
    if (result.success) { const all = result.success.data.data.records || []; setItems(all.filter(i => i.menuSubcategoryId?.id === sub.id)); }
    const ar = await ApiGet('/api/restaurant/addons/filter', { pageNumber: 0, pageSize: 200 });
    if (ar.success) setAddons(ar.success.data.data.records || []);
    setLoaded(true); setLoading(false);
  }, [sub.id, sub.menuCategoryId?.id, loaded]);

  const refreshItems = async () => {
    setLoaded(false); setLoading(true);
    const result = await ApiGet('/api/restaurant/menu_items/filter', { pageNumber: 0, pageSize: 500, categoryId: sub.menuCategoryId?.id });
    if (result.success) { const all = result.success.data.data.records || []; setItems(all.filter(i => i.menuSubcategoryId?.id === sub.id)); }
    setLoaded(true); setLoading(false);
  };

  // Toggle subcategory status
  const handleStatusToggle = async (newStatus) => {
    setToggling(true);
    const oldStatus = localActive;
    setLocalActive(newStatus);
    const payload = { id: sub.id, name: sub.name, description: sub.description || '', isActive: newStatus, menuCategoryId: { id: sub.menuCategoryId?.id }, branchId: { id: sub.branchId?.id } };
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    const result = await ApiPostFormData('/api/restaurant/menu_subcategory/update_Subcategory', fd);
    if (result.success) {
      toast.success(`${sub.name} ${newStatus ? 'activated' : 'deactivated'}`);
      // Cascade deactivation: if deactivating, deactivate all items under this subcategory
      if (!newStatus && items.length > 0) {
        const activeItems = items.filter(i => i.isActive);
        for (const item of activeItems) {
          const itemPayload = { id: item.id, name: item.name, price: item.price, isActive: false, menuCategoryId: { id: item.menuCategoryId?.id }, menuSubcategoryId: { id: sub.id }, branchId: { id: item.branchId?.id } };
          const itemFd = new FormData();
          itemFd.append('payload', JSON.stringify(itemPayload));
          await ApiPostFormData('/api/restaurant/menu_items/update_Menu', itemFd);
        }
        setItems(prev => prev.map(i => ({ ...i, isActive: false })));
        toast.info('All items in this subcategory have been deactivated');
      }
      if (onStatusChange) onStatusChange();
    } else {
      setLocalActive(oldStatus);
      toast.error(result.fail || 'Failed to update status');
    }
    setToggling(false);
  };

  // Toggle individual item status
  const handleItemStatusToggle = async (item, newStatus) => {
    setTogglingItemId(item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: newStatus } : i));
    const payload = { id: item.id, name: item.name, price: item.price, isActive: newStatus, menuCategoryId: { id: item.menuCategoryId?.id }, menuSubcategoryId: { id: item.menuSubcategoryId?.id }, branchId: { id: item.branchId?.id } };
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    const result = await ApiPostFormData('/api/restaurant/menu_items/update_Menu', fd);
    if (result.success) {
      toast.success(`${item.name} ${newStatus ? 'activated' : 'deactivated'}`);
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: !newStatus } : i));
      toast.error(result.fail || 'Failed to update item status');
    }
    setTogglingItemId(null);
  };

  const handleToggle = () => { if (!isExpanded) fetchItems(); onToggle(sub.id); };
  const sc = LEVEL_CONFIG.subcategory;

  return (
    <div style={{ marginBottom: '4px', marginLeft: '20px', borderRadius: '10px', border: isExpanded ? `1.5px solid ${sc.color}` : '1px solid var(--mtree-border)', background: 'var(--mtree-surface)', transition: 'all 0.25s ease', boxShadow: isExpanded ? `0 3px 12px ${sc.color}15` : 'none' }}>
      <div onClick={handleToggle} className="sub-header-row" style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', borderRadius: isExpanded ? '10px 10px 0 0' : '10px', background: isExpanded ? 'var(--mtree-surface-accent-sub)' : 'var(--mtree-surface)', transition: 'background 0.25s ease', gap: '12px', userSelect: 'none' }}>
        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '12px', color: isExpanded ? sc.color : 'var(--mtree-text-faint)', minWidth: '14px' }}></i>
        <div style={{ width: 30, height: 30, borderRadius: '8px', background: isExpanded ? `linear-gradient(135deg, ${sc.color}, ${primaryColor})` : sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: isExpanded ? '#fff' : sc.color, flexShrink: 0, overflow: 'hidden' }}>
          {sub.iconUrl ? <img src={sub.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : (sub.name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--mtree-text)' }}>{sub.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--mtree-text-muted)', background: 'var(--mtree-chip)', padding: '1px 6px', borderRadius: '4px' }}>ID: {sub.id}</span>
          </div>
        </div>
        {loaded && <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: LEVEL_CONFIG.item.bg, color: LEVEL_CONFIG.item.color }}><i className={`bi ${LEVEL_CONFIG.item.icon}`} style={{ fontSize: '10px' }}></i> {items.length}</span>}
        <ToggleSwitch isActive={localActive} onToggle={handleStatusToggle} loading={toggling} />
        <button className="menu-tree-action-btn edit" title="Edit Subcategory" onClick={e => { e.stopPropagation(); onEditSub(sub, refreshItems); }}><i className="bi bi-pencil-square"></i></button>
        <button className="menu-tree-action-btn delete" title="Delete Subcategory" onClick={e => { e.stopPropagation(); onDeleteSub(sub, onStatusChange); }}><i className="bi bi-trash3"></i></button>
        <button className="menu-tree-action-btn add" title="Add Item" onClick={e => { e.stopPropagation(); onAddItem(sub, addons, refreshItems); }} style={{ '--btn-color': primaryColor }}><i className="bi bi-plus-lg"></i></button>
      </div>
      <AnimatedCollapse open={isExpanded}>
        <div style={{ borderTop: '1px solid var(--mtree-border)' }}>
          {loading ? <div className="text-center py-3"><Spinner size="sm" style={{ color: sc.color }} /><div className="text-muted mt-1" style={{ fontSize: '12px' }}>Loading items...</div></div>
          : items.length === 0 && loaded ? <div className="text-center py-3" style={{ color: 'var(--mtree-text-faint)' }}><i className="bi bi-cup-hot" style={{ fontSize: '24px', opacity: 0.4 }}></i><div style={{ fontSize: '12px', marginTop: '4px' }}>No items yet</div></div>
          : items.length > 0 ? (
            <Table hover responsive size="sm" className="mb-0" style={{ fontSize: '13px' }}>
              <thead><tr style={{ background: 'var(--mtree-surface-alt)' }}>
                {['#', 'Item', 'Price', 'Type', 'Addon', 'Status', ''].map(h => <th key={h} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mtree-text-faint)', fontWeight: 600, padding: '7px 12px', textAlign: h === '' ? 'right' : 'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>{items.map((item, i) => (
                <tr key={item.id}>
                  <td style={{ padding: '8px 12px', color: 'var(--mtree-text-faint)', fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 28, height: 28, borderRadius: '7px', background: LEVEL_CONFIG.item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: LEVEL_CONFIG.item.color, flexShrink: 0, overflow: 'hidden' }}>
                        {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : (item.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div><div style={{ fontWeight: 600, color: 'var(--mtree-text)' }}>{item.name}</div>{item.preparationMinutes && <div style={{ fontSize: '10px', color: 'var(--mtree-text-faint)' }}><i className="bi bi-clock me-1"></i>{item.preparationMinutes}min</div>}</div>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: primaryColor }}>&#8377;{parseFloat(item.price || 0).toFixed(2)}{item.mrp && parseFloat(item.mrp) > parseFloat(item.price) && <div style={{ fontSize: '10px', color: 'var(--mtree-text-faint)', textDecoration: 'line-through', fontWeight: 400 }}>&#8377;{parseFloat(item.mrp).toFixed(2)}</div>}</td>
                  <td style={{ padding: '8px 12px' }}><span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: item.dietaryType ? '#10b98118' : '#ef444418', color: item.dietaryType ? '#059669' : '#dc2626', border: `1px solid ${item.dietaryType ? '#10b98130' : '#ef444430'}` }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 3 }}></span>{item.dietaryType ? 'VEG' : 'NON-VEG'}</span></td>
                  <td style={{ padding: '8px 12px' }}>{item.addonsId ? <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: LEVEL_CONFIG.addon.bg, color: LEVEL_CONFIG.addon.color }}><i className="bi bi-puzzle me-1" style={{ fontSize: '9px' }}></i>{item.addonsId.name}</span> : <span style={{ color: 'var(--mtree-text-faint)' }}>—</span>}</td>
                  <td style={{ padding: '8px 12px' }}><ToggleSwitch isActive={item.isActive} onToggle={(newStatus) => handleItemStatusToggle(item, newStatus)} loading={togglingItemId === item.id} /></td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}><div className="d-flex align-items-center justify-content-end gap-1"><button className="menu-tree-action-btn edit" title="Edit Item" onClick={() => onEditItem(item, sub, addons, refreshItems)}><i className="bi bi-pencil-square"></i></button><button className="menu-tree-action-btn delete" title="Delete Item" onClick={() => onDeleteItem(item, refreshItems)}><i className="bi bi-trash3"></i></button></div></td>
                </tr>
              ))}</tbody>
            </Table>
          ) : null}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== CATEGORY ACCORDION ITEM (nested inside branch) ====================
const CategoryAccordionItem = ({ category, isExpanded, onToggle, onEditCategory, onDeleteCategory, onEditSub, onDeleteSub, onAddSub, onEditItem, onDeleteItem, onAddItem, primaryColor, onStatusChange }) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState(null);
  const [localActive, setLocalActive] = useState(category.isActive);
  const [toggling, setToggling] = useState(false);

  useEffect(() => { setLocalActive(category.isActive); }, [category.isActive]);

  const fetchSubcategories = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    const result = await ApiGet('/api/restaurant/menu_subcategory/filter', { pageNumber: 0, pageSize: 500 });
    if (result.success) { const all = result.success.data.data.records || []; setSubcategories(all.filter(s => s.menuCategoryId?.id === category.id).sort((a, b) => (a.priority || 0) - (b.priority || 0))); }
    setLoaded(true); setLoading(false);
  }, [category.id, loaded]);

  const refreshSubcategories = async () => {
    setLoaded(false); setLoading(true);
    const result = await ApiGet('/api/restaurant/menu_subcategory/filter', { pageNumber: 0, pageSize: 500 });
    if (result.success) { const all = result.success.data.data.records || []; setSubcategories(all.filter(s => s.menuCategoryId?.id === category.id).sort((a, b) => (a.priority || 0) - (b.priority || 0))); }
    setLoaded(true); setLoading(false);
  };

  // Toggle category status with cascade deactivation
  const handleStatusToggle = async (newStatus) => {
    setToggling(true);
    const oldStatus = localActive;
    setLocalActive(newStatus);
    const payload = { id: category.id, name: category.name, description: category.description || '', priority: category.priority || 1, isActive: newStatus, branchId: { id: category.branchId?.id } };
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    const result = await ApiPostFormData('/api/restaurant/menu_category/update_Category', fd);
    if (result.success) {
      toast.success(`${category.name} ${newStatus ? 'activated' : 'deactivated'}`);
      // Cascade deactivation: deactivate all subcategories and their items
      if (!newStatus) {
        // Fetch subcategories if not already loaded
        let subs = subcategories;
        if (!loaded) {
          const subResult = await ApiGet('/api/restaurant/menu_subcategory/filter', { pageNumber: 0, pageSize: 500 });
          if (subResult.success) { subs = (subResult.success.data.data.records || []).filter(s => s.menuCategoryId?.id === category.id); }
        }
        const activeSubs = subs.filter(s => s.isActive);
        for (const sub of activeSubs) {
          const subPayload = { id: sub.id, name: sub.name, description: sub.description || '', isActive: false, priority: sub.priority || 1, menuCategoryId: { id: category.id }, branchId: { id: sub.branchId?.id } };
          const subFd = new FormData();
          subFd.append('payload', JSON.stringify(subPayload));
          await ApiPostFormData('/api/restaurant/menu_subcategory/update_Subcategory', subFd);
        }
        // Fetch and deactivate all items under this category
        const itemResult = await ApiGet('/api/restaurant/menu_items/filter', { pageNumber: 0, pageSize: 500, categoryId: category.id });
        if (itemResult.success) {
          const activeItems = (itemResult.success.data.data.records || []).filter(i => i.isActive);
          for (const item of activeItems) {
            const itemPayload = { id: item.id, name: item.name, price: item.price, isActive: false, menuCategoryId: { id: category.id }, menuSubcategoryId: { id: item.menuSubcategoryId?.id }, branchId: { id: item.branchId?.id } };
            const itemFd = new FormData();
            itemFd.append('payload', JSON.stringify(itemPayload));
            await ApiPostFormData('/api/restaurant/menu_items/update_Menu', itemFd);
          }
        }
        if (activeSubs.length > 0) toast.info('All subcategories & items have been deactivated');
        // Refresh subcategories to show updated status
        if (loaded) {
          setSubcategories(prev => prev.map(s => ({ ...s, isActive: false })));
        }
      }
      if (onStatusChange) onStatusChange();
    } else {
      setLocalActive(oldStatus);
      toast.error(result.fail || 'Failed to update status');
    }
    setToggling(false);
  };

  const handleToggle = () => { if (!isExpanded) fetchSubcategories(); onToggle(category.id); };
  const cc = LEVEL_CONFIG.category;

  return (
    <div style={{ marginBottom: '4px', marginLeft: '20px', borderRadius: '10px', border: isExpanded ? `1.5px solid ${cc.color}` : '1px solid var(--mtree-border)', background: 'var(--mtree-surface)', transition: 'all 0.25s ease', boxShadow: isExpanded ? `0 3px 12px ${cc.color}15` : 'none' }}>
      <div onClick={handleToggle} className="cat-header-row" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', borderRadius: isExpanded ? '10px 10px 0 0' : '10px', background: isExpanded ? 'var(--mtree-surface-accent-cat)' : 'var(--mtree-surface)', transition: 'background 0.25s ease', gap: '14px', userSelect: 'none' }}>
        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '13px', color: isExpanded ? cc.color : 'var(--mtree-text-faint)', minWidth: '14px' }}></i>
        <div style={{ width: 34, height: 34, borderRadius: '9px', background: isExpanded ? `linear-gradient(135deg, ${cc.color}, ${primaryColor})` : cc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: isExpanded ? '#fff' : cc.color, flexShrink: 0, overflow: 'hidden' }}>
          {category.iconUrl ? <img src={category.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : (category.name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--mtree-text)' }}>{category.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--mtree-text-muted)', background: 'var(--mtree-chip)', padding: '1px 6px', borderRadius: '4px' }}>ID: {category.id}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: cc.color, background: cc.bg, padding: '1px 6px', borderRadius: '4px' }}>
              Priority: {Number.isFinite(Number(category.priority)) ? Number(category.priority) : '—'}
            </span>
          </div>
          {category.description && <div style={{ fontSize: '11px', color: 'var(--mtree-text-faint)', marginTop: 2, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category.description}</div>}
        </div>
        {loaded && <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: LEVEL_CONFIG.subcategory.bg, color: LEVEL_CONFIG.subcategory.color }}><i className={`bi ${LEVEL_CONFIG.subcategory.icon}`} style={{ fontSize: '10px' }}></i> {subcategories.length}</span>}
        <ToggleSwitch isActive={localActive} onToggle={handleStatusToggle} loading={toggling} />
        <button className="menu-tree-action-btn edit" title="Edit Category" onClick={e => { e.stopPropagation(); onEditCategory(category, refreshSubcategories); }}><i className="bi bi-pencil-square"></i></button>
        <button className="menu-tree-action-btn delete" title="Delete Category" onClick={e => { e.stopPropagation(); onDeleteCategory(category, onStatusChange); }}><i className="bi bi-trash3"></i></button>
        <button className="menu-tree-action-btn add" title="Add Subcategory" onClick={e => { e.stopPropagation(); onAddSub(category, refreshSubcategories); }} style={{ '--btn-color': primaryColor }}><i className="bi bi-plus-lg"></i></button>
      </div>
      <AnimatedCollapse open={isExpanded}>
        <div style={{ borderTop: '1px solid var(--mtree-border)' }}>
          {loading ? <div className="text-center py-3"><Spinner size="sm" style={{ color: cc.color }} /><div className="text-muted mt-1" style={{ fontSize: '12px' }}>Loading subcategories...</div></div>
          : subcategories.length === 0 && loaded ? <div className="text-center py-3" style={{ color: 'var(--mtree-text-faint)' }}><i className="bi bi-collection" style={{ fontSize: '24px', opacity: 0.4 }}></i><div style={{ fontSize: '12px', marginTop: '4px' }}>No subcategories yet</div></div>
          : <div style={{ padding: '6px 6px 6px 0' }}>
              {subcategories.map(sub => <SubcategoryAccordionItem key={sub.id} sub={sub} isExpanded={expandedSubId === sub.id} onToggle={id => setExpandedSubId(prev => prev === id ? null : id)} onEditSub={(s, refreshFn) => onEditSub(s, refreshFn || refreshSubcategories)} onDeleteSub={onDeleteSub} onEditItem={onEditItem} onDeleteItem={onDeleteItem} onAddItem={onAddItem} primaryColor={primaryColor} onStatusChange={refreshSubcategories} />)}
            </div>}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== BRANCH ACCORDION ITEM (top level) ====================
const BranchAccordionItem = ({ branch, isExpanded, onToggle, onEditCategory, onDeleteCategory, onAddCategory, onEditSub, onDeleteSub, onAddSub, onEditItem, onDeleteItem, onAddItem, primaryColor, onBranchStatusChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState(null);
  const [localActive, setLocalActive] = useState(branch.isActive !== false && branch.is_active !== false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => { setLocalActive(branch.isActive !== false && branch.is_active !== false); }, [branch.isActive, branch.is_active]);

  const fetchCategories = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    const result = await ApiGet('/api/restaurant/menu_category/filter', { pageNumber: 0, pageSize: 500 });
    if (result.success) {
      const all = result.success.data.data.records || [];
      setCategories(sortCategoriesAscending(all.filter(c => c.branchId?.id === branch.id)));
    }
    setLoaded(true); setLoading(false);
  }, [branch.id, loaded]);

  const refreshCategories = async () => {
    setLoaded(false); setLoading(true);
    const result = await ApiGet('/api/restaurant/menu_category/filter', { pageNumber: 0, pageSize: 500 });
    if (result.success) { const all = result.success.data.data.records || []; setCategories(sortCategoriesAscending(all.filter(c => c.branchId?.id === branch.id))); }
    setLoaded(true); setLoading(false);
  };

  // Toggle branch status with cascade deactivation
  const handleStatusToggle = async (newStatus) => {
    setToggling(true);
    const oldStatus = localActive;
    setLocalActive(newStatus);
    const payload = { id: branch.id, isActive: newStatus };
    try {
      const result = await ApiPut('/api/restaurant/users/update', payload);
      if (result.success) {
        toast.success(`${branch.name || branch.full_name} ${newStatus ? 'activated' : 'deactivated'}`);
        // Cascade deactivation for branch
        if (!newStatus) {
          // Fetch categories for this branch
          let cats = categories;
          if (!loaded) {
            const catResult = await ApiGet('/api/restaurant/menu_category/filter', { pageNumber: 0, pageSize: 500 });
            if (catResult.success) { cats = (catResult.success.data.data.records || []).filter(c => c.branchId?.id === branch.id); }
          }
          // Deactivate all active categories
          const activeCats = cats.filter(c => c.isActive);
          for (const cat of activeCats) {
            const catPayload = { id: cat.id, name: cat.name, description: cat.description || '', priority: cat.priority || 1, isActive: false, branchId: { id: branch.id } };
            const catFd = new FormData();
            catFd.append('payload', JSON.stringify(catPayload));
            await ApiPostFormData('/api/restaurant/menu_category/update_Category', catFd);
          }
          // Fetch and deactivate all subcategories under this branch's categories
          const subResult = await ApiGet('/api/restaurant/menu_subcategory/filter', { pageNumber: 0, pageSize: 500 });
          if (subResult.success) {
            const catIds = cats.map(c => c.id);
            const activeSubs = (subResult.success.data.data.records || []).filter(s => catIds.includes(s.menuCategoryId?.id) && s.isActive);
            for (const sub of activeSubs) {
              const subPayload = { id: sub.id, name: sub.name, description: sub.description || '', isActive: false, menuCategoryId: { id: sub.menuCategoryId?.id }, branchId: { id: sub.branchId?.id } };
              const subFd = new FormData();
              subFd.append('payload', JSON.stringify(subPayload));
              await ApiPostFormData('/api/restaurant/menu_subcategory/update_Subcategory', subFd);
            }
          }
          // Fetch and deactivate all items under this branch's categories
          for (const cat of cats) {
            const itemResult = await ApiGet('/api/restaurant/menu_items/filter', { pageNumber: 0, pageSize: 500, categoryId: cat.id });
            if (itemResult.success) {
              const activeItems = (itemResult.success.data.data.records || []).filter(i => i.isActive);
              for (const item of activeItems) {
                const itemPayload = { id: item.id, name: item.name, price: item.price, isActive: false, menuCategoryId: { id: item.menuCategoryId?.id }, menuSubcategoryId: { id: item.menuSubcategoryId?.id }, branchId: { id: item.branchId?.id } };
                const itemFd = new FormData();
                itemFd.append('payload', JSON.stringify(itemPayload));
                await ApiPostFormData('/api/restaurant/menu_items/update_Menu', itemFd);
              }
            }
          }
          if (activeCats.length > 0) toast.info('All categories, subcategories & items have been deactivated');
          if (loaded) {
            setCategories(prev => prev.map(c => ({ ...c, isActive: false })));
          }
        }
        if (onBranchStatusChange) onBranchStatusChange();
      } else {
        setLocalActive(oldStatus);
        toast.error(result.fail || 'Failed to update branch status');
      }
    } catch (err) {
      setLocalActive(oldStatus);
      toast.error('Failed to update branch status');
    }
    setToggling(false);
  };

  const handleToggle = () => { if (!isExpanded) fetchCategories(); onToggle(branch.id); };
  const bc = LEVEL_CONFIG.branch;

  return (
    <div style={{ marginBottom: '8px', borderRadius: '12px', border: isExpanded ? `1.5px solid ${bc.color}` : '1px solid var(--mtree-border)', background: 'var(--mtree-surface)', transition: 'all 0.25s ease', boxShadow: isExpanded ? `0 4px 20px ${bc.color}18` : 'var(--mtree-card-shadow)' }}>
      {/* Branch Header */}
      <div onClick={handleToggle} className="branch-header-row" style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderRadius: isExpanded ? '12px 12px 0 0' : '12px', background: isExpanded ? 'var(--mtree-surface-accent-branch)' : 'var(--mtree-surface)', transition: 'background 0.25s ease', gap: '16px', userSelect: 'none' }}>
        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '14px', color: isExpanded ? bc.color : 'var(--mtree-text-faint)', minWidth: '16px' }}></i>
        <div style={{ width: 40, height: 40, borderRadius: '10px', background: isExpanded ? bc.color : 'var(--mtree-chip)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: isExpanded ? '#fff' : 'var(--mtree-text-muted)', transition: 'all 0.25s ease', flexShrink: 0 }}>
          {(branch.name || branch.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--mtree-text)' }}>{branch.name || branch.full_name}</span>
            <span style={{ fontSize: '11px', color: 'var(--mtree-text-muted)', background: 'var(--mtree-chip)', padding: '1px 8px', borderRadius: '4px' }}>ID: {branch.id}</span>
          </div>
          <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: '12px', color: 'var(--mtree-text-muted)' }}>
            {branch.mobile && <span><i className="bi bi-phone me-1"></i>{branch.mobile}</span>}
            {branch.email && <span><i className="bi bi-envelope me-1"></i>{branch.email}</span>}
          </div>
        </div>
        <div style={{ background: 'var(--mtree-chip)', borderRadius: '8px', padding: '4px 10px', textAlign: 'center', minWidth: '48px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mtree-text)', lineHeight: 1 }}>{loaded ? categories.length : '—'}</div>
          <div style={{ fontSize: '9px', color: 'var(--mtree-text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cats</div>
        </div>
        <ToggleSwitch isActive={localActive} onToggle={handleStatusToggle} loading={toggling} size="lg" />
        <button className="menu-tree-action-btn add-pill" title="Add Category" onClick={e => { e.stopPropagation(); onAddCategory(branch, refreshCategories); }} style={{ '--btn-color': bc.color }}>
          <i className="bi bi-plus-lg"></i><span className="d-none d-lg-inline">Category</span>
        </button>
      </div>

      {/* Categories inside branch */}
      <AnimatedCollapse open={isExpanded}>
        <div style={{ borderTop: '1px solid var(--mtree-border)' }}>
          {loading ? <div className="text-center py-4"><Spinner size="sm" style={{ color: bc.color }} /><div className="text-muted mt-2" style={{ fontSize: '12px' }}>Loading categories...</div></div>
          : categories.length === 0 && loaded ? <div className="text-center py-4" style={{ color: 'var(--mtree-text-faint)' }}><i className="bi bi-grid-3x3-gap" style={{ fontSize: '28px', opacity: 0.4 }}></i><div style={{ fontSize: '13px', marginTop: '6px' }}>No categories in this branch</div></div>
          : <div style={{ padding: '8px 8px 8px 0' }}>
              {categories.map(cat => <CategoryAccordionItem key={cat.id} category={cat} isExpanded={expandedCatId === cat.id} onToggle={id => setExpandedCatId(prev => prev === id ? null : id)} onEditCategory={onEditCategory} onDeleteCategory={onDeleteCategory} onEditSub={onEditSub} onDeleteSub={onDeleteSub} onAddSub={onAddSub} onEditItem={onEditItem} onDeleteItem={onDeleteItem} onAddItem={onAddItem} primaryColor={primaryColor} onStatusChange={refreshCategories} />)}
            </div>}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const MenuTree = () => {
  const { primaryColor } = useTheme();
  const { isDarkMode } = useDarkMode();
  const pc = primaryColor || '#0891b2';
  const menuTreeVars = {
    '--mtree-surface': isDarkMode ? '#0f172a' : '#ffffff',
    '--mtree-surface-alt': isDarkMode ? '#111827' : '#f8fafc',
    '--mtree-surface-hover': isDarkMode ? '#1e293b' : '#f8fafc',
    '--mtree-surface-accent-branch': isDarkMode ? 'linear-gradient(135deg, rgba(8,145,178,0.18), rgba(99,102,241,0.16))' : 'linear-gradient(135deg, #f0fdfa, #eff6ff)',
    '--mtree-surface-accent-cat': isDarkMode ? 'linear-gradient(135deg, rgba(99,102,241,0.16), rgba(20,184,166,0.12))' : 'linear-gradient(135deg, #eff6ff, #f0fdfa)',
    '--mtree-surface-accent-sub': isDarkMode ? 'rgba(20,184,166,0.12)' : '#f0fdfa',
    '--mtree-border': isDarkMode ? '#334155' : '#e2e8f0',
    '--mtree-border-soft': isDarkMode ? '#1e293b' : '#f1f5f9',
    '--mtree-text': isDarkMode ? '#f8fafc' : '#1e293b',
    '--mtree-text-muted': isDarkMode ? '#cbd5e1' : '#64748b',
    '--mtree-text-faint': isDarkMode ? '#94a3b8' : '#94a3b8',
    '--mtree-chip': isDarkMode ? '#1e293b' : '#f1f5f9',
    '--mtree-card-shadow': isDarkMode ? '0 1px 3px rgba(2,6,23,0.4)' : '0 1px 3px rgba(0,0,0,0.04)',
    '--mtree-modal-bg': isDarkMode ? '#0f172a' : '#ffffff',
    '--mtree-modal-muted-bg': isDarkMode ? '#111827' : '#fafbfd',
  };

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedBranchId, setExpandedBranchId] = useState(null);

  // Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catBranchId, setCatBranchId] = useState(null);
  const [catRefreshFn, setCatRefreshFn] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [subCategoryId, setSubCategoryId] = useState(null);
  const [subBranchId, setSubBranchId] = useState(null);
  const [subRefreshFn, setSubRefreshFn] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemCategoryId, setItemCategoryId] = useState(null);
  const [itemSubcategoryId, setItemSubcategoryId] = useState(null);
  const [itemBranchId, setItemBranchId] = useState(null);
  const [itemAddons, setItemAddons] = useState([]);
  const [itemRefreshFn, setItemRefreshFn] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    const result = await ApiGet('/api/restaurant/users/filter', { role: 'branch', pageNumber: 0, pageSize: 200 });
    if (result.success) setBranches(result.success.data.data.records || []);
    else toast.error(result.fail || 'Failed to load branches');
    setLoading(false);
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const filtered = debouncedSearch
    ? branches.filter(b => [b.name, b.full_name, b.email, b.mobile].some(f => (f || '').toLowerCase().includes(debouncedSearch.toLowerCase())))
    : branches;

  // Modal handlers
  const handleAddCategory = (branch, refreshFn) => { setEditCat(null); setCatBranchId(branch.id); setCatRefreshFn(() => refreshFn); setShowCatModal(true); };
  const handleEditCategory = (cat, refreshFn) => { setEditCat(cat); setCatBranchId(cat.branchId?.id); setCatRefreshFn(refreshFn ? () => refreshFn : null); setShowCatModal(true); };
  const handleAddSub = (category, refreshFn) => { setEditSub(null); setSubCategoryId(category.id); setSubBranchId(category.branchId?.id); setSubRefreshFn(() => refreshFn); setShowSubModal(true); };
  const handleEditSub = (sub, refreshFn) => { setEditSub(sub); setSubCategoryId(sub.menuCategoryId?.id); setSubBranchId(sub.branchId?.id); setSubRefreshFn(refreshFn ? () => refreshFn : null); setShowSubModal(true); };
  const handleAddItem = (sub, addons, refreshFn) => { setEditItem(null); setItemCategoryId(sub.menuCategoryId?.id); setItemSubcategoryId(sub.id); setItemBranchId(sub.branchId?.id); setItemAddons(addons); setItemRefreshFn(() => refreshFn); setShowItemModal(true); };
  const handleEditItem = (item, sub, addons, refreshFn) => { setEditItem(item); setItemCategoryId(sub.menuCategoryId?.id); setItemSubcategoryId(sub.id); setItemBranchId(item.branchId?.id || sub.branchId?.id); setItemAddons(addons); setItemRefreshFn(() => refreshFn); setShowItemModal(true); };

  // Delete handlers
  const handleDeleteCategory = async (category, refreshFn) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    const result = await ApiDelete(`/api/restaurant/menu_category/${category.id}`);
    if (result.success) { toast.success(`Category "${category.name}" deleted`); if (refreshFn) refreshFn(); }
    else toast.error(result.fail || 'Failed to delete category');
  };

  const handleDeleteSub = async (sub, refreshFn) => {
    if (!window.confirm(`Delete subcategory "${sub.name}"?`)) return;
    const result = await ApiDelete(`/api/restaurant/menu_subcategory/${sub.id}`);
    if (result.success) { toast.success(`Subcategory "${sub.name}" deleted`); if (refreshFn) refreshFn(); }
    else toast.error(result.fail || 'Failed to delete subcategory');
  };

  const handleDeleteItem = async (item, refreshFn) => {
    if (!window.confirm(`Delete item "${item.name}"?`)) return;
    const result = await ApiDelete(`/api/restaurant/menu_items/${item.id}`);
    if (result.success) { toast.success(`Item "${item.name}" deleted`); if (refreshFn) refreshFn(); }
    else toast.error(result.fail || 'Failed to delete item');
  };

  return (
    <Container fluid className="py-4" style={menuTreeVars}>
      {/* Header Banner */}
      <div className="mb-4 p-4 text-white" style={{ borderRadius: '16px', background: pc }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1"><i className="bi bi-diagram-3 me-2"></i>Menu Management Tree</h4>
            <p className="mb-0 opacity-75" style={{ fontSize: '14px' }}>Click on any branch to expand and view categories, subcategories & items</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{branches.length}</div>
            <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Branches</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-search text-muted"></i>
            <Form.Control type="text" placeholder="Search branches by name, email, or mobile..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', boxShadow: 'none', fontSize: '14px' }} />
            {search && <Button variant="link" className="p-0 text-muted" onClick={() => setSearch('')} style={{ fontSize: '18px' }}><i className="bi bi-x-circle"></i></Button>}
          </div>
        </Card.Body>
      </Card>

      {/* Branch Accordion Tree */}
      {loading ? (
        <div className="text-center py-5"><Spinner style={{ color: pc }} /><div className="text-muted mt-2" style={{ fontSize: '13px' }}>Loading branches...</div></div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Body className="text-center py-5">
            <i className="bi bi-shop" style={{ fontSize: 56, color: '#cbd5e1' }}></i>
            <div className="mt-3" style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>No branches found</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{search ? 'Try adjusting your search' : 'Add branches in User Management first'}</div>
          </Card.Body>
        </Card>
      ) : (
        <div>
          {filtered.map(branch => (
            <BranchAccordionItem
              key={branch.id}
              branch={branch}
              isExpanded={expandedBranchId === branch.id}
              onToggle={id => setExpandedBranchId(prev => prev === id ? null : id)}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddCategory={handleAddCategory}
              onEditSub={handleEditSub}
              onDeleteSub={handleDeleteSub}
              onAddSub={handleAddSub}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
              primaryColor={pc}
              onBranchStatusChange={fetchBranches}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryModal show={showCatModal} onHide={() => setShowCatModal(false)} category={editCat} branchId={catBranchId} onSave={() => { if (catRefreshFn) catRefreshFn(); }} primaryColor={pc} />
      <SubcategoryModal show={showSubModal} onHide={() => setShowSubModal(false)} subcategory={editSub} categoryId={subCategoryId} branchId={subBranchId} onSave={() => { if (subRefreshFn) subRefreshFn(); }} primaryColor={pc} />
      <ItemModal show={showItemModal} onHide={() => setShowItemModal(false)} item={editItem} categoryId={itemCategoryId} subcategoryId={itemSubcategoryId} branchId={itemBranchId} addons={itemAddons} onSave={() => { if (itemRefreshFn) itemRefreshFn(); }} primaryColor={pc} />

      <style>{`
        .branch-header-row:hover { background: var(--mtree-surface-hover) !important; }
        .cat-header-row:hover { background: var(--mtree-surface-hover) !important; }
        .sub-header-row:hover { background: var(--mtree-surface-hover) !important; }

        /* Ensure modals render above the menu tree */
        .modal-backdrop { z-index: 1050 !important; }
        .modal { z-index: 1055 !important; }
        .modal-dialog { z-index: 1060 !important; }

        /* Action Buttons */
        .menu-tree-action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; transition: all 0.2s ease;
          border-radius: 7px; font-size: 13px; padding: 0; flex-shrink: 0;
        }
        .menu-tree-action-btn.edit {
          width: 30px; height: 30px; background: color-mix(in srgb, var(--theme-primary, #6366f1) 12%, transparent); color: var(--theme-primary, #6366f1);
        }
        .menu-tree-action-btn.edit:hover {
          background: var(--theme-primary, #6366f1); color: #fff; transform: scale(1.08);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--theme-primary, #6366f1) 40%, transparent);
        }
        .menu-tree-action-btn.add {
          width: 30px; height: 30px;
          background: color-mix(in srgb, var(--btn-color, #0891b2) 12%, transparent);
          color: var(--btn-color, #0891b2);
        }
        .menu-tree-action-btn.add:hover {
          background: var(--btn-color, #0891b2); color: #fff; transform: scale(1.08);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--btn-color, #0891b2) 40%, transparent);
        }
        .menu-tree-action-btn.delete {
          width: 30px; height: 30px; background: #fee2e215; color: #ef4444;
        }
        .menu-tree-action-btn.delete:hover {
          background: #ef4444; color: #fff; transform: scale(1.08);
          box-shadow: 0 2px 8px rgba(239,68,68,0.4);
        }
        .menu-tree-action-btn.add-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
          background: transparent; color: var(--btn-color, #0891b2);
          border: 1.5px solid var(--btn-color, #0891b2); white-space: nowrap;
        }
        .menu-tree-action-btn.add-pill:hover {
          background: var(--btn-color, #0891b2); color: #fff;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--btn-color, #0891b2) 35%, transparent);
        }

        /* ===== Redesigned Modal Styles ===== */
        .mtree-modal-content {
          border-radius: 20px !important;
          border: none !important;
          background: var(--mtree-modal-bg) !important;
          color: var(--mtree-text) !important;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04) !important;
          overflow: hidden;
        }
        .mtree-modal-content .modal-header { display: none !important; }
        .mtree-modal-content .modal-body { padding: 0 !important; flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; background: var(--mtree-modal-bg) !important; color: var(--mtree-text) !important; }
        .mtree-modal-content .modal-footer { display: none !important; }
        .mtree-modal-content .form-control,
        .mtree-modal-content .form-select {
          background: var(--mtree-modal-muted-bg) !important;
          color: var(--mtree-text) !important;
          border-color: var(--mtree-border) !important;
        }
        .mtree-modal-content .form-control::placeholder {
          color: var(--mtree-text-faint) !important;
        }

        .mtree-close-btn:hover { background: var(--mtree-surface-hover) !important; color: var(--mtree-text) !important; }
        .mtree-cancel-btn:hover { background: var(--mtree-surface-hover) !important; border-color: var(--mtree-border) !important; color: var(--mtree-text) !important; }
        .mtree-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px color-mix(in srgb, var(--theme-primary, #0891b2) 40%, transparent) !important; }
        .mtree-submit-btn:active { transform: translateY(0); }
        .mtree-submit-btn:disabled { cursor: not-allowed; transform: none !important; }

        .mtree-input {
          outline: none;
          font-family: inherit;
          color: var(--mtree-text) !important;
        }
        .mtree-input:focus {
          border-color: var(--theme-primary, #0891b2) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary, #0891b2) 12%, transparent) !important;
          background: var(--mtree-surface) !important;
        }

        /* Wide item modal — 3-column layout */
        .mtree-item-modal-wide {
          max-width: 1140px !important;
          width: 95vw !important;
          margin: 1.75rem auto;
        }
        .mtree-item-modal-wide .modal-content {
          max-height: 88vh;
          display: flex;
          flex-direction: column;
        }

        /* Responsive: collapse to 2 columns on smaller screens */
        @media (max-width: 960px) {
          .mtree-item-modal-wide {
            max-width: 760px !important;
          }
          .mtree-item-body-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .mtree-item-body-grid > div:nth-child(3) {
            grid-column: 1 / -1;
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid var(--mtree-border-soft);
            padding-top: 14px;
          }
        }
        @media (max-width: 640px) {
          .mtree-item-modal-wide {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            height: 100% !important;
            min-height: 100% !important;
            align-items: stretch !important;
          }
          .mtree-item-modal-wide .modal-content {
            max-height: 100vh !important;
            max-height: 100dvh !important;
            height: 100vh !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            overflow: hidden !important;
          }
          .mtree-item-body-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            flex: 1 !important;
            min-height: 0 !important;
          }
          .mtree-item-body-grid > div:nth-child(3) {
            border-left: none !important;
            padding-left: 0 !important;
          }
        }

        /* Modal entrance animation */
        .modal.show .mtree-modal-content {
          animation: mtreeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes mtreeSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Backdrop blur */
        .modal-backdrop.show { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
      `}</style>
    </Container>
  );
};

export default MenuTree;
