/**
 * Small touches that work the same on phones and computers. Every animation here moves
 * only by transform and opacity, so none of it repaints the page.
 *
 * - reveal: sections and cards rise into place as they scroll into view
 * - rev bar: a thin line under the menu bar fills like a rev counter as you scroll, red near the end
 * - swipe: on phones, swipe sideways across a car's photo to flick through all its pictures
 * - count-up: numbers marked data-countup count up when they come into view
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** Card photos fade in once they've arrived (a soft sweep plays over the empty frame until then). */
export function photosArrive() {
  const mark = (img) => img.closest('.car-media')?.classList.add('is-loaded');
  document.querySelectorAll('.car-media img').forEach((img) => { if (img.complete && img.naturalWidth) mark(img); });
  document.addEventListener('load', (e) => { if (e.target.matches?.('.car-media img')) mark(e.target); }, true);
  document.addEventListener('error', (e) => { if (e.target.matches?.('.car-media img')) mark(e.target); }, true);
}

export function initFx({ revealSelector } = {}) {
  tiltCards();
  revBar();
  swipePhotos();
  if (reduced) return;
  reveal(revealSelector);
  countUp();
}

/* ------------------------------------------------------------------ reveal on scroll */
const REVEAL = '.section-head, .grid-cars:not([data-grid]) > li, .body-tiles > li, .makes-grid > li, .swap-copy, .swap-box, .sellband-inner, .footer-grid > *, .reveal';
/* Cards are objects: pointing at one tilts it towards the pointer, the plate lifts off it, and a soft light follows.
   Runs only while a card is being pointed at; on touch screens and with reduced motion, the cards just sit. */
function tiltCards() {
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let card = null, ev = null, raf = 0;
  const apply = () => {
    raf = 0;
    if (!card || !ev) return;
    const r = card.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    card.style.setProperty('--ry', `${((x - 0.5) * 12).toFixed(2)}deg`);
    card.style.setProperty('--rx', `${((0.5 - y) * 9).toFixed(2)}deg`);
    card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--px', ((x - 0.5) * 2).toFixed(3));
    card.style.setProperty('--py', ((y - 0.5) * 2).toFixed(3));
    card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  };
  // A card leans as it scrolls past, and a scroll-linked animation can't ease into anything by itself. So at each hand
  // over the card is held at the angle it has right now, and glides from there, instead of snapping out from under the
  // pointer.
  const hold = (c, from) => {
    c.style.transition = 'none';
    c.style.transform = from;
    void c.offsetWidth;
    c.style.transition = '';
  };
  const enter = (c) => {
    clearTimeout(c._tilt);
    const from = c.style.transform || getComputedStyle(c).transform;
    if (!c.style.transform) c._rest = from; // the angle to go back to: a restarted scroll animation can't report one yet
    c.style.animation = '';
    c.classList.add('is-tilt');
    hold(c, from);
    c.style.transform = '';
  };
  const leave = (c) => {
    const from = getComputedStyle(c).transform;
    c.classList.remove('is-tilt');
    c.style.removeProperty('--rx');
    c.style.removeProperty('--ry');
    c.style.animation = 'none';
    hold(c, from);
    c.style.transform = c._rest;
    c._tilt = setTimeout(() => { c.style.animation = ''; c.style.transform = ''; }, 260);
  };
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest?.('[data-grid] .car, .rail .car, .similar .car') || null;
    if (c !== card) {
      if (card) leave(card);
      card = c;
      if (card) enter(card);
    }
    ev = e;
    if (card && !raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { if (card) leave(card); card = null; });
}

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
