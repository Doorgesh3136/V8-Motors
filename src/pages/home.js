import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, curtainOpen } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { renderStatus } from '../lib/hours.js';
import { CARS, byId, rs, monthly, thumb, carName } from '../data.js';
import { requestMotion } from '../lib/bg.js';

const LAMPS = [[0.352, 0.66], [0.615, 0.66]]; // headlight centres as fractions of the photo
const ENGINE = new URL('intro/engine.mp3', document.baseURI).href;
const NAVS = ['[data-nav]', '.tabbar'];
const GAIN = 0.8; // playback level (the recording itself is mastered quietly)

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
  setupSwap();
  heroDepth();
  ScrollTrigger.refresh();
});

/* ================================================================== hero depth
   After the intro, the photo sinks slowly as you scroll past it, and on phones it leans a few pixels
   with the device's tilt (once motion access is allowed). Transform only, one write per frame. */
function heroDepth() {
  if (reduced) return;
  const hero = $('.hero');
  let tx = 0, ty = 0, gx = 0, gy = 0, queued = false;
  const apply = () => {
    queued = false;
    const y = Math.min(scrollY, hero.offsetHeight);
    tx += (gx - tx) * 0.2; ty += (gy - ty) * 0.2;
    media.style.transform = `translate3d(${tx.toFixed(1)}px, ${(y * 0.28 + ty).toFixed(1)}px, 0) scale(${(1.06 + y / hero.offsetHeight * 0.06).toFixed(4)})`;
    if (Math.abs(gx - tx) > 0.2 || Math.abs(gy - ty) > 0.2) queue();
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(apply); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || scrollY > hero.offsetHeight) return;
    gx = Math.max(-1, Math.min(1, e.gamma / 30)) * -14;
    gy = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 30)) * -10;
    queue();
  }, { passive: true });
  // ease into the slight zoom that leaves room for the drift, then follow input directly
  media.style.transition = 'transform 1.4s cubic-bezier(.16, 1, .3, 1)';
  apply();
  setTimeout(() => { media.style.transition = ''; }, 1400);
}

/* ================================================================== intro
   Browsers only allow sound after a tap, so the intro opens on the car's start button in the dark.
   Pressing it plays a supercharged V8 modelled on the Range Rover's 5.0 (public/intro/engine.mp3, made by
   scripts/audio/engine.py). The picture runs on the audio clock, the headlight bloom and camera shake follow
   the recording's loudness frame by frame, and phones vibrate with the engine:
     0.30s  the starter cranks: the lamps flicker
     1.15s  it catches: jolt, the light signature sweeps on from the grille outwards
     idle   the camera creeps in, the light breathes with the burble
     3.90s  first blip: high beams flash, the camera punches in
     4.95s  harder blip with pops
     5.85s  launch: the camera rushes at the lamps, warp streaks, the limiter strobes the lights
     6.95s  gear change: a jolt, then it pulls again
     7.92s  backfire: white flash, the V8 Motors badge slams in, the letterbox opens, the camera pulls back
     8.65s  the badge flies up into the menu bar as the page appears */

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
  const spill = $('[data-spill]'), haze = $('[data-haze]'), bloom = $('[data-bloom]'), streaks = $('[data-streaks]');
  spill.style.left = haze.style.left = bloom.style.left = `${mx}px`;
  if (streaks) { streaks.style.left = `${mx}px`; streaks.style.top = `${my}px`; }
  spill.style.top = `${my + h * 0.05}px`;
  haze.style.top = bloom.style.top = `${my}px`;
  return { W: media.clientWidth, sep: pts[1][0] - pts[0][0], mx: mx - bx, iw: W, top: by, h: H };
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
  const buffer = fetch(ENGINE).then((r) => r.arrayBuffer()).then((b) => new Promise((ok, bad) => ctx.decodeAudioData(b, ok, bad))).catch(() => null);
  return { ctx, buffer };
}

