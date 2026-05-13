import Fuse from 'fuse.js';
import type { SearchIndexEntry } from '@/lib/search';

const BASE = (() => {
  // <link rel="canonical"> から取得 → 失敗したら現在のパス先頭
  const m = location.pathname.match(/^(\/[^/]+)\//);
  return m ? m[1] : '';
})();

const indexUrl = `${BASE}/search-index.json`;

let fuse: Fuse<SearchIndexEntry> | null = null;
let loadPromise: Promise<void> | null = null;

const ensureIndex = async () => {
  if (fuse) return;
  if (!loadPromise) {
    loadPromise = fetch(indexUrl)
      .then(r => r.json() as Promise<SearchIndexEntry[]>)
      .then(data => {
        fuse = new Fuse(data, {
          keys: [
            { name: 'code', weight: 0.3, getFn: (e) => String(e.code) },
            { name: 'name', weight: 0.15 },
            { name: 'nameJa', weight: 0.4 },
            { name: 'synonyms', weight: 0.1 },
            { name: 'summary', weight: 0.05 },
          ],
          threshold: 0.4,
          ignoreLocation: true,
          minMatchCharLength: 1,
        });
      });
  }
  await loadPromise;
};

const renderResults = (results: SearchIndexEntry[], ul: HTMLElement) => {
  if (results.length === 0) {
    ul.innerHTML = '<li class="p-3 text-sm text-[var(--color-chalk-dust)]">該当なし</li>';
    return;
  }
  ul.innerHTML = results.slice(0, 10).map((e, i) => `
    <li>
      <a href="${e.url}" class="block p-3 hover:bg-white/5 !no-underline" data-result-index="${i}">
        <span class="chalk-text-amber font-[Finger_Paint] text-lg mr-3">${e.code}</span>
        <span class="text-[var(--color-chalk-white)]">${e.nameJa}</span>
        <span class="text-sm text-[var(--color-chalk-dust)] block ml-12">${e.name} — ${e.summary}</span>
      </a>
    </li>
  `).join('');
};

const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms: number) => {
  let t: number | undefined;
  return (...args: T) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
};

const initInput = (input: HTMLInputElement) => {
  const wrapper = input.closest('[data-search-dialog], div')!;
  const ul = wrapper.querySelector<HTMLElement>('[data-search-results]');
  if (!ul) return;

  const handleInput = debounce(async () => {
    const q = input.value.trim();
    if (!q) {
      ul.innerHTML = '';
      ul.classList.add('hidden');
      return;
    }
    await ensureIndex();
    const results = fuse!.search(q).map(r => r.item);
    renderResults(results, ul);
    ul.classList.remove('hidden');
  }, 100);

  input.addEventListener('input', handleInput);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      ul.innerHTML = '';
      ul.classList.add('hidden');
      const dlg = input.closest('dialog');
      if (dlg && 'close' in dlg) (dlg as HTMLDialogElement).close();
    }
    if (e.key === 'Enter') {
      const first = ul.querySelector<HTMLAnchorElement>('a');
      if (first) first.click();
    }
  });
};

const initDialogTriggers = () => {
  document.querySelectorAll<HTMLElement>('[data-search-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dlg = document.querySelector<HTMLDialogElement>('[data-search-dialog]');
      if (dlg && 'showModal' in dlg) {
        dlg.showModal();
        dlg.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
      }
    });
  });
};

document.querySelectorAll<HTMLInputElement>('[data-search-input]').forEach(initInput);
initDialogTriggers();
