/**
 * The sky at the bottom of every page is the real sky over the showroom, right now.
 * - The sun and moon are worked out from the date and the showroom's position (low-precision almanac formulas), so that
 *   part needs no network and is right for every visitor, wherever they are. The moon shows its true phase.
 * - The clouds and rain are the current forecast from MET Norway. It is only asked for as the footer comes near, about the
 *   showroom's position and never the visitor's, and once per half hour per tab. If it can't be reached the sky is simply clear.
 * The sun comes up behind Pieter Both and goes down behind Le Pouce, which is what you see from the Royal Road.
 */
import gsap from 'gsap';
import { DEALER } from '../dealer.js';
import { setDawn } from './bg.js';

const RAD = Math.PI / 180, { lat, lon } = DEALER.position;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const wrap = (d) => ((d + 540) % 360) - 180; // degrees, into -180..180

/* ------------------------------------------------------------------ the almanac */
const place = (ra, dec, days) => {
  const hour = wrap(280.46061837 + 360.98564736629 * days + lon - ra / RAD);
  const alt = Math.asin(Math.sin(lat * RAD) * Math.sin(dec) + Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(hour * RAD)) / RAD;
  return { alt, hour };
};
const equatorial = (l, b, days) => {
  const e = (23.439 - 4e-7 * days) * RAD;
  return [Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)), Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l))];
};

