/**
 * A small chapter indicator for long pages: sections marked data-chapter="Name" are numbered in order.
 * On phones the menu bar shows "02 · Just in" once you scroll past the opening; on wide screens a slim rail
 * of numbered marks sits on the left edge, the current one lit and labelled, and a mark jumps to its section.
 */
import { scrollToEl } from './layout.js';

export function initChapters() {
  const sections = [...document.querySelectorAll('[data-chapter]')];
  if (sections.length < 3 || !('IntersectionObserver' in window)) return;
  const pad = (n) => String(n).padStart(2, '0');
  const label = document.querySelector('[data-chapter-label]');

  // the rail (wide screens)
  const rail = document.createElement('nav');
  rail.className = 'chapters';
  rail.setAttribute('aria-label', 'Sections of this page');
  rail.innerHTML = sections.map((s, k) => `<button type="button" class="chapter" data-k="${k}" aria-label="${pad(k + 1)}, ${s.dataset.chapter}"><i aria-hidden="true"></i><span>${pad(k + 1)} <b>${s.dataset.chapter}</b></span></button>`).join('');
  document.body.appendChild(rail);
  const marks = [...rail.children];
  marks.forEach((m) => m.addEventListener('click', () => scrollToEl(sections[+m.dataset.k], -70)));

  let current = -1;
  const set = (k) => {
    if (k === current) return;
    current = k;
    marks.forEach((m, j) => m.toggleAttribute('aria-current', j === k));
    rail.classList.toggle('is-on', k > 0);
    document.querySelector('[data-nav]')?.classList.toggle('has-chapter', k > 0);
    if (label) {
      label.classList.toggle('is-on', k > 0);
      label.innerHTML = k > 0 ? `<b>${pad(k + 1)}</b><span>${sections[k].dataset.chapter}</span>` : '';
    }
  };
  // a section is "current" while it crosses the middle of the screen
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) set(sections.indexOf(e.target));
  }, { rootMargin: '-48% 0px -48% 0px' });
  sections.forEach((s) => io.observe(s));
}
