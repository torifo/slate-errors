import { getCollection, type CollectionEntry } from 'astro:content';

export type ErrorEntry = CollectionEntry<'errors'>;

const isPublishable = (e: ErrorEntry) =>
  !e.data.draft && !e.id.startsWith('_');

export async function getAllErrors(): Promise<ErrorEntry[]> {
  const entries = await getCollection('errors', isPublishable);
  return entries.sort((a, b) => a.data.code - b.data.code);
}

export async function getErrorByCode(code: number): Promise<ErrorEntry | undefined> {
  const all = await getAllErrors();
  return all.find(e => e.data.code === code);
}

export async function getPopularErrors(): Promise<ErrorEntry[]> {
  const all = await getAllErrors();
  return all.filter(e => e.data.popular);
}

export async function getPrevNext(
  code: number,
): Promise<{ prev?: ErrorEntry; next?: ErrorEntry }> {
  const all = await getAllErrors();
  const idx = all.findIndex(e => e.data.code === code);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? all[idx - 1] : undefined,
    next: idx < all.length - 1 ? all[idx + 1] : undefined,
  };
}

export async function getRelated(codes: number[]): Promise<ErrorEntry[]> {
  const all = await getAllErrors();
  const byCode = new Map(all.map(e => [e.data.code, e]));
  return codes
    .map(c => byCode.get(c))
    .filter((e): e is ErrorEntry => e !== undefined);
}

export function groupByCategory(entries: ErrorEntry[]): {
  client: ErrorEntry[];
  server: ErrorEntry[];
} {
  return {
    client: entries.filter(e => e.data.category === 'client'),
    server: entries.filter(e => e.data.category === 'server'),
  };
}

export function groupByAllCategories(entries: ErrorEntry[]): {
  informational: ErrorEntry[];
  success: ErrorEntry[];
  redirection: ErrorEntry[];
  client: ErrorEntry[];
  server: ErrorEntry[];
} {
  return {
    informational: entries.filter(e => e.data.category === 'informational'),
    success: entries.filter(e => e.data.category === 'success'),
    redirection: entries.filter(e => e.data.category === 'redirection'),
    client: entries.filter(e => e.data.category === 'client'),
    server: entries.filter(e => e.data.category === 'server'),
  };
}
