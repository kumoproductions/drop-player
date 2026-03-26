/**
 * Pre-render demo HTML for SEO / curl accessibility.
 *
 * Runs after `vite build` and injects static HTML into the built
 * index.html files so that crawlers and curl see real content
 * instead of an empty `<div id="root"></div>`.
 *
 * React will hydrate (replace) this content on the client side.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers (mirrors demo/utils/readmeParser.ts logic)
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .trim();
}

const INTERACTIVE_HEADINGS = {
  demo: { id: 'interactive-demo', label: 'Interactive Demo' },
  playground: { id: 'playground', label: 'Playground' },
};

function extractNavItems(readme) {
  const headingRegex = /^(#{2}) (.+)$/gm;
  const interactiveRegex = /<!--\s*interactive:(\S+)\s*-->/g;
  const entries = [];

  for (const match of readme.matchAll(headingRegex)) {
    entries.push({
      index: match.index,
      item: { id: slugify(match[2]), label: match[2].replace(/`/g, '') },
    });
  }

  for (const match of readme.matchAll(interactiveRegex)) {
    const heading = INTERACTIVE_HEADINGS[match[1]];
    if (heading) entries.push({ index: match.index, item: heading });
  }

  entries.sort((a, b) => a.index - b.index);
  return entries.map((e) => e.item);
}

// ---------------------------------------------------------------------------
// Markdown → HTML
// ---------------------------------------------------------------------------

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeStringify, { allowDangerousHtml: true });

async function markdownToHtml(md) {
  // Strip interactive markers — those are client-only components
  const cleaned = md.replace(/<!--\s*interactive:\S+\s*-->/g, '');
  const result = await processor.process(cleaned);
  return String(result);
}

// ---------------------------------------------------------------------------
// Build static HTML shell
// ---------------------------------------------------------------------------

function buildNav(navItems) {
  const links = navItems
    .map((item) => `<a href="#${item.id}">${item.label}</a>`)
    .join('\n        ');
  return `<nav aria-label="Table of contents">\n        ${links}\n      </nav>`;
}

function buildStaticHtml(contentHtml, navHtml, version, locale) {
  const otherLocale = locale === 'en' ? 'ja' : 'en';
  const otherLabel = locale === 'en' ? '日本語' : 'English';
  const otherPath = locale === 'en' ? '/ja' : '/';

  return `<div id="prerendered">
    <div role="banner">
      <strong>drop-player</strong> <span>v${version}</span>
      <a href="${otherPath}">${otherLabel}</a>
    </div>
    <div style="display:flex">
      <aside aria-label="Sidebar">
        ${navHtml}
        <div>
          <a href="https://github.com/kumoproductions/drop-player">GitHub</a>
          <a href="https://www.npmjs.com/package/drop-player">npm</a>
          <a href="https://drop.mov">drop.mov</a>
        </div>
      </aside>
      <main>
        ${contentHtml}
      </main>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Inject into built HTML
// ---------------------------------------------------------------------------

function injectIntoHtml(htmlPath, staticContent) {
  const html = readFileSync(htmlPath, 'utf8');
  const injected = html.replace(
    '<div id="root"></div>',
    `<div id="root">${staticContent}</div>`
  );
  writeFileSync(htmlPath, injected);
  const relPath = htmlPath.replace(root, '').replace(/\\/g, '/');
  console.log(`Prerendered ${relPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

  const configs = [
    {
      locale: 'en',
      readmePath: resolve(root, 'README.md'),
      htmlPath: resolve(root, 'demo', 'dist', 'index.html'),
    },
    {
      locale: 'ja',
      readmePath: resolve(root, 'README_JA.md'),
      htmlPath: resolve(root, 'demo', 'dist', 'ja', 'index.html'),
    },
  ];

  for (const { locale, readmePath, htmlPath } of configs) {
    const readme = readFileSync(readmePath, 'utf8');
    const navItems = extractNavItems(readme);
    const navHtml = buildNav(navItems);
    const contentHtml = await markdownToHtml(readme);
    const staticHtml = buildStaticHtml(
      contentHtml,
      navHtml,
      pkg.version,
      locale
    );
    injectIntoHtml(htmlPath, staticHtml);
  }
}

main().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
