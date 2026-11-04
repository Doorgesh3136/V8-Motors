/**
 * Quick pick: a deck of every car in stock, one at a time. Swipe (or drag) right to save it, left to skip;
 * the buttons and the arrow keys do the same, and tapping a card opens the car. Saved cars go to the
 * same list as the hearts on the cards. The order is shuffled once a day, so it's fresh tomorrow.
 * Only transform and opacity move, and only the top three cards exist at any time.
 */
import { CARS, rs, monthly, thumb, km } from '../data.js';
import { store } from './store.js';
import { syncStoreUI, bump, toast, P } from './layout.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ICON = {
  fuel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M8 8h3"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16M12 4v16M18 4v8M6 12h12"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16a8 8 0 1 1 16 0M12 16l4-5"/></svg>',
};

/** A shuffle that stays the same all day (Mauritius date), so the deck doesn't reshuffle on every visit. */
export function dailyOrder(list) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Mauritius' }).format(new Date());
  let seed = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function cardHTML(c) {
  return `<a class="deck-card" href="${P}cars/${c.id}.html" data-id="${c.id}" draggable="false">
    <img src="${thumb(c, 0, 960, P)}" width="960" height="634" alt="" draggable="false" decoding="async">
    <span class="deck-stamp deck-stamp--save" aria-hidden="true">Park</span>
    <span class="deck-stamp deck-stamp--skip" aria-hidden="true">Skip</span>
    <span class="deck-info">
      <span class="car-kicker tabular-nums">${[c.year, c.body, c.colour].filter(Boolean).map(esc).join(' · ')}</span>
      <span class="deck-name">${esc(c.make)} ${esc(c.model)}</span>
      <span class="deck-price tabular-nums">${rs(c.price)} <small>or about ${rs(monthly(c.price))} a month</small></span>
      <span class="car-specs">
        <span>${ICON.fuel}${c.engine ? `${esc(c.engine)} ` : ''}${esc(c.fuel)}</span>
        <span>${ICON.gear}${esc(c.gearbox)}</span>
        ${c.km != null ? `<span>${ICON.gauge}${km(c.km)}</span>` : ''}
      </span>
    </span>
  </a>`;
}

