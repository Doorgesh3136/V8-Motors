# V8 Motors

Showroom and stock website for V8 Motors, a used car dealer at 59B Royal Road, Coromandel, Mauritius.
Vite, Tailwind CSS v4, GSAP and Lenis. No framework, no 3D library: about 60 KB of JavaScript (gzipped) shared by every page.

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

Only what the dealer publishes is shown. There are no invented inspection scores, warranties, horsepower, owner counts or reviews. Mileage shows where the dealer has entered it, and "Ask us" where they haven't.

## Design

Petrol blue, taken from the dealership's own logo (grey V, red 8, cyan lettering):

- **Colours:** petrol-blue surfaces (`#2f5a78`, panels a soft gradient from `#4478a0` to `#366583`), never black or white; white type; soft blue-white secondary text (`#d6e6f1`).
- **Accents:** the logo's red (`#e0262f`) only for the main action and the Saturday deals band, and the logo's cyan (`#9fe3f5`) for small highlights.
- **Type:** Archivo (self-hosted, variable width and weight) for everything, sentence-case headlines, and one accent word per headline in Bodoni Moda italic (self-hosted, 17 KB): "Drive *smarter.*", "Just *in*", "Come and *drive* one." Nothing on the site is smaller than 12 px.
- **Surfaces:** every panel shares one look: a petrol gradient with a faint top light, a hairline edge and a soft drop. Form fields are darker inset wells that read clearly on any panel.
- **Background:** a petrol-blue gradient that flows on its own (`src/lib/bg.js`, a tiny WebGL shader) under a fine carbon-fibre texture (`public/bg/texture.png`): headlight and tail-light trails stream across like a long exposure of a road at night, soft lights drift upwards, and every few seconds a sweep of light glides across. Drawn at a fifth of the screen's resolution, 30 fps on phones, paused while hidden or under the intro, faded in once the page has loaded. Nothing in it reacts to touch.
- **Layout:** no horizontal scrolling and no text overflow at any size from 320 to 1920 px, portrait or landscape; every tap target is at least 44 px.

### Car cards

Every car card (inventory, home page, similar cars) is one contained card with the same order: photo; year, body and colour; make and model; spec pills for engine and fuel, gearbox, and mileage where the dealer has entered it; then the price, the monthly figure and a go button. The whole card is one link; save and compare sit on the photo. Photos fade in once they've arrived, with a soft light sweep over the empty frame until then. On phones, swipe sideways across a card's photo to flick through all its pictures (with a mouse, move across it).

### Navigation

- **Phones:** a dock at the bottom (Home, Cars, Sell, Call, Menu), within reach of the thumb. A pill sits behind the current place and glides to the next one when you change page. Menu opens a bottom sheet (never a full-screen popup) with every page, the live open/closed status and one-tap Call, WhatsApp, Email and Directions. Drag it down, tap outside or press Escape to close.
- **Wide screens:** one underline glides under whichever menu link you point at, and back to the current page.
- **Page changes:** the curtain, in every browser: red, petrol and blue layers sweep in from both sides, meet on the logo and the name of the page (or the car), and open on the next page. The dock pill glides to the tapped tab as it closes. The next page is prefetched when a link is touched or hovered.
- **Chapters:** the home page is told in numbered chapters (02 New arrivals, 03 Quick pick, 04 Shapes, 05 Part-exchange, 06 Makes, 07 Saturday deals). On phones the menu bar shows the chapter you're in, in place of the wordmark; on wide screens a slim rail of marks sits in the left margin, and a mark jumps to its chapter.
- **Footer:** every page closes on "Come and *drive* one.", with Call, WhatsApp and Directions and the live opening status.

### Home page intro

The intro opens on the car's start button in the dark. While the scene loads, the button's outer ring fills with real progress (the photo, the light shapes, the fonts and the engine recording, which is streamed so its bytes can be counted), the percentage counts up beside it, and a few small line icons (a key, a steering wheel, a gauge, a wheel) drift in the dark. When everything has arrived the ring closes with a flash and the hint becomes "Sound on. Press to start." The button works before that too, and visitors can always enter without sound or skip. Once it starts, "Sound off" and "Skip" stay in the corner.

The car is a white Range Rover (Unsplash, photo by Cartist Sarvam), front-on with its LED lights on. Its light signature (the L-shaped daytime light on each headlamp and the strips low on the bumper) is drawn crisply at full resolution by `scripts/make-intro-lights.mjs` from positions measured on the photo, into `public/intro/lights.webp` and a soft bloom in `public/intro/glow.webp`; both share the photo's aspect ratio, so the page lays them exactly over it. On portrait phones the photo sits as a wide band at the top so the whole car (and both headlamps) stays in frame.

The sound is a real V8 recording (`public/intro/engine.mp3`, 10.5 s): a starter crank, then the engine catching, idling and revving three times (CC0 recordings, credits below). The picture runs on the audio clock, and the headlight bloom and camera shake follow the recording's loudness frame by frame:

| Time | What happens |
| --- | --- |
| 0.3 s | The starter cranks and the lamps flicker. |
| 0.9 s | The engine catches with a jolt, and the Range Rover's light signature sweeps on from the grille outwards. |
| Idle | The camera creeps in. |
| 4.7 s | First rev: the high beams flash and the camera punches in. |
| 5.9 s | Big rev: the letterbox opens, the camera pulls back and the driveway lights up. |
| 6.3 s | The real V8 Motors badge comes up in the light. |
| 7.2 s | Last rev: it pulses, then flies up into the menu bar as the page appears. |

