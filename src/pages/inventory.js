import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLayout, reduced, $, $$, tilt, riseIn, magnetize, scrollToEl, stretchHeadings } from '../lib/layout.js';
import { carCard, wireCardActions, shapeSvg } from '../lib/card.js';
import { store } from '../lib/store.js';
import { CARS, BODY_TYPES, FUELS, DEALER, byId, rs, sized, carName } from '../data.js';

gsap.registerPlugin(Flip);
initLayout('inventory');

const PAGE = 12;
const KM_MAX = Math.ceil(Math.max(...CARS.map((c) => c.km)) / 10000) * 10000;
const form = $('[data-filters]');
const grid = $('[data-grid]');
const RANGES = {};
let shown = PAGE;

// ---------------------------------------------------------------- build filter UI
$('[data-total]').textContent = CARS.length;
$('[data-updated]').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

$('[data-body-opts]').innerHTML = BODY_TYPES.map((t) => {
  const n = CARS.filter((c) => c.body === t).length;
  return `<label class="body-opt"><input type="checkbox" name="body" value="${t}" />
    <span>${shapeSvg(t)}<span class="body-opt-name">${t}</span><span class="body-opt-n tabular-nums" data-n-body="${t}">${n}</span></span></label>`;
}).join('');
$('[data-fuel-opts]').innerHTML = FUELS.map((f) => `<label class="pill"><input type="checkbox" name="fuel" value="${f}" /><span>${f} <span class="pill-n tabular-nums" data-n-fuel="${f}"></span></span></label>`).join('');
const makes = [...new Set(CARS.map((c) => c.make))].sort();
$('[data-make-opts]').innerHTML = makes.map((m) => `<label class="check"><input type="checkbox" name="make" value="${m}" /><span>${m}</span><span class="check-n tabular-nums" data-n-make="${m}"></span></label>`).join('');

// dual range sliders
$$('[data-range]').forEach((wrap) => {
  const key = wrap.dataset.range;
  const vals = CARS.map((c) => (key === 'price' ? c.price : c.year));
  wrap.dataset.min = key === 'price' ? Math.floor(Math.min(...vals) / 50000) * 50000 : Math.min(...vals);
  wrap.dataset.max = key === 'price' ? Math.ceil(Math.max(...vals) / 50000) * 50000 : Math.max(...vals);
  const lo = $('[data-lo]', wrap), hi = $('[data-hi]', wrap);
  [lo, hi].forEach((i) => { i.min = wrap.dataset.min; i.max = wrap.dataset.max; i.step = wrap.dataset.step; });
  lo.value = wrap.dataset.min; hi.value = wrap.dataset.max;
  const fill = $('.range2-fill', wrap);
  const out = $(`[data-range-out="${key}"]`);
  const fmt = key === 'price' ? (v) => rs(v) : (v) => v;
  const paint = () => {
    const min = +wrap.dataset.min, max = +wrap.dataset.max;
    if (+lo.value > +hi.value) [lo.value, hi.value] = [hi.value, lo.value];
    const a = ((lo.value - min) / (max - min)) * 100, b = ((hi.value - min) / (max - min)) * 100;
    fill.style.left = a + '%'; fill.style.right = 100 - b + '%';
    out.textContent = `${fmt(+lo.value)} to ${fmt(+hi.value)}`;
  };
  RANGES[key] = {
    get: () => [+lo.value, +hi.value],
    set: (a, b) => { lo.value = a ?? wrap.dataset.min; hi.value = b ?? wrap.dataset.max; paint(); },
    isDefault: () => lo.value === wrap.dataset.min && hi.value === wrap.dataset.max,
    paint,
  };
  // the thumb nearest the pointer comes to the top so both stay grabbable
  wrap.addEventListener('pointerdown', (e) => {
    const r = wrap.getBoundingClientRect();
    const p = (e.clientX - r.left) / r.width;
    const min = +wrap.dataset.min, max = +wrap.dataset.max;
    const pl = (lo.value - min) / (max - min), ph = (hi.value - min) / (max - min);
    lo.style.zIndex = Math.abs(p - pl) < Math.abs(p - ph) ? 3 : 1;
  });
  paint();
});

