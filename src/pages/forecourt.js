/**
 * The forecourt: every car as its own short film, one screen at a time. The dealer's photos become a slow camera
 * move (a wide photo pans across a tall phone, so you see the whole car), with story ticks along the top.
 * Swipe up for the next car (the page's own scroll snap, so it's as smooth as the phone). Tap the sides for the
 * next or previous photo, hold to pause, double-tap to park the car in your garage.
 * Only the car on screen and its neighbours have photos loaded, and only the car on screen moves.
 * With a mouse it works the same way: the wheel, the arrow keys, the buttons or dragging move one car at a time, and the
 * arrows at the sides change the photo.
 */
import gsap from 'gsap';
import { initLayout, reduced, $, $$, toast, syncStoreUI, bump } from '../lib/layout.js';
import { dailyOrder } from '../lib/deck.js';
import { store } from '../lib/store.js';
import { CARS, DEALER, rs, monthly, km, carName, byId } from '../data.js';
import { ICON, esc, carUrl } from '../lib/templates.js';

initLayout({ immersive: true });

const STAY = 5200; // ms per photo
const root = $('[data-fc]');
const q = new URLSearchParams(location.search);

/** The list can be narrowed from elsewhere on the site: ?max=, ?body=, ?make=, ?saved=1, and ?car= to open on one. */
function pick() {
  const max = +q.get('max') || Infinity, body = q.get('body'), make = q.get('make'), saved = q.get('saved') === '1';
  const list = dailyOrder(CARS).filter((c) => c.price <= max && (!body || c.body === body) && (!make || c.make === make) && (!saved || store.isSaved(c.id)));
  const first = q.get('car') && byId(q.get('car'));
  if (first) return [first, ...list.filter((c) => c !== first)];
  return list.length ? list : dailyOrder(CARS);
}
const cars = pick();
$('[data-fc-total]').textContent = cars.length;

const slideHTML = (c, i) => {
  const n = c.thumbs.length;
  const wa = encodeURIComponent(`Hi V8 Motors, I'm interested in the ${carName(c)} (${rs(c.price)}). Is it still available to view?`);
  return `<article class="fc-slide" data-i="${i}" data-id="${c.id}" aria-label="${esc(carName(c))}, ${rs(c.price)}">
    <div class="fc-stage" data-stage></div>
    <div class="fc-shade" aria-hidden="true"></div>
    <div class="fc-ticks" aria-hidden="true">${'<i><b></b></i>'.repeat(n)}</div>
    <button type="button" class="fc-tap fc-tap--l" data-tap="-1" aria-label="Previous photo"></button>
    <button type="button" class="fc-tap fc-tap--r" data-tap="1" aria-label="Next photo"></button>
    <div class="fc-info">
      <p class="fc-kicker tabular-nums">${[c.year, c.body, c.colour].filter(Boolean).map(esc).join(' · ')}</p>
      <h2 class="fc-name">${esc(c.make)} <em>${esc(c.model)}</em></h2>
      <p class="fc-price tabular-nums">${rs(c.price)}<small>or about ${rs(monthly(c.price))} a month</small></p>
      <p class="fc-specs tabular-nums">${[c.engine ? `${esc(c.engine)} ${esc(c.fuel)}` : esc(c.fuel), esc(c.gearbox), c.km != null ? km(c.km) : ''].filter(Boolean).join(' · ')}</p>
      <a class="btn btn-primary fc-go" href="${carUrl(c)}">See this car</a>
    </div>
    <div class="fc-rail">
      <button type="button" class="fc-act" data-save="${c.id}" aria-pressed="false" aria-label="Park the ${esc(carName(c))} in my garage">${ICON.heart}<span>Park</span></button>
      <button type="button" class="fc-act" data-compare="${c.id}" aria-pressed="false" aria-label="Compare the ${esc(carName(c))}">${ICON.scales}<span>Compare</span></button>
      <button type="button" class="fc-act" data-share="${c.id}" aria-label="Share the ${esc(carName(c))}">${ICON.share}<span>Share</span></button>
      <a class="fc-act fc-act--wa" href="https://wa.me/${DEALER.whatsapp}?text=${wa}" rel="noopener" aria-label="Ask about the ${esc(carName(c))} on WhatsApp">${ICON.whatsapp}<span>WhatsApp</span></a>
    </div>
    <span class="fc-burst" aria-hidden="true">${ICON.heart}</span>
  </article>`;
};
root.insertAdjacentHTML('beforeend', cars.map(slideHTML).join(''));
const slides = $$('.fc-slide', root);

/* ------------------------------------------------------------------ one car's film */
let current = -1, film = null, held = false;

