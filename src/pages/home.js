import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, magnetize, tilt, stretchHeadings } from '../lib/layout.js';
import { carCard, wireCardActions, shapeSvg } from '../lib/card.js';
import { renderStatus } from '../lib/hours.js';
import { CARS, DEALER, FEATURED, PAINTS, BODY_TYPES, rs, monthly } from '../data.js';
import { createTach } from '../loader.js';

const firstVisit = !sessionStorage.getItem('v8:seen-loader');
document.body.classList.add('is-loading');
const { lenis } = initLayout('home', { overlayNav: true });
lenis?.stop();
wireCardActions();

// ---------------------------------------------------------------- content
const minMonthly = rs(Math.round(Math.min(...CARS.map((c) => monthly(c.price))) / 100) * 100);
$('[data-car-count]').textContent = CARS.filter((c) => c.status !== 'Reserved').length;
$('[data-min-monthly]').textContent = minMonthly;
$('[data-min-monthly-2]').textContent = minMonthly;
$('[data-total-cars]').textContent = CARS.length;
$('[data-address]').textContent = DEALER.address;
renderStatus($('[data-open-status]'));
$('[data-featured-title]').textContent = FEATURED.title;
$('[data-featured-year]').textContent = FEATURED.year;
$('[data-featured-specs]').innerHTML = FEATURED.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
$('[data-featured-price]').textContent = rs(FEATURED.price);

// Just arrived rail
const newest = [...CARS].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 8);
$('[data-arrivals]').innerHTML = newest.map((c) => carCard(c)).join('') +
  `<li class="arrivals-end"><a href="inventory.html" class="arrivals-end-link" data-cursor="Browse"><span>All ${CARS.length} cars</span><span class="arrivals-end-arrow" aria-hidden="true"></span></a></li>`;

// Makes marquee
const makes = [...new Set(CARS.map((c) => c.make))].sort();
const makeItems = makes.map((m) => `<a href="inventory.html?make=${encodeURIComponent(m)}" class="marquee-item">${m}<sup class="tabular-nums">${CARS.filter((c) => c.make === m).length}</sup></a>`).join('');
$('[data-marquee-row]').innerHTML = `<div class="marquee-set">${makeItems}</div><div class="marquee-set" aria-hidden="true">${makeItems.replaceAll('<a ', '<a tabindex="-1" ')}</div>`;

// Body tiles
$('[data-body-tiles]').innerHTML = BODY_TYPES.map((t) => {
  const list = CARS.filter((c) => c.body === t);
  if (!list.length) return '';
  const from = Math.min(...list.map((c) => c.price));
  return `<li><a href="inventory.html?body=${t}" class="body-tile" data-cursor="Browse">
    ${shapeSvg(t)}
    <span class="body-tile-name">${t === 'SUV' ? 'SUVs' : t + 's'}</span>
    <span class="body-tile-meta tabular-nums">${list.length} in stock, from ${rs(from)}</span>
  </a></li>`;
}).join('');

magnetize();
tilt();

// ---------------------------------------------------------------- loader + 3D
const tach = firstVisit ? createTach($('#loader'), { reduced }) : null;
if (!firstVisit) $('#loader').classList.add('loader--quick');
let stage = null, STOPS = null;
let fakeP = 0;
const fake = setInterval(() => { fakeP = Math.min(0.85, fakeP + 0.04); tach?.set(fakeP * 0.6); }, 120);

async function boot() {
  try {
    if (!document.createElement('canvas').getContext('webgl2')) throw new Error('WebGL2 unavailable');
    const mod = await import('../scene.js');
    if (mod.deviceProfile().skip3D) throw new Error('Data saver or low-memory device, using the photo instead of 3D');
    STOPS = mod.STOPS;
    stage = mod.createScene($('#gl'), { reduced, onProgress: (p) => tach?.set(0.15 + p * 0.85) });
    await Promise.all([stage.ready, document.fonts.ready, wait(firstVisit && !reduced ? 1300 : 0)]);
  } catch (err) {
    console.warn('3D showroom unavailable, using photo fallback.', err);
    document.documentElement.classList.add('no-webgl');
    stage = null;
    await document.fonts.ready;
  }
  clearInterval(fake);
  window.scrollTo(0, 0);
  if (tach) await tach.finish();
  else await gsap.to('#loader', { opacity: 0, duration: 0.5 }).then(() => $('#loader')?.remove());
  sessionStorage.setItem('v8:seen-loader', '1');
  document.body.classList.remove('is-loading');
  lenis?.start();
  intro();
  setupStage();
  setupArrivals();
  setupMarquee();
  stretchHeadings();
  ScrollTrigger.refresh();
}
boot();

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function intro() {
  if (reduced) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from($$('.hero-title .line > span'), { yPercent: 110, duration: 1.3, stagger: 0.09 })
    .fromTo('.hero-title', { '--wdth': 62 }, { '--wdth': 125, duration: 1.6, ease: 'expo.inOut' }, 0)
    .from('.hero-lede, .hero-ctas', { opacity: 0, y: 20, duration: 1, stagger: 0.08 }, 0.5)
    .from('.featured', { opacity: 0, x: 30, duration: 1.1 }, 0.65)
    .from('.stage-rail li', { opacity: 0, y: 10, stagger: 0.06, duration: 0.8 }, 0.8)
    .from('[data-site-nav]', { yPercent: -100, duration: 1, clearProps: 'transform,translate' }, 0.4);
  if (stage) tl.from(stage.cam, { theta: 4.2, r: 13, y: 2.8, duration: 2.4 }, 0);
}

