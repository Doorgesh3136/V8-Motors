import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, curtainOpen } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { renderStatus, saturdayDeals } from '../lib/hours.js';
import { initDeck } from '../lib/deck.js';
import { initChapters } from '../lib/chapters.js';
import { initDial } from '../lib/dial.js';
import { initRevs } from '../lib/revs.js';
import { odo } from '../lib/odo.js';
import { byId, rs, monthly, thumb, carName } from '../data.js';
import { DARK, HERO } from '../lib/rover-shots.js';

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
const canvas = $('[data-hero-canvas]');
const flare = $('[data-flare]');
const dark = $('[data-hero-dark]');

const { lenis } = initLayout({ home: true });
wireCardActions();
renderStatus($('[data-open-status]'));
initDeck();
initDial(undefined, { onRev: initRevs() });
startCountdown();
initRail();

const playIntro = document.documentElement.classList.contains('play-intro');
if (playIntro) {
  // a refresh always lands at the top of the home page, wherever you were
  const top = () => { scrollTo(0, 0); lenis?.scrollTo(0, { immediate: true, force: true }); };
  top();
  addEventListener('load', top, { once: true });
  lenis?.stop();
}

/* ================================================================== the car
   The Range Rover is drawn live by src/lib/rover3d.js, which brings three.js with it, so it is loaded on its own and
   never holds up the page. Everything here animates one object of numbers, `s`; that file draws what they say.
   With reduced motion, data saver, no WebGL or a failed download, the still of the same car stays on screen. */
const s = { ...(playIntro ? DARK : HERO) };
let stage = null, modelDone = 0, onModel = () => {};
const wantStage = !reduced && !navigator.connection?.saveData;
const stageReady = !wantStage ? Promise.resolve(null) : import('../lib/rover3d.js')
  .then(({ createStage }) => createStage({
    canvas, s, input: $('.hero'),
    onProgress: (v) => { modelDone = v; onModel(v); },
    onTap: () => flashLights(0),
  }))
  .then((st) => {
    stage = st;
    gsap.ticker.add(() => {
      st.draw();
      if (parseFloat(flare.style.opacity) > 0.001) flare.style.top = `${st.lampY()}px`;
    });
    return st;
  })
  .catch((e) => { console.warn('3D car unavailable, showing the still', e); modelDone = 1; onModel(1); return null; });
if (!wantStage) modelDone = 1;
media.style.setProperty('--u', `${(innerWidth * 1.3) / 100}px`);

runIntro().then(async () => {
  document.documentElement.classList.remove('play-intro');
  lenis?.start();
  if (!heroStarted) { await curtainOpen; heroIn(); }
  flashLights();
  heroScrub();
  showHint();
  setupSwap();
  initChapters();
  setTimeout(startRotor, reduced ? 0 : 2600);
  ScrollTrigger.refresh();
});

/* ================================================================== intro
   Browsers only allow sound after a tap, so the intro opens on the car's start button in the dark.
   Pressing it plays a real, healthy V8 (public/intro/engine.mp3: a starter crank, then a V8 catching,
   idling smoothly and revving, CC0 recordings from Freesound). The picture runs on the audio clock, and the
   body's roll and the camera shake follow the recording's loudness frame by frame:
     0.3s  crank: the lamps flicker with the starter, the camera right up against a headlamp in the dark
     0.9s  it catches: the body kicks on its springs, the running lights and beams come up
     idle  the camera drifts across the grille, the body trembles with the engine
     4.7s  first rev: high beams flash, the camera punches in
     5.9s  big rev: flash, the letterbox opens, the car rolls forward as the camera swings out and the night lifts
     6.3s  the V8 Motors badge comes up in the light
     7.2s  last rev: a shine runs across the badge, then it flies up into the menu bar */


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
   While the scene loads, the start button's outer ring fills with real progress (the 3D car, the fonts
   and the engine recording, which is streamed), the percentage counts up beside it,
   and a few small line icons drift in the dark. When everything has arrived the ring closes with a
   flash and the hint becomes "Press to start". You can press it, enter without sound or skip at any time. */

