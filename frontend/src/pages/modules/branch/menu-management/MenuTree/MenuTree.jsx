import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Button, Form, Spinner, Modal, Table, Row, Col, Image } from 'react-bootstrap';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { ApiGet, ApiPut, ApiPostFormData } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ImageCropperModal from '../../../../../components/common/ImageCropperModal';

// ==================== LEVEL CONFIG ====================
const LEVEL_CONFIG = {
  category: { label: 'Category', icon: 'bi-grid-3x3-gap-fill', color: '#6366f1', bg: '#6366f110' },
  subcategory: { label: 'Subcategory', icon: 'bi-collection', color: '#0891b2', bg: '#0891b210' },
  item: { label: 'Item', icon: 'bi-cup-hot', color: '#ea580c', bg: '#ea580c10' },
  addon: { label: 'Addon', icon: 'bi-puzzle', color: '#8b5cf6', bg: '#8b5cf610' },
};

// ==================== ANIMATED COLLAPSE ====================
const AnimatedCollapse = ({ open, children }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [isFullyOpen, setIsFullyOpen] = useState(false);

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
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

// ==================== SHARED MODAL STYLES ====================
const modalStyles = (pc) => ({
  overlay: { backdropFilter: 'blur(6px)' },
  dialog: { borderRadius: '20px', overflow: 'hidden', border: 'none', boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)' },
  header: { padding: '28px 28px 0', border: 'none', background: 'transparent' },
  headerIcon: { width: 44, height: 44, borderRadius: '14px', background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 70%, #000))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', flexShrink: 0, boxShadow: `0 8px 20px color-mix(in srgb, ${pc} 35%, transparent)` },
  headerTitle: { fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' },
  headerSub: { fontSize: '12px', color: '#94a3b8', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: '10px', border: 'none', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px', flexShrink: 0, marginLeft: 'auto' },
  body: { padding: '24px 28px' },
  label: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#64748b', marginBottom: '6px', display: 'block' },
  input: { borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px', transition: 'all 0.2s', background: '#f8fafc' },
  inputFocus: `outline: none; border-color: ${pc}; box-shadow: 0 0 0 3px color-mix(in srgb, ${pc} 12%, transparent); background: #fff;`,
  uploadZone: { border: '2px dashed #e2e8f0', borderRadius: '14px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s', background: '#fafbfc', position: 'relative', overflow: 'hidden' },
  uploadZoneHover: `border-color: ${pc}; background: color-mix(in srgb, ${pc} 4%, #fff);`,
  footer: { padding: '0 28px 24px', border: 'none', display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 22px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  submitBtn: { padding: '10px 28px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 80%, #000))`, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 14px color-mix(in srgb, ${pc} 35%, transparent)`, display: 'flex', alignItems: 'center', gap: '6px' },
});

// Reusable image upload zone
const ImageUploadZone = ({ imagePreview, onSelect, onRemove, pc }) => {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer?.files?.[0]; if (file && file.type.startsWith('image/')) { const reader = new FileReader(); reader.onloadend = () => onSelect(reader.result); reader.readAsDataURL(file); } };
  return (
    <div
      onClick={() => !imagePreview && fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{ border: `2px dashed ${dragOver ? pc : imagePreview ? 'transparent' : '#e2e8f0'}`, borderRadius: '14px', padding: imagePreview ? '0' : '20px 16px', textAlign: 'center', cursor: imagePreview ? 'default' : 'pointer', transition: 'all 0.25s', background: dragOver ? `color-mix(in srgb, ${pc} 4%, #fff)` : imagePreview ? 'transparent' : '#fafbfc', position: 'relative', overflow: 'hidden', minHeight: imagePreview ? 'auto' : '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => onSelect(reader.result); reader.readAsDataURL(file); } e.target.value = ''; }} />
      {imagePreview ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', width: '100%' }}>
          <div style={{ width: 64, height: 64, borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '2px solid #f1f5f9' }}>
            <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Image uploaded</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Click buttons to modify</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} style={{ width: 32, height: 32, borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', transition: 'all 0.2s' }} title="Change image"><i className="bi bi-arrow-repeat"></i></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ width: 32, height: 32, borderRadius: '8px', border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', transition: 'all 0.2s' }} title="Remove image"><i className="bi bi-trash3"></i></button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ width: 40, height: 40, borderRadius: '12px', background: `color-mix(in srgb, ${pc} 10%, #fff)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
            <i className="bi bi-cloud-arrow-up" style={{ fontSize: '18px', color: pc }}></i>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Drop image or <span style={{ color: pc }}>browse</span></div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>PNG, JPG up to 5MB</div>
        </div>
      )}
    </div>
  );
};

// ==================== CATEGORY MODAL ====================
const CategoryModal = ({ show, onHide, category, onSave, primaryColor }) => {
  const [form, setForm] = useState({ name: '', description: '', priority: 1, isActive: true });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const ms = modalStyles(primaryColor);

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
    const payload = { name: form.name.trim(), description: form.description.trim(), priority: parseInt(form.priority), isActive: form.isActive };
    if (category) payload.id = category.id;
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    if (imageFile) fd.append('photo', imageFile);
    const endpoint = category ? '/api/branch/menu_category/update_Category' : '/api/branch/menu_category/add_Category';
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
const SubcategoryModal = ({ show, onHide, subcategory, categoryId, onSave, primaryColor }) => {
  const [form, setForm] = useState({ name: '', description: '', isActive: true, priority: 1 });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const ms = modalStyles(primaryColor);

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
    const payload = { name: form.name.trim(), description: form.description.trim(), isActive: form.isActive, priority: parseInt(form.priority) || 1, menuCategoryId: { id: categoryId } };
    if (subcategory) payload.id = subcategory.id;
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    if (imageFile) fd.append('photo', imageFile);
    const endpoint = subcategory ? '/api/branch/menu_subcategory/update_Subcategory' : '/api/branch/menu_subcategory/add_Subcategory';
    const result = await ApiPostFormData(endpoint, fd);
    if (result.success) { toast.success(subcategory ? 'Subcategory updated' : 'Subcategory added'); onSave(); onHide(); } else toast.error(result.fail);
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
          <div style={{ position: 'relative', padding: '32px 32px 24px', overflow: 'hidden', background: `linear-gradient(135deg, color-mix(in srgb, ${pc} 6%, #fff) 0%, #fff 50%, color-mix(in srgb, ${pc} 4%, #fff) 100%)`, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'absolute', top: -40, right: -20, width: 120, height: 120, borderRadius: '50%', background: `color-mix(in srgb, ${pc} 8%, transparent)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: 40, width: 80, height: 80, borderRadius: '50%', background: 'color-mix(in srgb, #8b5cf6 6%, transparent)', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '18px', flexShrink: 0, position: 'relative', background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 60%, #8b5cf6))`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 30px color-mix(in srgb, ${pc} 30%, transparent)` }}>
                <i className={`bi bi-${subcategory ? 'pencil-square' : 'layers-fill'}`} style={{ fontSize: '22px', color: '#fff' }}></i>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '18px', background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)', pointerEvents: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{subcategory ? 'Edit Subcategory' : 'New Subcategory'}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: 2 }}>{subcategory ? 'Modify name, image, priority & visibility' : 'Add a fresh subcategory to organize your menu'}</div>
              </div>
              <button type="button" onClick={onHide} style={{ width: 38, height: 38, borderRadius: '14px', border: 'none', background: 'rgba(0,0,0,0.04)', backdropFilter: 'blur(10px)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px', flexShrink: 0 }} className="mtree-close-btn"><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{ position: 'relative' }}>
              <input className="mtree-input" placeholder={subcategory ? 'Subcategory name' : 'Enter subcategory name...'} value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors({}); }} autoFocus style={{ width: '100%', padding: '14px 18px', fontSize: '16px', fontWeight: 700, borderRadius: '14px', border: `2px solid ${errors.name ? '#ef4444' : 'rgba(0,0,0,0.06)'}`, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', outline: 'none', transition: 'all 0.3s', color: '#0f172a', letterSpacing: '-0.3px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }} onFocus={e => { e.target.style.borderColor = pc; e.target.style.boxShadow = `0 0 0 4px color-mix(in srgb, ${pc} 10%, transparent)`; }} onBlur={e => { e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)'; }} />
              {errors.name && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><i className="bi bi-exclamation-triangle-fill"></i>Name is required</div>}
            </div>
          </div>

          <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '6px', background: '#ea580c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-image" style={{ fontSize: '10px', color: '#ea580c' }}></i></div>Cover Image
              </div>
              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '2px solid #e8ecf1', height: 220, background: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.2) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 14, opacity: 0, transition: 'opacity 0.25s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ width: 34, height: 34, borderRadius: '10px', border: 'none', fontSize: '14px', background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-trash3"></i></button></div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', letterSpacing: '-0.2px' }}><i className="bi bi-arrow-repeat" style={{ fontSize: '13px' }}></i>Change Image</button></div>
                  </div>
                  <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', fontSize: '10px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><i className="bi bi-check-circle-fill" style={{ fontSize: '9px' }}></i>Uploaded</div>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop} style={{ borderRadius: '18px', height: 220, position: 'relative', overflow: 'hidden', border: `2.5px dashed ${dragOver ? pc : '#d1d5db'}`, background: dragOver ? `color-mix(in srgb, ${pc} 4%, #fff)` : 'linear-gradient(145deg, #fafbfd, #f5f7fa)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', gap: 10 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '20px', position: 'relative', background: `linear-gradient(135deg, color-mix(in srgb, ${pc} 12%, #fff), color-mix(in srgb, ${pc} 6%, #fff))`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px color-mix(in srgb, ${pc} 10%, transparent)` }}><i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: '24px', color: pc }} /></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{dragOver ? 'Drop it here!' : 'Upload Cover Image'}</div><div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 3 }}>Drag & drop or <span style={{ color: pc, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>browse files</span></div></div>
                  <div style={{ fontSize: '10px', color: '#c1c8d4', background: '#f1f5f9', padding: '3px 10px', borderRadius: '6px' }}>PNG, JPG, WEBP up to 5MB</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 20, height: 20, borderRadius: '6px', background: form.isActive ? '#10b98110' : '#64748b10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-broadcast" style={{ fontSize: '10px', color: form.isActive ? '#10b981' : '#64748b' }}></i></div>Visibility</div>
                <div onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s', userSelect: 'none', background: form.isActive ? 'linear-gradient(135deg, #ecfdf5, #f0fdf4)' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: `1.5px solid ${form.isActive ? '#86efac' : '#e2e8f0'}`, boxShadow: form.isActive ? '0 4px 16px rgba(16,185,129,0.1)' : 'none' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '14px', flexShrink: 0, background: form.isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #cbd5e1, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: form.isActive ? '0 6px 16px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}><i className={`bi bi-${form.isActive ? 'eye-fill' : 'eye-slash-fill'}`} style={{ fontSize: '17px', color: '#fff' }}></i></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: 800, color: form.isActive ? '#065f46' : '#475569', letterSpacing: '-0.3px' }}>{form.isActive ? 'Live on Menu' : 'Hidden'}</div><div style={{ fontSize: '11px', color: form.isActive ? '#6ee7b7' : '#94a3b8', fontWeight: 500, marginTop: 1 }}>{form.isActive ? 'Customers can see this subcategory' : 'Not visible to customers'}</div></div>
                  <ToggleSwitch isActive={form.isActive} onToggle={v => setForm(p => ({ ...p, isActive: v }))} loading={false} size="lg" />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 20, height: 20, borderRadius: '6px', background: '#6366f110', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-arrows-move" style={{ fontSize: '10px', color: '#6366f1' }}></i></div>Display Order</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #e8ecf1' }}>
                  <button type="button" onClick={() => setForm(p => ({ ...p, priority: Math.max(0, (parseInt(p.priority) || 1) - 1) }))} style={{ width: 42, height: 42, borderRadius: '10px', border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}><i className="bi bi-dash-lg"></i></button>
                  <div style={{ flex: 1, textAlign: 'center' }}><input type="number" min="0" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ width: '100%', padding: '6px', fontSize: '22px', fontWeight: 800, textAlign: 'center', border: 'none', background: 'transparent', outline: 'none', color: '#1e293b', letterSpacing: '-0.5px' }} /><div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginTop: -2 }}>Priority</div></div>
                  <button type="button" onClick={() => setForm(p => ({ ...p, priority: (parseInt(p.priority) || 0) + 1 }))} style={{ width: 42, height: 42, borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 80%, #8b5cf6))`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', transition: 'all 0.2s', boxShadow: `0 4px 12px color-mix(in srgb, ${pc} 25%, transparent)`, flexShrink: 0 }}><i className="bi bi-plus-lg"></i></button>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 20, height: 20, borderRadius: '6px', background: '#8b5cf610', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-text-paragraph" style={{ fontSize: '10px', color: '#8b5cf6' }}></i></div>Description <span style={{ fontSize: '9px', fontWeight: 500, color: '#b0b8c4', textTransform: 'none', letterSpacing: 0 }}>optional</span></div>
                <textarea className="mtree-input" rows={3} placeholder="Brief description of this subcategory..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '12px 16px', fontSize: '13px', borderRadius: '14px', border: '1.5px solid #e8ecf1', background: '#fafbfd', outline: 'none', resize: 'none', transition: 'all 0.3s', minHeight: 72, color: '#334155', lineHeight: 1.6 }} onFocus={e => { e.target.style.borderColor = pc; e.target.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${pc} 8%, transparent)`; }} onBlur={e => { e.target.style.borderColor = '#e8ecf1'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 32px 24px', display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg, #fafbfd, #f5f7fa)', borderTop: '1px solid #edf0f4', borderRadius: '0 0 20px 20px' }}>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {form.isActive && <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></div>Live</span>}
              {!form.isActive && <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}></div>Draft</span>}
              {form.priority !== '' && <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 4 }}><i className="bi bi-arrow-up-short" style={{ fontSize: '11px' }}></i>#{form.priority}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onHide} style={{ padding: '11px 24px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }} className="mtree-cancel-btn">Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '11px 32px', borderRadius: '12px', border: 'none', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${pc}, color-mix(in srgb, ${pc} 65%, #7c3aed))`, color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s', letterSpacing: '-0.2px', boxShadow: `0 6px 20px color-mix(in srgb, ${pc} 35%, transparent)`, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }} className="mtree-submit-btn">
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
    <div style={{ marginBottom: '16px', borderRadius: '14px', border: '1px solid #e8ecf1', background: '#fff', overflow: 'hidden', transition: 'box-shadow 0.2s', boxShadow: open ? '0 2px 12px rgba(0,0,0,0.04)' : 'none' }}>
      <div onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', cursor: 'pointer', userSelect: 'none', background: open ? '#fafbfc' : '#fff', transition: 'background 0.2s' }}>
        <div style={{ width: 30, height: 30, borderRadius: '9px', background: `linear-gradient(135deg, ${pc}18, ${pc}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bi bi-${icon}`} style={{ fontSize: '13px', color: pc }}></i>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', flex: 1, letterSpacing: '-0.2px' }}>{title}</span>
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

// ==================== INLINE ADDON ROW ====================
const InlineAddonRow = ({ addon, index, onChange, onRemove, pc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fafbfc', borderRadius: '10px', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', minWidth: '18px' }}>{index + 1}</span>
    <input placeholder="e.g. Extra Cheese" value={addon.name} onChange={e => onChange({ ...addon, name: e.target.value })}
      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', outline: 'none', minWidth: 0 }} className="mtree-input" />
    <div style={{ position: 'relative', width: '100px', flexShrink: 0 }}>
      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>$</span>
      <input type="number" step="0.01" placeholder="0" value={addon.price} onChange={e => onChange({ ...addon, price: e.target.value })}
        style={{ width: '100%', padding: '8px 10px 8px 24px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff', outline: 'none' }} className="mtree-input" />
    </div>
    <div title={addon.isRequired ? 'Required — customer must select' : 'Optional'} onClick={() => onChange({ ...addon, isRequired: !addon.isRequired })}
      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', border: `1.5px solid ${addon.isRequired ? pc : '#e2e8f0'}`, background: addon.isRequired ? `${pc}10` : '#fff', transition: 'all 0.2s', flexShrink: 0 }}>
      <i className={`bi bi-${addon.isRequired ? 'check-circle-fill' : 'circle'}`} style={{ fontSize: '12px', color: addon.isRequired ? pc : '#cbd5e1' }}></i>
      <span style={{ fontSize: '11px', fontWeight: 600, color: addon.isRequired ? pc : '#94a3b8' }}>Req</span>
    </div>
    <button type="button" onClick={onRemove}
      style={{ width: 30, height: 30, borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, transition: 'all 0.2s' }}>
      <i className="bi bi-trash3"></i>
    </button>
  </div>
);

// ==================== ITEM MODAL ====================
const ItemModal = ({ show, onHide, item, categoryId, subcategoryId, addons, onSave, primaryColor }) => {
  const [form, setForm] = useState({ name: '', description: '', price: '', mrp: '', halfPrice: '', halfMrp: '', qtrPrice: '', qtrMrp: '', dietaryType: true, isAvailable: true, isActive: true, isRecommended: false, preparationMinutes: '', priority: 1, spiceLevel: '', addonsId: '', gstPercentage: '', gstType: '' });
  const [inlineAddons, setInlineAddons] = useState([]);
  const [existingAddonItems, setExistingAddonItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const ms = modalStyles(primaryColor);
  const pc = primaryColor;

  useEffect(() => {
    if (show) {
      if (item) {
        setForm({ name: item.name || '', description: item.description || '', price: item.price ?? '', mrp: item.mrp ?? '', halfPrice: item.halfPrice ?? '', halfMrp: item.halfMrp ?? '', qtrPrice: item.qtrPrice ?? '', qtrMrp: item.qtrMrp ?? '', dietaryType: item.dietaryType ?? true, isAvailable: item.isAvailable ?? true, isActive: item.isActive ?? true, isRecommended: item.isRecommended ?? false, preparationMinutes: item.preparationMinutes ?? '', priority: item.priority || 1, spiceLevel: item.spiceLevel || '', addonsId: item.addonsId?.id || '', gstPercentage: item.gstPercentage ?? '', gstType: item.gstType || '' });
        setImagePreview(item.imageUrl || null);
        // Load existing addon items if item has addonsId
        if (item.addonsId?.id) {
          ApiGet('/api/branch/addons_items/getByAddonsId', { addonsId: item.addonsId.id }).then(res => {
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
    const payload = { name: form.name.trim(), description: form.description.trim(), price: parseFloat(form.price), mrp: form.mrp ? parseFloat(form.mrp) : null, halfPrice: form.halfPrice ? parseFloat(form.halfPrice) : null, halfMrp: form.halfMrp ? parseFloat(form.halfMrp) : null, qtrPrice: form.qtrPrice ? parseFloat(form.qtrPrice) : null, qtrMrp: form.qtrMrp ? parseFloat(form.qtrMrp) : null, dietaryType: form.dietaryType, isAvailable: form.isAvailable, isActive: form.isActive, isRecommended: form.isRecommended, preparationMinutes: form.preparationMinutes ? parseInt(form.preparationMinutes) : null, priority: parseInt(form.priority), spiceLevel: form.spiceLevel || null, gstPercentage: form.gstPercentage !== '' ? parseFloat(form.gstPercentage) : null, gstType: form.gstType || null, menuCategoryId: { id: categoryId }, menuSubcategoryId: { id: subcategoryId } };
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
    const endpoint = item ? '/api/branch/menu_items/update_Menu' : '/api/branch/menu_items/add_Menu';
    const result = await ApiPostFormData(endpoint, fd);
    if (result.success) { toast.success(item ? 'Item updated' : 'Item added'); onSave(); onHide(); } else toast.error(result.fail);
    setSaving(false);
  };
  const handleImageSelect = (src) => { setTempImageSrc(src); setShowCropper(true); };

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" contentClassName="mtree-modal-content" dialogClassName="mtree-item-modal-dialog">
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={ms.headerIcon}><i className={`bi bi-${item ? 'pencil-square' : 'cup-hot-fill'}`}></i></div>
            <div style={{ flex: 1 }}>
              <div style={ms.headerTitle}>{item ? 'Edit Menu Item' : 'New Menu Item'}</div>
              <div style={ms.headerSub}>{item ? 'Update item details and pricing' : 'Add a delicious new item to your menu'}</div>
            </div>
            <button onClick={onHide} style={ms.closeBtn} className="mtree-close-btn"><i className="bi bi-x-lg"></i></button>
          </div>
        </div>
        <Form onSubmit={handleSubmit}>
          <div style={{ ...ms.body, maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>

            {/* ── SECTION 1: MENU ITEM INFORMATION ── */}
            <SectionCard icon="tag" title="Menu Item Information" pc={pc}>
              <Row className="g-3">
                <Col md={6}>
                  <label style={ms.label}><i className="bi bi-type me-1"></i>Item Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="mtree-input" placeholder="e.g. Paneer Tikka" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }} style={{ ...ms.input, width: '100%', ...(errors.name ? { borderColor: '#ef4444' } : {}) }} />
                  {errors.name && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.name}</div>}
                </Col>
                <Col md={6}>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                      <div style={{ padding: '5px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}></div>
                      <div style={{ padding: '5px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderLeft: '1px solid #e2e8f0' }}>Price <span style={{ color: '#ef4444' }}>*</span></div>
                      <div style={{ padding: '5px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderLeft: '1px solid #e2e8f0' }}>MRP <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(opt)</span></div>
                    </div>
                    {/* FULL */}
                    <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ padding: '5px 8px', fontSize: '10px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center' }}>FULL</div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                        <input className="mtree-input" type="number" step="0.01" placeholder="220" value={form.price} onChange={e => { setForm(p => ({ ...p, price: e.target.value })); setErrors(p => ({ ...p, price: '' })); }} style={{ width: '100%', padding: '6px 8px 6px 22px', fontSize: '12px', border: 'none', background: errors.price ? '#fef2f2' : 'transparent', outline: 'none' }} />
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                        <input className="mtree-input" type="number" step="0.01" placeholder="260" value={form.mrp} onChange={e => setForm(p => ({ ...p, mrp: e.target.value }))} style={{ width: '100%', padding: '6px 8px 6px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                      </div>
                    </div>
                    {/* HALF */}
                    <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ padding: '5px 8px', fontSize: '10px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center' }}>HALF</div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                        <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.halfPrice} onChange={e => setForm(p => ({ ...p, halfPrice: e.target.value }))} style={{ width: '100%', padding: '6px 8px 6px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                        <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.halfMrp} onChange={e => setForm(p => ({ ...p, halfMrp: e.target.value }))} style={{ width: '100%', padding: '6px 8px 6px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                      </div>
                    </div>
                    {/* QTR */}
                    <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr' }}>
                      <div style={{ padding: '5px 8px', fontSize: '10px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center' }}>QTR</div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                        <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.qtrPrice} onChange={e => setForm(p => ({ ...p, qtrPrice: e.target.value }))} style={{ width: '100%', padding: '6px 8px 6px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>$</span>
                        <input className="mtree-input" type="number" step="0.01" placeholder="–" value={form.qtrMrp} onChange={e => setForm(p => ({ ...p, qtrMrp: e.target.value }))} style={{ width: '100%', padding: '6px 8px 6px 22px', fontSize: '12px', border: 'none', background: 'transparent', outline: 'none' }} />
                      </div>
                    </div>
                  </div>
                  {errors.price && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>Full price is required</div>}
                </Col>
                <Col md={3}>
                  <label style={ms.label}><i className="bi bi-percent me-1"></i>GST %</label>
                  <div style={{ position: 'relative' }}>
                    <input className="mtree-input" type="number" step="0.01" min="0" max="100" placeholder="0" value={form.gstPercentage} onChange={e => setForm(p => ({ ...p, gstPercentage: e.target.value }))} style={{ ...ms.input, width: '100%', paddingRight: '32px' }} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>%</span>
                  </div>
                </Col>
                <Col md={3}>
                  <label style={ms.label}>GST Type</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => setForm(p => ({ ...p, gstType: 'INCLUSIVE' }))}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', border: `1.5px solid ${form.gstType === 'INCLUSIVE' ? pc : '#e2e8f0'}`, background: form.gstType === 'INCLUSIVE' ? `${pc}12` : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: form.gstType === 'INCLUSIVE' ? pc : '#94a3b8' }}>Inclusive</span>
                    </button>
                    <button type="button" onClick={() => setForm(p => ({ ...p, gstType: 'EXCLUSIVE' }))}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', border: `1.5px solid ${form.gstType === 'EXCLUSIVE' ? pc : '#e2e8f0'}`, background: form.gstType === 'EXCLUSIVE' ? `${pc}12` : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: form.gstType === 'EXCLUSIVE' ? pc : '#94a3b8' }}>Exclusive</span>
                    </button>
                  </div>
                </Col>
              </Row>
            </SectionCard>

            {/* ── SECTION 2: ITEM DETAILS ── */}
            <SectionCard icon="sliders" title="Item Details" pc={pc}>
              <Row className="g-3">
                <Col md={4}>
                  <label style={ms.label}><i className="bi bi-leaf me-1"></i>Dietary Type</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => setForm(p => ({ ...p, dietaryType: true }))} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: `1.5px solid ${form.dietaryType ? '#10b981' : '#e2e8f0'}`, background: form.dietaryType ? '#10b98112' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '2px', border: '2px solid #10b981', background: form.dietaryType ? '#10b981' : 'transparent' }}></span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: form.dietaryType ? '#059669' : '#94a3b8' }}>Veg</span>
                    </button>
                    <button type="button" onClick={() => setForm(p => ({ ...p, dietaryType: false }))} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: `1.5px solid ${!form.dietaryType ? '#ef4444' : '#e2e8f0'}`, background: !form.dietaryType ? '#ef444412' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '2px', border: '2px solid #ef4444', background: !form.dietaryType ? '#ef4444' : 'transparent' }}></span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: !form.dietaryType ? '#dc2626' : '#94a3b8' }}>Non-Veg</span>
                    </button>
                  </div>
                </Col>
                <Col md={4}>
                  <label style={ms.label}><i className="bi bi-clock me-1"></i>Prep Time</label>
                  <div style={{ position: 'relative' }}>
                    <input className="mtree-input" type="number" placeholder="15" value={form.preparationMinutes} onChange={e => setForm(p => ({ ...p, preparationMinutes: e.target.value }))} style={{ ...ms.input, width: '100%', paddingRight: '44px' }} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>min</span>
                  </div>
                </Col>
                <Col md={4}>
                  <label style={ms.label}><i className="bi bi-sort-numeric-up me-1"></i>Priority</label>
                  <input className="mtree-input" type="number" min="0" placeholder="1" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...ms.input, width: '100%' }} />
                </Col>
                <Col xs={12}>
                  <label style={ms.label}><i className="bi bi-fire me-1"></i>Spice Level</label>
                  <SpicePills value={form.spiceLevel} onChange={v => setForm(p => ({ ...p, spiceLevel: v }))} />
                </Col>
              </Row>
            </SectionCard>

            {/* ── SECTION 3: CUSTOMER EXPERIENCE ── */}
            <SectionCard icon="stars" title="Customer Experience" pc={pc}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { key: 'isRecommended', label: 'Recommended', sub: 'Show in top picks', icon: 'bi-hand-thumbs-up-fill', activeColor: '#f59e0b', activeBg: '#fef3c7' },
                  { key: 'isAvailable', label: 'Available', sub: 'Visible to customers', icon: 'bi-eye-fill', activeColor: '#10b981', activeBg: '#d1fae5' },
                  { key: 'isActive', label: 'Active', sub: 'Live on menu', icon: 'bi-lightning-fill', activeColor: '#6366f1', activeBg: '#e0e7ff' },
                ].map(t => {
                  const active = form[t.key];
                  return (
                    <div key={t.key} onClick={() => setForm(p => ({ ...p, [t.key]: !p[t.key] }))}
                      style={{ flex: '1 1 140px', padding: '14px 16px', borderRadius: '12px', border: `1.5px solid ${active ? t.activeColor + '50' : '#e8ecf1'}`, background: active ? t.activeBg + '80' : '#fafbfc', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: active ? t.activeColor + '20' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
                        <i className={`bi ${t.icon}`} style={{ fontSize: '15px', color: active ? t.activeColor : '#94a3b8' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: active ? '#1e293b' : '#64748b' }}>{t.label}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{t.sub}</div>
                      </div>
                      <ToggleSwitch isActive={active} onToggle={() => setForm(p => ({ ...p, [t.key]: !p[t.key] }))} loading={false} size="lg" />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* ── SECTION 4: ADD-ONS BUILDER ── */}
            <SectionCard icon="puzzle" title={`Add-ons${inlineAddons.length > 0 ? ` (${inlineAddons.length})` : ''}`} pc={pc} defaultOpen={inlineAddons.length > 0}>
              {inlineAddons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <i className="bi bi-puzzle" style={{ fontSize: '20px', color: '#cbd5e1' }}></i>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>No add-ons yet. Create customizable options for this item.</div>
                  <button type="button" onClick={addAddonRow}
                    style={{ padding: '8px 20px', borderRadius: '10px', border: `1.5px dashed ${pc}`, background: `${pc}08`, color: pc, fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="bi bi-plus-lg"></i> Add First Add-on
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Header labels */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', minWidth: '18px' }}>#</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', flex: 1 }}>Name</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', width: '100px', flexShrink: 0 }}>Price</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', width: '66px', flexShrink: 0, textAlign: 'center' }}>Req?</span>
                    <span style={{ width: '30px', flexShrink: 0 }}></span>
                  </div>
                  {inlineAddons.map((addon, i) => (
                    <InlineAddonRow key={i} addon={addon} index={i} onChange={val => updateAddonRow(i, val)} onRemove={() => removeAddonRow(i)} pc={pc} />
                  ))}
                  <button type="button" onClick={addAddonRow}
                    style={{ padding: '10px', borderRadius: '10px', border: `1.5px dashed #e2e8f0`, background: '#fafbfc', color: '#64748b', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                    <i className="bi bi-plus-lg" style={{ fontSize: '11px' }}></i> Add Another
                  </button>
                </div>
              )}
            </SectionCard>

            {/* ── SECTION 5: MEDIA & DESCRIPTION ── */}
            <SectionCard icon="image" title="Media & Description" pc={pc}>
              <Row className="g-3">
                <Col md={6}>
                  <label style={ms.label}><i className="bi bi-camera me-1"></i>Image</label>
                  <ImageUploadZone imagePreview={imagePreview} onSelect={handleImageSelect} onRemove={() => { setImageFile(null); setImagePreview(null); }} pc={pc} />
                  <div style={{ fontSize: '10px', color: '#b0b8c4', marginTop: '6px' }}>PNG, JPG, WEBP up to 5MB</div>
                </Col>
                <Col md={6}>
                  <label style={ms.label}><i className="bi bi-text-paragraph me-1"></i>Description</label>
                  <textarea className="mtree-input" rows={4} placeholder="Describe the dish — flavor, ingredients, portion..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...ms.input, width: '100%', resize: 'vertical', minHeight: '110px' }} />
                </Col>
              </Row>
            </SectionCard>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ ...ms.footer, borderTop: '1px solid #f1f5f9', paddingTop: '18px', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {form.isRecommended && <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', background: '#fef3c7', padding: '3px 10px', borderRadius: '6px' }}><i className="bi bi-hand-thumbs-up-fill me-1"></i>Recommended</span>}
              {inlineAddons.filter(a => a.name.trim()).length > 0 && <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b5cf6', background: '#ede9fe', padding: '3px 10px', borderRadius: '6px' }}><i className="bi bi-puzzle me-1"></i>{inlineAddons.filter(a => a.name.trim()).length} add-on{inlineAddons.filter(a => a.name.trim()).length > 1 ? 's' : ''}</span>}
            </div>
            <button type="button" onClick={onHide} style={ms.cancelBtn} className="mtree-cancel-btn">Cancel</button>
            <button type="submit" disabled={saving} style={{ ...ms.submitBtn, opacity: saving ? 0.7 : 1, padding: '11px 32px' }} className="mtree-submit-btn">
              {saving ? <Spinner size="sm" /> : <><i className="bi bi-check-lg"></i>{item ? 'Update Item' : 'Add Item'}</>}
            </button>
          </div>
        </Form>
      </Modal>
      <ImageCropperModal show={showCropper} onHide={() => setShowCropper(false)} imageSrc={tempImageSrc} onCropComplete={(f, url) => { setImageFile(f); setImagePreview(url); }} aspectRatio={1} title="Crop Item Image" primaryColor={primaryColor} />
    </>
  );
};

// ==================== SUBCATEGORY ACCORDION ITEM ====================
const SubcategoryAccordionItem = ({ sub, isExpanded, onToggle, onEditSub, onEditItem, onAddItem, primaryColor, onStatusChange }) => {
  const [items, setItems] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [localActive, setLocalActive] = useState(sub.isActive);
  const [toggling, setToggling] = useState(false);

  useEffect(() => { setLocalActive(sub.isActive); }, [sub.isActive]);

  const handleStatusToggle = async (newStatus) => {
    setToggling(true);
    const fd = new FormData();
    fd.append('payload', JSON.stringify({ id: sub.id, isActive: newStatus, name: sub.name, menuCategoryId: { id: sub.menuCategoryId?.id } }));
    const result = await ApiPostFormData('/api/branch/menu_subcategory/update_Subcategory', fd);
    if (result.success) {
      setLocalActive(newStatus);
      toast.success(`${sub.name} ${newStatus ? 'activated' : 'deactivated'}`);
      if (onStatusChange) onStatusChange();
    } else {
      toast.error(result.fail || 'Failed to update status');
    }
    setToggling(false);
  };

  const fetchItems = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    const result = await ApiGet('/api/branch/menu_items/filter', { pageNumber: 0, pageSize: 500, categoryId: sub.menuCategoryId?.id });
    if (result.success) {
      const all = result.success.data.data.records || [];
      setItems(all.filter(i => i.menuSubcategoryId?.id === sub.id));
    }
    // Also fetch addons
    const addonResult = await ApiGet('/api/branch/addons/filter', { pageNumber: 0, pageSize: 200 });
    if (addonResult.success) setAddons(addonResult.success.data.data.records || []);
    setLoaded(true);
    setLoading(false);
  }, [sub.id, sub.menuCategoryId?.id, loaded]);

  const handleToggle = () => {
    if (!isExpanded) fetchItems();
    onToggle(sub.id);
  };

  const refreshItems = async () => {
    setLoaded(false);
    setLoading(true);
    const result = await ApiGet('/api/branch/menu_items/filter', { pageNumber: 0, pageSize: 500, categoryId: sub.menuCategoryId?.id });
    if (result.success) {
      const all = result.success.data.data.records || [];
      setItems(all.filter(i => i.menuSubcategoryId?.id === sub.id));
    }
    setLoaded(true);
    setLoading(false);
  };

  const handleItemStatusToggle = async (item, newStatus) => {
    const fd = new FormData();
    fd.append('payload', JSON.stringify({ id: item.id, isActive: newStatus, name: item.name, price: item.price, menuCategoryId: { id: sub.menuCategoryId?.id }, menuSubcategoryId: { id: sub.id } }));
    const result = await ApiPostFormData('/api/branch/menu_items/update_Menu', fd);
    if (result.success) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: newStatus } : i));
      toast.success(`${item.name} ${newStatus ? 'activated' : 'deactivated'}`);
    } else {
      toast.error(result.fail || 'Failed to update status');
    }
  };

  const sc = LEVEL_CONFIG.subcategory;

  return (
    <div style={{ marginBottom: '4px', marginLeft: '20px', borderRadius: '10px', border: isExpanded ? `1.5px solid ${primaryColor}` : '1px solid #e2e8f0', background: '#fff', transition: 'all 0.25s ease', boxShadow: isExpanded ? `0 4px 16px ${primaryColor}18` : 'none' }}>
      {/* Subcategory Header */}
      <div onClick={handleToggle} className="subcategory-header-row" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', borderRadius: isExpanded ? '10px 10px 0 0' : '10px', background: isExpanded ? '#f0fdfa' : '#fff', transition: 'background 0.25s ease', gap: '12px', userSelect: 'none' }}>
        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '12px', color: isExpanded ? primaryColor : '#94a3b8', minWidth: '14px', transition: 'color 0.25s ease' }}></i>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: isExpanded ? `linear-gradient(135deg, ${sc.color}, ${primaryColor})` : sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: isExpanded ? '#fff' : sc.color, transition: 'all 0.25s ease', flexShrink: 0, overflow: 'hidden' }}>
          {sub.iconUrl ? <img src={sub.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : (sub.name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{sub.name}</span>
            <span style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>ID: {sub.id}</span>
            <ToggleSwitch isActive={localActive} onToggle={handleStatusToggle} loading={toggling} />
          </div>
        </div>
        {loaded && (
          <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: LEVEL_CONFIG.item.bg, color: LEVEL_CONFIG.item.color }}>
            <i className={`bi ${LEVEL_CONFIG.item.icon}`} style={{ fontSize: '10px' }}></i>{items.length}
          </span>
        )}
        <Button size="sm" variant="link" className="p-0 px-1" style={{ color: 'var(--theme-primary, #0891b2)', fontSize: '13px' }} title="Edit" onClick={e => { e.stopPropagation(); onEditSub(sub, refreshItems); }}><i className="bi bi-pencil"></i></Button>
        <Button size="sm" variant="link" className="p-0 px-1" style={{ color: primaryColor, fontSize: '13px' }} title="Add Item" onClick={e => { e.stopPropagation(); onAddItem(sub, addons, refreshItems); }}><i className="bi bi-plus-circle"></i></Button>
      </div>

      {/* Items Table */}
      <AnimatedCollapse open={isExpanded}>
        <div style={{ borderTop: '1px solid #e2e8f0' }}>
          {loading ? (
            <div className="text-center py-3"><Spinner size="sm" style={{ color: primaryColor }} /><div className="text-muted mt-1" style={{ fontSize: '12px' }}>Loading items...</div></div>
          ) : items.length === 0 && loaded ? (
            <div className="text-center py-3" style={{ color: '#94a3b8' }}>
              <i className="bi bi-cup-hot" style={{ fontSize: '24px', opacity: 0.4 }}></i>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>No items in this subcategory</div>
            </div>
          ) : items.length > 0 ? (
            <Table hover responsive size="sm" className="mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Item', 'Price', 'Type', 'Addon', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600, padding: '7px 12px', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} style={{ transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 30, height: 30, borderRadius: '8px', background: LEVEL_CONFIG.item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: LEVEL_CONFIG.item.color, flexShrink: 0, overflow: 'hidden' }}>
                          {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : (item.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</div>
                          {item.preparationMinutes && <div style={{ fontSize: '10px', color: '#94a3b8' }}><i className="bi bi-clock me-1"></i>{item.preparationMinutes} min</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: primaryColor }}>
                      &#8377;{parseFloat(item.price || 0).toFixed(2)}
                      {item.mrp && parseFloat(item.mrp) > parseFloat(item.price) && (
                        <div style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 400 }}>&#8377;{parseFloat(item.mrp).toFixed(2)}</div>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.3px', background: item.dietaryType ? '#10b98118' : '#ef444418', color: item.dietaryType ? '#059669' : '#dc2626', border: `1px solid ${item.dietaryType ? '#10b98130' : '#ef444430'}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
                        {item.dietaryType ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {item.addonsId ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: LEVEL_CONFIG.addon.bg, color: LEVEL_CONFIG.addon.color, border: '1px solid #ede9fe' }}>
                          <i className="bi bi-puzzle me-1" style={{ fontSize: '9px' }}></i>{item.addonsId.name}
                        </span>
                      ) : <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <ToggleSwitch isActive={item.isActive} onToggle={(newStatus) => handleItemStatusToggle(item, newStatus)} />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <Button size="sm" variant="link" className="p-0 px-1" style={{ color: 'var(--theme-primary, #0891b2)', fontSize: '13px' }} title="Edit" onClick={() => onEditItem(item, sub, addons, refreshItems)}>
                        <i className="bi bi-pencil"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : null}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== CATEGORY ACCORDION ITEM ====================
const CategoryAccordionItem = ({ category, isExpanded, onToggle, onEditCategory, onEditSub, onAddSub, onEditItem, onAddItem, primaryColor, onCategoryStatusChange }) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState(null);
  const [localActive, setLocalActive] = useState(category.isActive);
  const [toggling, setToggling] = useState(false);

  useEffect(() => { setLocalActive(category.isActive); }, [category.isActive]);

  const handleStatusToggle = async (newStatus) => {
    setToggling(true);
    const fd = new FormData();
    fd.append('payload', JSON.stringify({ id: category.id, isActive: newStatus, name: category.name, priority: category.priority }));
    const result = await ApiPostFormData('/api/branch/menu_category/update_Category', fd);
    if (result.success) {
      setLocalActive(newStatus);
      toast.success(`${category.name} ${newStatus ? 'activated' : 'deactivated'}`);
      if (!newStatus && loaded) {
        // Cascade: refresh subcategories to reflect deactivation
        setLoaded(false);
        fetchSubcategoriesForce();
      }
      if (onCategoryStatusChange) onCategoryStatusChange();
    } else {
      toast.error(result.fail || 'Failed to update status');
    }
    setToggling(false);
  };

  const fetchSubcategoriesForce = async () => {
    setLoading(true);
    const result = await ApiGet('/api/branch/menu_subcategory/filter', { pageNumber: 0, pageSize: 500 });
    if (result.success) {
      const all = result.success.data.data.records || [];
      setSubcategories(all.filter(s => s.menuCategoryId?.id === category.id).sort((a, b) => (a.priority || 0) - (b.priority || 0)));
    }
    setLoaded(true);
    setLoading(false);
  };

  const fetchSubcategories = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    const result = await ApiGet('/api/branch/menu_subcategory/filter', { pageNumber: 0, pageSize: 500 });
    if (result.success) {
      const all = result.success.data.data.records || [];
      setSubcategories(all.filter(s => s.menuCategoryId?.id === category.id).sort((a, b) => (a.priority || 0) - (b.priority || 0)));
    } else {
      toast.error('Failed to load subcategories');
    }
    setLoaded(true);
    setLoading(false);
  }, [category.id, loaded]);

  const handleToggle = () => {
    if (!isExpanded) fetchSubcategories();
    onToggle(category.id);
  };

  const refreshSubcategories = async () => {
    setLoaded(false);
    setLoading(true);
    const result = await ApiGet('/api/branch/menu_subcategory/filter', { pageNumber: 0, pageSize: 500 });
    if (result.success) {
      const all = result.success.data.data.records || [];
      setSubcategories(all.filter(s => s.menuCategoryId?.id === category.id).sort((a, b) => (a.priority || 0) - (b.priority || 0)));
    }
    setLoaded(true);
    setLoading(false);
  };

  const cc = LEVEL_CONFIG.category;

  return (
    <div style={{ marginBottom: '8px', borderRadius: '12px', border: isExpanded ? `1.5px solid ${primaryColor}` : '1px solid #e2e8f0', background: '#fff', transition: 'all 0.25s ease', boxShadow: isExpanded ? `0 4px 20px ${primaryColor}18` : '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Category Header Row */}
      <div onClick={handleToggle} className="category-header-row" style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderRadius: isExpanded ? '12px 12px 0 0' : '12px', background: isExpanded ? 'linear-gradient(135deg, #f0fdfa, #eff6ff)' : '#fff', transition: 'background 0.25s ease', gap: '16px', userSelect: 'none' }}>
        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} style={{ fontSize: '14px', color: isExpanded ? primaryColor : '#94a3b8', minWidth: '16px', transition: 'color 0.25s ease' }}></i>

        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: '10px', background: isExpanded ? primaryColor : cc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: isExpanded ? '#fff' : cc.color, transition: 'all 0.25s ease', flexShrink: 0, overflow: 'hidden' }}>
          {category.iconUrl ? <img src={category.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : (category.name || '?').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{category.name}</span>
            <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '1px 8px', borderRadius: '4px' }}>ID: {category.id}</span>
            <ToggleSwitch isActive={localActive} onToggle={handleStatusToggle} loading={toggling} />
          </div>
          <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: '12px', color: '#64748b' }}>
            {category.description && <span style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category.description}</span>}
            {category.priority > 0 && <span><i className="bi bi-sort-numeric-up me-1"></i>Priority: {category.priority}</span>}
          </div>
        </div>

        {/* Count badges */}
        <div className="d-none d-md-flex align-items-center gap-2">
          {loaded && (
            <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: LEVEL_CONFIG.subcategory.bg, color: LEVEL_CONFIG.subcategory.color }}>
              <i className={`bi ${LEVEL_CONFIG.subcategory.icon}`} style={{ fontSize: '10px' }}></i>{subcategories.length}
            </span>
          )}
        </div>

        {/* Total count */}
        {loaded && (
          <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px', textAlign: 'center', minWidth: '48px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{subcategories.length}</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subs</div>
          </div>
        )}

        {/* Action buttons */}
        <Button size="sm" variant="link" className="p-0 px-1" style={{ color: 'var(--theme-primary, #0891b2)', fontSize: '14px' }} title="Edit category" onClick={e => { e.stopPropagation(); onEditCategory(category, refreshSubcategories); }}><i className="bi bi-pencil"></i></Button>
        <Button size="sm" variant="outline-primary" className="d-flex align-items-center gap-1 rounded-pill" style={{ fontSize: '12px', borderColor: primaryColor, color: primaryColor, whiteSpace: 'nowrap' }} onClick={e => { e.stopPropagation(); onAddSub(category, refreshSubcategories); }} title="Add subcategory">
          <i className="bi bi-plus-lg"></i><span className="d-none d-lg-inline">Sub</span>
        </Button>
      </div>

      {/* Expanded: Subcategories */}
      <AnimatedCollapse open={isExpanded}>
        <div style={{ borderTop: '1px solid #e2e8f0' }}>
          {loading ? (
            <div className="text-center py-4"><Spinner size="sm" style={{ color: primaryColor }} /><div className="text-muted mt-2" style={{ fontSize: '12px' }}>Loading subcategories...</div></div>
          ) : subcategories.length === 0 && loaded ? (
            <div className="text-center py-4" style={{ color: '#94a3b8' }}>
              <i className="bi bi-collection" style={{ fontSize: '28px', opacity: 0.4 }}></i>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>No subcategories yet</div>
            </div>
          ) : (
            <div style={{ padding: '8px 8px 8px 0' }}>
              {subcategories.map(sub => (
                <SubcategoryAccordionItem
                  key={sub.id}
                  sub={sub}
                  isExpanded={expandedSubId === sub.id}
                  onToggle={(id) => setExpandedSubId(prev => prev === id ? null : id)}
                  onEditSub={(s, refreshFn) => onEditSub(s, refreshFn || refreshSubcategories)}
                  onEditItem={onEditItem}
                  onAddItem={onAddItem}
                  primaryColor={primaryColor}
                  onStatusChange={fetchSubcategoriesForce}
                />
              ))}
            </div>
          )}
        </div>
      </AnimatedCollapse>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const MenuTree = () => {
  const { primaryColor } = useTheme();
  const pc = primaryColor || '#0891b2';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedCatId, setExpandedCatId] = useState(null);

  // Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [subCategoryId, setSubCategoryId] = useState(null);
  const [subRefreshFn, setSubRefreshFn] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemCategoryId, setItemCategoryId] = useState(null);
  const [itemSubcategoryId, setItemSubcategoryId] = useState(null);
  const [itemAddons, setItemAddons] = useState([]);
  const [itemRefreshFn, setItemRefreshFn] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const result = await ApiGet('/api/branch/menu_category/filter', { pageNumber: 0, pageSize: 200 });
    if (result.success) {
      setCategories(result.success.data.data.records || []);
    } else {
      toast.error(result.fail || 'Failed to load categories');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Filter categories
  const filtered = debouncedSearch
    ? categories.filter(c => (c.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) || (c.description || '').toLowerCase().includes(debouncedSearch.toLowerCase()))
    : categories;

  // Modal handlers
  const handleEditCategory = (cat) => { setEditCat(cat); setShowCatModal(true); };
  const handleAddCategory = () => { setEditCat(null); setShowCatModal(true); };

  const handleAddSub = (category, refreshFn) => {
    setEditSub(null);
    setSubCategoryId(category.id);
    setSubRefreshFn(() => refreshFn);
    setShowSubModal(true);
  };
  const handleEditSub = (sub, refreshFn) => {
    setEditSub(sub);
    setSubCategoryId(sub.menuCategoryId?.id);
    setSubRefreshFn(refreshFn ? () => refreshFn : null);
    setShowSubModal(true);
  };

  const handleAddItem = (sub, addons, refreshFn) => {
    setEditItem(null);
    setItemCategoryId(sub.menuCategoryId?.id);
    setItemSubcategoryId(sub.id);
    setItemAddons(addons);
    setItemRefreshFn(() => refreshFn);
    setShowItemModal(true);
  };
  const handleEditItem = (item, sub, addons, refreshFn) => {
    setEditItem(item);
    setItemCategoryId(sub.menuCategoryId?.id);
    setItemSubcategoryId(sub.id);
    setItemAddons(addons);
    setItemRefreshFn(() => refreshFn);
    setShowItemModal(true);
  };

  return (
    <Container fluid className="py-4">
      {/* Header Banner */}
      <div className="mb-4 p-4 text-white" style={{ borderRadius: '16px', background: pc }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1"><i className="bi bi-diagram-3 me-2"></i>Menu Tree</h4>
            <p className="mb-0 opacity-75" style={{ fontSize: '14px' }}>Click on any category to expand and view subcategories & items</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{categories.length}</div>
              <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categories</div>
            </div>
            <Button variant="light" className="d-flex align-items-center gap-1 rounded-pill fw-semibold" style={{ fontSize: '13px' }} onClick={handleAddCategory}>
              <i className="bi bi-plus-lg"></i>Add Category
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <Card.Body className="py-2 px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-search text-muted"></i>
            <Form.Control type="text" placeholder="Search categories by name or description..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', boxShadow: 'none', fontSize: '14px' }} />
            {search && <Button variant="link" className="p-0 text-muted" onClick={() => setSearch('')} style={{ fontSize: '18px' }}><i className="bi bi-x-circle"></i></Button>}
          </div>
        </Card.Body>
      </Card>

      {/* Category Accordion Tree */}
      {loading ? (
        <div className="text-center py-5"><Spinner style={{ color: pc }} /><div className="text-muted mt-2" style={{ fontSize: '13px' }}>Loading categories...</div></div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Body className="text-center py-5">
            <i className="bi bi-grid-3x3-gap" style={{ fontSize: 56, color: '#cbd5e1' }}></i>
            <div className="mt-3" style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>No categories found</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{search ? 'Try adjusting your search' : 'Create your first menu category'}</div>
            {!search && <Button className="mt-3" style={{ background: pc, borderColor: pc }} onClick={handleAddCategory}><i className="bi bi-plus-lg me-2"></i>Add Category</Button>}
          </Card.Body>
        </Card>
      ) : (
        <div>
          {filtered.map(cat => (
            <CategoryAccordionItem
              key={cat.id}
              category={cat}
              isExpanded={expandedCatId === cat.id}
              onToggle={(id) => setExpandedCatId(prev => prev === id ? null : id)}
              onEditCategory={handleEditCategory}
              onEditSub={handleEditSub}
              onAddSub={handleAddSub}
              onEditItem={handleEditItem}
              onAddItem={handleAddItem}
              primaryColor={pc}
              onCategoryStatusChange={fetchCategories}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryModal show={showCatModal} onHide={() => setShowCatModal(false)} category={editCat} onSave={fetchCategories} primaryColor={pc} />
      <SubcategoryModal show={showSubModal} onHide={() => setShowSubModal(false)} subcategory={editSub} categoryId={subCategoryId} onSave={() => { if (subRefreshFn) subRefreshFn(); }} primaryColor={pc} />
      <ItemModal show={showItemModal} onHide={() => setShowItemModal(false)} item={editItem} categoryId={itemCategoryId} subcategoryId={itemSubcategoryId} addons={itemAddons} onSave={() => { if (itemRefreshFn) itemRefreshFn(); }} primaryColor={pc} />

      {/* Hover styles */}
      <style>{`
        .category-header-row:hover { background: #f8fafc !important; }
        .subcategory-header-row:hover { background: #f8fafc !important; }

        /* ===== Redesigned Modal Styles ===== */
        .mtree-modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04) !important;
          overflow: hidden;
        }
        .mtree-modal-content .modal-header { display: none !important; }
        .mtree-modal-content .modal-body { padding: 0 !important; }
        .mtree-modal-content .modal-footer { display: none !important; }

        .mtree-close-btn:hover { background: #e2e8f0 !important; color: #334155 !important; }
        .mtree-cancel-btn:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #334155 !important; }
        .mtree-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px color-mix(in srgb, var(--theme-primary, #0891b2) 40%, transparent) !important; }
        .mtree-submit-btn:active { transform: translateY(0); }
        .mtree-submit-btn:disabled { cursor: not-allowed; transform: none !important; }

        .mtree-input {
          outline: none;
          font-family: inherit;
        }
        .mtree-input:focus {
          border-color: var(--theme-primary, #0891b2) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary, #0891b2) 12%, transparent) !important;
          background: #fff !important;
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
