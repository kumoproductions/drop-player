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
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div>
          <h4 className="font-medium text-zinc-100">{title}</h4>
          {description && (
            <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
        >
          {showCode ? <Eye size={14} /> : <Code size={14} />}
          {showCode ? 'Preview' : 'Code'}
        </button>
      </div>
      <div className="bg-zinc-900/50 p-4">
        {showCode ? <CodeBlock code={code} /> : children}
      </div>
    </div>
  );
}
