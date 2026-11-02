import gsap from 'gsap';
import { initLayout, reduced, $, $$, riseIn, stretchHeadings, scrollToEl } from '../lib/layout.js';
import { CARS, rs } from '../data.js';

initLayout('sell');
riseIn($('[data-rise]'));
stretchHeadings();

const f = $('[data-wizard]');
const steps = $$('[data-wstep]');
const LABELS = ['condition', 'photos', 'contact details', 'Get my offer'];
let step = 0;
let files = [];

// makes + rough new-price bands used for the guide (Rs)
const MAKE_BASE = {
  Toyota: 1.9e6, Nissan: 1.6e6, Honda: 1.7e6, Suzuki: 0.95e6, Hyundai: 1.4e6, Kia: 1.5e6, Mazda: 1.7e6, Mitsubishi: 1.5e6,
  Volkswagen: 2.1e6, Ford: 2.4e6, Peugeot: 1.6e6, Renault: 1.3e6, Mini: 2.2e6, Jeep: 3.4e6, Tesla: 3.6e6,
  BMW: 4.2e6, 'Mercedes-Benz': 4.8e6, Audi: 4.2e6, 'Land Rover': 7.5e6, Porsche: 9.5e6, Lamborghini: 22e6, Other: 1.6e6,
};
const makeSel = $('[data-make]');
makeSel.insertAdjacentHTML('beforeend', Object.keys(MAKE_BASE).map((m) => `<option>${m}</option>`).join(''));
makeSel.addEventListener('change', () => {
  const models = [...new Set(CARS.filter((c) => c.make === makeSel.value).map((c) => c.model))];
  $('[data-models]').innerHTML = models.map((m) => `<option value="${m}">`).join('');
});

