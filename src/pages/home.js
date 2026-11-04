import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, curtainOpen } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { renderStatus, saturdayDeals } from '../lib/hours.js';
import { initDeck } from '../lib/deck.js';
import { initChapters } from '../lib/chapters.js';
import { CARS, byId, rs, monthly, thumb, carName } from '../data.js';

const LAMPS = [[0.33, 0.5153], [0.6675, 0.511]]; // headlight centres as fractions of the photo (white Range Rover, Unsplash wrRhFFTySnc)
const ENGINE = new URL('intro/engine.mp3', document.baseURI).href;
const NAVS = ['[data-nav]', '.tabbar'];
const GAIN = 0.8; // playback level (the recording itself is mastered quietly)
// the loader's drifting icons (key, steering wheel, gauge, wheel, fuel, car, spark) and where they float
const FLOAT_ICONS = [
  '<path d="M14.5 9.5a3.5 3.5 0 1 1-1.4 2.8L5 20.4 3.6 19l1.4-1.4-1.4-1.4 1.4-1.4 1.4 1.4 4.6-4.6a3.5 3.5 0 0 1 3.5-2.1Z"/>', // key
  '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M3.6 11h6.2M14.2 11h6.2M12 14.2v6.3"/>', // steering wheel
  '<path d="M4 16a8 8 0 1 1 16 0M12 16l4-5M7 16h.01M17 16h.01"/>', // gauge
  '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 3.5v4.5M12 16v4.5M3.5 12H8M16 12h4.5"/>', // wheel
  '<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>', // fuel
  '<path d="M3 15v-3l2-5h14l2 5v3M3 15h18v3h-3v-2H6v2H3v-3Z"/>', // car
  '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>', // spark
];
const FLOAT_SPOTS = [[9, 16], [88, 12], [6, 46], [93, 42], [16, 78], [82, 74], [48, 7], [70, 28], [28, 30]];

const media = $('[data-hero-media]');
const img = $('[data-hero-img]');
const lights = $('[data-lights]');
const glow = $('[data-glow]');
const flare = $('[data-flare]');

const { lenis } = initLayout({ home: true });
wireCardActions();
renderStatus($('[data-open-status]'));
initDeck();
startCountdown();

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
  flashLights();
  setupSearch();
  setupSwap();
  initChapters();
  setTimeout(startRotor, reduced ? 0 : 2600);
  ScrollTrigger.refresh();
});

/* ================================================================== intro
   Browsers only allow sound after a tap, so the intro opens on the car's start button in the dark.
   Pressing it plays a real, healthy V8 (public/intro/engine.mp3: a starter crank, then a V8 catching,
   idling smoothly and revving, CC0 recordings from Freesound). The picture runs on the audio clock, and the
   headlight bloom and camera shake follow the recording's loudness frame by frame:
     0.3s  crank: the lamps flicker with the starter
     0.9s  it catches: jolt, the light signature sweeps on from the grille outwards
     idle  the camera creeps in, the light breathes with the engine
     4.7s  first rev: high beams flash, the camera punches in
     5.9s  big rev: flash, the letterbox opens, the camera pulls back and the driveway lights up
     6.3s  the V8 Motors badge comes up in the light
     7.2s  last rev: a shine runs across the badge, then it flies up into the menu bar */


/** Where the headlights sit on screen (the photo is object-fit: cover). */
function layoutScene() {
  const W = img.offsetWidth, H = img.offsetHeight, bx = img.offsetLeft, by = img.offsetTop;
  const nw = img.naturalWidth || 2200, nh = img.naturalHeight || 1511;
  const k = Math.max(W / nw, H / nh);
  const w = nw * k, h = nh * k;
  const ox = bx + (W - w) * 0.5, oy = by + (H - h) * 0.6;
  const pts = LAMPS.map(([x, y]) => [ox + x * w, oy + y * h]);
  const mx = (pts[0][0] + pts[1][0]) / 2, my = pts[0][1];
  media.style.setProperty('--u', `${w / 100}px`);
  media.style.transformOrigin = `${mx}px ${my}px`;
  flare.style.top = `${my}px`;
  const spill = $('[data-spill]'), haze = $('[data-haze]'), bloom = $('[data-bloom]');
  spill.style.left = haze.style.left = bloom.style.left = `${mx}px`;
  spill.style.top = `${my + h * 0.05}px`;
  haze.style.top = bloom.style.top = `${my}px`;
  return { W: media.clientWidth, sep: pts[1][0] - pts[0][0], mx: mx - bx, iw: W, top: by, h: H };
}

