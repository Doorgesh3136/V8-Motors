// Pure HTML templates (no DOM access). Used at build time to pre-render pages,
// and in the browser where content has to be redrawn.
import { CARS, DEALER, BODY_TYPES, rs, km, monthly, sized, carName, seeded } from '../data.js';

export const SITE = 'https://doorgesh3136.github.io/V8-Motors/';
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const carUrl = (c, P = '') => `${P}cars/${c.id}.html`;

/* ------------------------------------------------------------------ icons */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICON = {
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
};

/* ------------------------------------------------------------------ brand mark
   A V of two cylinder banks with the eight bores in them: the engine is the logo. */
export const BORES = [
  // [x, y, cylinder number]  left bank = odd, right bank = even (GM convention)
  [24.8, 32.4, 1], [20, 26, 3], [15.2, 19.6, 5], [10.4, 13.2, 7],
  [39.2, 32.4, 2], [44, 26, 4], [48.8, 19.6, 6], [53.6, 13.2, 8],
];
export function markSVG(cls = 'mark') {
  return `<svg class="${cls}" viewBox="0 0 64 48" aria-hidden="true">
    <path class="mark-bank" d="M32 42 8.6 10.8"/><path class="mark-bank" d="M32 42 55.4 10.8"/>
    ${BORES.map(([x, y, n]) => `<circle class="mark-bore" data-cyl="${n}" cx="${x}" cy="${y}" r="3.1"/>`).join('')}
    <circle class="mark-crank" cx="32" cy="42" r="4.2"/>
  </svg>`;
}

/* ------------------------------------------------------------------ body shapes */
const SHAPES = {
  Hatchback: 'M2 17V12l10-2 9-6h21l8 6 4 3v4',
  Sedan: 'M2 17v-4l9-2 9-6h19l10 6 13 1.5V17',
  SUV: 'M2 17V9.5l6-1 6-6h35l6 6 7 1V17',
  Coupe: 'M2 17v-3.5l13-3.5 11-5h12l13 6 11 2V17',
  Convertible: 'M2 17v-3.5l13-3 7-1.5 4-4 2 4h12l12 3 12 2V17',
  Pickup: 'M2 17V9.5l6-1 6-6h17v6.5h31V17',
};
export const shapeSvg = (type) => `<svg viewBox="0 0 64 24" aria-hidden="true" class="shape">
    <path d="${SHAPES[type] || SHAPES.Sedan}"/><path d="M2 17h8.5M21.5 17h21M53.5 17H62"/>
    <circle cx="16" cy="17" r="4.5"/><circle cx="48" cy="17" r="4.5"/></svg>`;

/* ------------------------------------------------------------------ images */
export function photo(url, { alt, sizes = '(min-width: 1000px) 30vw, (min-width: 640px) 45vw, 92vw', eager = false, cls = '', w = 1600, h = 1050, attrs = '' }) {
  const srcset = [480, 800, 1200, 1600].map((x) => `${sized(url, x)} ${x}w`).join(', ');
  return `<img src="${sized(url, 800)}" srcset="${srcset}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}"
    ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${cls ? `class="${cls}"` : ''} ${attrs}>`;
}

const statusClass = (s) => (s === 'Just arrived' ? ' car-status--new' : s === 'Reserved' ? ' car-status--reserved' : '');

/* ------------------------------------------------------------------ car card */
export function carCard(c, P = '', { eager = false, sizes } = {}) {
  return `<li class="car" data-id="${c.id}" data-flip-id="${c.id}">
    <a href="${carUrl(c, P)}" class="car-media" tabindex="-1" aria-hidden="true">
      ${photo(c.images[0], { alt: '', eager, sizes, attrs: 'data-car-img' })}
      <span class="car-status${statusClass(c.status)}">${c.status}</span>
      ${c.images.length > 1 ? `<span class="car-photos">${c.images.length} photos</span>` : ''}
    </a>
    <div class="car-tools">
      <button type="button" class="save" data-save="${c.id}" aria-pressed="false" aria-label="Save the ${esc(carName(c))}">${ICON.heart}</button>
      <button type="button" class="save" data-compare="${c.id}" aria-pressed="false" aria-label="Compare the ${esc(carName(c))}">${ICON.scales}</button>
    </div>
    <div class="car-info">
      <h3 class="car-title"><a href="${carUrl(c, P)}" data-car-link>${esc(carName(c))}</a></h3>
      <p class="car-price tabular-nums">${rs(c.price)}</p>
      <p class="car-trim">${esc(c.trim)}</p>
      <p class="car-monthly tabular-nums">or ${rs(monthly(c.price))}/mo</p>
      <p class="car-specs"><span class="tabular-nums">${km(c.km)}</span><span>${c.fuel}</span><span>${c.gearbox}</span></p>
    </div>
  </li>`;
}

