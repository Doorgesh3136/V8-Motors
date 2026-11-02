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
  $$('[data-saved-link]').forEach((n) => { n.classList.toggle('is-on', saved.length > 0); n.setAttribute('aria-label', `Saved cars (${saved.length})`); });
  $$('[data-compare-link]').forEach((n) => { n.classList.toggle('is-on', cmp.length > 0); n.setAttribute('aria-label', `Compare cars (${cmp.length})`); });
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

/* ------------------------------------------------------------------ page transitions */
const supportsCrossDocVT = 'onpagereveal' in window && CSS.supports('view-transition-name: a');
const HERO_KEY = 'v8:vt-hero';
const fileOf = (url) => new URL(url, location.href).pathname.split('/').pop() || 'index.html';
const clearNames = () => $$('[style*="view-transition-name"]').forEach((x) => (x.style.viewTransitionName = ''));

function initTransitions() {
  if (supportsCrossDocVT) {
    document.documentElement.classList.add('vt');
    window.addEventListener('pageswap', (e) => {
      const to = e.activation?.entry?.url;
      const heroId = sessionStorage.getItem(HERO_KEY);
      if (!e.viewTransition || !to || fileOf(to) !== `${heroId}.html`) { clearNames(); sessionStorage.removeItem(HERO_KEY); }
    });
    window.addEventListener('pagereveal', (e) => {
      const heroId = sessionStorage.getItem(HERO_KEY);
      sessionStorage.removeItem(HERO_KEY);
      const hero = $('[data-vt-hero]');
      if (e.viewTransition && hero && heroId && hero.dataset.vtHero === heroId) {
        hero.style.viewTransitionName = 'car-hero';
        e.viewTransition.finished.finally(() => (hero.style.viewTransitionName = ''));
      }
    });
    window.addEventListener('pageshow', (e) => { if (e.persisted) clearNames(); });
    return;
  }

  // Fallback (Firefox): a short wipe in the brand colour.
  const curtain = document.createElement('div');
  curtain.className = 'curtain';
  curtain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(curtain);
  if (sessionStorage.getItem('v8:curtain') && !reduced) {
    curtain.classList.add('is-covering');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      curtain.classList.remove('is-covering');
      curtain.classList.add('is-leaving');
      setTimeout(() => curtain.classList.remove('is-leaving'), 900);
    }));
  }
  sessionStorage.removeItem('v8:curtain');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || reduced || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    sessionStorage.setItem('v8:curtain', '1');
    curtain.classList.add('is-entering');
    setTimeout(() => location.assign(url.href), 480);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) curtain.className = 'curtain'; });
}

/** Mark a card photo to morph into the car page's main photo on the next navigation. */
export function nameForTransition(el, carId) {
  if (!supportsCrossDocVT || !el) return;
  clearNames();
  el.style.viewTransitionName = 'car-hero';
  sessionStorage.setItem(HERO_KEY, carId);
}

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
  initTransitions();
  initScroll();
  syncStoreUI();
  window.addEventListener('store:change', syncStoreUI);
  setTimeout(privacyNotice, home ? 4000 : 900);
  $$('form').forEach(armForm);
  return { lenis };
}
