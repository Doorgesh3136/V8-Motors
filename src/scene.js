import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

const STUDIO = new THREE.Color('#e4e6e8');
const BASE = import.meta.env.BASE_URL;

/**
 * Camera "stops" for the scroll walkaround. theta = orbit angle around the car,
 * y = camera height, r = distance, ty = look-at height, shift = horizontal frame offset (fraction of width).
 */
export const STOPS = [
  { theta: 2.4, y: 1.6, r: 9.6, ty: 0.45, shift: -0.22, spin: 0 },
  { theta: 1.57, y: 0.8, r: 9.4, ty: 0.5, shift: -0.22, spin: 0 },
  { theta: -0.8, y: 1.1, r: 9.6, ty: 0.5, shift: -0.2, spin: 0 },
];

/**
 * Device profile. Phones and tablets get a lighter pipeline:
 *  - pixel ratio capped at 1.5 (a 3x phone would otherwise render 9x the pixels)
 *  - no MSAA on high-density screens (the pixels are too small to see jaggies)
 *  - cheap transparent glass instead of transmission (which re-renders the scene every frame)
 *  - lower-poly turntable, 30 fps when nobody is touching the car
 *  - the GPU is asked for "default" power, not "high-performance", to save battery
 */
export function deviceProfile() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 820;
  const mobile = coarse || small;
  const mem = navigator.deviceMemory || 8;
  const saveData = !!navigator.connection?.saveData;
  return {
    mobile,
    // Very low-end or data-saver phones skip the 1.7 MB model and use a photo instead.
    skip3D: saveData || mem <= 2,
    maxDpr: mobile ? 1.5 : 2,
    antialias: window.devicePixelRatio < 2,
  };
}