/* ------------------------------------------------------------------ chrome */
export const NAV_PAGES = [
  { key: 'inventory', href: 'inventory.html', label: 'Inventory' },
  { key: 'sell', href: 'sell.html', label: 'Sell your car' },
  { key: 'finance', href: 'finance.html', label: 'Finance' },
  { key: 'contact', href: 'contact.html', label: 'Visit us' },
];

export function navHTML(page, P = '') {
  return `<header class="nav" data-nav>
    <a href="${P}./" class="wordmark" aria-label="V8 Motors, home">${markSVG('mark wordmark-mark')}<span>V8 Motors</span></a>
    <nav aria-label="Main" class="nav-links">
      ${NAV_PAGES.map((p) => `<a href="${P}${p.href}"${p.key === page ? ' aria-current="page"' : ''}>${p.label}</a>`).join('')}
    </nav>
    <div class="nav-actions">
      <a class="nav-phone tabular-nums" href="${DEALER.phoneHref}">${DEALER.phone}</a>
      <a href="${P}compare.html" class="icon-btn" data-compare-link aria-label="Compare cars">${ICON.scales}<span data-compare-count class="tabular-nums">0</span></a>
      <a href="${P}inventory.html?saved=1" class="icon-btn" data-saved-link aria-label="Saved cars">${ICON.heart}<span data-saved-count class="tabular-nums">0</span></a>
    </div>
  </header>`;
}

/** Bottom tab bar on phones: the main actions sit where the thumb is. */
export function mobileBarHTML(page, P = '') {
  const tab = (key, href, icon, label) => `<a href="${href}" class="tab"${key === page ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`;
  return `<nav class="tabbar" aria-label="Quick links">
    ${tab('home', `${P}./`, markSVG('mark tab-mark'), 'Home')}
    ${tab('inventory', `${P}inventory.html`, ICON.car, 'Cars')}
    ${tab('sell', `${P}sell.html`, ICON.tag, 'Sell')}
    ${tab('finance', `${P}finance.html`, ICON.coin, 'Finance')}
    <a href="${DEALER.phoneHref}" class="tab tab--call">${ICON.phone}<span>Call</span></a>
  </nav>`;
}

export function footerHTML(P = '') {
  const makes = [...new Set(CARS.map((c) => c.make))].sort();
  return `<footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="${P}./" class="wordmark wordmark--lg" aria-label="V8 Motors, home">${markSVG('mark wordmark-mark')}<span>V8 Motors</span></a>
          <p class="footer-lead">Inspected pre-owned cars with a warranty, on Royal Road in Beau Bassin.</p>
        </div>
        <nav aria-label="Footer: pages"><p class="footer-h">Pages</p>
          <a href="${P}./">Home</a>${NAV_PAGES.map((p) => `<a href="${P}${p.href}">${p.label}</a>`).join('')}<a href="${P}compare.html">Compare</a></nav>
        <nav aria-label="Footer: makes"><p class="footer-h">Makes in stock</p>
          ${makes.slice(0, 9).map((m) => `<a href="${P}inventory.html?make=${encodeURIComponent(m)}">${m}</a>`).join('')}</nav>
        <div><p class="footer-h">Showroom</p>
          <address>${DEALER.address}</address>
          <p><a href="${DEALER.phoneHref}" class="tabular-nums">${DEALER.phone}</a></p>
          <p><a href="https://wa.me/${DEALER.whatsapp}">WhatsApp</a></p>
          <p><a href="mailto:${DEALER.email}">${DEALER.email}</a></p></div>
      </div>
      <div class="footer-row">
        <p>© ${new Date().getFullYear()} V8 Motors Ltd. Prices include VAT. Finance subject to bank approval.</p>
        <p class="footer-legal"><a href="${P}privacy.html">Privacy policy</a><a href="${P}terms.html">Terms of sale</a></p>
      </div>
      <p class="footer-credits">Car photos from Unsplash.</p>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------------ head / SEO */
export function headHTML({ title, desc, path, image, jsonld = [], P = '' }) {
  const url = SITE + path;
  const img = image || `${SITE}og.jpg`;
  return `<title>${esc(title)}</title>
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
  <meta name="theme-color" content="#0c1722" />
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
    logo: `${SITE}apple-touch-icon.png`,
    image: `${SITE}og.jpg`,
    telephone: DEALER.phone.replace(/\s/g, ''),
    email: DEALER.email,
    priceRange: 'Rs 400,000 to Rs 25,000,000',
    address: { '@type': 'PostalAddress', streetAddress: 'Royal Road', addressLocality: 'Beau Bassin', addressCountry: 'MU' },
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
    name: `${carName(c)} ${c.trim}`,
    brand: { '@type': 'Brand', name: c.make },
    model: c.model,
    vehicleModelDate: String(c.year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: c.km, unitCode: 'KMT' },
    fuelType: c.fuel,
    vehicleTransmission: c.gearbox,
    bodyType: c.body,
    color: c.colour,
    vehicleEngine: { '@type': 'EngineSpecification', name: c.engine },
    numberOfPreviousOwners: c.owners,
    itemCondition: 'https://schema.org/UsedCondition',
    image: c.images.map((u) => sized(u, 1200)),
    url: `${SITE}cars/${c.id}.html`,
    offers: {
      '@type': 'Offer', price: c.price, priceCurrency: 'MUR',
      availability: c.status === 'Reserved' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: 'V8 Motors', url: SITE },
    },
  };
}

