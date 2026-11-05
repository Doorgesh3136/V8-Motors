// Pure HTML templates (no DOM access). Used at build time to pre-render pages,
// and in the browser where content has to be redrawn.
import { CARS, DEALER, BODY_TYPES, rs, km, monthly, carName, thumb, large } from '../data.js';

export const SITE = 'https://webluxe.github.io/V8-Motors/';
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const carUrl = (c, P = '') => `${P}cars/${c.id}.html`;

/* ------------------------------------------------------------------ icons */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  heart: svg('<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/>'),
  scales: svg('<path d="M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7Zm10 0-3 7a3 3 0 0 0 6 0l-3-7ZM12 4v16M8 20h8"/>'),
  share: svg('<path d="M12 3v12M7 8l5-5 5 5M5 13v6h14v-6"/>'),
  arrowL: svg('<path d="M15 5l-7 7 7 7"/>'),
  arrowR: svg('<path d="M9 5l7 7-7 7"/>'),
  expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  chat: svg('<path d="M4 5h16v11H9l-5 4V5Z"/>'),
  car: svg('<path d="M3 15v-3l2-5h14l2 5v3M3 15h18v3h-3v-2H6v2H3v-3Z"/><circle cx="7.5" cy="13" r="1"/><circle cx="16.5" cy="13" r="1"/>'),
  tag: svg('<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8.5" r="1.3"/>'),
  coin: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.2c.4-1 1.4-1.6 2.6-1.6 1.6 0 2.6.9 2.6 2 0 2.7-5.2 1.6-5.2 4.4 0 1.1 1 2 2.6 2 1.2 0 2.2-.6 2.6-1.6M12 6v1.6M12 16v2"/>'),
  pin: svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
  gauge: svg('<path d="M4 16a8 8 0 1 1 16 0M12 16l4-5"/>'),
  engine: svg('<path d="M4 10h3l2-3h6v3h3v3h2v-3M4 10v6h3l2 2h7v-5M4 13H2"/>'),
  bolt: svg('<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>'),
  gear: svg('<path d="M6 4v16M12 4v16M18 4v8M6 12h12"/>'),
  fuel: svg('<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M8 8h3"/>'),
  seat: svg('<path d="M7 3h4l1 9H8L7 3ZM8 12l-1 4h10M17 16v4M7 16v4"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  shield: svg('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  palette: svg('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s3 0 4-1 3-2 3-4a8 8 0 0 0-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="8.5" r="1"/>'),
  wheel: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4v5.5M4.5 14.5l5-1.5M19.5 14.5l-5-1.5"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  reel: svg('<rect x="6" y="3.5" width="12" height="17" rx="2.5"/><path d="m10.5 9.5 4 2.5-4 2.5v-5Z"/>'),
  mail: svg('<path d="M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5"/>'),
  route: svg('<path d="M6 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8.5 16.5h7a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H15"/>'),
  whatsapp: svg('<path d="M4.5 19.5l1.1-3.6A8 8 0 1 1 8.3 18.6l-3.8.9Z"/><path d="M9.2 8.6c.3-.6.6-.6.9-.6h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.4 0 .6.6 1 1.4 1.8 2.4 2.3.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4 0 .3 0 1-.5 1.5-.5.5-1.6.9-2.6.6a9 9 0 0 1-5.1-4.5c-.6-1.3-.4-2.3.2-3.1Z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
};

/* ------------------------------------------------------------------ brand mark: the dealership's own V8 logo */
export const markSVG = (cls = 'mark', P = '') => `<img class="${cls}" src="${P}brand/v8-mark-sm.png" width="182" height="172" alt="" decoding="async">`;

/* ------------------------------------------------------------------ body shapes */
const SHAPES = {
  Hatchback: 'M2 17V12l10-2 9-6h21l8 6 4 3v4',
  Sedan: 'M2 17v-4l9-2 9-6h19l10 6 13 1.5V17',
  SUV: 'M2 17V9.5l6-1 6-6h35l6 6 7 1V17',
  Coupe: 'M2 17v-3.5l13-3.5 11-5h12l13 6 11 2V17',
  Convertible: 'M2 17v-3.5l13-3 7-1.5 4-4 2 4h12l12 3 12 2V17',
  Pickup: 'M2 17V9.5l6-1 6-6h17v6.5h31V17',
  MPV: 'M2 17V10l7-1.5 7-6h33l7 6.5 6 1V17',
  Van: 'M2 17V8.5l5-1.5 4-5h47l4 3V17',
};
export const shapeSvg = (type) => `<svg viewBox="0 0 64 24" aria-hidden="true" class="shape">
    <g class="body"><path d="${SHAPES[type] || SHAPES.Sedan}"/><path d="M2 17h8.5M21.5 17h21M53.5 17H62"/></g>
    <g class="wheel"><circle cx="16" cy="17" r="4.5"/><path d="M16 13.6v6.8M12.6 17h6.8"/></g>
    <g class="wheel"><circle cx="48" cy="17" r="4.5"/><path d="M48 13.6v6.8M44.6 17h6.8"/></g></svg>`;

/* ------------------------------------------------------------------ images */
export function photo(src, { alt, srcset = '', sizes = '', eager = false, cls = '', w = 960, h = 634, attrs = '' }) {
  return `<img src="${src}"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ''} width="${w}" height="${h}" alt="${esc(alt)}"
    ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${cls ? `class="${cls}"` : ''} ${attrs}>`;
}

const statusClass = (s) => (s === 'Just arrived' ? ' car-status--new' : s === 'Saturday deal' ? ' car-status--deal' : s === 'Reserved' ? ' car-status--reserved' : '');
const statusBadge = (c, extra = '') => (c.status === 'In stock' ? '' : `<span class="car-status${extra}${statusClass(c.status)}">${c.status}</span>`);

/* ------------------------------------------------------------------ car card */
// how a salesperson would say it: "2019 silver hatchback", "1.2 L petrol, manual"
const soft = (w) => (w === w.toUpperCase() ? w : w.toLowerCase());
const carLine = (c) => [c.year, c.colour && soft(c.colour), c.body && soft(c.body)].filter(Boolean).join(' ');
const specLine = (c) => [[c.engine, soft(c.fuel)].filter(Boolean).join(' '), soft(c.gearbox), c.km != null ? km(c.km) : ''].filter(Boolean).join(', ');

export function carCard(c, P = '', { eager = false, sizes = '(min-width: 1000px) 30vw, (min-width: 640px) 45vw, 92vw' } = {}) {
  const n = c.thumbs.length;
  return `<li class="car" data-id="${c.id}" data-flip-id="${c.id}">
    <a href="${carUrl(c, P)}" class="car-media" tabindex="-1" aria-hidden="true" data-scrub="${c.thumbs.map((t) => P + t).join('|')}">
      ${photo(thumb(c, 0, 960, P), { alt: '', eager, sizes, srcset: `${thumb(c, 0, 480, P)} 480w, ${thumb(c, 0, 960, P)} 960w`, attrs: 'data-car-img' })}
      ${statusBadge(c)}
      ${n > 1 ? `<span class="car-ticks" aria-hidden="true">${'<i></i>'.repeat(n)}</span><span class="car-photos tabular-nums">${n} photos</span>` : ''}
    </a>
    <div class="car-tools">
      <button type="button" class="save" data-save="${c.id}" aria-pressed="false" aria-label="Save the ${esc(carName(c))}">${ICON.heart}</button>
    </div>
    <div class="car-info">
      <div class="car-tag">
        <p class="car-price car-plate${c.status === 'Saturday deal' ? ' car-plate--deal' : ''} tabular-nums">${rs(c.price)}</p>
      </div>
      <h3 class="car-title"><a href="${carUrl(c, P)}" data-car-link>${esc(c.make)} ${esc(c.model)}</a></h3>
      <p class="car-kicker tabular-nums">${esc(carLine(c))}</p>
      <div class="car-foot">
        <div class="car-lines">
          <p class="car-line tabular-nums">${esc(specLine(c))}</p>
          <p class="car-monthly tabular-nums">or about ${rs(monthly(c.price))} a month</p>
        </div>
        <button type="button" class="save save--plain" data-compare="${c.id}" aria-pressed="false" aria-label="Compare the ${esc(carName(c))}">${ICON.scales}</button>
      </div>
    </div>
  </li>`;
}

/* ------------------------------------------------------------------ chrome */
export const NAV_PAGES = [
  { key: 'inventory', href: 'inventory.html', label: 'Cars for sale' },
  { key: 'forecourt', href: 'forecourt.html', label: 'The forecourt' },
  { key: 'sell', href: 'sell.html', label: 'Sell or exchange' },
  { key: 'finance', href: 'finance.html', label: 'Leasing' },
  { key: 'contact', href: 'contact.html', label: 'Visit us' },
];

/** Page-change curtain: three layers per side sweep in, meet in the middle, then open on the next page. */
export function curtainHTML(P = '') {
  const side = (k) => `<div class="curtain-side curtain-side--${k}"><span class="cl cl-1"></span><span class="cl cl-2"></span><span class="cl cl-3"></span></div>`;
  return `<div class="curtain" data-curtain aria-hidden="true">${side('l')}${side('r')}
    <div class="curtain-mid">${markSVG('mark curtain-mark', P)}<span class="curtain-label" data-curtain-label></span></div></div>`;
}

export function navHTML(page, P = '') {
  return `${curtainHTML(P)}<header class="nav" data-nav>
    <a href="${P}./" class="wordmark" aria-label="V8 Motors, home">${markSVG('mark wordmark-mark', P)}<span>V8 Motors</span></a>
    <nav aria-label="Main" class="nav-links" data-nav-links>
      ${NAV_PAGES.map((p) => `<a href="${P}${p.href}"${p.key === page ? ' aria-current="page"' : ''}>${p.label}</a>`).join('')}
      <span class="nav-ink" data-nav-ink aria-hidden="true"></span>
    </nav>
    <p class="nav-chapter" data-chapter-label aria-hidden="true"></p>
    <div class="nav-actions">
      <a class="nav-phone tabular-nums" href="${DEALER.phoneHref}">${ICON.phone}${DEALER.phone}</a>
      <a href="${P}compare.html" class="icon-btn" data-compare-link aria-label="0 cars to compare">${ICON.scales}<span data-compare-count class="tabular-nums">0</span></a>
      <a href="${P}inventory.html?saved=1" class="icon-btn" data-saved-link aria-label="0 saved cars">${ICON.heart}<span data-saved-count class="tabular-nums">0</span></a>
    </div>
  </header>`;
}

const MAPS_DIR = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEALER.mapsQuery)}`;
const WA = (text = 'Hello V8 Motors, ') => `https://wa.me/${DEALER.whatsapp}?text=${encodeURIComponent(text)}`;

