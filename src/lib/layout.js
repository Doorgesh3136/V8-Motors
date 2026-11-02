import '../style.css';
import '../pages.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { DEALER, CARS } from '../data.js';
import { store } from './store.js';

gsap.registerPlugin(ScrollTrigger);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export let lenis = null;

const PAGES = [
  { key: 'inventory', href: 'inventory.html', label: 'Inventory' },
  { key: 'sell', href: 'sell.html', label: 'Sell your car' },
  { key: 'finance', href: 'finance.html', label: 'Finance' },
  { key: 'contact', href: 'contact.html', label: 'Visit us' },
];
const ROUTE_NAMES = {
  '/': 'Home', 'index.html': 'Home', 'inventory.html': 'Inventory', 'sell.html': 'Sell your car',
  'finance.html': 'Finance', 'contact.html': 'Visit us', 'compare.html': 'Compare', 'car.html': 'Car details',
};

const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/></svg>';
const scales = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7Zm10 0-3 7a3 3 0 0 0 6 0l-3-7ZM12 4v16M8 20h8"/></svg>';

/* ------------------------------------------------------------------ nav + footer */
function renderChrome(page, { overlayNav }) {
  const nav = $('[data-site-nav]');
  nav.className = 'nav' + (overlayNav ? '' : ' is-solid');
  nav.setAttribute('data-nav', '');
  nav.innerHTML = `
    <a href="./" class="wordmark" aria-label="V8 Motors home"><span class="wordmark-v8">V8</span><span>Motors</span></a>
    <nav aria-label="Main" class="nav-links">
      ${PAGES.map((p) => `<a href="${p.href}" ${p.key === page ? 'class="is-active" aria-current="page"' : ''}>${p.label}</a>`).join('')}
    </nav>
    <div class="nav-actions">
      <a class="nav-phone tabular-nums" href="${DEALER.phoneHref}">${DEALER.phone}</a>
      <a href="compare.html" class="saved-btn" data-compare-link aria-label="Compare cars">${scales}<span data-compare-count class="tabular-nums">0</span></a>
      <a href="inventory.html?saved=1" class="saved-btn" data-saved-link aria-label="Saved cars">${heart}<span data-saved-count class="tabular-nums">0</span></a>
      <button type="button" class="menu-btn" data-menu aria-expanded="false" aria-controls="mobile-menu">Menu</button>
    </div>`;
  nav.insertAdjacentHTML('afterend', `
    <div id="mobile-menu" class="mobile-menu" hidden>
      <a href="./">Home</a>
      ${PAGES.map((p) => `<a href="${p.href}">${p.label}</a>`).join('')}
      <a href="compare.html">Compare</a>
      <a href="${DEALER.phoneHref}" class="tabular-nums">Call ${DEALER.phone}</a>
    </div>`);
  $('[data-menu]').addEventListener('click', (e) => {
    const m = $('#mobile-menu');
    m.hidden = !m.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!m.hidden));
    if (!m.hidden && !reduced) gsap.from($$('a', m), { y: 16, opacity: 0, stagger: 0.04, duration: 0.5, ease: 'expo.out' });
  });

  if (overlayNav) {
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => nav.classList.toggle('is-solid', s.scroll() > window.innerHeight * 0.8) });
  }
  // hide on scroll down, show on scroll up
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const y = s.scroll();
      nav.classList.toggle('is-hidden', y > last && y > 400 && $('#mobile-menu').hidden);
      last = y;
    },
  });

  const footer = $('[data-site-footer]');
  if (footer) {
    footer.className = 'footer';
    const makes = [...new Set(CARS.map((c) => c.make))].sort();
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <p class="footer-lead">Pre-owned, properly. Inspected cars with a 12-month warranty, in Beau Bassin since 2009.</p>
            <a class="btn btn-red" href="contact.html" data-magnetic>Plan a visit</a>
          </div>
          <nav aria-label="Footer: pages"><p class="footer-h">Pages</p>
            <a href="./">Home</a>${PAGES.map((p) => `<a href="${p.href}">${p.label}</a>`).join('')}<a href="compare.html">Compare</a></nav>
          <nav aria-label="Footer: makes"><p class="footer-h">Makes in stock</p>
            ${makes.slice(0, 8).map((m) => `<a href="inventory.html?make=${encodeURIComponent(m)}">${m}</a>`).join('')}</nav>
          <div><p class="footer-h">Showroom</p>
            <p>${DEALER.address}</p><p><a href="${DEALER.phoneHref}" class="tabular-nums">${DEALER.phone}</a></p>
            <p><a href="mailto:${DEALER.email}">${DEALER.email}</a></p></div>
        </div>
        <p class="footer-mark" data-stretch-view aria-hidden="true">V8 Motors</p>
        <div class="footer-row">
          <p>© ${new Date().getFullYear()} V8 Motors Ltd. Prices include VAT. Finance subject to bank approval.</p>
          <p class="footer-credits">3D model: Ferrari 458 Italia by vicent091036 (three.js examples). Photos from Unsplash.</p>
        </div>
      </div>`;
  }
}

function syncCounts() {
  const s = store.saved().length, c = store.compare().length;
  $$('[data-saved-count]').forEach((n) => (n.textContent = s));
  $$('[data-compare-count]').forEach((n) => (n.textContent = c));
  $$('[data-saved-link]').forEach((n) => { n.classList.toggle('has-saved', s > 0); n.setAttribute('aria-label', `Saved cars (${s})`); });
  $$('[data-compare-link]').forEach((n) => { n.classList.toggle('has-compare', c > 0); n.setAttribute('aria-label', `Compare cars (${c})`); });
}
export function bump(sel) {
  $$(sel).forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
}

/* ------------------------------------------------------------------ toast */
let toastTimer;
export function toast(msg, action) {
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${msg}</span>${action ? `<a href="${action.href}">${action.label}</a>` : ''}`;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
}

