# V8 Motors

Showroom and stock website for V8 Motors, a used car dealer at 59B Royal Road, Coromandel, Mauritius.
Vite, Tailwind CSS v4, GSAP and Lenis. No framework, no 3D library: about 55 KB of JavaScript (gzipped) on most pages.

Live site: https://doorgesh3136.github.io/V8-Motors/

```
npm install
npm run dev       # http://localhost:5173
npm run sync      # pull the latest stock from the V8 Motors stock API (also runs before dev and build)
npm run build     # static site in dist/
npm run deploy    # build + publish dist/ to the gh-pages branch (GitHub Pages)
```

## Real stock

The cars come from the dealership's own stock API, the same one behind v8motors.mu/catalogue.html
(`https://v8.farhaan.info/api/cars`). `scripts/sync-inventory.mjs` runs before every dev start and build:

- fetches every car marked for sale, tidies the names (`NISSAN NP 300` becomes `Nissan NP300`, `Range Rover` becomes `Land Rover Range Rover`) and fixes vans and MPVs filed as "Other";
- saves a snapshot to `src/inventory.json` (committed, so a build still works if the API is down);
- makes small WebP thumbnails of every photo in `public/stock/` (not committed; re-created on the next sync). Full-size photos load from the dealer's photo server on each car page.

So to publish new stock: add it in the dealership's admin as usual, then run `npm run deploy`.

Only what the dealer publishes is shown. There are no invented inspection scores, warranties, horsepower or owner counts. Mileage shows where the dealer has entered it, and "Ask us" where they haven't.

## Design

Petrol blue, taken from the dealership's own logo (grey V, red 8, cyan lettering):

- **Colours:** mid petrol-blue surfaces (`#2f5a78`, panels `#386886`), never black or white; white type; soft blue-white secondary text (`#d6e6f1`).
- **Accents:** the logo's red (`#e0262f`) only for the main action and the Saturday deals band, and the logo's cyan (`#9fe3f5`) for small highlights.
- **Contrast:** body text 5.4:1, highlights 5.2:1, white on the red buttons 6.1:1.
- **Type:** one typeface, Archivo, self-hosted, using its width axis for headlines.
- **Layout:** no horizontal scrolling anywhere and no scrolling text.
- **Background:** a petrol-blue gradient with a fine carbon-fibre and grain texture (`public/bg/texture.png`, a 192 px seamless tile made by `scripts/make-texture.mjs`), soft cyan and red glows that drift slowly, and a faint beam of light that sweeps across now and then. They sit on fixed layers behind the page and only move by transform, so scrolling never repaints them. Turned off for people who ask for reduced motion.

### Mobile performance

- Smooth (Lenis) scrolling only runs with a mouse or trackpad. Phones and tablets use the browser's own touch scrolling, with nothing running on every frame.
- Every looping animation (the open-now dot, the start button's ring, the background glows) moves only by transform and opacity, so none of them repaints the page.
- The page-change curtain's layers are only promoted to the GPU while it runs.
- The intro avoids blend modes and animated blur filters, which stutter on phone GPUs.

### Home page intro

The intro opens on the car's start button in the dark. Browsers only allow sound after a tap; visitors can also enter without sound or skip. Once it starts, "Sound off" and "Skip" stay in the corner.

The sound is a real, healthy V8 (`public/intro/engine.mp3`, 10.5 s, 145 KB):

- a starter crank, then a V8 catching, idling smoothly and revving three times (CC0 recordings, credits below);
- replaces an earlier Range Rover recording whose worn engine rattled and knocked at idle;
- mixed to mono, with sub-bass rumble and harsh top end trimmed, and mastered at about the same level as before.

The picture runs on the audio clock, and the headlight bloom and camera shake follow the recording's loudness frame by frame:

| Time | What happens |
| --- | --- |
| 0.3 s | The starter cranks and the lamps flicker. |
| 0.9 s | The engine catches with a jolt, and the Range Rover's own light signature sweeps on from the grille outwards (the light shapes are cut from the photo, `public/intro/`). |
| Idle | The camera creeps in. |
| 4.7 s | First rev: the high beams flash and the camera punches in. |
| 5.9 s | Big rev: the letterbox opens, the camera pulls back and the forest lights up. |
| 6.3 s | The real V8 Motors badge comes up in the light. |
| 7.2 s | Last rev: it pulses, then flies up into the menu bar as the page appears. |

The intro plays on every fresh visit and every refresh of the home page. Arriving from another page on the site uses the curtain instead.

### Page changes

Page changes use curtains: red, petrol and blue layers sweep in from both sides, meet on the logo and the name of the page (or the car), and open on the next page. The next page is prefetched when a link is hovered or touched.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Intro, hero with quick search, newest cars, body types, part-exchange calculator (choose a car, slide to your car's value, see what's left and a monthly figure), makes, Saturday deals band |
| `inventory.html` | Every car, with filters (body, price and year ranges, fuel, gearbox, make), chips, sort, grid/list, filters kept in the URL, compare tray. Move the mouse across a card's photo to flick through all its pictures |
| `cars/<id>.html` | One real page per car (generated at build): the dealer's photos with full screen and zoom, description and specs, leasing estimate, viewing request, similar cars |
| `compare.html` | Up to three cars side by side, best value per row marked |
| `sell.html` | Sell or exchange: three steps with a live rough guide price |
| `finance.html` | Leasing calculator (leasing is through Rogers Capital), cost split, balance chart, FAQ |
| `contact.html` | Map, opening hours with a live open or closed status, all four phone numbers, message form |
| `privacy.html`, `terms.html` | Privacy policy and terms |
| `404.html` | Not-found page |

### Forms

The viewing, sell/exchange and contact forms validate on the page, then open WhatsApp (or email, on the contact page) to V8 Motors with the message already written. The visitor presses send in their own app. Nothing is stored on a server, and enquiries land straight in the dealer's WhatsApp.

## How it is built

- `src/data.js`: dealer details (address, phones, hours, leasing partner, example rate) plus the stock from `src/inventory.json`.
- `src/lib/templates.js`: HTML templates shared by the build and the browser (nav, footer, cards, car pages, meta tags, structured data).
- `vite.config.js`: a small plugin fills `<!--@...-->` placeholders, so every page ships complete HTML.
- `scripts/prerender.mjs`: writes `cars/*.html`, `public/sitemap.xml`, `public/robots.txt` and `public/llms.txt` (generated, not committed).
- `src/site.css`: the whole design system. `src/pages/*.js`: behaviour for each page.

## Still needs the dealer

- **WhatsApp number:** the forms send to 5259 0327, the first number on the dealer's site. Change `whatsapp` in `src/data.js` (and `DEALER_WA` in `src/lib/layout.js`) if WhatsApp is on another number.
- **Leasing rate:** the 7.5% in the calculators is an example only and is labelled as one. Set `financeRate` in `src/data.js` to a typical Rogers Capital rate.
- **Legal text:** `privacy.html` and `terms.html` are plain, honest starting points. Have them checked.
- **Analytics:** none installed.
- **Custom domain:** add it in the repository's Pages settings and update `SITE` in `src/lib/templates.js`.

## Credits

- **Stock photos and logo:** V8 Motors.
- **Home page photo:** Unsplash.
- **Engine sound,** built from CC0 (public domain) recordings on Freesound:
  - [S63 AMG V8 engine revs](https://freesound.org/people/marcelweiss/sounds/505321/) by marcelweiss;
  - the starter crank and start-up from [Aston Martin Rapide start](https://freesound.org/people/Paul368/sounds/320096/) by Paul368.
