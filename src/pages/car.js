import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, toast, looksLikeSpam, validateFields, phoneOk, titleIn, sendMessage, P } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { store } from '../lib/store.js';
import { nextOpenDays, fmtTime } from '../lib/hours.js';
import { byId, rs, monthly, carName, large } from '../data.js';
import { VIDEOS } from '../videos.js';

initLayout();
wireCardActions();

// The page is pre-rendered; this script only adds behaviour.
const c = byId($('[data-car]')?.dataset.car);
if (c) {
  store.pushRecent(c.id);
  setupGallery();
  setupVideo();
  setupFinance();
  setupBooking();
  setupShare();
  setupStage();
  titleIn($('.summary-title'), 0.05);
}

/* ---------------------------------------------------------------- gallery + lightbox */
function setupGallery() {
  let i = 0;
  const img = $('[data-gal-img]');
  const lb = $('[data-lightbox]');
  const lbImg = $('[data-lb-img]');
  const n = c.images.length;
  // Every photo is fetched ahead of time, and a switch shows the small copy straight away if the big one isn't in yet,
  // so a tap always answers instantly.
  const big = (k) => large(c, k, P);
  const small = (k) => `${P}${c.thumbs[k]}`;
  const ready = new Map();
  const fetchPhoto = (k) => {
    if (!ready.has(k)) {
      const im = new Image();
      im.src = big(k);
      ready.set(k, { im, done: false, wait: (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { ready.get(k).done = true; }) });
    }
    return ready.get(k);
  };
  let ask = 0;
  const show = (k, dir = 1) => {
    i = (k + n) % n;
    const at = i, mine = ++ask;
    const p = fetchPhoto(at);
    img.srcset = '';
    img.src = p.done ? big(at) : small(at);
    if (!p.done) p.wait.then(() => { if (mine === ask) img.src = big(at); });
    const mirror = $('[data-gal-reflect]');
    if (mirror) mirror.src = small(at);
    if (!reduced) img.animate([{ opacity: 0.55, transform: `translateX(${dir * 14}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    fetchPhoto((at + 1) % n);
    fetchPhoto((at - 1 + n) % n);
    img.alt = `${carName(c)}, photo ${i + 1} of ${n}`;
    if (lb.open) showLightbox();
    $('[data-gal-count]').textContent = `${i + 1} / ${n}`;
    $('[data-lb-count]').textContent = `${i + 1} / ${n}`;
    $$('[data-gal-thumb]').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.galThumb === i)));
  };
  // in full screen: our copy at once, then the dealer's full-size original when it arrives
  const showLightbox = () => {
    const at = i;
    lbImg.src = big(at);
    lbImg.classList.remove('is-zoomed');
    const full = new Image();
    full.src = c.images[at];
    (full.decode ? full.decode() : Promise.resolve()).then(() => { if (lb.open && at === i) lbImg.src = c.images[at]; }).catch(() => {});
  };
  // the rest of the photos, once the page has settled
  (window.requestIdleCallback || setTimeout)(() => { for (let k = 0; k < n; k++) fetchPhoto(k); }, { timeout: 1500 });
  $('[data-gal-prev]')?.addEventListener('click', () => show(i - 1, -1));
  $('[data-gal-next]')?.addEventListener('click', () => show(i + 1, 1));
  $$('[data-gal-thumb]').forEach((b) => {
    b.addEventListener('click', () => show(+b.dataset.galThumb, +b.dataset.galThumb > i ? 1 : -1));
    b.addEventListener('pointerenter', () => fetchPhoto(+b.dataset.galThumb), { passive: true });
  });

  const openLb = () => {
    showLightbox();
    lbImg.alt = img.alt;
    $('[data-lb-count]').textContent = `${i + 1} / ${n}`;
    lb.showModal();
  };
  // swipe between photos; a tap opens full screen
  let sx = null;
  const main = $('.gallery-main');
  main.addEventListener('pointerdown', (e) => (sx = e.clientX));
  main.addEventListener('pointerup', (e) => {
    if (sx === null || e.target.closest('button')) { sx = null; return; }
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50 && n > 1) show(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 8) openLb();
  });
  $$('[data-gal-open]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); openLb(); }));
  $$('[data-walk]').forEach((b) => b.addEventListener('click', () => { show(+b.dataset.walk); openLb(); }));
  $('[data-lb-close]').addEventListener('click', () => lb.close());
  $('[data-lb-prev]')?.addEventListener('click', () => show(i - 1, -1));
  $('[data-lb-next]')?.addEventListener('click', () => show(i + 1, 1));
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1, -1); if (e.key === 'ArrowRight') show(i + 1, 1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  const origin = (e) => { const r = lbImg.getBoundingClientRect(); lbImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; };
  lbImg.addEventListener('click', (e) => { origin(e); lbImg.classList.toggle('is-zoomed'); });
  lbImg.addEventListener('pointermove', (e) => lbImg.classList.contains('is-zoomed') && origin(e));
}

/* ---------------------------------------------------------------- the video: TikTok first, YouTube as the fallback.
   The player only loads when opened, and closing it removes it, which stops the sound. See src/videos.js. */
function setupVideo() {
  const box = $('[data-video-box]');
  if (!box) return;
  const frame = $('[data-video-frame]', box), soon = $('[data-video-soon]', box), swap = $('[data-video-swap]', box);
  const clip = VIDEOS[c.id] || {};
  const tiktok = clip.tiktok && `https://www.tiktok.com/player/v1/${clip.tiktok}?autoplay=1&rel=0&description=0&music_info=0`;
  const youtube = clip.youtube && `https://www.youtube-nocookie.com/embed/${clip.youtube}?autoplay=1&rel=0&playsinline=1`;
  const play = (src) => {
    $('iframe', frame)?.remove();
    soon.hidden = !!src;
    if (!src) return;
    const f = document.createElement('iframe');
    f.src = src;
    f.title = `Video of the ${carName(c)}`;
    f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    frame.append(f);
  };
  swap.addEventListener('click', () => { swap.hidden = true; play(youtube); });
  $$('[data-video-open]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    swap.hidden = !(tiktok && youtube);
    play(tiktok || youtube);
    box.showModal();
  }));
  $('[data-video-close]', box).addEventListener('click', () => box.close());
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('close', () => $('iframe', frame)?.remove());
}

/* ---------------------------------------------------------------- the bay: the photo leans towards your pointer, the dials sweep up */
function setupStage() {
  const dials = $('[data-dials]');
  if (dials) {
    if (reduced) dials.classList.add('is-on');
    else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { dials.classList.add('is-on'); o.disconnect(); } }, { threshold: 0.4 }).observe(dials);
  }
  const slab = $('[data-gal-tilt]');
  if (!slab || reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const ry = gsap.quickTo(slab, 'rotationY', { duration: 0.7, ease: 'power3.out' });
  const rx = gsap.quickTo(slab, 'rotationX', { duration: 0.7, ease: 'power3.out' });
  gsap.set(slab, { transformPerspective: 1500, rotationY: 3.5, rotationX: 1 });
  addEventListener('pointermove', (e) => {
    if (scrollY > innerHeight) return;
    ry(3.5 + (e.clientX / innerWidth - 0.5) * 5);
    rx(1 - (e.clientY / innerHeight - 0.5) * 3.5);
  }, { passive: true });
}

/* ---------------------------------------------------------------- monthly payment */
function setupFinance() {
  const dep = $('[data-mini-dep]'), term = $('[data-mini-term]');
  const out = $('[data-mini-out]');
  const o = { v: monthly(c.price) };
  const upd = () => {
    [dep, term].forEach((x) => x.style.setProperty('--p', ((x.value - x.min) / (x.max - x.min)) * 100 + '%'));
    $('[data-mini-dep-out]').textContent = `${dep.value}%, ${rs((c.price * dep.value) / 100)}`;
    $('[data-mini-term-out]').textContent = `${term.value / 12} year${term.value > 12 ? 's' : ''}`;
    gsap.to(o, { v: monthly(c.price, +dep.value, +term.value), duration: reduced ? 0 : 0.5, ease: 'expo.out', onUpdate: () => (out.innerHTML = `${rs(o.v)}<span> a month</span>`) });
  };
  [dep, term].forEach((x) => x.addEventListener('input', upd));
  upd();
}

/* ---------------------------------------------------------------- test drive booking */
function setupBooking() {
  const days = nextOpenDays(10);
  const daysEl = $('[data-days]'), slotsEl = $('[data-slots]');
  let day = null, slot = null;
  daysEl.innerHTML = days.map((d, k) => `<button type="button" class="day" data-day="${k}" aria-pressed="false" aria-label="${d.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}">
    <span class="day-w">${d.date.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
    <span class="day-d tabular-nums">${d.date.getDate()}</span>
    <span class="day-m">${d.date.toLocaleDateString('en-GB', { month: 'short' })}</span></button>`).join('');
  daysEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    day = days[+b.dataset.day]; slot = null;
    $$('[data-day]', daysEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const [oh] = day.hours[0].split(':').map(Number);
    const [ch] = day.hours[1].split(':').map(Number);
    const times = [];
    for (let h = oh + 1; h < ch; h++) times.push(`${String(h).padStart(2, '0')}:00`);
    slotsEl.innerHTML = times.map((t, k) => {
      const taken = false;
      return `<button type="button" class="slot" data-slot="${t}" aria-pressed="false" ${taken ? 'disabled' : ''}>${fmtTime(t)}${taken ? '<span class="sr-only"> (booked)</span>' : ''}</button>`;
    }).join('');
  });
  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]');
    if (!b) return;
    slot = b.dataset.slot;
    $$('[data-slot]', slotsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });

  const f = $('[data-book]');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('[data-error]', f);
    if (!day || !slot) { err.hidden = false; err.textContent = !day ? 'Choose a day for the test drive.' : 'Choose a time on that day.'; return; }
    err.hidden = true;
    const bad = validateFields([
      [f.name, f.name.value.trim() ? '' : 'Add your name.'],
      [f.phone, phoneOk(f.phone.value) ? '' : 'Add a mobile number we can call, for example 5 123 4567.'],
    ]);
    if (bad) return;
    if (looksLikeSpam(f)) { err.hidden = false; err.textContent = 'That was very quick. Please try again in a moment.'; return; }
    const when = `${day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at ${fmtTime(slot)}`;
    const text = `Hi V8 Motors, I'd like to view the ${carName(c)} (${rs(c.price)}) on ${when}.\nName: ${f.name.value.trim()}\nMobile: ${f.phone.value.trim()}\n${location.href}`;
    const href = sendMessage(text);
    const done = document.createElement('div');
    done.className = 'form-done';
    done.setAttribute('role', 'status');
    done.innerHTML = `<strong>Almost done: press send in WhatsApp.</strong>
      <p>Your request for ${when} is written for you in WhatsApp. We confirm the time in that chat.</p>
      <a class="btn btn-primary" href="${href}" target="_blank" rel="noopener">Open WhatsApp again</a>`;
    f.replaceWith(done);
    done.querySelector('a').focus();
  });
}

/* ---------------------------------------------------------------- share */
function setupShare() {
  $('[data-share]').addEventListener('click', async () => {
    const data = { title: `${carName(c)} at V8 Motors`, text: `${carName(c)}, ${rs(c.price)} at V8 Motors`, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch { /* cancelled */ } return; }
    try { await navigator.clipboard.writeText(location.href); toast('Link copied. Paste it anywhere to share this car.'); }
    catch { toast('Copy the address bar to share this car.'); }
  });
}
