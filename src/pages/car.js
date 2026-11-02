import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, toast, magnetize, tilt, stretchHeadings } from '../lib/layout.js';
import { carCard, wireCardActions, ICON } from '../lib/card.js';
import { store } from '../lib/store.js';
import { nextOpenDays, fmtTime } from '../lib/hours.js';
import { CARS, DEALER, byId, rs, km, monthly, sized, carName, seeded } from '../data.js';

initLayout('inventory');
wireCardActions();

const root = $('[data-car-root]');
const id = new URLSearchParams(location.search).get('id');
const c = byId(id);

if (!c) {
  document.title = 'Car not found — V8 Motors';
  root.innerHTML = `<section class="page-head wrap notfound">
    <h1 class="page-title">That car has gone.</h1>
    <p class="page-lede">It may have been sold, or the link is incomplete. Everything still for sale is in the inventory.</p>
    <a href="inventory.html" class="btn btn-dark" data-magnetic>Browse the inventory</a></section>`;
  magnetize();
} else {
  render(c);
}

function render(c) {
  document.title = `${carName(c)} ${c.trim} — V8 Motors`;
  store.pushRecent(c.id);
  const reserved = c.status === 'Reserved';
  const waText = encodeURIComponent(`Hi V8 Motors, I'm interested in the ${carName(c)} ${c.trim} (${rs(c.price)}). Is it available to view?`);

  // deterministic inspection report
  const CATS = ['Engine and gearbox', 'Brakes', 'Suspension and steering', 'Tyres', 'Bodywork and paint', 'Interior', 'Electrics and diagnostics', 'Road test'];
  const report = CATS.map((name, i) => {
    const r = seeded(c.id, i);
    const score = name === 'Tyres' ? Math.round(62 + r * 36) : Math.round(90 + r * 10);
    return { name, score: Math.min(100, score) };
  });
  const passed = 150 - report.filter((x) => x.score < 95).length;

  const specs = [
    [ICON.gauge, 'Mileage', km(c.km)], [ICON.engine, 'Engine', c.engine], [ICON.bolt, 'Power', `${c.power} hp`],
    [ICON.gear, 'Gearbox', c.gearbox], [ICON.fuel, 'Fuel', c.fuel], [ICON.wheel, 'Drive', c.drive],
    [ICON.seat, 'Seats', c.seats], [ICON.user, 'Previous owners', c.owners], [ICON.palette, 'Colour', c.colour],
    [ICON.shield, 'Warranty', c.warranty],
  ];

  const similar = CARS.filter((x) => x.id !== c.id)
    .map((x) => ({ x, score: (x.body === c.body ? 2 : 0) + (x.make === c.make ? 1 : 0) - Math.abs(Math.log(x.price / c.price)) * 2 }))
    .sort((a, b) => b.score - a.score).slice(0, 8).map((o) => o.x);

  root.innerHTML = `
  <div class="wrap car-page">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="./">Home</a><span aria-hidden="true">/</span><a href="inventory.html">Inventory</a><span aria-hidden="true">/</span>
      <a href="inventory.html?make=${encodeURIComponent(c.make)}">${c.make}</a><span aria-hidden="true">/</span><span aria-current="page">${c.model}</span>
    </nav>

    <div class="car-top">
      <div class="gallery" data-gallery>
        <div class="gallery-main" data-cursor="Expand">
          <img src="${c.images[0]}" alt="${carName(c)} in ${c.colour.toLowerCase()}, photo 1" data-gal-img data-vt-hero="${c.id}" />
          <span class="car-status car-status--lg ${c.status === 'Just arrived' ? 'car-status--new' : reserved ? 'car-status--reserved' : ''}">${c.status}</span>
          ${c.images.length > 1 ? `
          <button type="button" class="gal-arrow gal-prev" data-gal-prev aria-label="Previous photo">${ICON.arrowL}</button>
          <button type="button" class="gal-arrow gal-next" data-gal-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
          <button type="button" class="gal-expand" data-gal-open aria-label="Open photos full screen">${ICON.expand}<span class="tabular-nums" data-gal-count>1 / ${c.images.length}</span></button>
        </div>
        ${c.images.length > 1 ? `<div class="gallery-thumbs">${c.images.map((src, i) =>
          `<button type="button" data-gal-thumb="${i}" aria-current="${i === 0}" aria-label="Show photo ${i + 1}"><img src="${sized(src, 300)}" alt="" /></button>`).join('')}</div>` : ''}
      </div>

      <aside class="summary" data-summary>
        <p class="summary-kicker tabular-nums">${c.year}, ${km(c.km)}, ${c.fuel}</p>
        <h1 class="summary-title" data-title>${c.make} ${c.model}</h1>
        <p class="summary-trim">${c.trim}</p>
        <div class="summary-price">
          <p class="summary-amount tabular-nums" data-price>${rs(c.price)}</p>
          <p class="summary-monthly tabular-nums">or <strong>${rs(monthly(c.price))}</strong> a month with 20% down over 5 years</p>
        </div>
        <ul class="summary-points">
          <li>150-point inspection, ${passed} passed first time</li>
          <li>${c.warranty} warranty included</li>
          <li>NLTA transfer handled for you</li>
        </ul>
        <div class="summary-actions">
          ${reserved
            ? `<a class="btn btn-dark btn-wide" href="https://wa.me/${DEALER.whatsapp}?text=${encodeURIComponent(`Hi, please add me to the waiting list for the ${carName(c)}.`)}" target="_blank" rel="noopener" data-magnetic>Join the waiting list</a>`
            : `<a class="btn btn-red btn-wide" href="#book" data-magnetic>Book a test drive</a>`}
          <a class="btn btn-line btn-wide" href="https://wa.me/${DEALER.whatsapp}?text=${waText}" target="_blank" rel="noopener">Message on WhatsApp</a>
        </div>
        <div class="summary-tools">
          <button type="button" class="tool" data-save="${c.id}" aria-pressed="${store.isSaved(c.id)}">${ICON.heart}<span>Save</span></button>
          <button type="button" class="tool" data-compare="${c.id}" aria-pressed="${store.inCompare(c.id)}">${ICON.scales}<span>Compare</span></button>
          <button type="button" class="tool" data-share>${ICON.share}<span>Share</span></button>
        </div>
      </aside>
    </div>

    <section class="car-section" aria-labelledby="specs-h">
      <h2 class="car-h" id="specs-h" data-stretch-view>The details</h2>
      <dl class="specs">${specs.map(([icon, k, v]) => `<div class="spec">${icon}<dt>${k}</dt><dd class="tabular-nums">${v}</dd></div>`).join('')}</dl>
    </section>

    <section class="car-section car-2col" aria-labelledby="feat-h">
      <div>
        <h2 class="car-h" id="feat-h" data-stretch-view>What it comes with</h2>
        <p class="car-sub">${c.features.length} features, checked working at inspection.</p>
      </div>
      <div>
        <ul class="features" data-features>${c.features.map((f, i) => `<li ${i >= 10 ? 'data-extra hidden' : ''}>${f}</li>`).join('')}</ul>
        ${c.features.length > 10 ? `<button type="button" class="link" data-more-features aria-expanded="false">Show all ${c.features.length}</button>` : ''}
      </div>
    </section>

    <section class="car-section car-2col report" aria-labelledby="rep-h">
      <div>
        <h2 class="car-h" id="rep-h" data-stretch-view>Inspection report</h2>
        <p class="car-sub">Our workshop checked 150 points before listing this car. Here’s the summary by area. The full report comes with the car.</p>
        <p class="report-big tabular-nums"><span data-count-to="${passed}">0</span><span class="report-of">/150</span></p>
      </div>
      <ul class="report-bars">
        ${report.map((r) => `<li><span class="report-name">${r.name}</span><span class="report-score tabular-nums">${r.name === 'Tyres' ? `${r.score}% tread` : r.score >= 95 ? 'Passed' : 'Advisory'}</span>
          <span class="report-track"><span class="report-fill ${r.score < 95 && r.name !== 'Tyres' ? 'is-advisory' : ''}" style="--v:${r.score / 100}"></span></span></li>`).join('')}
      </ul>
    </section>

    <section class="car-section car-2col fin-mini" aria-labelledby="fin-h">
      <div>
        <h2 class="car-h" id="fin-h" data-stretch-view>Your monthly payment</h2>
        <p class="car-sub">At ${DEALER.financeRate}% a year. An estimate only. The bank confirms the final rate.</p>
        <a href="finance.html?price=${c.price}" class="link">Open the full finance calculator</a>
      </div>
      <div class="fin-mini-box">
        <label class="slider slider-light"><span class="slider-top"><span>Deposit</span><output class="tabular-nums" data-mini-dep-out></output></span>
          <input type="range" min="10" max="60" step="5" value="20" data-mini-dep /></label>
        <label class="slider slider-light"><span class="slider-top"><span>Term</span><output class="tabular-nums" data-mini-term-out></output></span>
          <input type="range" min="12" max="84" step="12" value="60" data-mini-term /></label>
        <p class="fin-mini-figure tabular-nums" aria-live="polite" data-mini-out></p>
      </div>
    </section>

    ${reserved ? '' : `
    <section class="car-section book" id="book" aria-labelledby="book-h">
      <h2 class="car-h" id="book-h" data-stretch-view>Book a test drive</h2>
      <form class="book-form" data-book novalidate>
        <fieldset><legend>Choose a day</legend><div class="days" data-days></div></fieldset>
        <fieldset><legend>Choose a time</legend><div class="slots" data-slots><p class="slots-hint">Pick a day first.</p></div></fieldset>
        <div class="form-row form-row--2">
          <label class="input"><span>Your name</span><input name="name" required autocomplete="name" /></label>
          <label class="input"><span>Phone</span><input name="phone" type="tel" required autocomplete="tel" placeholder="5 123 4567" /></label>
        </div>
        <p class="form-error" data-error hidden></p>
        <button class="btn btn-dark" type="submit" data-magnetic>Request test drive</button>
      </form>
    </section>`}

    <section class="car-section" aria-labelledby="sim-h">
      <div class="section-head">
        <h2 class="car-h" id="sim-h" data-stretch-view>You might also like</h2>
        <div class="rail-arrows"><button type="button" data-rail="-1" aria-label="Scroll back">${ICON.arrowL}</button><button type="button" data-rail="1" aria-label="Scroll forward">${ICON.arrowR}</button></div>
      </div>
      <ul class="similar" data-similar data-lenis-prevent-wheel>${similar.map((x) => carCard(x)).join('')}</ul>
    </section>
  </div>

  <div class="buybar" data-buybar>
    <div><p class="buybar-name">${c.make} ${c.model}</p><p class="buybar-price tabular-nums">${rs(c.price)}</p></div>
    ${reserved ? '<span class="car-status car-status--reserved">Reserved</span>' : '<a href="#book" class="btn btn-red">Book a test drive</a>'}
  </div>

  <dialog class="lightbox" data-lightbox aria-label="Photos">
    <img alt="" data-lb-img />
    <p class="lb-count tabular-nums" data-lb-count></p>
    <button type="button" class="lb-close" data-lb-close aria-label="Close photos">${ICON.close}</button>
    ${c.images.length > 1 ? `<button type="button" class="lb-arrow lb-prev" data-lb-prev aria-label="Previous photo">${ICON.arrowL}</button>
    <button type="button" class="lb-arrow lb-next" data-lb-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
    <p class="lb-hint">Click the photo to zoom</p>
  </dialog>`;

  setupGallery(c);
  setupFeatures();
  setupReport();
  setupFinance(c);
  if (!reserved) setupBooking(c);
  setupSimilar();
  setupShare(c);
  setupBuybar();
  tilt(); magnetize(); stretchHeadings();
  window.addEventListener('store:change', () => {
    $$(`[data-save="${c.id}"]`).forEach((b) => b.setAttribute('aria-pressed', String(store.isSaved(c.id))));
  });

  if (!reduced) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.summary > *', { y: 30, opacity: 0, stagger: 0.06, duration: 1 }, 0.15)
      .fromTo('[data-title]', { '--wdth': 70 }, { '--wdth': 125, duration: 1.4, ease: 'expo.inOut' }, 0.15)
    if ($('.gallery-thumbs')) tl.from('.gallery-thumbs button', { y: 20, opacity: 0, stagger: 0.05, duration: 0.8 }, 0.4);
    // price ticks up like an odometer
    const p = { v: c.price * 0.6 };
    tl.to(p, { v: c.price, duration: 1.4, ease: 'expo.out', onUpdate: () => ($('[data-price]').textContent = rs(Math.round(p.v / 1000) * 1000)) }, 0.3);
  }
}

