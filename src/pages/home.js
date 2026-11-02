import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, curtainOpen } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { renderStatus } from '../lib/hours.js';
import { CARS, rs, monthly } from '../data.js';

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
   Pressing it plays a real engine recording (public/intro/engine.mp3, built from two CC0 Freesound
   recordings: an Aston Martin Rapide cold start and a Mercedes S63 AMG V8 revving) and the picture is
   keyed to the moments in that recording, driven by the audio clock so the two can never drift:
     0.9s  the engine catches: jolt, the light signature sweeps on from the grille outwards
     idle  the camera creeps in, the glow breathes
     4.7s  first rev: high beams flash
     5.9s  second, sustained rev: flash, the camera pulls back and the forest lights up
     7.2s  third rev: a last pulse of light as the page lands */

function engineUrl() { return new URL('intro/engine.mp3', document.baseURI).href; }

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

/** Fetch and decode the engine recording while the visitor looks at the start button. */
function prepareSound() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC(); // starts suspended until the tap
  const buffer = fetch(engineUrl()).then((r) => r.arrayBuffer()).then((b) => new Promise((ok, bad) => ctx.decodeAudioData(b, ok, bad))).catch(() => null);
  return { ctx, buffer };
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
  const audio = prepareSound();

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
  // resume audio inside the tap itself (iOS and Safari require it)
  if (choice === 'sound' && audio) audio.ctx.resume();
  await gsap.to(gate, { opacity: 0, scale: 0.96, duration: 0.3, ease: 'power2.in' });
  gate.remove();

  if (choice === 'skip') {
    audio?.ctx.close();
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

  const [buffer] = await Promise.all([choice === 'sound' && audio ? audio.buffer : null, waitForPhoto()]);
  geo = layoutScene();

  // the light signature sweeps on from the grille outwards: an inset clip opening from the centre
  const sweep = { p: 0 };
  const clip = () => {
    const l = geo.mx * (1 - sweep.p), r = (geo.iw - geo.mx) * (1 - sweep.p);
    lights.style.clipPath = glow.style.clipPath = `inset(0 ${r}px 0 ${l}px)`;
  };
  const tl = gsap.timeline({ paused: true });
  const flash = (at, depth, rest = 0.86) => tl
    .to(dark, { keyframes: [{ opacity: depth, duration: 0.06 }, { opacity: rest, duration: 0.5, ease: 'power2.out' }] }, at)
    .to(glow, { keyframes: [{ opacity: 1, scale: 1.05, duration: 0.06 }, { opacity: 0.92, scale: 1, duration: 0.5 }] }, at)
    .to(flare, { keyframes: [{ opacity: 1, scaleX: 1.18, duration: 0.08 }, { opacity: 0.6, scaleX: 1, duration: 0.55 }] }, at);

  // crank (0.3 to 0.9s): the lamps dim and brighten with the starter
  tl.to(glow, { keyframes: [0.05, 0.01, 0.08, 0.02, 0.07].map((o) => ({ opacity: o, duration: 0.12 })) }, 0.3)
    .to(media, { keyframes: { x: [0, -1, 1, -1, 0], y: [0, 0.8, -0.8, 0.8, 0] }, duration: 0.6, ease: 'none' }, 0.3)
    // 0.9s: it catches
    .to(media, { keyframes: { x: [0, -7, 8, -5, 3, -1, 0], y: [0, 5, -4, 2, -1, 1, 0] }, duration: 0.5, ease: 'none' }, 0.9)
    .set(lights, { opacity: 1 }, 0.92)
    .add(clip, 0.92)
    .to(sweep, { p: 1, duration: 0.85, ease: 'power3.out', onUpdate: clip }, 0.92)
    .to(glow, { opacity: 0.95, duration: 1, ease: 'power2.out' }, 0.95)
    .to(dark, { opacity: 0.86, duration: 1.5, ease: 'power2.out' }, 1.0)
    .to(spill, { opacity: 1, scaleY: 1, duration: 1.2, ease: 'expo.out' }, 1.1)
    .to(haze, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.1)
    .to(flare, { opacity: 0.6, scaleX: 1, duration: 1.4, ease: 'expo.out' }, 1.0)
    // idle: the camera creeps in, the glow breathes
    .to(media, { scale: zoom * 1.08, rotation: -0.5, duration: 3.6, ease: 'sine.inOut' }, 1.4)
    .to(glow, { opacity: 0.8, duration: 0.7, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 1.9);
  // 4.7s: first rev
  flash(4.68, 0.42);
  // 5.9s: second rev, the camera pulls back hard and the forest lights up
  flash(5.86, 0.28);
  tl.to(media, { scale: 1, rotation: 0, x: 0, y: 0, duration: 2.6, ease: 'expo.inOut' }, 5.95)
    .to(dark, { opacity: 0, duration: 2.1, ease: 'power2.inOut' }, 6.3)
    // 7.2s: third rev, a last pulse of light as the scene opens up
    .to(glow, { keyframes: [{ opacity: 1, duration: 0.06 }, { opacity: 0.7, duration: 0.6 }] }, 7.18)
    .to(flare, { keyframes: [{ opacity: 0.9, scaleX: 1.3, duration: 0.08 }, { opacity: 0, scaleX: 1.7, duration: 1.1, ease: 'power2.out' }] }, 7.18)
    .to([spill, haze], { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 7.0)
    // the cut-out lights fade into the photo's own headlights, so nothing pops at the end
    .to([lights, glow], { opacity: 0, duration: 1.4, ease: 'power1.inOut' }, 8.0)
    .add(heroIn, 7.85)
    .to(['[data-nav]', '.tabbar'], { opacity: 1, duration: 0.9, ease: 'power2.out' }, 8.1);

  if (buffer) {
    // picture follows the audio clock: if a frame drops, the picture catches up instead of drifting
    const { ctx } = audio;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const vol = ctx.createGain(); vol.gain.value = 0.9;
    src.connect(vol).connect(ctx.destination);
    const t0 = ctx.currentTime + 0.05;
    src.start(t0);
    src.onended = () => ctx.close().catch(() => {});
    await new Promise((resolve) => {
      const tick = () => {
        const t = Math.max(0, ctx.currentTime - t0);
        tl.time(Math.min(t, tl.duration()));
        if (t >= tl.duration()) { gsap.ticker.remove(tick); resolve(); }
      };
      gsap.ticker.add(tick);
    });
  } else {
    audio?.ctx.close();
    tl.play();
    await tl;
  }
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