/** Bottom dock on phones: the main actions sit where the thumb is. A pill glides to the current tab
    (and between pages, with the page transition); Menu opens a bottom sheet with everything else. */
export function mobileBarHTML(page, P = '') {
  const tab = (key, href, icon, label) => `<a href="${href}" class="tab"${key === page ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`;
  return `<nav class="tabbar" aria-label="Quick links" data-tabbar>
    <span class="tab-pill" data-tab-pill aria-hidden="true"></span>
    ${tab('home', `${P}./`, markSVG('mark tab-mark', P), 'Home')}
    ${tab('inventory', `${P}inventory.html`, ICON.car, 'Cars')}
    ${tab('forecourt', `${P}forecourt.html`, ICON.reel, 'Forecourt')}
    <a href="${DEALER.phoneHref}" class="tab tab--call">${ICON.phone}<span>Call</span></a>
    <button type="button" class="tab" data-menu-open aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-sheet"${['sell', 'finance', 'contact', 'compare'].includes(page) ? ' aria-current="page"' : ''}>${ICON.menu}<span>Menu</span></button>
  </nav>
  ${menuSheetHTML(page, P)}`;
}

/** The menu as a bottom sheet (never a full-screen takeover): every page, the quickest ways to reach
    the showroom, and whether it's open right now. Drag it down, tap outside or press Escape to close. */
