import type { APIRoute } from 'astro';
import { getAllErrors } from '@/lib/errors';
import { buildSearchIndex } from '@/lib/search';

export const GET: APIRoute = async () => {
  const errors = await getAllErrors();
  const index = buildSearchIndex(errors);
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
