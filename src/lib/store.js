// Tiny localStorage-backed store for saved cars, compare list and recently viewed.
const KEYS = { saved: 'v8:saved', compare: 'v8:compare', recent: 'v8:recent' };
const read = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch { return []; } }; // anything but a list (an old or broken entry) counts as empty
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window or full storage: carry on without saving */ } };

export const COMPARE_MAX = 3;

function emit() { window.dispatchEvent(new CustomEvent('store:change')); }

export const store = {
  saved: () => read(KEYS.saved),
  isSaved: (id) => read(KEYS.saved).includes(id),
  toggleSaved(id) {
    const s = read(KEYS.saved);
    const on = !s.includes(id);
    write(KEYS.saved, on ? [...s, id] : s.filter((x) => x !== id));
    emit();
    return on;
  },

  compare: () => read(KEYS.compare),
  inCompare: (id) => read(KEYS.compare).includes(id),
  /** returns 'added' | 'removed' | 'full' */
  toggleCompare(id) {
    const c = read(KEYS.compare);
    if (c.includes(id)) { write(KEYS.compare, c.filter((x) => x !== id)); emit(); return 'removed'; }
    if (c.length >= COMPARE_MAX) return 'full';
    write(KEYS.compare, [...c, id]); emit(); return 'added';
  },
  setCompare(ids) { write(KEYS.compare, [...new Set(ids)].slice(0, COMPARE_MAX)); emit(); },

  recent: () => read(KEYS.recent),
  pushRecent(id) { write(KEYS.recent, [id, ...read(KEYS.recent).filter((x) => x !== id)].slice(0, 8)); },
};

// Keep tabs in sync.
window.addEventListener('storage', (e) => { if (Object.values(KEYS).includes(e.key)) emit(); });
