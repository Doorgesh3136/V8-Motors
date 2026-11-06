// Generates one real HTML page per car (cars/<id>.html), plus sitemap.xml, robots.txt and llms.txt.
// Runs automatically before `npm run dev` and `npm run build`.
import { mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { CARS, DEALER, rs, km, carName } from '../src/data.js';
import { SITE, headHTML, carPageHTML, carJsonLd, breadcrumbJsonLd } from '../src/lib/templates.js';

export function shell({ head, page, body, script, P = '', bodyClass = '' }) {
  return `<!doctype html>
<html lang="en-MU">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ${head}
  <link rel="preload" href="/src/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/src/fonts/bodoni-moda-latin-500-italic.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preconnect" href="https://v8.farhaan.info" />
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
    title: `${name} for sale, ${rs(c.price)} | V8 Motors Mauritius`,
    desc: `${name}, ${c.trim}, ${c.gearbox.toLowerCase()}${c.km != null ? `, ${km(c.km)}` : ''}. ${rs(c.price)} at V8 Motors, 59B Royal Road, Coromandel. Part-exchange and leasing available.`,
    path: `cars/${c.id}.html`,
    image: c.images[0],
    jsonld: [carJsonLd(c), breadcrumbJsonLd([['Home', ''], ['Catalogue', 'inventory.html'], [name, `cars/${c.id}.html`]])],
    P: '../',
  });
  writeFileSync(`${dir}/${c.id}.html`, shell({ head, page: 'inventory', body: carPageHTML(c, '../'), script: 'car', P: '../', bodyClass: 'page-car page-fit' }));
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

> Used car dealer at 59B Royal Road, Coromandel, Mauritius. Buy, sell or exchange a car; leasing through Rogers Capital. Prices are in Mauritian rupees.

- Phone: ${DEALER.phones.map(([t]) => t).join(', ')}
- WhatsApp: https://wa.me/${DEALER.whatsapp}
- Email: ${DEALER.email}
- Opening hours: Monday to Friday 9:00 to 17:00, Saturday 9:00 to 16:00, closed Sunday

## Pages

- [Catalogue](${SITE}inventory.html): every car in stock, filterable by body, price, year, fuel and gearbox
- [Sell](${SITE}sell.html): rough guide price and an offer for your car, or put it towards one of ours
- [Leasing](${SITE}finance.html): monthly payment calculator; leasing is arranged through Rogers Capital
- [Visit us](${SITE}contact.html): address, opening hours and how to reach us
- [Privacy policy](${SITE}privacy.html)
- [Terms of sale](${SITE}terms.html)

## Cars in stock

${CARS.map((c) => `- [${carName(c)}](${SITE}cars/${c.id}.html): ${rs(c.price)}, ${c.trim}, ${c.gearbox}${c.km != null ? `, ${km(c.km)}` : ''}`).join('\n')}
`);

console.log(`Prerendered ${CARS.length} car pages, sitemap (${urls.length} URLs), robots.txt, llms.txt`);
