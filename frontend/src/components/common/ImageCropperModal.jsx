import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { removeBackground } from '../../utils/backgroundRemover';

// ─── Image helpers (unchanged) ────────────────────────────────────────────────

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });

/**
 * Extracts the crop region from the source image, optionally resizing.
 * pixelCrop: { x, y, width, height } in natural image pixels.
 */
const getCroppedImg = async (imageSrc, pixelCrop, outputW, outputH, format = 'jpeg') => {
  const image = await createImage(imageSrc);
  const finalW = outputW || pixelCrop.width;
  const finalH = outputH || pixelCrop.height;
  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext('2d');

  // For JPEG (no transparency support), fill white first to avoid black background.
  // For PNG we skip this so transparency is preserved.
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalW, finalH);
  }

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, finalW, finalH,
  );
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.92; // PNG is lossless
  return new Promise((resolve) => {
    canvas.toBlob((blob) => { if (blob) resolve(blob); }, mime, quality);
  });
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTAINER_H = 370;
const HANDLE_SIZE  = 8;   // px, blue square handle
const MIN_BOX      = 40;  // minimum crop box dimension

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1',  value: 1 },
  { label: '4:5',  value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3',  value: 4 / 3 },
  { label: '3:1',  value: 3 },
];

// handle id → { cursor, getPos(box) }
const HANDLE_DEFS = {
  tl: { cursor: 'nw-resize', pos: (b) => ({ x: b.x,           y: b.y           }) },
  tc: { cursor: 'n-resize',  pos: (b) => ({ x: b.x + b.w / 2, y: b.y           }) },
  tr: { cursor: 'ne-resize', pos: (b) => ({ x: b.x + b.w,     y: b.y           }) },
  ml: { cursor: 'w-resize',  pos: (b) => ({ x: b.x,           y: b.y + b.h / 2 }) },
  mr: { cursor: 'e-resize',  pos: (b) => ({ x: b.x + b.w,     y: b.y + b.h / 2 }) },
  bl: { cursor: 'sw-resize', pos: (b) => ({ x: b.x,           y: b.y + b.h     }) },
  bc: { cursor: 's-resize',  pos: (b) => ({ x: b.x + b.w / 2, y: b.y + b.h     }) },
  br: { cursor: 'se-resize', pos: (b) => ({ x: b.x + b.w,     y: b.y + b.h     }) },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Clamp a crop box so it stays within the image display rectangle.
 * Also enforces MIN_BOX size.
 */
function clampBox(box, img) {
  let { x, y, w, h } = box;
  w = Math.max(MIN_BOX, Math.min(w, img.w));
  h = Math.max(MIN_BOX, Math.min(h, img.h));
  x = Math.max(img.x, Math.min(x, img.x + img.w - w));
  y = Math.max(img.y, Math.min(y, img.y + img.h - h));
  return { x, y, w, h };
}

/**
 * Apply a resize delta from a given handle id.
 * Optionally locks aspect ratio (ar).
 */
function applyResize(handleId, startBox, dx, dy, ar) {
  let { x, y, w, h } = startBox;

  switch (handleId) {
    case 'tl': x += dx; w -= dx; y += dy; h -= dy; break;
    case 'tc':                    y += dy; h -= dy; break;
    case 'tr':          w += dx; y += dy; h -= dy; break;
    case 'ml': x += dx; w -= dx;                   break;
    case 'mr':          w += dx;                   break;
    case 'bl': x += dx; w -= dx;          h += dy; break;
    case 'bc':                             h += dy; break;
    case 'br':          w += dx;          h += dy; break;
    default: break;
  }

  w = Math.max(MIN_BOX, w);
  h = Math.max(MIN_BOX, h);

  // Lock aspect ratio
  if (ar) {
    if (['ml', 'mr'].includes(handleId)) {
      // horizontal drag only → derive h from w, keep vertical center
      const newH = w / ar;
      y = y + (h - newH) / 2;
      h = newH;
    } else if (['tc', 'bc'].includes(handleId)) {
      // vertical drag only → derive w from h, keep horizontal center
      const newW = h * ar;
      x = x + (w - newW) / 2;
      w = newW;
    } else {
      // corner: use whichever dimension changed more
      if (Math.abs(dx) >= Math.abs(dy)) {
        const newH = w / ar;
        if (['tl', 'tr'].includes(handleId)) y = y + (h - newH);
        h = newH;
      } else {
        const newW = h * ar;
        if (['tl', 'bl'].includes(handleId)) x = x + (w - newW);
        w = newW;
      }
    }
  }

  return { x, y, w, h };
}

// ─── Component ────────────────────────────────────────────────────────────────

const ImageCropperModal = ({
  show,
  onHide,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  title = 'Crop Image',
  primaryColor = '#8B1538',
  outputFormat = 'jpeg', // 'jpeg' or 'png' — use 'png' for transparent logos/favicons
}) => {
  const [activeAspect, setActiveAspect] = useState(aspectRatio);
  const [outputW, setOutputW]           = useState('');
  const [outputH, setOutputH]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [removingBg, setRemovingBg]     = useState(false);
  const [bgRemoved, setBgRemoved]       = useState(false);

  // imgDisp: { x, y, w, h } — image position inside the container (px)
  const [imgDisp, setImgDisp]   = useState(null);
  // naturalSize: { w, h } — original image dimensions
  const [natSize, setNatSize]   = useState(null);
  // cropBox: { x, y, w, h } — crop rectangle in container coords
  const [cropBox, setCropBox]   = useState(null);

  // Track the working image (original or bg-removed version)
  const [workingImageSrc, setWorkingImageSrc] = useState(imageSrc);

  const containerRef = useRef(null);
  const dragRef      = useRef(null); // { type, startX, startY, startBox }
  const aspectRef    = useRef(activeAspect);
  aspectRef.current  = activeAspect;

  // ── Reset & init on open
  useEffect(() => {
    if (!show) return;
    setActiveAspect(aspectRatio);
    setOutputW('');
    setOutputH('');
    setImgDisp(null);
    setNatSize(null);
    setCropBox(null);
    setWorkingImageSrc(imageSrc);
    setBgRemoved(false);
    setRemovingBg(false);
  }, [show, aspectRatio, imageSrc]);

  // ── Load image → compute display rect → init crop box
  useEffect(() => {
    if (!show || !workingImageSrc) return;
    let cancelled = false;

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      const container = containerRef.current;
      if (!container) return;
      const cw = container.clientWidth || 800;
      const ch = CONTAINER_H;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      const scale = Math.min(cw / nw, ch / nh, 1);
      const dw = nw * scale;
      const dh = nh * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      const disp = { x: dx, y: dy, w: dw, h: dh };
      setNatSize({ w: nw, h: nh });
      setImgDisp(disp);

      // Initial crop box: fill image minus small inset
      const pad = 16;
      let bw = dw - pad * 2;
      let bh = dh - pad * 2;
      const ar = aspectRef.current;
      if (ar) {
        if (bw / bh > ar) bw = bh * ar;
        else               bh = bw / ar;
        bw = Math.min(bw, dw);
        bh = Math.min(bh, dh);
      }
      const bx = dx + (dw - bw) / 2;
      const by = dy + (dh - bh) / 2;
      setCropBox({ x: bx, y: by, w: bw, h: bh });
    };
    img.src = workingImageSrc;
    return () => { cancelled = true; };
  }, [show, workingImageSrc]);

  // ── Adjust crop box when aspect ratio changes
  useEffect(() => {
    if (!cropBox || !imgDisp) return;
    if (activeAspect === null) return; // free — no adjustment

    const cx = cropBox.x + cropBox.w / 2;
    const cy = cropBox.y + cropBox.h / 2;
    let nw = cropBox.w;
    let nh = nw / activeAspect;

    // Constrain to image
    if (nh > imgDisp.h) { nh = imgDisp.h; nw = nh * activeAspect; }
    if (nw > imgDisp.w) { nw = imgDisp.w; nh = nw / activeAspect; }

    const nx = Math.max(imgDisp.x, Math.min(cx - nw / 2, imgDisp.x + imgDisp.w - nw));
    const ny = Math.max(imgDisp.y, Math.min(cy - nh / 2, imgDisp.y + imgDisp.h - nh));
    setCropBox({ x: nx, y: ny, w: nw, h: nh });
  }, [activeAspect]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer helpers
  const getPos = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }, []);

  const startDrag = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos(e);
    dragRef.current = { type, startX: pos.x, startY: pos.y, startBox: { ...cropBox } };

    const onMove = (ev) => {
      if (!dragRef.current || !imgDisp) return;
      const { type: t, startX, startY, startBox: sb } = dragRef.current;
      const cur = getPos(ev);
      const ddx = cur.x - startX;
      const ddy = cur.y - startY;
      const ar  = aspectRef.current;

      let next;
      if (t === 'move') {
        next = { x: sb.x + ddx, y: sb.y + ddy, w: sb.w, h: sb.h };
      } else {
        next = applyResize(t, sb, ddx, ddy, ar);
      }
      setCropBox(clampBox(next, imgDisp));
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend',  onUp);
  }, [cropBox, imgDisp, getPos]);

  // ── Confirm crop
  const handleCropConfirm = async () => {
    if (!cropBox || !imgDisp || !natSize || !workingImageSrc) return;
    setLoading(true);
    try {
      const sx = natSize.w / imgDisp.w;
      const sy = natSize.h / imgDisp.h;
      const pixelCrop = {
        x:      Math.round((cropBox.x - imgDisp.x) * sx),
        y:      Math.round((cropBox.y - imgDisp.y) * sy),
        width:  Math.round(cropBox.w * sx),
        height: Math.round(cropBox.h * sy),
      };
      const w    = outputW ? parseInt(outputW, 10) : undefined;
      const h    = outputH ? parseInt(outputH, 10) : undefined;
      const fmt  = bgRemoved ? 'png' : (outputFormat === 'png' ? 'png' : 'jpeg');
      const blob = await getCroppedImg(workingImageSrc, pixelCrop, w, h, fmt);
      if (blob) {
        const ext  = fmt === 'png' ? 'png' : 'jpg';
        const mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
        const file = new File([blob], `cropped-image.${ext}`, { type: mime, lastModified: Date.now() });
        onCropComplete(file, URL.createObjectURL(blob));
        handleClose();
      }
    } catch (err) {
      console.error('Crop error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Remove background
  const handleRemoveBg = async () => {
    if (!imageSrc) return;
    setRemovingBg(true);
    try {
      const resultDataUrl = await removeBackground(imageSrc);
      setWorkingImageSrc(resultDataUrl);
      setBgRemoved(true);
    } catch (err) {
      console.error('Background removal error:', err);
    } finally {
      setRemovingBg(false);
    }
  };

  // ── Restore original (undo bg removal)
  const handleRestoreOriginal = () => {
    setWorkingImageSrc(imageSrc);
    setBgRemoved(false);
  };

  const handleUseOriginal = () => {
    if (!imageSrc) return;
    fetch(imageSrc)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], 'original-image.jpg', { type: blob.type || 'image/jpeg', lastModified: Date.now() });
        onCropComplete(file, URL.createObjectURL(blob));
        handleClose();
      })
      .catch(() => {});
  };

  const handleClose = () => {
    setCropBox(null);
    setImgDisp(null);
    onHide();
  };

  // ── Render helpers

  const renderOverlay = () => {
    if (!cropBox) return null;
    const { x, y, w, h } = cropBox;
    const dim = 'rgba(0,0,0,0.55)';
    return (
      <>
        <div style={{ position: 'absolute', inset: 0, top: 0,   left: 0, right: 0,  height: y,          background: dim, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, top: y+h, left: 0, right: 0,  bottom: 0,          background: dim, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: y,  left: 0,   width: x,           height: h,          background: dim, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: y,  left: x+w, right: 0,           height: h,          background: dim, pointerEvents: 'none' }} />
      </>
    );
  };

  const renderCropBox = () => {
    if (!cropBox) return null;
    const { x, y, w, h } = cropBox;
    return (
      <div
        style={{
          position: 'absolute', left: x, top: y, width: w, height: h,
          border: '1.5px dashed rgba(255,255,255,0.85)',
          boxSizing: 'border-box', cursor: 'move', zIndex: 10,
        }}
        onMouseDown={(e) => startDrag(e, 'move')}
        onTouchStart={(e) => startDrag(e, 'move')}
      />
    );
  };

  const renderGrid = () => {
    if (!cropBox) return null;
    const { x, y, w, h } = cropBox;
    const stroke = 'rgba(255,255,255,0.3)';
    return (
      <svg
        style={{ position: 'absolute', left: x, top: y, width: w, height: h, pointerEvents: 'none', zIndex: 11, overflow: 'visible' }}
      >
        <line x1={w / 3}     y1={0} x2={w / 3}     y2={h} stroke={stroke} strokeWidth={1} />
        <line x1={2 * w / 3} y1={0} x2={2 * w / 3} y2={h} stroke={stroke} strokeWidth={1} />
        <line x1={0} y1={h / 3}     x2={w} y2={h / 3}     stroke={stroke} strokeWidth={1} />
        <line x1={0} y1={2 * h / 3} x2={w} y2={2 * h / 3} stroke={stroke} strokeWidth={1} />
      </svg>
    );
  };

  const renderHandles = () => {
    if (!cropBox) return null;
    const hs = HANDLE_SIZE;
    const hh = hs / 2;
    return Object.entries(HANDLE_DEFS).map(([id, def]) => {
      const pos = def.pos(cropBox);
      return (
        <div
          key={id}
          style={{
            position: 'absolute',
            left: pos.x - hh, top: pos.y - hh,
            width: hs, height: hs,
            background: '#3b82f6',
            border: '1.5px solid rgba(255,255,255,0.95)',
            borderRadius: '1px',
            cursor: def.cursor,
            zIndex: 20,
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
          onMouseDown={(e) => startDrag(e, id)}
          onTouchStart={(e) => startDrag(e, id)}
        />
      );
    });
  };

  // ── Pill button style
  const pillBtn = (active) => ({
    fontSize: '12px', fontWeight: 600, borderRadius: '7px', padding: '4px 12px',
    border: `1.5px solid ${active ? '#3b82f6' : '#dde'}`,
    background: active ? '#3b82f6' : '#fff',
    color: active ? '#fff' : '#555',
    cursor: 'pointer', lineHeight: 1.4, transition: 'all .12s',
  });

  // ── Render
  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton style={{ borderBottom: '1px solid #f0f0f0', padding: '14px 20px' }}>
        <Modal.Title style={{ fontSize: '15px', fontWeight: 700 }}>
          <i className="bi bi-crop me-2" style={{ color: primaryColor }}></i>
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: 0 }}>

        {/* ── Crop area */}
        <div
          ref={containerRef}
          style={{
            position: 'relative', height: CONTAINER_H,
            background: bgRemoved
              ? 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px'
              : '#111827',
            overflow: 'hidden',
            userSelect: 'none', touchAction: 'none',
          }}
        >
          {workingImageSrc && imgDisp && (
            <img
              src={workingImageSrc}
              alt="crop"
              draggable={false}
              style={{
                position: 'absolute',
                left: imgDisp.x, top: imgDisp.y,
                width: imgDisp.w, height: imgDisp.h,
                pointerEvents: 'none', userSelect: 'none',
                maxWidth: 'none',
              }}
            />
          )}

          {renderOverlay()}
          {renderGrid()}
          {renderCropBox()}
          {renderHandles()}
        </div>

        {/* ── Controls */}
        <div style={{ padding: '14px 20px 16px', borderTop: '1px solid #f0f0f0' }}>

          {/* Aspect Ratio */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.6px', marginBottom: '7px' }}>
              Aspect Ratio
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ASPECT_RATIOS.map((opt) => (
                <button key={opt.label} onClick={() => setActiveAspect(opt.value)} style={pillBtn(activeAspect === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11.5px', color: '#bbb', marginTop: '6px', marginBottom: '12px', lineHeight: 1.4 }}>
            <i className="bi bi-info-circle me-1"></i>
            Drag the handles to resize. Drag inside to reposition. Select an aspect ratio or use free-form.
          </p>

          {/* Output Dimensions */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.6px', marginBottom: '8px' }}>
              Output Dimensions{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '10px' }}>(Optional)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>W</span>
              <input type="number" placeholder="Auto" value={outputW} onChange={(e) => setOutputW(e.target.value)}
                style={{ width: '80px', border: '1.5px solid #e5e7eb', borderRadius: '7px', padding: '4px 9px', fontSize: '13px', outline: 'none' }} />
              <span style={{ fontSize: '12px', color: '#ccc' }}>px</span>
              <span style={{ fontSize: '12px', color: '#999' }}>×</span>
              <span style={{ fontSize: '12px', color: '#666' }}>H</span>
              <input type="number" placeholder="Auto" value={outputH} onChange={(e) => setOutputH(e.target.value)}
                style={{ width: '80px', border: '1.5px solid #e5e7eb', borderRadius: '7px', padding: '4px 9px', fontSize: '13px', outline: 'none' }} />
              <span style={{ fontSize: '12px', color: '#ccc' }}>px</span>
            </div>
          </div>

          <p style={{ fontSize: '11.5px', color: '#bbb', marginTop: '6px', marginBottom: 0, lineHeight: 1.4 }}>
            <i className="bi bi-info-circle me-1"></i>
            Set exact output size in pixels. Aspect ratio auto-locks when both are set.
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ borderTop: '1px solid #f0f0f0', padding: '10px 20px', gap: '8px', display: 'flex', flexWrap: 'wrap' }}>
        <Button variant="outline-secondary" onClick={handleUseOriginal} disabled={loading || removingBg}
          style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
          <i className="bi bi-image me-1"></i>Use Original
        </Button>

        {!bgRemoved ? (
          <Button variant="outline-info" onClick={handleRemoveBg} disabled={loading || removingBg}
            style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            {removingBg
              ? <><Spinner animation="border" size="sm" className="me-1" style={{ width: '0.85rem', height: '0.85rem' }} />Removing...</>
              : <><i className="bi bi-eraser me-1"></i>Remove BG</>
            }
          </Button>
        ) : (
          <Button variant="outline-warning" onClick={handleRestoreOriginal} disabled={loading || removingBg}
            style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            <i className="bi bi-arrow-counterclockwise me-1"></i>Restore BG
          </Button>
        )}

        <div style={{ flex: 1 }} />
        <Button variant="secondary" onClick={handleClose} disabled={loading || removingBg}
          style={{ borderRadius: '8px', fontSize: '13px' }}>
          Cancel
        </Button>
        <Button onClick={handleCropConfirm}
          style={{ backgroundColor: primaryColor, borderColor: primaryColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
          disabled={loading || removingBg || !cropBox}>
          {loading
            ? <><Spinner animation="border" size="sm" className="me-2" style={{ width: '1rem', height: '1rem' }} />Processing...</>
            : <><i className="bi bi-check-lg me-1"></i>Crop & Save</>
          }
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageCropperModal;
