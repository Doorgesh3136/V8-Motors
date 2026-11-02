import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, curtainOpen } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { renderStatus } from '../lib/hours.js';
import { CARS, rs, monthly } from '../data.js';

import { createEngine } from '../lib/engine-sound.js';

const LAMPS = [[0.352, 0.66], [0.615, 0.66]]; // headlight centres as fractions of the photo

const media = $('[data-hero-media]');
const img = $('[data-hero-img]');
const lights = $('[data-lights]');
const glow = $('[data-glow]');
const flare = $('[data-flare]');

const { lenis } = initLayout({ home: true });
wireCardActions();
renderStatus($('[data-open-status]'));

const playIntro = document.documentElement.classList.contains('play-intro');
if (playIntro) {
  // a refresh always lands at the top of the home page, wherever you were
  const top = () => { scrollTo(0, 0); lenis?.scrollTo(0, { immediate: true, force: true }); };
  top();
  addEventListener('load', top, { once: true });
  lenis?.stop();
}

runIntro().then(async () => {
  document.documentElement.classList.remove('play-intro');
  addEventListener('resize', layoutScene);
  lenis?.start();
  if (!heroStarted) { await curtainOpen; heroIn(); }
  setupSearch();
  setupChecks();
  setupMoney();
  ScrollTrigger.refresh();
});

/* ================================================================== intro
   Browsers only allow sound after a tap, so the intro opens on the car's start button in the dark.
   Pressing it runs one continuous shot on the real hero photo, about seven seconds:
   crank (the lamps dim and brighten with the starter) -> the engine catches (jolt, the light signature
   sweeps on from the grille outwards) -> idle burble -> a blip of the throttle with a high-beam flash ->
   full rev with a second flash as the camera pulls back and the forest lights up -> the headline lands.
   One GSAP timeline drives both picture and sound (engine rpm and throttle are tweened in it). */

/** Where the headlights sit on screen (the photo is object-fit: cover). */
function layoutScene() {
  const W = img.offsetWidth, H = img.offsetHeight, bx = img.offsetLeft, by = img.offsetTop;
  const nw = img.naturalWidth || 2200, nh = img.naturalHeight || 1480;
  const k = Math.max(W / nw, H / nh);
  const w = nw * k, h = nh * k;
  const ox = bx + (W - w) * 0.5, oy = by + (H - h) * 0.6;
  const pts = LAMPS.map(([x, y]) => [ox + x * w, oy + y * h]);
  const mx = (pts[0][0] + pts[1][0]) / 2, my = pts[0][1];
  media.style.setProperty('--u', `${w / 100}px`);
  media.style.transformOrigin = `${mx}px ${my}px`;
  flare.style.top = `${my}px`;
  const spill = $('[data-spill]'), haze = $('[data-haze]');
  spill.style.left = haze.style.left = `${mx}px`;
  spill.style.top = `${my + h * 0.05}px`;
  haze.style.top = `${my}px`;
  return { W: media.clientWidth, sep: pts[1][0] - pts[0][0], mx: mx - bx, iw: W };
}

function waitForPhoto() {
  const loaded = img.complete && img.naturalWidth ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const decoded = loaded.then(() => img.decode?.().catch(() => {}));
  return Promise.race([Promise.all([decoded, document.fonts.ready]), new Promise((r) => setTimeout(r, 5000))]);
}

