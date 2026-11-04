/**
 * Rev the engine with the budget dial. Off until someone asks for it: the speaker button beside the dial turns it
 * on, and it starts on by itself for anyone who pressed Start with the sound on in the intro. It loops a slice of
 * the idle from the same real V8 recording and raises the pitch with the needle; when the needle rests it dies away.
 */
import { $ } from './layout.js';

const ENGINE = new URL('intro/engine.mp3', document.baseURI).href;
const IDLE = [2.1, 3.7]; // seconds of steady idle in the recording

/** The nearest rising zero crossing, so the loop has no click at its seam. */
function zero(data, rate, at) {
  let i = Math.round(at * rate);
  for (let k = 0; k < 4000 && i + 1 < data.length; k++, i++) if (data[i] <= 0 && data[i + 1] > 0) break;
  return i / rate;
}

export function initRevs() {
  const btn = $('[data-dial-sound]');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!btn) return () => {};
  if (!AC) { btn.hidden = true; return () => {}; }
  let ctx = null, src = null, vol = null, on = false, rest = 0;

  const start = async () => {
    ctx ??= new AC();
    await ctx.resume().catch(() => {});
    if (src) return;
    const buffer = await fetch(ENGINE).then((r) => r.arrayBuffer()).then((b) => new Promise((ok, bad) => ctx.decodeAudioData(b, ok, bad))).catch(() => null);
    if (!buffer) { btn.hidden = true; on = false; return; }
    const d = buffer.getChannelData(0);
    vol = ctx.createGain();
    vol.gain.value = 0;
    src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = zero(d, buffer.sampleRate, IDLE[0]);
    src.loopEnd = zero(d, buffer.sampleRate, IDLE[1]);
    src.connect(vol).connect(ctx.destination);
    src.start(0, src.loopStart);
  };
  const quiet = () => vol?.gain.setTargetAtTime(0, ctx.currentTime, 0.28);
  const set = (v) => {
    on = v;
    btn.setAttribute('aria-pressed', String(v));
    btn.setAttribute('aria-label', v ? 'Engine sound on' : 'Engine sound off');
    if (v) start(); else quiet();
  };
  btn.addEventListener('click', () => set(!on));
  addEventListener('v8:sound-on', () => { on = true; btn.setAttribute('aria-pressed', 'true'); });
  // browsers only start sound from a press, so someone who arrived with sound on starts it with their first touch
  $('[data-dial-face]')?.addEventListener('pointerup', () => { if (on && !src) start(); });

  /** p: the needle, 0 to 1 */
  return (p) => {
    if (!on || !src) return;
    const now = ctx.currentTime;
    src.playbackRate.setTargetAtTime(0.8 + p * 1.5, now, 0.07);
    vol.gain.setTargetAtTime(0.75, now, 0.03);
    clearTimeout(rest);
    rest = setTimeout(quiet, 650);
  };
}
