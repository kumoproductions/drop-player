import readmeRaw from '../../README.md?raw';

export interface ReadmeSegment {
  type: 'markdown' | 'interactive';
  content: string; // markdown text or component name
}

export interface NavItem {
  id: string;
  label: string;
  indent: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

/** Titles rendered by interactive components (not in README markdown) */
const INTERACTIVE_HEADINGS: Record<string, NavItem> = {
  demo: { id: 'interactive-demo', label: 'Interactive Demo', indent: false },
  playground: { id: 'playground', label: 'Playground', indent: false },
};

/**
 * Extract nav items from README h2 headings
 * plus headings from interactive components.
 */
export function extractNavItems(): NavItem[] {
  const headingRegex = /^(#{2}) (.+)$/gm;
  const interactiveRegex = /<!--\s*interactive:(\S+)\s*-->/g;

  type Entry = { index: number; item: NavItem };
  const entries: Entry[] = [];

  for (const match of readmeRaw.matchAll(headingRegex)) {
    entries.push({
      index: match.index,
      item: {
        id: slugify(match[2]),
        label: match[2].replace(/`/g, ''),
        indent: false,
      },
    });
  }

  for (const match of readmeRaw.matchAll(interactiveRegex)) {
    const heading = INTERACTIVE_HEADINGS[match[1]];
    if (heading) {
      entries.push({ index: match.index, item: heading });
    }
  }

  entries.sort((a, b) => a.index - b.index);
  return entries.map((e) => e.item);
}

/**
 * Split a markdown string at h1/h2 headings so each section
 * becomes its own segment (flat child of main).
 */
function splitByHeadings(md: string): string[] {
  const raw = md.split(/\r?\n(?=#{1,2} )/);
  return raw.map((s) => s.trim()).filter(Boolean);
}

export function parseReadme(): ReadmeSegment[] {
  const segments: ReadmeSegment[] = [];
  const regex = /<!--\s*interactive:(\S+)\s*-->/g;
  let lastIndex = 0;

  for (const match of readmeRaw.matchAll(regex)) {
    const before = readmeRaw.slice(lastIndex, match.index).trim();
    if (before) {
      for (const part of splitByHeadings(before)) {
        segments.push({ type: 'markdown', content: part });
      }
    }
    segments.push({ type: 'interactive', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  const remaining = readmeRaw.slice(lastIndex).trim();
  if (remaining) {
    for (const part of splitByHeadings(remaining)) {
      segments.push({ type: 'markdown', content: part });
    }
  }

  return segments;
}