/* ------------------------------------------------------------------ page transitions */
const supportsCrossDocVT = 'onpagereveal' in window && CSS.supports('view-transition-name: a');
const HERO_KEY = 'v8:vt-hero';
const fileOf = (url) => new URL(url, location.href).pathname.split('/').pop() || 'index.html';
const routeName = (url) => ROUTE_NAMES[fileOf(url)] || '';

function clearNames() {
  $$('[style*="view-transition-name"]').forEach((x) => (x.style.viewTransitionName = ''));
}

function initTransitions() {
  if (supportsCrossDocVT) {
    document.documentElement.classList.add('vt');
    // Outgoing page: only keep the shared car photo if we're actually going to that car's page.
    window.addEventListener('pageswap', (e) => {
      const to = e.activation?.entry?.url;
      const heroId = sessionStorage.getItem(HERO_KEY);
      const goingToThatCar = to && fileOf(to) === 'car.html' && new URL(to).searchParams.get('id') === heroId;
      if (!e.viewTransition || !goingToThatCar) {
        clearNames();
        sessionStorage.removeItem(HERO_KEY);
      }
    });
    // Incoming page: name the car photo only when the previous page named the matching card.
    window.addEventListener('pagereveal', (e) => {
      const heroId = sessionStorage.getItem(HERO_KEY);
      sessionStorage.removeItem(HERO_KEY);
      const hero = $('[data-vt-hero]');
      if (!e.viewTransition) return;
      if (hero && heroId && hero.dataset.vtHero === heroId) {
        hero.style.viewTransitionName = 'car-hero';
        e.viewTransition.finished.finally(() => (hero.style.viewTransitionName = ''));
      }
    });
    // Coming back through the back/forward cache: drop any stale names.
    window.addEventListener('pageshow', (e) => { if (e.persisted) clearNames(); });
    return;
  }

  // JS curtain fallback (Firefox and older browsers).
  const curtain = document.createElement('div');
  curtain.className = 'curtain';
  curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = '<span class="curtain-label" data-curtain-label></span><span class="curtain-bar"></span>';
  document.body.appendChild(curtain);
  const arriving = sessionStorage.getItem('v8:curtain');
  sessionStorage.removeItem('v8:curtain');
  if (arriving !== null && !reduced) {
    curtain.classList.add('is-covering');
    $('[data-curtain-label]', curtain).textContent = arriving;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      curtain.classList.remove('is-covering');
      curtain.classList.add('is-leaving');
      setTimeout(() => curtain.classList.remove('is-leaving'), 1000);
    }));
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || reduced || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash link
    e.preventDefault();
    const label = routeName(url.href);
    $('[data-curtain-label]', curtain).textContent = label;
    sessionStorage.setItem('v8:curtain', label);
    curtain.classList.remove('is-leaving');
    curtain.classList.add('is-entering');
    setTimeout(() => location.assign(url.href), 560);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) curtain.classList.remove('is-entering', 'is-covering', 'is-leaving'); });
}

