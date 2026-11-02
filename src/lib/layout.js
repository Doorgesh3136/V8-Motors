import '../site.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { store } from './store.js';

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
/** Relative prefix back to the site root ('' on root pages, '../' inside /cars/). */
export const P = location.pathname.includes('/cars/') ? '../' : '';
export let lenis = null;

/* ------------------------------------------------------------------ saved / compare state */
export function syncStoreUI() {
  const saved = store.saved(), cmp = store.compare();
  $$('[data-saved-count]').forEach((n) => (n.textContent = saved.length));
  $$('[data-compare-count]').forEach((n) => (n.textContent = cmp.length));
  $$('[data-saved-link]').forEach((n) => { n.classList.toggle('is-on', saved.length > 0); n.setAttribute('aria-label', `${saved.length} saved car${saved.length === 1 ? '' : 's'}`); });
  $$('[data-compare-link]').forEach((n) => { n.classList.toggle('is-on', cmp.length > 0); n.setAttribute('aria-label', `${cmp.length} car${cmp.length === 1 ? '' : 's'} to compare`); });
  $$('[data-save]').forEach((b) => b.setAttribute('aria-pressed', String(saved.includes(b.dataset.save))));
  $$('[data-compare]').forEach((b) => b.setAttribute('aria-pressed', String(cmp.includes(b.dataset.compare))));
}
export function bump(sel) {
  $$(sel).forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
}

/* ------------------------------------------------------------------ toast (small, never covers the page) */
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
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3600);
}

/* ------------------------------------------------------------------ privacy notice
   The site only uses localStorage for saved cars and this notice, and no tracking, so this
   is a notice rather than a consent wall. It sits in a corner and never blocks the page. */
function privacyNotice() {
  if (localStorage.getItem('v8:notice')) return;
  const n = document.createElement('div');
  n.className = 'notice';
  n.setAttribute('role', 'region');
  n.setAttribute('aria-label', 'Privacy notice');
  n.innerHTML = `<p>No tracking here. Your saved cars stay on this device. <a href="${P}privacy.html">Privacy policy</a></p>
    <button type="button" class="btn btn-line btn-sm">OK</button>`;
  document.body.appendChild(n);
  requestAnimationFrame(() => n.classList.add('is-on'));
  $('button', n).addEventListener('click', () => {
    localStorage.setItem('v8:notice', '1');
    n.classList.remove('is-on');
    setTimeout(() => n.remove(), 500);
  });
}

/* ------------------------------------------------------------------ page transitions: curtains
   Leaving: three layers per side (amber edge, panel, ink) sweep in and meet in the middle,
   showing the logo and where you're going. The next page paints with the curtain already
   closed (a class set in <head> before first paint), then the layers open outwards. */
const html = document.documentElement;
export const viaCurtain = html.classList.contains('curtain-in');
const ROUTES = {
  'index.html': 'Home', 'inventory.html': 'Inventory', 'sell.html': 'Sell your car', 'finance.html': 'Finance',
  'contact.html': 'Visit us', 'compare.html': 'Compare', 'privacy.html': 'Privacy policy', 'terms.html': 'Terms of sale',
};
const fileOf = (url) => new URL(url, location.href).pathname.split('/').pop() || 'index.html';

let resolveOpen;
/** Resolves once the arrival curtain has opened (immediately if there wasn't one). */
export const curtainOpen = new Promise((r) => (resolveOpen = r));

