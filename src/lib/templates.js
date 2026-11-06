// Pure HTML templates (no DOM access). Used at build time to pre-render pages,
// and in the browser where content has to be redrawn.
import { CARS, DEALER, BODY_TYPES, rs, km, monthly, carName, thumb, large } from '../data.js';
import { fmtTime } from './hours.js';

export const SITE = 'https://webluxe.github.io/V8-Motors/';
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const carUrl = (c, P = '') => `${P}cars/${c.id}.html`;

/* ------------------------------------------------------------------ icons */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  heart: svg('<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/>'),
  scales: svg('<path d="M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7Zm10 0-3 7a3 3 0 0 0 6 0l-3-7ZM12 4v16M8 20h8"/>'),
  share: svg('<path d="M12 3v12M7 8l5-5 5 5M5 13v6h14v-6"/>'),
  arrowL: svg('<path d="M15 5l-7 7 7 7"/>'),
  arrowR: svg('<path d="M9 5l7 7-7 7"/>'),
  expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  chat: svg('<path d="M4 5h16v11H9l-5 4V5Z"/>'),
  car: svg('<path d="M3 15v-3l2-5h14l2 5v3M3 15h18v3h-3v-2H6v2H3v-3Z"/><circle cx="7.5" cy="13" r="1"/><circle cx="16.5" cy="13" r="1"/>'),
  tag: svg('<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8.5" r="1.3"/>'),
  coin: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.2c.4-1 1.4-1.6 2.6-1.6 1.6 0 2.6.9 2.6 2 0 2.7-5.2 1.6-5.2 4.4 0 1.1 1 2 2.6 2 1.2 0 2.2-.6 2.6-1.6M12 6v1.6M12 16v2"/>'),
  pin: svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
  gauge: svg('<path d="M4 16a8 8 0 1 1 16 0M12 16l4-5"/>'),
  engine: svg('<path d="M4 10h3l2-3h6v3h3v3h2v-3M4 10v6h3l2 2h7v-5M4 13H2"/>'),
  bolt: svg('<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>'),
  gear: svg('<path d="M6 4v16M12 4v16M18 4v8M6 12h12"/>'),
  fuel: svg('<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M8 8h3"/>'),
  seat: svg('<path d="M7 3h4l1 9H8L7 3ZM8 12l-1 4h10M17 16v4M7 16v4"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  shield: svg('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  palette: svg('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s3 0 4-1 3-2 3-4a8 8 0 0 0-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="8.5" r="1"/>'),
  wheel: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4v5.5M4.5 14.5l5-1.5M19.5 14.5l-5-1.5"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  reel: svg('<rect x="6" y="3.5" width="12" height="17" rx="2.5"/><path d="m10.5 9.5 4 2.5-4 2.5v-5Z"/>'),
  mail: svg('<path d="M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5"/>'),
  route: svg('<path d="M6 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8.5 16.5h7a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H15"/>'),
  whatsapp: svg('<path d="M4.5 19.5l1.1-3.6A8 8 0 1 1 8.3 18.6l-3.8.9Z"/><path d="M9.2 8.6c.3-.6.6-.6.9-.6h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.4 0 .6.6 1 1.4 1.8 2.4 2.3.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4 0 .3 0 1-.5 1.5-.5.5-1.6.9-2.6.6a9 9 0 0 1-5.1-4.5c-.6-1.3-.4-2.3.2-3.1Z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  door: svg('<path d="M5 20V8l6-4h8v16H5ZM5 12h14M15 15h2"/>'),
};

/* ------------------------------------------------------------------ brand mark: the dealership's own V8 logo */
export const markSVG = (cls = 'mark', P = '') => `<img class="${cls}" src="${P}brand/v8-mark-sm.png" width="182" height="172" alt="" decoding="async">`;

/* ------------------------------------------------------------------ body shapes */
// Side views at one true scale (1 m = 40 units), so a van really is bigger than a hatchback. Painted as cartoons by src/glass.css:
// flat paint and an ink outline. Drawn by scripts/shapes.mjs, which holds each car as a list of points.
const SHAPES = {"Hatchback":{"b":"M19 80Q17 80 16.4 78.1L14.9 72.9Q14 70 14.4 67L15.4 58Q16 53 19 49L24.8 41.3Q28 37 33 35L33 35Q38 33 43.4 32.9L73.9 32.2Q84 32 94 33.5L97.1 34Q104 35 110 38.6L123.7 46.8Q134 53 145.8 55.2L160.1 57.9Q166 59 170.5 63L170.5 63Q175 67 174.1 72.9L173.3 78Q173 80 171 80L161.5 80A17.7 17.7 0 0 0 126.5 80L63.5 80A17.7 17.7 0 0 0 28.5 80Z","u":"M17 69.9Q14 70 14.4 67L15.4 58Q16 53 19 49L24.8 41.3Q28 37 33 35L33 35Q38 33 43.4 32.9L73.9 32.2Q84 32 94 33.5L97.1 34Q104 35 110 38.6L123.7 46.8Q134 53 145.8 55.2L160.1 57.9Q166 59 170.5 63L170.5 63Q175 67 169 67.1","s":"M26 55C70.9 53 117.8 59 154 62","g":"M36 52Q34 52 34.7 50.1L37.7 41.8Q39 38 43 37.7L60 36.2Q62 36 62 38L62 50Q62 52 60 52ZM66 38Q66 36 68 36L86 36Q90 36 93.9 36.7L98 37.5Q101 38 103.4 39.8L117.6 50.2Q120 52 117 52L68 52Q66 52 66 50Z","l":"M64 37V76M101 54L104 76","h":"M159.2 62.6Q158 61 160 61.3L169.4 62.8Q171 63 171.5 64.5L171.7 65.1Q172 66 171 66L164 66Q162 66 160.8 64.4Z","t":"M15.8 56Q16 55 17 54.9L23 54.1Q24 54 23.7 55L22.3 60Q22 61 21 61L16 61Q15 61 15.2 60Z","d":"M70 58h7M92 58h7","w":[[46,77.5,14.5,9.9,"M46.4 75.4L46.8 68.3L45.2 68.3L45.6 75.4ZM48.1 77.3L55 75.4L54.5 73.9L47.8 76.5ZM46.9 79.4L50.8 85.5L52.1 84.5L47.5 78.9ZM44.5 78.9L39.9 84.5L41.2 85.5L45.1 79.4ZM44.2 76.5L37.5 73.9L37 75.4L43.9 77.3Z"],[144,77.5,14.5,9.9,"M144.4 75.4L144.8 68.3L143.2 68.3L143.6 75.4ZM146.1 77.3L153 75.4L152.5 73.9L145.8 76.5ZM144.9 79.4L148.8 85.5L150.1 84.5L145.5 78.9ZM142.5 78.9L137.9 84.5L139.2 85.5L143.1 79.4ZM142.2 76.5L135.5 73.9L135 75.4L141.9 77.3Z"]]},"Sedan":{"b":"M19 81Q17 81 16.5 79.1L14.7 71.9Q14 69 14.2 66L14.8 60Q15 57 17.3 55.1L18 54.5Q21 52 24.9 51.7L40 50.7Q50 50 58.9 45.5L68.1 41Q78 36 89 34.5L89.1 34.5Q100 33 111 33.5L115 33.7Q122 34 128.1 37.4L143.5 46.1Q154 52 165.9 53.9L185.7 57Q192 58 196.5 62.5L196.8 62.8Q201 67 200.2 72.9L199.3 79Q199 81 197 81L177.4 81A17.7 17.7 0 0 0 142.6 81L67.4 81A17.7 17.7 0 0 0 32.6 81Z","u":"M17 69Q14 69 14.2 66L14.8 60Q15 57 17.3 55.1L18 54.5Q21 52 24.9 51.7L40 50.7Q50 50 58.9 45.5L68.1 41Q78 36 89 34.5L89.1 34.5Q100 33 111 33.5L115 33.7Q122 34 128.1 37.4L143.5 46.1Q154 52 165.9 53.9L185.7 57Q192 58 196.5 62.5L196.8 62.8Q201 67 195 67.1","s":"M29 55C81.3 53 135.5 58 178 61","g":"M58 50.1Q56 50 57.8 49.1L76.4 39.8Q80 38 84 37.6L96 36.2Q98 36 98 38L98 50Q98 52 96 51.9ZM102 38Q102 36 104 36.1L119 36.9Q122 37 124.4 38.8L139.6 50.2Q142 52 139 52L104 52Q102 52 102 50Z","l":"M100 37V77M144 54L146 77","h":"M183.1 61.7Q182 60 184 60.4L195.4 62.7Q197 63 197.5 64.5L197.7 65.1Q198 66 197 66L188 66Q186 66 184.9 64.3Z","t":"M15 57Q15 56 16 55.8L26 54.2Q27 54 26.8 55L26.2 59Q26 60 25 60.1L16 60.9Q15 61 15 60Z","d":"M78 58h7M118 58h7","w":[[50,77.5,14.5,9.9,"M50.4 75.4L50.8 68.3L49.2 68.3L49.6 75.4ZM52.1 77.3L59 75.4L58.5 73.9L51.8 76.5ZM50.9 79.4L54.8 85.5L56.1 84.5L51.5 78.9ZM48.5 78.9L43.9 84.5L45.2 85.5L49.1 79.4ZM48.2 76.5L41.5 73.9L41 75.4L47.9 77.3Z"],[160,77.5,14.5,9.9,"M160.4 75.4L160.8 68.3L159.2 68.3L159.6 75.4ZM162.1 77.3L169 75.4L168.5 73.9L161.8 76.5ZM160.9 79.4L164.8 85.5L166.1 84.5L161.5 78.9ZM158.5 78.9L153.9 84.5L155.2 85.5L159.1 79.4ZM158.2 76.5L151.5 73.9L151 75.4L157.9 77.3Z"]]},"SUV":{"b":"M21 76Q19 76 18.3 74.1L15.3 65.8Q14 62 14.2 58L14.7 51Q15 46 17.3 41.6L20.3 36.1Q24 29 31.6 26.6L32 26.5Q40 24 48.4 23.8L99.9 22.2Q108 22 116 23L117.1 23.1Q124 24 129.7 28.1L140.3 35.9Q150 43 161.9 44.2L181.8 46.2Q190 47 197.5 50.5L199 51.2Q205 54 206.5 60.5L206.9 62.4Q208 67 206.5 71.5L205.6 74.1Q205 76 203 76L190.2 76A20.2 20.2 0 0 0 149.8 76L72.2 76A20.2 20.2 0 0 0 31.8 76Z","u":"M18 62.1Q14 62 14.2 58L14.7 51Q15 46 17.3 41.6L20.3 36.1Q24 29 31.6 26.6L32 26.5Q40 24 48.4 23.8L99.9 22.2Q108 22 116 23L117.1 23.1Q124 24 129.7 28.1L140.3 35.9Q150 43 161.9 44.2L181.8 46.2Q190 47 197.5 50.5L199 51.2Q205 54 206.5 60.5L206.9 62.1Q208 67 203 66.9","s":"M26 48C80.7 46 137.4 47 182 50","g":"M28 44.9Q26 45 26.9 43.2L31.2 34.6Q33 31 37 30.5L54 28.3Q56 28 56 30L56 42Q56 44 54 44.1ZM60 30Q60 28 62 27.9L90 26.1Q92 26 92 28L92 41Q92 43 90 43.1L62 43.9Q60 44 60 42ZM96 28Q96 26 98 25.9L111 25.2Q115 25 118.8 26.3L121.2 27.1Q124 28 126.2 30L136.8 40Q139 42 136 42.1L98 43Q96 43 96 41Z","l":"M58 28V72M94 27V72M141 44L146 72","h":"M187.3 50.5Q186 49 187.9 49.6L200.5 53.5Q202 54 202.5 55.5L202.7 56.1Q203 57 202 56.9L194 56.2Q192 56 190.7 54.5Z","t":"M14 48Q14 47 15 47L23 47Q24 47 23.6 47.9L21.4 54.1Q21 55 20 55L15 55Q14 55 14 54Z","d":"M66 51h7M102 50h7","w":[[52,75,17,11.6,"M52.4 72.9L53 64.2L51 64.2L51.6 72.9ZM54.1 74.8L62.6 72.6L62 70.7L53.8 74ZM52.9 76.9L57.6 84.3L59.2 83.2L53.5 76.4ZM50.5 76.4L44.8 83.2L46.4 84.3L51.1 76.9ZM50.2 74L42 70.7L41.4 72.6L49.9 74.8Z"],[170,75,17,11.6,"M170.4 72.9L171 64.2L169 64.2L169.6 72.9ZM172.1 74.8L180.6 72.6L180 70.7L171.8 74ZM170.9 76.9L175.6 84.3L177.2 83.2L171.5 76.4ZM168.5 76.4L162.8 83.2L164.4 84.3L169.1 76.9ZM168.2 74L160 70.7L159.4 72.6L167.9 74.8Z"]],"r":"M44 21.5C70 19 92 19 110 19.5"},"MPV":{"b":"M19 80Q17 80 16.5 78.1L14.1 69.8Q13 66 13.3 62L14.5 49Q15 43 17.8 37.7L19.9 33.9Q23 28 29.5 26.5L29.5 26.5Q36 25 42.7 25L91.9 25Q100 25 108 26.5L108.1 26.5Q116 28 122.8 32.2L139.8 42.7Q150 49 161.8 51.2L173.8 53.5Q182 55 189 59.5L192.6 61.8Q196 64 196 68L196 68Q196 72 195 75.9L194.5 78.1Q194 80 192 80L176 80A18.2 18.2 0 0 0 140 80L68 80A18.2 18.2 0 0 0 32 80Z","u":"M17 66.1Q13 66 13.3 62L14.5 49Q15 43 17.8 37.7L19.9 33.9Q23 28 29.5 26.5L29.5 26.5Q36 25 42.7 25L91.9 25Q100 25 108 26.5L108.1 26.5Q116 28 122.8 32.2L139.8 42.7Q150 49 161.8 51.2L173.8 53.5Q182 55 189 59.5L192.6 61.8Q196 64 196 68L196 68Q196 72 192 71.9","s":"M25 48C76.5 46 130.1 55 172 58","g":"M25 46Q23 46 23.8 44.2L28.4 33.7Q30 30 34 29.8L50 29.1Q52 29 52 31L52 44Q52 46 50 46ZM56 31Q56 29 58 29L78 29Q80 29 80 31L80 44Q80 46 78 46L58 46Q56 46 56 44ZM84 31Q84 29 86 29L98 29Q102 29 105.9 30L111.1 31.3Q114 32 116.2 34L128.8 45Q131 47 128 47L86 47Q84 47 84 45Z","l":"M54 29V75M82 29V75M133 49L136 75","h":"M177.2 58.6Q176 57 177.9 57.6L190.5 61.5Q192 62 192.5 63.5L192.7 64.1Q193 65 192 65L184 65Q182 65 180.8 63.4Z","t":"M14 48Q14 47 15 47L22 47Q23 47 22.7 47.9L20.3 55.1Q20 56 19 56L15 56Q14 56 14 55Z","d":"M60 54h7M90 54h7","w":[[50,77,15,10.2,"M50.4 74.9L50.9 67.5L49.1 67.5L49.6 74.9ZM52.1 76.8L59.3 74.9L58.8 73.2L51.8 76ZM50.9 78.9L54.9 85.2L56.3 84.2L51.5 78.4ZM48.5 78.4L43.7 84.2L45.1 85.2L49.1 78.9ZM48.2 76L41.2 73.2L40.7 74.9L47.9 76.8Z"],[158,77,15,10.2,"M158.4 74.9L158.9 67.5L157.1 67.5L157.6 74.9ZM160.1 76.8L167.3 74.9L166.8 73.2L159.8 76ZM158.9 78.9L162.9 85.2L164.3 84.2L159.5 78.4ZM156.5 78.4L151.7 84.2L153.1 85.2L157.1 78.9ZM156.2 76L149.2 73.2L148.7 74.9L155.9 76.8Z"]]},"Pickup":{"b":"M19 76Q17 76 16.5 74.1L13.8 64.9Q13 62 13.2 59L13.9 47Q14 45 16 45L82 45Q84 45 84.2 43L85.6 29.9Q86 26 89 23.5L89 23.5Q92 21 95.9 21L124.8 21Q132 21 139 22.5L139.2 22.5Q146 24 151.5 28.3L160.6 35.6Q170 43 181.9 44.1L203.7 46.2Q212 47 219 51.5L221.4 53Q226 56 226.5 61.5L226.6 62.3Q227 67 225.5 71.5L224.6 74.1Q224 76 222 76L204.2 76A20.2 20.2 0 0 0 163.8 76L74.2 76A20.2 20.2 0 0 0 33.8 76Z","u":"M16 62.1Q13 62 13.2 59L13.9 47Q14 45 16 45L82 45Q84 45 84.2 43L85.6 29.9Q86 26 89 23.5L89 23.5Q92 21 95.9 21L124.8 21Q132 21 139 22.5L139.2 22.5Q146 24 151.5 28.3L160.6 35.6Q170 43 181.9 44.1L203.7 46.2Q212 47 219 51.5L221.4 53Q226 56 226.5 61.5L226.5 62Q227 67 222 66.9","s":"M23 49C87.1 47 153.3 47 206 50","g":"M91.7 28Q92 25 95 25L110 25Q112 25 112 27L112 43Q112 45 110 45L93 45Q90 45 90.3 42ZM116 27Q116 25 118 25L132 25Q136 25 139.8 26.3L142.2 27.1Q145 28 146.9 30.3L157.1 42.7Q159 45 156 45L118 45Q116 45 116 43Z","l":"M114 25V72M161 47L164 72M84 45V70","h":"M210.8 50.8Q210 49 211.9 49.7L221.1 53.3Q223 54 223.5 55.9L223.8 57Q224 58 223 58L216 58Q214 58 213.2 56.2Z","t":"M13.1 49Q13 48 14 48L20 48Q21 48 20.9 49L20.1 56Q20 57 19 57L15 57Q14 57 13.9 56Z","d":"M94 51h7M122 51h7","w":[[54,75,17,11.6,"M54.4 72.9L55 64.2L53 64.2L53.6 72.9ZM56.1 74.8L64.6 72.6L64 70.7L55.8 74ZM54.9 76.9L59.6 84.3L61.2 83.2L55.5 76.4ZM52.5 76.4L46.8 83.2L48.4 84.3L53.1 76.9ZM52.2 74L44 70.7L43.4 72.6L51.9 74.8Z"],[184,75,17,11.6,"M184.4 72.9L185 64.2L183 64.2L183.6 72.9ZM186.1 74.8L194.6 72.6L194 70.7L185.8 74ZM184.9 76.9L189.6 84.3L191.2 83.2L185.5 76.4ZM182.5 76.4L176.8 83.2L178.4 84.3L183.1 76.9ZM182.2 74L174 70.7L173.4 72.6L181.9 74.8Z"]]},"Van":{"b":"M19 78Q17 78 16.7 76L14.7 63.9Q14 60 14.1 56L14.8 30Q15 24 18.4 19.1L18.5 19Q22 14 28 13.1L29 13Q36 12 43.1 12.1L141.9 12.9Q150 13 158 14.5L158 14.5Q166 16 172 21.5L186.8 35.3Q194 42 203 46L204.9 46.8Q212 50 217 56L218.8 58.2Q222 62 222 67L222 68.8Q222 72 221 75L220.6 76.1Q220 78 218 78L200.2 78A18.2 18.2 0 0 0 163.8 78L68.2 78A18.2 18.2 0 0 0 31.8 78Z","u":"M18 60.2Q14 60 14.1 56L14.8 30Q15 24 18.4 19.1L18.5 19Q22 14 28 13.1L29 13Q36 12 43.1 12.1L141.9 12.9Q150 13 158 14.5L158 14.5Q166 16 172 21.5L186.8 35.3Q194 42 203 46L204.9 46.8Q212 50 217 56L218.8 58.2Q222 62 222 67L222 68Q222 72 218 71.8","s":"M22 45C84.4 43 148.8 50 200 53","g":"M126 21Q126 18 129 18L152 18Q156 18 159.8 19.1L163.1 20.1Q166 21 168 23.3L184 41.7Q186 44 183 44L129 44Q126 44 126 41Z","l":"M122 17V73M186 46L190 73M60 17V73M60 44H122","h":"M204.7 53.9Q204 52 205.8 52.9L216.6 58.3Q218 59 218.5 60.5L218.7 61.1Q219 62 218 62L210 62Q208 62 207.3 60.1Z","t":"M14 45Q14 44 15 44L19 44Q20 44 19.9 45L19.1 57Q19 58 18 58L15 58Q14 58 14 57Z","d":"M108 50h7M132 50h7","w":[[50,77,15,10.2,"M50.4 74.9L50.9 67.5L49.1 67.5L49.6 74.9ZM52.1 76.8L59.3 74.9L58.8 73.2L51.8 76ZM50.9 78.9L54.9 85.2L56.3 84.2L51.5 78.4ZM48.5 78.4L43.7 84.2L45.1 85.2L49.1 78.9ZM48.2 76L41.2 73.2L40.7 74.9L47.9 76.8Z"],[182,77,15,10.2,"M182.4 74.9L182.9 67.5L181.1 67.5L181.6 74.9ZM184.1 76.8L191.3 74.9L190.8 73.2L183.8 76ZM182.9 78.9L186.9 85.2L188.3 84.2L183.5 78.4ZM180.5 78.4L175.7 84.2L177.1 85.2L181.1 78.9ZM180.2 76L173.2 73.2L172.7 74.9L179.9 76.8Z"]]},"Coupe":{"b":"M19 81Q17 81 16.5 79.1L14.7 71.9Q14 69 14.2 66L14.8 60Q15 57 17.4 55.3L18.5 54.5Q22 52 26.3 51.5L31 51Q40 50 48.5 47L61.7 42.3Q74 38 87 37L89.9 36.8Q100 36 110 37.5L113.1 38Q120 39 126.3 42L141.1 48.9Q152 54 163.9 55.9L184.1 59.1Q190 60 194.5 64L194.5 64Q199 68 198.1 73.9L197.3 79Q197 81 195 81L173.4 81A17.7 17.7 0 0 0 138.6 81L67.4 81A17.7 17.7 0 0 0 32.6 81Z","u":"M17 69Q14 69 14.2 66L14.8 60Q15 57 17.4 55.3L18.5 54.5Q22 52 26.3 51.5L31 51Q40 50 48.5 47L61.7 42.3Q74 38 87 37L89.9 36.8Q100 36 110 37.5L113.1 38Q120 39 126.3 42L141.1 48.9Q152 54 163.9 55.9L184.1 59.1Q190 60 194.5 64L194.5 64Q199 68 193 68","s":"M29 55C80.5 53 134.1 60 176 63","g":"M54 50.1Q52 50 53.8 49.2L72.3 41.5Q76 40 80 39.8L90 39.1Q92 39 92 41L92 50Q92 52 90 51.9ZM96 41Q96 39 98 39.3L115 41.6Q118 42 120.6 43.5L133.4 50.5Q136 52 133 52L98 52Q96 52 96 50Z","l":"M94 39V77M138 54L141 77","h":"M181.1 63.7Q180 62 182 62.4L193.4 64.7Q195 65 195.5 66.5L195.7 67.1Q196 68 195 68L186 68Q184 68 182.9 66.3Z","t":"M15 57Q15 56 16 55.8L26 54.2Q27 54 26.8 55L26.2 59Q26 60 25 60.1L16 60.9Q15 61 15 60Z","d":"M104 58h7M124 58h7","w":[[50,77.5,14.5,9.9,"M50.4 75.4L50.8 68.3L49.2 68.3L49.6 75.4ZM52.1 77.3L59 75.4L58.5 73.9L51.8 76.5ZM50.9 79.4L54.8 85.5L56.1 84.5L51.5 78.9ZM48.5 78.9L43.9 84.5L45.2 85.5L49.1 79.4ZM48.2 76.5L41.5 73.9L41 75.4L47.9 77.3Z"],[156,77.5,14.5,9.9,"M156.4 75.4L156.8 68.3L155.2 68.3L155.6 75.4ZM158.1 77.3L165 75.4L164.5 73.9L157.8 76.5ZM156.9 79.4L160.8 85.5L162.1 84.5L157.5 78.9ZM154.5 78.9L149.9 84.5L151.2 85.5L155.1 79.4ZM154.2 76.5L147.5 73.9L147 75.4L153.9 77.3Z"]]},"Convertible":{"b":"M19 81Q17 81 16.5 79.1L14.7 71.9Q14 69 14.2 66L14.8 60Q15 57 17.6 55.5L18.5 55Q22 53 26 52.8L60 51.3Q66 51 72 51L95 51Q98 51 100.6 49.6L118.2 40Q120 39 122 39L122 39Q124 39 125.8 39.9L141.4 48.3Q152 54 163.9 55.9L184.1 59.1Q190 60 194.5 64L194.5 64Q199 68 198.1 73.9L197.3 79Q197 81 195 81L173.4 81A17.7 17.7 0 0 0 138.6 81L67.4 81A17.7 17.7 0 0 0 32.6 81Z","u":"M17 69Q14 69 14.2 66L14.8 60Q15 57 17.6 55.5L18.5 55Q22 53 26 52.8L60 51.3Q66 51 72 51L95 51Q98 51 100.6 49.6L118.2 40Q120 39 122 39L122 39Q124 39 125.8 39.9L141.4 48.3Q152 54 163.9 55.9L184.1 59.1Q190 60 194.5 64L194.5 64Q199 68 193 68","s":"M29 55C80.5 53 134.1 60 176 63","g":"M107 51.1Q105 51 106.7 50L119.3 43Q121 42 122.7 43.1L134.3 50.9Q136 52 134 51.9Z","l":"M100 53V77M138 54L141 77","h":"M181.1 63.7Q180 62 182 62.4L193.4 64.7Q195 65 195.5 66.5L195.7 67.1Q196 68 195 68L186 68Q184 68 182.9 66.3Z","t":"M15 57Q15 56 16 55.8L26 54.2Q27 54 26.8 55L26.2 59Q26 60 25 60.1L16 60.9Q15 61 15 60Z","d":"M108 58h7M124 58h7","w":[[50,77.5,14.5,9.9,"M50.4 75.4L50.8 68.3L49.2 68.3L49.6 75.4ZM52.1 77.3L59 75.4L58.5 73.9L51.8 76.5ZM50.9 79.4L54.8 85.5L56.1 84.5L51.5 78.9ZM48.5 78.9L43.9 84.5L45.2 85.5L49.1 79.4ZM48.2 76.5L41.5 73.9L41 75.4L47.9 77.3Z"],[156,77.5,14.5,9.9,"M156.4 75.4L156.8 68.3L155.2 68.3L155.6 75.4ZM158.1 77.3L165 75.4L164.5 73.9L157.8 76.5ZM156.9 79.4L160.8 85.5L162.1 84.5L157.5 78.9ZM154.5 78.9L149.9 84.5L151.2 85.5L155.1 79.4ZM154.2 76.5L147.5 73.9L147 75.4L153.9 77.3Z"]]}};
export const shapeSvg = (type) => {
  const c = SHAPES[type] || SHAPES.Sedan;
  const wheels = c.w.map(([x, y, r, rim, spokes]) => `<g class="wheel"><circle class="s-tyre" cx="${x}" cy="${y}" r="${r}"/><circle class="s-hub" cx="${x}" cy="${y}" r="${rim}"/><path class="s-spokes" d="${spokes}"/><circle class="s-ring" cx="${x}" cy="${y}" r="${rim}"/></g>`).join('');
  return `<svg viewBox="0 0 240 96" aria-hidden="true" class="shape">
    <ellipse class="s-floor" cx="${(c.w[0][0] + c.w[1][0]) / 2}" cy="92.5" rx="${(c.w[1][0] - c.w[0][0]) / 2 + 34}" ry="2.8"/>
    <path class="s-body" d="${c.b}"/><path class="s-glass" d="${c.g}"/><path class="s-line" d="${c.s}"/><path class="s-gap" d="${c.l}"/>${c.r ? `<path class="s-rail" d="${c.r}"/>` : ''}<path class="s-handle" d="${c.d}"/>
    <path class="s-rim" d="${c.u}"/><path class="s-head" d="${c.h}"/><path class="s-tail" d="${c.t}"/>${wheels}</svg>`;
};

/* ------------------------------------------------------------------ images */
export function photo(src, { alt, srcset = '', sizes = '', eager = false, cls = '', w = 960, h = 634, attrs = '' }) {
  return `<img src="${src}"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ''} width="${w}" height="${h}" alt="${esc(alt)}"
    ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${cls ? `class="${cls}"` : ''} ${attrs}>`;
}

const statusClass = (s) => (s === 'Just arrived' ? ' car-status--new' : s === 'Saturday deal' ? ' car-status--deal' : s === 'Reserved' ? ' car-status--reserved' : '');
const statusBadge = (c, extra = '') => (c.status === 'In stock' ? '' : `<span class="car-status${extra}${statusClass(c.status)}">${c.status}</span>`);

/* ------------------------------------------------------------------ car card */
// how a salesperson would say it: "2019 silver hatchback", "1.2 L petrol, manual"
const soft = (w) => (w === w.toUpperCase() ? w : w.toLowerCase());
const carLine = (c) => [c.year, c.colour && soft(c.colour), c.body && soft(c.body)].filter(Boolean).join(' ');
const specLine = (c) => [[c.engine, soft(c.fuel)].filter(Boolean).join(' '), soft(c.gearbox), c.km != null ? km(c.km) : ''].filter(Boolean).join(', ');

export function carCard(c, P = '', { eager = false, sizes = '(min-width: 1000px) 30vw, (min-width: 640px) 45vw, 92vw' } = {}) {
  const n = c.thumbs.length;
  return `<li class="car" data-id="${c.id}" data-flip-id="${c.id}">
    <a href="${carUrl(c, P)}" class="car-media" tabindex="-1" aria-hidden="true" data-scrub="${c.thumbs.map((t) => P + t).join('|')}">
      ${photo(thumb(c, 0, 960, P), { alt: '', eager, sizes, srcset: `${thumb(c, 0, 480, P)} 480w, ${thumb(c, 0, 960, P)} 960w`, attrs: 'data-car-img' })}
      ${statusBadge(c)}
      ${n > 1 ? `<span class="car-ticks" aria-hidden="true">${'<i></i>'.repeat(n)}</span><span class="car-photos tabular-nums">${n} photos</span>` : ''}
    </a>
    <div class="car-tools">
      <button type="button" class="save" data-save="${c.id}" aria-pressed="false" aria-label="Save the ${esc(carName(c))}">${ICON.heart}</button>
    </div>
    <div class="car-info">
      <div class="car-tag">
        <p class="car-price car-plate${c.status === 'Saturday deal' ? ' car-plate--deal' : ''} tabular-nums">${rs(c.price)}</p>
      </div>
      <h3 class="car-title"><a href="${carUrl(c, P)}" data-car-link>${esc(c.make)} ${esc(c.model)}</a></h3>
      <p class="car-kicker tabular-nums">${esc(carLine(c))}</p>
      <div class="car-foot">
        <div class="car-lines">
          <p class="car-line tabular-nums">${esc(specLine(c))}</p>
          <p class="car-monthly tabular-nums">or about ${rs(monthly(c.price))} a month</p>
        </div>
        <button type="button" class="car-compare" data-compare="${c.id}" aria-pressed="false" aria-label="Compare the ${esc(carName(c))}">${ICON.scales}<span>Compare</span></button>
      </div>
    </div>
  </li>`;
}

/* ------------------------------------------------------------------ chrome */
export const NAV_PAGES = [
  { key: 'inventory', href: 'inventory.html', label: 'Catalogue' },
  { key: 'sell', href: 'sell.html', label: 'Sell' },
  { key: 'finance', href: 'finance.html', label: 'Leasing' },
  { key: 'contact', href: 'contact.html', label: 'Visit us' },
];

/** Page-change curtain: three layers per side sweep in, meet in the middle, then open on the next page. */
export function curtainHTML(P = '') {
  const side = (k) => `<div class="curtain-side curtain-side--${k}"><span class="cl cl-1"></span><span class="cl cl-2"></span><span class="cl cl-3"></span></div>`;
  return `<div class="curtain" data-curtain aria-hidden="true">${side('l')}${side('r')}
    <div class="curtain-mid">${markSVG('mark curtain-mark', P)}<span class="curtain-label" data-curtain-label></span></div></div>`;
}

export function navHTML(page, P = '') {
  return `${curtainHTML(P)}<div class="bg-cars" data-bg-cars aria-hidden="true">${['Coupe', 'Sedan', 'SUV'].map((t) => `<div class="bg-car">${shapeSvg(t)}</div>`).join('')}</div>
  <header class="nav" data-nav>
    <a href="${P}./" class="wordmark" aria-label="V8 Motors, home">${markSVG('mark wordmark-mark', P)}<span>V8 Motors</span></a>
    <nav aria-label="Main" class="nav-links" data-nav-links>
      ${NAV_PAGES.map((p) => `<a href="${P}${p.href}"${p.key === page ? ' aria-current="page"' : ''}>${p.label}</a>`).join('')}
      <span class="nav-ink" data-nav-ink aria-hidden="true"></span>
    </nav>
  </header>`;
}

const MAPS_DIR = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEALER.mapsQuery)}`;
const WA = (text = 'Hello V8 Motors, ') => `https://wa.me/${DEALER.whatsapp}?text=${encodeURIComponent(text)}`;

