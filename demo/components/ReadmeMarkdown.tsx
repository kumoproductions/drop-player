import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .trim();
}

function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return getTextContent(
      (children as { props: { children?: React.ReactNode } }).props.children
    );
  }
  return '';
}

const components: Components = {
  h1: ({ children }) => {
    const text = getTextContent(children);
    const id = slugify(text);
    return (
      <h1
        id={id}
        className="text-3xl font-bold text-zinc-100 mb-10 scroll-mt-6"
      >
        {children}
      </h1>
    );
  },
  h2: ({ children }) => {
    const text = getTextContent(children);
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="text-2xl font-bold text-zinc-100 mb-6 pb-2 border-b border-zinc-800 scroll-mt-6"
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const text = getTextContent(children);
    const id = slugify(text);
    return (
      <h3
        id={id}
        className="text-lg font-semibold text-zinc-200 mb-4 scroll-mt-6"
      >
        {children}
      </h3>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => (
    <tbody className="divide-y divide-zinc-800/50">{children}</tbody>
  ),
  tr: ({ children, node }) => {
    const isHeader = node?.children?.some(
      (child) => child.type === 'element' && child.tagName === 'th'
    );
    return (
      <tr
        className={
          isHeader ? 'border-b border-zinc-800 text-left text-zinc-400' : ''
        }
      >
        {children}
      </tr>
    );
  },
  th: ({ children }) => <th className="py-2 pr-4 font-medium">{children}</th>,
  td: ({ children }) => {
    const text = getTextContent(children);
    const isCode = text.startsWith('`') && text.endsWith('`');

    if (isCode) {
      return (
        <td className="py-2 pr-4 font-mono text-blue-400 whitespace-nowrap text-xs">
          {children}
        </td>
      );
    }

    return <td className="py-2 pr-4 text-zinc-300">{children}</td>;
  },
  code: ({ children, className }) => {
    const match = className?.match(/language-(\w+)/);
    if (match) {
      return <CodeBlock code={String(children).trimEnd()} lang={match[1]} />;
    }
    return (
      <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-sm text-zinc-300">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  p: ({ children }) => (
    <p className="text-zinc-300 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-zinc-100">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

interface ReadmeMarkdownProps {
  content: string;
}

export function ReadmeMarkdown({ content }: ReadmeMarkdownProps) {
  return (
    <div className="space-y-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
