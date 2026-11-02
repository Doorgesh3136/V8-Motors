import gsap from 'gsap';
import { initLayout, reduced, $, riseIn, stretchHeadings } from '../lib/layout.js';
import { renderStatus, renderHours } from '../lib/hours.js';
import { DEALER } from '../data.js';

initLayout('contact');
riseIn($('[data-rise]'));
stretchHeadings();
renderStatus($('[data-open-status]'));
renderHours($('[data-hours]'));

$('[data-address]').textContent = DEALER.address;
$('[data-directions]').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEALER.mapsQuery)}`;
$('[data-map]').src = `https://maps.google.com/maps?q=${encodeURIComponent(DEALER.mapsQuery)}&z=15&output=embed`;
$('[data-call]').href = DEALER.phoneHref;
$('[data-phone]').textContent = DEALER.phone;
$('[data-wa]').href = `https://wa.me/${DEALER.whatsapp}`;
$('[data-mail]').href = `mailto:${DEALER.email}`;
$('[data-email]').textContent = DEALER.email;

if (!reduced) {
  gsap.from('.map-card', { clipPath: 'inset(0 0 100% 0 round 22px)', duration: 1.4, ease: 'expo.inOut', delay: 0.2 });
  gsap.from('.hours tr, .way', { opacity: 0, x: 20, stagger: 0.05, duration: 0.8, ease: 'expo.out', delay: 0.4 });
}

// message form
const f = $('[data-contact-form]');
const ta = f.msg;
ta.addEventListener('input', () => {
  $('[data-char]').textContent = `${ta.value.length} / 600`;
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
});
f.addEventListener('submit', (e) => {
  e.preventDefault();
  const missing = [...f.elements].filter((x) => x.required && !x.value.trim());
  [...f.elements].forEach((x) => x.setAttribute?.('aria-invalid', String(missing.includes(x))));
  const err = $('[data-error]', f);
  if (missing.length) { err.hidden = false; err.textContent = 'Add your name, a way to reach you and a message.'; missing[0].focus(); return; }
  const topic = new FormData(f).get('topic');
  f.innerHTML = `<div class="form-done form-done--big"><strong>Message sent.</strong><p>Thanks. We'll reply about “${topic.toLowerCase()}” the same working day.</p></div>`;
  if (!reduced) gsap.from('.form-done--big', { opacity: 0, y: 20, duration: 0.7, ease: 'expo.out' });
});