/** Bottom dock on phones: the main actions sit where the thumb is. A pill glides to the current tab
    (and between pages, with the page transition); Menu opens a bottom sheet with everything else. */
export function mobileBarHTML(page, P = '') {
  const tab = (key, href, icon, label) => `<a href="${href}" class="tab"${key === page ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`;
  return `<nav class="tabbar" aria-label="Quick links" data-tabbar>
    <span class="tab-pill" data-tab-pill aria-hidden="true"></span>
    ${tab('home', `${P}./`, markSVG('mark tab-mark', P), 'Home')}
    ${tab('inventory', `${P}inventory.html`, ICON.car, 'Catalogue')}
    <a href="${DEALER.phoneHref}" class="tab tab--call">${ICON.phone}<span>Call</span></a>
    <button type="button" class="tab" data-menu-open aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-sheet"${['sell', 'finance', 'contact', 'compare'].includes(page) ? ' aria-current="page"' : ''}>${ICON.menu}<span>Menu</span></button>
  </nav>
  ${menuSheetHTML(page, P)}`;
}

/** The menu as a bottom sheet (never a full-screen takeover): every page, the quickest ways to reach
    the showroom, and whether it's open right now. Drag it down, tap outside or press Escape to close. */
export function menuSheetHTML(page, P = '') {
  const link = (key, href, icon, label, meta) => `<a href="${href}" class="sheet-link"${key === page ? ' aria-current="page"' : ''}>${icon}<span><strong>${label}</strong>${meta ? `<small>${meta}</small>` : ''}</span></a>`;
  return `<div class="sheet-scrim" data-menu-scrim hidden></div>
  <div class="sheet" id="menu-sheet" role="dialog" aria-modal="true" aria-labelledby="menu-title" data-menu hidden>
    <div class="sheet-grab" data-menu-grab aria-hidden="true"><span></span></div>
    <div class="sheet-head">
      <p class="sheet-title" id="menu-title">V8 <em>Motors</em></p>
      <button type="button" class="sheet-close" data-menu-close aria-label="Close the menu">${ICON.close}</button>
    </div>
    <p class="sheet-status open-status" data-open-status></p>
    <nav class="sheet-links" aria-label="All pages">
      ${link('home', `${P}./`, markSVG('mark', P), 'Home', '')}
      ${link('inventory', `${P}inventory.html`, ICON.car, 'Catalogue', `${CARS.length} in stock`)}
      ${link('sell', `${P}sell.html`, ICON.tag, 'Sell', 'A guide price in 3 steps')}
      ${link('finance', `${P}finance.html`, ICON.coin, 'Leasing', `With ${DEALER.leasing}`)}
      ${link('contact', `${P}contact.html`, ICON.pin, 'Visit us', `${DEALER.street}, ${DEALER.locality}`)}
      ${link('compare', `${P}compare.html`, ICON.scales, 'Compare', 'Up to three cars')}
      ${link('saved', `${P}inventory.html?saved=1`, ICON.heart, 'Saved', '<span data-saved-count>0</span> saved')}
    </nav>
    <div class="sheet-ways">
      <a href="${DEALER.phoneHref}" class="way-btn">${ICON.phone}<span>Call</span></a>
      <a href="${WA()}" class="way-btn" rel="noopener">${ICON.whatsapp}<span>WhatsApp</span></a>
      <a href="mailto:${DEALER.email}" class="way-btn">${ICON.mail}<span>Email</span></a>
      <a href="${MAPS_DIR}" class="way-btn" rel="noopener">${ICON.route}<span>Directions</span></a>
    </div>
  </div>`;
}