function startLoader(gate) {
  const bar = $('[data-load-bar]', gate), pct = $('[data-load-pct]', gate), text = $('[data-load-text]', gate);
  const float = $('[data-float]', gate);
  // weights: what you'd wait longest for weighs most
  const parts = { model: [0, 0.7], fonts: [0, 0.05], audio: [0, 0.25] };
  let target = 0, shown = 0, raf = 0, ready = false;
  const set = (k, v) => { parts[k][0] = Math.max(parts[k][0], Math.min(1, v)); target = Object.values(parts).reduce((a, [x, w]) => a + x * w, 0); };
  set('model', modelDone);
  onModel = (v) => set('model', v);
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
  const gate = $('[data-gate]'), bars = $$('[data-bars] > span'), badge = $('[data-badge]');
  const controls = $('[data-intro-controls]');
  const loader = startLoader(gate);
  const audio = prepareSound(loader.audio);
  const phone = innerWidth < 700;

  gsap.set(flare, { opacity: 0, scaleX: 0.05 });
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
    if (stage) gsap.set(dark, { opacity: 0 });
    await gsap.timeline()
      .to(s, { ...HERO, duration: 1.1, ease: 'expo.inOut' }, 0)
      .to(dark, { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
      .to(bars, { scaleY: 0, duration: 0.8, ease: 'expo.inOut' }, 0)
      .to(NAVS, { opacity: 1, duration: 0.6 }, 0.4)
      .add(heroIn, 0.45);
    finishIntro();
    return;
  }

  // the button works before everything has arrived, but never wait long for the car
  const [buffer] = await Promise.all([audio ? audio.buffer : null, Promise.race([stageReady, new Promise((r) => setTimeout(r, 6000))]), document.fonts?.ready]);
  const env = envelope(buffer);
  const withSound = choice === 'sound' && buffer;
  if (withSound) dispatchEvent(new Event('v8:sound-on'));
  if (!withSound) audio?.ctx.close();
  if (stage) gsap.set(dark, { opacity: 0 }); // the 3D scene is its own darkness

  // where the badge sits: in the sky above the car, then it flies into the menu bar
  const placeBadge = () => {
    const portrait = innerHeight > innerWidth * 1.25;
    const size = portrait ? Math.min(innerWidth * 0.34, 150) : gsap.utils.clamp(130, 230, innerWidth * 0.14);
    const cy = portrait ? innerHeight * 0.13 : innerHeight * 0.2;
    gsap.set(badge, { width: size, left: innerWidth / 2 - size / 2, top: cy - size * 0.47 });
  };
  placeBadge();

  const tl = gsap.timeline({ paused: true });
  const flash = (at, power) => tl
    .to(s, { keyframes: [{ high: power, duration: 0.06 }, { high: 0, duration: 0.62, ease: 'power2.out' }] }, at)
    .to(flare, { keyframes: [{ opacity: 1, scaleX: 1.25, duration: 0.08 }, { opacity: 0.45, scaleX: 1, duration: 0.55 }] }, at);

  // crank (0.3 to 0.85s): the lamps dim and brighten with the starter
  tl.to(s, { keyframes: [0.05, 0.01, 0.1, 0.02, 0.08].map((v) => ({ drl: v, duration: 0.11 })) }, 0.3)
    .to(s, { keyframes: [0.12, -0.1, 0.1, -0.06, 0].map((v) => ({ jolt: v, duration: 0.11 })) }, 0.3)
    // 0.9s: it catches. The body kicks and settles on its springs, and the lights come up
    .to(s, { keyframes: [{ jolt: 1, duration: 0.07, ease: 'power2.out' }, { jolt: 0, duration: 1.1, ease: 'elastic.out(1, 0.32)' }] }, 0.88)
    .to(s, { drl: HERO.drl, duration: 0.8, ease: 'power3.out' }, 0.9)
    .to(s, { red: 0.45, duration: 0.5 }, 0.95)
    .to(s, { beam: 0.8, duration: 1.1, ease: 'expo.out' }, 0.98)
    .to(s, { env: 0.13, key: 0.06, sky: 0.12, duration: 2.4, ease: 'power2.out' }, 1)
    .to(flare, { opacity: 0.45, scaleX: 1, duration: 1.4, ease: 'expo.out' }, 0.98)
    // idle: the camera drifts across the grille from one lamp to the other
    .to(s, { az: -0.4, tx: -0.42, ty: 0.9, near: 3.9, roll: 0.03, duration: 3.45, ease: 'sine.inOut' }, 1.2);
  // 4.7s: first rev, the camera punches in
  flash(4.66, 0.9);
  tl.to(s, { keyframes: [{ near: 3.15, duration: 0.14, ease: 'power3.out' }, { near: 3.7, duration: 0.7, ease: 'power2.out' }] }, 4.66);
  // 5.9s: the big rev. Flash, the letterbox opens, the car pulls forward as the camera swings out and the night lifts
  flash(5.86, 1);
  tl.to(s, { az: HERO.az, el: HERO.el, tx: HERO.tx, ty: HERO.ty, tz: HERO.tz, roll: 0, frame: 1, duration: 2.35, ease: 'expo.inOut' }, 5.92)
    .to(s, { carZ: 0, duration: 2, ease: 'power2.inOut' }, 5.95)
    .to(s, { env: HERO.env, key: HERO.key, sky: HERO.sky, duration: 2.1, ease: 'power2.inOut' }, 6.1)
    .to(s, { beam: HERO.beam, red: HERO.red, duration: 1.7, ease: 'power2.inOut' }, 6.6)
    .to(bars, { scaleY: 0, duration: 1.3, ease: 'expo.inOut' }, 6.0)
    .to(dark, { opacity: 0, duration: 2, ease: 'power2.inOut' }, 6.15) // only still there when the 3D car isn't
    // 6.3s: the badge comes up in the light (opacity and scale only: an animated blur filter stutters on phones)
    .fromTo(badge, { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 6.3)
    // 7.2s: last rev, a pulse on the badge and a last pulse of light
    .to(badge, { keyframes: [{ scale: 1.08, duration: 0.08 }, { scale: 1, duration: 0.6, ease: 'power2.out' }] }, 7.22)
    .to(s, { keyframes: [{ high: 0.55, duration: 0.06 }, { high: 0, duration: 0.7, ease: 'power2.out' }] }, 7.22)
    .to(flare, { keyframes: [{ opacity: 0.9, scaleX: 1.3, duration: 0.08 }, { opacity: 0, scaleX: 1.7, duration: 1.1, ease: 'power2.out' }] }, 7.22)
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

  // the body rocks and the camera trembles with the recording's loudness
  const react = (t) => {
    if (!env || t < 0.85 || t > 8.6) { s.rev = 0; return; }
    const fadeOut = t > 7.5 ? Math.max(0, 1 - (t - 7.5) / 1.1) : 1;
    s.rev = env[Math.min(env.length - 1, Math.floor(t * 60))] * fadeOut * (phone ? 0.8 : 1);
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
  gsap.set(NAVS, { clearProps: 'opacity' }); // never touch the nav's transform: it slides via CSS
  $('[data-badge]')?.remove();
  $('[data-bars]')?.remove();
  $('[data-intro-controls]')?.remove();
  dispatchEvent(new Event('v8:intro-done'));
}

/* ================================================================== the Range Rover flashes its lights at you
   Once the home page is showing (after the intro, or on arriving from another page) the car gives two quick flashes
   of its high beams. Tap the car and it does it again. */
let flashing = false;
async function flashLights(delay = 0.7) {
  if (reduced) return;
  await stageReady;
  if (!stage || flashing || scrollY > 40 || document.documentElement.classList.contains('play-intro')) return;
  flashing = true;
  gsap.timeline({ delay, onComplete: () => { flashing = false; } })
    .to(s, { keyframes: [
      { high: 0.85, duration: 0.07, ease: 'power2.out' }, { high: 0.04, duration: 0.14, ease: 'power1.in' },
      { high: 1, duration: 0.07, ease: 'power2.out' }, { high: 0, duration: 1, ease: 'power2.out' },
    ] }, 0)
    .to(flare, { keyframes: [
      { opacity: 0.5, scaleX: 1.1, duration: 0.07 }, { opacity: 0.03, scaleX: 1, duration: 0.14 },
      { opacity: 0.6, scaleX: 1.3, duration: 0.07 }, { opacity: 0, scaleX: 1.6, duration: 1, ease: 'power2.out' },
    ] }, 0);
}

/** A small note that the car can be turned, until someone has. */
async function showHint() {
  const hint = $('[data-hero-hint]');
  if (!hint || !(await stageReady)) return;
  hint.hidden = false;
  gsap.fromTo(hint, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.2, ease: 'expo.out' });
  const hide = () => {
    if (!stage.turned && scrollY < innerHeight * 0.15) return;
    removeEventListener('pointerup', hide);
    removeEventListener('scroll', hide);
    gsap.to(hint, { opacity: 0, duration: 0.4, onComplete: () => hint.remove() });
  };
  addEventListener('pointerup', hide);
  addEventListener('scroll', hide, { passive: true });
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
    const put = reduced ? (el, v) => { el.textContent = v; } : odo;
    put(unit('d'), d);
    put(unit('h'), pad(Math.floor((s % 86400) / 3600)));
    put(unit('m'), pad(Math.floor((s % 3600) / 60)));
    put(unit('s'), pad(s % 60));
  };
  tick();
  new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) { tick(); timer = setInterval(tick, 1000); } }).observe(box);
}

