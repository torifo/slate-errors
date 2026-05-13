export const url = (path: string): string => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean === '' ? `${base}/` : `${base}/${clean}`;
};