export function footerHTML(P = '') {
  const pages = [{ href: './', label: 'Home' }, ...NAV_PAGES, { href: 'compare.html', label: 'Compare' }];
  return `<footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <a href="${P}./" class="wordmark wordmark--lg" aria-label="V8 Motors, home">${markSVG('mark wordmark-mark', P)}<span>V8 Motors</span></a>
        <nav class="footer-pages" aria-label="Footer">${pages.map((p) => `<a href="${P}${p.href}">${p.label}</a>`).join('')}</nav>
        <div class="footer-where">
          <address>${DEALER.street}<br>${DEALER.locality}, Mauritius</address>
          <a href="mailto:${DEALER.email}">${DEALER.email}</a>
        </div>
        <p class="footer-phones">${DEALER.phones.map(([t, h]) => `<a href="${h}" class="tabular-nums">${t}</a>`).join('')}</p>
      </div>
      <div class="footer-row">
        <p>© ${new Date().getFullYear()} ${DEALER.legalName}. Leasing subject to approval by ${DEALER.leasing}.</p>
        <p class="footer-built">Website built by <a href="https://webluxe.github.io//WebLuxe/" rel="noopener">WebLuxe</a></p>
        <p class="footer-legal"><a href="${P}privacy.html">Privacy policy</a><a href="${P}terms.html">Terms of sale</a></p>
      </div>
      <p class="footer-credits">Stock photos by V8 Motors. 3D car from <a href="https://sketchfab.com/models/b477326cf8b041c9b1a89b1c4f4e7bdf" rel="noopener">Range Rover Sport Hybrid PHEV 2023 by victor-arrais</a>, engine from <a href="https://sketchfab.com/models/f20acef709b847eb98839b89c5ef916c" rel="noopener">V8 Hot Rod Engine by ShotaB</a>, both adapted, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a>. Engine sound from CC0 recordings by marcelweiss and Paul368 on Freesound.</p>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------------ head / SEO */
export function headHTML({ title, desc, path, image, jsonld = [], P = '' }) {
  const url = SITE + path;
  const img = image || `${SITE}og.jpg`;
  return `<script>(function(){try{var n=performance.getEntriesByType('navigation')[0],f=location.pathname.split('/').pop();if(n&&n.type==='reload'&&f&&f!=='index.html'){sessionStorage.setItem('v8:restart','1');location.replace('${P}./')}}catch(e){}})();(function(d){try{if(sessionStorage.getItem('v8:curtain')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('curtain-in');
    /* if the page script never runs (offline, blocked), don't leave the intro or hidden content in the way */
    setTimeout(function(){if(!window.__v8){d.classList.remove('play-intro','js');}},9000);}catch(e){}})(document.documentElement)</script>
  <script type="speculationrules">{"prefetch":[{"where":{"and":[{"selector_matches":"a[href]"},{"not":{"selector_matches":"[rel~=noopener],[href^='tel:'],[href^='mailto:'],[href*='://']"}}]},"eagerness":"moderate"}]}</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="V8 Motors" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:locale" content="en_MU" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${img}" />
  <meta name="theme-color" content="#e6e9ed" />
  <link rel="icon" href="${P}favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="${P}favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="${P}apple-touch-icon.png" />
  <link rel="manifest" href="${P}site.webmanifest" />
  ${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n  ')}`;
}

export function dealerJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'V8 Motors',
    url: SITE,
    logo: `${SITE}brand/v8-mark.png`,
    image: `${SITE}og.jpg`,
    telephone: '+230' + DEALER.phone.replace(/\s/g, ''),
    email: DEALER.email,
    priceRange: `${rs(Math.min(...CARS.map((c) => c.price)))} to ${rs(Math.max(...CARS.map((c) => c.price)))}`,
    address: { '@type': 'PostalAddress', streetAddress: DEALER.street, addressLocality: DEALER.locality, addressCountry: 'MU' },
    areaServed: 'Mauritius',
    openingHoursSpecification: DEALER.hours.map((h, d) => h && {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d],
      opens: h[0], closes: h[1],
    }).filter(Boolean),
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
  };
}

