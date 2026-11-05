/**
 * The page background: carbon fibre, under moving light. A small WebGL shader draws a 2x2 twill weave and lights it the
 * way the real thing is lit: each tow is a bundle of parallel fibres, so it only flashes when a light lines up across
 * it. Tows running one way catch a light in a vertical band and the others in a horizontal one, which is why a lamp
 * passing over carbon throws that shifting cross of light.
 * - a warm lamp and a red tail-lamp glow wander slowly over it, and every few seconds a cold sweep crosses it;
 * - a soft light follows the mouse;
 * - faint headlight and tail-light trails stream across, like a long exposure of a road at night;
 * - the weave moves with the page, at a slower speed, in whole pixels so it never shimmers;
 * - the one thing that follows the visitor is the hour: a warm dawn comes up towards the bottom of a page, as strong as the real sky allows.
 * It pauses while hidden or while the 3D hero covers the screen, runs at 30 fps on phones, and with reduced motion, no
 * WebGL or a failed shader the still of dark paint (public/bg/panel.webp) stays underneath.
 */
const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `
precision highp float;
uniform vec2 r;      // canvas size
uniform vec2 m;      // the pointer, in the same units as q
uniform float t;     // time, seconds
uniform float d;     // how far down the page: 0 night, 1 sunrise
uniform float w;     // how warm the real sky is right now
uniform float sc;    // how far the weave has moved, device pixels
uniform float k;     // device pixels per CSS pixel
const float PI = 3.14159265;

float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

/* one light on the weave. Returns (tow x highlight, tow y highlight, soft pool) */
vec3 lamp(vec2 q, vec2 c, float size, float height) {
  vec2 v = q - c;
  float pool = exp(-dot(v, v) * size);
  vec3 H = normalize(vec3(-v, height));
  float sx = pow(max(1.0 - H.x * H.x, 0.0), 90.0);   // fibres along x flash when the light is square across them
  float sy = pow(max(1.0 - H.y * H.y, 0.0), 90.0);
  return vec3(sx, sy, 1.0) * pool;
}

void main() {
  float asp = r.x / r.y;
  vec2 q = vec2(gl_FragCoord.x / r.y, gl_FragCoord.y / r.y);

  // ---- the weave: two tows over, two under, stepping one along on every row
  vec2 px = vec2(gl_FragCoord.x, r.y - gl_FragCoord.y + sc);
  float cell = 6.0 * k;
  vec2 p = px / cell, ip = floor(p), f = p - ip;
  float m4 = mod(ip.x + ip.y, 4.0);
  float isX = step(m4, 1.5);
  float across = mix(f.x, f.y, isX);                                  // across the tow's width
  float along = mix((m4 - 2.0 + f.y) * 0.5, (m4 + f.x) * 0.5, isX);   // along the two cells it floats over
  float round_ = sqrt(max(sin(across * PI), 0.0));
  float ends = pow(max(sin(along * PI), 0.0), 0.45);
  float fibre = 0.86 + 0.14 * sin(across * PI * 11.0);
  float tow = round_ * ends * fibre;

  // ---- the lights
  float c0 = t * 0.11, c1 = t * 0.083;
  vec3 warm = lamp(q, vec2(asp * (0.5 + 0.44 * sin(c0)), 0.52 + 0.4 * sin(c1 + 1.0)), 2.1, 0.5);
  vec3 tail = lamp(q, vec2(asp * (0.5 + 0.46 * cos(c1 * 0.8 + 2.0)), 0.22 + 0.16 * sin(c0 * 1.3)), 3.4, 0.42);
  float ph = mod(t, 9.0) / 3.4;
  vec3 cold = lamp(q, vec2(mix(-0.5, asp + 0.5, ph), 0.62 + 0.2 * sin(t * 0.37)), 1.5, 0.6) * (1.0 - step(1.0, ph));
  vec3 hand = lamp(q, m, 7.0, 0.32);

  vec3 ivory = vec3(1.0, 0.95, 0.86), red = vec3(0.88, 0.13, 0.16), ice = vec3(0.82, 0.88, 1.0);
  float pickX = isX, pickY = 1.0 - isX;
  float wK = warm.x * pickX + warm.y * pickY, tK = tail.x * pickX + tail.y * pickY;
  float cK = cold.x * pickX + cold.y * pickY, hK = hand.x * pickX + hand.y * pickY;

  vec3 col = vec3(0.021, 0.022, 0.024) * (0.35 + 0.65 * tow);         // the weave in the dark
  col += tow * (ivory * wK * 0.2 + red * tK * 0.3 + ice * cK * 0.2 + ivory * hK * 0.22);
  // a broad, soft sheen from the resin over the top of the weave
  col += ivory * warm.z * 0.034 + red * tail.z * 0.05 + ice * cold.z * 0.022 + ivory * hand.z * 0.03;

  // ---- light trails, a long exposure of a road at night
  float night = 1.0 - smoothstep(0.62, 1.0, d) * 0.8;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
    float y = 0.16 + fi * 0.23 + 0.02 * sin(q.x * 1.2 + fi * 1.7 + t * 0.1) + (q.x - asp * 0.5) * 0.05 * (fi - 1.5);
    float e = q.y - y;
    float s = q.x * 0.5 - dir * t * (0.07 + 0.03 * fi) + fi * 3.7;
    float seg = floor(s), pos = s - seg;
    float car = step(0.45, h(vec2(seg, fi)));
    float pp = dir > 0.0 ? pos : 1.0 - pos;
    float trail = pow(pp, 2.2) * (1.0 - smoothstep(0.93, 1.0, pp)) * car;
    vec3 c = dir > 0.0 ? ivory : red * 1.3;
    col += c * trail * (exp(-e * e * 2600.0) * 0.085 + exp(-e * e * 170.0) * 0.012) * night;
  }

  // ---- sunrise, low on the screen
  float dawn = smoothstep(0.62, 1.0, d), hz = 1.0 - smoothstep(0.0, 0.92, q.y);
  col += mix(vec3(0.78, 0.38, 0.38), vec3(1.0, 0.69, 0.42), hz) * hz * hz * dawn * 0.13 * w;

  // edges stay deep, and a fixed dither keeps the soft gradients from banding
  vec2 uv = gl_FragCoord.xy / r;
  col *= 1.0 - 0.3 * dot(uv - 0.5, uv - 0.5) * 2.0;
  gl_FragColor = vec4(col + (h(gl_FragCoord.xy) - 0.5) / 255.0, 1.0);
}`;

