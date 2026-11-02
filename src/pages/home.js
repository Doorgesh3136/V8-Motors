import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$ } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { renderStatus } from '../lib/hours.js';
import { CARS, rs, monthly } from '../data.js';

const FIRING = [1, 8, 4, 3, 6, 5, 7, 2]; // V8 firing order
const { lenis } = initLayout({ home: true });
wireCardActions();
renderStatus($('[data-open-status]'));

const playIntro = document.documentElement.classList.contains('play-intro');
if (playIntro) lenis?.stop();

runIntro().then(() => {
  document.documentElement.classList.remove('play-intro');
  sessionStorage.setItem('v8:intro', '1');
  lenis?.start();
  if (!heroStarted) heroIn();
  setupSearch();
  setupArrivals();
  setupChecks();
  setupMarquee();
  setupMoney();
  ScrollTrigger.refresh();
});

/* ================================================================== intro
   1. The two cylinder banks extrude out of the crank, the eight bores drop in.
   2. While the hero photo and fonts load, the bores fire in V8 firing order (1-8-4-3-6-5-7-2).
   3. Everything fires at once, and the V becomes a window that opens onto the hero photo. */
function waitForAssets() {
  const img = $('[data-hero-img]');
  const loaded = img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const decoded = loaded.then(() => img.decode?.().catch(() => {}));
  const timeout = new Promise((r) => setTimeout(r, 5000)); // slow connection: never hold the page hostage
  return Promise.race([Promise.all([decoded, document.fonts.ready]), timeout]);
}

async function runIntro() {
  const intro = $('[data-intro]');
  if (!playIntro) { intro?.remove(); return; }

  const banks = $$('.intro-bank', intro);
  const bores = $$('.intro-bore', intro);
  const crank = $('.intro-crank', intro);
  const mark = $('[data-intro-mark]', intro);
  const word = $('[data-intro-word]', intro);
  const orderWrap = $('[data-intro-order]', intro);
  const order = $$('span', orderWrap);
  const byCyl = (n) => bores.find((b) => +b.dataset.cyl === n);

  // 1. assemble
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .fromTo(crank, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 0)
    .fromTo(banks, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: 'power3.inOut' }, 0.15)
    .fromTo(bores, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, stagger: 0.05, ease: 'back.out(3)' }, 0.55)
    .fromTo(word, { opacity: 0, y: 14, '--wdth': 70 }, { opacity: 1, y: 0, '--wdth': 125, duration: 1.1 }, 0.7)
    .fromTo(order, { opacity: 0 }, { opacity: 0.35, duration: 0.4, stagger: 0.03 }, 0.9);

  // 2. fire in order until the page is ready (at least one full cycle)
  let ready = false;
  const assets = waitForAssets().then(() => (ready = true));
  const fire = gsap.timeline({ repeat: -1, delay: 1.1 });
  FIRING.forEach((n, i) => {
    fire.to(byCyl(n), { fill: '#f0a030', duration: 0.05 }, i * 0.11)
      .to(byCyl(n), { fill: '#0c1722', duration: 0.35, ease: 'power2.out' }, i * 0.11 + 0.06)
      .to(order[i], { opacity: 1, color: '#f0a030', duration: 0.05 }, i * 0.11)
      .to(order[i], { opacity: 0.35, color: '#9aa8b5', duration: 0.35 }, i * 0.11 + 0.06);
  });
  await Promise.all([assets, new Promise((r) => setTimeout(r, 2300))]);
  while (!ready) await new Promise((r) => setTimeout(r, 100));
  fire.kill();

  // 3. full throttle, then open the V onto the hero
  const box = mark.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height * 0.5;
  const W = innerWidth, H = innerHeight;
  // A V with a notch; as it grows the notch closes, so the hole becomes a solid shape that clears the screen.
  const hole = { s: box.width * 0.45, notch: 0.42 };
  const draw = () => {
    const s = hole.s, n = hole.notch;
    const pts = [[-1, -0.75], [-0.56, -0.75], [0, n], [0.56, -0.75], [1, -0.75], [0.2, 1], [-0.2, 1]]
      .map(([x, y]) => `${(cx + x * s).toFixed(1)} ${(cy + y * s).toFixed(1)}`);
    intro.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${pts.join(' L')}Z")`;
  };

  await gsap.timeline({ defaults: { ease: 'expo.inOut' } })
    .to(bores, { fill: '#f0a030', duration: 0.12, ease: 'none' })
    .to(order, { opacity: 1, color: '#f0a030', duration: 0.12 }, '<')
    .to(mark, { scale: 1.1, transformOrigin: '50% 50%', duration: 0.45, ease: 'power2.in' }, '<')
    .to([mark, word, orderWrap], { opacity: 0, duration: 0.3, ease: 'power1.in' }, '-=0.12')
    .add(draw, '-=0.3')
    .to(hole, { s: Math.hypot(W, H) * 1.7, notch: -0.75, duration: 1.15, onUpdate: draw }, '-=0.3')
    .fromTo('[data-hero-img]', { scale: 1.16 }, { scale: 1, duration: 1.7, ease: 'expo.out' }, '<')
    .add(heroIn, '-=1.25'); // the headline rises while the window is still opening
  intro.remove();
}

/* ================================================================== hero */
let heroStarted = false;
function heroIn() {
  heroStarted = true;
  gsap.set('.hero-inner', { opacity: 1 });
  if (reduced) return;
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from($$('[data-hero-title] .line > span'), { yPercent: 110, duration: 1.2, stagger: 0.08 })
    .fromTo('[data-hero-title]', { '--wdth': 70 }, { '--wdth': 125, duration: 1.4, ease: 'expo.inOut' }, 0)
    .from('[data-hero-fade]', { opacity: 0, y: 24, duration: 1, stagger: 0.1, clearProps: 'opacity,transform' }, 0.35);
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
