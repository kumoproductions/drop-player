import { Code, Eye } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { CodeBlock } from './CodeBlock';

interface DemoCardProps {
  title: string;
  description?: string;
  code: string;
  children: ReactNode;
}

export function DemoCard({
  title,
  description,
  code,
  children,
}: DemoCardProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h4 className="font-medium text-zinc-100">{title}</h4>
          {description && (
            <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showCode ? <Eye size={14} /> : <Code size={14} />}
          {showCode ? 'Preview' : 'Code'}
        </button>
      </div>
      <div className="p-4 bg-zinc-900/50">
        {showCode ? <CodeBlock code={code} /> : children}
      </div>
    </div>
  );
}
