import { rs, km, monthly, sized, carName } from '../data.js';
import { store } from './store.js';
import { toast, bump, nameForTransition } from './layout.js';

const SHAPES = {
  Hatchback: 'M2 17V12l10-2 9-6h21l8 6 4 3v4',
  Sedan: 'M2 17v-4l9-2 9-6h19l10 6 13 1.5V17',
  SUV: 'M2 17V9.5l6-1 6-6h35l6 6 7 1V17',
  Coupe: 'M2 17v-3.5l13-3.5 11-5h12l13 6 11 2V17',
  Convertible: 'M2 17v-3.5l13-3 7-1.5 4-4 2 4h12l12 3 12 2V17',
  Pickup: 'M2 17V9.5l6-1 6-6h17v6.5h31V17',
};
export const shapeSvg = (type) => `
  <svg viewBox="0 0 64 24" aria-hidden="true" class="shape">
    <path d="${SHAPES[type] || SHAPES.Sedan}"/>
    <path d="M2 17h8.5M21.5 17h21M53.5 17H62"/>
    <circle cx="16" cy="17" r="4.5"/><circle cx="48" cy="17" r="4.5"/>
  </svg>`;

export const ICON = {
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/></svg>',
  scales: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7Zm10 0-3 7a3 3 0 0 0 6 0l-3-7ZM12 4v16M8 20h8"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6h14v-6"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16a8 8 0 1 1 16 0M12 16l4-5"/></svg>',
  engine: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h3l2-3h6v3h3v3h2v-3M4 10v6h3l2 2h7v-5M4 13H2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16M12 4v16M18 4v8M6 12h12"/></svg>',
  fuel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M8 8h3"/></svg>',
  seat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h4l1 9H8L7 3ZM8 12l-1 4h10M17 16v4M7 16v4"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  palette: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s3 0 4-1 3-2 3-4a8 8 0 0 0-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="8.5" r="1"/></svg>',
  wheel: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4v5.5M4.5 14.5l5-1.5M19.5 14.5l-5-1.5"/></svg>',
};

const statusClass = (s) => (s === 'Just arrived' ? ' car-status--new' : s === 'Reserved' ? ' car-status--reserved' : '');

/** Listing card. `layout` = 'grid' | 'rail'. */
export function carCard(c, { eager = false } = {}) {
  return `<li class="car" data-id="${c.id}" data-flip-id="${c.id}">
    <div class="car-media" data-tilt>
      <img src="${sized(c.images[0], 900)}" alt="${carName(c)} in ${c.colour.toLowerCase()}" ${eager ? '' : 'loading="lazy"'} decoding="async"
        class="is-loading" onload="this.classList.remove('is-loading')" data-car-img />
      <span class="car-glare" aria-hidden="true"></span>
      <span class="car-status${statusClass(c.status)}">${c.status}</span>
      ${c.images.length > 1 ? `<span class="car-photos">${c.images.length} photos</span>` : ''}
    </div>
    <div class="car-tools">
      <button type="button" class="save" data-save="${c.id}" aria-pressed="${store.isSaved(c.id)}" aria-label="Save ${c.make} ${c.model}">${ICON.heart}</button>
      <button type="button" class="save" data-compare="${c.id}" aria-pressed="${store.inCompare(c.id)}" aria-label="Compare ${c.make} ${c.model}">${ICON.scales}</button>
    </div>
    <div class="car-info">
      <h3 class="car-title"><a href="car.html?id=${c.id}" data-car-link data-cursor="View">${carName(c)}</a></h3>
      <p class="car-price tabular-nums">${rs(c.price)}</p>
      <p class="car-trim">${c.trim}</p>
      <p class="car-monthly tabular-nums">or ${rs(monthly(c.price))}/mo</p>
      <p class="car-specs"><span class="tabular-nums">${km(c.km)}</span><span>${c.fuel}</span><span>${c.gearbox}</span><span>${c.engine}</span></p>
    </div>
  </li>`;
}

let wired = false;
/** One delegated listener for save / compare buttons and the image morph, on every page. */
export function wireCardActions({ onChange } = {}) {
  if (wired) return;
  wired = true;
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-save]');
    if (s) {
      e.preventDefault();
      const on = store.toggleSaved(s.dataset.save);
      document.querySelectorAll(`[data-save="${s.dataset.save}"]`).forEach((b) => b.setAttribute('aria-pressed', String(on)));
      bump('[data-saved-link]');
      toast(on ? 'Saved. Find it any time under the heart.' : 'Removed from saved cars.', on ? { href: 'inventory.html?saved=1', label: 'View saved' } : null);
      onChange?.('saved');
      return;
    }
    const cmp = e.target.closest('[data-compare]');
    if (cmp) {
      e.preventDefault();
      const r = store.toggleCompare(cmp.dataset.compare);
      if (r === 'full') { toast('You can compare up to 3 cars. Remove one first.', { href: 'compare.html', label: 'Open compare' }); return; }
      document.querySelectorAll(`[data-compare="${cmp.dataset.compare}"]`).forEach((b) => b.setAttribute('aria-pressed', String(r === 'added')));
      bump('[data-compare-link]');
      const n = store.compare().length;
      toast(r === 'added' ? `Added to compare (${n} of 3).` : 'Removed from compare.', n > 1 ? { href: 'compare.html', label: `Compare ${n} cars` } : null);
      onChange?.('compare');
      return;
    }
    const link = e.target.closest('[data-car-link]');
    if (link) {
      const card = link.closest('.car');
      nameForTransition(card?.querySelector('[data-car-img]'), 'car-hero', card?.dataset.id);
    }
  });
}