/** Loudness of the recording, 60 values a second, 0 (idle) to 1 (the biggest rev). */
function envelope(buffer) {
  if (!buffer) return null;
  const d = buffer.getChannelData(0), hop = Math.round(buffer.sampleRate / 60), out = new Float32Array(Math.ceil(d.length / hop));
  for (let i = 0; i < out.length; i++) {
    let s = 0; const a = i * hop, b = Math.min(d.length, a + hop * 2);
    for (let j = a; j < b; j++) s += d[j] * d[j];
    const db = 10 * Math.log10(s / Math.max(1, b - a) + 1e-12);
    out[i] = Math.min(1, Math.max(0, (db + 33) / 21)); // -33 dBFS (idle) .. -12 dBFS (launch, backfire)
  }
  return out;
}

function waitForChoice(gate) {
  return new Promise((resolve) => {
    let done = false;
    const pick = (v) => () => { if (done) return; done = true; if (v !== 'skip') requestMotion(); removeEventListener('keydown', onKey); resolve(v); };
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
  const spill = $('[data-spill]'), haze = $('[data-haze]'), bloom = $('[data-bloom]');
  const gate = $('[data-gate]'), bars = $$('[data-bars] > span'), badge = $('[data-badge]');
  const controls = $('[data-intro-controls]');
  const streaks = $('[data-streaks]'), whiteout = $('[data-whiteout]');
  const audio = prepareSound();

  let geo = layoutScene();
  img.addEventListener('load', () => (geo = layoutScene()), { once: true });
  const phone = innerWidth < 700;
  const zoom = gsap.utils.clamp(1.25, phone ? 1.9 : 2.4, (0.62 * geo.W) / geo.sep);
  gsap.set(media, { scale: zoom, rotation: -1.4 });
  gsap.set([lights, glow, bloom], { opacity: 0 });
  gsap.set(flare, { opacity: 0, scaleX: 0.05 });
  gsap.set(spill, { opacity: 0, scaleY: 0.4, transformOrigin: '50% 0%' });
  gsap.set(haze, { opacity: 0.3 }); // a little atmosphere while you decide
  gsap.set(badge, { opacity: 0 });
  gsap.from(gate.children, { opacity: 0, y: 16, duration: 0.9, stagger: 0.1, ease: 'expo.out', delay: 0.2 });
  gsap.from(bars, { scaleY: 0, duration: 1.2, ease: 'expo.out' });

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
      .to(bars, { scaleY: 0, duration: 0.8, ease: 'expo.inOut' }, 0)
      .to(NAVS, { opacity: 1, duration: 0.6 }, 0.4)
      .add(heroIn, 0.45);
    finishIntro();
    return;
  }

  const [buffer] = await Promise.all([audio ? audio.buffer : null, waitForPhoto()]);
  const env = envelope(buffer);
  const withSound = choice === 'sound' && buffer;
  if (!withSound) audio?.ctx.close();
  geo = layoutScene();

  // where the badge sits: in the sky above the car, then it flies into the menu bar
  const placeBadge = () => {
    const portrait = innerHeight > innerWidth * 1.25;
    const size = portrait ? Math.min(innerWidth * 0.34, 150) : gsap.utils.clamp(130, 230, innerWidth * 0.14);
    const cy = portrait ? geo.top + geo.h * 0.24 : innerHeight * 0.27;
    gsap.set(badge, { width: size, left: innerWidth / 2 - size / 2, top: cy - size * 0.47 });
  };
  placeBadge();

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
    .to(flare, { keyframes: [{ opacity: 1, scaleX: 1.25, duration: 0.08 }, { opacity: 0.6, scaleX: 1, duration: 0.55 }] }, at);

  const buzz = (pattern) => () => { if (withSound) navigator.vibrate?.(pattern); };
  // crank (0.3 to 1.15s): the lamps dim and brighten with the starter
  tl.add(buzz([45, 30, 45, 30, 45, 30, 45, 30, 45, 30, 45, 30, 45, 30, 45]), 0.3)
    .to(glow, { keyframes: [0.05, 0.01, 0.08, 0.02, 0.07, 0.015, 0.09].map((o) => ({ opacity: o, duration: 0.12 })) }, 0.3)
    .to(media, { keyframes: { x: [0, -1, 1, -1, 1, -1, 0], y: [0, 0.8, -0.8, 0.8, -0.8, 0.8, 0] }, duration: 0.8, ease: 'none' }, 0.32)
    // 1.15s: it catches
    .add(buzz([140]), 1.15)
    .to(media, { keyframes: { x: [0, -9, 10, -6, 3, -1, 0], y: [0, 7, -4, 2, -1, 1, 0] }, duration: 0.5, ease: 'none' }, 1.13)
    .set(lights, { opacity: 1 }, 1.15)
    .add(clip, 1.15)
    .to(sweep, { p: 1, duration: 0.8, ease: 'power3.out', onUpdate: clip }, 1.15)
    .to(glow, { opacity: 0.95, duration: 1, ease: 'power2.out' }, 1.18)
    .to(dark, { opacity: 0.86, duration: 1.5, ease: 'power2.out' }, 1.2)
    .to(spill, { opacity: 1, scaleY: 1, duration: 1.2, ease: 'expo.out' }, 1.3)
    .to(haze, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.3)
    .to(flare, { opacity: 0.6, scaleX: 1, duration: 1.4, ease: 'expo.out' }, 1.2)
    // idle: the camera creeps in
    .to(media, { scale: zoom * 1.06, rotation: -0.6, duration: 2.2, ease: 'sine.inOut' }, 1.7);
  // 3.9s and 4.95s: two blips, the camera punches in on each
  flash(3.88, 0.42);
  tl.add(buzz([70]), 3.9)
    .to(media, { keyframes: [{ scale: zoom * 1.13, duration: 0.14, ease: 'power3.out' }, { scale: zoom * 1.08, duration: 0.6, ease: 'power2.out' }] }, 3.9);
  flash(4.93, 0.3);
  tl.add(buzz([110]), 4.95)
    .to(media, { keyframes: [{ scale: zoom * 1.17, duration: 0.14, ease: 'power3.out' }, { scale: zoom * 1.1, duration: 0.6, ease: 'power2.out' }] }, 4.95)
    // 5.25s: tension before the launch. The dark closes in, the letterbox tightens
    .to(dark, { opacity: 0.93, duration: 0.6, ease: 'power2.in' }, 5.25)
    .to(bars, { scaleY: 1.5, duration: 0.6, ease: 'power2.in' }, 5.25)
    // 5.85s: launch. The camera rushes at the lamps, warp streaks stream past
    .add(buzz([420, 40, 300]), 5.85)
    .to(dark, { opacity: 0.7, duration: 0.3, ease: 'power2.out' }, 5.85)
    .to(media, { scale: zoom * 1.55, rotation: 0.4, duration: 1.1, ease: 'power2.in' }, 5.85)
    .fromTo(streaks, { opacity: 0, scale: 0.6 }, { opacity: 0.9, scale: 1.25, duration: 1.0, ease: 'power2.in' }, 5.85)
    .to(glow, { opacity: 1, duration: 0.2 }, 5.85)
    .to(flare, { opacity: 1, scaleX: 1.4, duration: 0.9, ease: 'power2.in' }, 5.85)
    // 6.75s: on the limiter, the lights strobe
    .to(glow, { keyframes: [1, 0.55, 1, 0.5, 1, 0.55, 1].map((o) => ({ opacity: o, duration: 0.03 })) }, 6.75)
    // 6.95s: gear change, a jolt and a breath, then it pulls again
    .add(buzz([80, 60, 500]), 6.95)
    .to(media, { keyframes: [{ scale: zoom * 1.45, duration: 0.1, ease: 'power2.out' }, { scale: zoom * 1.75, duration: 0.75, ease: 'power2.in' }] }, 6.95)
    .to(streaks, { keyframes: [{ opacity: 0.5, duration: 0.1 }, { opacity: 1, scale: 1.6, duration: 0.7, ease: 'power2.in' }] }, 6.95)
    // 7.75s: lift off, the streaks fall away as it crackles
    .to(streaks, { opacity: 0, scale: 2, duration: 0.25, ease: 'power2.out' }, 7.75)
    // 7.92s: backfire. Flash, the badge slams in, the letterbox opens, the camera pulls back and the forest lights up
    .add(buzz([260]), 7.92)
    .fromTo(whiteout, { opacity: 0 }, { keyframes: [{ opacity: 0.85, duration: 0.04 }, { opacity: 0, duration: 0.7, ease: 'power2.out' }] }, 7.9)
    .to(media, { scale: 1, rotation: 0, x: 0, y: 0, duration: 1.6, ease: 'expo.out' }, 7.92)
    .to(bars, { scaleY: 0, duration: 1.1, ease: 'expo.inOut' }, 7.95)
    .to(dark, { opacity: 0, duration: 1.4, ease: 'power2.inOut' }, 8.0)
    .to([spill, haze], { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 8.0)
    .to(flare, { keyframes: [{ opacity: 1, scaleX: 1.8, duration: 0.06 }, { opacity: 0, scaleX: 2.2, duration: 1.0, ease: 'power2.out' }] }, 7.92)
    .fromTo(badge, { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power4.in' }, 7.5)
    .to(badge, { keyframes: [{ scale: 0.92, duration: 0.06 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }] }, 7.95)
    // the cut-out lights fade into the photo's own headlights, so nothing pops at the end
    .to([lights, glow], { opacity: 0, duration: 1.2, ease: 'power1.inOut' }, 8.1)
    .add(heroIn, 8.45)
    .add(() => flyBadge(), 8.65)
    .to(NAVS, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 8.8)
    .to({}, { duration: 0.01 }, 9.6);

  // the badge flies to the logo in the menu bar and hands over to it
  function flyBadge() {
    const target = $('.nav .wordmark-mark').getBoundingClientRect();
    const r = badge.getBoundingClientRect();
    gsap.to(badge, {
      x: target.left + target.width / 2 - (r.left + r.width / 2), y: target.top + target.height / 2 - (r.top + r.height / 2),
      scale: target.width / r.width, duration: 0.9, ease: 'expo.inOut',
      onComplete: () => gsap.to(badge, { opacity: 0, duration: 0.25 }),
    });
  }

  // light and shake that follow the recording's loudness
  const amp = phone ? 4 : 7;
  const react = (t) => {
    if (!env || t < 1.1 || t > 9.4) { bloom.style.opacity = 0; media.style.translate = ''; return; }
    const e = env[Math.min(env.length - 1, Math.floor(t * 60))];
    const fadeOut = t > 8.3 ? Math.max(0, 1 - (t - 8.3) / 1.0) : 1;
    bloom.style.opacity = String((0.15 + e * 0.85) * fadeOut);
    const k = e * e * amp * fadeOut;
    media.style.translate = k > 0.2 ? `${(Math.random() - 0.5) * k}px ${(Math.random() - 0.5) * k}px` : '';
  };

  // controls while it plays: sound off, skip
  controls.hidden = false;
  gsap.from(controls, { opacity: 0, duration: 0.6, delay: 0.4 });
  let skipped = false, vol = null;
  $('[data-mute]', controls).hidden = !withSound;
  $('[data-mute]', controls).addEventListener('click', (e) => {
    if (!vol) return;
    const off = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(off));
    e.currentTarget.textContent = off ? 'Sound on' : 'Sound off';
    vol.gain.setTargetAtTime(off ? 0 : GAIN, audio.ctx.currentTime, 0.08);
  });
  const skipNow = () => { skipped = true; navigator.vibrate?.(0); };
  $('[data-intro-skip]', controls).addEventListener('click', skipNow);
  const onKey = (e) => { if (e.key === 'Escape') skipNow(); };
  addEventListener('keydown', onKey);

  await new Promise((resolve) => {
    let t0 = performance.now() / 1000;
    if (withSound) {
      const { ctx } = audio;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      vol = ctx.createGain(); vol.gain.value = GAIN;
      src.connect(vol).connect(ctx.destination);
      t0 = ctx.currentTime + 0.05;
      src.start(t0);
      src.onended = () => ctx.close().catch(() => {});
    }
    const now = () => (withSound ? audio.ctx.currentTime : performance.now() / 1000);
    const tick = () => {
      if (skipped) {
        gsap.ticker.remove(tick);
        if (vol) vol.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.15);
        react(99);
        gsap.to(tl, { time: tl.duration(), duration: 1.1, ease: 'power2.inOut', onComplete: resolve });
        return;
      }
      // the picture follows the audio clock: if a frame drops, it catches up instead of drifting
      const t = Math.max(0, now() - t0);
      tl.time(Math.min(t, tl.duration()));
      react(t);
      if (t >= tl.duration()) { gsap.ticker.remove(tick); resolve(); }
    };
    gsap.ticker.add(tick);
  });
  removeEventListener('keydown', onKey);
  gsap.to(controls, { opacity: 0, duration: 0.3, onComplete: () => controls.remove() });
  finishIntro();
}

function finishIntro() {
  gsap.set(media, { clearProps: 'transform,translate' });
  media.style.translate = '';
  gsap.set([lights, glow], { clearProps: 'clipPath' });
  gsap.set(NAVS, { clearProps: 'opacity' }); // never touch the nav's transform: it slides via CSS
  $('[data-badge]')?.remove();
  $('[data-bars]')?.remove();
  $('[data-intro-controls]')?.remove();
  dispatchEvent(new Event('v8:intro-done'));
}

/* ================================================================== hero: headline rises (transform only, no reflow) */
let heroStarted = false;
function heroIn() {
  heroStarted = true;
  gsap.set('.hero-inner', { opacity: 1 });
  if (reduced) { gsap.set('.hero-shade', { opacity: 1 }); return; }
  gsap.to('.hero-shade', { opacity: 1, duration: 1.2, ease: 'power2.out' });
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

/* ================================================================== part-exchange calculator */
function setupSwap() {
  const box = $('[data-swap]');
  if (!box) return;
  const sel = $('[data-swap-car]', box), trade = $('[data-swap-trade]', box), card = $('[data-swap-card]', box);
  const shown = { left: 0, month: 0 };
  const showCar = (c) => {
    card.href = `cars/${c.id}.html`;
    card.innerHTML = `<img src="${thumb(c)}" width="480" height="317" alt="" /><span><strong>${carName(c)}</strong><span>${c.trim}</span></span>`;
    if (!reduced) gsap.fromTo(card.firstElementChild, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' });
  };
  const update = (carChanged) => {
    const c = byId(sel.value);
    if (!c) return;
    // can't trade in more than the car costs
    trade.max = String(Math.max(100000, Math.floor(c.price / 25000) * 25000));
    const t = Math.min(+trade.value, +trade.max);
    trade.style.setProperty('--p', (t / +trade.max) * 100 + '%');
    $('[data-swap-trade-out]', box).textContent = rs(t);
    $('[data-swap-price]', box).textContent = rs(c.price);
    $('[data-swap-minus]', box).textContent = `minus ${rs(t)}`;
    const left = Math.max(0, c.price - t);
    const month = left ? monthly(left, 0) : 0;
    gsap.to(shown, {
      left, month, duration: reduced ? 0 : 0.6, ease: 'expo.out',
      onUpdate: () => {
        $('[data-swap-left]', box).textContent = rs(Math.round(shown.left / 1000) * 1000);
        $('[data-swap-month]', box).textContent = rs(Math.round(shown.month / 100) * 100);
      },
    });
    if (carChanged) showCar(c);
  };
  sel.addEventListener('change', () => update(true));
  trade.addEventListener('input', () => update(false));
  update(card.getAttribute('href') !== `cars/${sel.value}.html`); // the preselected car's card is already in the HTML
}
