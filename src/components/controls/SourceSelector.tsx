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
      className={`drop-player-source-selector ${
        showControls ? 'drop-player-visible' : 'drop-player-hidden'
      }`}
    >
      {hasMultiple ? (
        <div className="drop-player-relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-controls={SOURCE_DROPDOWN_ID}
            className="drop-player-source-button"
          >
            <span className="drop-player-truncate">{activeLabel}</span>
            <ChevronDown
              size={14}
              className={`drop-player-chevron ${isOpen ? 'drop-player-chevron--open' : ''}`}
            />
          </button>

          {isOpen && (
            <>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop for closing dropdown */}
              <div
                className="drop-player-backdrop"
                onClick={() => setIsOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                }}
              />

              <div
                id={SOURCE_DROPDOWN_ID}
                role="menu"
                className="drop-player-dropdown drop-player-dropdown--source"
              >
                {sources.map((source, index) => (
                  <button
                    key={source.url}
                    type="button"
                    role="menuitem"
                    className="drop-player-dropdown-item"
                    data-selected={index === activeSourceIndex}
                    onClick={() => handleSelect(index)}
                  >
                    <span className="drop-player-truncate">{source.label}</span>
                    {index === activeSourceIndex && (
                      <Check
                        size={16}
                        className="drop-player-shrink-0 drop-player-color-green"
                      />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="drop-player-source-label">{activeLabel}</div>
      )}
    </div>
  );
}