function waitForChoice(gate) {
  return new Promise((resolve) => {
    let done = false;
    const pick = (v) => () => { if (done) return; done = true; removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') pick('skip')(); };
    $('[data-ignite]', gate).addEventListener('click', pick('sound'));
    $('[data-ignite-quiet]', gate).addEventListener('click', pick('quiet'));
    $('[data-skip]', gate).addEventListener('click', pick('skip'));
    addEventListener('keydown', onKey);
    $('[data-ignite]', gate).focus({ preventScroll: true });
  });
}

async function runIntro() {
  if (!playIntro) return;
  const dark = $('[data-hero-dark]');
  const spill = $('[data-spill]'), haze = $('[data-haze]');
  const gate = $('[data-gate]');

  let geo = layoutScene();
  img.addEventListener('load', () => (geo = layoutScene()), { once: true });
  const zoom = gsap.utils.clamp(1.25, 2.4, (0.62 * geo.W) / geo.sep);
  gsap.set(media, { scale: zoom, rotation: -1.4 });
  gsap.set([lights, glow], { opacity: 0 });
  gsap.set(flare, { opacity: 0, scaleX: 0.05 });
  gsap.set(spill, { opacity: 0, scaleY: 0.4, transformOrigin: '50% 0%' });
  gsap.set(haze, { opacity: 0.3 }); // a little atmosphere while you decide
  gsap.from(gate.children, { opacity: 0, y: 16, duration: 0.9, stagger: 0.1, ease: 'expo.out', delay: 0.2 });

  const choice = await waitForChoice(gate);
  await gsap.to(gate, { opacity: 0, scale: 0.96, duration: 0.35, ease: 'power2.in' });
  gate.remove();

  if (choice === 'skip') {
    await gsap.timeline()
      .to(media, { scale: 1, rotation: 0, duration: 1.1, ease: 'expo.inOut' }, 0)
      .to(dark, { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
      .to(haze, { opacity: 0, duration: 0.6 }, 0)
      .to(['[data-nav]', '.tabbar'], { opacity: 1, duration: 0.6 }, 0.4)
      .add(heroIn, 0.45);
    gsap.set(media, { clearProps: 'transform' });
    gsap.set(['[data-nav]', '.tabbar'], { clearProps: 'opacity' });
    return;
  }

  const sound = choice === 'sound' ? createEngine() : null;
  if (sound) await sound.start();
  await waitForPhoto();
  geo = layoutScene();

  // the light signature sweeps on from the grille outwards: an inset clip opening from the centre
  const sweep = { p: 0 };
  const clip = () => {
    const l = geo.mx * (1 - sweep.p), r = (geo.iw - geo.mx) * (1 - sweep.p);
    lights.style.clipPath = glow.style.clipPath = `inset(0 ${r}px 0 ${l}px)`;
  };
  const eng = { rpm: 0, thr: 0 };
  const tl = gsap.timeline({ paused: true, onUpdate: () => sound?.set(eng.rpm, eng.thr) });
  const flash = (at, depth) => tl
    .to(dark, { keyframes: [{ opacity: depth, duration: 0.06 }, { opacity: 0.86, duration: 0.45, ease: 'power2.out' }] }, at)
    .to(glow, { keyframes: [{ opacity: 1, scale: 1.04, duration: 0.06 }, { opacity: 0.92, scale: 1, duration: 0.45 }] }, at)
    .to(flare, { keyframes: [{ opacity: 1, scaleX: 1.15, duration: 0.08 }, { opacity: 0.6, scaleX: 1, duration: 0.5 }] }, at);

  // 1. crank: the lamps dim and brighten with the starter's load
  tl.call(() => sound?.crank(true), null, 0)
    .to(glow, { keyframes: [0.07, 0.02, 0.1, 0.03, 0.09, 0.02, 0.12, 0.04].map((o) => ({ opacity: o, duration: 0.14 })) }, 0)
    .to(media, { keyframes: { x: [0, -1.2, 1, -1, 1.2, -1, 1, 0], y: [0, 0.8, -1, 1, -0.8, 1, -1, 0] }, duration: 1.15, ease: 'none' }, 0.05)
    // 2. it catches
    .call(() => { sound?.crank(false); sound?.ignite(); }, null, 1.25)
    .to(eng, { rpm: 1800, thr: 0.65, duration: 0.22, ease: 'power2.out' }, 1.25)
    .to(eng, { rpm: 760, thr: 0.08, duration: 1.2, ease: 'power3.out' }, 1.5)
    .to(media, { keyframes: { x: [0, -6, 7, -4, 3, -1, 0], y: [0, 4, -3, 2, -1, 1, 0] }, duration: 0.45, ease: 'none' }, 1.25)
    .set(lights, { opacity: 1 }, 1.3)
    .add(clip, 1.3)
    .to(sweep, { p: 1, duration: 0.8, ease: 'power3.out', onUpdate: clip }, 1.3)
    .to(glow, { opacity: 0.92, duration: 1, ease: 'power2.out' }, 1.35)
    .to(dark, { opacity: 0.86, duration: 1.4, ease: 'power2.out' }, 1.4)
    .to(spill, { opacity: 1, scaleY: 1, duration: 1.1, ease: 'expo.out' }, 1.5)
    .to(haze, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 1.5)
    .to(flare, { opacity: 0.6, scaleX: 1, duration: 1.3, ease: 'expo.out' }, 1.45)
    // a slow camera creep towards the car through the idle, so the shot never sits still
    .to(media, { scale: zoom * 1.07, rotation: -0.6, duration: 3.6, ease: 'sine.inOut' }, 1.6)
    // 3. idle: the glow breathes with the burble
    .to(eng, { keyframes: { rpm: [760, 720, 795, 735, 770, 750] }, duration: 1.1, ease: 'none' }, 2.7)
    .to(glow, { opacity: 0.8, duration: 0.55, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 2.7);
  // 4. a blip of the throttle, high beams flash
  tl.to(eng, { rpm: 3400, thr: 0.9, duration: 0.18, ease: 'power2.out' }, 3.85)
    .to(eng, { rpm: 900, thr: 0.1, duration: 0.6, ease: 'power2.in' }, 4.05);
  flash(3.97, 0.45);
  // 5. full rev, second flash, the camera pulls back as the forest lights up
  tl.to(eng, { rpm: 5900, thr: 1, duration: 0.5, ease: 'power2.out' }, 4.8);
  flash(5.05, 0.3);
  tl.to(media, { scale: 1, rotation: 0, x: 0, y: 0, duration: 2.3, ease: 'expo.inOut' }, 5.1)
    .to(eng, { rpm: 2300, thr: 0.35, duration: 1.2, ease: 'power2.inOut' }, 5.4)
    .to(eng, { rpm: 800, thr: 0.04, duration: 1.4, ease: 'power2.out' }, 6.6)
    .to(dark, { opacity: 0, duration: 1.9, ease: 'power2.inOut' }, 5.3)
    .to(flare, { opacity: 0, scaleX: 1.6, duration: 1.3, ease: 'power2.out' }, 5.6)
    .to([spill, haze], { opacity: 0, duration: 1.4, ease: 'power2.inOut' }, 5.6)
    // the cut-out lights fade into the photo's own headlights, so nothing pops at the end
    .to([lights, glow], { opacity: 0, duration: 1.3, ease: 'power1.inOut' }, 6.3)
    .to(['[data-nav]', '.tabbar'], { opacity: 1, duration: 0.9, ease: 'power2.out' }, 6.3)
    .add(heroIn, 6.15)
    .call(() => sound?.stop(1.8), null, 7.0);

  tl.play();
  await tl;
  gsap.set(media, { clearProps: 'transform' });
  gsap.set([lights, glow], { clearProps: 'clipPath' });
  gsap.set(['[data-nav]', '.tabbar'], { clearProps: 'opacity' }); // never touch the nav's transform: it slides via CSS
}

/* ================================================================== hero: headline rises (transform only, no reflow) */
let heroStarted = false;
function heroIn() {
  heroStarted = true;
  gsap.set('.hero-inner', { opacity: 1 });
  if (reduced) return;
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from($$('[data-hero-title] .line > span'), { yPercent: 120, skewY: 8, transformOrigin: '0% 100%', duration: 1.15, stagger: 0.09 })
    .from('[data-hero-fade]', { opacity: 0, y: 32, duration: 1, stagger: 0.1, clearProps: 'opacity,transform' }, 0.3);
}

/* ================================================================== search */
function setupSearch() {
  const f = $('[data-search]');
  const out = $('[data-search-count]');
  const count = () => {
    const make = f.make.value, body = f.body.value, max = +f.max.value || Infinity;
    const n = CARS.filter((c) => (!make || c.make === make) && (!body || c.body === body) && c.price <= max).length;
    out.textContent = n;
    f.querySelector('button').disabled = n === 0;
  };
  f.addEventListener('change', count);
  // keep the URL tidy: empty fields are left out
  f.addEventListener('submit', () => $$('select', f).forEach((s) => { s.disabled = !s.value; }));
  addEventListener('pageshow', () => $$('select', f).forEach((s) => (s.disabled = false)));
  count();
}

/* ================================================================== inspection hotspots */
function setupChecks() {
  const all = $$('[data-point]');
  all.forEach((b) => b.addEventListener('click', () => all.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.point === b.dataset.point)))));
}

/* ================================================================== monthly cost teaser */
function setupMoney() {
  const input = $('[data-money]');
  const shown = { v: monthly(+input.value) };
  const update = () => {
    const price = +input.value;
    input.style.setProperty('--p', ((price - input.min) / (input.max - input.min)) * 100 + '%');
    $('[data-money-price]').textContent = rs(price);
    gsap.to(shown, { v: monthly(price), duration: reduced ? 0 : 0.5, ease: 'expo.out', onUpdate: () => ($('[data-money-out]').textContent = rs(Math.round(shown.v / 100) * 100)) });
    const lo = Math.round((price * 0.8) / 50000) * 50000, hi = Math.round((price * 1.2) / 50000) * 50000;
    const n = CARS.filter((c) => c.price >= lo && c.price <= hi).length;
    const m = $('[data-money-match]');
    m.textContent = n ? `See the ${n} car${n === 1 ? '' : 's'} we have around this price` : 'Nothing in stock at this price right now. See everything we have.';
    m.href = n ? `inventory.html?price=${lo}-${hi}` : 'inventory.html';
    $('[data-money-link]').href = `finance.html?price=${price}`;
  };
  input.addEventListener('input', update);
  update();
}