// ---------------------------------------------------------------- gallery + lightbox
function setupGallery(c) {
  let i = 0;
  const img = $('[data-gal-img]');
  const lb = $('[data-lightbox]');
  const lbImg = $('[data-lb-img]');
  const show = (n, dir = 1) => {
    i = (n + c.images.length) % c.images.length;
    const swap = (el, src) => {
      if (reduced) { el.src = src; return; }
      gsap.to(el, { opacity: 0, x: -30 * dir, duration: 0.2, onComplete: () => { el.src = src; gsap.fromTo(el, { opacity: 0, x: 30 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }); } });
    };
    swap(img, c.images[i]);
    img.alt = `${carName(c)}, photo ${i + 1}`;
    if (lb.open) { lbImg.src = c.images[i]; lbImg.classList.remove('is-zoomed'); }
    $('[data-gal-count]').textContent = `${i + 1} / ${c.images.length}`;
    $('[data-lb-count]').textContent = `${i + 1} / ${c.images.length}`;
    $$('[data-gal-thumb]').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.galThumb === i)));
  };
  $('[data-gal-prev]')?.addEventListener('click', () => show(i - 1, -1));
  $('[data-gal-next]')?.addEventListener('click', () => show(i + 1, 1));
  $$('[data-gal-thumb]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.galThumb, +b.dataset.galThumb > i ? 1 : -1)));

  // swipe on main image
  let sx = null;
  const main = $('.gallery-main');
  main.addEventListener('pointerdown', (e) => (sx = e.clientX));
  main.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50 && c.images.length > 1) show(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 6 && !e.target.closest('button')) openLb();
  });

  const openLb = () => {
    lbImg.src = c.images[i]; lbImg.alt = img.alt;
    $('[data-lb-count]').textContent = `${i + 1} / ${c.images.length}`;
    lb.showModal();
  };
  $('[data-gal-open]').addEventListener('click', openLb);
  $('[data-lb-close]').addEventListener('click', () => lb.close());
  $('[data-lb-prev]')?.addEventListener('click', () => show(i - 1, -1));
  $('[data-lb-next]')?.addEventListener('click', () => show(i + 1, 1));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(i - 1, -1);
    if (e.key === 'ArrowRight') show(i + 1, 1);
  });
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  // click-to-zoom that follows the pointer
  lbImg.addEventListener('click', (e) => {
    const r = lbImg.getBoundingClientRect();
    lbImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    lbImg.classList.toggle('is-zoomed');
  });
  lbImg.addEventListener('pointermove', (e) => {
    if (!lbImg.classList.contains('is-zoomed')) return;
    const r = lbImg.getBoundingClientRect();
    lbImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
}

function setupFeatures() {
  const b = $('[data-more-features]');
  if (!b) return;
  b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    $$('[data-extra]').forEach((li) => (li.hidden = open));
    b.setAttribute('aria-expanded', String(!open));
    b.textContent = open ? `Show all ${$$('[data-features] li').length}` : 'Show fewer';
    if (!open && !reduced) gsap.from('[data-extra]', { opacity: 0, x: -12, stagger: 0.03, duration: 0.5, ease: 'expo.out' });
    ScrollTrigger.refresh();
  });
}

