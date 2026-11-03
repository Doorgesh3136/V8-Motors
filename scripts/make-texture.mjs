// Generates public/bg/texture.png: a seamless 192 px tile of fine carbon-fibre twill with film grain,
// laid over the site's background gradient at low opacity. Run once: node scripts/make-texture.mjs
import sharp from 'sharp';

const N = 192, C = 6; // tile size, thread width (N is a multiple of 4 * C so the twill repeats seamlessly)
const px = Buffer.alloc(N * N * 4);
let seed = 8;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const i = Math.floor(x / C), j = Math.floor(y / C);
    const across = ((i + j) & 3) < 2; // 2x2 twill: threads alternate direction on a diagonal
    const t = ((across ? y : x) % C) / C; // position across the thread
    const thread = Math.sin(Math.PI * t) * 0.9 - 0.35; // rounded thread: lit in the middle, dark in the gaps
    const sheen = across ? 0.18 : -0.12; // the two directions catch the light differently
    const grain = (rnd() - 0.5) * 0.7;
    const v = Math.max(-1, Math.min(1, thread * 0.55 + sheen + grain));
    const o = (y * N + x) * 4;
    const c = v > 0 ? 255 : 0;
    px[o] = px[o + 1] = px[o + 2] = c;
    px[o + 3] = Math.round(Math.abs(v) * 26);
  }
}
await sharp(px, { raw: { width: N, height: N, channels: 4 } }).png({ compressionLevel: 9, palette: true, colours: 64 }).toFile('public/bg/texture.png');
console.log('public/bg/texture.png');
