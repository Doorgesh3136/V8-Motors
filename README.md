# V8 Motors

Showroom and stock website for V8 Motors, a pre-owned car dealer in Beau Bassin, Mauritius.
Vite, Tailwind CSS v4, GSAP and Lenis. No framework, no 3D library: about 55 KB of JavaScript (gzipped) on most pages.

Live site: https://doorgesh3136.github.io/V8-Motors/

```
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run deploy    # build + publish dist/ to the gh-pages branch (GitHub Pages)
```

## Design

Racing green and copper: deep forest-green backgrounds (`#08130f`) that pick up the hero photo, warm white text (`#efe9dc`), sage-grey secondary text (`#a4b4aa`) and a single copper accent (`#e8915a`) used only for the main action and live states. No horizontal scrolling anywhere and no scrolling text. One typeface, Archivo, self-hosted, using its width axis for headlines.

The home page intro opens on the car's start button in the dark (browsers only allow sound after a tap; you can also enter without sound or skip). Pressing it plays about seven seconds, one continuous shot on the real hero photo: the starter cranks while the headlights dim and brighten, the engine catches with a jolt and the Range Rover's own light signature sweeps on from the grille outwards (the light shapes are cut from the photo itself, `public/intro/`), the camera creeps in through the idle, a throttle blip flashes the high beams, then a full rev and a second flash as the camera pulls back and the forest lights up. The engine sound is synthesised live (`src/lib/engine-sound.js`) and driven by the same timeline as the picture, so the revs always match. It plays on every fresh visit and every refresh of the home page; arriving from another page on the site uses the curtain instead.

Page changes use curtains: amber, slate and ink layers sweep in from both sides, meet on the logo and the name of the page you're going to (or the car's name), and open outwards on the next page. The next page is prefetched when a link is hovered or touched, so the curtain rarely waits. Works the same in every browser.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Intro, hero with quick search, "Just arrived" row (scroll moves it sideways on desktop, swipe on phones), tap-to-explore 150-point inspection, makes, body types, monthly cost slider |
| `inventory.html` | Every car, with filters (body, price and year ranges, mileage, fuel, gearbox, make), removable filter chips, sort, grid/list, filters kept in the URL, compare tray |
| `cars/<id>.html` | One real page per car (generated at build): gallery with full screen and zoom, specs, features, inspection report, finance estimate, test-drive booking with calendar file, similar cars |
| `compare.html` | Up to three cars side by side, best value per row marked |
| `sell.html` | Three-step valuation request with a live rough guide price |
| `finance.html` | Calculator, cost split, year-by-year balance chart, FAQ |
| `contact.html` | Map, opening hours with a live open or closed status, contact form |
| `privacy.html`, `terms.html` | Privacy policy and terms of sale |
| `404.html` | Not-found page (GitHub Pages serves it for any missing URL) |

## How it is built

- `src/data.js`: the cars, dealer details, opening hours, finance rate. **Change stock and contact details here.**
- `src/lib/templates.js`: HTML templates shared by the build and the browser (nav, footer, cards, car pages, meta tags, structured data).
- `vite.config.js`: a small plugin fills `<!--@...-->` placeholders, so every page ships complete HTML (no empty shells, no content popping in).
- `scripts/prerender.mjs` (runs before `dev` and `build`): writes `cars/*.html`, `public/sitemap.xml`, `public/robots.txt` and `public/llms.txt`. These are generated, so they are not committed.
- `src/site.css`: the whole design system. `src/pages/*.js`: behaviour for each page.

## Launch checklist status

Done: unique titles and meta descriptions, canonical URLs, Open Graph and Twitter cards with a share image (`public/og.jpg`), favicon set and web manifest, AutoDealer, Car and BreadcrumbList structured data, sitemap.xml, robots.txt, llms.txt, custom 404, privacy and terms pages, alt text, breadcrumbs, internal links, no source maps in production, responsive images (`srcset`), self-hosted font with a metric-matched fallback (no layout shift), 44 px minimum tap targets, tap-to-call numbers, bottom tab bar on phones, no horizontal scrolling at 360 to 1440 px wide, portrait and landscape checked, form validation with messages under each field, honeypot and minimum-time spam checks, no cookies or trackers (a small privacy notice explains this), HTTPS enforced on GitHub Pages.

Still needs you:
- **Real details:** the phone number, WhatsApp number, email and street address in `src/data.js` are placeholders.
- **Forms:** booking, selling and contact forms validate and confirm on screen but do not send anywhere yet. Connect them to a form service (for example Formspree or Web3Forms) or your CRM. Server-side spam protection then comes from that service.
- **Legal text:** `privacy.html` and `terms.html` are sensible starting points (including the Mauritius Data Protection Act 2017), but the deposit amount, warranty cover and retention periods are assumptions. Have them checked.
- **Analytics:** none is installed. If you add one (Plausible or Google Analytics), update the privacy notice and policy, and add a consent banner if it sets cookies.
- **Custom domain:** add it in the repository's Pages settings and update `SITE` in `src/lib/templates.js`.
- **Photos:** car photos are hotlinked from Unsplash. Replace them with photos of your own stock.
