import { Check, Gauge } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface PlaybackSpeedSelectorProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  t: (key: TranslationKey) => string;
}

export function PlaybackSpeedSelector({
  playbackRate,
  onPlaybackRateChange,
  t,
}: PlaybackSpeedSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback(
    (rate: number) => {
      setIsOpen(false);
      onPlaybackRateChange(rate);
    },
    [onPlaybackRateChange]
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

  const formatRate = (rate: number): string => {
    return Number.isInteger(rate) ? `${rate}.0x` : `${rate}x`;
  };

  const tooltipContent = `${t('playbackSpeed')} (${formatRate(playbackRate)})`;

  return (
    <div className="drop-player-relative drop-player-responsive-hide">
      <Tooltip content={isOpen ? '' : tooltipContent}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`drop-player-button drop-player-button--speed ${playbackRate !== 1 ? 'drop-player-color-blue' : ''}`}
          aria-label={t('playbackSpeed')}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls="drop-player-speed-menu"
        >
          <Gauge size={20} />
        </button>
      </Tooltip>

      {isOpen && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop for closing dropdown */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape handled by window keydown listener */}
          <div
            className="drop-player-backdrop"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="drop-player-speed-menu"
            role="menu"
            className="drop-player-dropdown drop-player-dropdown--speed"
          >
            {SPEED_OPTIONS.map((rate) => (
              <button
                key={rate}
                type="button"
                role="menuitem"
                className="drop-player-dropdown-item"
                data-selected={rate === playbackRate}
                onClick={() => handleSelect(rate)}
              >
                <span>{formatRate(rate)}</span>
                {rate === playbackRate && (
                  <Check size={16} className="drop-player-color-green" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
