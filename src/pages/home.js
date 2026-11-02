import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, curtainOpen } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { renderStatus } from '../lib/hours.js';
import { CARS, rs, monthly } from '../data.js';

const LAMPS = [[0.361, 0.659], [0.612, 0.659]]; // headlight centres as fractions of the photo

const media = $('[data-hero-media]');
const img = $('[data-hero-img]');
const lamps = $$('[data-lamp]');
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
  addEventListener('resize', layoutLamps);
  lenis?.start();
  if (!heroStarted) { await curtainOpen; heroIn(); }
  setupSearch();
  setupArrivals();
  setupChecks();
  setupMarquee();
  setupMoney();
  ScrollTrigger.refresh();
});

/* ================================================================== intro
   One continuous shot on the real hero photo, no overlay and no cut:
   1. Darkness, close in on the car. The LED strips sweep on, the lamps flicker awake.
   2. The lamps glow while the photo finishes loading (a loading state that is part of the scene).
   3. The camera pulls back as the light comes up and the forest appears; the headline rises as it settles.
   Only transform and opacity are animated, so it stays on the compositor and runs smoothly on phones. */

/** Position the lamps over the photo's real headlights (the photo is object-fit: cover, 50% 60%). */
function layoutLamps() {
  // measure the image's own box (full-bleed on wide screens, a band at the top on portrait phones)
  const W = img.offsetWidth, H = img.offsetHeight, bx = img.offsetLeft, by = img.offsetTop;
  const nw = img.naturalWidth || 1400, nh = img.naturalHeight || 942;
  const k = Math.max(W / nw, H / nh);
  const w = nw * k, h = nh * k;
  const ox = bx + (W - w) * 0.5, oy = by + (H - h) * 0.6;
  const pts = LAMPS.map(([x, y]) => [ox + x * w, oy + y * h]);
  lamps.forEach((l, i) => { l.style.left = `${pts[i][0]}px`; l.style.top = `${pts[i][1]}px`; });
  media.style.setProperty('--u', `${w / 100}px`);
  const mx = (pts[0][0] + pts[1][0]) / 2, my = pts[0][1];
  media.style.transformOrigin = `${mx}px ${my}px`;
  flare.style.top = `${my}px`;
  const spill = $('[data-spill]'), haze = $('[data-haze]');
  spill.style.left = haze.style.left = `${mx}px`;
  spill.style.top = `${my + h * 0.05}px`;
  haze.style.top = `${my}px`;
  return { W: media.clientWidth, sep: pts[1][0] - pts[0][0] };
}

function waitForPhoto() {
  const loaded = img.complete && img.naturalWidth ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const decoded = loaded.then(() => img.decode?.().catch(() => {}));
  const timeout = new Promise((r) => setTimeout(r, 5000)); // slow connection: never hold the page hostage
  return Promise.race([Promise.all([decoded, document.fonts.ready]), timeout]);
}