// ---------------------------------------------------------------- estimate
const est = { v: 0, lo: 0, hi: 0 };
function estimate() {
  const make = makeSel.value, year = +f.year.value, kms = +String(f.km.value).replace(/\D/g, '');
  const now = new Date().getFullYear();
  const why = [];
  if (!make || !year || year < 1990 || year > now + 1 || !f.km.value) return null;
  const age = Math.max(0, now - year);
  let v = MAKE_BASE[make] * Math.pow(0.86, age);
  const expected = age * 15000;
  const kmFactor = gsap.utils.clamp(0.8, 1.08, 1 - ((kms - expected) / 100000) * 0.12);
  v *= kmFactor;
  why.push(kmFactor >= 1 ? 'Mileage is below average for its age' : 'Mileage is above average for its age');
  const cond = { excellent: 1.08, good: 1, fair: 0.88, rough: 0.7 }[new FormData(f).get('condition')] ?? 1;
  const hist = { yes: 1.04, partial: 1, no: 0.94 }[new FormData(f).get('history')] ?? 1;
  const acc = { no: 1, minor: 0.95, major: 0.82 }[new FormData(f).get('accident')] ?? 1;
  v *= cond * hist * acc;
  if (step >= 1) {
    why.push({ excellent: 'Excellent condition adds value', good: 'Good condition for its age', fair: 'Some work needed lowers the price', rough: 'Repairs needed lower the price' }[new FormData(f).get('condition')]);
    if (hist !== 1) why.push(hist > 1 ? 'Full service history adds value' : 'No service history lowers the price');
    if (acc !== 1) why.push('Accident history lowers the price');
  }
  if (f.gearbox.value === 'Automatic') v *= 1.03;
  if (files.length >= 3) why.push('Photos let us give a firmer offer');
  return { v: Math.round(v / 5000) * 5000, spread: files.length >= 3 ? 0.06 : 0.1, why };
}
function renderEstimate() {
  const e = estimate();
  if (!e) return;
  gsap.to(est, {
    v: e.v, lo: e.v * (1 - e.spread), hi: e.v * (1 + e.spread), duration: reduced ? 0 : 0.9, ease: 'expo.out',
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

// ---------------------------------------------------------------- steps
function validate(i) {
  const s = steps[i];
  const missing = $$('[required]', s).filter((x) => !x.value.trim());
  $$('input, select', s).forEach((x) => x.setAttribute('aria-invalid', String(missing.includes(x))));
  if (missing.length) return 'Fill in the highlighted fields to continue.';
  if (i === 0) {
    const y = +f.year.value;
    if (y < 1980 || y > new Date().getFullYear() + 1) { f.year.setAttribute('aria-invalid', 'true'); return 'Enter the year the car was first registered, for example 2018.'; }
    if (!/^\d[\d,\s]*$/.test(f.km.value.trim())) { f.km.setAttribute('aria-invalid', 'true'); return 'Enter the mileage in kilometres, numbers only.'; }
  }
  return '';
}
function go(to) {
  const from = step;
  step = to;
  const dir = to > from ? 1 : -1;
  const show = () => {
    steps.forEach((s, i) => (s.hidden = i !== step));
    if (!reduced) gsap.fromTo(steps[step], { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' });
    $('input, select', steps[step])?.focus({ preventScroll: true });
  };
  if (reduced) show(); else gsap.to(steps[from], { opacity: 0, x: -40 * dir, duration: 0.25, onComplete: show });
  $$('[data-step-label]').forEach((li, i) => {
    li.toggleAttribute('aria-current', i === step);
    li.classList.toggle('is-done', i < step);
  });
  $('[data-wizard-bar]').style.transform = `scaleX(${(step + 1) / steps.length})`;
  $('[data-back]').hidden = step === 0;
  $('[data-next]').textContent = step === steps.length - 1 ? 'Get my offer' : `Next: ${LABELS[step]}`;
  $('[data-error]').hidden = true;
  renderEstimate();
}
$('[data-wizard-bar]').style.transform = `scaleX(${1 / steps.length})`;
$('[data-back]').addEventListener('click', () => go(step - 1));
$$('[data-step-label]').forEach((li, i) => li.addEventListener('click', () => { if (i < step) go(i); }));

f.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = validate(step);
  if (err) { $('[data-error]').hidden = false; $('[data-error]').textContent = err; $('[aria-invalid="true"]', steps[step])?.focus(); return; }
  if (step < steps.length - 1) return go(step + 1);
  finish();
});

function finish() {
  const fd = new FormData(f);
  const e = estimate();
  steps.forEach((s) => (s.hidden = true));
  $$('.wizard-nav, .wizard-steps, .wizard-bar, [data-error]').forEach((x) => (x.hidden = true));
  const done = $('[data-done]');
  done.hidden = false;
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  done.innerHTML = `
    <svg class="done-tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="m15 27 7 7 15-15"/></svg>
    <h2>Request sent.</h2>
    <p>We'll ${fd.get('contact') === 'WhatsApp' ? 'message' : 'call'} ${esc(fd.get('phone'))} within one working day with a written offer for your ${esc(fd.get('year'))} ${esc(fd.get('make'))} ${esc(fd.get('model'))}.</p>
    <dl class="done-sum">
      <div><dt>Rough guide</dt><dd class="tabular-nums">${e ? rs(e.v) : 'To follow'}</dd></div>
      <div><dt>Mileage</dt><dd class="tabular-nums">${esc(Number(String(fd.get('km')).replace(/\D/g, '')).toLocaleString('en-US'))} km</dd></div>
      <div><dt>Condition</dt><dd>${esc(fd.get('condition'))}</dd></div>
      <div><dt>Photos</dt><dd>${files.length}</dd></div>
    </dl>
    <a href="inventory.html" class="btn btn-dark">Browse cars while you wait</a>`;
  if (!reduced) {
    gsap.from(done.children, { y: 20, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out' });
    gsap.fromTo('.done-tick circle', { strokeDashoffset: 151 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' });
    gsap.fromTo('.done-tick path', { strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: 0.5, delay: 0.5, ease: 'power2.out' });
  }
  scrollToEl(done, -120);
}

// ---------------------------------------------------------------- photo drop
const drop = $('[data-drop]'), input = $('[data-files]'), previews = $('[data-previews]');
function addFiles(list) {
  const imgs = [...list].filter((x) => x.type.startsWith('image/'));
  files = [...files, ...imgs].slice(0, 8);
  previews.innerHTML = files.map((file, i) => `<li><img src="${URL.createObjectURL(file)}" alt="Photo ${i + 1}" />
    <button type="button" data-rm="${i}" aria-label="Remove photo ${i + 1}">×</button></li>`).join('');
  if (!reduced) gsap.from($$('li', previews).slice(-imgs.length), { scale: 0.8, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'back.out(2)' });
  renderEstimate();
}
input.addEventListener('change', () => addFiles(input.files));
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
drop.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });
previews.addEventListener('click', (e) => {
  const b = e.target.closest('[data-rm]');
  if (!b) return;
  files.splice(+b.dataset.rm, 1);
  addFiles([]);
});
