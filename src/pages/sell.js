import gsap from 'gsap';
import { initLayout, reduced, $, $$, scrollToEl, titleIn, looksLikeSpam, validateFields, phoneOk } from '../lib/layout.js';
import { CARS, rs } from '../data.js';
import { esc } from '../lib/templates.js';

initLayout();
titleIn($('[data-title]'));

const f = $('[data-wizard]');
const steps = $$('[data-wstep]');
const NEXT = ['Next: condition', 'Next: contact details', 'Get my offer'];
let step = 0;
let files = [];

// Rough "new price" per make, used only for the guide figure (Rs)
const MAKE_BASE = {
  Toyota: 1.9e6, Nissan: 1.6e6, Honda: 1.7e6, Suzuki: 0.95e6, Hyundai: 1.4e6, Kia: 1.5e6, Mazda: 1.7e6, Mitsubishi: 1.5e6,
  Volkswagen: 2.1e6, Opel: 1.5e6, Ford: 2.4e6, Peugeot: 1.6e6, Renault: 1.3e6, Mini: 2.2e6, Jeep: 3.4e6, Tesla: 3.6e6,
  BMW: 4.2e6, 'Mercedes-Benz': 4.8e6, Audi: 4.2e6, 'Land Rover': 7.5e6, Porsche: 9.5e6, Lamborghini: 22e6, Other: 1.6e6,
};
const makeSel = $('[data-make]');
makeSel.insertAdjacentHTML('beforeend', Object.keys(MAKE_BASE).map((m) => `<option>${m}</option>`).join(''));
makeSel.addEventListener('change', () => {
  const models = [...new Set(CARS.filter((c) => c.make === makeSel.value).map((c) => c.model))];
  $('[data-models]').innerHTML = models.map((m) => `<option value="${esc(m)}">`).join('');
});

/* ---------------------------------------------------------------- live rough guide */
const est = { v: 0, lo: 0, hi: 0 };
const kmValue = () => +String(f.km.value).replace(/\D/g, '');
function estimate() {
  const make = makeSel.value, year = +f.year.value, kms = kmValue();
  const now = new Date().getFullYear();
  if (!make || !year || year < 1970 || year > now + 1 || !f.km.value) return null;
  const why = [];
  const age = Math.max(0, now - year);
  let v = MAKE_BASE[make] * Math.pow(0.86, age);
  const kmFactor = gsap.utils.clamp(0.8, 1.08, 1 - ((kms - age * 15000) / 100000) * 0.12);
  v *= kmFactor;
  why.push(kmFactor >= 1 ? 'Mileage is below average for its age' : 'Mileage is above average for its age');
  const condition = new FormData(f).get('condition');
  const cond = { excellent: 1.08, good: 1, fair: 0.88, rough: 0.7 }[condition] ?? 1;
  v *= cond;
  if (step >= 1) why.push({ excellent: 'Excellent condition adds value', good: 'Good condition for its age', fair: 'Jobs due lower the price', rough: 'Repairs needed lower the price' }[condition]);
  if (files.length >= 3) why.push('Photos let us give a firmer offer');
  return { v: Math.max(50000, Math.round(v / 5000) * 5000), spread: files.length >= 3 ? 0.06 : 0.1, why };
}
function renderEstimate() {
  const e = estimate();
  if (!e) return;
  gsap.to(est, {
    v: e.v, lo: e.v * (1 - e.spread), hi: e.v * (1 + e.spread), duration: reduced ? 0 : 0.8, ease: 'expo.out',
    onUpdate: () => {
      $('[data-estimate]').textContent = rs(est.v);
      $('[data-estimate-range]').textContent = `Likely between ${rs(Math.round(est.lo / 5000) * 5000)} and ${rs(Math.round(est.hi / 5000) * 5000)}`;
    },
  });
  const pct = gsap.utils.clamp(0.04, 0.96, Math.log10(e.v / 2e5) / Math.log10(2.5e7 / 2e5));
  $('[data-estimate-needle]').style.setProperty('--p', pct);
  $('[data-estimate-why]').innerHTML = e.why.map((w) => `<li>${w}</li>`).join('');
}
f.addEventListener('input', renderEstimate);
f.addEventListener('change', renderEstimate);

