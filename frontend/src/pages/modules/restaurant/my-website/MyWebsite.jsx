import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Card, Image, Alert, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPostFormData } from '../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../contexts/ThemeContext';
import { server_api } from '../../../../utils/constants';
import '../../../../styles/tables.css';

// ─── Helpers ────────────────────────────────────────────────────────────────────
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;
  const baseUrl = server_api();
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

const genId = () => Math.random().toString(36).slice(2, 10);

// ─── Section Templates ──────────────────────────────────────────────────────────
const SECTION_TEMPLATES = {
  heroSlider: {
    type: 'heroSlider', label: 'Hero Slider', icon: 'bi-images',
    defaults: { autoPlay: true, interval: 5000, slides: [{ title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '' }] }
  },
  heritage: {
    type: 'heritage', label: 'Our Heritage / Showcase', icon: 'bi-columns-gap',
    defaults: { tag: 'FLAVORS FOR ROYALTY', heading: 'We Offer Top Notch', description: '', cards: [{ image: '', title: '', subtitle: '', link: '' }, { image: '', title: '', subtitle: '', link: '' }, { image: '', title: '', subtitle: '', link: '' }] }
  },
  ourStory: {
    type: 'ourStory', label: 'Our Story', icon: 'bi-book',
    defaults: { eyebrow: 'OUR STORY', heading: 'Every Flavor Tells a Story', body: '', image: '', sinceYear: '2015', phone: '', stats: [{ value: '10', suffix: '+', label: 'Years of Excellence' }], features: [{ icon: 'bi bi-check2-circle', text: '' }] }
  },
  tonightSpecial: {
    type: 'tonightSpecial', label: 'Tonight Special', icon: 'bi-star',
    defaults: { heading: "Tonight's Special", subtitle: 'Chef ke aaj ke special dishes' }
  },
  trendingItems: {
    type: 'trendingItems', label: 'Trending Items', icon: 'bi-fire',
    defaults: { heading: 'Trending Now', subtitle: 'Sabse zyada order hone wale items' }
  },
  menuCategories: {
    type: 'menuCategories', label: 'Menu Categories', icon: 'bi-grid-3x3-gap',
    defaults: { heading: 'Our Menu' }
  },
  galleryPreview: {
    type: 'galleryPreview', label: 'Gallery Preview', icon: 'bi-image',
    defaults: { heading: 'Our Gallery', subtitle: '', maxItems: 8 }
  },
  whyChooseUs: {
    type: 'whyChooseUs', label: 'Why Choose Us / Our Strength', icon: 'bi-trophy',
    defaults: { heading: 'Our Strength', subtitle: 'WHY CHOOSE US', items: [{ icon: 'bi bi-shield-check', title: 'Hygienic Food', description: '' }, { icon: 'bi bi-tree', title: 'Fresh Environment', description: '' }, { icon: 'bi bi-person-badge', title: 'Skilled Chefs', description: '' }, { icon: 'bi bi-calendar-event', title: 'Event & Party', description: '' }] }
  },
  onlineReservation: {
    type: 'onlineReservation', label: 'Online Reservation', icon: 'bi-calendar-check',
    defaults: { heading: 'Online Reservation', subtitle: 'RESERVATION', bookingInfo: '' }
  },
  testimonials: {
    type: 'testimonials', label: 'Testimonials', icon: 'bi-chat-quote',
    defaults: { heading: 'What Our Guests Say', items: [] }
  },
  footer: {
    type: 'footer', label: 'Footer', icon: 'bi-layout-text-sidebar-reverse',
    defaults: { copyrightText: '', showSocial: true, columns: [{ title: 'Quick Links', links: [{ label: 'Home', url: '/' }] }] }
  },
  header: {
    type: 'header', label: 'Header / Navigation', icon: 'bi-layout-text-window-reverse',
    defaults: { logoPosition: 'left', sticky: true, items: [{ label: 'Home', link: '/', visible: true }, { label: 'Menu', link: '/menu', visible: true }, { label: 'About', link: '/about', visible: true }, { label: 'Contact', link: '/contact', visible: true }] }
  },
  textBlock: {
    type: 'textBlock', label: 'Text Block', icon: 'bi-file-text',
    defaults: { heading: '', content: '' }
  },
  imageBanner: {
    type: 'imageBanner', label: 'Image Banner', icon: 'bi-card-image',
    defaults: { image: '', overlayText: '' }
  },
  statsCounters: {
    type: 'statsCounters', label: 'Stats / Counters', icon: 'bi-123',
    defaults: { items: [{ icon: 'bi bi-trophy', label: '', value: '', suffix: '+' }] }
  },
  featuresList: {
    type: 'featuresList', label: 'Features List', icon: 'bi-list-check',
    defaults: { items: [{ icon: 'bi bi-check-circle', title: '', description: '' }] }
  },
  contactInfo: {
    type: 'contactInfo', label: 'Contact Info', icon: 'bi-telephone',
    defaults: { address: '', phone: '', email: '', hours: '' }
  },
  team: {
    type: 'team', label: 'Team', icon: 'bi-people',
    defaults: { members: [{ name: '', role: '', image: '', bio: '' }] }
  }
};

