/**
 * The budget dial: a rev counter you turn with your thumb. Drag round it (a sideways start, so it never fights
 * the page scroll), tap the scale, tap - and +, or use the keyboard on the real range input laid over it.
 * The needle has weight, the figure rolls like an odometer, and the cars that fit park underneath.
 * The first time it's seen, the needle does a dashboard's self-test: a full sweep, then it settles.
 */
import gsap from 'gsap';
import { CARS, rs, monthly, thumb, priceForMonthly } from '../data.js';
import { DIAL, esc, carUrl } from './templates.js';
import { reduced, P, $ } from './layout.js';
import { odo } from './odo.js';

const { min, max, step, start, sweep } = DIAL;
const angleOf = (v) => -sweep + ((v - min) / (max - min)) * sweep * 2;
const valueOf = (a) => Math.round((min + ((a + sweep) / (sweep * 2)) * (max - min)) / step) * step;
const clamp = (v) => Math.min(max, Math.max(min, v));

export function initDial(root = $('[data-dial]'), { onRev } = {}) {
  if (!root) return;
  const face = $('[data-dial-face]', root), needle = $('[data-dial-needle]', root), fill = $('[data-dial-fill]', root);
  const input = $('[data-dial-input]', root), val = $('[data-dial-val]', root), nOut = $('[data-dial-n]', root);
  const word = $('[data-dial-word]', root);
  const rail = $('[data-dial-rail]'), all = $('[data-dial-all]'), walk = $('[data-dial-walk]');
  gsap.set(needle, { svgOrigin: '200 200', rotation: angleOf(min) });
  // a fresh tween each time: the self-test below clears the needle's tweens, which would silently kill a shared quickTo
  const turn = reduced ? (a) => gsap.set(needle, { rotation: a }) : (a) => gsap.to(needle, { rotation: a, duration: 0.55, ease: 'back.out(1.5)', overwrite: true });
  const arc = { p: 0 };

  let value = start, shown = '', timer = 0;
  const fits = (v) => CARS.filter((c) => monthly(c.price) <= v).sort((a, b) => b.price - a.price);

  const drawCars = (list) => {
    const key = list.slice(0, 8).map((c) => c.id).join();
    if (key === shown) return;
    shown = key;
    rail.innerHTML = list.slice(0, 8).map((c) => `<li><a class="dial-car" href="${carUrl(c, P)}">
      <img src="${thumb(c, 0, 480, P)}" width="480" height="317" alt="" loading="lazy" decoding="async">
      <span class="dial-car-name">${c.year} ${esc(c.make)} ${esc(c.model)}</span>
      <span class="dial-car-price tabular-nums">${rs(c.price)}, about ${rs(monthly(c.price))} a month</span></a></li>`).join('')
      || '<li class="dial-none">Nothing at this figure yet. Turn it up a little, or ask us what arrives next week.</li>';
    if (!reduced) gsap.from(rail.children, { opacity: 0, x: 22, duration: 0.5, stagger: 0.035, ease: 'expo.out', clearProps: 'opacity,transform' });
  };

  const set = (v, { quiet = false } = {}) => {
    v = clamp(v);
    const changed = v !== value;
    value = v;
    input.value = v;
    input.setAttribute('aria-valuetext', `${rs(v)} a month`);
    turn(angleOf(v));
    gsap.to(arc, { p: ((v - min) / (max - min)) * 100, duration: reduced ? 0 : 0.5, ease: 'expo.out', overwrite: true, onUpdate: () => { fill.style.strokeDasharray = `${arc.p} 100`; } });
    root.classList.toggle('is-red', v >= 20000);
    odo(val, rs(v));
    const list = fits(v);
    odo(nOut, list.length);
    word.textContent = list.length === 1 ? 'car fits' : 'cars fit';
    const maxPrice = Math.ceil(priceForMonthly(v) / 1000) * 1000;
    all.href = `${P}inventory.html?max=${maxPrice}`;
    walk.href = `${P}forecourt.html?max=${maxPrice}`;
    all.lastElementChild.textContent = list.length === 1 ? 'See it' : `See all ${list.length}`;
    all.classList.toggle('is-disabled', !list.length);
    walk.classList.toggle('is-disabled', !list.length);
    clearTimeout(timer);
    timer = setTimeout(() => drawCars(list), quiet ? 0 : 90);
    if (changed && !quiet) { navigator.vibrate?.(4); onRev?.((v - min) / (max - min)); }
  };

  // the finger: its angle round the centre sets the value; past the gap at the bottom it holds the nearest end
  let drag = null;
  const fromPointer = (e) => {
    const r = face.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.07) return;
    let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (Math.abs(a) > sweep) a = Math.sign(a) * sweep;
    const v = valueOf(a);
    if (drag?.moved && Math.abs(v - value) > (max - min) * 0.6) return; // no leaping across the gap mid-drag
    set(v);
  };
  face.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { id: e.pointerId, moved: false, x: e.clientX, y: e.clientY };
    root.classList.add('is-held');
    input.focus({ preventScroll: true });
  });
  face.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      // a finger going up or down is scrolling the page, not turning the dial
      const dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
      if (Math.hypot(dx, dy) < 6) return; // a little wobble is still a tap on the scale
      if (e.pointerType !== 'mouse' && dy > dx) { drag = null; root.classList.remove('is-held'); return; }
      drag.moved = true;
      face.setPointerCapture(e.pointerId);
    }
    fromPointer(e);
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && e.type === 'pointerup') fromPointer(e); // a plain tap on the scale
    drag = null;
    root.classList.remove('is-held');
  };
  face.addEventListener('pointerup', up);
  face.addEventListener('pointercancel', up);

  input.addEventListener('input', () => set(+input.value));
  root.querySelectorAll('[data-dial-step]').forEach((b) => b.addEventListener('click', () => set(value + +b.dataset.dialStep * 1000)));

  set(start, { quiet: true });
  if (reduced || !('IntersectionObserver' in window)) { gsap.killTweensOf(needle); gsap.set(needle, { rotation: angleOf(start) }); return; }
  gsap.killTweensOf(needle);
  gsap.set(needle, { rotation: angleOf(min) });
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    if (drag) return;
    const o = { v: min };
    const draw = () => gsap.set(needle, { rotation: angleOf(o.v) });
    gsap.timeline({ onComplete: () => turn(angleOf(value)) })
      .to(o, { v: max, duration: 0.8, ease: 'power2.inOut', onUpdate: draw })
      .to(o, { v: value, duration: 1, ease: 'expo.out', onUpdate: draw });
  }, { threshold: 0.5 });
  io.observe(face);
}
