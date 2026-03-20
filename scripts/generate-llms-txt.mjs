/**
 * Generate llms.txt from README.md
 *
 * Strips verbose examples, collapses tables, and removes interactive markers
 * to produce a compact LLM-friendly reference.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8').replace(
  /\r\n/g,
  '\n'
);

/** Collapse a markdown table to "key: description" lines. */
function collapseTable(block) {
  const rows = block
    .trim()
    .split('\n')
    .filter((l) => l.startsWith('|'))
    .map((r) =>
      r
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
    );
  // need header + separator + at least 1 data row
  if (rows.length < 3) return block;
  const isSeparator = (row) => row.every((c) => /^[-:]+$/.test(c));
  const sepIdx = rows.findIndex(isSeparator);
  if (sepIdx < 0) return block;
  const data = rows.slice(sepIdx + 1);
  return data
    .map((cols) => {
      const key = cols[0]?.replace(/`/g, '');
      const desc = cols[cols.length - 1]?.replace(/`/g, '');
      if (key === desc || cols.length === 1) return `- ${key}`;
      return `- ${key}: ${desc}`;
    })
    .join('\n');
}

let out = readme;

// Remove HTML comments (interactive markers etc.)
out = out.replace(/<!--[\s\S]*?-->/g, '');

// Collapse all markdown tables
out = out.replace(/((?:^\|.+\|$\n?)+)/gm, (match) => collapseTable(match));

// Collapse multiple blank lines
out = out.replace(/\n{3,}/g, '\n\n');

// Prepend llms.txt header
const header = `# drop-player

> React media player for video (HLS/progressive), audio, image, and PDF.
> One unified component — media mode is inferred from the source URL.
> https://github.com/kumoproductions/drop-player

---

`;

out = out.replace(/^# drop-player[\s\S]*?## Install/m, '## Install');
out = `${header}${out.trim()}\n`;

writeFileSync(resolve(root, 'demo', 'public', 'llms.txt'), out);
console.log(
  `Generated demo/public/llms.txt (${out.split('\n').length} lines, ${out.length} chars)`
);