export function initDeck(root = document.querySelector('[data-deck]')) {
  if (!root) return;
  const stack = root.querySelector('[data-deck-stack]');
  const order = dailyOrder(CARS);
  const $n = (k) => document.querySelector(`[data-deck-${k}]`);
  let i = 0, savedHere = 0, busy = false;
  $n('total').textContent = order.length;

  const tally = () => {
    $n('seen').textContent = Math.min(i, order.length);
    $n('saved').textContent = savedHere;
  };
  const top = () => stack.querySelector('.deck-card:not(.is-gone)');
  const openLink = root.querySelector('[data-deck-open]');

  /** Keeps three cards in the stack, the top one first. */
  function fill() {
    const live = [...stack.querySelectorAll('.deck-card:not(.is-gone)')];
    for (let k = live.length; k < 3 && i + k < order.length; k++) {
      stack.insertAdjacentHTML('beforeend', cardHTML(order[i + k]));
    }
    [...stack.querySelectorAll('.deck-card:not(.is-gone)')].forEach((el, depth) => {
      el.style.setProperty('--depth', depth);
      el.toggleAttribute('inert', depth > 0);
      el.tabIndex = depth === 0 ? 0 : -1;
    });
    const t = top();
    if (t) { openLink.href = t.getAttribute('href'); openLink.setAttribute('aria-label', `Open the ${t.querySelector('.deck-name').textContent}`); }
    if (!t) end();
    // warm the photo after next
    const next = order[i + 3];
    if (next) Object.assign(new Image(), { src: thumb(next, 0, 960, P) });
  }

  function end() {
    root.classList.add('is-done');
    stack.innerHTML = `<div class="deck-end">
      <p class="deck-end-title">That’s all <em>${order.length}.</em></p>
      <p>You parked ${savedHere} ${savedHere === 1 ? 'car' : 'cars'} this round.</p>
      <div class="deck-end-actions">
        <a class="btn btn-primary" href="${P}inventory.html?saved=1">Open my garage</a>
        <button type="button" class="btn btn-line" data-deck-again>Start again</button>
      </div></div>`;
    stack.querySelector('[data-deck-again]').addEventListener('click', () => {
      i = 0; savedHere = 0; root.classList.remove('is-done'); stack.innerHTML = ''; tally(); fill();
      top()?.focus({ preventScroll: true });
    });
  }

  /** Sends the top card off to one side, then commits the choice. */
  function decide(dir, card = top()) {
    if (!card || busy) return;
    busy = true;
    const id = card.dataset.id;
    if (dir > 0) {
      if (!store.isSaved(id)) store.toggleSaved(id);
      savedHere++;
      syncStoreUI();
      bump('[data-saved-link]');
      if (savedHere === 1) toast('Parked in your garage.', { href: `${P}inventory.html?saved=1`, label: 'Open garage' });
    }
    navigator.vibrate?.(dir > 0 ? [8, 40, 12] : 6);
    card.classList.add('is-gone');
    card.style.transition = reduced ? 'none' : '';
    const w = stack.offsetWidth;
    card.style.transform = `translate(${dir * w * 1.35}px, ${-20 + Math.random() * 40}px) rotate(${dir * 18}deg)`;
    card.style.opacity = '0';
    card.style.setProperty('--save', dir > 0 ? 1 : 0);
    card.style.setProperty('--skip', dir < 0 ? 1 : 0);
    i++;
    tally();
    setTimeout(() => { card.remove(); busy = false; fill(); }, reduced ? 0 : 380);
    fill();
  }

  // drag with a finger or the mouse: the card follows, tilts, and the stamps fade in
  let start = null;
  stack.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.deck-card');
    if (!card || card !== top() || busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
    start = { x: e.clientX, y: e.clientY, t: performance.now(), card, id: e.pointerId, moved: false, horiz: null };
  });
  stack.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (start.horiz === null && Math.hypot(dx, dy) > 8) {
      start.horiz = Math.abs(dx) > Math.abs(dy);
      if (!start.horiz) { start = null; return; } // a vertical move: let the page scroll
      start.card.setPointerCapture(e.pointerId);
      start.card.classList.add('is-dragging');
    }
    if (!start.horiz) return;
    start.moved = true;
    const w = stack.offsetWidth;
    start.card.style.transform = `translate(${dx}px, ${dy * 0.15}px) rotate(${dx / w * 14}deg)`;
    const k = Math.max(-1, Math.min(1, dx / (w * 0.35)));
    start.card.style.setProperty('--save', Math.max(0, k));
    start.card.style.setProperty('--skip', Math.max(0, -k));
  });
  const release = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const { card, moved } = start;
    const dx = e.clientX - start.x, v = dx / Math.max(1, performance.now() - start.t);
    card.classList.remove('is-dragging');
    start = null;
    if (!moved) return;
    // swallow the click that follows a drag, so the card doesn't open
    card.addEventListener('click', (ev) => ev.preventDefault(), { once: true, capture: true });
    if (Math.abs(dx) > stack.offsetWidth * 0.3 || Math.abs(v) > 0.6) decide(Math.sign(dx), card);
    else { card.style.transform = ''; card.style.setProperty('--save', 0); card.style.setProperty('--skip', 0); }
  };
  stack.addEventListener('pointerup', release);
  stack.addEventListener('pointercancel', (e) => { if (start && e.pointerId === start.id) { start.card.classList.remove('is-dragging'); start.card.style.transform = ''; start = null; } });

  root.querySelector('[data-deck-skip]').addEventListener('click', () => decide(-1));
  root.querySelector('[data-deck-save]').addEventListener('click', () => decide(1));
  stack.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); decide(1); top()?.focus({ preventScroll: true }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); decide(-1); top()?.focus({ preventScroll: true }); }
  });

  tally();
  fill();
}
