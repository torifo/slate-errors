import type { ErrorEntry } from './errors';
import { url } from './url';

export type SearchIndexEntry = {
  code: number;
  name: string;
  nameJa: string;
  summary: string;
  synonyms: string[];
  category: 'informational' | 'success' | 'redirection' | 'client' | 'server';
  url: string;
};

export const buildSearchIndex = (errors: ErrorEntry[]): SearchIndexEntry[] =>
  errors.map(e => ({
    code: e.data.code,
    name: e.data.name,
    nameJa: e.data.nameJa,
    summary: e.data.summary,
    synonyms: e.data.synonyms,
    category: e.data.category,
    url: url(`errors/${e.data.code}/`),
  }));
