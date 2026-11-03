/**
 * Small interactive touches that work the same on phones and computers. Every animation here moves
 * only by transform and opacity, so none of it repaints the page.
 *
 * - reveal: sections and cards rise into place as they scroll into view
 * - ripples: a ring of light from where you tap a button (and a tiny haptic tick on Android)
 * - rev bar: a thin line under the menu bar fills like a rev counter as you scroll, red near the end
 * - spotlight: a soft light follows the mouse across car cards
 * - swipe: on phones, swipe sideways across a car's photo to flick through all its pictures
 * - count-up: numbers marked data-countup count up when they come into view
 */
import { bgPulse } from './bg.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initFx({ revealSelector } = {}) {
  ripples();
  revBar();
  if (fine) spotlight();
  swipePhotos();
  if (reduced) return;
  reveal(revealSelector);
  countUp();
}

/* ------------------------------------------------------------------ reveal on scroll */
const REVEAL = '.section-head, .grid-cars:not([data-grid]) > li, .body-tiles > li, .makes-grid > li, .swap-copy, .swap-box, .sellband-inner, .footer-grid > *, .reveal';
function reveal(extra) {
  const els = $$(extra ? `${REVEAL}, ${extra}` : REVEAL);
  // only things below the fold are hidden first; whatever is already on screen stays put
  const fold = innerHeight * 0.92;
  const todo = els.filter((el) => el.getBoundingClientRect().top > fold);
  if (!todo.length || !('IntersectionObserver' in window)) return;
  todo.forEach((el) => el.classList.add('rv'));
  const io = new IntersectionObserver((entries) => {
    let i = 0;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.style.setProperty('--rv-d', `${Math.min(i++, 5) * 70}ms`);
      e.target.classList.add('rv-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  todo.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ tap ripples */
function ripples() {
  addEventListener('pointerdown', (e) => {
    const b = e.target.closest?.('.btn, .icon-btn, .tab, .save, .chip, .ignition');
    if (!b || reduced) return;
    const r = b.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span');
    s.className = 'tap-ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.classList.add('has-ripple');
    b.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
    if (e.pointerType === 'touch') navigator.vibrate?.(8);
    if (b.matches('.btn-primary')) bgPulse(e.clientX, e.clientY, 1.6);
  }, { passive: true });
}

/* ------------------------------------------------------------------ rev bar */
function revBar() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const bar = document.createElement('span');
  bar.className = 'revbar';
  bar.setAttribute('aria-hidden', 'true');
  nav.appendChild(bar);
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    bar.style.transform = `scaleX(${p})`;
    bar.classList.toggle('is-red', p > 0.85);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
}

/* ------------------------------------------------------------------ card spotlight (mouse) */
function spotlight() {
  addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.car, .body-tile, .make-link, .swap-box, .panel');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ------------------------------------------------------------------ swipe through a card's photos (touch) */
function swipePhotos() {
  let start = null;
  addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    // the card's title link is stretched over the whole card, so find the photo from the card
    const media = e.target.closest?.('.car')?.querySelector('[data-scrub]') || e.target.closest?.('[data-scrub]');
    if (!media || media.dataset.scrub.split('|').length < 2) return;
    const r = media.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    start = { media, x: e.clientX, y: e.clientY, done: false };
  }, { passive: true });
  addEventListener('pointermove', (e) => {
    if (!start || start.done || e.pointerType !== 'touch') return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) < 28 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    start.done = true;
    step(start.media, dx < 0 ? 1 : -1);
    // the swipe was for the photos, not the link underneath
    const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallow, { capture: true }), 350);
    setTimeout(() => { start = null; }, 400);
  }, { passive: true });
  addEventListener('pointerup', () => { if (start && !start.done) start = null; }, { passive: true });
  addEventListener('pointercancel', () => { start = null; }, { passive: true });
}
function step(media, dir) {
  const list = media.dataset.scrub.split('|');
  const img = media.querySelector('img');
  if (!media._orig) media._orig = { src: img.src, srcset: img.srcset };
  const i = ((media._sw ?? 0) + dir + list.length) % list.length;
  media._sw = i;
  const next = i === 0 ? media._orig.src : list[i];
  const pre = new Image();
  pre.src = next;
  const show = () => {
    img.srcset = i === 0 ? media._orig.srcset : '';
    img.src = next;
    if (!reduced) img.animate([{ opacity: 0.4, transform: `translateX(${dir * 18}px)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
  };
  pre.decode ? pre.decode().then(show, show) : show();
  media.querySelectorAll('.car-ticks i').forEach((t, k) => t.classList.toggle('is-on', k === i));
  media.classList.add('is-scrubbing');
  navigator.vibrate?.(6);
}

/* ------------------------------------------------------------------ count-up numbers */
function countUp() {
  const els = $$('[data-countup]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target, to = parseInt(el.textContent.replace(/\D/g, ''), 10);
      if (!to) continue;
      const t0 = performance.now(), dur = 1100 + Math.min(900, to * 4);
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
  els.forEach((el) => io.observe(el));
}
