/**
 * The page behind everything: brushed steel under slow, drifting light.
 * The steel is plain CSS (src/glass.css), so it costs the graphics card a little and the page nothing; this file only builds it,
 * leans it as the page scrolls, and lets a soft light follow the mouse.
 *
 * Most of the time that is all there is. Every so often a single car races across the window, flat out and level, and is gone.
 * It stays behind the page, and the glass bends it as it goes under.
 */
import gsap from 'gsap';
import { modest } from './device.js';

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const paused = () => document.hidden || html.classList.contains('play-intro') || html.classList.contains('hero-cover');

export function initBackground() {
  const box = document.createElement('div');
  box.className = 'bgfx';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<div class="bgfx-steel"></div><div class="bgfx-layer"><i></i><i></i><i></i><i></i></div><div class="bgfx-sheen"></div><div class="bgfx-spot"></div><div class="bgfx-vig"></div>';
  document.body.prepend(box);
  html.classList.toggle('lite', modest);
  if (reduced) return;

  gsap.to(box.querySelector('.bgfx-layer'), { yPercent: -12, rotation: 14, scale: 1.08, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1.2 } });
  if (fine) followMouse(box.querySelector('.bgfx-spot'));
  racePast();
}

function followMouse(spot) {
  const x = gsap.quickTo(spot, 'x', { duration: 0.7, ease: 'power3.out' }), y = gsap.quickTo(spot, 'y', { duration: 0.7, ease: 'power3.out' });
  addEventListener('pointermove', (e) => { spot.style.opacity = 1; x(e.clientX); y(e.clientY); }, { passive: true });
}

/* ------------------------------------------------------------------ the odd car racing past */
const RACE = { first: [5, 9], gap: [16, 32] }; // seconds: until the first one, and between the others
const LANES = [0.36, 0.52, 0.68]; // how far down the window it runs: below every page's heading, above its footer

function racePast() {
  const box = document.querySelector('[data-bg-cars]');
  if (!box) return;
  const cars = [...box.children];
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const wait = ([a, b]) => (a + Math.random() * (b - a)) * 1000;
  let timer = 0, last = null;

  const race = () => {
    // not while nobody could see it: it comes along a moment later instead
    if (paused()) { timer = setTimeout(race, 1500); return; }
    const W = box.clientWidth, H = box.clientHeight;
    const car = pick(cars.filter((c) => c !== last));
    last = car;
    const out = car.offsetWidth * 2.4; // it starts and ends well off screen, trail included
    const right = Math.random() < 0.5; // which way it's heading
    const from = right ? -out : W + out, to = right ? W + out : -out;
    const y = pick(LANES) * H - car.offsetHeight / 2;
    gsap.set(car, { x: from, y, scaleX: right ? 1 : -1, autoAlpha: 1 });
    car.classList.add('is-racing');
    gsap.to(car, {
      x: to, duration: Math.max(1.1, (W + out * 2) / 1500), ease: 'none',
      onComplete: () => {
        car.classList.remove('is-racing');
        gsap.set(car, { autoAlpha: 0 });
        timer = setTimeout(race, wait(RACE.gap));
      },
    });
  };
  timer = setTimeout(race, wait(RACE.first));
  addEventListener('pagehide', () => clearTimeout(timer));
}
