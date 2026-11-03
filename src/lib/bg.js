/**
 * Living background: a slow, liquid petrol-blue gradient drawn by a tiny WebGL shader.
 *
 * - It flows on its own, speeds up while you scroll (like accelerating) and drifts with the page.
 * - A soft light follows your finger or mouse; every tap sends a ripple through it.
 * - On phones it leans with the device (tilt), once motion access is allowed.
 *
 * Cheap on purpose: it renders at about a fifth of the screen's resolution (the gradient is soft, so the
 * browser's smooth upscale is invisible), runs at 30 fps on touch devices, pauses when the tab is hidden or
 * the intro covers it, and draws a single still frame for people who ask for reduced motion. Without
 * WebGL, the CSS gradient underneath is shown instead.
 */
const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision mediump float;
uniform vec2 r;        // canvas size
uniform float t;       // flow time
uniform vec2 m;        // pointer, 0..1 (y up)
uniform float me;      // pointer energy
uniform vec2 tilt;     // device tilt, -1..1
uniform float sc;      // scroll position (screens)
uniform vec4 rip[4];   // ripples: x, y, age (s), strength

float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 q = vec2(uv.x * asp, uv.y);
  q += tilt * 0.12 + vec2(0.0, -sc * 0.18);
  float lift = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 R = rip[i];
    if (R.w <= 0.0) continue;
    vec2 d = q - vec2(R.x * asp, R.y) - tilt * 0.0;
    float L = length(d);
    float k = (L - R.z * 0.55) * 11.0;
    float ring = exp(-k * k) * R.w * max(0.0, 1.0 - R.z / 1.6);
    q += d / max(L, 0.001) * ring * 0.05;
    lift += ring;
  }
  vec2 w = vec2(fbm(q * 1.15 + vec2(0.0, t * 0.07)), fbm(q * 1.15 + vec2(5.2, 1.3) - t * 0.06));
  float f = fbm(q * 1.5 + w * 1.9 + vec2(t * 0.03, -t * 0.02));
  float g = fbm(q * 0.8 - w * 1.2 + t * 0.02);

  vec3 deep  = vec3(0.071, 0.188, 0.290);  // #12304a
  vec3 ink   = vec3(0.184, 0.353, 0.471);  // #2f5a78
  vec3 light = vec3(0.247, 0.455, 0.588);  // #3f7496
  vec3 cyan  = vec3(0.624, 0.890, 0.961);  // logo cyan
  vec3 red   = vec3(0.878, 0.149, 0.184);  // logo red
  vec3 col = mix(deep, ink, smoothstep(0.22, 0.52, f));
  col = mix(col, light, smoothstep(0.55, 0.8, f) * 0.85);
  // thin bright seams where the flow folds, like light running over paint
  col += cyan * pow(smoothstep(0.42, 0.85, w.x * f * 1.6), 3.0) * 0.3;
  // a warm tail-lamp glow drifting low on the page
  col = mix(col, red, smoothstep(0.58, 0.9, g) * (1.0 - smoothstep(0.0, 0.8, uv.y)) * 0.26);
  // light trails: headlamps streaming one way, tail-lamps the other, like a long exposure of a road at night.
  // They speed up with the flow, so scrolling makes the traffic rush
  vec3 white = vec3(0.86, 0.95, 1.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
    float y = 0.12 + fi * 0.19 + 0.05 * sin(q.x * 1.3 + fi * 1.7 + t * 0.12) + (q.x - asp * 0.5) * 0.08 * (fi - 2.0);
    float d = q.y - y;
    float s = q.x * 0.85 - dir * t * (0.16 + 0.1 * h(vec2(fi, 3.0))) + h(vec2(fi, 9.0)) * 10.0;
    float seg = floor(s), p = fract(s);
    float car = step(0.4, h(vec2(seg, fi)));           // some stretches of road are empty
    float pp = dir > 0.0 ? p : 1.0 - p;               // head at the leading end
    float trail = pow(pp, 1.7) * (1.0 - smoothstep(0.95, 1.0, pp)) * car;
    float core = exp(-d * d * 1800.0), halo = exp(-d * d * 160.0);
    vec3 lamp = dir > 0.0 ? mix(cyan, white, 0.5) : red * 1.1;
    col += lamp * trail * (core * 0.34 + halo * 0.07);
    col += lamp * halo * 0.025;                         // the lane's faint glow, even between cars
  }
  // soft out-of-focus lights drifting upwards, two layers for depth
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float sz = 2.6 + fk * 2.2;
    vec2 bq = q * sz + vec2(t * (0.03 + fk * 0.02), -t * (0.06 + fk * 0.05)) + fk * 17.0;
    vec2 cell = floor(bq), fr = fract(bq) - 0.5;
    float rn = h(cell + fk * 31.0);
    vec2 off = (vec2(h(cell + 1.3), h(cell + 7.1)) - 0.5) * 0.5;
    float rad = 0.13 + 0.14 * h(cell + 4.2);
    float b = (1.0 - smoothstep(rad * 0.55, rad, length(fr - off))) * step(0.62, rn);
    float tw = 0.55 + 0.45 * sin(t * 0.9 + rn * 40.0);
    col += mix(cyan, white, rn) * b * tw * (0.09 - fk * 0.03);
  }
  // the light under your finger, and the ripples' crests
  vec2 dm = vec2((uv.x - m.x) * asp, uv.y - m.y);
  col += vec3(0.42, 0.72, 0.88) * me * 0.3 * exp(-dot(dm, dm) * 6.0);
  col += cyan * lift * 0.32;
  // gentle vignette keeps the edges deep
  col *= 1.0 - 0.18 * length(uv - 0.5);
  gl_FragColor = vec4(col + (h(gl_FragCoord.xy + t) - 0.5) / 255.0, 1.0);
}`;

let motionAsked = false;
/** iOS asks before sharing tilt; call this inside a tap (the intro's start button does). */
export function requestMotion() {
  if (motionAsked) return;
  motionAsked = true;
  try { DeviceOrientationEvent?.requestPermission?.().catch(() => {}); } catch { /* not iOS */ }
}

const ripples = [];
/** Sends a ripple through the background from a point on screen (client px). */
export function bgPulse(x, y, strength = 1) {
  ripples.push({ x: x / innerWidth, y: 1 - y / innerHeight, born: performance.now() / 1000, s: strength });
  if (ripples.length > 4) ripples.shift();
}

export function initBackground() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['r', 't', 'm', 'me', 'tilt', 'sc', 'rip'].map((k) => [k, gl.getUniformLocation(prog, k)]));

  document.body.prepend(canvas);
  document.documentElement.classList.add('bg-live');

  // the canvas is sized to the large viewport in CSS (100lvh), so a phone's sliding address bar doesn't
  // resize it; only real size changes (rotation, window resize) reallocate it
  let sizedW = 0, sizedH = 0;
  const size = () => {
    if (innerWidth === sizedW && Math.abs(innerHeight - sizedH) < 160) return;
    sizedW = innerWidth; sizedH = innerHeight;
    const k = coarse ? 0.2 : 0.25;
    canvas.width = Math.max(64, Math.round(innerWidth * k));
    canvas.height = Math.max(64, Math.round(innerHeight * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.r, canvas.width, canvas.height);
  };
  size();
  addEventListener('resize', size, { passive: true });

  // input: pointer (and the finger while it scrolls), taps, tilt, scroll speed
  const ptr = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6, e: 0, te: 0 };
  const aim = (x, y, energy) => { ptr.tx = x / innerWidth; ptr.ty = 1 - y / innerHeight; ptr.te = energy; };
  addEventListener('pointermove', (e) => aim(e.clientX, e.clientY, e.pointerType === 'mouse' ? 0.75 : 1), { passive: true });
  addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) aim(t.clientX, t.clientY, 1); }, { passive: true });
  addEventListener('pointerdown', (e) => { aim(e.clientX, e.clientY, 1); bgPulse(e.clientX, e.clientY, 1); }, { passive: true });
  addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') ptr.te = 0; }, { passive: true });
  addEventListener('touchend', () => { ptr.te = 0; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { ptr.te = 0; });

  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    tilt.tx = Math.max(-1, Math.min(1, e.gamma / 35));
    tilt.ty = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 35));
  }, { passive: true });

  let lastY = scrollY, speed = 0, flow = Math.random() * 50, last = performance.now(), lastDraw = 0;
  const draw = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const dy = scrollY - lastY; lastY = scrollY;
    speed += (Math.min(4, Math.abs(dy) / Math.max(1, innerHeight) * 60) - speed) * Math.min(1, dt * 4);
    flow += dt * (1.5 + speed * 3);
    ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 6);
    ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 6);
    ptr.e += (ptr.te - ptr.e) * Math.min(1, dt * (ptr.te > ptr.e ? 8 : 1.5));
    tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 3);
    tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 3);
    const t = now / 1000;
    while (ripples.length && t - ripples[0].born > 1.6) ripples.shift();
    const rip = new Float32Array(16);
    ripples.forEach((p, i) => rip.set([p.x, p.y, t - p.born, p.s], i * 4));

    gl.uniform1f(U.t, flow);
    gl.uniform2f(U.m, ptr.x, ptr.y);
    gl.uniform1f(U.me, ptr.e);
    gl.uniform2f(U.tilt, tilt.x, tilt.y);
    gl.uniform1f(U.sc, scrollY / Math.max(1, innerHeight));
    gl.uniform4fv(U.rip, rip);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    lastDraw = now;
  };

  if (reduced) { draw(performance.now()); addEventListener('resize', () => draw(performance.now())); return; }

  const minGap = coarse ? 1000 / 30 - 2 : 0;
  let raf = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (document.documentElement.classList.contains('play-intro')) return; // the intro covers the screen
    if (now - lastDraw < minGap) return;
    draw(now);
  };
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); canvas.remove(); document.documentElement.classList.remove('bg-live'); });
  start();
}
