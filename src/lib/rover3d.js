/**
 * The Range Rover, live in 3D (public/model/range-rover.glb). This module is the only place three.js is used, and the
 * home page loads it on its own, so no other page pays for it.
 *
 * It keeps no timeline of its own. The home page animates one plain object of numbers (`s`, see DARK and HERO below)
 * with GSAP, on the engine recording's clock, and every frame this file draws whatever those numbers say. That is why
 * the picture can follow the audio exactly, and why scrolling can drive the same scene.
 *
 * Everything that would normally need a heavy effect is faked cheaply, because this has to run on a phone:
 *   reflection   the car is drawn a second time upside down, under a slightly see-through floor
 *   headlights   the pools of light are painted by the floor's shader; the beams are additive cones
 *   studio       the reflections in the paint come from softboxes built in code, so there is no HDRI to download
 */
import {
  AdditiveBlending, BackSide, CanvasTexture, CircleGeometry, Color, ConeGeometry, DirectionalLight, DoubleSide, Group, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShaderMaterial,
  SphereGeometry, Sprite, SpriteMaterial, SRGBColorSpace, Vector3, WebGLRenderer, ACESFilmicToneMapping,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const WHEEL_R = 0.405; // metres, so the wheels roll at exactly the speed the car moves
const LAMP = { x: 0.7, y: 0.99, z: 2.16 }; // headlamp, from the middle of the car
const TAIL = { x: 0.76, y: 1.09, z: -2.5 };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Softboxes for the paint to reflect: a long one overhead, strips down each side, cold rim, a little dawn low down. */
function buildStudio(renderer) {
  const room = new Scene();
  room.background = new Color(0x08161f);
  const box = (w, h, [x, y, z], hex, power) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(power), side: DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0.6, 0);
    room.add(m);
  };
  box(16, 3.2, [0, 9, 0.5], 0xf2f7ff, 9);
  box(16, 0.8, [-10, 3.2, 0], 0xdfeeff, 9);
  box(16, 0.8, [10, 3.2, 0], 0xdfeeff, 9);
  box(5, 1.4, [7, 4, 9], 0xffffff, 5);
  box(14, 1.2, [0, 2.5, -13], 0x5fb6e6, 3.2);
  box(18, 0.5, [0, 0.8, 13], 0xffb27a, 1.1);
  const pm = new PMREMGenerator(renderer);
  const tex = pm.fromScene(room, 0.025).texture;
  pm.dispose();
  return tex;
}

