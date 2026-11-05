# V8 Motors

Showroom and stock website for V8 Motors, a used car dealer at 59B Royal Road, Coromandel, Mauritius.
Vite, Tailwind CSS v4, GSAP and Lenis, no framework: about 60 KB of JavaScript (gzipped) shared by every page. The home page also loads three.js and the 3D Range Rover, on their own, so no other page pays for them.

**The idea:** the whole site is one drive. It starts in the dark with the white Range Rover's start button, you drive through its headlights as you scroll, the night slowly lifts on the way down, and every page ends at sunrise behind Le Pouce and Pieter Both. Three things belong to this site and no other: the **budget dial**, the **forecourt** and the **garage**.

Live site: https://webluxe.github.io/V8-Motors/

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

Graphite and ivory, with the red of the dealership's logo as the only strong colour, so the cars are the colourful thing on every page. `src/site.css` is the base; `src/flagship.css`, loaded after it, is the current design layer and the first place to look.

- **Colours:** graphite surfaces (`#1b1c1e`, `#141517`), ivory type (`#f6f2ea`, the Range Rover's paint), the logo's red (`#e0262f`) kept for the one main action on a screen and the Saturday band, and a warm dawn only at the very end.
- **Type:** Archivo (self-hosted, variable width and weight), wide and tight for headlines, with one accent word per headline in Bodoni Moda italic: "Drive *smarter.*" Nothing on the site is smaller than 12 px.
- **Rhythm:** one vertical gap between chapters on every page (`--sec`), one gap from heading to content (`--head-gap`), one spacing scale for everything else.
- **Numbers:** digits sit on drums and roll like an odometer (`src/lib/odo.js`): the dial, the car counts, the Saturday countdown, the monthly figures.
- **Background:** carbon fibre under moving light (`src/lib/bg.js`, a small WebGL shader). The twill weave is lit the way real carbon is: each tow only flashes when a light lines up across its fibres, so a passing lamp throws a shifting cross of light. A warm lamp and a red tail-lamp glow wander over it, a cold sweep crosses every few seconds, faint light trails stream past, and a soft light follows the mouse. The weave moves with the page at a slower speed, in whole pixels so it never shimmers, and a warm dawn comes up towards the bottom of a page. It pauses while the 3D hero covers the screen or the tab is hidden, and with reduced motion or no WebGL a still of dark paint (`public/bg/panel.webp`) stays underneath.
- **The footer:** the sky is part of the page, so the horizon always sits behind the ridges. The ridgelines are generated with fractal noise on a hand-set profile, with Le Pouce and Pieter Both's summit boulder set by hand; the sun rises behind the boulder as you arrive.
- **Layout:** no horizontal scrolling and no text overflow at any size from 320 to 1920 px, portrait or landscape; every tap target is at least 44 px.

### The budget dial (home page)

A rev counter you turn with your thumb (`src/lib/dial.js`). Set what you can spend a month and every car that fits parks underneath, with links to walk those cars or see the full list. A sideways start turns the dial; a finger going up or down scrolls the page instead, so it never traps anyone. The first time it comes into view the needle does a dashboard's self-test. It also works by tapping the scale, with the - and + buttons, and from the keyboard (there's a real range input over it). Monthly figures use the example terms in `src/dealer.js` and say so on screen.

The speaker button revs the real V8 recording with the needle (`src/lib/revs.js`). It's off unless you ask for it, or pressed Start with the sound on in the intro.

### The forecourt (`forecourt.html`)

Every car as its own short film (`src/pages/forecourt.js`). The dealer's photos become a slow camera move: on a tall phone a wide photo pans across the car, with story ticks along the top. Swipe up for the next car, tap the sides for the next or previous photo, hold to pause, double-tap to park the car in your garage. Park, Compare, Share and WhatsApp sit under the thumb. Only the car on screen and its neighbours have photos loaded, and only the car on screen moves. The order is shuffled once a day; the list can be narrowed with `?max=`, `?body=`, `?make=` or `?saved=1`, and `?car=` opens on one car, so a copied link lands on it.

### The garage (`inventory.html?saved=1`)

Hearts park a car in your garage, on this device. The garage page sends the whole list to the dealer's WhatsApp in one tap, already written.

### Car cards

