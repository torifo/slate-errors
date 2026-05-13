import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('BASE_URL', '/slate-errors/');

const { url } = await import('../url');

describe('url()', () => {
  it('combines base with path', () => {
    expect(url('errors/404/')).toBe('/slate-errors/errors/404/');
  });

  it('handles leading slash in path', () => {
    expect(url('/errors/404/')).toBe('/slate-errors/errors/404/');
  });

  it('handles trailing slash on base', () => {
    expect(url('search-index.json')).toBe('/slate-errors/search-index.json');
  });

  it('handles empty path', () => {
    expect(url('')).toBe('/slate-errors/');
  });
});
