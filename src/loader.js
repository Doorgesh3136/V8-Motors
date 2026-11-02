import gsap from 'gsap';

const NS = 'http://www.w3.org/2000/svg';
const CX = 200, CY = 200, R = 170;
const MAX = 8, RED_FROM = 6.5;
const angle = (v) => -135 + (v / MAX) * 270;
const pt = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent.appendChild(n);
  return n;
}

/** Rev-counter loading screen. The needle follows real loading progress. */
export function createTach(root, { reduced }) {
  const ticks = root.querySelector('.tach-ticks');
  const needle = root.querySelector('.tach-needle');
  const pct = root.querySelector('[data-pct]');
  const msg = root.querySelector('[data-msg]');

  for (let v = 0; v <= MAX + 1e-6; v += 0.25) {
    const major = Math.abs(v - Math.round(v)) < 1e-6;
    const half = !major && Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
    const a = angle(v);
    const [x1, y1] = pt(a, R);
    const [x2, y2] = pt(a, R - (major ? 26 : half ? 16 : 10));
    const cls = ['tick', major && 'tick--major', v >= RED_FROM && 'tick--red'].filter(Boolean).join(' ');
    el('line', { x1, y1, x2, y2, class: cls }, ticks);
    if (major) {
      const [tx, ty] = pt(a, R - 48);
      const t = el('text', { x: tx, y: ty, class: 'tach-num' + (v >= RED_FROM ? ' tach-num--red' : '') }, ticks);
      t.textContent = String(Math.round(v));
    }
  }
  const [rx1, ry1] = pt(angle(RED_FROM), R + 10);
  const [rx2, ry2] = pt(angle(MAX), R + 10);
  root.querySelector('.tach-redline').setAttribute('d', `M${rx1} ${ry1} A${R + 10} ${R + 10} 0 0 1 ${rx2} ${ry2}`);

  const state = { target: 0, shown: 0, rpm: 0 };
  const messages = [
    [0, 'Warming up the showroom'],
    [0.35, 'Polishing the paint'],
    [0.7, 'Lining up the cars'],
    [0.98, 'Ready'],
  ];

  const tick = () => {
    state.shown += (state.target - state.shown) * 0.08;
    const jitter = reduced ? 0 : (Math.random() - 0.5) * 0.06;
    state.rpm = 0.8 + state.shown * 5.6 + jitter;
    needle.style.transform = `rotate(${angle(state.rpm)}deg)`;
    pct.textContent = Math.round(state.shown * 100);
    for (let i = messages.length - 1; i >= 0; i--) {
      if (state.shown >= messages[i][0]) { msg.textContent = messages[i][1]; break; }
    }
  };
  gsap.ticker.add(tick);

  return {
    set(p) { state.target = Math.max(state.target, Math.min(1, p)); },
    /** Blip into the redline, settle, then wipe the screen away. */
    finish() {
      state.target = 1;
      return new Promise((resolve) => {
        const tl = gsap.timeline({
          onComplete: () => { gsap.ticker.remove(tick); root.remove(); resolve(); },
        });
        tl.to(state, { shown: 1, duration: 0.35, ease: 'power2.out' });
        if (!reduced) {
          const n = { v: 0 };
          const draw = () => { needle.style.transform = `rotate(${angle(n.v)}deg)`; };
          tl.add(() => { gsap.ticker.remove(tick); n.v = state.rpm; });
          tl.to(n, { v: 7.6, duration: 0.28, ease: 'power3.out', onUpdate: draw });
          tl.to(n, { v: 0.9, duration: 0.9, ease: 'elastic.out(1, 0.55)', onUpdate: draw });
          tl.to(root, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.45');
        } else {
          tl.to(root, { opacity: 0, duration: 0.3 });
        }
      });
    },
  };
}