function waitForPhoto() {
  const loaded = img.complete && img.naturalWidth ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const decoded = loaded.then(() => img.decode?.().catch(() => {}));
  return Promise.race([Promise.all([decoded, document.fonts.ready]), new Promise((r) => setTimeout(r, 5000))]);
}

/** Fetch and decode the engine recording while the visitor looks at the start button. It is read as a
    stream, so the loader can show how much has arrived. */
function prepareSound(onProgress = () => {}) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { onProgress(1); return null; }
  const ctx = new AC(); // starts suspended until the tap
  const buffer = fetch(ENGINE).then(async (r) => {
    const total = +r.headers.get('content-length') || 0;
    if (!r.body?.getReader || !total) { const b = await r.arrayBuffer(); onProgress(1); return b; }
    const reader = r.body.getReader(), chunks = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      onProgress(Math.min(0.99, got / total));
    }
    const out = new Uint8Array(got);
    let o = 0;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    onProgress(1);
    return out.buffer;
  }).then((b) => new Promise((ok, bad) => ctx.decodeAudioData(b, ok, bad))).catch(() => { onProgress(1); return null; });
  return { ctx, buffer };
}

/* ------------------------------------------------------------------ the loader
   While the scene loads, the start button's outer ring fills with real progress (the photo, the light
   shapes, the fonts and the engine recording, which is streamed), the percentage counts up beside it,
   and a few small line icons drift in the dark. When everything has arrived the ring closes with a
   flash and the hint becomes "Press to start". You can press it, enter without sound or skip at any time. */

