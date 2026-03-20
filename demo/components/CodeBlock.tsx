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
    <div className="relative group rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 p-1.5 rounded bg-zinc-700/60 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-100"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {html ? (
        <div
          className="text-sm [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 bg-zinc-900 rounded-lg text-sm text-zinc-400 overflow-x-auto">
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
    <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-sm text-zinc-300">
      {children}
    </code>
  );
}