Once the home page is showing (after the intro, or on arriving from another page), the Range Rover flashes its high beams at you twice. The intro plays on every fresh visit and every refresh of the home page; arriving from another page on the site uses the page transition instead. If the page script can't load (offline, blocked), a small safety net in the page head clears the intro after nine seconds so the page is never stuck behind it.

### Home page

- **Hero:** "Drive *smarter.*", where the accent word rolls over every few seconds like an odometer drum (smarter, in style, away today, home happy), with what we do in one plain sentence and one primary action: the quick search.
- **Quick pick:** a deck of every car in stock, one at a time. Swipe right to save, left to skip (or use the buttons or arrow keys); tapping a card opens the car. Saved cars go to the same list as the hearts. Shuffled once a day.
- **Shapes:** body-type tiles whose little cars drive in, wheels turning, as they scroll into view (and spin under the mouse).
- **Saturday deals:** a live countdown to the next Saturday opening, or to closing time while the deals are on (Mauritius time).
- Part-exchange calculator, makes, and the live open/closed status.

### Mobile performance

- Smooth (Lenis) scrolling only runs with a mouse or trackpad; phones use their own touch scrolling.
- Every looping animation moves only by transform and opacity, so none of them repaints the page; nothing animates off screen (the rotating word, countdown and background pause when they can't be seen).
- Text pages don't download the stock list: the dealer's details live in their own small module (`src/dealer.js`).
- Fonts are self-hosted and preloaded with metric-matched fallbacks; images carry their sizes and load lazily. Measured layout shift while loading is zero on every page tested.
- With reduced motion turned on there is no intro, no drifting or rolling, and nothing waits to be revealed.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Intro, hero with quick search, newest cars, Quick pick deck, body types, part-exchange calculator, makes, Saturday deals with countdown |
| `inventory.html` | Every car, with filters (body, price and year ranges, fuel, gearbox, make) in a bottom sheet on phones, chips, sort, grid/list, filters kept in the URL, compare tray |
| `cars/<id>.html` | One real page per car (generated at build): the dealer's photos with full screen and zoom, key specs, the dealer's description, leasing estimate, viewing request, similar cars |
| `compare.html` | Up to three cars side by side, best value per row marked |
| `sell.html` | Sell or exchange: three steps with a live rough guide price |
| `finance.html` | Leasing calculator (leasing is through Rogers Capital), cost split, balance chart, FAQ |
| `contact.html` | Map, opening hours with a live open or closed status, all four phone numbers, message form |
| `privacy.html`, `terms.html` | Privacy policy and terms |
| `404.html` | Not-found page |

### Forms

The viewing, sell/exchange and contact forms validate on the page, then open WhatsApp (or email, on the contact page) to V8 Motors with the message already written. The visitor presses send in their own app. Nothing is stored on a server, and enquiries land straight in the dealer's WhatsApp. Phone fields use `type="tel"` with autofill, so phones show the number pad and offer the visitor's own number.

## How it is built

- `src/dealer.js`: dealer details (address, phones, hours, leasing partner, example rate). `src/data.js`: the stock from `src/inventory.json`, plus helpers.
- `src/lib/templates.js`: HTML templates shared by the build and the browser (nav, dock, menu sheet, footer, cards, car pages, meta tags, structured data).
- `src/lib/layout.js`: what every page shares (transitions, nav underline, dock, menu sheet, scrolling, toasts, forms). `src/lib/bg.js`: the background. `src/lib/fx.js`: reveals, count-ups, the rev bar, photo swipes. `src/lib/deck.js`: Quick pick. `src/lib/chapters.js`: the chapter indicator. `src/lib/hours.js`: opening hours and the Saturday countdown.
- `vite.config.js`: a small plugin fills `<!--@...-->` placeholders, so every page ships complete HTML.
- `scripts/prerender.mjs`: writes `cars/*.html`, `public/sitemap.xml`, `public/robots.txt` and `public/llms.txt` (generated, not committed).
- `scripts/make-intro-lights.mjs`: draws the intro's light signature for the home page photo.
- `src/site.css`: the whole design system. `src/pages/*.js`: behaviour for each page.

## Still needs the dealer

- **WhatsApp number:** the forms send to 5259 0327, the first number on the dealer's site. Change `whatsapp` in `src/dealer.js` (and `DEALER_WA` in `src/lib/layout.js`) if WhatsApp is on another number.
- **Leasing rate:** the 7.5% in the calculators is an example only and is labelled as one. Set `financeRate` in `src/dealer.js` to a typical Rogers Capital rate.
- **Body types:** a few cars are filed under an unexpected body type in the dealer's admin (the Kia Sportage as a hatchback, for example); the site shows what the admin says.
- **Legal text:** `privacy.html` and `terms.html` are plain, honest starting points. Have them checked.
- **Analytics:** none installed.
- **Custom domain:** add it in the repository's Pages settings and update `SITE` in `src/lib/templates.js`.

## Credits

- **Stock photos and logo:** V8 Motors.
- **Home page photo:** a white Range Rover by [Cartist Sarvam on Unsplash](https://unsplash.com/photos/white-range-rover-parked-on-a-paved-driveway-wrRhFFTySnc).
- **Fonts:** Archivo and Bodoni Moda, both under the SIL Open Font License.
- **Engine sound,** built from CC0 (public domain) recordings on Freesound:
  - [S63 AMG V8 engine revs](https://freesound.org/people/marcelweiss/sounds/505321/) by marcelweiss;
  - the starter crank and start-up from [Aston Martin Rapide start](https://freesound.org/people/Paul368/sounds/320096/) by Paul368.