Every car card (inventory, home page, similar cars) is a slab of brushed gunmetal rendered in Blender (`public/bg/brushed.webp`), with visible thickness and a photo recessed behind glass. It tilts as it passes through the screen, using a CSS scroll timeline where the browser has one, so the depth shows without pointing at anything. The price sits on a number plate bolted over the bottom edge of the photo, like the plate on the hero car, so it is the first thing you read; a Saturday deal's plate is red. Below it are the make and model and three plain lines: "2019 silver hatchback", "1.2 L petrol, manual" (with the mileage where the dealer has entered it) and the monthly figure. The photo is larger than its window and slides behind it as the card passes, and the plate moves the other way, so the card has real parallax (also sideways along the home page rail). With a mouse the card tilts towards the pointer and its layers move apart, photo back, plate and name forward, and a soft light follows; on touch screens and with reduced motion it just sits. The whole card is one link; the heart sits on the photo and compare beside the last lines. On phones the inventory is two across, or a row per car in list view. On phones, swipe sideways across a card's photo to flick through all its pictures (with a mouse, move across it).

### Page banners

Every inner page opens in the showroom. `public/hero/page-*.webp` are shot from the same 3D scene as the home page, so they stay in step with the car and the hall; a car page takes its ambient light from that car's own photo. Panels and forms share the cards' brushed gunmetal, through `--surface` in `src/flagship.css`.

### Car pages

What a buyer wants comes first, beside the photos: the name, the price on its plate, the monthly figure, then every spec on raised tiles, then Book a viewing, Call and WhatsApp. The dealer's description, the payment calculator and the booking form follow.

The dealer's photo server takes about two seconds per photo, so the gallery never waits on it. `scripts/sync-inventory.mjs` keeps a 1280 px copy of every photo with the site. A car page fetches them all once it has settled, and a switch shows the thumbnail instantly if the big copy hasn't arrived yet. Full screen shows our copy at once and swaps in the dealer's full-size original when it arrives.

### Navigation

- **Phones:** a floating dock at the bottom (Home, Cars, Forecourt, Call, Menu), within reach of the thumb. A pill sits behind the current place and glides to the next one when you change page. Menu opens a bottom sheet (never a full-screen popup) with every page, the live open/closed status and one-tap Call, WhatsApp, Email and Directions. Drag it down, tap outside or press Escape to close.
- **Wide screens:** one underline glides under whichever menu link you point at, and back to the current page.
- **Page changes:** the curtain, in every browser: red, petrol and blue layers sweep in from both sides, meet on the logo and the name of the page (or the car), and open on the next page. The dock pill glides to the tapped tab as it closes. The next page is prefetched when a link is touched or hovered.
- **Chapters:** the home page is told in numbered chapters (02 New arrivals, 03 Budget dial, 04 Quick pick, 05 Shapes, 06 Part-exchange, 07 Makes, 08 Saturday deals). On phones the menu bar shows the chapter you're in, in place of the wordmark; on wide screens a slim rail of marks sits in the left margin, and a mark jumps to its chapter.
- **Footer:** every page closes on "Come and *drive* one.", with Call, WhatsApp and Directions and the live opening status.

### Home page intro

The intro opens on the car's start button in the dark. While the scene loads, the button's outer ring fills with real progress (the photo, the light shapes, the fonts and the engine recording, which is streamed so its bytes can be counted), the percentage counts up beside it, and a few small line icons (a key, a steering wheel, a gauge, a wheel) drift in the dark. When everything has arrived the ring closes with a flash and the hint becomes "Sound on. Press to start." The button works before that too, and visitors can always enter without sound or skip. Once it starts, "Sound off" and "Skip" stay in the corner.

The car is a white Range Rover, live in 3D (`src/lib/rover3d.js`, `public/model/range-rover.glb`): about 5 MB, one mesh per material for the body plus four separate wheels. The windows are opaque privacy glass, so the cabin was removed from the model altogether. The page never talks to three.js directly. It animates one object of plain numbers (`src/lib/rover-shots.js` explains each one) with GSAP on the recording's clock, and every frame `rover3d.js` draws whatever they say, so the picture follows the audio exactly and scrolling can drive the same scene.