function setupReport() {
  const bars = $$('.report-fill');
  const n = $('[data-count-to]');
  ScrollTrigger.create({
    trigger: '.report', start: 'top 75%', once: true,
    onEnter: () => {
      if (reduced) { bars.forEach((b) => b.classList.add('is-in')); n.textContent = n.dataset.countTo; return; }
      bars.forEach((b, k) => setTimeout(() => b.classList.add('is-in'), k * 90));
      const o = { v: 0 };
      gsap.to(o, { v: +n.dataset.countTo, duration: 1.6, ease: 'expo.out', onUpdate: () => (n.textContent = Math.round(o.v)) });
    },
  });
}

function setupFinance(c) {
  const dep = $('[data-mini-dep]'), term = $('[data-mini-term]');
  const out = $('[data-mini-out]');
  const o = { v: monthly(c.price) };
  const upd = () => {
    [dep, term].forEach((i) => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min)) * 100 + '%'));
    $('[data-mini-dep-out]').textContent = `${dep.value}%, ${rs(c.price * dep.value / 100)}`;
    $('[data-mini-term-out]').textContent = `${term.value / 12} years`;
    gsap.to(o, { v: monthly(c.price, +dep.value, +term.value), duration: reduced ? 0 : 0.5, ease: 'expo.out', onUpdate: () => (out.innerHTML = `${rs(o.v)}<span> a month</span>`) });
  };
  [dep, term].forEach((i) => i.addEventListener('input', upd));
  upd();
}

