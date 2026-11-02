import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, toast, looksLikeSpam, validateFields, phoneOk, titleIn, sendMessage } from '../lib/layout.js';
import { wireCardActions } from '../lib/card.js';
import { store } from '../lib/store.js';
import { nextOpenDays, fmtTime } from '../lib/hours.js';
import { byId, rs, monthly, carName } from '../data.js';

initLayout();
wireCardActions();

// The page is pre-rendered; this script only adds behaviour.
const c = byId($('[data-car]')?.dataset.car);
if (c) {
  store.pushRecent(c.id);
  setupGallery();
  setupFinance();
  setupBooking();
  setupShare();
  titleIn($('.summary-title'), 0.05);
}

/* ---------------------------------------------------------------- gallery + lightbox */
function setupGallery() {
  let i = 0;
  const img = $('[data-gal-img]');
  const lb = $('[data-lightbox]');
  const lbImg = $('[data-lb-img]');
  const n = c.images.length;
  const show = (k, dir = 1) => {
    i = (k + n) % n;
    const src = c.images[i];
    if (reduced) { img.src = src; img.srcset = ''; }
    else gsap.to(img, { opacity: 0, x: -24 * dir, duration: 0.18, onComplete: () => { img.srcset = ''; img.src = src; gsap.fromTo(img, { opacity: 0, x: 24 * dir }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }); } });
    img.alt = `${carName(c)}, photo ${i + 1} of ${n}`;
    if (lb.open) { lbImg.src = src; lbImg.classList.remove('is-zoomed'); }
    $('[data-gal-count]').textContent = `${i + 1} / ${n}`;
    $('[data-lb-count]').textContent = `${i + 1} / ${n}`;
    $$('[data-gal-thumb]').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.galThumb === i)));
  };
  $('[data-gal-prev]')?.addEventListener('click', () => show(i - 1, -1));
  $('[data-gal-next]')?.addEventListener('click', () => show(i + 1, 1));
  $$('[data-gal-thumb]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.galThumb, +b.dataset.galThumb > i ? 1 : -1)));

  const openLb = () => {
    lbImg.src = c.images[i];
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
  $('[data-gal-open]').addEventListener('click', openLb);
  $('[data-lb-close]').addEventListener('click', () => lb.close());
  $('[data-lb-prev]')?.addEventListener('click', () => show(i - 1, -1));
  $('[data-lb-next]')?.addEventListener('click', () => show(i + 1, 1));
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1, -1); if (e.key === 'ArrowRight') show(i + 1, 1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  const origin = (e) => { const r = lbImg.getBoundingClientRect(); lbImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; };
  lbImg.addEventListener('click', (e) => { origin(e); lbImg.classList.toggle('is-zoomed'); });
  lbImg.addEventListener('pointermove', (e) => lbImg.classList.contains('is-zoomed') && origin(e));
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
