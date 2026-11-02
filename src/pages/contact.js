import { initLayout, $, titleIn, looksLikeSpam, validateFields, sendMessage } from '../lib/layout.js';
import { renderStatus, renderHours } from '../lib/hours.js';
import { DEALER } from '../data.js';
import { esc } from '../lib/templates.js';

initLayout();
titleIn($('[data-title]'));
renderStatus($('[data-open-status]'));
renderHours($('[data-hours]'));

$('[data-ways]').innerHTML = `
  ${DEALER.phones.map(([t, h], i) => `<a class="way" href="${h}"><span class="way-k tabular-nums">Call ${t}</span><span class="way-v">${i === 0 ? 'Monday to Saturday, during opening hours' : 'Also answers during opening hours'}</span></a>`).join('')}
  <a class="way" href="https://wa.me/${DEALER.whatsapp}" rel="noopener"><span class="way-k">WhatsApp</span><span class="way-v">Message us any time</span></a>
  <a class="way" href="mailto:${DEALER.email}"><span class="way-k">Email</span><span class="way-v">${DEALER.email}</span></a>`;

// message form: inline validation, honeypot + timing spam check
const f = $('[data-contact-form]');
const ta = f.msg;
ta.addEventListener('input', () => {
  $('[data-char]').textContent = `${ta.value.length} / 600`;
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
});
f.addEventListener('submit', (e) => {
  e.preventDefault();
  const via = e.submitter?.value || 'wa';
  const reach = f.reach.value.trim();
  const reachOk = /\S+@\S+\.\S+/.test(reach) || reach.replace(/\D/g, '').length >= 7;
  const bad = validateFields([
    [f.name, f.name.value.trim() ? '' : 'Add your name.'],
    [f.reach, !reach ? 'Add a mobile number or email so we can reply.' : reachOk ? '' : 'That doesn’t look like a phone number or email.'],
    [ta, ta.value.trim().length >= 5 ? '' : 'Write a short message.'],
  ]);
  if (bad) return;
  if (looksLikeSpam(f)) { const err = $('[data-error]', f); err.hidden = false; err.textContent = 'That was very quick. Please try again in a moment.'; return; }
  const topic = new FormData(f).get('topic');
  const text = `Hi V8 Motors, a message about ${topic.toLowerCase()}.\n\n${ta.value.trim()}\n\nName: ${f.name.value.trim()}\nReply to: ${reach}`;
  const href = sendMessage(text, via);
  const done = document.createElement('div');
  done.className = 'form-done';
  done.setAttribute('role', 'status');
  done.innerHTML = `<strong>Almost done: press send in ${via === 'email' ? 'your email app' : 'WhatsApp'}.</strong>
    <p>Thanks, ${esc(f.name.value.trim())}. Your message is written for you there; we reply in the same chat.</p>
    <a class="btn btn-line" href="${href}"${via === 'email' ? '' : ' target="_blank" rel="noopener"'}>Open it again</a>`;
  f.replaceWith(done);
});