/** Where the sun and moon are, and how much of the moon is lit. */
export function almanac(now) {
  const days = now / 864e5 - 10957.5; // days since noon on 1 Jan 2000
  const g = (357.529 + 0.98560028 * days) * RAD;
  const sunLong = (280.459 + 0.98564736 * days + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const M = (134.963 + 13.064993 * days) * RAD, F = (93.272 + 13.22935 * days) * RAD;
  const moonLong = (218.316 + 13.176396 * days + 6.289 * Math.sin(M)) * RAD, moonLat = 5.128 * Math.sin(F) * RAD;
  const age = (((moonLong - sunLong) / RAD) % 360 + 360) % 360; // 0 new, 180 full
  const sun = place(...equatorial(sunLong, 0, days), days), moon = place(...equatorial(moonLong, moonLat, days), days);
  return { sun, moon, lit: (1 - Math.cos(age * RAD) * Math.cos(moonLat)) / 2, waxing: age < 180 };
}

/* ------------------------------------------------------------------ the colours, by the height of the sun */
// bottom of the sky to the top, then the far and near ridges, the clouds and how warm the page's own glow is
const KEYS = [
  [-12, ['#1b2547', '#151e3c', '#101832', '#0c1328', '#0a1021'], '#151b33', '#0e1224', '#2b3250', 0.1],
  [-5, ['#e58f68', '#b45f7c', '#674a84', '#3a3a72', '#232751'], '#3b3057', '#231f3e', '#6d5478', 0.5],
  [1.5, ['#ffd9a0', '#ffc27f', '#ec8f6e', '#ad6a7c', '#5f5579'], '#a0607a', '#40305a', '#ffcfae', 1],
  [12, ['#fdf0cf', '#cfe3e8', '#8fc3de', '#5b97c9', '#3f6ea6'], '#5c8f86', '#245c50', '#fff6ea', 0.6],
  [30, ['#d9eefa', '#a9d8f2', '#5fb0e6', '#2f7fc8', '#2a5f9e'], '#46906c', '#1c5a42', '#ffffff', 0.4],
];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => `#${c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
const mixHex = (a, b, t) => { const x = rgb(a), y = rgb(b); return x.map((v, i) => v + (y[i] - v) * t); };
const grey = ([r, g, b], amount, dark) => { const l = 0.3 * r + 0.59 * g + 0.11 * b; return [r, g, b].map((v) => (v + (l - v) * amount) * dark); };

function palette(alt, cloud, wet) {
  let i = 0;
  while (i < KEYS.length - 2 && alt > KEYS[i + 1][0]) i++;
  const [a, b] = [KEYS[i], KEYS[i + 1]], t = smooth(a[0], b[0], alt);
  const dull = Math.pow(cloud, 1.4) * 0.72, dark = 1 - cloud * 0.22 - wet * 0.22;
  const paint = (x, y, k = 1, shade = 1) => hex(grey(mixHex(x, y, t), dull * k, (1 - (1 - dark) * k) * shade));
  const heavy = Math.pow(cloud, 2);
  return {
    sky: a[1].map((c, n) => paint(c, b[1][n], 1, 1 - heavy * 0.1 * n)), // darker up where the headline sits
    far: paint(a[2], b[2], 0.6), near: paint(a[3], b[3], 0.6),
    cloud: paint(a[4], b[4], 0.4, 1 - heavy * 0.42 - wet * 0.14), warm: a[5] + (b[5] - a[5]) * t,
  };
}

/* ------------------------------------------------------------------ the forecast */
const CACHE = 'v8:sky', KEEP = 30 * 60 * 1000;
const WORDS = [[/thunder/, 'thunderstorms'], [/heavy/, 'heavy rain'], [/light/, 'light rain'], [/rain|shower|sleet/, 'rain'], [/fog/, 'fog']];

async function forecast() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CACHE) || 'null');
    if (saved && Date.now() - saved.at < KEEP) return saved;
  } catch { /* private mode: just ask */ }
  const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`weather answered ${res.status}`);
  const list = (await res.json()).properties.timeseries;
  const now = list.find((x) => Date.parse(x.time) + 36e5 > Date.now()) || list[0];
  const sky = now.data.instant.details, next = now.data.next_1_hours;
  const code = next?.summary?.symbol_code || '', rain = next?.details?.precipitation_amount ?? 0;
  const wet = /rain|shower|sleet|thunder/.test(code) || rain > 0.05;
  const out = {
    at: Date.now(), cloud: clamp((sky.cloud_area_fraction ?? 0) / 100), rain: wet ? clamp(0.35 + rain / 4) : 0,
    storm: /thunder/.test(code), fog: /fog/.test(code), temp: Math.round(sky.air_temperature), code,
  };
  try { sessionStorage.setItem(CACHE, JSON.stringify(out)); } catch { /* no matter */ }
  return out;
}

function describe(w, sunUp) {
  const said = WORDS.find(([re]) => re.test(w.code));
  if (said && (w.rain || w.fog || w.storm)) return said[1];
  if (w.cloud > 0.8) return 'cloudy';
  if (w.cloud > 0.3) return 'partly cloudy';
  return sunUp ? 'sunny' : 'clear night';
}

/* ------------------------------------------------------------------ drawing it */
function moonSvg(lit, waxing) {
  const k = clamp(lit, 0.05, 1), rx = (46 * Math.abs(1 - 2 * k)).toFixed(1);
  // from the southern hemisphere the waxing moon is lit on its left
  const shape = `M50 4A46 46 0 0 1 50 96A${rx} 46 0 0 ${k < 0.5 ? 0 : 1} 50 4Z`;
  return `<svg viewBox="0 0 100 100"><defs><clipPath id="moon-lit"><path d="${shape}"/></clipPath></defs>
    <circle class="moon-dark" cx="50" cy="50" r="46"/>
    <g transform="${waxing ? 'matrix(-1 0 0 1 100 0)' : ''}"><path class="moon-lit" d="${shape}"/>
      <g clip-path="url(#moon-lit)" class="moon-seas"><circle cx="34" cy="36" r="12"/><circle cx="55" cy="28" r="9"/><circle cx="63" cy="50" r="13"/><circle cx="42" cy="62" r="10"/><circle cx="68" cy="72" r="6"/><circle cx="28" cy="58" r="5"/></g></g></svg>`;
}

function starsSvg() {
  let seed = 8, dots = '';
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 130; i++) dots += `<circle cx="${(rnd() * 1600).toFixed(0)}" cy="${(rnd() * 620).toFixed(0)}" r="${(0.5 + rnd() * rnd() * 1.5).toFixed(1)}" opacity="${(0.3 + rnd() * 0.7).toFixed(2)}"/>`;
  return `<svg viewBox="0 0 1600 620" preserveAspectRatio="xMidYMax slice">${dots}</svg>`;
}

export function initSky({ reduced = false } = {}) {
  const box = document.querySelector('[data-horizon]'), sky = document.querySelector('.footer-sky');
  if (!box || !sky) return;
  const sun = box.querySelector('[data-sun]'), moon = box.querySelector('[data-moon]'), stars = box.querySelector('[data-stars]');
  const line = document.querySelector('[data-sky-now]');
  let weather = null, room = 400, phaseKey = '';

  const bodies = (el, body, lift, size) => {
    el.style.setProperty('--x', ((0.6668 - 0.2668 * clamp((body.hour + 100) / 200)) - 0.5).toFixed(4));
    el.style.setProperty('--lift', `${lift.toFixed(1)}px`);
    el.style.setProperty('--k', size.toFixed(3));
  };
  const height = (alt) => (alt > 0 ? room * Math.min(1, Math.sin(alt * RAD) / Math.sin(62 * RAD)) : alt * 7);

  const draw = () => {
    const a = almanac(Date.now()), w = weather || {}, alt = a.sun.alt;
    const cloud = w.cloud ?? 0, rain = w.rain ?? 0;
    const p = palette(alt, cloud, rain);
    p.sky.forEach((c, i) => sky.style.setProperty(`--sky-${i}`, c));
    sky.style.setProperty('--ridge-far', p.far);
    sky.style.setProperty('--ridge-near', p.near);
    sky.style.setProperty('--cloud-c', p.cloud);
    sky.style.setProperty('--cloud-a', smooth(0.08, 0.95, cloud).toFixed(3));
    sky.style.setProperty('--cloud-b', smooth(0.5, 1, cloud).toFixed(3));
    sky.style.setProperty('--rain', rain.toFixed(2));
    sky.style.setProperty('--fog', w.fog ? '.55' : '0');
    sky.classList.toggle('is-storm', !!w.storm);
    setDawn(p.warm * (1 - cloud * 0.5));

    // the sun: wide and amber on the horizon, small and white high up, and veiled by cloud
    bodies(sun, a.sun, height(alt), 0.52 + 0.48 * Math.exp(-Math.max(0, alt) / 13));
    sun.style.setProperty('--hot', smooth(3, 22, alt).toFixed(3));
    sun.style.opacity = (smooth(-5, -1, alt) * (1 - Math.pow(cloud, 2) * 0.82)).toFixed(3);

    // the moon: its true phase, kept in sight on any night it hasn't risen yet
    const night = smooth(-2, -7, alt);
    bodies(moon, a.moon, height(Math.max(a.moon.alt, 12)), 1);
    moon.style.opacity = (night * (1 - Math.pow(cloud, 2) * 0.72)).toFixed(3);
    const key = `${Math.round(a.lit * 40)}${a.waxing}`;
    if (night > 0 && key !== phaseKey) { phaseKey = key; moon.querySelector('[data-moon-face]').innerHTML = moonSvg(a.lit, a.waxing); }
    const starry = smooth(-4, -11, alt) * (1 - cloud * 0.95);
    if (starry > 0 && !stars.firstChild) stars.innerHTML = starsSvg();
    stars.style.opacity = starry.toFixed(3);

    if (line && weather) {
      line.hidden = false;
      line.textContent = `Coromandel now: ${w.temp}°, ${describe(w, alt > 0)}`;
    }
  };

  const measure = () => {
    // high in the sky means just under the buttons, never behind them
    const under = sky.querySelector('.footer-ways')?.getBoundingClientRect().bottom ?? sky.getBoundingClientRect().top;
    room = Math.max(40, box.getBoundingClientRect().top + box.offsetHeight * 0.14 - under - 76);
    draw();
  };
  measure();
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });

  if (!reduced) {
    gsap.fromTo([sun, moon], { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom 72%', scrub: true } });
  } else sky.classList.add('is-still');

  // the forecast is only asked for as the footer comes near, and the sky keeps up with the clock while it is in view
  let timer = 0;
  const ask = () => forecast().then((w) => { weather = w; draw(); }).catch(() => { /* a clear sky is a fine fallback */ });
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (!e.isIntersecting) return;
    if (!weather || Date.now() - weather.at > KEEP) ask();
    measure();
    timer = setInterval(() => { draw(); if (weather && Date.now() - weather.at > KEEP) ask(); }, 60000);
  }, { rootMargin: '700px 0px' }).observe(sky);
}