function photoEl(c, k) {
  const img = new Image();
  img.className = 'fc-img';
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  img.width = 1591; img.height = 1200;
  // the small local version shows at once; the full photo takes over when it arrives
  img.style.backgroundImage = `url(${c.thumbs[k]})`;
  img.src = c.images[k];
  return img;
}
/** Fills a slide's stage with its first photo (and warms the second) as it nears the screen. */
function ready(i) {
  const s = slides[i];
  if (!s || s._photos) return;
  const c = cars[i];
  s._photos = [];
  s._photos[0] = photoEl(c, 0);
  $('[data-stage]', s).append(s._photos[0]);
}
const framing = (img) => {
  // how far a wide photo can travel across a taller screen, as a share of the photo's width
  const W = innerWidth, H = innerHeight, ar = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 4 / 3;
  const shown = H * ar;
  return shown > W ? (shown - W) / 2 : 0;
};

class Film {
  constructor(i) {
    this.i = i; this.s = slides[i]; this.c = cars[i]; this.k = 0;
    this.n = this.c.thumbs.length;
    this.ticks = $$('.fc-ticks b', this.s);
    this.stage = $('[data-stage]', this.s);
    this.anims = [];
    this.show(0, 1, true);
  }
  photo(k) {
    const list = this.s._photos;
    if (!list[k]) list[k] = photoEl(this.c, k);
    return list[k];
  }
  show(k, dir = 1, first = false) {
    this.anims.forEach((a) => a.cancel());
    this.anims = [];
    this.k = (k + this.n) % this.n;
    this.ticks.forEach((t, j) => { t.getAnimations().forEach((a) => a.cancel()); t.style.transform = `scaleX(${j < this.k ? 1 : 0})`; });
    const img = this.photo(this.k);
    const prev = [...this.stage.children].filter((el) => el !== img);
    if (img.parentNode !== this.stage) this.stage.append(img);
    else this.stage.append(img); // keep it on top
    const go = () => {
      const range = framing(img);
      // tall screens pan across the car, alternating direction; wide screens drift in slowly
      const side = this.k % 2 ? -1 : 1;
      const from = range ? `translate3d(${side * range * 0.82}px,0,0) scale(1.02)` : 'scale(1.02)';
      const to = range ? `translate3d(${-side * range * 0.82}px,0,0) scale(1.02)` : 'scale(1.1)';
      if (reduced) { img.style.opacity = 1; img.style.transform = 'none'; }
      else {
        this.anims.push(img.animate([{ transform: from }, { transform: to }], { duration: STAY * 1.25, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'both' }));
        if (!first) this.anims.push(img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out', fill: 'both' }));
        else img.style.opacity = 1;
        const tick = this.ticks[this.k].animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: STAY, easing: 'linear', fill: 'forwards' });
        tick.onfinish = () => { if (film === this) this.step(1); };
        this.anims.push(tick);
        if (held) this.anims.forEach((a) => a.pause());
      }
      setTimeout(() => prev.forEach((p) => { if (p !== this.stage.lastElementChild) { p.remove(); } }), 460);
      // warm the next photo so the cut never waits
      const nx = (this.k + 1) % this.n;
      if (nx !== 0 && !this.s._photos[nx]) this.s._photos[nx] = photoEl(this.c, nx);
    };
    if (img.complete && img.naturalWidth) go();
    else { img.style.opacity = 0; let done = false; const once = () => { if (!done && film === this && this.k === k % this.n) { done = true; go(); } }; img.addEventListener('load', once, { once: true }); img.addEventListener('error', once, { once: true }); setTimeout(once, 900); if (first) img.style.opacity = 1; }
  }
  step(dir) { this.show(this.k + dir, dir); }
  pause() { this.anims.forEach((a) => a.pause()); }
  play() { this.anims.forEach((a) => a.play()); }
  stop() {
    this.anims.forEach((a) => a.cancel());
    this.anims = [];
    this.ticks.forEach((t) => { t.style.transform = 'scaleX(0)'; });
  }
}

function setCurrent(i) {
  if (i === current) return;
  current = i;
  $('[data-fc-pos]').textContent = i + 1;
  [i, i + 1, i - 1].forEach(ready);
  film?.stop();
  film = new Film(i);
  // name the car on screen in the address bar, so a shared link opens on it
  history.replaceState(null, '', `${location.pathname}?${(() => { const p = new URLSearchParams(location.search); p.set('car', cars[i].id); return p; })()}`);
  slides.forEach((s, j) => s.classList.toggle('is-on', j === i));
  if (i > 0) $('[data-fc-hint]')?.classList.add('is-gone');
}

const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) setCurrent(+e.target.dataset.i);
}, { root, threshold: 0.6 });
slides.forEach((s) => io.observe(s));
ready(0); setCurrent(0);

// scroll snap does this by itself; this is for any browser that leaves a car half parked
root.addEventListener('scrollend', () => {
  const h = root.clientHeight, i = Math.round(root.scrollTop / h);
  if (Math.abs(root.scrollTop - i * h) > 2) root.scrollTo({ top: i * h, behavior: reduced ? 'auto' : 'smooth' });
});

