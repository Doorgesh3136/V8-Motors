/**
 * Liquid glass. A panel only looks like glass if what's behind it bends, so each one gets a real lens: a small map, drawn here
 * for its exact size and corners, tells the browser how far to shift the page behind every point of it. Around the rim the page
 * is pulled inwards, the way a thick curved edge pulls it, and in the middle it is simply frosted so the words stay easy to read.
 *
 * Only Chrome and Edge can run an SVG filter behind an element, and only a real computer can do it on this many panels while the
 * page moves behind them. Everywhere else the plain blur in src/glass.css stays. If the machine turns out not to keep up, the
 * lenses are taken off again.
 */
import { modest } from './device.js';

const PANELS = '.car, .finder, .inv-filters, .calc, .wizard, .estimate, .finance-intro, .fin-mini-box, .contact-side, .garage, .tray-inner, .spec, .tool, .acc';
const html = document.documentElement;
const NS = 'http://www.w3.org/2000/svg';

/** One lens map: red and green say how far to shift the page there, blue says how frosted it is (white in the middle). */
function lensMap(w, h, r, bezel) {
  const q = w * h > 3e5 ? 0.5 : 1; // the map is smooth, so big panels can use a smaller one
  const cw = Math.ceil(w * q), ch = Math.ceil(h * q);
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(cw, ch), d = img.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = 128; d[i + 1] = 128; d[i + 2] = 255; d[i + 3] = 255; }
  const hx = w / 2 - r, hy = h / 2 - r, band = Math.max(bezel, r) + 1;
  const put = (px, py) => {
    const x = (px + 0.5) / q - w / 2, y = (py + 0.5) / q - h / 2;
    const dx = Math.abs(x) - hx, dy = Math.abs(y) - hy;
    const ox = Math.max(dx, 0), oy = Math.max(dy, 0), out = Math.hypot(ox, oy);
    const inside = r - out - Math.min(Math.max(dx, dy), 0); // how far in from the edge
    if (inside < 0 || inside >= bezel) { if (inside < 0) { const k = (py * cw + px) * 4; d[k + 2] = 0; } return; }
    const t = inside / bezel;
    let nx, ny; // which way is out
    if (out > 0) { nx = ox / out; ny = oy / out; } else if (dx > dy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
    nx *= Math.sign(x) || 1; ny *= Math.sign(y) || 1;
    const pull = (1 - t) ** 2.4; // strongest right at the edge, gone by the end of the curve
    const k = (py * cw + px) * 4;
    d[k] = Math.round(127.5 - nx * pull * 127.5);
    d[k + 1] = Math.round(127.5 - ny * pull * 127.5);
    d[k + 2] = Math.round(255 * t * t * (3 - 2 * t));
  };
  const bandX = Math.ceil(band * q), bandY = Math.ceil(band * q);
  for (let py = 0; py < ch; py++) {
    if (py < bandY || py >= ch - bandY) { for (let px = 0; px < cw; px++) put(px, py); continue; }
    for (let px = 0; px < bandX; px++) put(px, py);
    for (let px = cw - bandX; px < cw; px++) put(px, py);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export function initGlass() {
  const chromium = /Chrome\/\d/.test(navigator.userAgent);
  if (!chromium || modest || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const box = document.createElementNS(NS, 'svg');
  box.setAttribute('width', 0);
  box.setAttribute('height', 0);
  box.setAttribute('aria-hidden', 'true');
  box.style.position = 'absolute';
  document.body.append(box);

  const lenses = new Map();
  const lens = (w, h, r) => {
    const key = `${w}x${h}x${r}`;
    if (lenses.has(key)) return lenses.get(key);
    const bezel = Math.min(Math.max(10, Math.min(w, h) * 0.2), 30), shift = bezel * 1.7, id = `lens-${lenses.size}`;
    box.insertAdjacentHTML('beforeend', `<filter id="${id}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage href="${lensMap(w, h, r, bezel)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${(shift * 2).toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="warped"/>
      <feComponentTransfer in="warped" result="bent"><feFuncR type="linear" slope="1.1"/><feFuncG type="linear" slope="1.1"/><feFuncB type="linear" slope="1.1"/></feComponentTransfer>
      <feGaussianBlur in="warped" stdDeviation="5" result="soft"/>
      <feColorMatrix in="map" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0" result="frost"/>
      <feComposite in="soft" in2="frost" operator="in" result="middle"/>
      <feMerge><feMergeNode in="bent"/><feMergeNode in="middle"/></feMerge>
    </filter>`);
    lenses.set(key, id);
    return id;
  };

  const fit = (el) => {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
    const value = `url(#${lens(w, h, r)}) saturate(1.8)`;
    el.style.backdropFilter = value;
    el.style.webkitBackdropFilter = value;
  };
  const watch = new ResizeObserver((list) => { for (const e of list) fit(e.target); });
  const panels = [...document.querySelectorAll(PANELS)];
  panels.forEach((el) => watch.observe(el));
  html.classList.add('lens');

  // can this machine keep it up? Judged only while the page behind the panels is actually moving and on show
  let frames = 0, from = performance.now(), last = from, slow = 0;
  const check = (now) => {
    const gap = now - last;
    last = now;
    if (document.hidden || gap > 400 || html.classList.contains('hero-cover') || html.classList.contains('play-intro')) { frames = 0; from = now; requestAnimationFrame(check); return; }
    frames++;
    if (now - from >= 2000) {
      slow = (frames * 1000) / (now - from) < 36 ? slow + 1 : 0;
      frames = 0; from = now;
      if (slow >= 2) {
        watch.disconnect();
        panels.forEach((el) => { el.style.backdropFilter = ''; el.style.webkitBackdropFilter = ''; });
        html.classList.remove('lens');
        html.classList.add('lite');
        box.remove();
        return;
      }
    }
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}