export function createScene(canvas, { onProgress, reduced, profile = deviceProfile() }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: profile.antialias, powerPreference: profile.mobile ? 'default' : 'high-performance',
  });
  let dpr = Math.min(window.devicePixelRatio, profile.maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new THREE.Scene();
  scene.background = STUDIO;
  scene.fog = new THREE.Fog(STUDIO, 11, 22);

  // Environment lighting baked once, then the generator is thrown away.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose?.();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Turntable rig: everything that rotates when the visitor drags.
  const rig = new THREE.Group();
  scene.add(rig);
  const seg = profile.mobile ? 64 : 128;

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.4, 0.04, seg),
    new THREE.MeshStandardMaterial({ color: '#d9dcdf', roughness: 0.35, metalness: 0.0 }),
  );
  disc.position.y = -0.02;
  rig.add(disc);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.25, 3.28, seg + 32),
    new THREE.MeshBasicMaterial({ color: '#b9bec4', side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  rig.add(ring);

  // Tick marks around the turntable edge, like a dial (one draw call).
  const ticks = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.018, 0.14), new THREE.MeshBasicMaterial({ color: '#a7adb4' }), 72);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -a));
    m.compose(new THREE.Vector3(Math.sin(a) * 3.12, 0.003, Math.cos(a) * 3.12), q, s);
    ticks.setMatrixAt(i, m);
  }
  rig.add(ticks);

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#a3150f', metalness: 1.0, roughness: 0.42, clearcoat: 1.0, clearcoatRoughness: 0.03,
  });
  const detailsMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1.0, roughness: 0.45 });
  const glassMaterial = profile.mobile
    ? new THREE.MeshStandardMaterial({ color: '#1b2026', metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.45 })
    : new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.25, roughness: 0, transmission: 1.0 });

  const wheels = [];
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${BASE}draco/`);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const ready = new Promise((resolve, reject) => {
    loader.load(
      `${BASE}models/ferrari.glb`,
      (gltf) => {
        const car = gltf.scene.children[0];
        car.getObjectByName('body').material = bodyMaterial;
        ['rim_fl', 'rim_fr', 'rim_rr', 'rim_rl', 'trim'].forEach((n) => (car.getObjectByName(n).material = detailsMaterial));
        car.getObjectByName('glass').material = glassMaterial;
        ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].forEach((n) => wheels.push(car.getObjectByName(n)));
        draco.dispose(); // frees the decoder worker once the model is in

        new THREE.TextureLoader().load(`${BASE}models/ferrari_ao.png`, (shadow) => {
          const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
            new THREE.MeshBasicMaterial({ map: shadow, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true }),
          );
          plane.rotation.x = -Math.PI / 2;
          plane.position.y = 0.004;
          plane.renderOrder = 2;
          car.add(plane);
        });

        rig.add(car);
        // Compile shaders now, behind the loading screen, instead of stuttering on the first frame.
        renderer.compile(scene, camera);
        resolve();
      },
      (xhr) => { if (xhr.total) onProgress?.(xhr.loaded / xhr.total); },
      reject,
    );
  });

  // ---------- Camera state, driven by scroll ----------
  const cam = { ...STOPS[0] };
  const target = new THREE.Vector3();
  let width = 0, height = 0, narrow = false;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // Phones fire resize when the address bar slides; ignore small height-only changes
    // (re-allocating the canvas clears it and causes a visible flash).
    if (w === width && Math.abs(h - height) < 120 && profile.mobile && height) return;
    if (w === width && h === height) return;
    width = w; height = h;
    narrow = width < 900;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = narrow ? 42 : 30;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function placeCamera() {
    const r = cam.r * (narrow ? 1.1 : 1);
    camera.position.set(Math.sin(cam.theta) * r, cam.y, Math.cos(cam.theta) * r);
    target.set(0, cam.ty, 0);
    camera.lookAt(target);
    if (narrow) camera.setViewOffset(width, height, 0, -height * 0.13, width, height);
    else camera.setViewOffset(width, height, width * cam.shift, 0, width, height);
  }

  // ---------- Drag to turn, with inertia ----------
  let spin = 0, vel = 0, dragging = false, lastX = 0, idle = 0, lastInput = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; vel = 0;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    vel = dx * 0.006; spin += vel; idle = 0; lastInput = performance.now();
  });
  const stop = () => { dragging = false; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.tabIndex = 0;
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { vel = -0.06; idle = 0; lastInput = performance.now(); }
    if (e.key === 'ArrowRight') { vel = 0.06; idle = 0; lastInput = performance.now(); }
  });

  // ---------- Adaptive resolution ----------
  // If the device can't hold ~45 fps, step the pixel ratio down (never below 1).
  let slowFrames = 0, sampled = 0;
  function adapt(dt) {
    if (dpr <= 1 || sampled > 600) return;
    sampled++;
    if (dt > 1 / 45) slowFrames++;
    if (sampled % 90 === 0) {
      if (slowFrames > 45) {
        dpr = Math.max(1, dpr - 0.25);
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
      }
      slowFrames = 0;
    }
  }

  // ---------- Render loop ----------
  const timer = new THREE.Timer();
  let wheelTurn = 0, scrollSpeed = 0, running = true, skip = false;
  function frame(t) {
    timer.update(t);
    const dt = Math.min(timer.getDelta(), 0.05);
    const interacting = dragging || Math.abs(vel) > 0.0005 || scrollSpeed > 0.01 || performance.now() - lastInput < 400;
    // Phones: 30 fps while the car is just idling on the turntable.
    if (profile.mobile && !interacting) { skip = !skip; if (skip) return; }
    if (!dragging) {
      spin += vel; vel *= 0.94;
      idle += dt;
      if (!reduced && idle > 2.5) spin += dt * 0.12 * Math.min(1, (idle - 2.5) / 2);
    }
    rig.rotation.y = spin + cam.spin;
    wheelTurn += scrollSpeed * 0.02;
    scrollSpeed *= 0.9;
    for (const w of wheels) w.rotation.x = wheelTurn;
    placeCamera();
    renderer.render(scene, camera);
    adapt(dt * (profile.mobile && !interacting ? 0.5 : 1));
  }
  renderer.setAnimationLoop(frame);

  // If the GPU drops the context (common on phones under memory pressure), fall back to the photo.
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    renderer.setAnimationLoop(null);
    document.documentElement.classList.add('no-webgl');
  });

  return {
    ready,
    cam,
    setPaint(hex) {
      const c = new THREE.Color(hex);
      lastInput = performance.now();
      gsap.to(bodyMaterial.color, { r: c.r, g: c.g, b: c.b, duration: reduced ? 0 : 0.9, ease: 'power2.inOut', onUpdate: () => (lastInput = performance.now()) });
    },
    nudgeWheels(v) { scrollSpeed += v; },
    setRunning(on) {
      if (on === running) return;
      running = on;
      renderer.setAnimationLoop(on ? frame : null);
    },
  };
}