/** Soft lamp glow with a thin lens streak, drawn once. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.08, 'rgba(255,255,255,.7)');
  r.addColorStop(0.24, 'rgba(255,255,255,.2)');
  r.addColorStop(0.55, 'rgba(255,255,255,.045)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const s = g.createLinearGradient(0, 0, 256, 0);
  s.addColorStop(0, 'rgba(255,255,255,0)');
  s.addColorStop(0.5, 'rgba(255,255,255,.9)');
  s.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = s;
  g.fillRect(0, 126, 256, 4);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function buildSky() {
  const mat = new ShaderMaterial({
    side: BackSide, depthWrite: false, toneMapped: false,
    uniforms: { uSky: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `
      varying vec3 vD; uniform float uSky;
      void main(){
        float h = normalize(vD).y;
        vec3 c = mix(vec3(.098,.235,.325), vec3(.035,.102,.15), smoothstep(0., .42, h));
        c += vec3(.06,.12,.16) * exp(-abs(h) * 9.);
        gl_FragColor = vec4(c * uSky, 1.);
      }`,
  });
  return { mesh: new Mesh(new SphereGeometry(70, 32, 16), mat), uniforms: mat.uniforms };
}

function buildFloor() {
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: {
      uSky: { value: 0 }, uBeam: { value: 0 }, uHigh: { value: 0 }, uRed: { value: 0 }, uRoad: { value: 0 }, uRoadGlow: { value: 0 },
      uCarZ: { value: 0 }, uYaw: { value: 0 },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.); }',
    fragmentShader: `
      varying vec3 vP;
      uniform float uSky, uBeam, uHigh, uRed, uRoad, uRoadGlow, uCarZ, uYaw;
      float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
      void main(){
        float d = length(vP.xz);
        vec3 near = vec3(.02,.058,.085), far = vec3(.098,.235,.325) + vec3(.06,.12,.16);
        vec3 c = mix(near, far, smoothstep(5., 44., d)) * uSky;

        // floor position in the car's own space, so the light and the shadow turn with it
        vec2 p = vP.xz - vec2(0., uCarZ);
        float cs = cos(uYaw), sn = sin(uYaw);
        p = vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y);

        // the pool thrown by the headlamps
        float zf = p.y - 2.45;
        if (zf > 0.) {
          float w = 1. + zf * .27;
          float beam = exp(-(p.x * p.x) / (w * w) * 1.5) * exp(-zf * (.2 - .11 * uHigh)) * smoothstep(0., .9, zf);
          c += vec3(.72,.86,1.) * beam * (uBeam * .62 + uHigh * .75);
        }
        // and the tail lights behind
        float zr = -p.y - 2.5;
        if (zr > 0.) c += vec3(.9,.03,.05) * exp(-(p.x * p.x) / 1.6) * exp(-zr * 1.1) * uRed * .3 * smoothstep(0., .4, zr);

        // road markings: only there while you are driving, and lit by the beams
        if (uRoadGlow > .001) {
          float dash = step(fract((vP.z + uRoad) / 5.), .5);
          float side = max(smoothstep(.09, .06, abs(abs(vP.x) - 2.05)) * dash, smoothstep(.07, .05, abs(abs(vP.x) - 3.1)));
          c += vec3(.92,.96,1.) * side * uRoadGlow * smoothstep(40., 8., d) * .75;
        }

        // the car sits on the ground
        float sd = rbox(p, vec2(.92, 2.34), .4);
        float sh = 1. - smoothstep(-.42, .62, sd);
        c *= 1. - .94 * sh;

        // see-through near the car, for the reflection under it; solid further out, and solid under the car
        float a = mix(.8, 1., smoothstep(2.6, 8., d));
        gl_FragColor = vec4(c, max(a, sh * .96));
      }`,
  });
  const mesh = new Mesh(new CircleGeometry(68, 64), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 0;
  return { mesh, uniforms: mat.uniforms };
}

function buildBeam() {
  const h = 15;
  const geo = new ConeGeometry(2.6, h, 28, 1, true);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, h / 2);
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, toneMapped: false,
    uniforms: { uOn: { value: 0 } },
    vertexShader: `
      varying float vL; varying vec3 vN, vV;
      void main(){
        vL = position.z / ${h.toFixed(1)};
        vec4 m = modelViewMatrix * vec4(position, 1.);
        vN = normalize(normalMatrix * normal); vV = normalize(-m.xyz);
        gl_Position = projectionMatrix * m;
      }`,
    fragmentShader: `
      varying float vL; varying vec3 vN, vV; uniform float uOn;
      void main(){
        float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.4);
        float a = pow(1. - vL, 2.1) * smoothstep(0., .03, vL) * f * uOn;
        gl_FragColor = vec4(vec3(.7,.85,1.) * a, a);
      }`,
  });
  return { geo, mat };
}

/** Swaps Blender's export materials for ones tuned for this lighting, and keeps hold of those the scene animates. */
function dress(car) {
  const physical = (src, o) => {
    const m = new MeshPhysicalMaterial({ color: src.color, metalness: src.metalness, roughness: src.roughness, ...o });
    m.name = src.name;
    return m;
  };
  const made = new Map(), lamps = { drl: [], red: [] };
  car.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name.replace('web_', '');
    if (!made.has(name)) {
      const src = o.material;
      let m = src;
      if (name === 'Paint') m = physical(src, { color: 0xf1ece1, metalness: 0, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.14 });
      else if (name === 'Glass') m = physical(src, { color: 0x05090c, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.8, depthWrite: false });
      else if (name === 'Black') m = physical(src, { color: 0x0a0a0b, metalness: 0, roughness: 0.62 });
      else if (name === 'Badge Green') m = physical(src, { color: 0x0a7a44, metalness: 0.2, roughness: 0.2, clearcoat: 1, side: DoubleSide });
      else if (name === 'Chrome' || name === 'Badge Silver') m = physical(src, { color: 0xe6e8ea, metalness: 1, roughness: 0.14, side: DoubleSide });
      else if (name === 'Red Ribbon') m = physical(src, { color: 0xb60d17, metalness: 0, roughness: 0.42, sheen: 0.4, sheenColor: 0xff5a5a, sheenRoughness: 0.5 });
      else if (name === 'PlateText') m = physical(src, { color: 0x070708, metalness: 0, roughness: 0.4 });
      else if (name === 'Plate White') m = physical(src, { color: 0xe8e9ea, metalness: 0, roughness: 0.3, clearcoat: 0.6 });
      else if (name === 'Tyre') m = physical(src, { color: 0x101010, metalness: 0, roughness: 0.82, specularIntensity: 0.3 });
      else if (name === 'Rim') m = physical(src, { color: 0x24272b, metalness: 0.95, roughness: 0.3 });
      else if (name === 'DRL') { m = physical(src, { color: 0xffffff, emissive: 0xdcefff, emissiveIntensity: 0 }); lamps.drl.push(m); }
      else if (/^Tail(Red|Dark)$|^Reflector$/.test(name)) { m = physical(src, { color: src.color, emissive: 0xff0a14, emissiveIntensity: 0 }); lamps.red.push(m); }
      else if (name === 'TailGlass') m = physical(src, { color: 0x520006, transparent: true, opacity: 0.45, depthWrite: false, roughness: 0.08 });
      made.set(name, m);
    }
    o.material = made.get(name);
    if (o.material.transparent) o.renderOrder = 2;
  });
  return lamps;
}