/* ------------------------------------------------------------------ car page */
export function inspection(c) {
  const CATS = ['Engine and gearbox', 'Brakes', 'Suspension and steering', 'Tyres', 'Bodywork and paint', 'Interior', 'Electrics and diagnostics', 'Road test'];
  const report = CATS.map((name, i) => ({ name, score: Math.min(100, name === 'Tyres' ? Math.round(62 + seeded(c.id, i) * 36) : Math.round(90 + seeded(c.id, i) * 10)) }));
  return { report, passed: 150 - report.filter((x) => x.score < 95).length };
}

export function similarCars(c, n = 8) {
  return CARS.filter((x) => x.id !== c.id)
    .map((x) => ({ x, s: (x.body === c.body ? 2 : 0) + (x.make === c.make ? 1 : 0) - Math.abs(Math.log(x.price / c.price)) * 2 }))
    .sort((a, b) => b.s - a.s).slice(0, n).map((o) => o.x);
}

export function honeypot() {
  return `<div class="hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`;
}

export function carPageHTML(c, P = '../') {
  const reserved = c.status === 'Reserved';
  const name = carName(c);
  const waText = encodeURIComponent(`Hi V8 Motors, I'm interested in the ${name} ${c.trim} (${rs(c.price)}). Is it available to view?`);
  const { report, passed } = inspection(c);
  const specs = [
    [ICON.gauge, 'Mileage', km(c.km)], [ICON.engine, 'Engine', c.engine], [ICON.bolt, 'Power', `${c.power} hp`],
    [ICON.gear, 'Gearbox', c.gearbox], [ICON.fuel, 'Fuel', c.fuel], [ICON.wheel, 'Drive', c.drive],
    [ICON.seat, 'Seats', c.seats], [ICON.user, 'Previous owners', c.owners], [ICON.palette, 'Colour', c.colour],
    [ICON.shield, 'Warranty', c.warranty],
  ];
  return `
  <div class="wrap car-page" data-car="${c.id}">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${P}./">Home</a><span aria-hidden="true">/</span><a href="${P}inventory.html">Inventory</a><span aria-hidden="true">/</span>
      <a href="${P}inventory.html?make=${encodeURIComponent(c.make)}">${c.make}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(c.model)}</span>
    </nav>

    <div class="car-top">
      <div class="gallery" data-gallery>
        <div class="gallery-main">
          ${photo(c.images[0], { alt: `${name} in ${c.colour.toLowerCase()}, photo 1 of ${c.images.length}`, eager: true, sizes: '(min-width: 1000px) 60vw, 100vw', attrs: `data-gal-img data-vt-hero="${c.id}"` })}
          <span class="car-status car-status--lg${statusClass(c.status)}">${c.status}</span>
          ${c.images.length > 1 ? `
          <button type="button" class="gal-arrow gal-prev" data-gal-prev aria-label="Previous photo">${ICON.arrowL}</button>
          <button type="button" class="gal-arrow gal-next" data-gal-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
          <button type="button" class="gal-expand" data-gal-open aria-label="Open photos full screen">${ICON.expand}<span class="tabular-nums" data-gal-count>1 / ${c.images.length}</span></button>
        </div>
        ${c.images.length > 1 ? `<div class="gallery-thumbs">${c.images.map((src, i) =>
          `<button type="button" data-gal-thumb="${i}" aria-current="${i === 0}" aria-label="Show photo ${i + 1}"><img src="${sized(src, 320)}" width="320" height="200" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      </div>

      <aside class="summary" data-summary>
        <p class="summary-kicker tabular-nums">${c.year}, ${km(c.km)}, ${c.fuel}</p>
        <h1 class="summary-title">${esc(c.make)} ${esc(c.model)}</h1>
        <p class="summary-trim">${esc(c.trim)}</p>
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
            ? `<a class="btn btn-primary btn-wide" href="https://wa.me/${DEALER.whatsapp}?text=${encodeURIComponent(`Hi, please add me to the waiting list for the ${name}.`)}" rel="noopener">Join the waiting list</a>`
            : `<a class="btn btn-primary btn-wide" href="#book">Book a test drive</a>`}
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

    <section class="car-section" aria-labelledby="specs-h">
      <h2 class="car-h" id="specs-h">The details</h2>
      <dl class="specs">${specs.map(([icon, k, v]) => `<div class="spec">${icon}<dt>${k}</dt><dd class="tabular-nums">${esc(v)}</dd></div>`).join('')}</dl>
    </section>

    <section class="car-section car-2col" aria-labelledby="feat-h">
      <div>
        <h2 class="car-h" id="feat-h">What it comes with</h2>
        <p class="car-sub">${c.features.length} features, each checked working at inspection.</p>
      </div>
      <ul class="features">${c.features.map((f) => `<li>${f}</li>`).join('')}</ul>
    </section>

    <section class="car-section car-2col report" aria-labelledby="rep-h">
      <div>
        <h2 class="car-h" id="rep-h">Inspection report</h2>
        <p class="car-sub">Our workshop checked 150 points before listing this car. This is the summary by area; the full report comes with the car.</p>
        <p class="report-big tabular-nums"><span data-count-to="${passed}">${passed}</span><span class="report-of">/150</span></p>
      </div>
      <ul class="report-bars">
        ${report.map((r) => `<li><span class="report-name">${r.name}</span><span class="report-score tabular-nums">${r.name === 'Tyres' ? `${r.score}% tread` : r.score >= 95 ? 'Passed' : 'Advisory'}</span>
          <span class="report-track"><span class="report-fill${r.score < 95 && r.name !== 'Tyres' ? ' is-advisory' : ''}" style="--v:${r.score / 100}"></span></span></li>`).join('')}
      </ul>
    </section>

    <section class="car-section car-2col fin-mini" aria-labelledby="fin-h">
      <div>
        <h2 class="car-h" id="fin-h">Your monthly payment</h2>
        <p class="car-sub">At ${DEALER.financeRate}% a year. An estimate only; the bank confirms the final rate.</p>
        <a href="${P}finance.html?id=${c.id}" class="link">Open the full finance calculator</a>
      </div>
      <div class="fin-mini-box">
        <label class="slider"><span class="slider-top"><span>Deposit</span><output class="tabular-nums" data-mini-dep-out>20%, ${rs(c.price * 0.2)}</output></span>
          <input type="range" min="10" max="60" step="5" value="20" data-mini-dep></label>
        <label class="slider"><span class="slider-top"><span>Term</span><output class="tabular-nums" data-mini-term-out>5 years</output></span>
          <input type="range" min="12" max="84" step="12" value="60" data-mini-term></label>
        <p class="fin-mini-figure tabular-nums" aria-live="polite" data-mini-out>${rs(monthly(c.price))}<span> a month</span></p>
      </div>
    </section>

    ${reserved ? '' : `
    <section class="car-section book" id="book" aria-labelledby="book-h">
      <h2 class="car-h" id="book-h">Book a test drive</h2>
      <form class="book-form" data-book novalidate>
        <fieldset><legend>Choose a day</legend><div class="days" data-days></div></fieldset>
        <fieldset><legend>Choose a time</legend><div class="slots" data-slots><p class="slots-hint">Pick a day first.</p></div></fieldset>
        <div class="form-row form-row--2">
          <label class="input"><span>Your name</span><input name="name" required autocomplete="name" enterkeyhint="next"></label>
          <label class="input"><span>Mobile number</span><input name="phone" type="tel" required autocomplete="tel" inputmode="tel" enterkeyhint="send"></label>
        </div>
        ${honeypot()}
        <p class="form-error" data-error role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">Request test drive</button>
      </form>
    </section>`}

    <section class="car-section" aria-labelledby="sim-h">
      <div class="section-head">
        <h2 class="car-h" id="sim-h">Similar cars</h2>
        <div class="rail-arrows"><button type="button" data-rail="-1" aria-label="Scroll back">${ICON.arrowL}</button><button type="button" data-rail="1" aria-label="Scroll forward">${ICON.arrowR}</button></div>
      </div>
      <ul class="similar">${similarCars(c).map((x) => carCard(x, P, { sizes: '(min-width: 1000px) 22rem, 78vw' })).join('')}</ul>
    </section>
  </div>

  <div class="buybar" data-buybar>
    <div class="buybar-text"><p class="buybar-name">${esc(c.make)} ${esc(c.model)}</p><p class="buybar-price tabular-nums">${rs(c.price)}</p></div>
    <a href="${DEALER.phoneHref}" class="btn btn-line buybar-icon" aria-label="Call V8 Motors">${ICON.phone}</a>
    ${reserved ? '<span class="car-status car-status--reserved">Reserved</span>' : '<a href="#book" class="btn btn-primary">Test drive</a>'}
  </div>

  <dialog class="lightbox" data-lightbox aria-label="Photos of the ${esc(name)}">
    <img alt="" data-lb-img>
    <p class="lb-count tabular-nums" data-lb-count></p>
    <button type="button" class="lb-close" data-lb-close aria-label="Close photos">${ICON.close}</button>
    ${c.images.length > 1 ? `<button type="button" class="lb-arrow lb-prev" data-lb-prev aria-label="Previous photo">${ICON.arrowL}</button>
    <button type="button" class="lb-arrow lb-next" data-lb-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
  </dialog>`;
}

/* ------------------------------------------------------------------ home blocks */
export function arrivalsHTML(P = '') {
  const newest = [...CARS].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 8);
  return newest.map((c) => carCard(c, P, { sizes: '(min-width: 900px) 24rem, 78vw' })).join('') +
    `<li class="arrivals-end"><a href="${P}inventory.html" class="arrivals-end-link"><span>See all ${CARS.length} cars</span><span class="arrivals-end-arrow" aria-hidden="true"></span></a></li>`;
}