export function carJsonLd(c) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: carName(c),
    brand: { '@type': 'Brand', name: c.make },
    model: c.model,
    vehicleModelDate: String(c.year),
    ...(c.km != null && { mileageFromOdometer: { '@type': 'QuantitativeValue', value: c.km, unitCode: 'KMT' } }),
    fuelType: c.fuel,
    vehicleTransmission: c.gearbox,
    bodyType: c.body,
    ...(c.colour && { color: c.colour }),
    ...(c.engineCc && { vehicleEngine: { '@type': 'EngineSpecification', engineDisplacement: { '@type': 'QuantitativeValue', value: c.engineCc, unitCode: 'CMQ' } } }),
    ...(c.seats && { seatingCapacity: c.seats }),
    ...(c.description && { description: c.description }),
    itemCondition: 'https://schema.org/UsedCondition',
    image: c.images,
    url: `${SITE}cars/${c.id}.html`,
    offers: {
      '@type': 'Offer', price: c.price, priceCurrency: 'MUR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: 'V8 Motors', url: SITE },
    },
  };
}

/* ------------------------------------------------------------------ car page */
export function honeypot() {
  return `<div class="hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`;
}

export function carPageHTML(c, P = '../') {
  const name = carName(c);
  const n = c.images.length;
  const waText = encodeURIComponent(`Hi V8 Motors, I'm interested in the ${name} (${rs(c.price)}). Is it still available to view?`);
  // every figure we hold on the car
  const specs = [
    [ICON.calendar, 'Year', c.year],
    [ICON.gauge, 'Mileage', c.km != null ? km(c.km) : 'Ask us'],
    c.engine && [ICON.engine, 'Engine', c.engineCc ? `${c.engine}, ${c.engineCc.toLocaleString('en-US')} cc` : c.engine],
    [ICON.gear, 'Gearbox', c.gearbox],
    [ICON.fuel, 'Fuel', c.fuel],
    [ICON.car, 'Body', c.body],
    c.colour && [ICON.palette, 'Colour', c.colour],
    c.seats && [ICON.seat, 'Seats', c.seats],
    c.doors && [ICON.door, 'Doors', c.doors],
  ].filter(Boolean);
  return `
  <div class="wrap car-page" data-car="${c.id}">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${P}./">Home</a><span aria-hidden="true">/</span><a href="${P}inventory.html">Catalogue</a><span aria-hidden="true">/</span>
      <a href="${P}inventory.html?make=${encodeURIComponent(c.make)}">${c.make}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(c.model)}</span>
    </nav>

    <div class="car-top">
      <div class="gallery" data-gallery>
        <div class="gallery-main" data-gal-tilt>
          ${photo(large(c, 0, P), { alt: `${name}${c.colour ? ` in ${c.colour.toLowerCase()}` : ''}, photo 1 of ${n}`, eager: true, w: 1591, h: 1200, attrs: `data-gal-img style="background-image:url(${P}${c.thumbs[0]});view-transition-name:car-hero"` })}
          ${statusBadge(c, ' car-status--lg')}
          ${n > 1 ? `
          <button type="button" class="gal-arrow gal-prev" data-gal-prev aria-label="Previous photo">${ICON.arrowL}</button>
          <button type="button" class="gal-arrow gal-next" data-gal-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
          <button type="button" class="gal-video" data-video-open>${ICON.play}<span>Video</span></button>
          <button type="button" class="gal-expand" data-gal-open aria-label="Open photos full screen">${ICON.expand}<span class="tabular-nums" data-gal-count>1 / ${n}</span></button>
        </div>
        ${n > 1 ? `<div class="gallery-thumbs" style="--n:${Math.min(n, 6)}">${c.thumbs.slice(0, 6).map((src, i) =>
          `<button type="button" data-gal-thumb="${i}" aria-current="${i === 0}" aria-label="Show photo ${i + 1}"><img src="${P}${src}" width="480" height="317" alt="" loading="lazy">${i === 5 && n > 6 ? `<span class="gal-more" data-gal-open aria-label="Show all ${n} photos">+${n - 5}</span>` : ''}</button>`).join('')}</div>` : ''}
      </div>

      <aside class="summary" data-summary>
        <h1 class="summary-title">${esc(c.make)} <em>${esc(c.model)}</em></h1>
        <p class="summary-kicker tabular-nums">${esc(carLine(c))}</p>
        <div class="summary-price">
          <p class="summary-amount car-plate${c.status === 'Saturday deal' ? ' car-plate--deal' : ''} tabular-nums" data-price>${rs(c.price)}</p>
          <p class="summary-monthly tabular-nums">or about <strong>${rs(monthly(c.price))}</strong> a month on lease, 20% down over 5 years</p>
        </div>
        <dl class="specs" aria-label="Specifications">${specs.map(([icon, k, v]) => `<div class="spec">${icon}<dt>${k}</dt><dd class="tabular-nums">${esc(v)}</dd></div>`).join('')}</dl>
        <div class="summary-contact">
          <a class="btn btn-primary" href="https://wa.me/${DEALER.whatsapp}?text=${waText}" rel="noopener">${ICON.chat}WhatsApp</a>
          <a class="btn btn-line" href="${DEALER.phoneHref}">${ICON.phone}Call</a>
        </div>
        <div class="summary-tools">
          <button type="button" class="tool" data-save="${c.id}" aria-pressed="false">${ICON.heart}<span>Save</span></button>
          <button type="button" class="tool" data-compare="${c.id}" aria-pressed="false">${ICON.scales}<span>Compare</span></button>
          <button type="button" class="tool" data-share>${ICON.share}<span>Share</span></button>
        </div>
      </aside>
    </div>

    <section class="car-section fin-mini" aria-labelledby="fin-h">
      <div class="fin-mini-box">
        <div>
          <h2 class="fin-mini-title" id="fin-h">Your monthly <em>payment</em></h2>
          <p class="fin-mini-note">An example at ${DEALER.financeRate}% a year. ${DEALER.leasing} confirms the real figure. <a href="${P}finance.html?id=${c.id}" class="link">Full calculator</a></p>
        </div>
        <label class="slider"><span class="slider-top"><span>Deposit</span><output class="tabular-nums" data-mini-dep-out>20%, ${rs(c.price * 0.2)}</output></span>
          <input type="range" min="10" max="60" step="5" value="20" data-mini-dep></label>
        <label class="slider"><span class="slider-top"><span>Term</span><output class="tabular-nums" data-mini-term-out>5 years</output></span>
          <input type="range" min="12" max="84" step="12" value="60" data-mini-term></label>
        <p class="fin-mini-figure tabular-nums" aria-live="polite" data-mini-out>${rs(monthly(c.price))}<span> a month</span></p>
      </div>
    </section>
  </div>

  <div class="buybar" data-buybar>
    <div class="buybar-text"><p class="buybar-name">${esc(c.make)} ${esc(c.model)}</p><p class="buybar-price tabular-nums">${rs(c.price)}</p></div>
    <a href="${DEALER.phoneHref}" class="btn btn-line buybar-icon" aria-label="Call V8 Motors">${ICON.phone}</a>
    <a href="https://wa.me/${DEALER.whatsapp}?text=${waText}" class="btn btn-primary" rel="noopener">WhatsApp</a>
  </div>

  <dialog class="lightbox" data-lightbox aria-label="Photos of the ${esc(name)}">
    <img alt="" data-lb-img>
    <p class="lb-count tabular-nums" data-lb-count></p>
    <button type="button" class="lb-video" data-video-open>${ICON.play}<span>Video</span></button>
    <button type="button" class="lb-close" data-lb-close aria-label="Close photos">${ICON.close}</button>
    ${n > 1 ? `<button type="button" class="lb-arrow lb-prev" data-lb-prev aria-label="Previous photo">${ICON.arrowL}</button>
    <button type="button" class="lb-arrow lb-next" data-lb-next aria-label="Next photo">${ICON.arrowR}</button>` : ''}
  </dialog>
  <dialog class="video-box" data-video-box aria-label="Video of the ${esc(name)}">
    <div class="video-frame" data-video-frame style="--poster:url('${large(c, 0, P)}')"><p class="video-soon" data-video-soon>${ICON.play}<span>Video coming soon</span></p></div>
    <button type="button" class="video-swap" data-video-swap hidden>Not playing? Watch on YouTube</button>
    <button type="button" class="lb-close" data-video-close aria-label="Close the video">${ICON.close}</button>
  </dialog>`;
}

/* ------------------------------------------------------------------ home: what you get. One panel open at a time */
const PROMISES = [
  { tone: 'red', car: 'SUV', title: 'Buy, sell or exchange', text: `Bring your old car, drive away with a new one. Buy, sell or exchange, with leasing through ${DEALER.leasing}.`, href: 'sell.html', cta: 'Sell your car' },
  { tone: 'blue', car: 'Sedan', title: 'Leasing available', text: `Drive now, pay monthly with ${DEALER.leasing}.`, href: 'finance.html', cta: 'Work out a payment' },
  { tone: 'yellow', car: 'Hatchback', title: 'All cars checked', text: 'Clean, reliable and road-ready.', href: 'inventory.html', cta: 'See the catalogue' },
  { tone: 'green', car: 'Pickup', title: 'New stock every week', text: 'Come visit or contact us to see what’s new.', href: 'contact.html', cta: 'Visit us' },
];
export function promisesHTML(P = '') {
  return PROMISES.map((p, i) => `<section class="acc-item acc-item--${p.tone}${i ? '' : ' is-open'}">
    <h3 class="acc-h"><button type="button" class="acc-btn" id="acc-b${i}" aria-controls="acc-p${i}" aria-expanded="${!i}"><i class="acc-dot" aria-hidden="true"></i><span class="acc-name">${p.title}</span></button></h3>
    <div class="acc-panel" id="acc-p${i}" role="region" aria-labelledby="acc-b${i}"><div class="acc-inner">
      <div class="acc-text"><p class="acc-title" aria-hidden="true">${p.title}</p><p class="acc-sub">${p.text}</p><a class="acc-link" href="${P}${p.href}">${p.cta}</a></div>
      ${shapeSvg(p.car)}
    </div></div>
  </section>`).join('');
}

/* ------------------------------------------------------------------ Visit us */
export function hoursHTML() {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const same = (a, b) => String(DEALER.hours[a]) === String(DEALER.hours[b]);
  const rows = [];
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const last = rows[rows.length - 1];
    if (last && same(last.to, d)) last.to = d; else rows.push({ from: d, to: d });
  }
  return rows.map(({ from, to }) => {
    const h = DEALER.hours[from];
    return `<tr><th scope="row">${from === to ? DAYS[from] : `${DAYS[from]} to ${DAYS[to]}`}</th><td class="${h ? '' : 'closed'} tabular-nums">${h ? `${fmtTime(h[0])} to ${fmtTime(h[1])}` : 'Closed'}</td></tr>`;
  }).join('');
}
export function reachHTML() {
  return `<div class="reach-row reach-row--phones"><span class="reach-k">Call</span><p class="reach-phones">${DEALER.phones.map(([t, h]) => `<a href="${h}" class="tabular-nums">${t}</a>`).join('')}</p></div>
    <div class="reach-row"><span class="reach-k">WhatsApp</span><a class="tabular-nums" href="https://wa.me/${DEALER.whatsapp}" rel="noopener">${DEALER.phone}</a></div>
    <div class="reach-row"><span class="reach-k">Email</span><a href="mailto:${DEALER.email}">${DEALER.email}</a></div>`;
}

export function inventoryGridHTML(P = '') {
  return [...CARS].sort((a, b) => b.added.localeCompare(a.added)).map((c, i) => carCard(c, P, { eager: i < 3 })).join('');
}

/* ------------------------------------------------------------------ inventory filter options */
export function filterOptionsHTML(kind) {
  if (kind === 'body') return BODY_TYPES.filter((t) => CARS.some((c) => c.body === t)).map((t) => `<label class="body-opt"><input type="checkbox" name="body" value="${t}">
    <span>${shapeSvg(t)}<span class="body-opt-name">${t}</span><span class="body-opt-n tabular-nums" data-n-body="${t}">${CARS.filter((c) => c.body === t).length}</span></span></label>`).join('');
  if (kind === 'fuel') return ['Petrol', 'Diesel', 'Hybrid', 'Electric'].filter((f) => CARS.some((c) => c.fuel === f)).map((f) => `<label class="pill"><input type="checkbox" name="fuel" value="${f}"><span>${f} <span class="pill-n tabular-nums" data-n-fuel="${f}">${CARS.filter((c) => c.fuel === f).length}</span></span></label>`).join('');
  return '';
}
