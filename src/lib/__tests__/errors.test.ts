import { describe, it, expect, vi } from 'vitest';

const mockEntries = [
  { id: '404', body: '', collection: 'errors', data: {
    code: 404, name: 'Not Found', nameJa: 'ページが見つかりません',
    category: 'client', summary: '...', synonyms: [], related: [410],
    commonCauses: [], references: [], popular: true, draft: false,
  }},
  { id: '500', body: '', collection: 'errors', data: {
    code: 500, name: 'Internal Server Error', nameJa: 'サーバー内部エラー',
    category: 'server', summary: '...', synonyms: [], related: [],
    commonCauses: [], references: [], popular: true, draft: false,
  }},
  { id: '403', body: '', collection: 'errors', data: {
    code: 403, name: 'Forbidden', nameJa: '禁止されています',
    category: 'client', summary: '...', synonyms: [], related: [],
    commonCauses: [], references: [], popular: false, draft: false,
  }},
  { id: '_TEMPLATE', body: '', collection: 'errors', data: {
    code: 0, name: '', nameJa: '', category: 'client', summary: '',
    synonyms: [], related: [], commonCauses: [], references: [],
    popular: false, draft: true,
  }},
];

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (_name: string, filter?: (e: any) => boolean) => {
    if (!filter) return mockEntries;
    return mockEntries.filter(filter);
  }),
}));

import {
  getAllErrors, getErrorByCode, getPopularErrors,
  getPrevNext, getRelated, groupByCategory,
} from '../errors';

describe('getAllErrors', () => {
  it('excludes drafts and template files', async () => {
    const errors = await getAllErrors();
    expect(errors.map(e => e.data.code).sort()).toEqual([403, 404, 500]);
  });

  it('returns sorted by code ascending', async () => {
    const errors = await getAllErrors();
    expect(errors.map(e => e.data.code)).toEqual([403, 404, 500]);
  });
});

describe('getErrorByCode', () => {
  it('returns the matching error', async () => {
    const e = await getErrorByCode(404);
    expect(e?.data.name).toBe('Not Found');
  });

  it('returns undefined for unknown code', async () => {
    const e = await getErrorByCode(999);
    expect(e).toBeUndefined();
  });
});

describe('getPopularErrors', () => {
  it('returns only popular: true entries', async () => {
    const popular = await getPopularErrors();
    expect(popular.map(e => e.data.code).sort()).toEqual([404, 500]);
  });
});

describe('getPrevNext', () => {
  it('returns previous and next by code order', async () => {
    const { prev, next } = await getPrevNext(404);
    expect(prev?.data.code).toBe(403);
    expect(next?.data.code).toBe(500);
  });

  it('returns undefined for first entry prev', async () => {
    const { prev } = await getPrevNext(403);
    expect(prev).toBeUndefined();
  });

  it('returns undefined for last entry next', async () => {
    const { next } = await getPrevNext(500);
    expect(next).toBeUndefined();
  });
});

describe('getRelated', () => {
  it('returns entries matching given codes', async () => {
    const r1 = await getRelated([410]);
    expect(r1).toEqual([]);

    const r2 = await getRelated([404, 500]);
    expect(r2.map(e => e.data.code).sort()).toEqual([404, 500]);
  });

  it('preserves order of input codes', async () => {
    const r = await getRelated([500, 404]);
    expect(r.map(e => e.data.code)).toEqual([500, 404]);
  });
});

describe('groupByCategory', () => {
  it('splits entries by client/server', async () => {
    const all = await getAllErrors();
    const { client, server } = groupByCategory(all);
    expect(client.map(e => e.data.code)).toEqual([403, 404]);
    expect(server.map(e => e.data.code)).toEqual([500]);
  });
});