form.km.max = KM_MAX; form.km.value = KM_MAX;

// ---------------------------------------------------------------- state <-> URL
function readState() {
  const fd = new FormData(form);
  return {
    q: (fd.get('q') || '').trim(),
    body: fd.getAll('body'), make: fd.getAll('make'), fuel: fd.getAll('fuel'), gearbox: fd.getAll('gearbox'),
    price: RANGES.price.get(), year: RANGES.year.get(), km: +form.km.value,
    saved: form.saved.checked, available: form.available.checked,
    sort: $('[data-sort]').value, view: grid.dataset.view,
  };
}
function writeUrl(s) {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  ['body', 'make', 'fuel', 'gearbox'].forEach((k) => s[k].length && p.set(k, s[k].join(',')));
  if (!RANGES.price.isDefault()) p.set('price', s.price.join('-'));
  if (!RANGES.year.isDefault()) p.set('year', s.year.join('-'));
  if (s.km < KM_MAX) p.set('km', s.km);
  if (s.saved) p.set('saved', '1');
  if (s.available) p.set('available', '1');
  if (s.sort !== 'new') p.set('sort', s.sort);
  if (s.view !== 'grid') p.set('view', s.view);
  history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
}
function applyUrl() {
  const p = new URLSearchParams(location.search);
  form.q.value = p.get('q') || '';
  ['body', 'make', 'fuel', 'gearbox'].forEach((k) => {
    const v = (p.get(k) || '').split(',').filter(Boolean);
    $$(`[name="${k}"]`, form).forEach((i) => (i.checked = v.includes(i.value)));
  });
  const pr = (p.get('price') || '').split('-').map(Number);
  RANGES.price.set(pr[0] || undefined, pr[1] || undefined);
  const yr = (p.get('year') || '').split('-').map(Number);
  RANGES.year.set(yr[0] || undefined, yr[1] || undefined);
  form.km.value = p.get('km') || KM_MAX;
  form.saved.checked = p.get('saved') === '1';
  form.available.checked = p.get('available') === '1';
  $('[data-sort]').value = p.get('sort') || 'new';
  setView(p.get('view') || 'grid', false);
}

// ---------------------------------------------------------------- filtering
function matches(c, s, skip) {
  const q = s.q.toLowerCase();
  return (skip === 'body' || !s.body.length || s.body.includes(c.body)) &&
    (skip === 'make' || !s.make.length || s.make.includes(c.make)) &&
    (skip === 'fuel' || !s.fuel.length || s.fuel.includes(c.fuel)) &&
    (!s.gearbox.length || s.gearbox.includes(c.gearbox)) &&
    c.price >= s.price[0] && c.price <= s.price[1] &&
    c.year >= s.year[0] && c.year <= s.year[1] &&
    c.km <= s.km &&
    (!s.saved || store.isSaved(c.id)) &&
    (!s.available || c.status !== 'Reserved') &&
    (!q || `${c.make} ${c.model} ${c.trim} ${c.year} ${c.colour}`.toLowerCase().includes(q));
}
const SORTS = {
  new: (a, b) => b.added.localeCompare(a.added),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  km: (a, b) => a.km - b.km,
  year: (a, b) => b.year - a.year || b.added.localeCompare(a.added),
  power: (a, b) => b.power - a.power,
};

grid.innerHTML = CARS.map((c) => carCard(c)).join('');
const cards = new Map($$('.car', grid).map((li) => [li.dataset.id, li]));
tilt(grid);

function updateFacetCounts(s) {
  BODY_TYPES.forEach((t) => { const n = CARS.filter((c) => c.body === t && matches(c, s, 'body')).length; const el = $(`[data-n-body="${t}"]`); el.textContent = n; el.closest('.body-opt').classList.toggle('is-zero', !n); });
  FUELS.forEach((f) => { $(`[data-n-fuel="${f}"]`).textContent = CARS.filter((c) => c.fuel === f && matches(c, s, 'fuel')).length; });
  makes.forEach((m) => { const n = CARS.filter((c) => c.make === m && matches(c, s, 'make')).length; const el = $(`[data-n-make="${m}"]`); el.textContent = n; el.closest('.check').classList.toggle('is-zero', !n); });
}