/* ================================================================== driving through the headlights
   The hero holds still for a moment as you start to scroll, and your thumb is the throttle: the headline lifts away,
   the camera drops in front of the bonnet, the wheels turn and the road markings rush past, the high beams come on
   and the screen washes into the page. Short landscape screens skip it (there's no room to hold still). */
async function heroScrub() {
  const pin = $('[data-hero-pin]');
  if (reduced || !pin || innerHeight < 560) return;
  const st = await stageReady;
  const portrait = innerHeight > innerWidth;
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: false } })
    .to('.hero-inner', { y: portrait ? -40 : -80, opacity: 0, duration: 0.34, ease: 'power1.in' }, 0)
    .to('.hero-shade', { opacity: 0, duration: 0.2 }, 0.5)
    .fromTo(flare, { opacity: 0, scaleX: 0.3 }, { opacity: 1, scaleX: 1.7, duration: 0.3, immediateRender: false }, 0.34)
    .to('.hero-flash', { opacity: 1, duration: 0.2, ease: 'power2.in' }, 0.66)
    .to('.hero', { opacity: 0, duration: 0.18, ease: 'power1.inOut' }, 0.82);
  if (st) {
    tl.to(s, { frame: 0, near: 3.4, az: 0.1, el: 0.03, tx: 0, ty: 0.86, tz: 2.2, duration: 0.86, ease: 'power2.inOut' }, 0)
      .to(s, { road: 90, duration: 1, ease: 'power2.in' }, 0)
      .to(s, { roadGlow: 1, beam: 1, duration: 0.34, ease: 'power1.out' }, 0.12)
      .to(s, { env: 0.45, key: 0.4, sky: 0.45, duration: 0.4 }, 0.14)
      .to(s, { high: 1, duration: 0.32, ease: 'power2.in' }, 0.42);
  } else {
    tl.to(media, { scale: 2, duration: 1, ease: 'power1.in' }, 0);
  }
}

/* ================================================================== the Just in rail: a bar, and arrows with a mouse */
function initRail() {
  const rail = $('[data-rail]'), bar = $('[data-rail-bar]');
  if (!rail) return;
  const update = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const w = rail.clientWidth / rail.scrollWidth;
    bar.style.width = `${w * 100}%`;
    bar.style.transform = `translateX(${max > 0 ? (rail.scrollLeft / max) * ((1 / w) - 1) * 100 : 0}%)`;
  };
  rail.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
  const go = (d) => rail.scrollBy({ left: d * (rail.firstElementChild.offsetWidth + 24), behavior: reduced ? 'auto' : 'smooth' });
  $('[data-rail-prev]').addEventListener('click', () => go(-1));
  $('[data-rail-next]').addEventListener('click', () => go(1));
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
      },
    });
    odo($('[data-swap-month]', box), rs(Math.round(month / 100) * 100));
    if (carChanged) showCar(c);
  };
  sel.addEventListener('change', () => update(true));
  trade.addEventListener('input', () => update(false));
  update(card.getAttribute('href') !== `cars/${sel.value}.html`); // the preselected car's card is already in the HTML
}
