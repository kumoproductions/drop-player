import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki/bundle/web';

interface CodeBlockProps {
  code: string;
  lang?: string;
}

export function CodeBlock({ code, lang = 'tsx' }: CodeBlockProps) {
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    codeToHtml(code.trim(), { lang, theme: 'vitesse-dark' }).then(setHtml);
  }, [code, lang]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 rounded bg-zinc-700/60 p-1.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-100"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {html ? (
        <div
          className="text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-400">
          {code.trim()}
        </pre>
      )}
    </div>
  );
}

interface InlineCodeProps {
  children: string;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300">
      {children}
    </code>
  );
}
