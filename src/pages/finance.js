import gsap from 'gsap';
import { initLayout, reduced, $, $$, titleIn } from '../lib/layout.js';
import { CARS, DEALER, byId, rs, monthly, thumb, carName } from '../data.js';

initLayout();
titleIn($('[data-title]'));

const inputs = Object.fromEntries($$('[data-fin]').map((i) => [i.dataset.fin, i]));
const out = (k) => $(`[data-out="${k}"]`);
const TERMS = [12, 24, 36, 48, 60, 72, 84];
let term = 60;
const termsEl = $('[data-terms]');
termsEl.innerHTML = TERMS.map((t) => `<button type="button" class="term" data-term="${t}" aria-pressed="${t === term}">${t / 12} yr</button>`).join('');
termsEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-term]');
  if (!b) return;
  term = +b.dataset.term;
  $$('[data-term]', termsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  update();
});

const select = $('[data-fin-car]');
const carCard = $('[data-fin-car-card]');
select.insertAdjacentHTML('beforeend', [...CARS].sort((a, b) => a.price - b.price).map((c) => `<option value="${c.id}">${carName(c)}, ${rs(c.price)}</option>`).join(''));
function showCar(c) {
  carCard.hidden = !c;
  if (!c) return;
  carCard.href = `cars/${c.id}.html`;
  carCard.innerHTML = `<img src="${thumb(c)}" width="96" height="63" alt="" /><span><strong>${carName(c)}</strong><span>${c.trim}</span></span>`;
  if (!reduced) gsap.from(carCard, { opacity: 0, y: 12, duration: 0.6, ease: 'expo.out' });
}
select.addEventListener('change', () => {
  const c = byId(select.value);
  if (c) inputs.price.value = c.price;
  showCar(c);
  update();
});

// preset from ?price= or ?id=
const qp = new URLSearchParams(location.search);
if (qp.get('id') && byId(qp.get('id'))) { select.value = qp.get('id'); inputs.price.value = byId(qp.get('id')).price; showCar(byId(qp.get('id'))); }
else if (qp.get('price')) {
  inputs.price.value = qp.get('price');
  const match = CARS.find((c) => c.price === +qp.get('price'));
  if (match) { select.value = match.id; showCar(match); }
}

const shown = { v: 0 };
const C = 100; // donut circumference (r = 15.915)
function setDonut(seg, start, len) {
  const el = $(`[data-donut="${seg}"]`);
  el.style.strokeDasharray = `${Math.max(0, len - 0.6)} ${C - Math.max(0, len - 0.6)}`;
  el.style.strokeDashoffset = String(25 - start);
}

function update() {
  const price = +inputs.price.value, dep = +inputs.deposit.value, rate = +inputs.rate.value;
  for (const k in inputs) {
    const i = inputs[k];
    i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min)) * 100 + '%');
  }
  out('price').textContent = rs(price);
  out('deposit').textContent = `${dep}%, ${rs((price * dep) / 100)}`;
  out('rate').textContent = `${rate.toFixed(1)}% a year`;
  const m = monthly(price, dep, term, rate);
  const loan = price * (1 - dep / 100);
  const interest = m * term - loan;
  $('[data-term-label]').textContent = `${term} months`;
  $('[data-loan]').textContent = rs(loan);
  $('[data-dep]').textContent = rs(price - loan);
  $('[data-interest]').textContent = rs(interest);
  $('[data-total]').textContent = rs(m * term + (price - loan));
  gsap.to(shown, { v: m, duration: reduced ? 0 : 0.6, ease: 'expo.out', onUpdate: () => ($('[data-monthly]').textContent = rs(shown.v)) });

  const total = price + interest;
  const a = ((price - loan) / total) * C, b = (loan / total) * C, c = (interest / total) * C;
  setDonut('dep', 0, a); setDonut('loan', a, b); setDonut('int', a + b, c);

  const car = byId(select.value);
  const text = `Hi V8 Motors, I'd like to ask about leasing${car ? ` on the ${carName(car)}` : ''}: ${rs(price)} with ${dep}% down over ${term} months (about ${rs(m)} a month).`;
  $('[data-fin-wa]').href = `https://wa.me/${DEALER.whatsapp}?text=${encodeURIComponent(text)}`;
  drawChart(loan, rate, term, m);
}
Object.values(inputs).forEach((i) => i.addEventListener('input', () => { if (i === inputs.price) { select.value = ''; showCar(null); } update(); }));

// ---------------------------------------------------------------- balance chart
const chart = $('[data-chart]');
let chartDrawn = false;
function drawChart(loan, rate, months, pay) {
  const r = rate / 100 / 12;
  const years = months / 12;
  const rows = [];
  let bal = loan, paidInt = 0, paidPrin = 0;
  for (let y = 1; y <= years; y++) {
    for (let k = 0; k < 12; k++) {
      const int = bal * r;
      paidInt += int; paidPrin += pay - int; bal = Math.max(0, bal - (pay - int));
    }
    rows.push({ y, bal, paidInt, paidPrin });
  }
  const max = loan;
  chart.innerHTML = `
    <div class="bars" style="--n:${rows.length}">
      ${rows.map((row) => `<div class="bar" tabindex="0" aria-label="End of year ${row.y}: ${rs(row.bal)} left to pay">
        <div class="bar-col">
          <span class="bar-paid" style="--h:${row.paidPrin / max}"></span>
          <span class="bar-left" style="--h:${row.bal / max}"></span>
        </div>
        <span class="bar-y">Year ${row.y}</span>
        <div class="bar-tip ${row.y <= rows.length / 2 ? 'is-start' : 'is-end'}" role="tooltip"><strong>End of year ${row.y}</strong>
          <span>Left to pay <b class="tabular-nums">${rs(row.bal)}</b></span>
          <span>Paid off <b class="tabular-nums">${rs(row.paidPrin)}</b></span>
          <span>Interest so far <b class="tabular-nums">${rs(row.paidInt)}</b></span></div>
      </div>`).join('')}
    </div>
    <ul class="chart-key"><li><i class="k-left"></i>Still owed</li><li><i class="k-paid"></i>Paid off</li></ul>`;
  if (!reduced && !chartDrawn) gsap.from($$('.bar-left', chart), { scaleY: 0, transformOrigin: 'bottom', duration: 0.9, ease: 'expo.out', stagger: 0.04 });
  chartDrawn = true;
}

// ---------------------------------------------------------------- FAQ with animated open/close
$$('[data-faq] details').forEach((d) => {
  const s = $('summary', d), body = $('div', d);
  s.addEventListener('click', (e) => {
    if (reduced) return;
    e.preventDefault();
    if (d.open) {
      gsap.to(body, { height: 0, opacity: 0, duration: 0.4, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'all' }); } });
    } else {
      d.open = true;
      gsap.from(body, { height: 0, opacity: 0, duration: 0.6, ease: 'expo.out', clearProps: 'all' });
    }
  });
});

update();
