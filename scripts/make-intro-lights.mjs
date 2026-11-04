// Draws the intro's headlight layers for the home page photo (a white Range Rover, Unsplash wrRhFFTySnc):
//   public/intro/lights.webp  2200 x 1511  the LED light signature, crisp, aligned to the photo pixel for pixel
//   public/intro/glow.webp    1100 x 756   the soft bloom around it (scaled up 2x on the page)
// Both share the photo's aspect ratio, so the page lays them over the photo with the same object-fit.
//
// The geometry was measured on the photo itself (bright LED pixels, sub-pixel centroids), in the photo's
// 400 px preview coordinates: an L-shaped daytime light on each headlamp and a slim strip low on each corner
// of the bumper. Change a number here and run:  node scripts/make-intro-lights.mjs
import sharp from 'sharp';

const SRC_W = 400; // the coordinates below are in a 400 px wide copy of the photo
const W = 2200, H = 1511; // the photo's aspect ratio (7104 x 4880)
const K = W / SRC_W;

// [x0, y0, x1, y1, brightness]
const LEDS = [
  // left headlamp: an upright blade at the outer edge, a bar along the bottom
  [118.3, 136.4, 117.1, 141.6, 1],
  [132.4, 147.2, 146.6, 147.2, 1],
  // right headlamp: blade, the faint link at its foot, and the bottom bar
  [281.0, 135.8, 281.6, 143.2, 1],
  [281.3, 143.4, 267.5, 143.6, 0.55],
  [252.0, 144.7, 266.6, 144.5, 1],
  // bumper strips
  [122.3, 202.9, 139.7, 204.0, 0.95],
  [276.6, 202.9, 259.1, 204.0, 0.95],
];
// the middle of each headlamp unit, for the soft bloom
const UNITS = [[132, 141.6], [267, 140.4]];

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function segDist(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
  const t = l2 ? Math.min(1, Math.max(0, ((px - x0) * dx + (py - y0) * dy) / l2)) : 0;
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

/** Paints shapes into an RGBA buffer: coverage combines like light (a screen-style union), and the colour
    is the coverage-weighted average of the shapes over that pixel. */
function layer(w, h, scale, paint) {
  const rgb = new Float32Array(w * h * 3), wsum = new Float32Array(w * h), a = new Float32Array(w * h);
  paint((x0, y0, x1, y1, pad, fn) => {
    const bx0 = Math.max(0, Math.floor(Math.min(x0, x1) * scale - pad)), bx1 = Math.min(w - 1, Math.ceil(Math.max(x0, x1) * scale + pad));
    const by0 = Math.max(0, Math.floor(Math.min(y0, y1) * scale - pad)), by1 = Math.min(h - 1, Math.ceil(Math.max(y0, y1) * scale + pad));
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const out = fn(x + 0.5, y + 0.5);
      if (!out) continue;
      const [al, r, g, b] = out, i = y * w + x;
      a[i] = 1 - (1 - a[i]) * (1 - al);
      wsum[i] += al; rgb[i * 3] += r * al; rgb[i * 3 + 1] += g * al; rgb[i * 3 + 2] += b * al;
    }
  });
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (a[i] <= 0.002) continue;
    buf[i * 4] = Math.round(rgb[i * 3] / wsum[i]);
    buf[i * 4 + 1] = Math.round(rgb[i * 3 + 1] / wsum[i]);
    buf[i * 4 + 2] = Math.round(rgb[i * 3 + 2] / wsum[i]);
    buf[i * 4 + 3] = Math.round(a[i] * 255);
  }
  return buf;
}

// the light signature: a hot white core with a thin cool bloom, like an LED strip seen at night
const lights = layer(W, H, K, (draw) => {
  for (const [x0, y0, x1, y1, br] of LEDS) {
    const core = 3.1, bloom = 13;
    draw(x0, y0, x1, y1, bloom * 3, (px, py) => {
      const d = segDist(px / K, py / K, x0, y0, x1, y1) * K;
      const c = (1 - smooth(core - 1.2, core + 1.2, d)) * br;
      const g = Math.exp(-((d / bloom) ** 2)) * 0.55 * br;
      const al = Math.max(c, g);
      if (al < 0.003) return null;
      const mix = c / Math.max(al, 1e-6); // 1 in the core (white), 0 in the bloom (cool blue-white)
      return [al, 255, 255 * (0.9 + 0.1 * mix), 255];
    });
  }
});

// the bloom: a bright soft heart on each lamp, a wide halo, and a little glow on the bumper strips
const GW = W / 2, GH = Math.round(H / 2), GK = GW / SRC_W;
const glow = layer(GW, GH, GK, (draw) => {
  for (const [cx, cy] of UNITS) {
    draw(cx - 16, cy - 10, cx + 16, cy + 10, 90, (px, py) => {
      const dx = (px / GK - cx) / 11, dy = (py / GK - cy) / 5.2; // the heart, wider than tall
      const hx = (px / GK - cx) / 30, hy = (py / GK - cy) / 15; // the halo
      const heart = Math.exp(-(dx * dx + dy * dy) * 1.6);
      const halo = Math.exp(-(hx * hx + hy * hy) * 2.2) * 0.45;
      const al = Math.max(heart, halo);
      return al < 0.003 ? null : [al, 214, 236, 255];
    });
  }
  for (const [x0, y0, x1, y1, br] of LEDS.slice(5)) {
    draw(x0, y0, x1, y1, 50, (px, py) => {
      const d = segDist(px / GK, py / GK, x0, y0, x1, y1);
      const al = Math.exp(-((d / 4.5) ** 2)) * 0.7 * br;
      return al < 0.003 ? null : [al, 214, 236, 255];
    });
  }
});

await sharp(lights, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile('public/intro/lights.webp');
await sharp(glow, { raw: { width: GW, height: GH, channels: 4 } }).webp({ quality: 80, alphaQuality: 85, effort: 6 }).toFile('public/intro/glow.webp');
console.log('public/intro/lights.webp', W, H, '| public/intro/glow.webp', GW, GH);
