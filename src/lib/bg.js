/**
 * The page background, drawn by a tiny WebGL shader that animates entirely on its own (nothing in it reacts to
 * touch, the mouse or tilt), under a fine carbon-fibre texture. The one thing that follows the visitor is the
 * hour: the site is a night drive, so the top of a page is deep night and the bottom is sunrise over Coromandel.
 * - a petrol-blue gradient that flows slowly, with thin cyan seams of light and a warm red glow low down;
 * - headlight (cyan) and tail-light (red) trails streaming across, like a long exposure of a road at night;
 * - soft out-of-focus lights drifting upwards;
 * - every few seconds a broad sweep of light gliding diagonally across, like light over a car's paint.
 * It renders at a fifth of the screen's resolution, 30 fps on phones, pauses while hidden or under the
 * intro, draws its first frame straight away and fades in once the page has loaded.
 */
const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision mediump float;
uniform vec2 r;        // canvas size
uniform float t;       // time, seconds
uniform float d;       // how far down the page: 0 night, 1 sunrise

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
  float f0 = t * 1.5; // flow clock
  vec2 w = vec2(fbm(q * 1.15 + vec2(0.0, f0 * 0.07)), fbm(q * 1.15 + vec2(5.2, 1.3) - f0 * 0.06));
  float f = fbm(q * 1.5 + w * 1.9 + vec2(f0 * 0.03, -f0 * 0.02));
  float g = fbm(q * 0.8 - w * 1.2 + f0 * 0.02);

  float dawn = smoothstep(0.62, 1.0, d);    // the sky only turns near the end of the page
  float morn = smoothstep(0.1, 1.0, d) * 0.62;  // the night lifts slowly on the way down
  vec3 deep  = mix(vec3(0.031, 0.102, 0.153), vec3(0.071, 0.188, 0.290), morn);
  vec3 ink   = mix(vec3(0.075, 0.180, 0.255), vec3(0.165, 0.325, 0.440), morn);
  vec3 light = mix(vec3(0.120, 0.260, 0.350), vec3(0.230, 0.430, 0.560), morn);
  vec3 cyan  = vec3(0.624, 0.890, 0.961);  // logo cyan
  vec3 red   = vec3(0.878, 0.149, 0.184);  // logo red
  vec3 white = vec3(0.86, 0.95, 1.0);
  vec3 col = mix(deep, ink, smoothstep(0.22, 0.52, f));
  col = mix(col, light, smoothstep(0.55, 0.8, f) * 0.85);
  // thin bright seams where the flow folds, like light running over paint
  col += cyan * pow(smoothstep(0.42, 0.85, w.x * f * 1.6), 3.0) * 0.1;
  // a warm tail-lamp glow drifting low on the page
  col = mix(col, red, smoothstep(0.6, 0.92, g) * (1.0 - smoothstep(0.0, 0.5, uv.y)) * 0.12);

  // light trails: headlamps streaming one way, tail-lamps the other, like a long exposure of a road at night
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
    float y = 0.12 + fi * 0.19 + 0.05 * sin(q.x * 1.3 + fi * 1.7 + f0 * 0.12) + (q.x - asp * 0.5) * 0.08 * (fi - 2.0);
    float d = q.y - y;
    float s = q.x * 0.85 - dir * f0 * (0.16 + 0.1 * h(vec2(fi, 3.0))) + h(vec2(fi, 9.0)) * 10.0;
    float seg = floor(s), p = fract(s);
    float car = step(0.4, h(vec2(seg, fi)));           // some stretches of road are empty
    float pp = dir > 0.0 ? p : 1.0 - p;               // head at the leading end
    float trail = pow(pp, 1.7) * (1.0 - smoothstep(0.95, 1.0, pp)) * car;
    float core = exp(-d * d * 1800.0), halo = exp(-d * d * 160.0);
    vec3 lamp = dir > 0.0 ? mix(cyan, white, 0.5) : red * 1.1;
    float night = 1.0 - dawn * 0.85;                    // the traffic thins as the day comes
    col += lamp * trail * (core * 0.22 + halo * 0.022) * night;
    col += lamp * halo * 0.014 * night;                 // the lane's faint glow, even between cars
  }
  // soft out-of-focus lights drifting upwards, two layers for depth
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float sz = 2.6 + fk * 2.2;
    vec2 bq = q * sz + vec2(f0 * (0.03 + fk * 0.02), -f0 * (0.06 + fk * 0.05)) + fk * 17.0;
    vec2 cell = floor(bq), fr = fract(bq) - 0.5;
    float rn = h(cell + fk * 31.0);
    vec2 off = (vec2(h(cell + 1.3), h(cell + 7.1)) - 0.5) * 0.5;
    float rad = 0.13 + 0.14 * h(cell + 4.2);
    float b = (1.0 - smoothstep(rad * 0.55, rad, length(fr - off))) * step(0.62, rn);
    float tw = 0.55 + 0.45 * sin(f0 * 0.9 + rn * 40.0);
    col += mix(cyan, white, rn) * b * tw * (0.04 - fk * 0.014);
  }

  // the sweep: every 7 seconds a broad band of light glides diagonally across, with a fine bright edge
  float ph = mod(t, 7.0) / 2.2;                        // 2.2 s to cross, then a pause
  float pos = mix(-0.6, asp + 1.1, ph);
  float dx = (q.x + (q.y - 0.5) * 0.55) - pos;
  float on = 1.0 - step(1.0, ph);
  col += mix(cyan, white, 0.6) * on * (exp(-dx * dx * 6.0) * 0.07 + exp(-dx * dx * 220.0) * 0.07);

  // sunrise: rose low on the screen, amber at the horizon, the sky above still blue
  float hz = 1.0 - smoothstep(0.0, 0.92, uv.y);
  vec3 rose = vec3(0.780, 0.380, 0.380), amber = vec3(1.0, 0.690, 0.420);
  col += mix(rose, amber, hz) * hz * hz * dawn * 0.06;

  // gentle vignette keeps the edges deep
  col *= 1.0 - 0.18 * length(uv - 0.5);
  gl_FragColor = vec4(col + (h(gl_FragCoord.xy + t) - 0.5) / 255.0, 1.0);
}`;

export function initBackground() {
  const html = document.documentElement;
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
  const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uD = gl.getUniformLocation(prog, 'd');

  document.body.prepend(canvas);
  html.classList.add('bg-live');

  // sized to the large viewport in CSS (100lvh), so a phone's sliding address bar doesn't resize it;
  // only real size changes (rotation, window resize) reallocate it
  let sizedW = 0, sizedH = 0;
  const size = () => {
    if (innerWidth === sizedW && Math.abs(innerHeight - sizedH) < 160) return false;
    sizedW = innerWidth; sizedH = innerHeight;
    const k = coarse ? 0.2 : 0.25;
    canvas.width = Math.max(48, Math.round(innerWidth * k));
    canvas.height = Math.max(48, Math.round(innerHeight * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uR, canvas.width, canvas.height);
    return true;
  };
  size();

  // the clock only advances while frames are drawn, so the picture carries on where it left off after a pause
  let clock = 10 + Math.random() * 40, last = performance.now(), lastDraw = 0;
  let hour = 0, room = 1;
  // the sky has fully turned by the time the footer's horizon comes up the screen
  const measure = () => {
    const end = document.querySelector('.footer')?.offsetTop ?? document.documentElement.scrollHeight;
    room = Math.max(1, end - innerHeight * 0.5);
  };
  measure();
  addEventListener('load', measure);
  addEventListener('resize', measure, { passive: true });
  setInterval(measure, 2500); // pages grow as photos and lists fill in
  const draw = (now) => {
    clock += Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    hour += (Math.min(1, scrollY / room) - hour) * 0.08;  // eased, so it never jumps with the scroll
    gl.uniform1f(uT, clock);
    gl.uniform1f(uD, hour);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    lastDraw = now;
  };
  draw(performance.now()); // never a blank frame, even while the intro covers the page
  addEventListener('resize', () => { if (size()) draw(performance.now()); }, { passive: true });

  // fade in once the page has finished loading (and, on the home page, once the intro hands over)
  const reveal = () => requestAnimationFrame(() => canvas.classList.add('is-on'));
  const whenLoaded = () => (document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true })));
  whenLoaded().then(() => {
    if (html.classList.contains('play-intro')) addEventListener('v8:intro-done', reveal, { once: true });
    else reveal();
  });

  if (reduced) { addEventListener('scroll', () => { hour = Math.min(1, scrollY / room); draw(performance.now()); }, { passive: true }); return; }
  const minGap = coarse ? 1000 / 30 - 2 : 0;
  let raf = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (html.classList.contains('play-intro')) { last = now; return; } // the intro covers the screen
    if (now - lastDraw < minGap) return;
    draw(now);
  };
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); canvas.remove(); html.classList.remove('bg-live'); });
  start();
}
