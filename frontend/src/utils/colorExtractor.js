/**
 * Canvas-based dominant vibrant color extractor.
 * Downscales the image to 100×100, samples every pixel, filters out
 * near-whites, near-blacks, and low-saturation grays, then returns the
 * most frequent vibrant color as a hex string.
 *
 * @param {string} imageSrc – data URL or object URL of the image
 * @returns {Promise<string|null>} hex string (e.g. "#e74c3c") or null
 */
export function extractDominantColor(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxDim = 100; // downscale for speed
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width  = Math.max(1, Math.round(img.width  * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const buckets = {};
      const step = 16; // quantization bucket size

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;                      // transparent
        if (r > 200 && g > 200 && b > 200) continue; // near-white
        if (r < 50  && g < 50  && b < 50)  continue; // near-black

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (max - min < 30) continue;               // low-saturation gray

        // HSL saturation filter — require at least 25%
        const l = (max + min) / 2 / 255;
        const s = max === min
          ? 0
          : (max - min) / 255 / (l <= 0.5 ? 2 * l : 2 - 2 * l);
        if (s < 0.25) continue;

        const qr  = Math.round(r / step) * step;
        const qg  = Math.round(g / step) * step;
        const qb  = Math.round(b / step) * step;
        const key = `${qr},${qg},${qb}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }

      const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) { resolve(null); return; }

      const [r, g, b] = sorted[0][0].split(',').map(Number);
      const toHex = (c) => Math.min(255, c).toString(16).padStart(2, '0');
      resolve('#' + toHex(r) + toHex(g) + toHex(b));
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}