async function runIntro() {
  if (!playIntro) return;
  const dark = $('[data-hero-dark]');
  const cores = lamps.map((l) => $('.lamp-core', l));
  const blooms = lamps.map((l) => $('.lamp-bloom', l));
  const drls = lamps.map((l) => $('.lamp-drl', l));
  const spill = $('[data-spill]'), haze = $('[data-haze]');

  let geo = layoutLamps();
  img.addEventListener('load', () => (geo = layoutLamps()), { once: true });
  // close-up: the lamps fill about 60% of the screen width
  const zoom = () => gsap.utils.clamp(1.2, 2.4, (0.6 * geo.W) / geo.sep);
  gsap.set(media, { scale: zoom() });
  gsap.set(lamps, { opacity: 1 });
  gsap.set(cores, { opacity: 0, scale: 0.6 });
  gsap.set(blooms, { opacity: 0, scale: 0.35 });
  gsap.set(flare, { opacity: 0, scaleX: 0.05 });
  gsap.set(spill, { opacity: 0, scaleY: 0.4, transformOrigin: '50% 0%' });

  // 1. wake up
  const wake = gsap.timeline({ delay: 0.25 });
  wake.to(drls, { scaleX: 1, duration: 0.5, ease: 'power3.out', stagger: 0.08 })
    .to(cores, {
      keyframes: [
        { opacity: 0.9, scale: 0.9, duration: 0.05 },
        { opacity: 0.1, duration: 0.07 },
        { opacity: 1, scale: 1, duration: 0.05 },
        { opacity: 0.45, duration: 0.09 },
        { opacity: 1, duration: 0.18, ease: 'power2.out' },
      ], stagger: 0.05,
    }, '-=0.2')
    .addLabel('ignite', '-=0.05')
    // the engine catches: a short jolt through the whole frame
    .to(media, { keyframes: { x: [0, -5, 6, -4, 3, -1, 0], y: [0, 3, -3, 2, -1, 1, 0] }, duration: 0.42, ease: 'none' }, 'ignite')
    // high beams flash twice and light up the scene for an instant
    .to(blooms, {
      keyframes: [
        { opacity: 1, scale: 1.35, duration: 0.07 },
        { opacity: 0.55, scale: 0.95, duration: 0.11 },
        { opacity: 1, scale: 1.45, duration: 0.07 },
        { opacity: 0.95, scale: 1, duration: 0.6, ease: 'power3.out' },
      ],
    }, 'ignite')
    .to(dark, {
      keyframes: [
        { opacity: 0.45, duration: 0.07 },
        { opacity: 0.93, duration: 0.11 },
        { opacity: 0.4, duration: 0.07 },
        { opacity: 0.82, duration: 0.6, ease: 'power3.out' },
      ],
    }, 'ignite')
    .to(flare, { opacity: 1, scaleX: 1, duration: 0.3, ease: 'power4.out' }, 'ignite')
    .to(flare, { opacity: 0.7, duration: 0.6 }, '>')
    .to(spill, { opacity: 1, scaleY: 1, duration: 0.8, ease: 'expo.out' }, 'ignite+=0.05')
    .to(haze, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 'ignite+=0.05');
  await Promise.all([wake, waitForPhoto()]);

  // 2. (if still loading, the lamps simply keep glowing; the wait above covers it)
  geo = layoutLamps();

  // 3. pull back hard, light comes up, the page lands
  gsap.set(media, { rotation: -1.6 });
  await gsap.timeline()
    .to(media, { scale: 1, rotation: 0, duration: 1.75, ease: 'expo.inOut' }, 0)
    .to(dark, { opacity: 0, duration: 1.35, ease: 'power2.inOut' }, 0.1)
    .to(blooms, { opacity: 0.2, scale: 0.85, duration: 1.3, ease: 'power2.inOut' }, 0.25)
    .to(cores, { opacity: 0.35, duration: 1.3, ease: 'power2.inOut' }, 0.25)
    .to(drls, { opacity: 0.2, duration: 1.2 }, 0.4)
    .to(flare, { opacity: 0, scaleX: 1.6, duration: 1.1, ease: 'power2.out' }, 0.1)
    .to([spill, haze], { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 0.3)
    .to(['[data-nav]', '.tabbar'], { opacity: 1, duration: 0.8, ease: 'power2.out' }, 1.0)
    .add(heroIn, 0.85)
    .to(lamps, { opacity: 0, duration: 1.0, ease: 'power1.inOut' }, 1.6);
  gsap.set(media, { clearProps: 'transform' });
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

/* ================================================================== just arrived: scrolling down moves the row sideways (desktop) */
function setupArrivals() {
  const track = $('[data-arrivals]');
  const bar = $('[data-arrivals-bar]');
  gsap.matchMedia().add('(min-width: 900px) and (min-height: 600px)', () => {
    const dist = () => Math.max(0, track.scrollWidth + parseFloat(getComputedStyle(track.parentElement).paddingLeft) - innerWidth + 40);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.arrivals', start: 'top top', end: () => '+=' + dist(), pin: '.arrivals-pin', scrub: reduced ? true : 0.6,
        invalidateOnRefresh: true,
        onUpdate: (s) => (bar.style.transform = `scaleX(${s.progress})`),
      },
    });
    return () => tween.kill();
  });
}

/* ================================================================== inspection hotspots */
function setupChecks() {
  const all = $$('[data-point]');
  all.forEach((b) => b.addEventListener('click', () => all.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.point === b.dataset.point)))));
}

/* ================================================================== makes marquee: drifts, reacts to scroll speed, stops on hover/focus */
function setupMarquee() {
  const row = $('[data-marquee-row]');
  if (reduced || !row) return;
  let x = 0, boost = 0, dir = -1, paused = false, visible = false;
  let w = row.firstElementChild.offsetWidth;
  addEventListener('resize', () => (w = row.firstElementChild.offsetWidth));
  ['pointerenter', 'focusin'].forEach((ev) => row.addEventListener(ev, () => (paused = true)));
  ['pointerleave', 'focusout'].forEach((ev) => row.addEventListener(ev, () => (paused = false)));
  ScrollTrigger.create({
    trigger: '.makes', start: 'top bottom', end: 'bottom top',
    onUpdate: (s) => { dir = s.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(s.getVelocity()) / 140, 14); },
  });
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(row);
  gsap.ticker.add((t, dt) => {
    if (!visible) return;
    x += dir * (0.5 + boost) * (paused ? 0 : 1) * (dt / 16.7);
    boost *= 0.92;
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    row.style.transform = `translate3d(${x}px,0,0)`;
  });
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