The car sits in a night hall rendered in Blender (`public/hero/hall.webp`, one equirectangular image): ribbed concrete, LED strips, a red line along the walls and the sunrise over Le Pouce through the open far end. That one image is the backdrop, and also what the paint and the wet concrete floor reflect (`public/hero/floor.webp` packs the floor's surface normal and roughness into one texture).

The headlamps are the real parts of the model: the running-light blades and LED pods are emissive and wake from the middle of the car outwards, and the beams, floor pools and lens glow are positioned from the pods' actual geometry at load. Anything small and bright, like the hall's light strips, is real geometry rather than part of the hall image, so it gets proper edge smoothing; the picture is tone-mapped before it is antialiased, and the glow is a separate blurred pass added on top, so fine bright detail doesn't crawl or sparkle in motion. A dark inner shell sits 3 cm inside the bodywork, measured from the model in Blender, so there is always something behind a panel gap; it stops short of both bumpers, whose faces can't be measured that way. Many of the model's panels are wound backwards, so the paint shader always uses the normal each panel was modelled with, never the side the browser thinks is facing. The wide chrome strips in the door shuts take the body's colour. The V8 MOTORS signs on the wall are real channel letters (`public/model/sign.glb`) in Archivo, and the car stands on a ring inlaid in the floor that fades out when it pulls away. Nothing in the film strobes, and nothing moves per frame at random: wheel speed is capped so spokes never flicker, and the camera follows a smooth curve with no cuts. Everything expensive is faked so it runs on a phone: the reflection of the car is the car drawn again upside down under a floor that is see-through where it is wet, the pools of light are painted by the floor's shader, and the beams are additive cones. Modest devices drop the glow, the reflection, dust and smoke and run at 30 fps, and any device that can't keep up lowers its resolution once.

With reduced motion or data saver, three.js is never fetched and `public/hero/range-rover.webp` (a still of the same model) stays on screen. The same still takes over if WebGL is missing or the model fails to load.

The sound is a real V8 recording (`public/intro/engine.mp3`, 10.5 s): a starter crank, then the engine catching, idling and revving three times (CC0 recordings, credits below). The picture runs on the audio clock, and the headlight bloom and camera shake follow the recording's loudness frame by frame:

| Time | What happens |
| --- | --- |
| 0.3 s | Black, a headlamp filling the screen, its first LEDs slowly waking with the starter. |
| 0.9 s | The engine catches: the pods light one by one from the inside out, the body kicks on its springs, and the camera lifts off the lamp in one unbroken flight around the car, along the flank, round the tail lights as they fire, over the roof and across the bow and lettering, back out to the far end of the hall. |
| 4.7 s | First rev: one flash of the high beams, and the camera pushes in. |
| 5.9 s | Big rev: the hall's lights run towards you, and the car launches, squatting, tyres smoking. |
| 6.3 s | The real V8 Motors badge comes up in the light. |
| 7.05 s | It brakes right in front of you, nose down, and the camera swings out to the hero. |
| 7.2 s | Last rev: the badge pulses, then flies up into the menu bar as the page appears. |

Once the home page is showing (after the intro, or on arriving from another page), the Range Rover gives you a soft flash of its high beams. Drag sideways to turn the car, with a little momentum (it turns itself back the short way as soon as you scroll); a finger moving up or down still scrolls the page. With a mouse, the front wheels steer towards the pointer. A tap flashes the lights again. The intro plays on every fresh visit and every refresh of the home page; arriving from another page on the site uses the page transition instead. If the page script can't load (offline, blocked), a small safety net in the page head clears the intro after nine seconds so the page is never stuck behind it.

### Home page

- **Hero:** "Drive *smarter.*", where the accent word rolls over every few seconds like an odometer drum, one plain sentence, one primary action, and a readout of real numbers (cars in stock, the lowest price, open or closed right now).
- **The drive:** the hero stays on screen for a long stretch of scrolling, one unbroken shot with your thumb on the throttle. With a mouse or trackpad it runs in stops: one flick of the wheel plays the next part and the page holds until it lands. The car pulls off, the camera slides round to its side, it runs flat out along the hall with the wheels turning at the right speed for the road, the camera comes round the bonnet to dead ahead, and the camera keeps easing in while the showroom dissolves into the page and "Just in" fades up through it, with no cut and no flash. Short landscape screens and reduced motion skip it.
- **Just in:** the newest cars on a rail you swipe.
- **Budget dial:** above.
- **Quick pick:** a deck of every car in stock, one at a time. Swipe right to park it in your garage, left to skip (or use the buttons or arrow keys); tapping a card opens the car. Shuffled once a day.
- **Shapes:** body-type tiles whose little cars drive in, wheels turning, as they scroll into view.
- **Part-exchange calculator, makes** (a large type index), and **Saturday deals** with a live countdown on mechanical drums (Mauritius time).

### Mobile performance

- Smooth (Lenis) scrolling only runs with a mouse or trackpad; phones use their own touch scrolling.
- Every looping animation moves only by transform and opacity, so none of them repaints the page; nothing animates off screen (the rotating word, countdown and background pause when they can't be seen).
- Text pages don't download the stock list: the dealer's details live in their own small module (`src/dealer.js`).
- Fonts are self-hosted and preloaded with metric-matched fallbacks; images carry their sizes and load lazily. Measured layout shift while loading is zero on every page tested.
- With reduced motion turned on there is no intro, no drifting or rolling, and nothing waits to be revealed.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Intro, hero, newest cars, budget dial, Quick pick deck, body types, part-exchange calculator, makes, Saturday deals with countdown |
| `forecourt.html` | Every car, full screen, as a short film: swipe, tap, double-tap to park |
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
- `src/lib/layout.js`: what every page shares (transitions, nav underline, dock, menu sheet, scrolling, toasts, forms). `src/lib/bg.js`: the background. `src/lib/fx.js`: reveals, count-ups, the rev bar, photo swipes. `src/lib/deck.js`: Quick pick. `src/lib/dial.js`: the budget dial. `src/lib/revs.js`: its engine sound. `src/lib/odo.js`: the odometer numbers. `src/lib/chapters.js`: the chapter indicator. `src/lib/hours.js`: opening hours and the Saturday countdown.
- `vite.config.js`: a small plugin fills `<!--@...-->` placeholders, so every page ships complete HTML.
- `scripts/prerender.mjs`: writes `cars/*.html`, `public/sitemap.xml`, `public/robots.txt` and `public/llms.txt` (generated, not committed).
- `scripts/make-intro-lights.mjs`: draws the intro's light signature for the home page photo.
- `src/site.css`: the base styles. `src/flagship.css`: the current design layer, loaded after it. `src/pages/*.js`: behaviour for each page.

## Still needs the dealer

- **WhatsApp number:** the forms send to 5259 0327, the first number on the dealer's site. Change `whatsapp` in `src/dealer.js` (and `DEALER_WA` in `src/lib/layout.js`) if WhatsApp is on another number.
- **Leasing rate:** the 7.5% in the calculators is an example only and is labelled as one. Set `financeRate` in `src/dealer.js` to a typical Rogers Capital rate.
- **Body types:** a few cars are filed under an unexpected body type in the dealer's admin (the Kia Sportage as a hatchback, for example); the site shows what the admin says.
- **Legal text:** `privacy.html` and `terms.html` are plain, honest starting points. Have them checked.
- **Analytics:** none installed.
- **Custom domain:** add it in the repository's Pages settings and update `SITE` in `src/lib/templates.js`.

## Credits

- **Stock photos and logo:** V8 Motors.
- **Intro engine:** adapted from [V8 Hot Rod Engine by ShotaB](https://sketchfab.com/models/f20acef709b847eb98839b89c5ef916c), CC BY 4.0. Changes: exhausts shortened, reduced for the web, split into parts.
- **Home page 3D car:** adapted from [Range Rover Sport Hybrid PHEV 2023 by victor-arrais](https://sketchfab.com/models/b477326cf8b041c9b1a89b1c4f4e7bdf), CC BY 4.0. Changes: reduced for the web, roof fins removed, recoloured, red bow and number plates added.
- **Home page hall and carbon texture:** modelled and rendered in Blender for this site, with [Concrete](https://polyhaven.com/a/concrete) and [Hangar Concrete Floor](https://polyhaven.com/a/hangar_concrete_floor) from Poly Haven (CC0).
- **Fonts:** Archivo and Bodoni Moda, both under the SIL Open Font License.
- **Engine sound,** built from CC0 (public domain) recordings on Freesound:
  - [S63 AMG V8 engine revs](https://freesound.org/people/marcelweiss/sounds/505321/) by marcelweiss;
  - the starter crank and start-up from [Aston Martin Rapide start](https://freesound.org/people/Paul368/sounds/320096/) by Paul368.