function renderChips(s) {
  const chips = [];
  if (s.q) chips.push(['q', '', `“${s.q}”`]);
  ['body', 'make', 'fuel', 'gearbox'].forEach((k) => s[k].forEach((v) => chips.push([k, v, v])));
  if (!RANGES.price.isDefault()) chips.push(['price', '', `${rs(s.price[0])} to ${rs(s.price[1])}`]);
  if (!RANGES.year.isDefault()) chips.push(['year', '', `${s.year[0]} to ${s.year[1]}`]);
  if (s.km < KM_MAX) chips.push(['km', '', `Under ${s.km.toLocaleString('en-US')} km`]);
  if (s.saved) chips.push(['saved', '', 'Saved only']);
  if (s.available) chips.push(['available', '', 'Available now']);
  $('[data-chips]').innerHTML = chips.map(([k, v, label]) =>
    `<button type="button" class="chip" data-chip="${k}" data-chip-v="${v}" aria-label="Remove filter: ${label}">${label}<span aria-hidden="true"></span></button>`).join('') +
    (chips.length > 1 ? '<button type="button" class="link chip-clear" data-reset>Clear all</button>' : '');
  const n = $('[data-active-n]');
  n.hidden = !chips.length; n.textContent = chips.length;
}

function render({ animate = true, keepShown = false } = {}) {
  const s = readState();
  writeUrl(s);
  if (!keepShown) shown = PAGE;
  const list = CARS.filter((c) => matches(c, s)).sort(SORTS[s.sort]);
  const visible = list.slice(0, shown);
  const flip = animate && !reduced ? Flip.getState([...cards.values()]) : null;
  const vis = new Set(visible.map((c) => c.id));
  visible.forEach((c) => grid.appendChild(cards.get(c.id)));
  cards.forEach((li, id) => (li.hidden = !vis.has(id)));

  $('[data-count]').textContent = list.length;
  $('[data-count-word]').textContent = list.length === 1 ? 'car' : 'cars';
  $('[data-count-btn]').textContent = list.length;
  $('[data-empty]').hidden = list.length > 0;
  $('[data-more-wrap]').hidden = list.length <= PAGE;
  $('[data-more]').hidden = shown >= list.length;
  $('[data-showing]').textContent = `Showing ${Math.min(shown, list.length)} of ${list.length}`;
  $('[data-more-bar]').style.transform = `scaleX(${Math.min(1, shown / list.length)})`;
  $('[data-km-out]').textContent = s.km >= KM_MAX ? 'Any' : s.km.toLocaleString('en-US') + ' km';
  renderChips(s);
  updateFacetCounts(s);

  const wa = encodeURIComponent(`Hi V8 Motors, please let me know when you have a car matching: ${$$('.chip', $('[data-chips]')).map((c) => c.textContent).join(', ') || 'my search'}.`);
  $('[data-wa-alert]').href = `https://wa.me/${DEALER.whatsapp}?text=${wa}`;

  if (flip) {
    Flip.from(flip, {
      duration: 0.65, ease: 'expo.out', absolute: true, stagger: 0.015, nested: true, prune: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out', stagger: 0.03 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }
}

let t;
form.addEventListener('input', (e) => {
  if (e.target.closest('[data-range]')) RANGES[e.target.closest('[data-range]').dataset.range].paint();
  clearTimeout(t);
  t = setTimeout(() => render(), e.target.type === 'search' || e.target.type === 'range' ? 180 : 0);
});
$('[data-sort]').addEventListener('change', () => render());
$('[data-more]').addEventListener('click', () => { shown += PAGE; render({ keepShown: true }); });

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-reset]')) {
    form.reset();
    Object.values(RANGES).forEach((r) => r.set());
    render();
    return;
  }
  const chip = e.target.closest('[data-chip]');
  if (chip) {
    const k = chip.dataset.chip, v = chip.dataset.chipV;
    if (k === 'q') form.q.value = '';
    else if (k === 'price' || k === 'year') RANGES[k].set();
    else if (k === 'km') form.km.value = KM_MAX;
    else if (k === 'saved' || k === 'available') form[k].checked = false;
    else $(`[name="${k}"][value="${CSS.escape(v)}"]`, form).checked = false;
    render();
  }
});