export function bodyTilesHTML(P = '') {
  return BODY_TYPES.map((t) => {
    const list = CARS.filter((c) => c.body === t);
    if (!list.length) return '';
    return `<li><a href="${P}inventory.html?body=${t}" class="body-tile">${shapeSvg(t)}
      <span class="body-tile-name">${t === 'SUV' ? 'SUVs' : t + 's'}</span>
      <span class="body-tile-meta tabular-nums">${list.length} in stock, from ${rs(Math.min(...list.map((c) => c.price)))}</span></a></li>`;
  }).join('');
}

export function makesHTML(P = '') {
  const makes = [...new Set(CARS.map((c) => c.make))].sort();
  const items = (hidden) => makes.map((m) => `<a href="${P}inventory.html?make=${encodeURIComponent(m)}" class="marquee-item"${hidden ? ' tabindex="-1"' : ''}>${m}<sup class="tabular-nums">${CARS.filter((c) => c.make === m).length}</sup></a>`).join('');
  return `<div class="marquee-set">${items(false)}</div><div class="marquee-set" aria-hidden="true">${items(true)}</div>`;
}

export function inventoryGridHTML(P = '') {
  return [...CARS].sort((a, b) => b.added.localeCompare(a.added)).map((c, i) => carCard(c, P, { eager: i < 3 })).join('');
}

/* ------------------------------------------------------------------ inventory filter options */
export function filterOptionsHTML(kind) {
  if (kind === 'body') return BODY_TYPES.filter((t) => CARS.some((c) => c.body === t)).map((t) => `<label class="body-opt"><input type="checkbox" name="body" value="${t}">
    <span>${shapeSvg(t)}<span class="body-opt-name">${t}</span><span class="body-opt-n tabular-nums" data-n-body="${t}">${CARS.filter((c) => c.body === t).length}</span></span></label>`).join('');
  if (kind === 'fuel') return ['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((f) => `<label class="pill"><input type="checkbox" name="fuel" value="${f}"><span>${f} <span class="pill-n tabular-nums" data-n-fuel="${f}">${CARS.filter((c) => c.fuel === f).length}</span></span></label>`).join('');
  if (kind === 'make') return [...new Set(CARS.map((c) => c.make))].sort().map((m) => `<label class="check"><input type="checkbox" name="make" value="${m}"><span>${m}</span><span class="check-n tabular-nums" data-n-make="${m}">${CARS.filter((c) => c.make === m).length}</span></label>`).join('');
  return '';
}
