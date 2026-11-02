// Generates one real HTML page per car (cars/<id>.html), plus sitemap.xml, robots.txt and llms.txt.
// Runs automatically before `npm run dev` and `npm run build`.
import { mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { CARS, DEALER, rs, km, carName, sized } from '../src/data.js';
import { SITE, headHTML, carPageHTML, carJsonLd, breadcrumbJsonLd } from '../src/lib/templates.js';

export function shell({ head, page, body, script, P = '', bodyClass = '' }) {
  return `<!doctype html>
<html lang="en-MU">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ${head}
  <link rel="preload" href="/src/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preconnect" href="https://images.unsplash.com" />
  <style>@view-transition { navigation: auto; }</style>
  <script type="module" src="/src/pages/${script}.js" blocking="render"></script>
</head>
<body class="${bodyClass}">
  <a href="#main" class="skip-link">Skip to content</a>
  <!--@nav:${page}-->
  <main id="main">${body}</main>
  <!--@footer-->
  <!--@tabbar:${page}-->
</body>
</html>
`;
}

// ---------------------------------------------------------------- car pages
const dir = 'cars';
if (existsSync(dir)) for (const f of readdirSync(dir)) rmSync(`${dir}/${f}`);
mkdirSync(dir, { recursive: true });

for (const c of CARS) {
  const name = carName(c);
  const head = headHTML({
    title: `${name} ${c.trim} for sale, ${rs(c.price)} | V8 Motors`,
    desc: `${name} ${c.trim} in ${c.colour.toLowerCase()}: ${km(c.km)}, ${c.engine}, ${c.gearbox.toLowerCase()}. ${rs(c.price)}, inspected with a ${c.warranty} warranty at V8 Motors, Beau Bassin.`,
    path: `cars/${c.id}.html`,
    image: sized(c.images[0], 1200),
    jsonld: [carJsonLd(c), breadcrumbJsonLd([['Home', ''], ['Inventory', 'inventory.html'], [name, `cars/${c.id}.html`]])],
    P: '../',
  });
  writeFileSync(`${dir}/${c.id}.html`, shell({ head, page: 'inventory', body: carPageHTML(c, '../'), script: 'car', P: '../', bodyClass: 'page-car' }));
}

// ---------------------------------------------------------------- sitemap / robots / llms
const today = new Date().toISOString().slice(0, 10);
const staticPages = ['', 'inventory.html', 'sell.html', 'finance.html', 'contact.html', 'compare.html', 'privacy.html', 'terms.html'];
const urls = [
  ...staticPages.map((p) => ({ loc: SITE + p, pri: p === '' ? '1.0' : p === 'inventory.html' ? '0.9' : '0.6' })),
  ...CARS.map((c) => ({ loc: `${SITE}cars/${c.id}.html`, pri: '0.8' })),
];
mkdirSync('public', { recursive: true });
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync('public/robots.txt', `User-agent: *
Allow: /

Sitemap: ${SITE}sitemap.xml
`);
writeFileSync('public/llms.txt', `# V8 Motors

> Pre-owned car dealer on Royal Road, Beau Bassin, Mauritius. Every car is inspected (150 checks) and sold with a warranty. Prices are in Mauritian rupees and include VAT.

- Phone: ${DEALER.phone}
- WhatsApp: https://wa.me/${DEALER.whatsapp}
- Email: ${DEALER.email}
- Opening hours: Monday to Friday 8:30 to 17:30, Saturday 8:30 to 15:00, closed Sunday

## Pages

- [Inventory](${SITE}inventory.html): every car in stock, filterable by make, body, price, year, mileage and fuel
- [Sell your car](${SITE}sell.html): rough valuation and a written offer within one working day
- [Finance](${SITE}finance.html): monthly payment calculator and finance questions
- [Visit us](${SITE}contact.html): address, opening hours and contact form
- [Privacy policy](${SITE}privacy.html)
- [Terms of sale](${SITE}terms.html)

## Cars in stock

${CARS.map((c) => `- [${carName(c)} ${c.trim}](${SITE}cars/${c.id}.html): ${rs(c.price)}, ${km(c.km)}, ${c.fuel}, ${c.gearbox}, ${c.status}`).join('\n')}
`);

console.log(`Prerendered ${CARS.length} car pages, sitemap (${urls.length} URLs), robots.txt, llms.txt`);
