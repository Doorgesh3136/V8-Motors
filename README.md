# V8 Motors

Showroom and marketplace site for V8 Motors (Mauritius). Built with Vite, Tailwind CSS v4, three.js, GSAP and Lenis.

Live site: https://doorgesh3136.github.io/V8-Motors/ (served by GitHub Pages from the `gh-pages` branch).

To publish changes: `npm run deploy` (builds the site and pushes `dist/` to `gh-pages`).

    npm install
    npm run dev      # http://localhost:5173
    npm run build    # static site in dist/

## Pages
- `index.html` Home: rev-counter loader (first visit per session), 3D showroom with scroll walkaround, "Just arrived" sideways-scrolling rail, makes marquee, body types, sell/finance panels.
- `inventory.html` Full stock list: filters (body, price and year ranges, mileage, fuel, gearbox, make), removable filter chips, sort, grid/list view, filters saved in the URL, compare tray, recently viewed.
- `car.html?id=…` Car page: gallery with full-screen zoom, specs, features, inspection report, finance estimate, test-drive booking with calendar file, similar cars.
- `compare.html` Up to 3 cars side by side, best values marked, "only show differences".
- `sell.html` Four-step sell wizard with a live rough valuation and photo upload.
- `finance.html` Calculator, cost breakdown donut, year-by-year balance chart, FAQ.
- `contact.html` Map, opening hours with live open/closed status, contact form.

Shared code lives in `src/lib/` (layout, page transitions, cursor, cards, saved/compare store, opening hours).

## 3D on phones
The home-page car is tuned for mobile in `src/scene.js` (`deviceProfile()`):
- Pixel ratio capped at 1.5 on phones, and stepped down automatically to 1 if the phone can't hold about 45 fps.
- No anti-aliasing on high-density screens, and simple tinted glass instead of the costly see-through glass.
- 30 fps while the car is idling on the turntable, full frame rate while you drag or scroll.
- Rendering stops completely when the 3D section is scrolled off screen or the tab is hidden.
- Phones in data-saver mode or with 2 GB of memory or less get a photo instead of the 1.7 MB model.
- If the phone's GPU drops the 3D context, the page swaps to the photo instead of showing a blank area.

## Page transitions
Chrome, Edge and Safari use native cross-page view transitions (the car photo morphs from its card into the car page). Firefox gets a curtain wipe instead. Open the site through `npm run dev`, `npm run preview` or the live URL, not by double-clicking an HTML file: browsers block the scripts on `file://` pages.

## Where to change things
- `src/data.js`: dealer phone, WhatsApp, address, opening hours, finance rate, the car list, and the featured 3D car's specs.
- `src/scene.js`: 3D studio, camera stops for the scroll walkaround, paint material.
- `src/style.css`: design tokens (colours, font) live in the `@theme` block at the top.

The phone number, WhatsApp number, email and address are placeholders. Replace them before going live.
Forms (sell your car, test drive) only show a confirmation on screen. Connect them to email or a CRM to receive leads.

## Credits
- 3D model: Ferrari 458 Italia by vicent091036, from the three.js examples.
- Car photos: Unsplash (hotlinked from images.unsplash.com).
