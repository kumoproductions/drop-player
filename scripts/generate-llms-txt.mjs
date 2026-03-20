/**
 * Generate llms.txt from README.md (and llms-ja.txt from README_JA.md)
 *
 * Strips verbose examples, collapses tables, and removes interactive markers
 * to produce a compact LLM-friendly reference.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

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

function generateLlmsTxt(readmePath, outputPath, headerOverride) {
  if (!existsSync(readmePath)) return null;

  const readme = readFileSync(readmePath, 'utf8').replace(/\r\n/g, '\n');

  let out = readme;

  // Remove HTML comments (interactive markers etc.)
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  // Collapse all markdown tables
  out = out.replace(/((?:^\|.+\|$\n?)+)/gm, (match) => collapseTable(match));

  // Collapse multiple blank lines
  out = out.replace(/\n{3,}/g, '\n\n');

  // Prepend llms.txt header
  const header =
    headerOverride ||
    `# drop-player

> A comprehensive, universal, open-source React media player powering drop.mov.
> Video (HLS/progressive), audio, image, and PDF — media mode is inferred from the source URL.
> https://github.com/kumoproductions/drop-player

---

`;

  out = out.replace(/^# drop-player[\s\S]*?## /m, '## ');
  out = `${header}${out.trim()}\n`;

  writeFileSync(outputPath, out);
  console.log(
    `Generated ${outputPath.replace(root, '').replace(/\\/g, '/')} (${out.split('\n').length} lines, ${out.length} chars)`
  );
  return out;
}

// English
generateLlmsTxt(
  resolve(root, 'README.md'),
  resolve(root, 'demo', 'public', 'llms.txt')
);

// Japanese
generateLlmsTxt(
  resolve(root, 'README_JA.md'),
  resolve(root, 'demo', 'public', 'llms-ja.txt'),
  `# drop-player

> A comprehensive, universal, open-source React media player powering drop.mov.
> 動画（HLS/プログレッシブ）、音声、画像、PDFに対応。ソースURLからメディア種別を自動判定。
> https://github.com/kumoproductions/drop-player

---

`
);