// ─── Default Page Structures ────────────────────────────────────────────────────
const DEFAULT_PAGES = {
  home: {
    label: 'Home', slug: 'home', isDefault: true,
    sections: [
      { id: genId(), type: 'header', enabled: true, data: { ...SECTION_TEMPLATES.header.defaults } },
      { id: genId(), type: 'heroSlider', enabled: true, data: { ...SECTION_TEMPLATES.heroSlider.defaults } },
      { id: genId(), type: 'heritage', enabled: true, data: { ...SECTION_TEMPLATES.heritage.defaults } },
      { id: genId(), type: 'ourStory', enabled: true, data: { ...SECTION_TEMPLATES.ourStory.defaults } },
      { id: genId(), type: 'tonightSpecial', enabled: true, data: { ...SECTION_TEMPLATES.tonightSpecial.defaults } },
      { id: genId(), type: 'trendingItems', enabled: true, data: { ...SECTION_TEMPLATES.trendingItems.defaults } },
      { id: genId(), type: 'menuCategories', enabled: true, data: { ...SECTION_TEMPLATES.menuCategories.defaults } },
      { id: genId(), type: 'galleryPreview', enabled: true, data: { ...SECTION_TEMPLATES.galleryPreview.defaults } },
      { id: genId(), type: 'whyChooseUs', enabled: true, data: { ...SECTION_TEMPLATES.whyChooseUs.defaults } },
      { id: genId(), type: 'onlineReservation', enabled: true, data: { ...SECTION_TEMPLATES.onlineReservation.defaults } },
      { id: genId(), type: 'testimonials', enabled: true, data: { ...SECTION_TEMPLATES.testimonials.defaults } },
      { id: genId(), type: 'footer', enabled: true, data: { ...SECTION_TEMPLATES.footer.defaults } },
    ]
  },
  about: {
    label: 'About', slug: 'about', isDefault: true,
    sections: [
      { id: genId(), type: 'imageBanner', enabled: true, data: { image: '', overlayText: 'About Us' } },
      { id: genId(), type: 'textBlock', enabled: true, data: { heading: 'About Us', content: '' } },
      { id: genId(), type: 'team', enabled: true, data: { ...SECTION_TEMPLATES.team.defaults } },
      { id: genId(), type: 'whyChooseUs', enabled: true, data: { ...SECTION_TEMPLATES.whyChooseUs.defaults } },
      { id: genId(), type: 'statsCounters', enabled: true, data: { items: [] } },
      { id: genId(), type: 'featuresList', enabled: true, data: { items: [] } },
    ]
  },
  contact: {
    label: 'Contact', slug: 'contact', isDefault: true,
    sections: [
      { id: genId(), type: 'imageBanner', enabled: true, data: { image: '', overlayText: 'Contact Us' } },
      { id: genId(), type: 'contactInfo', enabled: true, data: { ...SECTION_TEMPLATES.contactInfo.defaults } },
      { id: genId(), type: 'textBlock', enabled: true, data: { heading: 'Get In Touch', content: '' } },
    ]
  },
  gallery: {
    label: 'Gallery', slug: 'gallery', isDefault: true,
    sections: [
      { id: genId(), type: 'imageBanner', enabled: true, data: { image: '', overlayText: 'Gallery' } },
      { id: genId(), type: 'galleryPreview', enabled: true, data: { heading: 'Our Gallery', subtitle: '', maxItems: 20 } },
    ]
  }
};

// ─── Image Upload Sub-Component ─────────────────────────────────────────────────
const ImageUploadField = ({ label, value, onChange, uploadType }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType || 'section_image');
      const result = await ApiPostFormData('/api/admin/business_setting/upload-image', formData);
      if (result.success) {
        const url = result.success.data.data?.url || result.success.data.data;
        onChange(url);
        toast.success('Image uploaded!');
      } else {
        toast.error('Upload failed');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Form.Group className="mb-2">
      {label && <Form.Label className="small fw-semibold">{label}</Form.Label>}
      <div className="d-flex gap-2 align-items-center mb-1">
        <Button size="sm" as="label" style={{ cursor: 'pointer', border: '1px solid #90959a', color: '#ffffff', backgroundColor: '#495057', fontWeight: 500, padding: '4px 12px' }}>
          <i className="bi bi-upload me-1"></i> Upload
          <input type="file" accept="image/*" hidden onChange={handleUpload} />
        </Button>
        {uploading && <Spinner size="sm" />}
      </div>
      <Form.Control size="sm" placeholder="Ya paste karo image URL yaha"
        value={value || ''} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <div className="mt-1">
          <Image src={resolveImageUrl(value)} alt="Preview"
            style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'cover', borderRadius: '6px' }} />
        </div>
      )}
    </Form.Group>
  );
};

// ─── Section Editor Components ──────────────────────────────────────────────────

