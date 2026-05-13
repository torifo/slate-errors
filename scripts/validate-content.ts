import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = 'src/content/errors';
const files = (await readdir(dir)).filter(f => f.endsWith('.mdx') && !f.startsWith('_'));

const codes = new Set<number>();
const relatedRefs: Array<{ from: number; to: number }> = [];
const popularCount: number[] = [];

for (const f of files) {
  const content = await readFile(join(dir, f), 'utf8');
  const codeM = content.match(/^code:\s*(\d+)/m);
  if (!codeM) { console.error(`No code in ${f}`); continue; }
  const code = Number(codeM[1]);

  if (codes.has(code)) console.error(`Duplicate code: ${code} in ${f}`);
  codes.add(code);

  const popularM = content.match(/^popular:\s*true/m);
  if (popularM) popularCount.push(code);

  const relatedM = content.match(/^related:\s*\[([^\]]*)\]/m);
  if (relatedM) {
    const nums = relatedM[1].split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    nums.forEach(n => relatedRefs.push({ from: code, to: n }));
  }
}

console.log(`Total errors: ${codes.size}`);
console.log(`Popular: ${popularCount.sort().join(', ')} (${popularCount.length} entries)`);

const orphans = relatedRefs.filter(r => !codes.has(r.to));
if (orphans.length > 0) {
  console.error(`Orphan related references:`);
  orphans.forEach(o => console.error(`  ${o.from} → ${o.to} (not found)`));
} else {
  console.log('All related references valid ✓');
}