function initCurtain() {
  const c = $('[data-curtain]');
  const label = $('[data-curtain-label]');
  if (!c) { resolveOpen(); return; }
  const L = $$('.curtain-side--l .cl', c), R = $$('.curtain-side--r .cl', c);
  const mid = $('.curtain-mid', c);

  // arriving: open
  if (viaCurtain) {
    label.textContent = sessionStorage.getItem('v8:curtain') || '';
    sessionStorage.removeItem('v8:curtain');
    gsap.timeline({ onComplete: () => { html.classList.remove('curtain-in'); gsap.set([...L, ...R, mid], { clearProps: 'all' }); resolveOpen(); } })
      .to(mid, { opacity: 0, y: -14, duration: 0.25, ease: 'power2.in' }, 0.05)
      .to([...L].reverse(), { xPercent: -101, duration: 0.8, ease: 'expo.inOut', stagger: 0.06 }, 0.15)
      .to([...R].reverse(), { xPercent: 101, duration: 0.8, ease: 'expo.inOut', stagger: 0.06 }, 0.15);
    setTimeout(resolveOpen, 550); // let the page start its own entrance while the curtain is still opening
  } else {
    sessionStorage.removeItem('v8:curtain');
    resolveOpen();
  }
  if (reduced) return;

  // warm up the next page as soon as a link is hovered or touched
  const warmed = new Set();
  const warm = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || !isInternal(a, e)) return;
    const href = new URL(a.href, location.href).href.split('#')[0];
    if (warmed.has(href)) return;
    warmed.add(href);
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href;
    document.head.appendChild(l);
  };
  addEventListener('pointerover', warm, { passive: true });
  addEventListener('touchstart', warm, { passive: true });

  // leaving: close, then go
  let leaving = false;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || leaving || !isInternal(a, e)) return;
    e.preventDefault();
    leaving = true;
    const url = new URL(a.href, location.href);
    const file = fileOf(url);
    const name = url.pathname.includes('/cars/')
      ? (a.closest('.car')?.querySelector('.car-title')?.textContent || a.textContent || '').trim()
      : ROUTES[file] || 'V8 Motors';
    label.textContent = name;
    c.classList.add('is-active');
    gsap.timeline({ onComplete: () => { sessionStorage.setItem('v8:curtain', name); location.assign(url.href); } })
      .fromTo(L, { xPercent: -101 }, { xPercent: 0, duration: 0.6, ease: 'power3.inOut', stagger: 0.075 }, 0)
      .fromTo(R, { xPercent: 101 }, { xPercent: 0, duration: 0.6, ease: 'power3.inOut', stagger: 0.075 }, 0)
      .fromTo(mid, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.5)
      .to({}, { duration: 0.08 });
  });
  // coming back via the back button restores the old page from cache: make sure it's open
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    c.classList.remove('is-active');
    html.classList.remove('curtain-in');
    gsap.set([...L, ...R, mid], { clearProps: 'all' });
  });
}

function isInternal(a, e) {
  if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target === '_blank' || a.hasAttribute('download')) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  if (!/(\.html|\/)$/.test(url.pathname)) return false;
  if (url.pathname === location.pathname && url.search === location.search) return false; // same page or #hash
  return true;
}

/** Kept for card links; the curtain handles the transition now. */
export function nameForTransition() {}

/* ------------------------------------------------------------------ scrolling */
function initScroll() {
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    scrollToEl(t);
  });
  // Desktop nav hides while reading down and returns on the way up.
  const nav = $('[data-nav]');
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const y = s.scroll();
      nav?.classList.toggle('is-scrolled', y > 8);
      nav?.classList.toggle('is-hidden', y > last && y > 480);
      last = y;
    },
  });
}
export function scrollToEl(el, offset = -88) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.2 });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

/* ------------------------------------------------------------------ page title entrance */
export function titleIn(el, delay = 0.1) {
  if (!el || reduced) return;
  if (viaCurtain) delay += 0.55; // rise as the curtain opens
  // transform + clip only: animating the font width here would re-wrap the title and shift the page
  gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)', y: 28 }, { clipPath: 'inset(0 0 -10% 0)', y: 0, duration: 1.1, ease: 'expo.out', delay, clearProps: 'clipPath,transform' });
}

/* ------------------------------------------------------------------ forms: spam protection + validation */
/** Honeypot field + minimum fill time. True when the submission looks automated. */
export function looksLikeSpam(form) {
  const hp = form.querySelector('input[name="website"]');
  const started = +form.dataset.started || 0;
  return !!(hp && hp.value) || (started > 0 && Date.now() - started < 2500);
}
export function armForm(form) { if (form) form.dataset.started = Date.now(); }

/** Shows a message under each invalid field. Returns the first invalid field, or null. */
export function validateFields(fields) {
  let first = null;
  for (const [input, message] of fields) {
    const wrap = input.closest('.input');
    let msg = wrap?.querySelector('.input-error');
    input.setAttribute('aria-invalid', String(!!message));
    if (message) {
      if (!msg && wrap) {
        msg = document.createElement('span');
        msg.className = 'input-error';
        msg.id = `err-${input.name}-${Math.random().toString(36).slice(2, 7)}`;
        wrap.appendChild(msg);
      }
      if (msg) { msg.textContent = message; input.setAttribute('aria-describedby', msg.id); }
      first ??= input;
    } else if (msg) {
      msg.remove();
      input.removeAttribute('aria-describedby');
    }
  }
  first?.focus();
  return first;
}
export const phoneOk = (v) => v.replace(/\D/g, '').length >= 7;

/* ------------------------------------------------------------------ boot */
export function initLayout({ home = false } = {}) {
  if ('scrollRestoration' in history) history.scrollRestoration = home ? 'manual' : 'auto';
  initCurtain();
  initScroll();
  syncStoreUI();
  window.addEventListener('store:change', syncStoreUI);
  setTimeout(privacyNotice, home ? 4000 : 900);
  $$('form').forEach(armForm);
  return { lenis };
}