export function menuSheetHTML(page, P = '') {
  const link = (key, href, icon, label, meta) => `<a href="${href}" class="sheet-link"${key === page ? ' aria-current="page"' : ''}>${icon}<span><strong>${label}</strong>${meta ? `<small>${meta}</small>` : ''}</span></a>`;
  return `<div class="sheet-scrim" data-menu-scrim hidden></div>
  <div class="sheet" id="menu-sheet" role="dialog" aria-modal="true" aria-labelledby="menu-title" data-menu hidden>
    <div class="sheet-grab" data-menu-grab aria-hidden="true"><span></span></div>
    <div class="sheet-head">
      <p class="sheet-title" id="menu-title">V8 <em>Motors</em></p>
      <button type="button" class="sheet-close" data-menu-close aria-label="Close the menu">${ICON.close}</button>
    </div>
    <p class="sheet-status open-status" data-open-status></p>
    <nav class="sheet-links" aria-label="All pages">
      ${link('home', `${P}./`, markSVG('mark', P), 'Home', '')}
      ${link('inventory', `${P}inventory.html`, ICON.car, 'Cars for sale', `${CARS.length} in stock`)}
      ${link('forecourt', `${P}forecourt.html`, ICON.reel, 'The forecourt', 'Every car, full screen')}
      ${link('sell', `${P}sell.html`, ICON.tag, 'Sell or exchange', 'A guide price in 3 steps')}
      ${link('finance', `${P}finance.html`, ICON.coin, 'Leasing', `With ${DEALER.leasing}`)}
      ${link('contact', `${P}contact.html`, ICON.pin, 'Visit us', `${DEALER.street}, ${DEALER.locality}`)}
      ${link('compare', `${P}compare.html`, ICON.scales, 'Compare', 'Up to three cars')}
      ${link('saved', `${P}inventory.html?saved=1`, ICON.heart, 'My garage', '<span data-saved-count>0</span> parked')}
    </nav>
    <div class="sheet-ways">
      <a href="${DEALER.phoneHref}" class="way-btn">${ICON.phone}<span>Call</span></a>
      <a href="${WA()}" class="way-btn" rel="noopener">${ICON.whatsapp}<span>WhatsApp</span></a>
      <a href="mailto:${DEALER.email}" class="way-btn">${ICON.mail}<span>Email</span></a>
      <a href="${MAPS_DIR}" class="way-btn" rel="noopener">${ICON.route}<span>Directions</span></a>
    </div>
  </div>`;
}

/** The end of the drive: the sun comes up behind the Moka range, as seen from the Royal Road: Le Pouce, the thumb,
    and Pieter Both with the boulder on its summit. Silhouettes generated by a small script, no images. */
const HORIZON = `<div class="horizon" data-horizon aria-hidden="true">
  <span class="horizon-sun" data-sun></span>
  <svg viewBox="0 0 1600 300" preserveAspectRatio="none">
    <path class="ridge ridge-3" d="M0 300V189L10 188L20 187L30 185L40 185L50 183L60 181L70 179L80 176L90 174L100 172L110 170L120 167L130 166L140 164L150 164L160 164L170 164L180 165L190 166L200 167L210 168L220 168L230 169L240 170L250 170L260 170L270 171L280 172L290 174L300 174L310 173L320 173L330 171L340 171L350 170L360 168L370 166L380 165L390 164L400 162L410 160L420 157L430 155L440 152L450 152L460 150L470 149L480 148L490 148L500 147L510 146L520 148L530 149L540 150L550 151L560 151L570 153L580 154L590 155L600 156L610 157L620 160L630 162L640 163L650 164L660 163L670 163L680 163L690 164L700 163L710 162L720 161L730 160L740 158L750 156L760 154L770 152L780 150L790 149L800 147L810 146L820 146L830 144L840 144L850 143L860 141L870 141L880 140L890 140L900 140L910 141L920 141L930 142L940 143L950 145L960 146L970 148L980 150L990 149L1000 150L1010 152L1020 155L1030 157L1040 158L1050 160L1060 160L1070 161L1080 161L1090 162L1100 162L1110 163L1120 163L1130 161L1140 160L1150 160L1160 157L1170 154L1180 153L1190 151L1200 149L1210 148L1220 147L1230 145L1240 143L1250 142L1260 141L1270 141L1280 141L1290 141L1300 140L1310 141L1320 142L1330 143L1340 144L1350 147L1360 149L1370 150L1380 152L1390 155L1400 157L1410 159L1420 160L1430 161L1440 162L1450 162L1460 163L1470 163L1480 164L1490 164L1500 164L1510 164L1520 165L1530 166L1540 167L1550 168L1560 170L1570 171L1580 174L1590 177L1600 180H1600V300Z"/>
    <path class="ridge ridge-2" d="M0 300V238L8 238L16 238L24 237L32 237L40 237L48 237L56 236L64 235L72 235L80 234L88 232L96 231L104 231L112 230L120 229L128 227L136 226L144 224L152 222L160 220L168 218L176 217L184 215L192 214L200 213L208 211L216 211L224 210L232 209L240 208L248 208L256 210L264 210L272 212L280 214L288 215L296 218L304 220L312 221L320 222L328 222L336 223L344 223L352 222L360 221L368 219L376 215L384 212L392 208L400 204L408 202L416 200L424 198L432 199L440 201L448 203L456 205L464 209L472 212L480 216L488 220L496 224L504 226L512 230L520 233L528 235L536 236L544 237L552 237L560 239L568 239L576 199L584 188L592 175L600 164L608 151L616 136L624 124L632 116L640 106L648 121L656 143L664 159L672 181L680 198L688 230L696 228L704 226L712 222L720 220L728 218L736 215L744 212L752 209L760 207L768 206L776 204L784 203L792 201L800 201L808 201L816 201L824 201L832 201L840 201L848 201L856 201L864 199L872 199L880 198L888 198L896 199L904 200L912 202L920 205L928 208L936 211L944 216L952 220L960 223L968 226L976 217L984 207L992 197L1000 187L1008 174L1016 164L1024 144L1032 136L1040 127L1048 111L1056 97L1062 69L1062 64L1053 58L1052 55L1052 52L1053 49L1055 46L1057 44L1061 42L1064 41L1068 41L1072 42L1076 43L1079 45L1081 48L1082 51L1082 54L1081 57L1072 64L1072 69L1080 99L1088 114L1096 128L1104 135L1112 149L1120 161L1128 179L1136 188L1144 194L1152 210L1160 215L1168 223L1176 220L1184 219L1192 217L1200 215L1208 211L1216 208L1224 205L1232 203L1240 200L1248 198L1256 196L1264 193L1272 191L1280 189L1288 190L1296 191L1304 191L1312 193L1320 195L1328 198L1336 200L1344 202L1352 204L1360 206L1368 209L1376 211L1384 212L1392 211L1400 212L1408 211L1416 210L1424 207L1432 206L1440 204L1448 204L1456 204L1464 204L1472 205L1480 206L1488 207L1496 209L1504 211L1512 213L1520 215L1528 217L1536 220L1544 224L1552 226L1560 228L1568 229L1576 231L1584 233L1592 235L1600 236H1600V300Z"/>
    <path class="ridge ridge-1" d="M0 300V258L12 257L24 256L36 256L48 256L60 255L72 255L84 255L96 254L108 254L120 254L132 253L144 253L156 253L168 253L180 253L192 254L204 255L216 256L228 256L240 257L252 257L264 258L276 258L288 259L300 260L312 260L324 261L336 261L348 261L360 261L372 262L384 262L396 262L408 262L420 262L432 262L444 261L456 261L468 260L480 259L492 258L504 258L516 257L528 256L540 256L552 255L564 254L576 252L588 251L600 250L612 250L624 250L636 249L648 249L660 249L672 248L684 247L696 247L708 247L720 247L732 248L744 248L756 249L768 249L780 249L792 249L804 250L816 250L828 250L840 250L852 251L864 251L876 252L888 252L900 253L912 253L924 253L936 253L948 253L960 253L972 253L984 253L996 254L1008 253L1020 253L1032 253L1044 253L1056 252L1068 252L1080 252L1092 251L1104 251L1116 250L1128 249L1140 248L1152 248L1164 248L1176 248L1188 247L1200 246L1212 246L1224 246L1236 246L1248 246L1260 246L1272 246L1284 247L1296 247L1308 248L1320 249L1332 249L1344 250L1356 250L1368 251L1380 251L1392 252L1404 252L1416 254L1428 254L1440 255L1452 256L1464 256L1476 257L1488 258L1500 258L1512 259L1524 260L1536 262L1548 262L1560 263L1572 263L1584 264L1596 264H1600V300Z"/>
  </svg>
</div>`;

