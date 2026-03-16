import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { SourceEntry } from '../../types';

interface SourceSelectorProps {
  sources: SourceEntry[];
  activeSourceIndex: number;
  onSourceChange: (index: number) => void;
  showControls: boolean;
}

const SOURCE_DROPDOWN_ID = 'drop-player-source-dropdown';

export function SourceSelector({
  sources,
  activeSourceIndex,
  onSourceChange,
  showControls,
}: SourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeLabel = sources[activeSourceIndex]?.label ?? '';
  const hasMultiple = sources.length > 1;

  const handleSelect = useCallback(
    (index: number) => {
      setIsOpen(false);
      if (index !== activeSourceIndex) {
        onSourceChange(index);
      }
    },
    [activeSourceIndex, onSourceChange]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (sources.length === 0) return null;

  return (
    <div
      className={`drop-player-source-selector transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {hasMultiple ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls={SOURCE_DROPDOWN_ID}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors max-w-[240px]"
          >
            <span className="truncate">{activeLabel}</span>
            <ChevronDown
              size={14}
              className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop for closing dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                }}
              />

              <div
                id={SOURCE_DROPDOWN_ID}
                className="drop-player-source-dropdown absolute top-full left-0 mt-1 z-50"
              >
                {sources.map((source, index) => (
                  <button
                    key={`${index}-${source.url}`}
                    type="button"
                    className="drop-player-dropdown-item w-full text-left"
                    data-selected={index === activeSourceIndex}
                    onClick={() => handleSelect(index)}
                  >
                    <span className="truncate">{source.label}</span>
                    {index === activeSourceIndex && (
                      <Check size={16} className="shrink-0 text-green-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="px-2 py-1 text-sm font-medium text-white/80 truncate max-w-[240px]">
          {activeLabel}
        </div>
      )}
    </div>
  );
}