function startLoader(gate) {
  const bar = $('[data-load-bar]', gate), pct = $('[data-load-pct]', gate), text = $('[data-load-text]', gate);
  const float = $('[data-float]', gate);
  // weights: what you'd wait longest for weighs most
  const parts = { photo: [0, 0.34], lights: [0, 0.1], glow: [0, 0.06], fonts: [0, 0.05], audio: [0, 0.45] };
  let target = 0, shown = 0, raf = 0, ready = false;
  const set = (k, v) => { parts[k][0] = Math.max(parts[k][0], Math.min(1, v)); target = Object.values(parts).reduce((a, [x, w]) => a + x * w, 0); };
  const watch = (el, k) => {
    if (!el || (el.complete && el.naturalWidth)) return set(k, 1);
    el.addEventListener('load', () => set(k, 1), { once: true });
    el.addEventListener('error', () => set(k, 1), { once: true });
  };
  watch(img, 'photo'); watch(lights, 'lights'); watch(glow, 'glow');
  (document.fonts?.ready || Promise.resolve()).then(() => set('fonts', 1));

  if (float && !reduced) {
    float.innerHTML = FLOAT_SPOTS.map(([x, y], k) => `<svg viewBox="0 0 24 24" style="--x:${x}%;--y:${y}%;--d:${7 + (k % 4) * 1.6}s;--dl:${(k * 0.37).toFixed(2)}s;--r:${(k % 2 ? -1 : 1) * (6 + k)}deg">${FLOAT_ICONS[k % FLOAT_ICONS.length]}</svg>`).join('');
  }

  const finish = () => {
    if (ready) return;
    ready = true;
    cancelAnimationFrame(raf);
    bar.style.strokeDashoffset = '0';
    pct.hidden = true;
    gate.classList.add('is-ready');
    if (!reduced) gsap.fromTo(text, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    text.textContent = 'Sound on. Press to start.';
  };
  const tick = () => {
    shown += (target - shown) * (reduced ? 1 : 0.1);
    if (target > 0.999 && shown > 0.995) shown = 1;
    bar.style.strokeDashoffset = String(100 - shown * 100);
    pct.textContent = `${Math.round(shown * 100)}%`;
    if (shown >= 1) return finish();
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  // never keep anyone waiting on a slow connection: the start button always works, and after 12 s the
  // loader steps aside anyway
  setTimeout(finish, 12000);
  return { audio: (v) => set('audio', v), stop: () => cancelAnimationFrame(raf) };
}

/** Loudness of the recording, 60 values a second, 0 (idle) to 1 (the biggest rev). */
function envelope(buffer) {
  if (!buffer) return null;
  const d = buffer.getChannelData(0), hop = Math.round(buffer.sampleRate / 60), out = new Float32Array(Math.ceil(d.length / hop));
  for (let i = 0; i < out.length; i++) {
    let s = 0; const a = i * hop, b = Math.min(d.length, a + hop * 2);
    for (let j = a; j < b; j++) s += d[j] * d[j];
    const db = 10 * Math.log10(s / Math.max(1, b - a) + 1e-12);
    out[i] = Math.min(1, Math.max(0, (db + 30) / 19)); // -30 dBFS (idle) .. -11 dBFS (peak)
  }
  return out;
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
  const spill = $('[data-spill]'), haze = $('[data-haze]'), bloom = $('[data-bloom]');
  const gate = $('[data-gate]'), bars = $$('[data-bars] > span'), badge = $('[data-badge]');
  const controls = $('[data-intro-controls]');
  const loader = startLoader(gate);
  const audio = prepareSound(loader.audio);

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
  loader.stop();
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

  // crank (0.3 to 0.85s): the lamps dim and brighten with the starter
  tl.to(glow, { keyframes: [0.05, 0.01, 0.08, 0.02, 0.07].map((o) => ({ opacity: o, duration: 0.11 })) }, 0.3)
    .to(media, { keyframes: { x: [0, -1, 1, -1, 0], y: [0, 0.8, -0.8, 0.8, 0] }, duration: 0.55, ease: 'none' }, 0.3)
    // 0.9s: it catches
    .to(media, { keyframes: { x: [0, -8, 9, -6, 3, -1, 0], y: [0, 6, -4, 2, -1, 1, 0] }, duration: 0.5, ease: 'none' }, 0.88)
    .set(lights, { opacity: 1 }, 0.9)
    .add(clip, 0.9)
    .to(sweep, { p: 1, duration: 0.8, ease: 'power3.out', onUpdate: clip }, 0.9)
    .to(glow, { opacity: 0.95, duration: 1, ease: 'power2.out' }, 0.93)
    .to(dark, { opacity: 0.86, duration: 1.5, ease: 'power2.out' }, 0.98)
    .to(spill, { opacity: 1, scaleY: 1, duration: 1.2, ease: 'expo.out' }, 1.05)
    .to(haze, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.05)
    .to(flare, { opacity: 0.6, scaleX: 1, duration: 1.4, ease: 'expo.out' }, 0.98)
    // idle: the camera creeps in
    .to(media, { scale: zoom * 1.08, rotation: -0.5, duration: 3.2, ease: 'sine.inOut' }, 1.4);
  // 4.7s: first rev, the camera punches in
  flash(4.66, 0.4);
  tl.to(media, { keyframes: [{ scale: zoom * 1.16, duration: 0.14, ease: 'power3.out' }, { scale: zoom * 1.1, duration: 0.7, ease: 'power2.out' }] }, 4.66);
  // 5.9s: the big rev. Flash, the letterbox opens, the camera pulls back hard
  flash(5.86, 0.22);
  tl.to(media, { scale: 1, rotation: 0, x: 0, y: 0, duration: 2.3, ease: 'expo.inOut' }, 5.92)
    .to(bars, { scaleY: 0, duration: 1.3, ease: 'expo.inOut' }, 6.0)
    .to(dark, { opacity: 0, duration: 2, ease: 'power2.inOut' }, 6.15)
    .to([spill, haze], { opacity: 0, duration: 1.4, ease: 'power2.inOut' }, 6.8)
    // 6.3s: the badge comes up in the light (opacity and scale only: an animated blur filter stutters on phones)
    .fromTo(badge, { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 6.3)
    // 7.2s: last rev, a pulse on the badge and a last pulse of light
    .to(badge, { keyframes: [{ scale: 1.08, duration: 0.08 }, { scale: 1, duration: 0.6, ease: 'power2.out' }] }, 7.22)
    .to(glow, { keyframes: [{ opacity: 1, duration: 0.06 }, { opacity: 0.7, duration: 0.6 }] }, 7.22)
    .to(flare, { keyframes: [{ opacity: 0.9, scaleX: 1.3, duration: 0.08 }, { opacity: 0, scaleX: 1.7, duration: 1.1, ease: 'power2.out' }] }, 7.22)
    // the cut-out lights fade into the photo's own headlights, so nothing pops at the end
    .to([lights, glow], { opacity: 0, duration: 1.3, ease: 'power1.inOut' }, 7.6)
    .add(heroIn, 7.7)
    .add(() => flyBadge(), 7.95)
    .to(NAVS, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 8.1)
    .to({}, { duration: 0.01 }, 8.9);

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
  const amp = phone ? 3 : 5;
  const react = (t) => {
    if (!env || t < 0.85 || t > 8.6) { bloom.style.opacity = 0; media.style.translate = ''; return; }
    const e = env[Math.min(env.length - 1, Math.floor(t * 60))];
    const fadeOut = t > 7.5 ? Math.max(0, 1 - (t - 7.5) / 1.1) : 1;
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
  const skipNow = () => { skipped = true; };
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

/* ================================================================== the Range Rover flashes its lights at you
   Once the home page is showing (after the intro, or on arriving from another page), the car gives two quick
   flashes of its high beams, using the real light shapes cut from the photo. Opacity and transform only. */
async function flashLights() {
  if (reduced || !lights || !glow) return;
  if (!(img.complete && img.naturalWidth)) {
    await Promise.race([new Promise((r) => img.addEventListener('load', r, { once: true })), new Promise((r) => setTimeout(r, 4000))]);
  }
  if (!img.naturalWidth || scrollY > innerHeight * 0.6) return; // photo missing, or already scrolled away
  layoutScene();
  gsap.set([lights, glow], { clearProps: 'clipPath' });
  const blink = [
    { opacity: 1, duration: 0.07, ease: 'power2.out' }, { opacity: 0.08, duration: 0.14, ease: 'power1.in' },
    { opacity: 1, duration: 0.07, ease: 'power2.out' }, { opacity: 0, duration: 1.1, ease: 'power2.out' },
  ];
  gsap.timeline({ delay: 0.7 })
    .to([lights, glow], { keyframes: blink }, 0)
    .to(flare, { keyframes: [
      { opacity: 0.85, scaleX: 1.25, duration: 0.07 }, { opacity: 0.05, scaleX: 1, duration: 0.14 },
      { opacity: 1, scaleX: 1.45, duration: 0.07 }, { opacity: 0, scaleX: 1.8, duration: 1.1, ease: 'power2.out' },
    ] }, 0);
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

/* ================================================================== the rotating word
   "Drive smarter." The accent word rolls over every few seconds, like the drum of an old odometer.
   It only runs while the headline is on screen and the tab is visible. */
function startRotor() {
  const el = $('[data-rotor]');
  if (!el || reduced) return;
  const words = ['smarter.', 'in style.', 'away today.', 'home happy.'];
  let k = 0, timer = 0, visible = true;
  const swap = () => {
    k = (k + 1) % words.length;
    gsap.timeline()
      .to(el, { yPercent: -110, opacity: 0, duration: 0.45, ease: 'power3.in' })
      .add(() => { el.textContent = words[k]; })
      .fromTo(el, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, ease: 'expo.out' });
  };
  const run = () => { clearInterval(timer); if (visible && !document.hidden) timer = setInterval(swap, 3000); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(el);
  document.addEventListener('visibilitychange', run);
}

/* ================================================================== Saturday countdown
   Counts down to the next Saturday opening, or, while the deals are on, to closing time. Ticks every
   second, but only while it's on screen. */
function startCountdown() {
  const box = $('[data-countdown]');
  if (!box) return;
  const label = $('[data-cd-label]', box), unit = (k) => $(`[data-cd="${k}"]`, box);
  const pad = (n) => String(n).padStart(2, '0');
  let timer = 0;
  const tick = () => {
    const { on, ms } = saturdayDeals();
    const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400);
    box.classList.toggle('is-on', on);
    box.classList.toggle('no-days', d === 0);
    label.textContent = on ? 'Saturday deals are on now. They end in' : 'The next Saturday deals start in';
    unit('d').textContent = d;
    unit('h').textContent = pad(Math.floor((s % 86400) / 3600));
    unit('m').textContent = pad(Math.floor((s % 3600) / 60));
    unit('s').textContent = pad(s % 60);
  };
  tick();
  new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) { tick(); timer = setInterval(tick, 1000); } }).observe(box);
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
