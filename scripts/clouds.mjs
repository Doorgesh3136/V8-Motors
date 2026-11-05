// Draws public/bg/clouds.webp: soft layered cloud that repeats side to side. Only its transparency is used: the site paints
// it the colour of the moment. node scripts/clouds.mjs
import sharp from 'sharp';

const W = 1600, H = 420;
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const smooth = (t) => t * t * (3 - 2 * t);
function layer(cellsX, cellsY) {
  const g = Array.from({ length: cellsY + 1 }, () => Array.from({ length: cellsX }, rnd));
  return (x, y) => {
    const fx = (x / W) * cellsX, fy = (y / H) * cellsY, ix = Math.floor(fx), iy = Math.floor(fy), tx = smooth(fx - ix), ty = smooth(fy - iy);
    const a = g[iy][ix % cellsX], b = g[iy][(ix + 1) % cellsX], c = g[iy + 1][ix % cellsX], d = g[iy + 1][(ix + 1) % cellsX];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}
const octaves = [[5, 4, 1], [11, 9, 0.5], [23, 17, 0.25], [47, 31, 0.12], [95, 60, 0.05]].map(([x, y, a]) => [layer(x, y), a]);
const sum = octaves.reduce((n, [, a]) => n + a, 0);
const px = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  const v = y / H, band = Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.05)), 0.8) * (0.72 + 0.28 * v); // flatter and fuller towards the horizon
  for (let x = 0; x < W; x++) {
    let n = 0;
    for (const [f, a] of octaves) n += f(x, y) * a;
    n /= sum;
    const edge = smooth(Math.min(1, Math.max(0, (n * band - 0.25) / 0.3)));
    const i = (y * W + x) * 4;
    px[i] = px[i + 1] = px[i + 2] = 255;
    px[i + 3] = Math.round(edge * 235);
  }
}
await sharp(px, { raw: { width: W, height: H, channels: 4 } }).blur(2.4).webp({ quality: 60, alphaQuality: 92, effort: 6 }).toFile('public/bg/clouds.webp');
console.log('done');