const HeroSliderEditor = ({ data, onChange }) => {
  const updateSlide = (idx, field, val) => {
    const slides = [...(data.slides || [])];
    slides[idx] = { ...slides[idx], [field]: val };
    onChange({ ...data, slides });
  };
  const removeSlide = (idx) => onChange({ ...data, slides: data.slides.filter((_, i) => i !== idx) });
  const addSlide = () => onChange({ ...data, slides: [...(data.slides || []), { title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '' }] });

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Website ke sabse top pe — bada full-width slider jisme image + text + button dikhta hai.
      </Alert>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Check type="switch" label="Auto Play (slides automatic change ho)"
            checked={data.autoPlay !== false}
            onChange={(e) => onChange({ ...data, autoPlay: e.target.checked })} />
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label className="small">Interval (ms) — kitni der me next slide</Form.Label>
            <Form.Control size="sm" type="number" value={data.interval || 5000}
              onChange={(e) => onChange({ ...data, interval: parseInt(e.target.value) || 5000 })} />
          </Form.Group>
        </Col>
      </Row>
      <h6>Slides</h6>
      {(data.slides || []).map((slide, idx) => (
        <Card key={idx} className="mb-2 p-2 bg-light">
          <Row>
            <Col md={6}>
              <Form.Group className="mb-1">
                <Form.Label className="small"><strong>Title</strong> — Bada heading text</Form.Label>
                <Form.Control size="sm" value={slide.title || ''} placeholder="e.g. Where Every Meal Becomes A Memory"
                  onChange={(e) => updateSlide(idx, 'title', e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label className="small"><strong>Subtitle</strong> — Title ke upar chota text</Form.Label>
                <Form.Control size="sm" value={slide.subtitle || ''} placeholder="e.g. WELCOME TO OUR RESTAURANT"
                  onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label className="small"><strong>CTA Button Text</strong></Form.Label>
                <Form.Control size="sm" value={slide.ctaText || ''} placeholder="e.g. View Menu"
                  onChange={(e) => updateSlide(idx, 'ctaText', e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-1">
                <Form.Label className="small"><strong>CTA Link</strong></Form.Label>
                <Form.Control size="sm" value={slide.ctaLink || ''} placeholder="/menu"
                  onChange={(e) => updateSlide(idx, 'ctaLink', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <ImageUploadField label="Background Image" value={slide.imageUrl}
                onChange={(url) => updateSlide(idx, 'imageUrl', url)} uploadType={`hero_slide_${idx}`} />
            </Col>
          </Row>
          <Button variant="outline-danger" size="sm" className="mt-1" onClick={() => removeSlide(idx)}>
            <i className="bi bi-trash me-1"></i>Remove Slide
          </Button>
        </Card>
      ))}
      <Button variant="outline-primary" size="sm" onClick={addSlide} style={{ border: '1px solid #7c8db5', color: '#a8b8d8' }}>
        <i className="bi bi-plus me-1"></i>Add Slide
      </Button>
    </div>
  );
};

const OurStoryEditor = ({ data, onChange }) => {
  const update = (field, val) => onChange({ ...data, [field]: val });
  const updateStat = (idx, field, val) => {
    const stats = [...(data.stats || [])];
    stats[idx] = { ...stats[idx], [field]: val };
    onChange({ ...data, stats });
  };
  const updateFeature = (idx, field, val) => {
    const features = [...(data.features || [])];
    features[idx] = { ...features[idx], [field]: val };
    onChange({ ...data, features });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Homepage pe "Our Story" section — left side text + stats, right side ek badi image.
      </Alert>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-2">
            <Form.Label className="small">Eyebrow Text (chota uppercase text)</Form.Label>
            <Form.Control size="sm" value={data.eyebrow || ''} placeholder="OUR STORY"
              onChange={(e) => update('eyebrow', e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small">Main Heading</Form.Label>
            <Form.Control size="sm" value={data.heading || ''} placeholder="Every Flavor Tells a Story"
              onChange={(e) => update('heading', e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small">Body Paragraph</Form.Label>
            <Form.Control as="textarea" rows={3} size="sm" value={data.body || ''}
              placeholder="Apne restaurant ki kahani likho..."
              onChange={(e) => update('body', e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small">Since Year</Form.Label>
            <Form.Control size="sm" value={data.sinceYear || ''} placeholder="2015"
              onChange={(e) => update('sinceYear', e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small">Phone (Book Through Call)</Form.Label>
            <Form.Control size="sm" value={data.phone || ''} placeholder="+91 98765 43210"
              onChange={(e) => update('phone', e.target.value)} />
          </Form.Group>
        </Col>
        <Col md={6}>
          <ImageUploadField label="Section Image (right side)" value={data.image}
            onChange={(url) => update('image', url)} uploadType="our_story" />
        </Col>
      </Row>

      <h6 className="mt-3">Stats Counters</h6>
      <p className="text-muted small">Jaise "10+ Years of Excellence", "50+ Signature Dishes"</p>
      {(data.stats || []).map((stat, idx) => (
        <Row key={idx} className="mb-1 align-items-center">
          <Col xs={3}><Form.Control size="sm" placeholder="Value (10)" value={stat.value || ''} onChange={(e) => updateStat(idx, 'value', e.target.value)} /></Col>
          <Col xs={2}><Form.Control size="sm" placeholder="+" value={stat.suffix || ''} onChange={(e) => updateStat(idx, 'suffix', e.target.value)} /></Col>
          <Col xs={5}><Form.Control size="sm" placeholder="Label (Years of Excellence)" value={stat.label || ''} onChange={(e) => updateStat(idx, 'label', e.target.value)} /></Col>
          <Col xs={2}><Button variant="outline-danger" size="sm" onClick={() => onChange({ ...data, stats: data.stats.filter((_, i) => i !== idx) })}><i className="bi bi-x"></i></Button></Col>
        </Row>
      ))}
      <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }} onClick={() => onChange({ ...data, stats: [...(data.stats || []), { value: '', suffix: '+', label: '' }] })}>+ Add Stat</Button>

      <h6 className="mt-3">Feature Bullets</h6>
      {(data.features || []).map((feat, idx) => (
        <Row key={idx} className="mb-1 align-items-center">
          <Col xs={3}><Form.Control size="sm" placeholder="bi bi-check2-circle" value={feat.icon || ''} onChange={(e) => updateFeature(idx, 'icon', e.target.value)} /></Col>
          <Col xs={7}><Form.Control size="sm" placeholder="Feature text" value={feat.text || ''} onChange={(e) => updateFeature(idx, 'text', e.target.value)} /></Col>
          <Col xs={2}><Button variant="outline-danger" size="sm" onClick={() => onChange({ ...data, features: data.features.filter((_, i) => i !== idx) })}><i className="bi bi-x"></i></Button></Col>
        </Row>
      ))}
      <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }} onClick={() => onChange({ ...data, features: [...(data.features || []), { icon: 'bi bi-check2-circle', text: '' }] })}>+ Add Feature</Button>
    </div>
  );
};

const HeritageEditor = ({ data, onChange }) => {
  const update = (field, val) => onChange({ ...data, [field]: val });
  const updateCard = (idx, field, val) => {
    const cards = [...(data.cards || [])];
    cards[idx] = { ...cards[idx], [field]: val };
    onChange({ ...data, cards });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Homepage pe "We Offer Top Notch" wala 3-card showcase section.
      </Alert>
      <Form.Group className="mb-2">
        <Form.Label className="small">Tag Text (chota uppercase)</Form.Label>
        <Form.Control size="sm" value={data.tag || ''} placeholder="FLAVORS FOR ROYALTY"
          onChange={(e) => update('tag', e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label className="small">Heading</Form.Label>
        <Form.Control size="sm" value={data.heading || ''} placeholder="We Offer Top Notch"
          onChange={(e) => update('heading', e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label className="small">Description</Form.Label>
        <Form.Control as="textarea" rows={2} size="sm" value={data.description || ''}
          onChange={(e) => update('description', e.target.value)} />
      </Form.Group>
      <h6 className="mt-3">Showcase Cards (3 cards)</h6>
      {(data.cards || []).map((card, idx) => (
        <Card key={idx} className="mb-2 p-2 bg-light">
          <p className="small fw-bold mb-1">Card {idx + 1}</p>
          <ImageUploadField label="Card Image" value={card.image}
            onChange={(url) => updateCard(idx, 'image', url)} uploadType={`heritage_card_${idx}`} />
          <Form.Control size="sm" className="mb-1" placeholder="Title" value={card.title || ''}
            onChange={(e) => updateCard(idx, 'title', e.target.value)} />
          <Form.Control size="sm" className="mb-1" placeholder="Subtitle" value={card.subtitle || ''}
            onChange={(e) => updateCard(idx, 'subtitle', e.target.value)} />
          <Form.Control size="sm" placeholder="Link (e.g. /menu)" value={card.link || ''}
            onChange={(e) => updateCard(idx, 'link', e.target.value)} />
        </Card>
      ))}
      {(data.cards || []).length < 3 && (
        <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }}
          onClick={() => onChange({ ...data, cards: [...(data.cards || []), { image: '', title: '', subtitle: '', link: '' }] })}>
          + Add Card
        </Button>
      )}
    </div>
  );
};

const SimpleHeadingEditor = ({ data, onChange, description }) => (
  <div>
    {description && (
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>{description}
      </Alert>
    )}
    <Form.Group className="mb-2">
      <Form.Label className="small">Heading</Form.Label>
      <Form.Control size="sm" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
    </Form.Group>
    {data.subtitle !== undefined && (
      <Form.Group className="mb-2">
        <Form.Label className="small">Subtitle</Form.Label>
        <Form.Control size="sm" value={data.subtitle || ''} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
      </Form.Group>
    )}
  </div>
);

const WhyChooseUsEditor = ({ data, onChange }) => {
  const updateItem = (idx, field, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...data, items });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> "Why Choose Us" / "Our Strength" section — 4 icons with titles.
      </Alert>
      <Form.Group className="mb-2">
        <Form.Label className="small">Heading</Form.Label>
        <Form.Control size="sm" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label className="small">Subtitle / Eyebrow</Form.Label>
        <Form.Control size="sm" value={data.subtitle || ''} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
      </Form.Group>
      <h6>Items (icon + title + description)</h6>
      {(data.items || []).map((item, idx) => (
        <Row key={idx} className="mb-2 align-items-start">
          <Col xs={2}><Form.Control size="sm" placeholder="bi bi-shield-check" value={item.icon || ''} onChange={(e) => updateItem(idx, 'icon', e.target.value)} /></Col>
          <Col xs={3}><Form.Control size="sm" placeholder="Title" value={item.title || ''} onChange={(e) => updateItem(idx, 'title', e.target.value)} /></Col>
          <Col xs={5}><Form.Control size="sm" placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} /></Col>
          <Col xs={2}><Button variant="outline-danger" size="sm" onClick={() => onChange({ ...data, items: data.items.filter((_, i) => i !== idx) })}><i className="bi bi-trash"></i></Button></Col>
        </Row>
      ))}
      <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }}
        onClick={() => onChange({ ...data, items: [...(data.items || []), { icon: 'bi bi-star', title: '', description: '' }] })}>
        + Add Item
      </Button>
    </div>
  );
};

const OnlineReservationEditor = ({ data, onChange }) => (
  <div>
    <Alert variant="info" className="py-2 px-3 small">
      <i className="bi bi-info-circle me-1"></i>
      <strong>Ye kaha dikhega:</strong> Homepage pe reservation form section — background image ke saath booking form.
    </Alert>
    <Form.Group className="mb-2">
      <Form.Label className="small">Heading</Form.Label>
      <Form.Control size="sm" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Subtitle</Form.Label>
      <Form.Control size="sm" value={data.subtitle || ''} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Booking Info Text</Form.Label>
      <Form.Control as="textarea" rows={2} size="sm" value={data.bookingInfo || ''}
        placeholder="Extra info about reservation..."
        onChange={(e) => onChange({ ...data, bookingInfo: e.target.value })} />
    </Form.Group>
  </div>
);

const TestimonialsEditor = ({ data, onChange }) => {
  const updateItem = (idx, field, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...data, items });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Customer reviews slider — star ratings, photos, review text ke saath.
      </Alert>
      <Form.Group className="mb-2">
        <Form.Label className="small">Section Heading</Form.Label>
        <Form.Control size="sm" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
      </Form.Group>
      {(data.items || []).map((item, idx) => (
        <Card key={idx} className="mb-2 p-2 bg-light">
          <Row>
            <Col md={4}>
              <Form.Control size="sm" className="mb-1" placeholder="Customer Name" value={item.name || ''}
                onChange={(e) => updateItem(idx, 'name', e.target.value)} />
              <Form.Control size="sm" className="mb-1" placeholder="Designation (e.g. Food Lover)" value={item.designation || ''}
                onChange={(e) => updateItem(idx, 'designation', e.target.value)} />
              <Form.Group className="mb-1">
                <Form.Label className="small">Rating (1-5)</Form.Label>
                <Form.Control size="sm" type="number" min={1} max={5} value={item.rating || 5}
                  onChange={(e) => updateItem(idx, 'rating', parseInt(e.target.value) || 5)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Control as="textarea" rows={3} size="sm" placeholder="Review text..."
                value={item.text || ''} onChange={(e) => updateItem(idx, 'text', e.target.value)} />
            </Col>
            <Col md={4}>
              <ImageUploadField label="Avatar" value={item.avatarUrl}
                onChange={(url) => updateItem(idx, 'avatarUrl', url)} uploadType={`testimonial_${idx}`} />
            </Col>
          </Row>
          <Button variant="outline-danger" size="sm" className="mt-1"
            onClick={() => onChange({ ...data, items: data.items.filter((_, i) => i !== idx) })}>
            <i className="bi bi-trash me-1"></i>Remove
          </Button>
        </Card>
      ))}
      <Button variant="outline-primary" size="sm" style={{ border: '1px solid #7c8db5', color: '#a8b8d8' }}
        onClick={() => onChange({ ...data, items: [...(data.items || []), { name: '', designation: '', rating: 5, text: '', avatarUrl: '' }] })}>
        <i className="bi bi-plus me-1"></i>Add Testimonial
      </Button>
    </div>
  );
};

const FooterEditor = ({ data, onChange }) => {
  const updateColumn = (colIdx, field, val) => {
    const columns = [...(data.columns || [])];
    columns[colIdx] = { ...columns[colIdx], [field]: val };
    onChange({ ...data, columns });
  };
  const updateLink = (colIdx, linkIdx, field, val) => {
    const columns = [...(data.columns || [])];
    const links = [...(columns[colIdx].links || [])];
    links[linkIdx] = { ...links[linkIdx], [field]: val };
    columns[colIdx] = { ...columns[colIdx], links };
    onChange({ ...data, columns });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Website ke sabse neeche — footer me copyright, links, social icons.
      </Alert>
      <Form.Group className="mb-2">
        <Form.Label className="small">Copyright Text</Form.Label>
        <Form.Control size="sm" value={data.copyrightText || ''} placeholder="© 2024 Restaurant Name. All rights reserved."
          onChange={(e) => onChange({ ...data, copyrightText: e.target.value })} />
      </Form.Group>
      <Form.Check type="switch" label="Show Social Media Links" className="mb-3"
        checked={data.showSocial !== false}
        onChange={(e) => onChange({ ...data, showSocial: e.target.checked })} />
      <h6>Columns</h6>
      {(data.columns || []).map((col, colIdx) => (
        <Card key={colIdx} className="mb-2 p-2 bg-light">
          <Form.Control size="sm" className="mb-1" placeholder="Column Title (e.g. Quick Links)" value={col.title || ''}
            onChange={(e) => updateColumn(colIdx, 'title', e.target.value)} />
          {(col.links || []).map((link, linkIdx) => (
            <Row key={linkIdx} className="mb-1 align-items-center">
              <Col xs={4}><Form.Control size="sm" placeholder="Label" value={link.label || ''}
                onChange={(e) => updateLink(colIdx, linkIdx, 'label', e.target.value)} /></Col>
              <Col xs={5}><Form.Control size="sm" placeholder="URL" value={link.url || ''}
                onChange={(e) => updateLink(colIdx, linkIdx, 'url', e.target.value)} /></Col>
              <Col xs={3}><Button variant="outline-danger" size="sm"
                onClick={() => { const columns = [...(data.columns || [])]; columns[colIdx] = { ...columns[colIdx], links: columns[colIdx].links.filter((_, i) => i !== linkIdx) }; onChange({ ...data, columns }); }}>
                <i className="bi bi-x"></i></Button></Col>
            </Row>
          ))}
          <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }}
            onClick={() => { const columns = [...(data.columns || [])]; columns[colIdx] = { ...columns[colIdx], links: [...(columns[colIdx].links || []), { label: '', url: '' }] }; onChange({ ...data, columns }); }}>
            + Add Link
          </Button>
          <div className="mt-1">
            <Button variant="outline-danger" size="sm"
              onClick={() => onChange({ ...data, columns: data.columns.filter((_, i) => i !== colIdx) })}>
              Remove Column
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }}
        onClick={() => onChange({ ...data, columns: [...(data.columns || []), { title: '', links: [] }] })}>
        + Add Column
      </Button>
    </div>
  );
};

const HeaderEditor = ({ data, onChange }) => {
  const updateItem = (idx, field, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...data, items });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Website ke top navigation bar me — HOME, MENU, ABOUT, CONTACT links.
      </Alert>
      <Form.Group className="mb-2">
        <Form.Label className="small">Logo Position</Form.Label>
        <Form.Select size="sm" value={data.logoPosition || 'left'}
          onChange={(e) => onChange({ ...data, logoPosition: e.target.value })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Form.Select>
      </Form.Group>
      <Form.Check type="switch" label="Sticky Header (scroll karne pe fix rahe)" className="mb-3"
        checked={data.sticky !== false}
        onChange={(e) => onChange({ ...data, sticky: e.target.checked })} />
      <h6>Nav Items</h6>
      {(data.items || []).map((item, idx) => (
        <Row key={idx} className="mb-1 align-items-center">
          <Col xs={3}><Form.Control size="sm" placeholder="Label" value={item.label || ''}
            onChange={(e) => updateItem(idx, 'label', e.target.value)} /></Col>
          <Col xs={4}><Form.Control size="sm" placeholder="Link (e.g. /menu)" value={item.link || ''}
            onChange={(e) => updateItem(idx, 'link', e.target.value)} /></Col>
          <Col xs={2}><Form.Check type="switch" label="Show" checked={item.visible !== false}
            onChange={(e) => updateItem(idx, 'visible', e.target.checked)} /></Col>
          <Col xs={3}><Button variant="outline-danger" size="sm"
            onClick={() => onChange({ ...data, items: data.items.filter((_, i) => i !== idx) })}>
            <i className="bi bi-trash"></i></Button></Col>
        </Row>
      ))}
      <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }}
        onClick={() => onChange({ ...data, items: [...(data.items || []), { label: '', link: '/', visible: true }] })}>
        + Add Nav Item
      </Button>
    </div>
  );
};

const TextBlockEditor = ({ data, onChange }) => (
  <div>
    <Form.Group className="mb-2">
      <Form.Label className="small">Heading</Form.Label>
      <Form.Control size="sm" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Content</Form.Label>
      <Form.Control as="textarea" rows={4} size="sm" value={data.content || ''}
        placeholder="Page ka text content yaha likho..."
        onChange={(e) => onChange({ ...data, content: e.target.value })} />
    </Form.Group>
  </div>
);

const ImageBannerEditor = ({ data, onChange }) => (
  <div>
    <ImageUploadField label="Banner Image" value={data.image}
      onChange={(url) => onChange({ ...data, image: url })} uploadType="banner" />
    <Form.Group className="mb-2">
      <Form.Label className="small">Overlay Text (optional)</Form.Label>
      <Form.Control size="sm" value={data.overlayText || ''} placeholder="Page heading jo image pe dikhega"
        onChange={(e) => onChange({ ...data, overlayText: e.target.value })} />
    </Form.Group>
  </div>
);

const StatsCountersEditor = ({ data, onChange }) => {
  const updateItem = (idx, field, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...data, items });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> "10+ YEARS", "50+ DISHES" jaise number counters.
      </Alert>
      {(data.items || []).map((item, idx) => (
        <Row key={idx} className="mb-1 align-items-center">
          <Col xs={2}><Form.Control size="sm" placeholder="bi bi-trophy" value={item.icon || ''} onChange={(e) => updateItem(idx, 'icon', e.target.value)} /></Col>
          <Col xs={3}><Form.Control size="sm" placeholder="Label" value={item.label || ''} onChange={(e) => updateItem(idx, 'label', e.target.value)} /></Col>
          <Col xs={2}><Form.Control size="sm" type="number" placeholder="Value" value={item.value || ''} onChange={(e) => updateItem(idx, 'value', e.target.value)} /></Col>
          <Col xs={2}><Form.Control size="sm" placeholder="Suffix (+)" value={item.suffix || ''} onChange={(e) => updateItem(idx, 'suffix', e.target.value)} /></Col>
          <Col xs={3}><Button variant="outline-danger" size="sm" onClick={() => onChange({ ...data, items: data.items.filter((_, i) => i !== idx) })}><i className="bi bi-trash"></i></Button></Col>
        </Row>
      ))}
      <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }}
        onClick={() => onChange({ ...data, items: [...(data.items || []), { icon: 'bi bi-trophy', label: '', value: '', suffix: '+' }] })}>
        + Add Counter
      </Button>
    </div>
  );
};