let warmth = 1;
/** How much of the warm glow the real sky calls for: set by src/lib/sky.js. */
export const setDawn = (v) => {
  warmth = v;
  document.documentElement.style.setProperty('--dawn-k', v.toFixed(3));
};

export function initBackground() {
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const modest = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;

  const plate = document.createElement('div');
  plate.className = 'bg-plate';
  plate.setAttribute('aria-hidden', 'true');
  const dawnLayer = document.createElement('div');
  dawnLayer.className = 'bg-dawn';
  dawnLayer.setAttribute('aria-hidden', 'true');
  document.body.prepend(plate, dawnLayer);
  html.classList.add('bg-live');

  let room = 1;
  const measure = () => {
    const end = document.querySelector('.footer')?.offsetTop ?? html.scrollHeight;
    room = Math.max(1, end - innerHeight * 0.5);
  };
  measure();
  addEventListener('load', measure, { once: true });
  addEventListener('resize', measure, { passive: true });

  // the still layer's dawn, for when there is no shader
  let queued = false;
  const stillDawn = () => {
    queued = false;
    dawnLayer.style.opacity = String(Math.max(0, (Math.min(1, scrollY / room) - 0.62) / 0.38).toFixed(3));
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(stillDawn); } };
  const fallback = () => { stillDawn(); addEventListener('scroll', ask, { passive: true }); };

  if (reduced) return fallback();
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return fallback();

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback();
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['r', 'm', 't', 'd', 'w', 'sc', 'k'].map((n) => [n, gl.getUniformLocation(prog, n)]));

  plate.after(canvas);

  // the weave is drawn in device pixels, so the canvas is exactly the size it is shown at
  const K = Math.min(devicePixelRatio || 1, modest ? 1 : coarse ? 2 : 2);
  let sizedW = 0, sizedH = 0;
  const size = () => {
    const w = document.documentElement.clientWidth, h = Math.max(innerHeight, document.documentElement.clientHeight);
    if (w === sizedW && Math.abs(h - sizedH) < 160) return; // a phone's sliding address bar is not a resize
    sizedW = w; sizedH = h;
    // one canvas pixel to one screen pixel, without the scrollbar: any stretch turns a fine weave into moire
    const css = Math.round(h * 1.16);
    canvas.width = Math.round(w * K);
    canvas.height = Math.round(css * K);
    canvas.style.width = `${canvas.width / K}px`;
    canvas.style.height = `${canvas.height / K}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.r, canvas.width, canvas.height);
    gl.uniform1f(u.k, K);
  };
  size();

  // a soft light follows the mouse, gliding rather than sticking to it
  let mx = -9, my = -9, tx = -9, ty = -9;
  if (!coarse) {
    addEventListener('pointermove', (e) => {
      tx = e.clientX * K / canvas.height;
      ty = (canvas.height - e.clientY * K) / canvas.height;
      if (mx < -8) { mx = tx; my = ty; }
    }, { passive: true });
  }

  // the clock only advances while frames are drawn, so the picture carries on where it left off after a pause
  let clock = 10 + Math.random() * 40, last = performance.now(), lastDraw = 0, hour = 0;
  const draw = (now) => {
    clock += Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    hour += (Math.min(1, scrollY / room) - hour) * 0.08;
    mx += (tx - mx) * 0.09;
    my += (ty - my) * 0.09;
    gl.uniform1f(u.t, clock);
    gl.uniform1f(u.d, hour);
    gl.uniform1f(u.w, warmth);
    gl.uniform2f(u.m, mx, my);
    gl.uniform1f(u.sc, Math.round(scrollY * 0.3 * K));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    lastDraw = now;
  };
  draw(performance.now());
  addEventListener('resize', () => { size(); draw(performance.now()); }, { passive: true });

  const reveal = () => requestAnimationFrame(() => canvas.classList.add('is-on'));
  const whenLoaded = () => (document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true })));
  whenLoaded().then(() => {
    if (html.classList.contains('play-intro')) addEventListener('v8:intro-done', reveal, { once: true });
    else reveal();
  });

  // the weave has to stay pixel-exact, so a huge screen gets fewer frames rather than fewer pixels
  const gap = () => {
    const mp = (canvas.width * canvas.height) / 1e6;
    return modest ? 1000 / 20 : coarse || mp > 5 ? 1000 / 30 - 2 : 1000 / 60 - 2;
  };
  let raf = 0, crawl = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (html.classList.contains('play-intro') || html.classList.contains('hero-cover')) { last = now; return; } // the 3D hero covers the screen
    if (now - lastDraw < gap()) return;
    // a machine that can't draw this at even a few frames a second gets the still background instead
    const took = now - lastDraw;
    if (took > 120 && took < 1500) { if (++crawl > 10) { stop(); canvas.remove(); fallback(); return; } } else if (crawl) crawl--;
    draw(now);
  };
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); canvas.remove(); fallback(); });
  start();
}