export function footerHTML(P = '') {
  const makes = [...new Set(CARS.map((c) => c.make))].sort();
  return `<footer class="footer">
    <div class="footer-sky">
    <div class="wrap">
      <section class="footer-cta" aria-labelledby="footer-cta-title">
        <div>
          <p class="eyebrow">59B Royal Road, Coromandel</p>
          <h2 class="section-title" id="footer-cta-title">Come and <em>drive</em> one.</h2>
          <p class="open-status" data-open-status>Open Monday to Saturday</p>
        </div>
        <div class="footer-ways">
          <a class="btn btn-primary btn-lg" href="${DEALER.phoneHref}">${ICON.phone}Call ${DEALER.phone}</a>
          <a class="btn btn-line btn-lg" href="${WA()}" rel="noopener">${ICON.whatsapp}WhatsApp</a>
          <a class="btn btn-line btn-lg" href="${MAPS_DIR}" rel="noopener">${ICON.route}Directions</a>
        </div>
      </section>
    </div>
    ${HORIZON}
    </div>
    <div class="footer-ground">
      <div class="wrap">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="${P}./" class="wordmark wordmark--lg" aria-label="V8 Motors, home">${markSVG('mark wordmark-mark', P)}<span>V8 Motors</span></a>
            <p class="footer-lead">Buy, sell or exchange, with leasing through ${DEALER.leasing}. ${DEALER.street}, ${DEALER.locality}.</p>
          </div>
          <nav aria-label="Footer: pages"><p class="footer-h">Pages</p>
            <a href="${P}./">Home</a>${NAV_PAGES.map((p) => `<a href="${P}${p.href}">${p.label}</a>`).join('')}<a href="${P}compare.html">Compare</a></nav>
          <nav aria-label="Footer: makes"><p class="footer-h">Makes in stock</p>
            <div class="footer-makes">${makes.map((m) => `<a href="${P}inventory.html?make=${encodeURIComponent(m)}">${m}</a>`).join('')}</div></nav>
          <div><p class="footer-h">Showroom</p>
            <address>${DEALER.street}<br>${DEALER.locality}, Mauritius</address>
            <p class="footer-phones">${DEALER.phones.map(([t, h]) => `<a href="${h}" class="tabular-nums">${t}</a>`).join('')}</p>
            <p><a href="${WA()}" rel="noopener">WhatsApp</a></p>
            <p><a href="mailto:${DEALER.email}">${DEALER.email}</a></p></div>
        </div>
        <div class="footer-row">
          <p>© ${new Date().getFullYear()} ${DEALER.legalName}. Leasing subject to approval by ${DEALER.leasing}.</p>
          <p class="footer-legal"><a href="${P}privacy.html">Privacy policy</a><a href="${P}terms.html">Terms of sale</a></p>
        </div>
        <p class="footer-credits">Stock photos by V8 Motors. Home page 3D car adapted from <a href="https://sketchfab.com/models/b477326cf8b041c9b1a89b1c4f4e7bdf" rel="noopener">Range Rover Sport Hybrid PHEV 2023 by victor-arrais</a> (CC BY 4.0), engine in the intro adapted from <a href="https://sketchfab.com/models/f20acef709b847eb98839b89c5ef916c" rel="noopener">V8 Hot Rod Engine by ShotaB</a> (CC BY 4.0).<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>). Engine sound built from CC0 recordings by marcelweiss and Paul368 on Freesound.</p>
      </div>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------------ budget dial */
export const DIAL = { min: 3000, max: 25000, step: 500, start: 12000, sweep: 125 };
/** The rev counter: a tick every Rs 1,000, a numbered tick every Rs 5,000, redline at the top end. */
export function dialSvg() {
  const { min, max, sweep } = DIAL;
  const ang = (v) => -sweep + ((v - min) / (max - min)) * sweep * 2;
  const pt = (a, r) => { const t = (a * Math.PI) / 180; return [200 + r * Math.sin(t), 200 - r * Math.cos(t)]; };
  const fx = (n) => n.toFixed(1);
  let ticks = '', nums = '';
  for (let v = min; v <= max; v += 1000) {
    const big = v % 5000 === 0, a = ang(v), red = v >= 20000 ? ' is-red' : '';
    const [x1, y1] = pt(a, big ? 156 : 165), [x2, y2] = pt(a, 178);
    ticks += `<line class="dt${big ? ' dt--big' : ''}${red}" x1="${fx(x1)}" y1="${fx(y1)}" x2="${fx(x2)}" y2="${fx(y2)}"/>`;
    if (big) { const [x, y] = pt(a, 130); nums += `<text class="dn${red}" x="${fx(x)}" y="${fx(y + 8)}" text-anchor="middle">${v / 1000}</text>`; }
  }
  const [ax, ay] = pt(-sweep, 190), [bx, by] = pt(sweep, 190);
  const arc = `M${fx(ax)} ${fx(ay)}A190 190 0 1 1 ${fx(bx)} ${fx(by)}`;
  return `<svg class="dial-svg" viewBox="0 0 400 400" aria-hidden="true">
    <path class="dial-track" d="${arc}"/>
    <path class="dial-fill" d="${arc}" pathLength="100" data-dial-fill/>
    ${ticks}${nums}
    <g class="gauge-needle" data-dial-needle><path d="M196 214 199.2 62h1.6L204 214a4 4 0 0 1-8 0Z"/></g>
    <circle class="gauge-hub" cx="200" cy="200" r="11"/>
  </svg>`;
}

/* ------------------------------------------------------------------ head / SEO */
export function headHTML({ title, desc, path, image, jsonld = [], P = '' }) {
  const url = SITE + path;
  const img = image || `${SITE}og.jpg`;
  return `<script>(function(){try{var n=performance.getEntriesByType('navigation')[0],f=location.pathname.split('/').pop();if(n&&n.type==='reload'&&f&&f!=='index.html'){sessionStorage.setItem('v8:restart','1');location.replace('${P}./')}}catch(e){}})();(function(d){try{if(sessionStorage.getItem('v8:curtain')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('curtain-in');
    /* if the page script never runs (offline, blocked), don't leave the intro or hidden content in the way */
    setTimeout(function(){if(!window.__v8){d.classList.remove('play-intro','js');}},9000);}catch(e){}})(document.documentElement)</script>
  <script type="speculationrules">{"prefetch":[{"where":{"and":[{"selector_matches":"a[href]"},{"not":{"selector_matches":"[rel~=noopener],[href^='tel:'],[href^='mailto:'],[href*='://']"}}]},"eagerness":"moderate"}]}</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="V8 Motors" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:locale" content="en_MU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${img}" />
  <meta name="theme-color" content="#41403f" />
  <link rel="icon" href="${P}favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="${P}favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="${P}apple-touch-icon.png" />
  <link rel="manifest" href="${P}site.webmanifest" />
  ${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n  ')}`;
}

export function dealerJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'V8 Motors',
    url: SITE,
    logo: `${SITE}brand/v8-mark.png`,
    image: `${SITE}og.jpg`,
    telephone: '+230' + DEALER.phone.replace(/\s/g, ''),
    email: DEALER.email,
    priceRange: `${rs(Math.min(...CARS.map((c) => c.price)))} to ${rs(Math.max(...CARS.map((c) => c.price)))}`,
    address: { '@type': 'PostalAddress', streetAddress: DEALER.street, addressLocality: DEALER.locality, addressCountry: 'MU' },
    areaServed: 'Mauritius',
    openingHoursSpecification: DEALER.hours.map((h, d) => h && {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d],
      opens: h[0], closes: h[1],
    }).filter(Boolean),
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
  };
}