function setupBooking(c) {
  const days = nextOpenDays(10);
  const daysEl = $('[data-days]'), slotsEl = $('[data-slots]');
  let day = null, slot = null;
  daysEl.innerHTML = days.map((d, k) => `<button type="button" class="day" data-day="${k}" aria-pressed="false">
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
      const taken = seeded(c.id + day.date.toDateString(), k) < 0.3;
      return `<button type="button" class="slot" data-slot="${t}" aria-pressed="false" ${taken ? 'disabled' : ''}>${fmtTime(t)}${taken ? '<span class="sr-only"> (booked)</span>' : ''}</button>`;
    }).join('');
    if (!reduced) gsap.from($$('.slot', slotsEl), { y: 12, opacity: 0, stagger: 0.03, duration: 0.5, ease: 'expo.out' });
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
    const missing = [...f.elements].filter((x) => x.required && !x.value.trim());
    f.querySelectorAll('input').forEach((x) => x.setAttribute('aria-invalid', String(missing.includes(x))));
    const msg = !day ? 'Choose a day for the test drive.' : !slot ? 'Choose a time on that day.' : missing.length ? 'Add your name and phone number so we can confirm.' : '';
    if (msg) { err.hidden = false; err.textContent = msg; if (missing.length && day && slot) missing[0].focus(); return; }
    const when = `${day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at ${fmtTime(slot)}`;
    const start = new Date(day.date); const [h] = slot.split(':'); start.setHours(+h, 0, 0);
    const end = new Date(start.getTime() + 45 * 60000);
    const z = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//V8 Motors//EN\nBEGIN:VEVENT\nUID:${Date.now()}@v8motors.mu\nDTSTAMP:${z(new Date())}\nDTSTART:${z(start)}\nDTEND:${z(end)}\nSUMMARY:Test drive: ${carName(c)}\nLOCATION:${DEALER.address}\nEND:VEVENT\nEND:VCALENDAR`;
    const href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    f.outerHTML = `<div class="form-done form-done--big"><strong>Test drive requested for ${when}.</strong>
      <p>We'll call ${f.phone.value.replace(/</g, '')} to confirm. The ${c.make} ${c.model} will be washed and waiting.</p>
      <a class="btn btn-red" href="${href}" download="v8-motors-test-drive.ics">Add to my calendar</a></div>`;
    if (!reduced) gsap.from('.form-done--big', { opacity: 0, y: 20, duration: 0.7, ease: 'expo.out' });
  });
}

function setupSimilar() {
  const rail = $('[data-similar]');
  $$('[data-rail]').forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: +b.dataset.rail * rail.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' })));
  // drag to scroll on desktop
  let down = false, sx = 0, sl = 0, moved = false;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-dragging'); });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
  window.addEventListener('pointerup', () => { down = false; rail.classList.remove('is-dragging'); });
  rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
}

function setupShare(c) {
  $('[data-share]').addEventListener('click', async () => {
    const data = { title: `${carName(c)} at V8 Motors`, text: `${carName(c)} ${c.trim}, ${rs(c.price)}`, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch { /* cancelled */ } return; }
    await navigator.clipboard?.writeText(location.href);
    toast('Link copied. Paste it anywhere to share this car.');
  });
}

function setupBuybar() {
  const bar = $('[data-buybar]');
  ScrollTrigger.create({
    trigger: '[data-summary]', start: 'bottom top', end: 'max',
    onToggle: (s) => bar.classList.toggle('is-on', s.isActive),
  });
}