/* ---------------------------------------------------------------- steps */
function validate(i) {
  const now = new Date().getFullYear();
  if (i === 0) {
    const y = +f.year.value;
    return validateFields([
      [f.make, f.make.value ? '' : 'Choose the make.'],
      [f.model, f.model.value.trim() ? '' : 'Add the model, for example Aqua.'],
      [f.year, !f.year.value ? 'Add the year.' : y < 1970 || y > now + 1 ? `Enter a year between 1970 and ${now + 1}.` : ''],
      [f.km, !f.km.value ? 'Add the mileage.' : !/^[\d,.\s]+$/.test(f.km.value.trim()) ? 'Numbers only, for example 64000.' : ''],
    ]);
  }
  if (i === 2) {
    return validateFields([
      [f.name, f.name.value.trim() ? '' : 'Add your name.'],
      [f.phone, phoneOk(f.phone.value) ? '' : 'Add a mobile number, for example 5 123 4567.'],
    ]);
  }
  return null;
}
function go(to) {
  const from = step, dir = to > from ? 1 : -1;
  step = to;
  const show = () => {
    steps.forEach((s, k) => (s.hidden = k !== step));
    if (!reduced) gsap.fromTo(steps[step], { opacity: 0, x: 32 * dir }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out', clearProps: 'transform,opacity' });
    $('input:not([type=radio]):not([type=file]), select', steps[step])?.focus({ preventScroll: true });
  };
  if (reduced) show(); else gsap.to(steps[from], { opacity: 0, x: -32 * dir, duration: 0.2, onComplete: show });
  $$('[data-step-label]').forEach((li, k) => { li.toggleAttribute('aria-current', k === step); li.classList.toggle('is-done', k < step); });
  $('[data-wizard-bar]').style.transform = `scaleX(${(step + 1) / steps.length})`;
  $('[data-back]').hidden = step === 0;
  $('[data-next]').textContent = NEXT[step];
  $('[data-error]').hidden = true;
  renderEstimate();
}
$('[data-wizard-bar]').style.transform = `scaleX(${1 / steps.length})`;
$('[data-back]').addEventListener('click', () => go(step - 1));
$$('[data-step-label]').forEach((li, k) => li.addEventListener('click', () => { if (k < step) go(k); }));

f.addEventListener('submit', (e) => {
  e.preventDefault();
  if (validate(step)) return;
  if (step < steps.length - 1) return go(step + 1);
  if (looksLikeSpam(f)) { const err = $('[data-error]'); err.hidden = false; err.textContent = 'That was very quick. Please try again in a moment.'; return; }
  finish();
});

function finish() {
  const fd = new FormData(f);
  const e = estimate();
  steps.forEach((s) => (s.hidden = true));
  $$('.wizard-nav, .wizard-steps, .wizard-bar, [data-error]').forEach((x) => (x.hidden = true));
  const done = $('[data-done]');
  done.hidden = false;
  done.innerHTML = `
    <svg class="done-tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="m15 27 7 7 15-15"/></svg>
    <h2>Request sent.</h2>
    <p>We’ll ${fd.get('contact') === 'WhatsApp' ? 'message' : 'call'} ${esc(fd.get('phone'))} within one working day with a written offer for your ${esc(fd.get('year'))} ${esc(fd.get('make'))} ${esc(fd.get('model'))}.</p>
    <dl class="done-sum">
      <div><dt>Rough guide</dt><dd class="tabular-nums">${e ? rs(e.v) : 'To follow'}</dd></div>
      <div><dt>Mileage</dt><dd class="tabular-nums">${kmValue().toLocaleString('en-US')} km</dd></div>
      <div><dt>Condition</dt><dd>${esc(String(fd.get('condition')).replace(/^./, (x) => x.toUpperCase()))}</dd></div>
      <div><dt>Photos</dt><dd>${files.length}</dd></div>
    </dl>
    <a href="inventory.html" class="btn btn-line">Browse cars while you wait</a>`;
  if (!reduced) {
    gsap.from(done.children, { y: 16, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'expo.out' });
    gsap.fromTo('.done-tick circle', { strokeDashoffset: 151 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' });
    gsap.fromTo('.done-tick path', { strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: 0.5, delay: 0.5, ease: 'power2.out' });
  }
  scrollToEl(done, -120);
}

/* ---------------------------------------------------------------- photos (optional) */
const drop = $('[data-drop]'), input = $('[data-files]'), previews = $('[data-previews]');
function showFiles() {
  previews.innerHTML = files.map((file, k) => `<li><img src="${URL.createObjectURL(file)}" width="88" height="88" alt="Your photo ${k + 1}" />
    <button type="button" data-rm="${k}" aria-label="Remove photo ${k + 1}"><span aria-hidden="true">×</span></button></li>`).join('');
  renderEstimate();
}
function addFiles(list) {
  files = [...files, ...[...list].filter((x) => x.type.startsWith('image/'))].slice(0, 8);
  showFiles();
}
input.addEventListener('change', () => addFiles(input.files));
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
drop.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });
previews.addEventListener('click', (e) => {
  const b = e.target.closest('[data-rm]');
  if (!b) return;
  files.splice(+b.dataset.rm, 1);
  showFiles();
});