/** Mark a card photo to morph into the car page's main photo on the next navigation. */
export function nameForTransition(el, name, carId) {
  if (!supportsCrossDocVT || !el) return;
  clearNames();
  el.style.viewTransitionName = name;
  if (carId) sessionStorage.setItem(HERO_KEY, carId);
}

/* ------------------------------------------------------------------ smooth scroll */
function initLenis() {
  if (reduced) return;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    lenis.scrollTo(t, { offset: -80, duration: 1.3 });
  });
}
export function scrollToEl(el, offset = -80) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.3 });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

/* ------------------------------------------------------------------ cursor */
function initCursor() {
  if (!finePointer || reduced) return;
  const c = document.createElement('div');
  c.className = 'cursor is-out'; // hidden until the pointer first moves
  c.innerHTML = '<span class="cursor-label"></span>';
  document.body.appendChild(c);
  const label = $('.cursor-label', c);
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  let first = true;
  window.addEventListener('pointermove', (e) => {
    if (first) { gsap.set(c, { x: e.clientX, y: e.clientY }); c.classList.remove('is-out'); first = false; }
    xTo(e.clientX); yTo(e.clientY);
    const t = e.target.closest?.('[data-cursor]');
    c.classList.toggle('has-label', !!t);
    if (t) label.textContent = t.dataset.cursor;
    c.classList.toggle('is-link', !t && !!e.target.closest?.('a, button, select, label, input[type=range]'));
    c.classList.toggle('is-text', !!e.target.closest?.('input:not([type=range]), textarea'));
  });
  document.addEventListener('pointerleave', () => c.classList.add('is-out'));
  document.addEventListener('pointerenter', () => c.classList.remove('is-out'));
  window.addEventListener('pointerdown', () => c.classList.add('is-down'));
  window.addEventListener('pointerup', () => c.classList.remove('is-down'));
}

/* ------------------------------------------------------------------ magnetic buttons */
export function magnetize(root = document) {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]', root).forEach((el) => {
    if (el.dataset.magnetized) return;
    el.dataset.magnetized = '1';
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ------------------------------------------------------------------ tilt cards */
export function tilt(root = document) {
  if (!finePointer || reduced) return;
  $$('[data-tilt]', root).forEach((el) => {
    if (el.dataset.tilted) return;
    el.dataset.tilted = '1';
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 9); rx((0.5 - py) * 7);
      el.style.setProperty('--gx', px * 100 + '%');
      el.style.setProperty('--gy', py * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ------------------------------------------------------------------ headings that stretch in */
export function stretchHeadings(root = document) {
  if (reduced) return;
  $$('[data-stretch-view]', root).forEach((el) => {
    gsap.fromTo(el, { '--wdth': 62 }, {
      '--wdth': 125, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 50%', scrub: 0.6 },
    });
  });
}

/** Split a heading into lines that rise in on load. */
export function riseIn(el, delay = 0.15) {
  if (!el || reduced) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="rise"><span>${w}</span></span>`).join(' ');
  gsap.from($$('.rise > span', el), { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.05, delay });
  gsap.fromTo(el, { '--wdth': 70 }, { '--wdth': 125, duration: 1.4, ease: 'expo.inOut', delay });
}

/** Fade-up the elements marked [data-reveal] as they enter. */
export function reveals(root = document) {
  if (reduced) return;
  $$('[data-reveal]', root).forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}

/* ------------------------------------------------------------------ boot */
export function initLayout(page, { overlayNav = false } = {}) {
  // Only the home page (with its pinned 3D scene) always starts at the top; other pages keep their place on Back.
  if ('scrollRestoration' in history) history.scrollRestoration = page === 'home' ? 'manual' : 'auto';
  renderChrome(page, { overlayNav });
  initTransitions();
  initLenis();
  initCursor();
  syncCounts();
  window.addEventListener('store:change', syncCounts);
  magnetize();
  stretchHeadings($('[data-site-footer]') || document.createElement('div'));
  return { lenis };
}