export function carJsonLd(c) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: carName(c),
    brand: { '@type': 'Brand', name: c.make },
    model: c.model,
    vehicleModelDate: String(c.year),
    ...(c.km != null && { mileageFromOdometer: { '@type': 'QuantitativeValue', value: c.km, unitCode: 'KMT' } }),
    fuelType: c.fuel,
    vehicleTransmission: c.gearbox,
    bodyType: c.body,
    ...(c.colour && { color: c.colour }),
    ...(c.engineCc && { vehicleEngine: { '@type': 'EngineSpecification', engineDisplacement: { '@type': 'QuantitativeValue', value: c.engineCc, unitCode: 'CMQ' } } }),
    ...(c.seats && { seatingCapacity: c.seats }),
    ...(c.description && { description: c.description }),
    itemCondition: 'https://schema.org/UsedCondition',
    image: c.images,
    url: `${SITE}cars/${c.id}.html`,
    offers: {
      '@type': 'Offer', price: c.price, priceCurrency: 'MUR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: 'V8 Motors', url: SITE },
    },
  };
}

/* ------------------------------------------------------------------ car page */
export function similarCars(c, n = 8) {
  return CARS.filter((x) => x.id !== c.id)
    .map((x) => ({ x, s: (x.body === c.body ? 2 : 0) + (x.make === c.make ? 1 : 0) - Math.abs(Math.log(x.price / c.price)) * 2 }))
    .sort((a, b) => b.s - a.s).slice(0, n).map((o) => o.x);
}

