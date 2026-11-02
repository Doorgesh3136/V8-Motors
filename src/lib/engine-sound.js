// A V8 engine synthesised live with the Web Audio API (no audio files to download).
// The intro timeline drives it: set(rpm, throttle) every frame, so sound and picture can't drift apart.
//
// Voice: firing-frequency sawtooth (rpm / 60 * 4 for a four-stroke V8) for the bark, a square wave at half
// that rate for the uneven cross-plane burble, a sine sub for weight, all through a soft-clipping shaper and a
// low-pass "exhaust" filter that opens with throttle. Filtered noise adds exhaust rush. A separate starter-motor
// voice cranks before the engine catches, and a low thump marks ignition.

function softClip(k) {
  const n = 2048, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
  return curve;
}

export function createEngine() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const now = () => ctx.currentTime;
  const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };

  const master = gain(0);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  master.connect(comp).connect(ctx.destination);

  // ---- engine
  const shaper = ctx.createWaveShaper(); shaper.curve = softClip(3); shaper.oversample = '4x';
  const exhaust = ctx.createBiquadFilter(); exhaust.type = 'lowpass'; exhaust.Q.value = 1.1; exhaust.frequency.value = 300;
  const rumble = ctx.createBiquadFilter(); rumble.type = 'peaking'; rumble.frequency.value = 120; rumble.gain.value = 5; rumble.Q.value = 0.8;
  // presence: small phone and laptop speakers can't play the 25-60 Hz fundamentals, so lift the band they can
  const presence = ctx.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 260; presence.gain.value = 7; presence.Q.value = 0.9;
  const subCut = ctx.createBiquadFilter(); subCut.type = 'highpass'; subCut.frequency.value = 38; subCut.Q.value = 0.7;
  const wobble = gain(1);   // burble modulates this stage, the engine gain below switches the voice on and off
  const engine = gain(0);
  shaper.connect(exhaust).connect(rumble).connect(presence).connect(subCut).connect(wobble).connect(engine).connect(master);

  const fire = ctx.createOscillator(); fire.type = 'sawtooth';
  const half = ctx.createOscillator(); half.type = 'square';
  const sub = ctx.createOscillator(); sub.type = 'sine';
  const gFire = gain(0.55), gHalf = gain(0.3), gSub = gain(0.3);
  fire.connect(gFire).connect(shaper);
  half.connect(gHalf).connect(shaper);
  sub.connect(gSub).connect(rumble);
  // burble: wobble the engine level a little, faster with revs
  const burble = ctx.createOscillator(); burble.type = 'triangle'; burble.frequency.value = 6;
  const burbleDepth = gain(0.18);
  burble.connect(burbleDepth).connect(wobble.gain);

  // exhaust rush (noise)
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;
  const rush = ctx.createBiquadFilter(); rush.type = 'bandpass'; rush.Q.value = 0.9; rush.frequency.value = 400;
  const gRush = gain(0);
  noise.connect(rush).connect(gRush).connect(master);

  // ---- starter motor: a whine chopped by the compression strokes
  const starter = ctx.createOscillator(); starter.type = 'sawtooth'; starter.frequency.value = 135;
  const chop = ctx.createOscillator(); chop.type = 'square'; chop.frequency.value = 9;
  const chopDepth = gain(0.45);
  const starterLp = ctx.createBiquadFilter(); starterLp.type = 'lowpass'; starterLp.frequency.value = 900;
  const chopStage = gain(0.55); // compression strokes chop this stage; gStarter switches the motor on and off
  const gStarter = gain(0);
  chop.connect(chopDepth).connect(chopStage.gain);
  starter.connect(starterLp).connect(chopStage).connect(gStarter).connect(master);

  [fire, half, sub, burble, noise, starter, chop].forEach((o) => o.start());

  let rpmNow = 0;
  return {
    ctx,
    async start() { if (ctx.state !== 'running') await ctx.resume(); master.gain.setTargetAtTime(0.85, now(), 0.05); },
    crank(on) {
      gStarter.gain.cancelScheduledValues(now());
      gStarter.gain.setTargetAtTime(on ? 0.32 : 0, now(), on ? 0.03 : 0.04);
    },
    /** The engine catches: a low thump and a burst of noise. */
    ignite() {
      const t = now();
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.35);
      const g = gain(0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.55);
      gRush.gain.setValueAtTime(0.35, t); gRush.gain.setTargetAtTime(0.05, t + 0.05, 0.12);
    },
    /** rpm: 0 to 7000. throttle: 0 to 1. Called every animation frame by the intro timeline. */
    set(rpm, throttle = 0) {
      const t = now();
      rpmNow = rpm;
      const f = Math.max(1, (rpm / 60) * 4);
      fire.frequency.setTargetAtTime(f, t, 0.025);
      half.frequency.setTargetAtTime(f / 2, t, 0.025);
      sub.frequency.setTargetAtTime(f, t, 0.03);
      exhaust.frequency.setTargetAtTime(220 + rpm * 0.32 + throttle * 1400, t, 0.04);
      burble.frequency.setTargetAtTime(4 + rpm / 260, t, 0.1);
      burbleDepth.gain.setTargetAtTime(Math.max(0.03, 0.2 - rpm / 30000), t, 0.1);
      const running = rpm > 200 ? 1 : 0;
      engine.gain.setTargetAtTime(running * (0.32 + throttle * 0.38), t, 0.04);
      rush.frequency.setTargetAtTime(250 + rpm * 0.18, t, 0.05);
      gRush.gain.setTargetAtTime(running * (0.03 + throttle * 0.16), t, 0.05);
    },
    get rpm() { return rpmNow; },
    stop(fade = 1.4) {
      const t = now();
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0, t, fade / 4);
      setTimeout(() => ctx.close().catch(() => {}), fade * 1000 + 300);
    },
  };
}