function setupStage() {
  const row = $('[data-paints]');
  row.innerHTML = PAINTS.map((p, i) =>
    `<button type="button" class="paint" style="--c:${p.hex}" data-paint="${i}" aria-pressed="${i === 0}" aria-label="${p.name} paint"></button>`).join('');
  row.addEventListener('click', (e) => {
    const b = e.target.closest('[data-paint]');
    if (!b) return;
    const p = PAINTS[+b.dataset.paint];
    stage?.setPaint(p.hex);
    $('[data-paint-name]').textContent = p.name;
    $$('[data-paint]', row).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });

  const steps = $$('.stage-copy');
  const rails = $$('[data-rail]');
  const setStep = (i) => {
    rails.forEach((r, k) => r.classList.toggle('is-on', k === i));
    steps.forEach((s, k) => {
      s.setAttribute('aria-hidden', String(k !== i));
      $$('a', s).forEach((a) => (a.tabIndex = k === i ? 0 : -1));
    });
  };
  setStep(0);

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '#stage', start: 'top top', end: 'bottom bottom', scrub: reduced ? true : 1.1,
      onUpdate: (s) => {
        setStep(s.progress < 0.3 ? 0 : s.progress < 0.68 ? 1 : 2);
        stage?.nudgeWheels(Math.abs(s.getVelocity()) / 2500);
      },
    },
  });
  tl.to('[data-step="0"]', { autoAlpha: 0, y: -40, duration: 0.6 }, 0.25)
    .to('.hero-title', { '--wdth': 62, duration: 0.6 }, 0.2)
    .to('.featured', { autoAlpha: 0, y: 20, duration: 0.4 }, 0.25)
    .fromTo('[data-step="1"]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.75)
    .fromTo('[data-step="1"] .check-list li', { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, stagger: 0.08, duration: 0.3 }, 0.9)
    .to('[data-step="1"]', { autoAlpha: 0, y: -40, duration: 0.5 }, 1.65)
    .fromTo('[data-step="2"]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 2.05)
    .to({}, { duration: 0.6 }, 2.55);
  if (stage && STOPS) {
    tl.fromTo(stage.cam, { ...STOPS[0] }, { ...STOPS[1], duration: 1.1, immediateRender: false }, 0.1)
      .fromTo(stage.cam, { ...STOPS[1] }, { ...STOPS[2], duration: 1.1, immediateRender: false }, 1.45);
    ScrollTrigger.create({ trigger: '#stage', start: 'top bottom', end: 'bottom top', onToggle: (s) => stage.setRunning(s.isActive) });
  }
}

/** Vertical scroll drives the "Just arrived" track sideways (desktop). */
function setupArrivals() {
  const track = $('[data-arrivals]');
  const bar = $('[data-arrivals-bar]');
  gsap.matchMedia().add('(min-width: 900px)', () => {
    {
      const dist = () => Math.max(0, track.scrollWidth + parseFloat(getComputedStyle(track.parentElement).paddingLeft) - window.innerWidth + 40);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.arrivals', start: 'top top', end: () => '+=' + dist(), pin: '.arrivals-pin', scrub: reduced ? true : 0.8,
          invalidateOnRefresh: true,
          onUpdate: (s) => {
            bar.style.transform = `scaleX(${s.progress})`;
            if (reduced) return;
            const v = gsap.utils.clamp(-8, 8, s.getVelocity() / -300);
            gsap.to('.arrivals-track .car-media', { skewX: v, duration: 0.4, overwrite: true });
          },
        },
      });
      return () => tween.kill();
    }
  });
}

/** Marquee that runs on its own and speeds up / reverses with scroll velocity. */
function setupMarquee() {
  const row = $('[data-marquee-row]');
  if (reduced) return;
  let x = 0, dir = -1, boost = 0;
  const setW = () => row.firstElementChild.offsetWidth;
  let w = setW();
  window.addEventListener('resize', () => (w = setW()));
  ScrollTrigger.create({
    trigger: '.makes', start: 'top bottom', end: 'bottom top',
    onUpdate: (s) => { dir = s.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(s.getVelocity()) / 120, 18); },
  });
  let hovered = false;
  row.addEventListener('pointerenter', () => (hovered = true));
  row.addEventListener('pointerleave', () => (hovered = false));
  gsap.ticker.add((t, dt) => {
    const speed = hovered ? 0.15 : 1;
    x += dir * (0.6 + boost) * speed * (dt / 16.7);
    boost *= 0.92;
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    row.style.transform = `translate3d(${x}px,0,0) skewX(${(-dir * boost) / 2}deg)`;
  });
}