/* ------------------------------------------------------------------ gestures */
function park(slide, x, y) {
  const id = slide.dataset.id;
  if (!store.isSaved(id)) { store.toggleSaved(id); bump('[data-saved-link]'); toast('Parked in your garage.', { href: 'inventory.html?saved=1', label: 'Open garage' }); }
  syncStoreUI();
  navigator.vibrate?.([8, 40, 12]);
  const b = $('.fc-burst', slide);
  b.style.left = `${x}px`; b.style.top = `${y}px`;
  if (!reduced) gsap.fromTo(b, { opacity: 1, scale: 0.4, rotate: -14 }, { keyframes: [{ scale: 1.25, rotate: 6, duration: 0.3, ease: 'back.out(2.4)' }, { scale: 1, duration: 0.2 }, { opacity: 0, scale: 1.5, y: -30, duration: 0.45, ease: 'power2.in' }], clearProps: 'transform,opacity' });
}

let lastTap = 0, tapTimer = 0, holdTimer = 0, wasHold = false;
root.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('[data-tap]')) return;
  wasHold = false;
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { held = wasHold = true; film?.pause(); root.classList.add('is-held'); }, 220);
});
const release = () => {
  clearTimeout(holdTimer);
  if (held) { held = false; film?.play(); root.classList.remove('is-held'); }
};
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => root.addEventListener(t, release));

root.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tap]');
  if (t) {
    if (wasHold) { wasHold = false; return; }
    const now = performance.now(), slide = t.closest('.fc-slide');
    if (now - lastTap < 280) { clearTimeout(tapTimer); lastTap = 0; park(slide, e.clientX, e.clientY); return; }
    lastTap = now;
    tapTimer = setTimeout(() => film?.step(+t.dataset.tap), 240);
    return;
  }
  const share = e.target.closest('[data-share]');
  if (share) {
    const c = byId(share.dataset.share), url = new URL(carUrl(c), location.href).href;
    const data = { title: `${carName(c)} at V8 Motors`, text: `${carName(c)}, ${rs(c.price)} at V8 Motors`, url };
    if (navigator.share) navigator.share(data).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast('Link copied.'), () => toast('Copy the address bar to share this car.'));
  }
});

// saving and comparing from the rail
import('../lib/card.js').then(({ wireCardActions }) => wireCardActions());

const to = (i) => slides[Math.max(0, Math.min(slides.length - 1, i))].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });

/* ------------------------------------------------------------------ with a mouse */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  $('[data-fc-hint-text]').textContent = 'Scroll or drag for the next car';
  // one notch or flick, one car: the wheel's own momentum must not skip any
  let wheelAt = 0, quiet = 0;
  root.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const now = performance.now(), fresh = now - quiet > 140;
    quiet = now;
    if (!e.deltaY || now - wheelAt < 650 || (!fresh && now - wheelAt < 1100)) return;
    wheelAt = now;
    to(current + Math.sign(e.deltaY));
  }, { passive: false });
  $$('[data-fc-go]').forEach((b) => b.addEventListener('click', () => to(current + +b.dataset.fcGo)));

  // grab the car and throw it
  let grab = null, dragged = false;
  root.addEventListener('pointerdown', (e) => {
    if (e.button || e.target.closest('a, .fc-rail, .fc-act')) return;
    grab = { y: e.clientY, top: root.scrollTop };
    dragged = false;
  });
  addEventListener('pointermove', (e) => {
    if (!grab) return;
    const dy = e.clientY - grab.y;
    if (!dragged && Math.abs(dy) < 8) return;
    dragged = true;
    clearTimeout(holdTimer);
    root.classList.add('is-grabbing');
    root.style.scrollSnapType = 'none';
    root.scrollTop = grab.top - dy;
  }, { passive: true });
  addEventListener('pointerup', (e) => {
    if (!grab) return;
    const dy = e.clientY - grab.y, h = root.clientHeight;
    const was = grab.top;
    grab = null;
    root.classList.remove('is-grabbing');
    if (!dragged) return;
    wasHold = true; // this was a drag, so the click that follows must not change the photo
    const i = Math.round(was / h) + (Math.abs(dy) > 70 ? -Math.sign(dy) : 0);
    root.scrollTo({ top: Math.max(0, Math.min(slides.length - 1, i)) * h, behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => { root.style.scrollSnapType = ''; }, 650);
  });
}

addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); to(current + 1); }
  else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); to(current - 1); }
  else if (e.key === 'ArrowRight') film?.step(1);
  else if (e.key === 'ArrowLeft') film?.step(-1);
  else if (e.key === 'Escape') $('[data-fc-close]').click();
});
document.addEventListener('visibilitychange', () => (document.hidden ? film?.pause() : !held && film?.play()));

// leaving: back where you came from, if that was on this site
$('[data-fc-close]').addEventListener('click', (e) => {
  try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); e.stopPropagation(); history.back(); } } catch { /* a plain link then */ }
}, true);
