import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve, relative, sep } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { headHTML, navHTML, footerHTML, mobileBarHTML, arrivalsHTML, bodyTilesHTML, makesHTML, inventoryGridHTML, filterOptionsHTML } from './src/lib/templates.js';
import { META } from './src/lib/meta.js';
import { CARS, BODY_TYPES } from './src/data.js';

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
          .replace('<!--@bodies-->', () => bodyTilesHTML(P))
          .replace('<!--@makes-->', () => makesHTML(P))
          .replace('<!--@grid-->', () => inventoryGridHTML(P))
          .replace('<!--@count-->', () => String(CARS.filter((c) => c.status !== 'Reserved').length))
          .replace(/<!--@opts:(\w+)-->/g, (_, k) => filterOptionsHTML(k))
          .replace('<!--@total-->', () => String(CARS.length))
          .replace('<!--@makeoptions-->', () => [...new Set(CARS.map((c) => c.make))].sort().map((m) => `<option>${m}</option>`).join(''))
          .replace('<!--@bodyoptions-->', () => BODY_TYPES.filter((t) => CARS.some((c) => c.body === t)).map((t) => `<option>${t}</option>`).join(''));
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