export function honeypot() {
  return `<div class="hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`;
}

/* ---- dials and comparisons on the car page. Everything is worked out from the real stock list, nothing is invented */
function dial(label, value, frac) {
  const f = Math.max(0, Math.min(1, frac ?? 0));
  const ticks = Array.from({ length: 19 }, (_, i) => {
    const a = (-135 + i * 15) * Math.PI / 180, r1 = i % 3 ? 45 : 42;
    return `<line x1="${(60 + Math.sin(a) * r1).toFixed(1)}" y1="${(60 - Math.cos(a) * r1).toFixed(1)}" x2="${(60 + Math.sin(a) * 49).toFixed(1)}" y2="${(60 - Math.cos(a) * 49).toFixed(1)}"/>`;
  }).join('');
  return `<div class="gauge" style="--f:${f.toFixed(3)}">
    <svg viewBox="0 0 120 120" aria-hidden="true"><g class="gauge-ticks">${ticks}</g><path class="gauge-arc" pathLength="100" d="M21.1 98.9a55 55 0 1 1 77.8 0"/><line class="gauge-needle" x1="60" y1="66" x2="60" y2="20"/><circle class="gauge-hub" cx="60" cy="60" r="5"/></svg>
    <dd class="gauge-value tabular-nums">${esc(value)}</dd><dt class="gauge-label">${label}</dt></div>`;
}
const ordinal = (n) => (n === 1 ? '' : `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]} `);
function compareRow(label, list, v, lo, hi, line) {
  const f = hi > lo ? (v - lo) / (hi - lo) : 0.5;
  return `<div class="cmp"><p class="cmp-name">${label}</p><p class="cmp-line">${line}</p>
    <div class="cmp-track" style="--f:${f.toFixed(3)}" aria-hidden="true">${list.map((x) => `<i style="--x:${(hi > lo ? (x - lo) / (hi - lo) : 0.5).toFixed(3)}"></i>`).join('')}<b></b></div></div>`;
}
function compareHTML(c) {
  const rows = [];
  const peers = CARS.filter((x) => x.body === c.body), prices = peers.map((x) => x.price).sort((a, b) => a - b);
  const plural = c.body === 'Sedan' || c.body === 'Hatchback' || c.body === 'Pickup' || c.body === 'Van' ? `${c.body.toLowerCase()}s` : `${c.body}s`;
  if (peers.length >= 3) {
    const n = prices.filter((p) => p < c.price).length + 1;
    rows.push(compareRow('Price', prices, c.price, prices[0], prices[prices.length - 1], `${n === 1 ? 'The lowest priced' : `${ordinal(n)}lowest priced`} of ${peers.length} ${plural} here`));
  }
  const kms = CARS.map((x) => x.km).filter((x) => x != null).sort((a, b) => a - b);
  if (c.km != null && kms.length >= 3) {
    const pct = Math.round((kms.filter((k) => k > c.km).length / kms.length) * 100);
    rows.push(compareRow('Mileage', kms, c.km, kms[0], kms[kms.length - 1], pct >= 50 ? `Fewer kilometres than ${pct}% of our cars` : `${km(c.km)} on the clock`));
  }
  const years = CARS.map((x) => +x.year).sort((a, b) => a - b);
  const newer = Math.round((years.filter((y) => y < +c.year).length / years.length) * 100);
  rows.push(compareRow('Age', years, +c.year, years[0], years[years.length - 1], newer >= 50 ? `Newer than ${newer}% of our cars` : `A ${c.year} car, in a stock running from ${years[0]} to ${years[years.length - 1]}`));
  return rows.join('');
}

