import { Ellipsis, X } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface OverflowMenuProps {
  t: (key: TranslationKey) => string;
  children: ReactNode;
}

export function OverflowMenu({ t, children }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const label = t('more');

  return (
    <>
      {isOpen && (
        <div className="drop-player-overflow-panel">
          {children}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="drop-player-button drop-player-shrink-0"
            aria-label={label}
          >
            <X size={20} />
          </button>
        </div>
      )}
      {/* Always in flow to prevent layout shift */}
      <Tooltip content={isOpen ? '' : label}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="drop-player-button drop-player-shrink-0"
          aria-label={label}
          aria-expanded={isOpen}
        >
          <Ellipsis size={24} />
        </button>
      </Tooltip>
    </>
  );
}