/**
 * @param canvas      the <canvas> to draw on
 * @param s           the numbers the page animates (start from DARK or HERO)
 * @param input       the element that takes drags and taps (null for none)
 * @param onProgress  0..1, the model download
 * @param onTap       a tap on the car
 */
export async function createStage({ canvas, s, input, onProgress = () => {}, onTap = () => {} }) {
  const phone = matchMedia('(pointer: coarse)').matches;
  const modest = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
  const renderer = new WebGLRenderer({ canvas, antialias: !modest, alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x040c12, 1);
  let dpr = Math.min(devicePixelRatio || 1, modest ? 1 : phone ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  scene.environment = buildStudio(renderer);
  const camera = new PerspectiveCamera(28, 1, 0.1, 160);

  const sky = buildSky();
  const floor = buildFloor();
  scene.add(sky.mesh, floor.mesh);

  const key = new DirectionalLight(0xe4f0ff, 0);
  key.position.set(5, 7, 6);
  const rim = new DirectionalLight(0x8fd2f5, 0);
  rim.position.set(-6, 3, -7);
  scene.add(key, rim);

  // ---- the car
  const gltf = await new Promise((ok, bad) => {
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
      new URL('model/range-rover.glb', document.baseURI).href, ok,
      (e) => { if (e.total) onProgress(e.loaded / e.total); }, bad,
    );
  });
  onProgress(1);
  const car = gltf.scene;
  const lamps = dress(car);

  const rig = new Group(); // moves and turns the whole car; the floor light follows it
  rig.add(car);
  scene.add(rig);

  // the reflection: same meshes, same materials, upside down
  const mirror = modest ? null : car.clone(true);
  if (mirror) {
    mirror.scale.y = -1;
    mirror.traverse((o) => { if (o.isMesh) o.renderOrder = -1; });
    rig.add(mirror);
  }
  const bodies = [car.getObjectByName('Body'), mirror?.getObjectByName('Body')].filter(Boolean);
  const wheels = ['FL', 'FR', 'RL', 'RR'].map((k) => {
    const nodes = [car.getObjectByName(`Wheel_${k}`), mirror?.getObjectByName(`Wheel_${k}`)].filter(Boolean);
    nodes.forEach((n) => { n.rotation.order = 'YXZ'; });
    return { nodes, front: k[0] === 'F' };
  });

  // ---- light you can see
  const beam = buildBeam();
  const beams = [-1, 1].map((side) => {
    const m = new Mesh(beam.geo, beam.mat);
    m.position.set(side * LAMP.x, LAMP.y, LAMP.z);
    m.rotation.x = 0.035;
    m.renderOrder = 3;
    rig.add(m);
    return m;
  });
  const glow = glowTexture();
  const sprite = (hex, x, y, z) => {
    const m = new SpriteMaterial({ map: glow, color: hex, blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0, toneMapped: false });
    const sp = new Sprite(m);
    sp.position.set(x, y, z);
    sp.renderOrder = 4;
    rig.add(sp);
    return sp;
  };
  const heads = [sprite(0xdff0ff, -LAMP.x, LAMP.y, LAMP.z), sprite(0xdff0ff, LAMP.x, LAMP.y, LAMP.z)];
  const tails = [sprite(0xff2a30, -TAIL.x, TAIL.y, TAIL.z), sprite(0xff2a30, TAIL.x, TAIL.y, TAIL.z)];

  // ---- framing: where the car sits at each screen shape
  let W = 1, H = 1, base = { dist: 14, sx: 0, sy: 0 };
  const resize = () => {
    const box = canvas.parentElement.getBoundingClientRect();
    W = Math.max(1, Math.round(box.width));
    H = Math.max(1, Math.round(box.height));
    renderer.setSize(W, H, false);
    const aspect = W / H, portrait = aspect < 0.8;
    camera.aspect = aspect;
    const v = Math.tan((camera.fov * Math.PI) / 360), h = v * aspect;
    const short = H < 520 && !portrait; // a landscape phone: the headline fills the left, so the car goes right
    const needW = portrait ? 3.1 : 3.3, needH = portrait ? 3.4 : short ? 3.5 : 2.75;
    base = {
      dist: Math.max(needW / h, needH / v),
      sx: portrait ? 0 : short ? 0.31 : aspect > 1.3 ? 0.12 : 0.05, // pushes the car away from the headline
      sy: portrait ? -0.25 : short ? -0.05 : -0.135,
    };
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();

  // ---- drag to turn the car, and the front wheels look at your pointer
  let spin = 0, spinV = 0, steer = 0, steerTo = 0, lookX = 0, lookY = 0, lookXTo = 0, lookYTo = 0, dragging = false, turned = false;
  if (input) {
    const ignore = (t) => t.closest?.('a, button, input, select, label, .gate');
    let x0 = 0, xs = 0, moved = 0, id = null, last = 0;
    input.addEventListener('pointerdown', (e) => {
      if (ignore(e.target) || e.button) return;
      dragging = true; id = e.pointerId; x0 = xs = e.clientX; moved = 0; spinV = 0; last = performance.now();
    });
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') { lookXTo = (e.clientX / innerWidth - 0.5) * 2; lookYTo = (e.clientY / innerHeight - 0.5) * 2; steerTo = -lookXTo * 0.5; }
      if (!dragging || e.pointerId !== id) return;
      const dx = e.clientX - x0, now = performance.now();
      moved += Math.abs(dx);
      x0 = e.clientX;
      const a = (dx / Math.min(innerWidth, 900)) * Math.PI * 1.5;
      spin += a;
      spinV = a / Math.max(4, now - last) * 16;
      last = now;
      if (Math.abs(e.clientX - xs) > 8) turned = true;
    }, { passive: true });
    const end = (e) => {
      if (!dragging || e.pointerId !== id) return;
      dragging = false;
      if (moved < 8 && e.type === 'pointerup') onTap();
    };
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
  }

  // ---- only draw while it can be seen
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.01 }).observe(canvas.parentElement);

  const t0 = performance.now();
  const forward = new Vector3(), toCam = new Vector3(), lampPos = new Vector3();
  let lastT = t0, slow = 0, lastDraw = 0;

  function draw(force) {
    const now = performance.now();
    if (!force && (!onScreen || document.hidden)) { lastT = now; return; }
    if (!force && modest && now - lastDraw < 30) return; // 30 fps on modest phones
    lastDraw = now;
    const dt = Math.min(0.05, (now - lastT) / 1000), t = (now - t0) / 1000;

    // if this device can't keep up, trade sharpness for smoothness once
    if (dt > 0.03) slow++; else slow = Math.max(0, slow - 0.5);
    if (slow > 40 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); renderer.setSize(W, H, false); slow = 0; }
    lastT = now;

    const f = s.frame;
    // ---- the driver
    if (!dragging) {
      spin += spinV;
      spinV *= 0.94;
      if (Math.abs(spinV) < 0.0002) spinV = 0;
    }
    const k = 1 - Math.pow(0.002, dt);
    steer += (steerTo - steer) * k;
    lookX += (lookXTo - lookX) * k;
    lookY += (lookYTo - lookY) * k;

    const yaw = spin * f + Math.sin(t * 0.13) * 0.035 * f;
    rig.rotation.y = yaw;
    rig.position.z = s.carZ;

    // ---- the engine: the body rocks on its springs while the wheels stay on the ground
    const e = s.rev, shake = e * e * 0.0034 + 0.00032;
    const roll = e * 0.014 + s.jolt * 0.016 + Math.sin(t * 95) * shake * 0.7;
    const pitch = -e * 0.007 - s.jolt * 0.01 + Math.sin(t * 71) * shake * 0.5;
    const bob = Math.sin(t * 118) * shake + e * 0.012;
    for (const b of bodies) { b.rotation.z = roll; b.rotation.x = pitch; }
    bodies[0].position.y = bob;
    if (bodies[1]) bodies[1].position.y = bob;

    // ---- wheels roll as far as the car travels
    const rollAngle = (s.carZ + s.road) / WHEEL_R;
    for (const w of wheels) for (const n of w.nodes) { n.rotation.x = rollAngle; if (w.front) n.rotation.y = steer * f; }

    // ---- lights
    scene.environmentIntensity = s.env;
    scene.environmentRotation.y = t * 0.05;
    key.intensity = s.key * 1.5;
    rim.intensity = s.key * 1.1;
    for (const m of lamps.drl) m.emissiveIntensity = s.drl * 5 + s.high * 9;
    for (const m of lamps.red) m.emissiveIntensity = s.red * 4.5;
    sky.uniforms.uSky.value = s.sky;
    const u = floor.uniforms;
    u.uSky.value = s.sky; u.uBeam.value = s.beam; u.uHigh.value = s.high; u.uRed.value = s.red;
    u.uRoad.value = s.road; u.uRoadGlow.value = s.roadGlow; u.uCarZ.value = s.carZ; u.uYaw.value = yaw;
    beam.mat.uniforms.uOn.value = s.beam * 0.34 + s.high * 0.6;

    // ---- the camera
    const b = base;
    const d = lerp(s.near, b.dist, f);
    const az = s.az + lookX * 0.05 * f, el = s.el + lookY * 0.016 * f;
    const cx = s.tx + Math.sin(az) * Math.cos(el) * d;
    const cz = s.tz + Math.cos(az) * Math.cos(el) * d;
    const cy = Math.max(0.16, s.ty + Math.sin(el) * d);
    const jit = e * e * 0.004;
    camera.position.set(cx + (Math.random() - 0.5) * jit, cy + (Math.random() - 0.5) * jit, cz);
    camera.up.set(Math.sin(s.roll), Math.cos(s.roll), 0);
    camera.lookAt(s.tx, s.ty, s.tz);
    camera.setViewOffset(W, H, -b.sx * f * W, -b.sy * f * H, W, H);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // ---- lens glow: only from a lamp that faces the camera
    forward.set(Math.sin(yaw), 0, Math.cos(yaw));
    lampPos.set(0, 1, s.carZ);
    toCam.copy(camera.position).sub(lampPos).normalize();
    const facing = forward.dot(toCam);
    const front = smooth(0.05, 0.75, facing), back = smooth(0.05, 0.75, -facing);
    const hot = s.drl * 0.2 + s.beam * 0.34 + s.high;
    heads.forEach((sp) => {
      sp.material.opacity = clamp(hot, 0, 1) * front;
      const size = 0.5 + s.high * 2.6 + e * 0.4;
      sp.scale.set(size, size, 1);
    });
    tails.forEach((sp) => { sp.material.opacity = s.red * 0.5 * back; sp.scale.set(0.8, 0.8, 1); });

    renderer.render(scene, camera);
  }

  renderer.compile(scene, camera);
  draw(true);
  canvas.classList.add('is-live');

  return {
    draw,
    /** Where the headlamps are on screen, as a height in pixels, for the lens streak drawn in the page. */
    lampY() {
      lampPos.set(0, LAMP.y, s.carZ + LAMP.z).project(camera);
      return (1 - lampPos.y) * 0.5 * H;
    },
    get turned() { return turned; },
  };
}
