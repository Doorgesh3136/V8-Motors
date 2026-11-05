import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve, relative, sep } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { headHTML, navHTML, footerHTML, mobileBarHTML, arrivalsHTML, bodyTilesHTML, makesHTML, inventoryGridHTML, filterOptionsHTML, dialSvg } from './src/lib/templates.js';
import { META } from './src/lib/meta.js';
import { CARS, thumb } from './src/data.js';

// part-exchange calculator on the home page: cheapest first, a mid-priced car preselected
const SWAP_LIST = [...CARS].sort((a, b) => a.price - b.price);
const SWAP_PICK = SWAP_LIST[Math.floor(SWAP_LIST.length * 0.6)];

const root = import.meta.dirname;
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const cars = existsSync(resolve(root, 'cars')) ? readdirSync(resolve(root, 'cars')).filter((f) => f.endsWith('.html')).map((f) => `cars/${f}`) : [];

/**
 * Fills <!--@...--> placeholders at dev and build time, so every page ships real HTML
 * (navigation, footer, car cards, meta tags) instead of an empty shell filled by JavaScript.
 */
function prerender() {
  return {
    name: 'v8-prerender',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const rel = relative(root, ctx.filename).split(sep).join('/');
        const P = rel.includes('/') ? '../' : '';
        const meta = META[rel];
        return html
          .replace('<!--@head-->', () => (meta ? headHTML({ ...meta, jsonld: meta.jsonld(), P }) : ''))
          .replace(/<!--@nav:(\w+)-->/, (_, k) => navHTML(k, P))
          .replace(/<!--@tabbar:(\w+)-->/, (_, k) => mobileBarHTML(k, P))
          .replace('<!--@footer-->', () => footerHTML(P))
          .replace('<!--@arrivals-->', () => arrivalsHTML(P))
          .replace('<!--@dial-->', () => dialSvg())
          .replaceAll('<!--@from-->', () => Math.min(...CARS.map((c) => c.price)).toLocaleString('en-US'))
          .replace('<!--@bodies-->', () => bodyTilesHTML(P))
          .replace('<!--@makes-->', () => makesHTML(P))
          .replace('<!--@grid-->', () => inventoryGridHTML(P))
          .replace('<!--@count-->', () => String(CARS.length))
          .replace('<!--@finder-->', () => JSON.stringify(CARS.map((c) => [c.make, c.model, c.year])))
          .replace(/<!--@opts:(\w+)-->/g, (_, k) => filterOptionsHTML(k))
          .replaceAll('<!--@total-->', () => String(CARS.length))
          .replace('<!--@caroptions-->', () => SWAP_LIST.map((c) => `<option value="${c.id}"${c === SWAP_PICK ? ' selected' : ''}>${c.year} ${c.make} ${c.model}, Rs ${c.price.toLocaleString('en-US')}</option>`).join(''))
          .replace('<!--@swapcard-->', () => `<img src="${thumb(SWAP_PICK)}" width="480" height="317" alt="" /><span><strong>${SWAP_PICK.year} ${SWAP_PICK.make} ${SWAP_PICK.model}</strong><span>${SWAP_PICK.trim}</span></span>`)
          .replace('data-swap-card href="inventory.html"', () => `data-swap-card href="cars/${SWAP_PICK.id}.html"`);
      },
    },
  };
}

/**
 * Vite drops `blocking="render"` from the entry script when it rewrites it for production.
 * Put it back: the page script must run before first paint so view transitions can be set up
 * (pagereveal) and script-built content (compare table, saved counts) never shifts the layout.
 */
function keepRenderBlocking() {
  return {
    name: 'v8-render-blocking',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (ctx.filename.endsWith('404.html') || ctx.filename.endsWith('car.html')) return html;
        return html.replace(/<script type="module" crossorigin src="([^"]+)">/g, '<script type="module" crossorigin src="$1" blocking="render">');
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [prerender(), keepRenderBlocking(), tailwindcss()],
  build: {
    sourcemap: false,
    rollupOptions: {
      input: Object.fromEntries([...pages, ...cars].map((p) => [p.replace(/\.html$/, '').replace('/', '-'), resolve(root, p)])),
    },
  },
});