const FeaturesListEditor = ({ data, onChange }) => {
  const updateItem = (idx, field, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...data, items });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Feature list items with icon, title aur description.
      </Alert>
      {(data.items || []).map((item, idx) => (
        <Row key={idx} className="mb-1 align-items-center">
          <Col xs={2}><Form.Control size="sm" placeholder="bi bi-check-circle" value={item.icon || ''} onChange={(e) => updateItem(idx, 'icon', e.target.value)} /></Col>
          <Col xs={3}><Form.Control size="sm" placeholder="Title" value={item.title || ''} onChange={(e) => updateItem(idx, 'title', e.target.value)} /></Col>
          <Col xs={5}><Form.Control size="sm" placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} /></Col>
          <Col xs={2}><Button variant="outline-danger" size="sm" onClick={() => onChange({ ...data, items: data.items.filter((_, i) => i !== idx) })}><i className="bi bi-trash"></i></Button></Col>
        </Row>
      ))}
      <Button variant="link" size="sm" className="p-0" style={{ color: '#7c9adb' }}
        onClick={() => onChange({ ...data, items: [...(data.items || []), { icon: 'bi bi-check-circle', title: '', description: '' }] })}>
        + Add Feature
      </Button>
    </div>
  );
};

const ContactInfoEditor = ({ data, onChange }) => (
  <div>
    <Alert variant="info" className="py-2 px-3 small">
      <i className="bi bi-info-circle me-1"></i>
      <strong>Ye kaha dikhega:</strong> Contact page pe address, phone, email, hours info.
    </Alert>
    <Form.Group className="mb-2">
      <Form.Label className="small">Address</Form.Label>
      <Form.Control size="sm" value={data.address || ''} placeholder="123 Main Street, City"
        onChange={(e) => onChange({ ...data, address: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Phone</Form.Label>
      <Form.Control size="sm" value={data.phone || ''} placeholder="+91 98765 43210"
        onChange={(e) => onChange({ ...data, phone: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Email</Form.Label>
      <Form.Control size="sm" value={data.email || ''} placeholder="info@restaurant.com"
        onChange={(e) => onChange({ ...data, email: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Hours</Form.Label>
      <Form.Control as="textarea" rows={2} size="sm" value={data.hours || ''}
        placeholder="Mon-Sat: 11am - 11pm&#10;Sunday: 12pm - 10pm"
        onChange={(e) => onChange({ ...data, hours: e.target.value })} />
    </Form.Group>
  </div>
);

const TeamEditor = ({ data, onChange }) => {
  const updateMember = (idx, field, val) => {
    const members = [...(data.members || [])];
    members[idx] = { ...members[idx], [field]: val };
    onChange({ ...data, members });
  };

  return (
    <div>
      <Alert variant="info" className="py-2 px-3 small">
        <i className="bi bi-info-circle me-1"></i>
        <strong>Ye kaha dikhega:</strong> Team/Staff section — har member ki photo, naam, role.
      </Alert>
      {(data.members || []).map((member, idx) => (
        <Card key={idx} className="mb-2 p-2 bg-light">
          <Row>
            <Col md={4}>
              <Form.Control size="sm" className="mb-1" placeholder="Name" value={member.name || ''}
                onChange={(e) => updateMember(idx, 'name', e.target.value)} />
              <Form.Control size="sm" className="mb-1" placeholder="Role (e.g. Head Chef)" value={member.role || ''}
                onChange={(e) => updateMember(idx, 'role', e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Control as="textarea" rows={2} size="sm" placeholder="Short bio..."
                value={member.bio || ''} onChange={(e) => updateMember(idx, 'bio', e.target.value)} />
            </Col>
            <Col md={4}>
              <ImageUploadField label="Photo" value={member.image}
                onChange={(url) => updateMember(idx, 'image', url)} uploadType={`team_${idx}`} />
            </Col>
          </Row>
          <Button variant="outline-danger" size="sm" className="mt-1"
            onClick={() => onChange({ ...data, members: data.members.filter((_, i) => i !== idx) })}>
            <i className="bi bi-trash me-1"></i>Remove
          </Button>
        </Card>
      ))}
      <Button variant="outline-primary" size="sm" style={{ border: '1px solid #7c8db5', color: '#a8b8d8' }}
        onClick={() => onChange({ ...data, members: [...(data.members || []), { name: '', role: '', image: '', bio: '' }] })}>
        <i className="bi bi-plus me-1"></i>Add Member
      </Button>
    </div>
  );
};

const GalleryPreviewEditor = ({ data, onChange }) => (
  <div>
    <Alert variant="info" className="py-2 px-3 small">
      <i className="bi bi-info-circle me-1"></i>
      <strong>Ye kaha dikhega:</strong> Gallery section — images Settings &gt; Gallery se manage hoti hain, yaha sirf heading aur count set karo.
    </Alert>
    <Form.Group className="mb-2">
      <Form.Label className="small">Heading</Form.Label>
      <Form.Control size="sm" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Subtitle</Form.Label>
      <Form.Control size="sm" value={data.subtitle || ''} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small">Max Items to Show</Form.Label>
      <Form.Control size="sm" type="number" value={data.maxItems || 8}
        onChange={(e) => onChange({ ...data, maxItems: parseInt(e.target.value) || 8 })} />
    </Form.Group>
  </div>
);

// ─── Section Editor Dispatcher ──────────────────────────────────────────────────
const SectionEditor = ({ section, onChange }) => {
  const { type, data } = section;
  const handleDataChange = (newData) => onChange({ ...section, data: newData });

  switch (type) {
    case 'heroSlider': return <HeroSliderEditor data={data} onChange={handleDataChange} />;
    case 'heritage': return <HeritageEditor data={data} onChange={handleDataChange} />;
    case 'ourStory': return <OurStoryEditor data={data} onChange={handleDataChange} />;
    case 'tonightSpecial': return <SimpleHeadingEditor data={data} onChange={handleDataChange} description="Ye kaha dikhega: Tonight's Special section — data menu API se aata hai, yaha sirf heading text set karo." />;
    case 'trendingItems': return <SimpleHeadingEditor data={data} onChange={handleDataChange} description="Ye kaha dikhega: Trending Items section — data API se aata hai, sirf heading customize karo." />;
    case 'menuCategories': return <SimpleHeadingEditor data={data} onChange={handleDataChange} description="Ye kaha dikhega: Menu Categories grid — data API se aata hai, sirf heading set karo." />;
    case 'galleryPreview': return <GalleryPreviewEditor data={data} onChange={handleDataChange} />;
    case 'whyChooseUs': return <WhyChooseUsEditor data={data} onChange={handleDataChange} />;
    case 'onlineReservation': return <OnlineReservationEditor data={data} onChange={handleDataChange} />;
    case 'testimonials': return <TestimonialsEditor data={data} onChange={handleDataChange} />;
    case 'footer': return <FooterEditor data={data} onChange={handleDataChange} />;
    case 'header': return <HeaderEditor data={data} onChange={handleDataChange} />;
    case 'textBlock': return <TextBlockEditor data={data} onChange={handleDataChange} />;
    case 'imageBanner': return <ImageBannerEditor data={data} onChange={handleDataChange} />;
    case 'statsCounters': return <StatsCountersEditor data={data} onChange={handleDataChange} />;
    case 'featuresList': return <FeaturesListEditor data={data} onChange={handleDataChange} />;
    case 'contactInfo': return <ContactInfoEditor data={data} onChange={handleDataChange} />;
    case 'team': return <TeamEditor data={data} onChange={handleDataChange} />;
    default: return <p className="text-muted small">No editor for section type: {type}</p>;
  }
};

// ─── Section Card Component ─────────────────────────────────────────────────────
const SectionCard = ({ section, index, totalCount, onToggle, onMoveUp, onMoveDown, onRemove, onChange, expandedId, onExpand }) => {
  const template = SECTION_TEMPLATES[section.type];
  const isExpanded = expandedId === section.id;

  return (
    <Card className="mb-2 border" style={{ borderLeft: section.enabled ? '4px solid #28a745' : '4px solid #dc3545' }}>
      <Card.Header className="d-flex align-items-center py-2 px-3" style={{ cursor: 'pointer', background: isExpanded ? '#f8f9fa' : '#fff' }}
        onClick={() => onExpand(isExpanded ? null : section.id)}>
        <i className="bi bi-grip-vertical me-2 text-muted"></i>
        <span className={`me-2 ${section.enabled ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.7rem' }}>●</span>
        <i className={`bi ${template?.icon || 'bi-square'} me-2`}></i>
        <strong className="flex-grow-1 small">{template?.label || section.type}</strong>
        <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Form.Check type="switch" className="me-2"
            checked={section.enabled !== false}
            onChange={(e) => onToggle(e.target.checked)}
            title="Enable/Disable section" />
          <Button variant="outline-light" size="sm" disabled={index === 0} onClick={onMoveUp} title="Upar move karo" style={{ border: '1px solid #90959a', color: '#ffffff', backgroundColor: '#495057' }}>
            <i className="bi bi-arrow-up"></i>
          </Button>
          <Button variant="outline-light" size="sm" disabled={index === totalCount - 1} onClick={onMoveDown} title="Neeche move karo" style={{ border: '1px solid #90959a', color: '#ffffff', backgroundColor: '#495057' }}>
            <i className="bi bi-arrow-down"></i>
          </Button>
          <Button variant="outline-danger" size="sm" onClick={onRemove} title="Section hatao">
            <i className="bi bi-x-lg"></i>
          </Button>
        </div>
      </Card.Header>
      {isExpanded && (
        <Card.Body className="pt-3">
          <SectionEditor section={section} onChange={onChange} />
        </Card.Body>
      )}
    </Card>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const MyWebsite = () => {
  const { primaryColor } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState(DEFAULT_PAGES);
  const [activePage, setActivePage] = useState('home');
  const [expandedSection, setExpandedSection] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  // Load data on mount
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/admin/business_setting/get');
      if (result.success) {
        const data = result.success.data.data;
        if (data) {
          // If new page-based structure exists, use it
          if (data.websitePages) {
            setPages(data.websitePages);
          } else {
            // Backward compat: build pages structure from old flat configs
            const builtPages = buildPagesFromLegacy(data);
            setPages(builtPages);
          }
        }
      }
    } catch {
      toast.error('Website settings load nahi ho payi');
    } finally {
      setLoading(false);
    }
  };

  // Build page structure from legacy flat config data
  const buildPagesFromLegacy = (data) => {
    const result = JSON.parse(JSON.stringify(DEFAULT_PAGES));

    // Populate header from navConfig
    if (data.navConfig) {
      const headerSection = result.home.sections.find(s => s.type === 'header');
      if (headerSection) headerSection.data = { ...data.navConfig };
    }

    // Populate hero slider
    if (data.heroSlidesConfig) {
      const heroSection = result.home.sections.find(s => s.type === 'heroSlider');
      if (heroSection) heroSection.data = { ...data.heroSlidesConfig };
    }

    // Populate footer
    if (data.footerConfig) {
      const footerSection = result.home.sections.find(s => s.type === 'footer');
      if (footerSection) footerSection.data = { ...data.footerConfig };
    }

    // Populate testimonials
    if (data.testimonialsConfig) {
      const testSection = result.home.sections.find(s => s.type === 'testimonials');
      if (testSection) testSection.data = { ...testSection.data, ...data.testimonialsConfig };
    }

    // Populate features into whyChooseUs
    if (data.featuresConfig?.items?.length) {
      const whySection = result.home.sections.find(s => s.type === 'whyChooseUs');
      if (whySection) whySection.data.items = data.featuresConfig.items.map(f => ({ icon: f.icon, title: f.title, description: f.description }));
    }

    // Populate stats into ourStory
    if (data.statsConfig?.items?.length) {
      const storySection = result.home.sections.find(s => s.type === 'ourStory');
      if (storySection) storySection.data.stats = data.statsConfig.items;
    }

    return result;
  };

  // Build legacy format from pages for backward compatibility
  const buildLegacyFromPages = useCallback(() => {
    const home = pages.home;
    if (!home) return {};

    const headerSection = home.sections.find(s => s.type === 'header');
    const heroSection = home.sections.find(s => s.type === 'heroSlider');
    const footerSection = home.sections.find(s => s.type === 'footer');
    const testSection = home.sections.find(s => s.type === 'testimonials');
    const storySection = home.sections.find(s => s.type === 'ourStory');
    const whySection = home.sections.find(s => s.type === 'whyChooseUs');
    const gallerySection = home.sections.find(s => s.type === 'galleryPreview');

    const navConfig = headerSection ? { items: headerSection.data.items || [], logoPosition: headerSection.data.logoPosition || 'left', sticky: headerSection.data.sticky !== false } : undefined;
    const heroSlidesConfig = heroSection ? { slides: heroSection.data.slides || [], autoPlay: heroSection.data.autoPlay !== false, interval: heroSection.data.interval || 5000 } : undefined;
    const footerConfig = footerSection ? { columns: footerSection.data.columns || [], copyrightText: footerSection.data.copyrightText || '', showSocial: footerSection.data.showSocial !== false } : undefined;
    const testimonialsConfig = testSection ? { items: testSection.data.items || [] } : undefined;

    // Features from whyChooseUs items
    const featuresConfig = whySection ? { items: (whySection.data.items || []).map(i => ({ icon: i.icon, title: i.title, description: i.description })) } : undefined;

    // Stats from ourStory stats
    const statsConfig = storySection?.data?.stats?.length ? { items: storySection.data.stats } : undefined;

    // Page content from gallery and custom pages
    const pageContentConfig = {
      galleryTitle: gallerySection?.data?.heading || 'Our Gallery',
      gallerySubtitle: gallerySection?.data?.subtitle || '',
      galleryMaxItems: gallerySection?.data?.maxItems || 8,
      pages: Object.entries(pages)
        .filter(([key]) => !['home', 'about', 'contact', 'gallery'].includes(key))
        .map(([key, pg]) => ({ title: pg.label, slug: pg.slug || key, content: '', published: true }))
    };

    return { navConfig, heroSlidesConfig, footerConfig, testimonialsConfig, featuresConfig, statsConfig, pageContentConfig };
  }, [pages]);

  // Save All
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const legacy = buildLegacyFromPages();
      const payload = {
        ...legacy,
        websitePages: pages // new structure
      };
      const result = await ApiPost('/api/admin/business_setting/save', payload);
      if (result.success) toast.success('Sab settings save ho gayi!');
      else toast.error(result.fail || 'Save fail ho gaya');
    } catch {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Section operations
  const updateSection = (pageKey, sectionId, updatedSection) => {
    setPages(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: prev[pageKey].sections.map(s => s.id === sectionId ? updatedSection : s)
      }
    }));
  };

  const toggleSection = (pageKey, sectionId, enabled) => {
    setPages(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: prev[pageKey].sections.map(s => s.id === sectionId ? { ...s, enabled } : s)
      }
    }));
  };

  const moveSection = (pageKey, index, direction) => {
    setPages(prev => {
      const sections = [...prev[pageKey].sections];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= sections.length) return prev;
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
      return { ...prev, [pageKey]: { ...prev[pageKey], sections } };
    });
  };

  const removeSection = (pageKey, sectionId) => {
    setPages(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        sections: prev[pageKey].sections.filter(s => s.id !== sectionId)
      }
    }));
    if (expandedSection === sectionId) setExpandedSection(null);
  };

  const addSection = (type) => {
    const template = SECTION_TEMPLATES[type];
    if (!template) return;
    const newSection = {
      id: genId(),
      type,
      enabled: true,
      data: JSON.parse(JSON.stringify(template.defaults))
    };
    setPages(prev => ({
      ...prev,
      [activePage]: {
        ...prev[activePage],
        sections: [...(prev[activePage].sections || []), newSection]
      }
    }));
    setShowAddSection(false);
    setExpandedSection(newSection.id);
  };

  const addCustomPage = () => {
    if (!newPageName.trim()) return;
    const slug = newPageName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (pages[slug]) {
      toast.error('Is naam ka page already hai');
      return;
    }
    setPages(prev => ({
      ...prev,
      [slug]: {
        label: newPageName.trim(),
        slug,
        isDefault: false,
        sections: [
          { id: genId(), type: 'imageBanner', enabled: true, data: { image: '', overlayText: newPageName.trim() } },
          { id: genId(), type: 'textBlock', enabled: true, data: { heading: newPageName.trim(), content: '' } },
        ]
      }
    }));
    setActivePage(slug);
    setNewPageName('');
    setShowAddPage(false);
  };

  const removeCustomPage = (pageKey) => {
    if (pages[pageKey]?.isDefault) return;
    const updated = { ...pages };
    delete updated[pageKey];
    setPages(updated);
    setActivePage('home');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" style={{ color: primaryColor }} />
        <p className="mt-2">Website settings load ho rahi hain...</p>
      </Container>
    );
  }

  const currentPage = pages[activePage];
  const pageKeys = Object.keys(pages);

  return (
    <Container fluid className="py-4">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1"><i className="bi bi-globe me-2"></i>My Website</h4>
          <p className="text-muted mb-0 small">Page select karo, sections arrange karo, content edit karo — jaise website pe dikhega waise</p>
        </div>
        <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor }} onClick={handleSaveAll} disabled={saving}>
          {saving ? <Spinner size="sm" className="me-1" /> : <i className="bi bi-save me-1"></i>}
          Save All
        </Button>
      </div>

      <Row>
        {/* Left Sidebar — Pages */}
        <Col md={3} lg={2}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-2">
              <strong className="small">PAGES</strong>
            </Card.Header>
            <Card.Body className="p-2">
              {pageKeys.map((key) => (
                <div key={key} className="d-flex align-items-center mb-1">
                  <Button
                    variant={activePage === key ? 'primary' : 'light'}
                    size="sm"
                    className="flex-grow-1 text-start"
                    style={activePage === key ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    onClick={() => { setActivePage(key); setExpandedSection(null); }}
                  >
                    <i className={`bi ${key === 'home' ? 'bi-house' : key === 'about' ? 'bi-info-circle' : key === 'contact' ? 'bi-telephone' : key === 'gallery' ? 'bi-images' : 'bi-file-earmark'} me-2`}></i>
                    {pages[key].label}
                  </Button>
                  {!pages[key].isDefault && (
                    <Button variant="outline-danger" size="sm" className="ms-1 px-1"
                      onClick={() => removeCustomPage(key)} title="Page delete karo">
                      <i className="bi bi-x"></i>
                    </Button>
                  )}
                </div>
              ))}
              <hr className="my-2" />
              <Button variant="outline-primary" size="sm" className="w-100" onClick={() => setShowAddPage(true)} style={{ border: '1px solid #7c8db5', color: '#a8b8d8' }}>
                <i className="bi bi-plus me-1"></i>Add Page
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content — Sections */}
        <Col md={9} lg={10}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex align-items-center justify-content-between py-2">
              <div>
                <strong>{currentPage?.label?.toUpperCase()} PAGE</strong>
                <span className="text-muted small ms-2">— sections ko reorder karo, expand karke edit karo</span>
              </div>
              <span className="badge bg-secondary">{currentPage?.sections?.length || 0} sections</span>
            </Card.Header>
            <Card.Body className="p-3">
              {currentPage?.sections?.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-layers" style={{ fontSize: '2rem' }}></i>
                  <p className="mt-2">Koi section nahi hai. Neeche "Add Section" se add karo.</p>
                </div>
              )}

              {(currentPage?.sections || []).map((section, idx) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  index={idx}
                  totalCount={currentPage.sections.length}
                  expandedId={expandedSection}
                  onExpand={setExpandedSection}
                  onToggle={(enabled) => toggleSection(activePage, section.id, enabled)}
                  onMoveUp={() => moveSection(activePage, idx, -1)}
                  onMoveDown={() => moveSection(activePage, idx, 1)}
                  onRemove={() => removeSection(activePage, section.id)}
                  onChange={(updated) => updateSection(activePage, section.id, updated)}
                />
              ))}

              <div className="text-center mt-3">
                <Button variant="outline-primary" onClick={() => setShowAddSection(true)} style={{ border: '1px solid #7c8db5', color: '#a8b8d8' }}>
                  <i className="bi bi-plus-circle me-1"></i> Add Section
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Section Modal */}
      <Modal show={showAddSection} onHide={() => setShowAddSection(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h5">Section Add Karo — Template Choose Karo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">Koi bhi section template select karo. Add hone ke baad content edit kar sakte ho.</p>
          <Row>
            {Object.entries(SECTION_TEMPLATES).map(([key, tmpl]) => (
              <Col xs={6} md={4} key={key} className="mb-2">
                <Card className="h-100 border" style={{ cursor: 'pointer' }}
                  onClick={() => addSection(key)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#dee2e6'}>
                  <Card.Body className="text-center py-3">
                    <i className={`bi ${tmpl.icon}`} style={{ fontSize: '1.5rem', color: primaryColor }}></i>
                    <p className="small mb-0 mt-1 fw-semibold">{tmpl.label}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>

      {/* Add Page Modal */}
      <Modal show={showAddPage} onHide={() => setShowAddPage(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="h5">Naya Page Add Karo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Page Name</Form.Label>
            <Form.Control placeholder="e.g. Our Menu, Events, Special Offers"
              value={newPageName} onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomPage()} />
            <Form.Text className="text-muted">
              URL slug automatic ban jayega: /{newPageName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'page-name'}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowAddPage(false)}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor }} size="sm" onClick={addCustomPage} disabled={!newPageName.trim()}>
            <i className="bi bi-plus me-1"></i>Add Page
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyWebsite;