export function carPageHTML(c, P = '../') {
  const name = carName(c);
  const n = c.images.length;
  const waText = encodeURIComponent(`Hi V8 Motors, I'm interested in the ${name} (${rs(c.price)}). Is it still available to view?`);
  const specs = [
    [ICON.gauge, 'Year', c.year],
    [ICON.gauge, 'Mileage', km(c.km)],
    c.engine && [ICON.engine, 'Engine', c.engine],
    [ICON.gear, 'Gearbox', c.gearbox],
    [ICON.fuel, 'Fuel', c.fuel],
    [ICON.car, 'Body', c.body],
    c.colour && [ICON.palette, 'Colour', c.colour],
    c.seats && [ICON.seat, 'Seats', c.seats],
    c.doors && [ICON.wheel, 'Doors', c.doors],
  ].filter(Boolean).filter(([, k]) => !['Year', 'Mileage', 'Engine', (c.km == null || !c.engine) && 'Seats'].includes(k));
  const allYears = CARS.map((x) => +x.year), minY = Math.min(...allYears), maxY = Math.max(...allYears);
  const yearFrac = maxY > minY ? (+c.year - minY) / (maxY - minY) : 0.5;
  const maxKm = Math.max(1, ...CARS.map((x) => x.km || 0)), maxCc = Math.max(1, ...CARS.map((x) => x.engineCc || 0));
  return `
  <div class="wrap car-page" data-car="${c.id}">
    <div class="car-bay" aria-hidden="true"><div class="car-bay-img"></div><div class="car-ambient" style="background-image:url(${P}${c.thumbs[0]})"></div></div>
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${P}./">Home</a><span aria-hidden="true">/</span><a href="${P}inventory.html">Cars</a><span aria-hidden="true">/</span>
      <a href="${P}inventory.html?make=${encodeURIComponent(c.make)}">${c.make}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(c.model)}</span>
    </nav>

    <div class="car-top">
      <div class="gallery" data-gallery>
        <img class="gal-reflect" src="${large(c, 0, P)}" alt="" aria-hidden="true" data-gal-reflect>
        <div class="gallery-main" data-gal-tilt>
          ${photo(large(c, 0, P), { alt: `${name}${c.colour ? ` in ${c.colour.toLowerCase()}` : ''}, photo 1 of ${n}`, eager: true, w: 1591, h: 1200, attrs: `data-gal-img style="background-image:url(${P}${c.thumbs[0]});view-transition-name:car-hero"` })}
          ${statusBadge(c, ' car-status--lg')}
          ${n > 1 ? `
          <button type="button" class="gal-arrow gal-prev" data-gal-prev aria-label="Previous photo">${ICON.arrowL}</button>
          <button type="button" class="gal-arrow gal-next" data-gal-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
          <button type="button" class="gal-video" data-video-open>${ICON.play}<span>Video</span></button>
          <button type="button" class="gal-expand" data-gal-open aria-label="Open photos full screen">${ICON.expand}<span class="tabular-nums" data-gal-count>1 / ${n}</span></button>
        </div>
        ${n > 1 ? `<div class="gallery-thumbs" style="--n:${Math.min(n, 6)}">${c.thumbs.slice(0, 6).map((src, i) =>
          `<button type="button" data-gal-thumb="${i}" aria-current="${i === 0}" aria-label="Show photo ${i + 1}"><img src="${P}${src}" width="480" height="317" alt="" loading="lazy">${i === 5 && n > 6 ? `<span class="gal-more" data-gal-open aria-label="Show all ${n} photos">+${n - 5}</span>` : ''}</button>`).join('')}</div>` : ''}
      </div>

      <aside class="summary" data-summary>
        <h1 class="summary-title">${esc(c.make)} <em>${esc(c.model)}</em></h1>
        <p class="summary-kicker tabular-nums">${esc(carLine(c))}</p>
        <div class="summary-price">
          <p class="summary-amount car-plate${c.status === 'Saturday deal' ? ' car-plate--deal' : ''} tabular-nums" data-price>${rs(c.price)}</p>
          <p class="summary-monthly tabular-nums">or about <strong>${rs(monthly(c.price))}</strong> a month on lease, 20% down over 5 years</p>
        </div>
        <dl class="gauges" aria-label="Key figures" data-dials>
          ${dial('Year', c.year, yearFrac)}
          ${c.km != null ? dial('Mileage', km(c.km), c.km / maxKm) : dial('Seats', c.seats ?? 'Ask us', (c.seats || 0) / 8)}
          ${c.engine ? dial('Engine', c.engine, (c.engineCc || 0) / maxCc) : dial('Seats', c.seats ?? 'Ask us', (c.seats || 0) / 8)}
        </dl>
        <dl class="specs" aria-label="Specifications">${c.km == null ? `<div class="spec">${ICON.gauge}<dt>Mileage</dt><dd>Mileage: ask us</dd></div>` : ''}${specs.map(([icon, k, v]) => `<div class="spec">${icon}<dt>${k}</dt><dd class="tabular-nums">${esc(v)}</dd></div>`).join('')}</dl>
        <div class="summary-actions">
          <a class="btn btn-primary btn-wide" href="#book">Book a viewing</a>
          <div class="summary-contact">
            <a class="btn btn-line" href="${DEALER.phoneHref}">${ICON.phone}Call</a>
            <a class="btn btn-line" href="https://wa.me/${DEALER.whatsapp}?text=${waText}" rel="noopener">${ICON.chat}WhatsApp</a>
          </div>
        </div>
        <div class="summary-tools">
          <button type="button" class="tool" data-save="${c.id}" aria-pressed="false">${ICON.heart}<span>Save</span></button>
          <button type="button" class="tool" data-compare="${c.id}" aria-pressed="false">${ICON.scales}<span>Compare</span></button>
          <button type="button" class="tool" data-share>${ICON.share}<span>Share</span></button>
        </div>
      </aside>
    </div>

    ${n > 1 ? `<section class="car-section walk-sec" aria-labelledby="walk-h">
      <div class="walk-head"><h2 class="car-h" id="walk-h">Walk <em>around it</em></h2><p class="car-sub">${n} photos, taken by us at the showroom. Open any one full size.</p></div>
      <ul class="walk" tabindex="0" aria-label="All photos of this car">${c.thumbs.map((src, i) => `<li><button type="button" class="walk-shot" data-walk="${i}" aria-label="Open photo ${i + 1} of ${n}"><img src="${large(c, i, P)}" width="1280" height="853" alt="" loading="lazy" style="background-image:url(${P}${src})"></button></li>`).join('')}</ul>
    </section>` : ''}

    <section class="car-section compare-sec" aria-labelledby="cmp-h">
      <h2 class="car-h" id="cmp-h">How it <em>compares</em></h2>
      <p class="car-sub">Measured against the ${CARS.length} cars on our forecourt today.</p>
      <div class="cmp-list">${compareHTML(c)}</div>
    </section>

    ${c.description || c.options ? `<section class="car-section about-sec" aria-labelledby="about-h">
      <h2 class="car-h" id="about-h">From the <em>dealer</em></h2>
      ${c.description ? `<p class="car-about">${esc(c.description)}</p>` : ''}
      <ul class="summary-points">
        <li>Checked by us: clean and road-ready</li>
        <li>Part-exchange welcome: bring your current car</li>
        <li>Leasing through ${DEALER.leasing}</li>
      </ul>
      ${c.options ? `<ul class="about-options">${c.options.split(/\n|,\s*/).map((o) => o.trim()).filter(Boolean).map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
    </section>` : ''}

    <section class="car-section car-2col fin-mini" aria-labelledby="fin-h">
      <div>
        <h2 class="car-h" id="fin-h">Your monthly <em>payment</em></h2>
        <p class="car-sub">Leasing is arranged through ${DEALER.leasing}. Worked out at an example rate of ${DEALER.financeRate}% a year; they confirm the real figure.</p>
        <a href="${P}finance.html?id=${c.id}" class="link">Open the full leasing calculator</a>
      </div>
      <div class="fin-mini-box">
        <label class="slider"><span class="slider-top"><span>Deposit</span><output class="tabular-nums" data-mini-dep-out>20%, ${rs(c.price * 0.2)}</output></span>
          <input type="range" min="10" max="60" step="5" value="20" data-mini-dep></label>
        <label class="slider"><span class="slider-top"><span>Term</span><output class="tabular-nums" data-mini-term-out>5 years</output></span>
          <input type="range" min="12" max="84" step="12" value="60" data-mini-term></label>
        <p class="fin-mini-figure tabular-nums" aria-live="polite" data-mini-out>${rs(monthly(c.price))}<span> a month</span></p>
      </div>
    </section>

    <section class="car-section book" id="book" aria-labelledby="book-h">
      <h2 class="car-h" id="book-h">Book a <em>viewing</em></h2>
      <p class="car-sub">Pick a time and send it to us on WhatsApp; we confirm the same day. Open Monday to Friday 9:00 to 17:00, Saturday 9:00 to 16:00.</p>
      <form class="book-form" data-book novalidate>
        <fieldset><legend>Choose a day</legend><div class="days" data-days></div></fieldset>
        <fieldset><legend>Choose a time</legend><div class="slots" data-slots><p class="slots-hint">Pick a day first.</p></div></fieldset>
        <div class="form-row form-row--2">
          <label class="input"><span>Your name</span><input name="name" required autocomplete="name" enterkeyhint="next"></label>
          <label class="input"><span>Mobile number</span><input name="phone" type="tel" required autocomplete="tel" inputmode="tel" enterkeyhint="send"></label>
        </div>
        ${honeypot()}
        <p class="form-error" data-error role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">${ICON.chat}Send on WhatsApp</button>
      </form>
    </section>

    <section class="car-section" aria-labelledby="sim-h">
      <h2 class="car-h" id="sim-h">Similar <em>cars</em></h2>
      <ul class="grid-cars similar">${similarCars(c, 4).map((x) => carCard(x, P)).join('')}</ul>
    </section>
  </div>

  <div class="buybar" data-buybar>
    <div class="buybar-text"><p class="buybar-name">${esc(c.make)} ${esc(c.model)}</p><p class="buybar-price tabular-nums">${rs(c.price)}</p></div>
    <a href="${DEALER.phoneHref}" class="btn btn-line buybar-icon" aria-label="Call V8 Motors">${ICON.phone}</a>
    <a href="#book" class="btn btn-primary">Book a viewing</a>
  </div>

  <dialog class="lightbox" data-lightbox aria-label="Photos of the ${esc(name)}">
    <img alt="" data-lb-img>
    <p class="lb-count tabular-nums" data-lb-count></p>
    <button type="button" class="lb-video" data-video-open>${ICON.play}<span>Video</span></button>
    <button type="button" class="lb-close" data-lb-close aria-label="Close photos">${ICON.close}</button>
    ${n > 1 ? `<button type="button" class="lb-arrow lb-prev" data-lb-prev aria-label="Previous photo">${ICON.arrowL}</button>
    <button type="button" class="lb-arrow lb-next" data-lb-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
  </dialog>
  <dialog class="video-box" data-video-box aria-label="Video of the ${esc(name)}">
    <div class="video-frame" data-video-frame style="--poster:url('${large(c, 0, P)}')"><p class="video-soon" data-video-soon>${ICON.play}<span>Video coming soon</span></p></div>
    <button type="button" class="video-swap" data-video-swap hidden>Not playing? Watch on YouTube</button>
    <button type="button" class="lb-close" data-video-close aria-label="Close the video">${ICON.close}</button>
  </dialog>`;
}

/* ------------------------------------------------------------------ home blocks */
export function arrivalsHTML(P = '') {
  return [...CARS].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 8).map((c) => carCard(c, P, { sizes: '(min-width: 1000px) 26vw, 76vw' })).join('');
}

export function bodyTilesHTML(P = '') {
  return BODY_TYPES.map((t) => {
    const list = CARS.filter((c) => c.body === t);
    if (!list.length) return '';
    return `<li><a href="${P}inventory.html?body=${t}" class="body-tile">${shapeSvg(t)}
      <span class="body-tile-name">${t}s</span>
      <span class="body-tile-meta tabular-nums">${list.length} in stock, from ${rs(Math.min(...list.map((c) => c.price)))}</span></a></li>`;
  }).join('');
}

export function makesHTML(P = '') {
  const makes = [...new Set(CARS.map((c) => c.make))].sort();
  return makes.map((m) => `<li><a href="${P}inventory.html?make=${encodeURIComponent(m)}" class="make-link"><span>${m}</span><sup class="make-n tabular-nums">${CARS.filter((c) => c.make === m).length}</sup></a></li>`).join('');
}

export function inventoryGridHTML(P = '') {
  return [...CARS].sort((a, b) => b.added.localeCompare(a.added)).map((c, i) => carCard(c, P, { eager: i < 3 })).join('');
}

/* ------------------------------------------------------------------ inventory filter options */
export function filterOptionsHTML(kind) {
  if (kind === 'body') return BODY_TYPES.filter((t) => CARS.some((c) => c.body === t)).map((t) => `<label class="body-opt"><input type="checkbox" name="body" value="${t}">
    <span>${shapeSvg(t)}<span class="body-opt-name">${t}</span><span class="body-opt-n tabular-nums" data-n-body="${t}">${CARS.filter((c) => c.body === t).length}</span></span></label>`).join('');
  if (kind === 'fuel') return ['Petrol', 'Diesel', 'Hybrid', 'Electric'].filter((f) => CARS.some((c) => c.fuel === f)).map((f) => `<label class="pill"><input type="checkbox" name="fuel" value="${f}"><span>${f} <span class="pill-n tabular-nums" data-n-fuel="${f}">${CARS.filter((c) => c.fuel === f).length}</span></span></label>`).join('');
  if (kind === 'make') return [...new Set(CARS.map((c) => c.make))].sort().map((m) => `<label class="check"><input type="checkbox" name="make" value="${m}"><span>${m}</span><span class="check-n tabular-nums" data-n-make="${m}">${CARS.filter((c) => c.make === m).length}</span></label>`).join('');
  return '';
}
