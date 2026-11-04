/**
 * The page background: a smooth petrol-blue gradient that slowly flows on its own, drawn by a tiny WebGL
 * shader. No texture, no particles: just soft fields of colour drifting past each other, and every few
 * seconds a broad sweep of light gliding across, like light running over a car's paint in a showroom.
 * Nothing in it reacts to touch, the mouse, tilt or scrolling.
 *
 * - It is dithered, so the gradient never shows bands, even on cheap phone screens.
 * - It renders at a fifth of the screen's resolution (a soft gradient upscales invisibly), at 30 fps on
 *   touch devices, and pauses while the tab is hidden or the intro covers the screen.
 * - The first frame is drawn straight away and faded in once the page has finished loading, over the
 *   matching CSS gradient underneath, so the background never pops. Without WebGL that CSS gradient
 *   is what you see; with reduced motion, one still frame.
 */
const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r;   // canvas size
uniform float t;  // seconds

float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}
// a soft round field of colour
float field(vec2 q, vec2 c, float rad) { vec2 d = q - c; return exp(-dot(d, d) / (rad * rad)); }

void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 q = vec2(uv.x * asp, uv.y);
  // a very gentle, slow warp keeps the fields organic without any visible texture
  q += 0.06 * vec2(n(q * 1.3 + t * 0.05) - 0.5, n(q * 1.3 + 7.3 - t * 0.04) - 0.5);

  vec3 top    = vec3(0.157, 0.329, 0.447);   // #285472
  vec3 bottom = vec3(0.098, 0.227, 0.322);   // #193a52
  vec3 col = mix(bottom, top, smoothstep(0.0, 1.0, uv.y));

  // drifting fields: a lit petrol bloom, a cool cyan haze, a deep navy pool and a faint warm tail-lamp glow
  vec2 c1 = vec2(asp * (0.30 + 0.12 * sin(t * 0.050)), 0.72 + 0.10 * cos(t * 0.043));
  vec2 c2 = vec2(asp * (0.78 + 0.10 * cos(t * 0.037)), 0.58 + 0.14 * sin(t * 0.061));
  vec2 c3 = vec2(asp * (0.62 + 0.16 * sin(t * 0.029 + 1.7)), 0.12 + 0.08 * cos(t * 0.047));
  vec2 c4 = vec2(asp * (0.12 + 0.08 * cos(t * 0.041 + 0.6)), 0.10 + 0.06 * sin(t * 0.053));
  col = mix(col, vec3(0.243, 0.459, 0.604), field(q, c1, 0.55 * max(asp, 1.0)) * 0.75);  // #3e759a
  col = mix(col, vec3(0.306, 0.588, 0.706), field(q, c2, 0.42 * max(asp, 1.0)) * 0.38);  // #4e96b4
  col = mix(col, vec3(0.063, 0.161, 0.239), field(q, c3, 0.60 * max(asp, 1.0)) * 0.55);  // #10293d
  col = mix(col, vec3(0.545, 0.180, 0.220), field(q, c4, 0.38 * max(asp, 1.0)) * 0.16);  // a hint of the logo red

  // the showroom sweep: every 8 seconds a broad, soft band of light glides diagonally across
  float ph = mod(t, 8.0) / 2.6;
  float pos = mix(-0.7, asp + 1.2, ph);
  float dx = (q.x + (q.y - 0.5) * 0.6) - pos;
  float sweep = (1.0 - step(1.0, ph)) * exp(-dx * dx * 5.0);
  col += vec3(0.62, 0.82, 0.92) * sweep * 0.085;

  // a soft vignette, then dither so the gradient never bands
  col *= 1.0 - 0.16 * pow(length(uv - vec2(0.5, 0.55)), 1.6);
  col += (h(gl_FragCoord.xy + fract(t) * 61.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
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
  const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't');

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
  const draw = (now) => {
    clock += Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    gl.uniform1f(uT, clock);
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

  if (reduced) return;
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