// ---------------------------------------------------------------- view toggle
function setView(v, animate = true) {
  const flip = animate && !reduced ? Flip.getState($$('.car:not([hidden]), .car:not([hidden]) .car-media, .car:not([hidden]) .car-info', grid)) : null;
  grid.dataset.view = v;
  $$('[data-view]').forEach((b) => b.getAttribute('data-view') && b.tagName === 'BUTTON' && b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  if (flip) Flip.from(flip, { duration: 0.7, ease: 'expo.inOut', nested: true, absolute: false, onComplete: () => ScrollTrigger.refresh() });
}
$$('.view-toggle [data-view]').forEach((b) => b.addEventListener('click', () => { setView(b.dataset.view); writeUrl(readState()); }));

// ---------------------------------------------------------------- mobile filter drawer
const panel = $('[data-filter-panel]');
const scrim = $('[data-scrim]');
function openFilters(on) {
  panel.classList.toggle('is-open', on);
  scrim.hidden = !on;
  document.body.classList.toggle('no-scroll', on);
  if (on) $('input', panel)?.focus({ preventScroll: true });
}
$('[data-open-filters]').addEventListener('click', () => openFilters(true));
$$('[data-close-filters]').forEach((b) => b.addEventListener('click', () => { openFilters(false); if (b.classList.contains('inv-filters-apply')) scrollToEl($('#results')); }));
scrim.addEventListener('click', () => openFilters(false));
document.addEventListener('keydown', (e) => e.key === 'Escape' && panel.classList.contains('is-open') && openFilters(false));

// ---------------------------------------------------------------- compare tray
function renderTray() {
  const ids = store.compare();
  const tray = $('[data-tray]');
  const was = !tray.hidden;
  tray.hidden = ids.length === 0;
  $('[data-tray-n]').textContent = ids.length;
  $('[data-tray-cars]').innerHTML = ids.map((id) => {
    const c = byId(id);
    return c ? `<li><img src="${sized(c.images[0], 160)}" alt="" /><span>${c.make} ${c.model}</span>
      <button type="button" data-compare="${id}" aria-pressed="true" aria-label="Remove ${c.make} ${c.model} from compare">×</button></li>` : '';
  }).join('') + Array.from({ length: 3 - ids.length }, () => '<li class="tray-empty"><span>Add a car</span></li>').join('');
  const go = $('[data-tray-go]');
  go.href = `compare.html?ids=${ids.join(',')}`;
  go.textContent = ids.length > 1 ? `Compare ${ids.length} cars` : 'Add one more';
  go.classList.toggle('is-disabled', ids.length < 2);
  if (!was && !tray.hidden && !reduced) gsap.fromTo(tray, { yPercent: 120 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' });
}
$('[data-tray-clear]').addEventListener('click', () => { store.setCompare([]); $$('[data-compare]').forEach((b) => b.setAttribute('aria-pressed', 'false')); });
$('[data-tray-go]').addEventListener('click', (e) => { if (store.compare().length < 2) e.preventDefault(); });
window.addEventListener('store:change', () => { renderTray(); if (form.saved.checked) render({ keepShown: true }); });
wireCardActions();
renderTray();

// ---------------------------------------------------------------- recently viewed
const recent = store.recent().map(byId).filter(Boolean);
if (recent.length) {
  $('[data-recent-wrap]').hidden = false;
  $('[data-recent]').innerHTML = recent.map((c) => `<li><a href="car.html?id=${c.id}" class="mini" data-cursor="View">
    <img src="${sized(c.images[0], 480)}" alt="" loading="lazy" /><span class="mini-name">${carName(c)}</span><span class="mini-price tabular-nums">${rs(c.price)}</span></a></li>`).join('');
}

// ---------------------------------------------------------------- go
applyUrl();
render({ animate: false });
riseIn($('[data-rise]'));
magnetize();
stretchHeadings();
if (!reduced) gsap.from(matchMedia('(min-width: 1000px)').matches ? '.inv-filters, .inv-toolbar' : '.inv-toolbar',
  { opacity: 0, y: 30, duration: 1, ease: 'expo.out', stagger: 0.1, delay: 0.3, clearProps: 'transform,opacity,translate' });
