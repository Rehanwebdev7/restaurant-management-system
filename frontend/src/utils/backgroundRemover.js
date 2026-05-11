/**
 * backgroundRemover.js
 *
 * Pure canvas-based background removal for product images.
 * Uses BFS flood-fill from corners to identify background pixels,
 * then makes them transparent with edge feathering for smooth results.
 *
 * No external dependencies — uses only the Canvas API.
 */

/**
 * Remove the background from an image.
 *
 * @param {string} imageSrc - image source (data URL, blob URL, or regular URL)
 * @param {object} [options]
 * @param {number} [options.tolerance] - color distance tolerance (auto-detected if omitted)
 * @param {number} [options.featherRadius] - edge feather radius in pixels (default: 2)
 * @returns {Promise<string>} PNG data URL with transparent background
 */
export function removeBackground(imageSrc, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const result = processImage(img, options);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for background removal'));
    img.src = imageSrc;
  });
}

/**
 * Core processing: flood-fill from corners, remove background, feather edges.
 */
function processImage(img, options) {
  const { featherRadius = 2 } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data; // Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]

  // --- Step 1: Sample edge pixels to determine dominant background color ---
  const bgColor = sampleBackgroundColor(pixels, w, h);

  // --- Step 2: Auto-detect tolerance if not provided ---
  const tolerance = options.tolerance != null
    ? options.tolerance
    : autoDetectTolerance(bgColor);

  // --- Step 3: BFS flood-fill from all 4 corners ---
  // visited[i] = true means pixel i has been visited
  // bgMask[i] = true means pixel i is background
  const totalPixels = w * h;
  const visited = new Uint8Array(totalPixels);
  const bgMask = new Uint8Array(totalPixels);

  // Seed the BFS queue with corner pixels (and nearby edge pixels for robustness)
  const queue = [];
  const seeds = getCornerSeeds(w, h);

  for (const idx of seeds) {
    if (!visited[idx] && colorDistance(pixels, idx, bgColor) <= tolerance) {
      visited[idx] = 1;
      bgMask[idx] = 1;
      queue.push(idx);
    }
  }

  // BFS flood-fill using a ring buffer for performance
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w;
    const y = (idx - x) / w;

    // Check 4-connected neighbors
    const neighbors = [];
    if (x > 0) neighbors.push(idx - 1);
    if (x < w - 1) neighbors.push(idx + 1);
    if (y > 0) neighbors.push(idx - w);
    if (y < h - 1) neighbors.push(idx + w);

    for (const nIdx of neighbors) {
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        if (colorDistance(pixels, nIdx, bgColor) <= tolerance) {
          bgMask[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }
  }

  // --- Step 4: Compute distance-to-foreground map for feathering ---
  // For each background pixel, find the minimum distance to a non-background pixel.
  // We only need this within featherRadius of the boundary, so we do a BFS from
  // boundary foreground pixels outward into the background.
  const distMap = new Float32Array(totalPixels); // 0 = foreground or far bg
  if (featherRadius > 0) {
    computeFeatherDistances(bgMask, distMap, w, h, featherRadius);
  }

  // --- Step 5: Apply transparency ---
  for (let i = 0; i < totalPixels; i++) {
    if (bgMask[i]) {
      const pi = i * 4;
      if (featherRadius > 0 && distMap[i] > 0 && distMap[i] <= featherRadius) {
        // Feather zone: partial transparency based on distance to foreground
        // distMap[i] = 1 means right next to foreground (mostly opaque)
        // distMap[i] = featherRadius means deep in background (fully transparent)
        const alpha = Math.max(0, 1 - distMap[i] / (featherRadius + 1));
        pixels[pi + 3] = Math.round(alpha * pixels[pi + 3]);
      } else {
        // Fully in background — make transparent
        pixels[pi + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Sample pixels from the edges and corners to determine the dominant background color.
 * Takes samples from corners (3x3 blocks) and edge midpoints to get a robust average.
 */
function sampleBackgroundColor(pixels, w, h) {
  const samples = [];

  // Helper to add a pixel sample
  const addSample = (x, y) => {
    if (x >= 0 && x < w && y >= 0 && y < h) {
      const i = (y * w + x) * 4;
      // Only sample non-transparent pixels
      if (pixels[i + 3] > 128) {
        samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
      }
    }
  };

  // Sample 3x3 blocks at each corner
  const cornerOffsets = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
    [0, 2], [1, 2], [2, 2],
  ];

  // Top-left corner
  for (const [dx, dy] of cornerOffsets) addSample(dx, dy);
  // Top-right corner
  for (const [dx, dy] of cornerOffsets) addSample(w - 1 - dx, dy);
  // Bottom-left corner
  for (const [dx, dy] of cornerOffsets) addSample(dx, h - 1 - dy);
  // Bottom-right corner
  for (const [dx, dy] of cornerOffsets) addSample(w - 1 - dx, h - 1 - dy);

  // Edge midpoints (top, bottom, left, right) — 5 samples each
  const midX = Math.floor(w / 2);
  const midY = Math.floor(h / 2);
  for (let d = -2; d <= 2; d++) {
    addSample(midX + d, 0);          // top edge
    addSample(midX + d, h - 1);      // bottom edge
    addSample(0, midY + d);          // left edge
    addSample(w - 1, midY + d);      // right edge
  }

  if (samples.length === 0) {
    // Fallback: assume white background
    return [255, 255, 255];
  }

  // Use the median of each channel to avoid outlier influence
  const r = median(samples.map(s => s[0]));
  const g = median(samples.map(s => s[1]));
  const b = median(samples.map(s => s[2]));

  return [r, g, b];
}

/**
 * Auto-detect a good tolerance based on the background color.
 * White/light backgrounds get a lower tolerance (~35).
 * Colored/darker backgrounds get a higher tolerance (~50-60).
 */
function autoDetectTolerance(bgColor) {
  const [r, g, b] = bgColor;
  const brightness = (r + g + b) / 3;

  // Check how "colorful" the background is (saturation proxy)
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const chroma = maxC - minC;

  if (brightness > 220 && chroma < 30) {
    // Near-white background — tight tolerance
    return 35;
  } else if (brightness > 180) {
    // Light but slightly colored
    return 45;
  } else if (brightness > 100) {
    // Medium tones — need more tolerance
    return 55;
  } else {
    // Dark background
    return 50;
  }
}

/**
 * Generate seed pixel indices from all 4 corners and along edges.
 * This ensures the flood-fill starts from the outer boundary.
 */
function getCornerSeeds(w, h) {
  const seeds = new Set();

  // Corner blocks (5x5 at each corner)
  const cornerSize = Math.min(5, Math.floor(w / 4), Math.floor(h / 4));
  for (let dy = 0; dy < cornerSize; dy++) {
    for (let dx = 0; dx < cornerSize; dx++) {
      seeds.add(dy * w + dx);                           // top-left
      seeds.add(dy * w + (w - 1 - dx));                 // top-right
      seeds.add((h - 1 - dy) * w + dx);                 // bottom-left
      seeds.add((h - 1 - dy) * w + (w - 1 - dx));       // bottom-right
    }
  }

  // Spread seeds along all 4 edges (every 10th pixel) to catch backgrounds
  // that might not connect purely through corners
  const step = Math.max(1, Math.floor(Math.min(w, h) / 50));
  for (let x = 0; x < w; x += step) {
    seeds.add(x);                   // top edge
    seeds.add((h - 1) * w + x);    // bottom edge
  }
  for (let y = 0; y < h; y += step) {
    seeds.add(y * w);               // left edge
    seeds.add(y * w + (w - 1));     // right edge
  }

  return seeds;
}

/**
 * Compute Euclidean color distance between a pixel and a reference color.
 */
function colorDistance(pixels, pixelIndex, refColor) {
  const pi = pixelIndex * 4;
  const dr = pixels[pi] - refColor[0];
  const dg = pixels[pi + 1] - refColor[1];
  const db = pixels[pi + 2] - refColor[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Compute distance from each background pixel to the nearest foreground pixel.
 * Uses BFS from the boundary (foreground pixels adjacent to background).
 * Only computes up to featherRadius distance.
 */
function computeFeatherDistances(bgMask, distMap, w, h, featherRadius) {
  const totalPixels = w * h;
  const queue = [];

  // Find boundary foreground pixels (foreground pixels next to background)
  for (let i = 0; i < totalPixels; i++) {
    if (bgMask[i]) continue; // skip background

    const x = i % w;
    const y = (i - x) / w;
    let isBoundary = false;

    if (x > 0 && bgMask[i - 1]) isBoundary = true;
    if (!isBoundary && x < w - 1 && bgMask[i + 1]) isBoundary = true;
    if (!isBoundary && y > 0 && bgMask[i - w]) isBoundary = true;
    if (!isBoundary && y < h - 1 && bgMask[i + w]) isBoundary = true;

    if (isBoundary) {
      // This foreground pixel is at the boundary — BFS outward into background
      // Mark adjacent background pixels with distance 1
      const neighbors = [];
      if (x > 0) neighbors.push(i - 1);
      if (x < w - 1) neighbors.push(i + 1);
      if (y > 0) neighbors.push(i - w);
      if (y < h - 1) neighbors.push(i + w);

      for (const nIdx of neighbors) {
        if (bgMask[nIdx] && (distMap[nIdx] === 0 || distMap[nIdx] > 1)) {
          distMap[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }
  }

  // BFS outward from distance-1 background pixels
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const currentDist = distMap[idx];

    if (currentDist >= featherRadius) continue;

    const x = idx % w;
    const y = (idx - x) / w;
    const nextDist = currentDist + 1;

    const neighbors = [];
    if (x > 0) neighbors.push(idx - 1);
    if (x < w - 1) neighbors.push(idx + 1);
    if (y > 0) neighbors.push(idx - w);
    if (y < h - 1) neighbors.push(idx + w);

    for (const nIdx of neighbors) {
      if (bgMask[nIdx] && (distMap[nIdx] === 0 || distMap[nIdx] > nextDist)) {
        distMap[nIdx] = nextDist;
        queue.push(nIdx);
      }
    }
  }
}

/**
 * Compute the median of an array of numbers.
 */
function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export default removeBackground;
